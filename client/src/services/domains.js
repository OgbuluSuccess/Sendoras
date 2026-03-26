import api from './api';

const getDomains = () => api.get('/domains').then(r => r.data);
const addDomain = (domain) => api.post('/domains', { domain }).then(r => r.data);
const checkDomain = (id) => api.post(`/domains/${id}/check`).then(r => r.data);
const regenerateDomain = (id) => api.post(`/domains/${id}/regenerate`).then(r => r.data);
const deleteDomain = (id) => api.delete(`/domains/${id}`).then(r => r.data);

const domainService = { getDomains, addDomain, checkDomain, regenerateDomain, deleteDomain };
export default domainService;
