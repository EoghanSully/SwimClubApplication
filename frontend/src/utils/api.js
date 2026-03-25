const API_BASE_URL = 'http://127.0.0.1:8080/api'; // Must use 127.0.0.1 to match CORS origin config in server.js

function authHeaders(extra = {}) { //extra is an optional object of additional headers to merge with auth headers, e.g. Content-Type for JSON requests
  const token = localStorage.getItem('token');
  return {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra
  };
}

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({})); //Tries to parse error message from response, defaults to empty object if parsing fails
    throw new Error(error.message || `HTTP ${response.status}`); //Throws error with message from server or generic HTTP status if no message provided
  }
  
  return response.json(); //Parses and returns JSON response body from server
}


export async function apiPost(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}
export async function apiPostLogin(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',          //Sends JWT cookie automatically
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data) //Converts data object to JSON string for request body
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}
//QUESTION
//check if this is always better to call apiPut instead of apiPatch for updating events, since we are sending the whole event object with all fields in the request body, not just specific fields that need to be updated.
export async function apiPatch(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}


export async function apiPut(endpoint, data) { 
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json(); //Returns updated resource from server after successful PUT request 
}


export async function apiDelete(endpoint, id) {
  const response = await fetch(`${API_BASE_URL}${endpoint}/${id ? id : ''}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.ok;  // DELETE usually returns no body
}


