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
    const response = await loginModel.userLogin({ email, password });
    
    if (!response || !response.user) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Set current user and role
    currentUser = response.user;
    currentRole = response.user.role;
    
    // Store in localStorage
    localStorage.setItem('currentUserId', response.user.id);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    console.log('Login successful for:', response.user.name);
    return { success: true, user: response.user };
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
