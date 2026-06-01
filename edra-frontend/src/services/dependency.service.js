import axios from 'axios';

const BASE = '/api/dependencies';

const analyze   = (data)         => axios.post(`${BASE}/analyze`, data).then(r => r.data);
const getLatest = (deploymentId) => axios.get(`${BASE}/deployment/${deploymentId}`).then(r => r.data);
const getAll    = ()             => axios.get(BASE).then(r => r.data);
const getStats  = ()             => axios.get(`${BASE}/stats`).then(r => r.data);

const dependencyService = { analyze, getLatest, getAll, getStats };
export default dependencyService;
