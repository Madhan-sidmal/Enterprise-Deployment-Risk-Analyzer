import axios from 'axios';
const BASE = '/api/rollback';

const simulate    = (data) => axios.post(`${BASE}/simulate`, data).then(r => r.data);
const initiate    = (id)   => axios.patch(`${BASE}/${id}/initiate`).then(r => r.data);
const getById     = (id)   => axios.get(`${BASE}/${id}`).then(r => r.data);
const getForDep   = (depId) => axios.get(`${BASE}/deployment/${depId}`).then(r => r.data);
const getAll      = ()     => axios.get(BASE).then(r => r.data);
const getStats    = ()     => axios.get(`${BASE}/stats`).then(r => r.data);

const rollbackService = { simulate, initiate, getById, getForDep, getAll, getStats };
export default rollbackService;
