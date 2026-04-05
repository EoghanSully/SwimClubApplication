import { AppState } from '../app.js';
import { formatDate } from '../utils/date.js';
import * as sessionPlanModel from '../models/sessionPlanModel.js';
import * as teamModel from '../models/teamModel.js';
import { loadComponent, renderTemplate } from '../utils/components.js';

// ESCAPE USER TEXT BEFORE INJECTING IT INTO HTML MARK-UP.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

  // BUILD A FRIENDLY "EDITED" LABEL FROM PLAN DATE DATA.
function formatPlanEditedLabel(plan) {
  const candidate = plan.raw?.updated_at || plan.raw?.created_at || plan.date;
  const parsedDate = candidate ? new Date(candidate) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) return 'Edited recently';

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
// MODAL FUNCTIONS (GLOBAL)
// ============================================
window.openCreatePlanModal = function () {
  const modal = document.getElementById('create-plan-modal');
  if (modal) modal.style.setProperty('display', 'flex', 'important');
};

window.closeCreatePlanModal = function () {
  const modal = document.getElementById('create-plan-modal');
  if (modal) modal.style.setProperty('display', 'none', 'important');
  const form = document.getElementById('create-plan-form');
  if (form) form.reset();
};

window.closeViewPlanModal = function () {
  const modal = document.getElementById('view-plan-modal');
  if (modal) modal.style.setProperty('display', 'none', 'important');
};

let planList = [];

// LOAD SESSION PLANS FROM BACKEND INTO LOCAL VIEWMODEL CACHE.
export async function loadSessionPlans() {
  planList = await sessionPlanModel.getAllPlans();
  return planList;
}

