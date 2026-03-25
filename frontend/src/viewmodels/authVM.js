// ============================================
// AUTHENTICATION VIEW MODEL
// University of Galway Swim Club
// ============================================

import * as loginModel from '../models/loginModel.js';

let currentUser = null;
let currentRole = null;

/**
 * Login user
 */
export async function login(email, password) {
  try {
    const user = { email, password };
    const response = await loginModel.userLogin(user); // { user_id, user_role, team_id }
    
    if (!response || !response.user_id) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Normalise field names for rest of app
    const userData = {
      user_id: response.user_id,
      user_role: response.user_role,
      team_id: response.team_id,
      role: response.user_role?.toUpperCase() // nav filter uses uppercase role
    };

    currentUser = userData;
    currentRole = userData.user_role;
    
    // Store in localStorage — token is sent as Bearer header on all subsequent API calls
    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUserId', userData.user_id);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    console.log('Login successful, user_id:', userData.user_id);
    return { success: true, user: userData };
  } catch (error) {
    console.error('Login error:', error.stack);
    return { success: false, error: error.message || 'Login failed' };
  }
}

/**
 * Logout user
 */
export async function logout() {
  try {
    currentUser = null;
    currentRole = null;
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    console.log('User logged out');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Get current user role
 */
export function getCurrentRole() {
  return currentRole;
}

/**
 * Restore session from localStorage
 */
export function restoreSession() {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      currentRole = currentUser.role;
      console.log('Session restored for:', currentUser.name);
      return currentUser;
    }
    return null;
  } catch (error) {
    console.error('Error restoring session:', error.stack);
    return null;
  }
}

export async function initLogin() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const errorDiv = document.getElementById('login-error');

  if (!form || !emailInput || !passwordInput || !errorDiv) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    try {
      const result = await login(emailInput.value, passwordInput.value);
      if (result.success) {
        const appState = window.AppState;
        if (appState && typeof appState.setCurrentUser === 'function') {
          appState.setCurrentUser(result.user);
        }
        window.location.hash = 'dashboard';
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      errorDiv.textContent = error.message || 'Login failed. Please try again.';
      errorDiv.classList.remove('hidden');
    }
  });
}