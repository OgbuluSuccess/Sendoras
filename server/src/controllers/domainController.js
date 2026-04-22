const AWS = require("aws-sdk");
const { Resend } = require("resend");
const Domain = require("../models/Domain");
const dns = require("dns").promises;

// ── Provider helpers ──────────────────────────────────────────────────────
const getSES = () =>
  new AWS.SES({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-1",
  });

let resendClient = null;
const getResend = () => {
  if (
    !resendClient &&
    process.env.RESEND_API_KEY &&
    !process.env.RESEND_API_KEY.includes("your_resend")
  ) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const activeProviders = () =>
  (process.env.EMAIL_PROVIDER || "ses")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim());

// ── Add domain ─────────────────────────────────────────────────────────────
// @route POST /api/domains   @access Private
exports.addDomain = async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ msg: "Domain name is required" });

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  if (!domainRegex.test(domain)) {
    return res
      .status(400)
      .json({ msg: "Invalid domain format. Example: acme.com" });
  }

  try {
    const existing = await Domain.findOne({
      user: req.user.id,
      domain: domain.toLowerCase(),
    });
    if (existing)
      return res
        .status(400)
        .json({ msg: "You have already added this domain." });

    const providers = activeProviders();
    let verificationToken = null;
    let dkimTokens = [];
    let sesStatus = "pending";
    let resendDomainId = null;
    let resendRecords = null;
    let resendStatus = "not_added";
    const errors = {};

    // ── Step 1: AWS SES ────────────────────────────────────────────────
    if (providers.includes("ses")) {
      try {
        const ses = getSES();
        const [verifyRes, dkimRes] = await Promise.all([
          ses.verifyDomainIdentity({ Domain: domain }).promise(),
          ses.verifyDomainDkim({ Domain: domain }).promise(),
        ]);
        verificationToken = verifyRes.VerificationToken;
        dkimTokens = dkimRes.DkimTokens;
        sesStatus = "pending";
      } catch (err) {
        console.error("SES addDomain error:", err.message);
        sesStatus = "failed";
        errors.ses = err.message;
      }
    }

    // ── Step 2: Resend ──────────────────────────────────────────────────
    if (providers.includes("resend")) {
      const resend = getResend();
      if (resend) {
        try {
          const { data, error } = await resend.domains.create({ name: domain });
          if (error) throw new Error(error.message);
          resendDomainId = data.id;
          resendRecords = data.records;
          resendStatus = "pending";
        } catch (err) {
          console.error("Resend addDomain error:", err.message);
          resendStatus = "failed";
          errors.resend = err.message;
        }
      }
    }

    // Save to DB
    const newDomain = await Domain.create({
      user: req.user.id,
      domain: domain.toLowerCase(),
      status: "pending",
      verificationToken,
      dkimTokens,
      sesStatus,
      resendDomainId,
      resendRecords,
      resendStatus,
    });

    res.status(201).json({ ...newDomain.toObject(), errors });
  } catch (err) {
    console.error("addDomain error:", err.message);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

// ── Get all domains ──────────────────────────────────────────────────────
// @route GET /api/domains   @access Private
exports.getDomains = async (req, res) => {
  try {
    const domains = await Domain.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(domains);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

// ── Check verification status ─────────────────────────────────────────────
// @route POST /api/domains/:id/check   @access Private
exports.checkVerification = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) return res.status(404).json({ msg: "Domain not found" });
    if (domain.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    const providers = activeProviders();
    let sesStatus = domain.sesStatus;
    let resendStatus = domain.resendStatus;

    // ── Check SES (skip if already verified) ──────────────────────────
    if (
      providers.includes("ses") &&
      domain.verificationToken &&
      sesStatus !== "verified"
    ) {
      try {
        const ses = getSES();
        const [identityResult, dkimResult] = await Promise.all([
          ses
            .getIdentityVerificationAttributes({ Identities: [domain.domain] })
            .promise(),
          ses
            .getIdentityDkimAttributes({ Identities: [domain.domain] })
            .promise(),
        ]);
        const attr = identityResult.VerificationAttributes[domain.domain];
        const dkimAttr = dkimResult.DkimAttributes[domain.domain];
        const rawStatus = attr?.VerificationStatus;
        const dkimEnabled = dkimAttr?.DkimEnabled;

        if (rawStatus === "Success" && dkimEnabled) sesStatus = "verified";
        else if (rawStatus === "Failed") sesStatus = "failed";
        else sesStatus = "pending";
      } catch (err) {
        console.error("SES check error:", err.message);
        sesStatus = "failed";
      }
    }

    // ── Check Resend (skip if already verified) ──────────────────────────
    if (providers.includes("resend") && resendStatus !== "verified") {
      const resend = getResend();
      if (resend) {
        // If it doesn't have a Resend ID yet, create it now (useful for legacy domains)
        if (!domain.resendDomainId) {
          try {
            const { data, error } = await resend.domains.create({
              name: domain.domain,
            });
            if (!error && data) {
              domain.resendDomainId = data.id;
              domain.resendRecords = data.records;
              resendStatus = "pending";
            }
          } catch (err) {
            console.error("Resend auto-create error:", err.message);
          }
        } else {
          // Has an ID, fetch latest status first
          try {
            let { data, error } = await resend.domains.get(
              domain.resendDomainId,
            );

            // If it's not verified, aggressively trigger a verification sweep and wait 3s
            if (!error && data && data.status !== "verified") {
              await resend.domains.verify(domain.resendDomainId);
              await new Promise((resolve) => setTimeout(resolve, 3000));
              const refresh = await resend.domains.get(domain.resendDomainId);
              if (!refresh.error && refresh.data) {
                data = refresh.data;
              }
            }

            if (!error && data) {
              resendStatus =
                data.status === "verified"
                  ? "verified"
                  : data.status === "failed"
                    ? "failed"
                    : "pending";
              // Refresh records in case they changed
              domain.resendRecords = data.records;
            }
          } catch (err) {
            console.error("Resend check error:", err.message);
          }
        }
      }
    }

    // ── Check DMARC Policy (skip if already verified) ─────────────────────
    let dmarcStatus = domain.dmarcStatus || "pending";
    if (dmarcStatus !== "verified") {
      try {
        const records = await dns.resolveTxt(`_dmarc.${domain.domain}`);
        const hasDmarc = records.some((r) => r.join("").includes("v=DMARC1"));
        dmarcStatus = hasDmarc ? "verified" : "pending";
      } catch (err) {
        dmarcStatus = "pending";
      }
    }

    // ── Check SPF (skip if already verified) ────────────────────────────
    let spfStatus = domain.spfStatus || "pending";
    if (spfStatus !== "verified") {
      try {
        const spfRecords = await dns.resolveTxt(domain.domain);
        const flat = spfRecords.map((r) => r.join(""));
        const hasSpf = flat.some(
          (r) => r.startsWith("v=spf1") && r.includes("include:amazonses.com"),
        );
        spfStatus = hasSpf ? "verified" : "pending";
      } catch (err) {
        spfStatus = "pending";
      }
    }

    // Overall status: verified if at least one provider verified AND DMARC is verified
    const isProviderVerified =
      sesStatus === "verified" || resendStatus === "verified";
    const isFailed =
      sesStatus === "failed" &&
      (resendStatus === "failed" || resendStatus === "not_added");

    domain.sesStatus = sesStatus;
    domain.resendStatus = resendStatus;
    domain.dmarcStatus = dmarcStatus;
    domain.spfStatus = spfStatus;
    domain.status =
      isProviderVerified && dmarcStatus === "verified"
        ? "verified"
        : isFailed
          ? "failed"
          : "pending";
    await domain.save();

    res.json(domain);
  } catch (err) {
    console.error("checkVerification error:", err.message);
    res.status(500).json({ msg: "Check failed: " + err.message });
  }
};

// ── Delete domain ─────────────────────────────────────────────────────────
// @route DELETE /api/domains/:id   @access Private
exports.deleteDomain = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ msg: "Domain not found" });
    }

    const domain = await Domain.findById(req.params.id);
    if (!domain) return res.status(404).json({ msg: "Domain not found" });
    if (domain.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    // Remove from SES (best-effort)
    try {
      const ses = getSES();
      await ses.deleteIdentity({ Identity: domain.domain }).promise();
    } catch (e) {
      console.warn("SES delete warning:", e.message);
    }

    // Remove from Resend (best-effort)
    if (domain.resendDomainId) {
      try {
        const resend = getResend();
        if (resend) await resend.domains.remove(domain.resendDomainId);
      } catch (e) {
        console.warn("Resend delete warning:", e.message);
      }
    }

    await domain.deleteOne();
    res.json({ msg: "Domain removed" });
  } catch (err) {
    console.error("deleteDomain error:", err.message);
    res.status(500).send("Server Error");
  }
};