// FILTER PLANS BY ROLE ACCESS AND SELECTED TEAM.
export async function getFilteredPlans(user, role, selectedTeam = 'ALL') {
  const plans = planList.length ? planList : (await loadSessionPlans());
  if (role === 'MEMBER') return [];

  return plans.filter(plan => {
    if (selectedTeam !== 'ALL' && Number(plan.teamId) !== Number(selectedTeam)) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// GET AVAILABLE TEAMS FOR PLAN FILTERS AND PLAN CREATION.
export async function getAvailableTeams(user, role) {
  const teams = await teamModel.getAllTeams();
  if (role === 'ADMIN' || role === 'COACH') return teams;
  return [];
}

// CREATE A NEW PLAN AND REFRESH LOCAL CACHE.
export async function createPlan(formData) {
  const newPlan = await sessionPlanModel.createNewPlan(formData);
  await loadSessionPlans();
  return newPlan;
}

// UPDATE ONE PLAN IN BACKEND AND PATCH LOCAL CACHED ENTRY.
export async function updatePlan(planData) {
  const updatedPlan = await sessionPlanModel.updatePlan(planData);
  const index = planList.findIndex(p => p.id === updatedPlan.id);
  if (index !== -1) planList[index] = updatedPlan;
  return updatedPlan;
}

// DELETE ONE PLAN AND REMOVE IT FROM LOCAL CACHE.
export async function deletePlan(planId) {
  await sessionPlanModel.deletePlan(planId);
  planList = planList.filter(p => p.id !== planId);
}

// RESOLVE TEAM NAME TEXT FROM TEAM ID.
export async function getTeamName(teamId) {
  const teams = await teamModel.getAllTeams();
  const team = teams.find(t => Number(t.id) === Number(teamId));
  return team ? team.name : 'Unknown Team';
}

// ENSURE DETAIL MODAL COMPONENT EXISTS IN DOM BEFORE USE.
async function ensureSessionPlanDetailModalComponent() {
  if (document.getElementById('view-plan-modal')) return;
  try {
    const html = await loadComponent('session-plan-detail-modal');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    if (wrapper.firstElementChild) document.body.appendChild(wrapper.firstElementChild);
  } catch (error) {
    console.error('Failed to load session plan detail modal component:', error);
  }
}

// OPEN DETAIL MODAL AND RENDER ALL CONTENT FOR A SINGLE PLAN.
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
    <div class="plan-section"><h3 class="plan-section-title">Warm-Up</h3><div class="plan-section-content">${plan.warmUp || '-'}</div></div>
    <div class="plan-section"><h3 class="plan-section-title">Main Set</h3><div class="plan-section-content">${plan.session || '-'}</div></div>
    <div class="plan-section"><h3 class="plan-section-title">Cool-Down</h3><div class="plan-section-content">${plan.coolDown || '-'}</div></div>
    ${plan.extraInfo ? `<div class="plan-section"><h3 class="plan-section-title">Notes</h3><div class="plan-section-content">${plan.extraInfo}</div></div>` : ''}
  `;
  modal.style.setProperty('display', 'flex', 'important');
}

// INITIALISE SESSION PLANS PAGE, FILTERS, CREATE FLOW, AND GRID RENDERING.
export async function initSessions() {
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';

  await ensureSessionPlanDetailModalComponent();

  if (role === 'MEMBER') {
    const grid = document.getElementById('session-plans-grid');
    if (grid) grid.innerHTML = '<div class="no-plans">Session plans are available to coaches and admins only</div>';
    return;
  }

  await loadSessionPlans();
  const teams = await getAvailableTeams(user, role);

  const createBtn = document.getElementById('create-plan-btn');
  const teamFilter = document.getElementById('plans-team-filter') || document.getElementById('plan-team-filter');
  const planSelect = document.getElementById('plan-team-select');

  if (teamFilter) {
    teamFilter.innerHTML = '<option value="ALL">All Teams</option>' +
      teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
    teamFilter.addEventListener('change', renderSessionPlans);
  }

  if (planSelect) {
    planSelect.innerHTML = teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
  }

  if (createBtn) {
    createBtn.style.display = role === 'COACH' ? 'inline-flex' : 'none';
    createBtn.onclick = () => window.openCreatePlanModal();
  }

  await renderSessionPlans();

  const form = document.getElementById('create-plan-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const category = fd.get('category') || 'GENERAL';
      const mainSet = fd.get('mainSet') || fd.get('session');
      const notes = fd.get('notes') || fd.get('extraInfo') || '';
      const rawTeamId = fd.get('teamId');
      const teamId = rawTeamId ? Number(rawTeamId) : null;
      if (!teamId) { alert('Please select a team'); return; }

      try {
        await createPlan({
          title: fd.get('title'), description: `${category} session plan`, category,
          team_id: teamId, teamId,
          warm_up: fd.get('warmUp'), warmUp: fd.get('warmUp'),
          main_set: mainSet, session: mainSet,
          cool_down: fd.get('coolDown'), coolDown: fd.get('coolDown'),
          coach_note: notes, extraInfo: notes
        });
        await renderSessionPlans();
        window.closeCreatePlanModal();
      } catch (error) {
        alert(error.message || 'Unable to create session plan');
      }
    });
  }
}

// RENDER SESSION PLAN CARD GRID FOR ACTIVE FILTERS.
async function renderSessionPlans() {
  const selectedTeam = (document.getElementById('plans-team-filter') || document.getElementById('plan-team-filter'))?.value || 'ALL';
  const grid = document.getElementById('session-plans-grid');
  if (!grid) return;

  const plans = await getFilteredPlans(AppState.currentUser, AppState.currentUser?.role || 'MEMBER', selectedTeam);

  if (plans.length === 0) {
    const canCreate = AppState.currentUser?.role === 'COACH';
    grid.innerHTML = `
      <div class="no-plans">
        <p>No session plans to display</p>
        ${canCreate ? '<button class="btn btn-primary create-plan-empty-btn" onclick="window.openCreatePlanModal()">+ Create Session Plan</button>' : ''}
      </div>`;
    return;
  }

  const detailedPlans = await Promise.all(plans.map(async plan => ({
    ...plan, teamName: await getTeamName(plan.teamId)
  })));

  const cardTemplate = await loadComponent('session-plan-card');
  grid.innerHTML = detailedPlans.map(plan => renderTemplate(cardTemplate, {
    id: plan.id ?? plan.planId ?? plan.raw?.plan_id ?? null,
    title: escapeHtml(plan.title || 'Untitled Session Plan'),
    editedLabel: escapeHtml(formatPlanEditedLabel(plan)),
    teamName: escapeHtml(plan.teamName || 'Unknown Team')
  })).join('');

  grid.querySelectorAll('.session-plan-card').forEach((card, index) => {
    const plan = detailedPlans[index];
    if (plan) card.addEventListener('click', () => openPlanDetailsFromPlan(plan));
  });
}
