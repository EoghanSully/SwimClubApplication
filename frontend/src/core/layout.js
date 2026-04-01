// Shared layout behavior: announcement modals, sidebar cards, and shared component injection.

export function createLayoutController({
  AppState,
  apiGet,
  apiPost,
  adaptAnnouncementRow,
  adaptTeamRows,
  loadComponent,
  renderTemplate,
  reroute
}) {
  let isSidebarCreateFormBound = false;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ------------------------------
  // Announcement visibility + data
  // ------------------------------
  function isAnnouncementVisibleToUser(announcement, role, user) {
    if (!announcement) return false;

    const audience = announcement.audience || (announcement.target === 'COACHES' ? 'coach' : 'club');
    if (audience === 'club') return true;
    if (audience === 'coach') return role === 'ADMIN' || role === 'COACH';
    if (audience === 'team') {
      const teamId = announcement.team_id ?? announcement.teamId;
      const userTeamIds = Array.isArray(user?.teamIds) ? user.teamIds.map(Number) : [];
      return teamId != null && userTeamIds.includes(Number(teamId));
    }

    return role === 'ADMIN';
  }

  async function getSidebarAnnouncements(limit = 5) {
    const user = AppState.currentUser || { teamIds: [] };
    const role = user.role || 'MEMBER';

    if (!AppState.announcements.length) {
      try {
        const result = await apiGet('/announcements');
        AppState.announcements = (result?.data || []).map(adaptAnnouncementRow);
      } catch (error) {
        console.warn('Could not fetch announcements for sidebar:', error.message);
      }
    }

    return (AppState.announcements || [])
      .filter((announcement) => isAnnouncementVisibleToUser(announcement, role, user))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, limit);
  }

  // ------------------------------
  // Announcement modals
  // ------------------------------
  function renderAnnouncementModal(announcement) {
    const modal = document.getElementById('announcement-detail-modal');
    const title = document.getElementById('announcement-modal-title');
    const meta = document.getElementById('announcement-modal-meta');
    const content = document.getElementById('announcement-modal-content');

    if (!modal || !title || !meta || !content) return;

    const date = new Date(announcement.created_at || announcement.date || Date.now());
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const authorName = announcement.author_name || announcement.author || 'Admin';
    const initials = authorName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const category = (announcement.category || 'GENERAL').toUpperCase();
    const audience = announcement.audience || (announcement.target === 'COACHES' ? 'coach' : 'club');
    const audienceLabel = audience === 'team'
      ? `Team ${announcement.team_id ?? announcement.teamId ?? ''}`.trim()
      : audience === 'coach'
        ? 'Coaches'
        : 'All Club';
    const eventLabel = announcement.eventId ? `Event #${announcement.eventId}` : 'Not linked to event';
    const messageBody = announcement.description || announcement.content || 'No content';

    title.textContent = announcement.title || 'Announcement';

    meta.innerHTML = `
      <div class="modal-author">
        <div class="modal-author-avatar">${initials}</div>
        <span>${escapeHtml(authorName)}</span>
      </div>
      <div class="announcement-meta-line">${formattedDate} at ${formattedTime}</div>
    `;

    content.innerHTML = `
      <div class="announcement-detail-grid">
        <div class="announcement-detail-item">
          <span class="announcement-detail-label">Category</span>
          <span class="modal-category-badge">${escapeHtml(category)}</span>
        </div>
        <div class="announcement-detail-item">
          <span class="announcement-detail-label">Audience</span>
          <span class="announcement-detail-value">${escapeHtml(audienceLabel)}</span>
        </div>
        <div class="announcement-detail-item">
          <span class="announcement-detail-label">Related Event</span>
          <span class="announcement-detail-value">${escapeHtml(eventLabel)}</span>
        </div>
      </div>
      <div class="modal-content-text">${escapeHtml(messageBody)}</div>
    `;

    modal.style.setProperty('display', 'flex', 'important');
  }

  window.openAnnouncementModal = function (announcement) {
    renderAnnouncementModal(announcement);
  };

  window.closeAnnouncementModal = function () {
    const modal = document.getElementById('announcement-detail-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }
  };

  function canCreateAnnouncements() {
    const role = AppState.currentUser?.role || 'MEMBER';
    return role === 'ADMIN' || role === 'COACH';
  }

  // ------------------------------
  // Create announcement modal flow
  // ------------------------------
  async function populateSidebarAnnouncementTeams() {
    const teamSelect = document.getElementById('sidebar-announcement-team-select');
    if (!teamSelect) return;

    const result = await apiGet('/teams');
    const teams = adaptTeamRows(result?.data || []);
    teamSelect.innerHTML = '<option value="">Select a team</option>' + teams
      .map((team) => `<option value="${team.id}">${team.name}</option>`)
      .join('');
  }

  function setupSidebarCreateAnnouncementForm() {
    const form = document.getElementById('sidebar-create-announcement-form');
    const targetSelect = document.getElementById('sidebar-announcement-target');
    const teamGroup = document.getElementById('sidebar-announcement-team-group');

    if (!form || !targetSelect || !teamGroup || isSidebarCreateFormBound) return;

    const toggleTeamTarget = () => {
      teamGroup.style.display = targetSelect.value === 'TEAM' ? 'block' : 'none';
    };

    targetSelect.addEventListener('change', toggleTeamTarget);
    toggleTeamTarget();

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
        await apiPost('/announcements/create', announcementData);
        AppState.announcements = [];
        window.closeSidebarCreateAnnouncementModal();
        form.reset();
        const currentPage = window.location.hash.slice(1) || 'dashboard';
        await reroute(currentPage);
      } catch (error) {
        console.error('Create announcement failed:', error);
        alert(error.message || 'Unable to create announcement');
      }
    });

    isSidebarCreateFormBound = true;
  }

  window.openSidebarCreateAnnouncementModal = async function () {
    if (!canCreateAnnouncements()) return;
    setupSidebarCreateAnnouncementForm();
    try {
      await populateSidebarAnnouncementTeams();
    } catch (error) {
      console.error('Could not load teams for announcement modal:', error);
    }
    const modal = document.getElementById('sidebar-create-announcement-modal');
    if (modal) modal.style.setProperty('display', 'flex', 'important');
  };

  window.closeSidebarCreateAnnouncementModal = function () {
    const modal = document.getElementById('sidebar-create-announcement-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }
  };

  function bindSidebarCreateAnnouncementButtons() {
    const canCreate = canCreateAnnouncements();
    const buttons = document.querySelectorAll('[data-sidebar-create-announcement]');
    buttons.forEach((button) => {
      button.style.display = canCreate ? 'inline-flex' : 'none';
      if (button.dataset.bound === 'true') return;
      button.addEventListener('click', () => window.openSidebarCreateAnnouncementModal());
      button.dataset.bound = 'true';
    });
  }

  // ------------------------------
  // Persistent sidebar rendering
  // ------------------------------
  async function renderPersistentAnnouncementsSidebar() {
    const list = document.getElementById('persistent-announcements-list');
    if (!list) return;

    const categoryColors = {
      GENERAL: '#6B7280',
      TRAINING: '#2563EB',
      COMPETITION: '#DC2626',
      SOCIAL: '#9333EA',
      FUNDRAISER: '#F59E0B',
      SOCIETY: '#EC4899'
    };

    const announcements = await getSidebarAnnouncements(5);
    if (!announcements.length) {
      list.innerHTML = '<div class="announcements-sidebar-empty">No announcements</div>';
      return;
    }

    const cardTemplate = await loadComponent('announcement-card');
    list.innerHTML = announcements.map((announcement, index) => renderTemplate(cardTemplate, {
      index,
      categoryColor: categoryColors[announcement.category] || '#6B7280',
      category: announcement.category || 'GENERAL',
      date: announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      title: announcement.title || 'Untitled announcement',
      author: announcement.author_name || announcement.author || 'Admin'
    })).join('');

    const cards = list.querySelectorAll('[data-announcement-index]');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const index = Number(card.getAttribute('data-announcement-index'));
        const selected = announcements[index];
        if (selected) {
          window.openAnnouncementModal(selected);
        }
      });
    });
  }

  function shouldUsePersistentSidebar(page) {
    return page !== 'login' && page !== 'schedule' && page !== 'dashboard';
  }

  function shouldInjectSidebarWrapper(page) {
    return shouldUsePersistentSidebar(page) && page !== 'sessions';
  }

  function wrapPageWithPersistentSidebar(viewHTML, pageName) {
    return `
      <div class="page-with-announcements page-with-announcements--${pageName}">
        <div class="page-with-announcements-main">${viewHTML}</div>
        <aside class="dashboard-announcements-sidebar">
          <h3 class="announcements-sidebar-title">
            <span>Announcements</span>
            <button type="button" class="announcements-sidebar-add-btn" data-sidebar-create-announcement aria-label="Create announcement">+</button>
          </h3>
          <div id="persistent-announcements-list" class="announcements-sidebar-list"></div>
        </aside>
      </div>
    `;
  }

  // ------------------------------
  // Shared component injection
  // ------------------------------
  async function injectSharedComponents() {
    const components = [
      { name: 'announcement-modal', id: 'announcement-detail-modal' },
      { name: 'create-announcement-modal', id: 'sidebar-create-announcement-modal' }
    ];
    for (const { name, id } of components) {
      if (!document.getElementById(id)) {
        try {
          const html = await loadComponent(name);
          const wrapper = document.createElement('div');
          wrapper.innerHTML = html.trim();
          document.body.appendChild(wrapper.firstElementChild);
        } catch (e) {
          console.error(`Failed to inject component "${name}":`, e);
        }
      }
    }
  }

  return {
    bindSidebarCreateAnnouncementButtons,
    injectSharedComponents,
    renderPersistentAnnouncementsSidebar,
    shouldInjectSidebarWrapper,
    shouldUsePersistentSidebar,
    wrapPageWithPersistentSidebar
  };
}
