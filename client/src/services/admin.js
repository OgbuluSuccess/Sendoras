import api from './api';

const getSystemStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

const getAllUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

const updateUser = async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
};

const deleteUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

const getAllTransactions = async () => {
    const response = await api.get('/admin/transactions');
    return response.data;
};

const getAllSystemCampaigns = async () => {
    const response = await api.get('/admin/campaigns');
    return response.data;
};

const getCampaignDetail = async (id) => {
    const response = await api.get(`/admin/campaigns/${id}`);
    return response.data;
};

const adminService = {
    getSystemStats,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllTransactions,
    getAllSystemCampaigns,
    getCampaignDetail
};

export default adminService;
