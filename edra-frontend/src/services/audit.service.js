import axios from 'axios';
const BASE = '/api/audit';

const getAll    = (page = 0, size = 20) => axios.get(BASE, { params: { page, size } }).then(r => r.data);
const getRecent = ()                    => axios.get(`${BASE}/recent`).then(r => r.data);
const getStats  = ()                    => axios.get(`${BASE}/stats`).then(r => r.data);
const getForEntity = (type, id)         => axios.get(`${BASE}/entity/${type}/${id}`).then(r => r.data);
const search    = (q, page = 0, size = 20) => axios.get(`${BASE}/search`, { params: { q, page, size } }).then(r => r.data);

const auditService = { getAll, getRecent, getStats, getForEntity, search };
export default auditService;
