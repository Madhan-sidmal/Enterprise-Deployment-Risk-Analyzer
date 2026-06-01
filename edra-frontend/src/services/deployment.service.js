import axios from 'axios';

const BASE = '/api/deployments';

const getAll = () => axios.get(BASE).then(r => r.data);

const getById = (id) => axios.get(`${BASE}/${id}`).then(r => r.data);

const create = (data) => axios.post(BASE, data).then(r => r.data);

const update = (id, data) => axios.put(`${BASE}/${id}`, data).then(r => r.data);

const submitForReview = (id) => axios.patch(`${BASE}/${id}/submit`).then(r => r.data);

const remove = (id) => axios.delete(`${BASE}/${id}`).then(r => r.data);

const getStats = () => axios.get(`${BASE}/stats`).then(r => r.data);

const deploymentService = { getAll, getById, create, update, submitForReview, remove, getStats };
export default deploymentService;