// ── Regenerate DNS records ─────────────────────────────────────────────────
// @route POST /api/domains/:id/regenerate   @access Private
exports.regenerateRecords = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) return res.status(404).json({ msg: "Domain not found" });
    if (domain.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    const providers = activeProviders();
    const errors = {};
    let anythingSucceeded = false;

    // Helper: wrap a promise with a timeout
    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
            ms,
          ),
        ),
      ]);

    // ── Retry SES ──────────────────────────────────────────────────────
    if (providers.includes("ses") && !domain.verificationToken) {
      try {
        const ses = getSES();
        const [verifyRes, dkimRes] = await withTimeout(
          Promise.all([
            ses.verifyDomainIdentity({ Domain: domain.domain }).promise(),
            ses.verifyDomainDkim({ Domain: domain.domain }).promise(),
          ]),
          8000,
          "SES",
        );
        domain.verificationToken = verifyRes.VerificationToken;
        domain.dkimTokens = dkimRes.DkimTokens;
        domain.sesStatus = "pending";
        anythingSucceeded = true;
      } catch (err) {
        console.error("SES regen error:", err.message);
        errors.ses = err.message;
      }
    } else if (domain.verificationToken) {
      anythingSucceeded = true; // already has SES records
    }

    // ── Retry Resend ───────────────────────────────────────────────────
    if (providers.includes("resend") && !domain.resendDomainId) {
      const resend = getResend();
      if (resend) {
        try {
          const { data, error } = await withTimeout(
            resend.domains.create({ name: domain.domain }),
            8000,
            "Resend",
          );
          if (error) throw new Error(error.message);
          domain.resendDomainId = data.id;
          domain.resendRecords = data.records;
          domain.resendStatus = "pending";
          anythingSucceeded = true;
        } catch (err) {
          console.error("Resend regen error:", err.message);
          errors.resend = err.message;
        }
      }
    } else if (domain.resendDomainId) {
      anythingSucceeded = true; // already has Resend records
    }

    await domain.save();

    // If nothing worked, return 207 so client knows to show error
    const status = anythingSucceeded ? 200 : 207;
    res.status(status).json({
      ...domain.toObject(),
      errors,
      _providerErrors: errors,
      _success: anythingSucceeded,
    });
  } catch (err) {
    console.error("regenerateRecords error:", err.message);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};
