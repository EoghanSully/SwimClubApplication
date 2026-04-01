// ============================================
// SESSION PLANS VIEW MODEL
// University of Galway Swim Club
// ============================================

import { AppState } from '../app.js';
import { formatDate } from '../utils/date.js';
import * as sessionPlanModel from '../models/sessionPlanModel.js';
import * as teamModel from '../models/teamModel.js';
import { loadComponent, renderTemplate } from '../utils/components.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPlanEditedLabel(plan) {
  const candidate = plan.raw?.updated_at || plan.raw?.created_at || plan.date;
  const parsedDate = candidate ? new Date(candidate) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return 'Edited recently';
  }

  const diffMs = Date.now() - parsedDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Edited recently';
  if (diffHours < 24) return `Edited ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Edited Yesterday';

  const sameYear = parsedDate.getFullYear() === new Date().getFullYear();
  return `Edited ${parsedDate.toLocaleDateString('en-US', sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

// ============================================
// MODAL FUNCTIONS (Global)
// ============================================
window.openCreatePlanModal = function () {
  const modal = document.getElementById('create-plan-modal');
  if (modal) {
    modal.style.setProperty('display', 'flex', 'important');
  }
};

window.closeCreatePlanModal = function () {
  const modal = document.getElementById('create-plan-modal');
  if (modal) {
    modal.style.setProperty('display', 'none', 'important');
  }
  const form = document.getElementById('create-plan-form');
  if (form) {
    form.reset();
  }
};

window.closeViewPlanModal = function () {
  const modal = document.getElementById('view-plan-modal');
  if (modal) {
    modal.style.setProperty('display', 'none', 'important');
  }
};

let planList = [];

/**
 * Load all session plans from backend
 */
export async function loadSessionPlans() {
  try {
    planList = await sessionPlanModel.getAllPlans();
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

    if (role === 'MEMBER') {
      return [];
    }
    
    return plans.filter(plan => {
      // Team filter
      if (selectedTeam !== 'ALL' && Number(plan.teamId) !== Number(selectedTeam)) {
        return false;
      }
      
      // Role-based access
      if (role === 'COACH') {
        // Coaches can only see plans for teams they coach
        const team = user.coachTeamIds || [];
        return team.map(Number).includes(Number(plan.teamId));
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
export async function createPlan(formData) {
  try {
    const newPlan = await sessionPlanModel.createNewPlan(formData);
    await loadSessionPlans();
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
    const normalizedTeamId = Number(teamId);
    const team = teams.find(t => Number(t.id) === normalizedTeamId);
    return team ? team.name : 'Unknown Team';
  } catch (error) {
    console.error('Error getting team name:', error.stack);
    return 'Unknown Team';
  }
}

function getPlanStableId(plan) {
  return plan?.id ?? plan?.planId ?? plan?.raw?.plan_id ?? null;
}

async function ensureSessionPlanDetailModalComponent() {
  if (document.getElementById('view-plan-modal')) return;

  try {
    const html = await loadComponent('session-plan-detail-modal');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    if (wrapper.firstElementChild) {
      document.body.appendChild(wrapper.firstElementChild);
    }
  } catch (error) {
    console.error('Failed to load session plan detail modal component:', error);
  }
}

async function openPlanDetailsFromPlan(plan) {
  if (!plan) return;

  const modal = document.getElementById('view-plan-modal');
  const title = document.getElementById('plan-modal-title') || document.getElementById('view-plan-title');
  const subtitle = document.getElementById('plan-modal-subtitle');
  const content = document.getElementById('plan-view-content') || document.getElementById('view-plan-content');
  if (!modal || !title || !content) return;

  const teamName = plan.teamName || await getTeamName(plan.teamId);
  title.textContent = plan.title || 'Session Plan';
  if (subtitle) {
    subtitle.textContent = `${teamName} ${plan.date ? `• ${formatDate(plan.date)}` : ''} ${plan.category ? `• ${plan.category}` : ''}`;
  }

  content.innerHTML = `
    <div class="plan-section">
      <h3 class="plan-section-title">Warm-Up</h3>
      <div class="plan-section-content">${plan.warmUp || '-'}</div>
    </div>
    <div class="plan-section">
      <h3 class="plan-section-title">Main Set</h3>
      <div class="plan-section-content">${plan.session || '-'}</div>
    </div>
    <div class="plan-section">
      <h3 class="plan-section-title">Cool-Down</h3>
      <div class="plan-section-content">${plan.coolDown || '-'}</div>
    </div>
    ${plan.extraInfo ? `
      <div class="plan-section">
        <h3 class="plan-section-title">Notes</h3>
        <div class="plan-section-content">${plan.extraInfo}</div>
      </div>
    ` : ''}
  `;
  modal.style.setProperty('display', 'flex', 'important');
}

/**
 * Get session categories
 */
export function getCategories() {
  return ['THRESHOLD', 'SPRINT', 'ENDURANCE', 'TECHNIQUE', 'RACE_PREP', 'RECOVERY', 'GENERAL'];
}

export async function initSessions() {
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';

  await ensureSessionPlanDetailModalComponent();

   if (role === 'MEMBER') {
    const grid = document.getElementById('session-plans-grid');
    if (grid) {
      grid.innerHTML = '<div class="no-plans">Session plans are available to coaches and admins only</div>';
    }
    return;
  }

  try {
    await loadSessionPlans();
    const teams = await getAvailableTeams(user, role);
    const createBtn = document.getElementById('create-plan-btn');

    const teamFilter = document.getElementById('plans-team-filter') || document.getElementById('plan-team-filter');
    const categoryFilter = document.getElementById('plan-category-filter');
    const planSelect = document.getElementById('plan-team-select');

    if (teamFilter) {
      teamFilter.innerHTML = '<option value="ALL">All Teams</option>' +
        teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
      teamFilter.addEventListener('change', renderSessionPlans);
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', renderSessionPlans);
    }

    if (planSelect) {
      planSelect.innerHTML = teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
    }

    if (createBtn) {
      createBtn.style.display = ['ADMIN', 'COACH'].includes(role) ? 'inline-flex' : 'none';
      createBtn.onclick = () => window.openCreatePlanModal();
    }

    await renderSessionPlans();

    const form = document.getElementById('create-plan-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const selectedTeamId = Number(formData.get('teamId'));
        const category = formData.get('category') || 'GENERAL';
        const warmUp = formData.get('warmUp');
        const mainSet = formData.get('mainSet') || formData.get('session');
        const coolDown = formData.get('coolDown');
        const notes = formData.get('notes') || formData.get('extraInfo') || '';

        const planData = {
          title: formData.get('title'),
          description: `${category} session plan`,
          category,
          team_id: selectedTeamId,
          teamId: selectedTeamId,
          warm_up: warmUp,
          warmUp,
          main_set: mainSet,
          session: mainSet,
          cool_down: coolDown,
          coolDown,
          coach_note: notes,
          extraInfo: notes
        };

        try {
          await createPlan(planData);
          await renderSessionPlans();
          window.closeCreatePlanModal();
        } catch (error) {
          console.error('Create session plan submit failed:', error);
          alert(error.message || 'Unable to create session plan');
        }
      });
    }

  } catch (error) {
    console.error('Session plans init failed:', error);
  }
}

async function renderSessionPlans() {
  const selectedTeam = (document.getElementById('plans-team-filter') || document.getElementById('plan-team-filter'))?.value || 'ALL';
  const selectedCategory = document.getElementById('plan-category-filter')?.value || 'ALL';
  const grid = document.getElementById('session-plans-grid');
  const countBadge = document.getElementById('plans-count-badge');
  if (!grid) return;

  let plans = await getFilteredPlans(AppState.currentUser, AppState.currentUser?.role || 'MEMBER', selectedTeam);

  if (selectedCategory !== 'ALL') {
    plans = plans.filter(plan => plan.category === selectedCategory);
  }

  if (plans.length === 0) {
    const canCreate = ['ADMIN', 'COACH'].includes(AppState.currentUser?.role);
    grid.innerHTML = `
      <div class="no-plans">
        <p>No session plans to display</p>
        ${canCreate ? '<button class="btn btn-primary create-plan-empty-btn" onclick="window.openCreatePlanModal()">+ Create Session Plan</button>' : ''}
      </div>
    `;
    if (countBadge) countBadge.textContent = '0 PLANS FOUND';
    return;
  }

  if (countBadge) {
    countBadge.textContent = `${plans.length} PLAN${plans.length !== 1 ? 'S' : ''} FOUND`;
  }

  const detailedPlans = await Promise.all(plans.map(async plan => {
    const teamName = await getTeamName(plan.teamId);
    return { ...plan, teamName };
  }));

  const cardTemplate = await loadComponent('session-plan-card');
  grid.innerHTML = detailedPlans.map(plan => renderTemplate(cardTemplate, {
    id: getPlanStableId(plan),
    title: escapeHtml(plan.title || 'Untitled Session Plan'),
    editedLabel: escapeHtml(formatPlanEditedLabel(plan)),
    teamName: escapeHtml(plan.teamName || 'Unknown Team')
  })).join('');

  // Use delegated binding so modal opens reliably even if inline handlers fail.
  const cards = grid.querySelectorAll('.session-plan-card');
  cards.forEach((card, index) => {
    const plan = detailedPlans[index];
    if (!plan) return;
    card.addEventListener('click', () => openPlanDetailsFromPlan(plan));
  });
}
