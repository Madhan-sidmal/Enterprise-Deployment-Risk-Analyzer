import axios from 'axios';

const API_URL = '/api/auth/';

const login = async (username, password) => {
  const response = await axios.post(API_URL + 'login', { username, password });
  if (response.data.token) {
    localStorage.setItem('edra_user', JSON.stringify(response.data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
  }
  return response.data;
};

const register = async ({ username, email, password, fullName, roles }) => {
  return axios.post(API_URL + 'register', { username, email, password, fullName, roles });
};

const logout = () => {
  localStorage.removeItem('edra_user');
  delete axios.defaults.headers.common['Authorization'];
};

const getCurrentUser = () => {
  const user = localStorage.getItem('edra_user');
  return user ? JSON.parse(user) : null;
};

const getAuthHeader = () => {
  const user = getCurrentUser();
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// Auto-set auth header on module load
const storedUser = getCurrentUser();
if (storedUser && storedUser.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedUser.token}`;
}

// Response interceptor for 401 handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = { login, register, logout, getCurrentUser, getAuthHeader };
export default authService;
