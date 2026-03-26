import api from './api';

const getApiKeys = async () => {
    const response = await api.get('/keys');
    return response.data;
};

const createApiKey = async (name) => {
    const response = await api.post('/keys', { name });
    return response.data;
};

const revokeApiKey = async (id) => {
    const response = await api.delete(`/keys/${id}`);
    return response.data;
};

const apiKeyService = {
    getApiKeys,
    createApiKey,
    revokeApiKey
};

export default apiKeyService;
