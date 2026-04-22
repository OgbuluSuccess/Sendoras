import api from "./api";

export const GOOGLE_AUTH_RESULT_STORAGE_KEY = "sendhiiv_google_auth_result";

export const storeGoogleAuthResult = (result) => {
  localStorage.setItem(
    GOOGLE_AUTH_RESULT_STORAGE_KEY,
    JSON.stringify({ ...result, timestamp: Date.now() }),
  );
};

export const clearGoogleAuthResult = () => {
  localStorage.removeItem(GOOGLE_AUTH_RESULT_STORAGE_KEY);
};

const persistSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  if (response.data.token) {
    persistSession(response.data.token, response.data.user);
  }
  return response.data;
};

const login = async (userData) => {
  const response = await api.post("/auth/login", userData);
  if (response.data.token) {
    persistSession(response.data.token, response.data.user);
  }
  return response.data;
};

const completeOAuthLogin = async (token) => {
  localStorage.setItem("token", token);

  try {
    const response = await api.get("/auth/me");
    persistSession(token, response.data);
    return response.data;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  const rawUser = localStorage.getItem("user");
  return rawUser ? JSON.parse(rawUser) : null;
};

const refreshUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const response = await api.get("/auth/me");
  localStorage.setItem("user", JSON.stringify(response.data));
  return response.data;
};

const authService = {
  register,
  login,
  completeOAuthLogin,
  logout,
  getCurrentUser,
  refreshUser,
};

export default authService;
