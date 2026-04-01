// ============================================
// ANNOUNCEMENTS VIEW MODEL
// University of Galway Swim Club
// ============================================

import { AppState } from '../app.js';
import * as announcementModel from '../models/announcementModel.js';
import * as teamModel from '../models/teamModel.js';

let announcementList = [];

// ============================================
// MODAL FUNCTIONS (Global)
// ============================================
window.openCreateModal = function () {
  const modal = document.getElementById('create-announcement-modal');
  if (modal) {
    modal.style.setProperty('display', 'flex', 'important');
  }
};

window.closeCreateModal = function () {
  const modal = document.getElementById('create-announcement-modal');
  if (modal) {
    modal.style.setProperty('display', 'none', 'important');
  }
};
let selectedCategory = 'ALL';

/**
 * Load all announcements from backend
 */
export async function loadAnnouncements() {
  try {
    announcementList = await announcementModel.getAllAnnouncements();
    console.log("Announcements loaded in view model:", announcementList);
    if(announcementList.length === 0) {
      console.warn("No announcements found. Check backend API and database.");
    }
    return announcementList;
  } catch (error) {
    console.error('Error loading announcements:', error.stack);
    throw error;
  }
}

/**
 * Get filtered announcements based on role and category
 */
export async function getFiltered(user, role, selectedCategoryFilter = 'ALL') {
  try {
    const announcements = announcementList.length ? announcementList : await loadAnnouncements();
    
    return announcements
      .filter(a => {
        // Filter by category
        if (selectedCategoryFilter !== 'ALL' && a.category !== selectedCategoryFilter) {
          return false;
        }
        
        // Filter by target audience
        if (a.target === 'ALL') return true;
        if (a.target === 'COACHES' && (role === 'ADMIN' || role === 'COACH')) return true;
        if (user.teamIds && user.teamIds.includes(a.target)) return true;
        
        // Admins see everything
        return role === 'ADMIN';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error filtering announcements:', error.stack);
    throw error;
  }
}

/**
 * Get recent announcements for sidebar (max 5)
 */
export async function getSidebarRecent(user, role, count = 5) {
  try {
    const filtered = await getFiltered(user, role, 'ALL');
    return filtered.slice(0, count);
  } catch (error) {
    console.error('Error getting sidebar announcements:', error.stack);
    throw error;
  }
}

/**
 * Get target audience label
 */
export async function getTargetLabel(target) {
  try {
    if (target === 'ALL') return 'All Club Members';
    if (target === 'COACHES') return 'Coaches Only';
    
    const teams = await teamModel.getAllTeams();
    const team = teams.find(t => t.id === target);
    return team ? team.name : 'Unknown';
  } catch (error) {
    console.error('Error getting target label:', error.stack);
    return 'Unknown';
  }
}

/**
 * Get available categories
 */
export function getCategories() {
  return ['ALL', 'TRAINING', 'COMPETITION', 'SOCIAL', 'FUNDRAISER', 'SOCIETY', 'GENERAL'];
}

// ====================
// UI ENTRY POINT
// ====================

export async function initAnnouncements() {
  console.log('📣 Initializing Announcements...');
  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';

  try {
    await loadAnnouncements();
    await setupAnnouncementTargetOptions(user, role);

    if (role === 'ADMIN' || role === 'COACH') {
      const createBtn = document.getElementById('create-announcement-btn');
      if (createBtn) {
        createBtn.style.setProperty('display', 'inline-flex', 'important');
        createBtn.addEventListener('click', window.openCreateModal);
      }
    }

    applyCategoryFilters();
    await renderAnnouncements();
    setupCreateAnnouncementForm();
  } catch (error) {
    console.error('Announcements init failed:', error);
  }
}

function applyCategoryFilters() {
  const filterContainer = document.getElementById('announcement-filter-buttons');
  if (!filterContainer) return;

  const categories = getCategories();
  filterContainer.innerHTML = categories.map(cat => `
    <button class="filter-btn ${selectedCategory === cat ? 'active' : ''}" data-category="${cat}">
      ${cat}
    </button>
  `).join('');

  filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      selectedCategory = btn.dataset.category;
      await renderAnnouncements();
      applyCategoryFilters();
    });
  });
}

