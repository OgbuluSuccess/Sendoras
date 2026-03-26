const https = require('https');
const http = require('http');
const { URL } = require('url');

// @desc  Proxy-download a public Google Drive file (bypasses browser CORS)
// @route GET /api/proxy/drive?id=FILE_ID
// @access Public (file must already be publicly shared on Drive)
exports.proxyDriveFile = (req, res) => {
    const { id } = req.query;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return res.status(400).json({ msg: 'Invalid or missing Google Drive file ID' });
    }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;

    const follow = (url, redirects = 0) => {
        if (redirects > 5) return res.status(500).json({ msg: 'Too many redirects from Google Drive' });

        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;

        lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (upstream) => {
            const { statusCode, headers: upHeaders } = upstream;

            // Follow redirects (Google Drive does this for large files)
            if ([301, 302, 303, 307, 308].includes(statusCode) && upHeaders.location) {
                upstream.resume();
                return follow(upHeaders.location, redirects + 1);
            }

            if (statusCode === 403 || statusCode === 401) {
                upstream.resume();
                return res.status(403).json({ msg: 'PRIVATE_FILE' });
            }

            if (statusCode !== 200) {
                upstream.resume();
                return res.status(502).json({ msg: `Google Drive returned ${statusCode}` });
            }

            // Forward content-type and pipe the body
            const ct = upHeaders['content-type'] || 'application/octet-stream';
            res.setHeader('Content-Type', ct);
            res.setHeader('Access-Control-Allow-Origin', '*');
            upstream.pipe(res);
        }).on('error', (err) => {
            res.status(502).json({ msg: 'Failed to reach Google Drive: ' + err.message });
        });
    };

    follow(downloadUrl);
};
