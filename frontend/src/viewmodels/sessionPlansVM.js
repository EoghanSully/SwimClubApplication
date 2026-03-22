// ============================================
// SESSION PLANS VIEW MODEL
// University of Galway Swim Club
// ============================================

import { AppState } from '../app.js';
import { formatDate } from '../utils/date.js';
import * as sessionPlanModel from '../models/sessionPlanModel.js';
import * as teamModel from '../models/teamModel.js';

let planList = [];

/**
 * Load all session plans from backend
 */
export async function loadSessionPlans() {
  try {
    planList = await sessionPlanModel.getAllPlans();
    console.log("Session plans loaded in view model:", planList);
    if(planList.length === 0) {
      console.warn("No session plans found. Check backend API and database.");
    }
    return planList;
  } catch (error) {
    console.error('Error loading session plans:', error.stack);
    throw error;
  }
}

/**
 * Get session plans filtered by role and team
 */
export async function getFilteredPlans(user, role, selectedTeam = 'ALL') {
  try {
    const plans = planList.length ? planList : (await loadSessionPlans());
    
    return plans.filter(plan => {
      // Team filter
      if (selectedTeam !== 'ALL' && plan.teamId !== selectedTeam) {
        return false;
      }
      
      // Role-based access
      if (role === 'MEMBER') {
        // Members can only see plans for their teams
        return user.teamIds && user.teamIds.includes(plan.teamId);
      } else if (role === 'COACH') {
        // Coaches can only see plans for teams they coach
        const team = user.coachTeams || [];
        return team.includes(plan.teamId);
      }
      
      // Admins see all
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error filtering session plans:', error.stack);
    throw error;
  }
}

/**
 * Get teams user can create plans for
 */
export async function getAvailableTeams(user, role) {
  try {
    const teams = await teamModel.getAllTeams();
    
    if (role === 'ADMIN') {
      return teams;
    } else if (role === 'COACH') {
      return teams.filter(t => t.coachIds && t.coachIds.includes(user.id));
    }
    return [];
  } catch (error) {
    console.error('Error getting available teams:', error.stack);
    return [];
  }
}

/**
 * Create new session plan
 */
export async function createPlan(formData, userId) {
  try {
    const newPlan = await sessionPlanModel.createNewPlan(formData);
    planList.push(newPlan);
    console.log("Session plan created and added to list:", newPlan);
    return newPlan;
  } catch (error) {
    console.error('Error creating session plan:', error.stack);
    throw error;
  }
}

/**
 * Update existing session plan
 */
export async function updatePlan(planData) {
  try {
    const updatedPlan = await sessionPlanModel.updatePlan(planData);
    const index = planList.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
      planList[index] = updatedPlan;
    }
    console.log("Session plan updated:", updatedPlan);
    return updatedPlan;
  } catch (error) {
    console.error('Error updating session plan:', error.stack);
    throw error;
  }
}

/**
 * Delete session plan
 */
export async function deletePlan(planId) {
  try {
    await sessionPlanModel.deletePlan(planId);
    planList = planList.filter(p => p.id !== planId);
    console.log("Session plan deleted with ID:", planId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting session plan:', error.stack);
    throw error;
  }
}

/**
 * Get team name
 */
export async function getTeamName(teamId) {
  try {
    const teams = await teamModel.getAllTeams();
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  } catch (error) {
    console.error('Error getting team name:', error.stack);
    return 'Unknown Team';
  }
}

/**
 * Get creator name (from user model if available)
 */
export async function getCreatorName(creatorId) {
  // This would require importing userModel
  // For now, returning the ID as a fallback
  return creatorId;
}

/**
 * Get session categories
 */
export function getCategories() {
  return ['THRESHOLD', 'SPRINT', 'ENDURANCE', 'TECHNIQUE', 'RACE_PREP', 'RECOVERY', 'GENERAL'];
}

export async function initSessions() {
  console.log('📋 Initializing Session Plans...');
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';

  try {
    await loadSessionPlans();
    const teams = await getAvailableTeams(user, role);

    const teamFilter = document.getElementById('plans-team-filter');
    const planSelect = document.getElementById('plan-team-select');

    if (teamFilter) {
      teamFilter.innerHTML = '<option value="ALL">All Teams</option>' +
        teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
      teamFilter.addEventListener('change', renderSessionPlans);
    }

    if (planSelect) {
      planSelect.innerHTML = teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
    }

    await renderSessionPlans();

    const form = document.getElementById('create-plan-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const planData = {
          title: formData.get('title'),
          teamId: formData.get('teamId'),
          category: formData.get('category'),
          warmUp: formData.get('warmUp'),
          session: formData.get('session'),
          coolDown: formData.get('coolDown'),
          extraInfo: formData.get('extraInfo')
        };

        await createPlan(planData, user.id);
        await renderSessionPlans();
        closeCreatePlanModal();
      });
    }

    window.showCreatePlanModal = function() {
      const modal = document.getElementById('create-plan-modal');
      if (modal) modal.style.display = 'flex';
    };

    window.closeCreatePlanModal = function() {
      const modal = document.getElementById('create-plan-modal');
      if (modal) modal.style.display = 'none';
      const form = document.getElementById('create-plan-form');
      if (form) form.reset();
    };

    window.viewPlan = async function(planId) {
      const plan = (await loadSessionPlans()).find(p => p.id === planId);
      if (!plan) return;
      const modal = document.getElementById('view-plan-modal');
      const title = document.getElementById('view-plan-title');
      const content = document.getElementById('view-plan-content');
      if (!modal || !title || !content) return;

      title.textContent = plan.title;
      content.innerHTML = `...`;
      modal.style.display = 'flex';
    };

    window.closeViewPlanModal = function() {
      const modal = document.getElementById('view-plan-modal');
      if (modal) modal.style.display = 'none';
    };
  } catch (error) {
    console.error('Session plans init failed:', error);
  }
}

async function renderSessionPlans() {
  const selectedTeam = document.getElementById('plans-team-filter')?.value || 'ALL';
  const grid = document.getElementById('session-plans-grid');
  if (!grid) return;

  const plans = await getFilteredPlans(AppState.currentUser, AppState.currentUser?.role || 'MEMBER', selectedTeam);

  if (plans.length === 0) {
    grid.innerHTML = '<div class="no-plans">No session plans to display</div>';
    return;
  }

  const detailedPlans = await Promise.all(plans.map(async plan => {
    const teamName = await getTeamName(plan.teamId);
    const creatorName = await getCreatorName(plan.creatorId);
    return { ...plan, teamName, creatorName };
  }));

  grid.innerHTML = detailedPlans.map(plan => `
    <div class="session-plan-card" onclick="viewPlan('${plan.id}')">
      <div class="plan-card-header">
        <h3 class="plan-card-title">${plan.title}</h3>
        <span class="plan-card-team">${plan.teamName}</span>
      </div>
      <div class="plan-card-meta">
        <span class="plan-card-date">📅 ${formatDate(plan.date)}</span>
        <span class="plan-card-creator">👤 ${plan.creatorName}</span>
      </div>
      ${plan.category ? `<span class="plan-card-category">${plan.category}</span>` : ''}
    </div>
  `).join('');
}