async function renderAnnouncements() {
  const list = document.getElementById('announcements-list');
  if (!list) return;

  const user = AppState.currentUser;
  const role = user?.role || 'MEMBER';

  let announcements = await getFiltered(user, role, selectedCategory);

  if (!announcements.length) {
    list.innerHTML = '<div class="no-announcements">No announcements to display</div>';
    return;
  }

  const announcementsWithTarget = await Promise.all(announcements.map(async ann => ({
    ...ann,
    targetLabel: await getTargetLabel(ann.target)
  })));

  list.innerHTML = announcementsWithTarget.map(ann => `
    <div class="announcement-card">
      <div class="announcement-header">
        <span class="announcement-badge ${getCategoryColor(ann.category)}">${ann.category}</span>
        <span class="announcement-target">${ann.targetLabel}</span>
      </div>
      <div class="announcement-body">
        <h3 class="announcement-title">${ann.title}</h3>
        <p class="announcement-content">${ann.content}</p>
      </div>
      <div class="announcement-footer">
        <div class="announcement-author">👤 ${ann.author}</div>
        <span class="announcement-date">${ann.date}</span>
      </div>
    </div>
  `).join('');
}

function setupCreateAnnouncementForm() {
  const form = document.getElementById('create-announcement-form');
  if (!form) return;

  const targetSelect = form.querySelector('select[name="target"]');
  const teamTargetGroup = document.getElementById('announcement-team-target-group');

  const toggleTeamTarget = () => {
    const showTeamSelector = targetSelect && targetSelect.value === 'TEAM';
    if (teamTargetGroup) {
      teamTargetGroup.style.display = showTeamSelector ? 'block' : 'none';
    }
  };

  if (targetSelect) {
    targetSelect.addEventListener('change', toggleTeamTarget);
    toggleTeamTarget();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const target = formData.get('target');
    const selectedTeamId = formData.get('teamId');

    let audience = 'club';
    let team_id = null;

    if (target === 'COACHES') {
      audience = 'coach';
    } else if (target === 'TEAM') {
      audience = 'team';
      team_id = selectedTeamId ? Number(selectedTeamId) : null;
    }

    const announcementData = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category'),
      target,
      audience,
      team_id,
      eventId: formData.get('eventId') || null
    };

    try {
      await createAnnouncement(announcementData);
      await renderAnnouncements();
      window.closeCreateModal();
      form.reset();
      toggleTeamTarget();
    } catch (error) {
      console.error('Create announcement failed:', error);
      alert('Unable to create announcement');
    }
  });
}

/**
 * Get category color class
 */
export function getCategoryColor(category) {
  const colors = {
    'TRAINING': 'category-training',
    'COMPETITION': 'category-competition',
    'SOCIAL': 'category-social',
    'FUNDRAISER': 'category-fundraiser',
    'SOCIETY': 'category-society',
    'GENERAL': 'category-general'
  };
  return colors[category] || 'category-general';
}

/**
 * Create new announcement
 */
export async function createAnnouncement(announcementData) {
  try {
    const newAnnouncement = await announcementModel.createNewAnnouncement(announcementData);
    announcementList.push(newAnnouncement);
    console.log("Announcement created and added to list:", newAnnouncement);
    return newAnnouncement;
  } catch (error) {
    console.error('Error creating announcement:', error.stack);
    throw error;
  }
}

/**
 * Update existing announcement
 */
export async function updateAnnouncement(announcementData) {
  try {
    const updatedAnnouncement = await announcementModel.updateAnnouncement(announcementData);
    const index = announcementList.findIndex(a => a.id === updatedAnnouncement.id);
    if (index !== -1) {
      announcementList[index] = updatedAnnouncement;
    }
    console.log("Announcement updated:", updatedAnnouncement);
    return updatedAnnouncement;
  } catch (error) {
    console.error('Error updating announcement:', error.stack);
    throw error;
  }
}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(announcementId) {
  try {
    await announcementModel.deleteAnnouncement(announcementId);
    announcementList = announcementList.filter(a => a.id !== announcementId);
    console.log("Announcement deleted with ID:", announcementId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting announcement:', error.stack);
    throw error;
  }
}

async function setupAnnouncementTargetOptions(user, role) {
  const teamSelect = document.getElementById('announcement-team-target');
  if (!teamSelect || (role !== 'ADMIN' && role !== 'COACH')) return;

  try {
    const teams = await teamModel.getAllTeams();
    const scopedTeams = role === 'ADMIN'
      ? teams
      : teams.filter((team) => team.coachIds?.includes(user.id) || user.coachTeamIds?.includes(team.id));

    teamSelect.innerHTML = '<option value="">Select a team</option>' + scopedTeams.map((team) => `
      <option value="${team.id}">${team.name}</option>
    `).join('');
  } catch (error) {
    console.error('Error loading team target options:', error.stack);
  }
}