import axios from 'axios';

const BASE = '/api/risk';

const analyze = (deploymentId) => axios.post(`${BASE}/analyze/${deploymentId}`).then(r => r.data);

const getRiskScore = (deploymentId) => axios.get(`${BASE}/deployment/${deploymentId}`).then(r => r.data);

const getAll = () => axios.get(BASE).then(r => r.data);

const getStats = () => axios.get(`${BASE}/stats`).then(r => r.data);

const riskService = { analyze, getRiskScore, getAll, getStats };
export default riskService;
