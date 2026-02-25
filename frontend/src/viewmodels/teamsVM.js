import { getAllUsers } from '../models/userModel.js';

let users = [];




export async function loadUsers() {
  try {
    users = await getAllUsers();
    console.log("Users loaded in view model:"); // Logs users for debugging
    if(users.length === 0) {
      console.warn("No users found. Check backend API and database.");
    }
    console.log(users); // Displays users in a table format in the console for easier reading 
  } catch (error) {
    console.error('Error loading users:', error.stack);
  }
}

export function getUsersForDisplay() { //cleans up retrieved data for display in the UI (e.g., only showing id, email, and role)
  return users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
  }));  
  
  console.log("Users prepared for display:", getUsersForDisplay()); // Logs cleaned user data for debugging 
}

