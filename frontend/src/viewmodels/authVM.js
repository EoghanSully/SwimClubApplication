import * as loginModel from '../models/loginModel.js';
import { normalizeUser } from '../core/state.js';

// AUTHENTICATE USER CREDENTIALS AND STORE SESSION DETAILS LOCALLY.
async function login(email, password) {
  const response = await loginModel.userLogin({ email, password });
  const responseUser = response?.user ?? (response?.user_id ? response : null);
  const responseToken = response?.token ?? null;

  if (!responseUser) return { success: false, error: 'Invalid credentials' };

  const user = normalizeUser(responseUser);
  localStorage.setItem('currentUserId', user.id);
  localStorage.setItem('currentUser', JSON.stringify(user));
  if (responseToken) localStorage.setItem('token', responseToken);

  return { success: true, user };
}

// INITIALISE LOGIN FORM SUBMISSION AND ERROR DISPLAY BEHAVIOUR.
export async function initLogin() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const errorDiv = document.getElementById('login-error');
  if (!form || !emailInput || !passwordInput || !errorDiv) return;

  form.addEventListener('submit', async (e) => {
    // PREVENT FULL PAGE RELOAD SO LOGIN RUNS IN-APP.
    e.preventDefault();
    errorDiv.classList.add('hidden');

    try {
      const result = await login(emailInput.value, passwordInput.value);
      if (result.success) {
        // UPDATE GLOBAL APP USER STATE AND NAVIGATE TO DASHBOARD.
        window.AppState?.setCurrentUser(result.user);
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
