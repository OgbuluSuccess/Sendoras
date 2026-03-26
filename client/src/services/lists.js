import api from './api';

const getLists = () => api.get('/lists').then(res => res.data);
const createList = (data) => api.post('/lists', data).then(res => res.data);
const deleteList = (id) => api.delete(`/lists/${id}`).then(res => res.data);
const importContacts = (id, contacts) => api.post(`/lists/${id}/import`, { contacts }).then(res => res.data);
const getListContacts = (id, page = 1) => api.get(`/lists/${id}/contacts?page=${page}`).then(res => res.data);

const listService = { getLists, createList, deleteList, importContacts, getListContacts };
export default listService;
