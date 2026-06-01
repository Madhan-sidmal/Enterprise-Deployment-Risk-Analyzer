import axios from 'axios';
const BASE = '/api/approvals';

const getPending   = ()             => axios.get(`${BASE}/pending`).then(r => r.data);
const approve      = (id, comment)  => axios.post(`${BASE}/${id}/approve`, { comment }).then(r => r.data);
const reject       = (id, comment)  => axios.post(`${BASE}/${id}/reject`,  { comment }).then(r => r.data);
const markDeployed = (id)           => axios.patch(`${BASE}/${id}/deploy`).then(r => r.data);
const getHistory   = ()             => axios.get(`${BASE}/history`).then(r => r.data);
const getForDep    = (depId)        => axios.get(`${BASE}/deployment/${depId}`).then(r => r.data);
const getStats     = ()             => axios.get(`${BASE}/stats`).then(r => r.data);

const approvalService = { getPending, approve, reject, markDeployed, getHistory, getForDep, getStats };
export default approvalService;
