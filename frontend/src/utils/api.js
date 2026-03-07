const API_BASE_URL = 'http://localhost:8080/api'; // Base URL for backend API, adjust if backend is hosted elsewhere

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { //
    method: 'GET',
            //Sends JWT cookie automatically
    credentials: 'include',        
    headers: {
      'Accept': 'application/json' //Ensures server returns JSON responses
    }
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
    credentials: 'include',           //Sends JWT cookie automatically
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
export async function apiPatch(endpoint, data) { //updating specific fields of a resource
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    credentials: 'include',           //Sends JWT cookie automatically
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
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
    credentials: 'include',           //Sends JWT cookie automatically
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json(); //Returns updated resource from server after successful PUT request 
}


export async function apiDelete(endpoint, id) { //data parameter is optional, can be used to send additional info if needed (e.g., for soft deletes)
  const response = await fetch(`${API_BASE_URL}${endpoint}/${id ? id : ''}`, {
    method: 'DELETE',
    credentials: 'include',           //Sends JWT cookie automatically
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.ok;  // DELETE usually returns no body
}


