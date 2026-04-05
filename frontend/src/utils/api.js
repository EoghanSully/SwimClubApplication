// THIS FILE HOLDS SHARED HTTP HELPERS FOR TALKING TO THE BACKEND API.

// BUILD BASE URL FROM THE CURRENT HOSTNAME SO LOCAL/LAN TESTING STILL WORKS.
const API_HOST = window.location?.hostname || 'localhost';
const API_BASE_URL = `http://${API_HOST}:8080/api`;

// CLEAR STORED AUTH STATE AND RETURN USER TO LOGIN WHEN TOKEN IS INVALID.
function handleUnauthorized() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('token');
  if (window.location.hash !== '#login') window.location.hash = 'login';
}

// SHARED REQUEST WRAPPER FOR ALL HTTP METHODS USED BY THE APP.
async function request(method, url, data) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  };
  if (data !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }
  const response = await fetch(url, opts);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) handleUnauthorized();
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }
  if (method === 'DELETE') return response.ok;
  return response.json();
}

// CONVENIENCE HELPERS FOR STANDARD HTTP VERBS.
export const apiGet    = (endpoint)       => request('GET',    `${API_BASE_URL}${endpoint}`);
export const apiPost   = (endpoint, data) => request('POST',   `${API_BASE_URL}${endpoint}`, data);
export const apiPatch  = (endpoint, data) => request('PATCH',  `${API_BASE_URL}${endpoint}`, data);
export const apiPut    = (endpoint, data) => request('PUT',    `${API_BASE_URL}${endpoint}`, data);
export const apiDelete = (endpoint, id)   => request('DELETE', `${API_BASE_URL}${endpoint}/${id || ''}`);


