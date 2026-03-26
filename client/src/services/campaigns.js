import api from './api';

const getCampaigns = async () => {
    const response = await api.get('/campaigns');
    return response.data;
};

const getCampaign = async (id) => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
};

const createCampaign = async (campaignData) => {
    const response = await api.post('/campaigns', campaignData);
    return response.data;
};

const updateCampaign = async (id, data) => {
    const response = await api.put(`/campaigns/${id}`, data);
    return response.data;
};

const sendCampaign = async (id) => {
    const response = await api.post(`/campaigns/${id}/send`);
    return response.data;
};

const resendCampaign = async (id) => {
    const response = await api.post(`/campaigns/${id}/resend`);
    return response.data;
};

const duplicateCampaign = async (id) => {
    const response = await api.post(`/campaigns/${id}/duplicate`);
    return response.data;
};

const deleteCampaign = async (id) => {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
};

const campaignService = {
    getCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    sendCampaign,
    resendCampaign,
    duplicateCampaign,
    deleteCampaign,
};

export default campaignService;
