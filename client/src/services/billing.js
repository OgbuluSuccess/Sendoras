import api from "./api";

const getPlans = async () => {
  const response = await api.get("/plans");
  return response.data;
};

const createStripeSession = async (planId) => {
  const response = await api.post("/billing/stripe/create-session", { planId });
  return response.data;
};

const initializePaystack = async (planId) => {
  const response = await api.post("/billing/paystack/initialize", { planId });
  return response.data;
};

const verifyPaystack = async (reference) => {
  const response = await api.get(`/billing/paystack/verify/${reference}`);
  return response.data;
};

const billingService = {
  getPlans,
  createStripeSession,
  initializePaystack,
  verifyPaystack,
};

export default billingService;
