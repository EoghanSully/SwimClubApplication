// Shared layout behavior: announcement modals, sidebar cards, and shared component injection.

// THIS CONTROLLER HANDLES SHARED LAYOUT FEATURES (SIDEBAR + MODALS).
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
  // PREVENT BINDING THE SAME FORM EVENTS MORE THAN ONCE.
  let isSidebarCreateFormBound = false;

  // ESCAPE HTML TO AVOID INJECTING RAW USER CONTENT INTO THE DOM.
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // BUILD A FRIENDLY AUTHOR LABEL FROM ADMIN ID + KNOWN USER DATA.
  function getAnnouncementAuthorLabel(announcement) {
    const rawId = announcement?.admin_id ?? announcement?.adminId ?? announcement?.raw?.admin_id;
    const adminId = Number(rawId);
    const currentUser = AppState.currentUser || null;
    const teams = Array.isArray(AppState.teams) ? AppState.teams : [];

    if (currentUser && Number(currentUser.id) === adminId) {
      const role = String(currentUser.role || 'ADMIN').toLowerCase();
      return currentUser.name ? `${currentUser.name} (${role})` : `Admin ${rawId}`;
    }

    for (const team of teams) {
      const members = Array.isArray(team.members) ? team.members : [];
      const matched = members.find((member) => Number(member.id) === adminId);
      if (matched) {
        const name = matched.name || `${matched.firstName || ''} ${matched.lastName || ''}`.trim();
        const role = String(matched.role || 'ADMIN').toLowerCase();
        return name ? `${name} (${role})` : `Admin ${rawId}`;
      }
    }

    return `Admin ${rawId}`;
  }

  // MAP TEAM ID TO TEAM NAME, WITH A SIMPLE FALLBACK LABEL.
  function getTeamLabel(teamId) {
    const numericTeamId = Number(teamId);
    const teams = Array.isArray(AppState.teams) ? AppState.teams : [];
    const matchedTeam = teams.find((team) => Number(team.id) === numericTeamId);
    return matchedTeam?.name || `Team ${teamId}`;
  }

  // CHECK IF THE CURRENT USER IS ALLOWED TO SEE THIS ANNOUNCEMENT.
  function isAnnouncementVisibleToUser(announcement, role, user) {
    if (!announcement) return false;
    if (role === 'ADMIN') return true;

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

  // LOAD ANNOUNCEMENTS (IF NEEDED), FILTER THEM, SORT NEWEST FIRST, LIMIT LIST SIZE.
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
      .sort((a, b) => {
        const timeDiff = new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime();
        if (timeDiff !== 0) return timeDiff;

        // IF DATES MATCH, USE ID AS A SIMPLE NEWEST-FIRST TIEBREAKER.
        const aId = Number(a.announcementId ?? a.id ?? 0);
        const bId = Number(b.announcementId ?? b.id ?? 0);
        return bId - aId;
      })
      .slice(0, limit);
  }

  // FILL AND OPEN THE ANNOUNCEMENT DETAIL MODAL.
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

    const authorName = getAnnouncementAuthorLabel(announcement);
    const initials = authorName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const category = (announcement.category || 'GENERAL').toUpperCase();
    const audience = announcement.audience || (announcement.target === 'COACHES' ? 'coach' : 'club');
    const teamId = announcement.team_id ?? announcement.teamId;
    const audienceLabel = audience === 'team'
      ? getTeamLabel(teamId)
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

  // EXPOSE GLOBAL FUNCTIONS FOR OPEN/CLOSE ACTIONS USED BY HTML HANDLERS.
  window.openAnnouncementModal = function (announcement) {
    renderAnnouncementModal(announcement);
  };

  window.closeAnnouncementModal = function () {
    const modal = document.getElementById('announcement-detail-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }
  };

  // ONLY ADMINS CAN CREATE ANNOUNCEMENTS IN THIS APP.
  function canCreateAnnouncements() {
    const role = AppState.currentUser?.role || 'MEMBER';
    return role === 'ADMIN';
  }

  // LOAD TEAM OPTIONS INTO THE CREATE-ANNOUNCEMENT TEAM DROPDOWN.
  async function populateSidebarAnnouncementTeams() {
    const teamSelect = document.getElementById('sidebar-announcement-team-select');
    if (!teamSelect) return;

    const result = await apiGet('/teams');
    const teams = adaptTeamRows(result?.data || []);
    teamSelect.innerHTML = '<option value="">Select a team</option>' + teams
      .map((team) => `<option value="${team.id}">${team.name}</option>`)
      .join('');
  }

  // BIND CREATE FORM EVENTS ONCE AND HANDLE SUBMIT LOGIC.
  function setupSidebarCreateAnnouncementForm() {
    const form = document.getElementById('sidebar-create-announcement-form');
    const targetSelect = document.getElementById('sidebar-announcement-target');
    const teamGroup = document.getElementById('sidebar-announcement-team-group');

    if (!form || !targetSelect || !teamGroup || isSidebarCreateFormBound) return;

    // SHOW TEAM SELECT ONLY WHEN TARGET IS SPECIFIC TEAM.
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

      // CONVERT UI TARGET VALUES INTO API PAYLOAD VALUES.
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
        description: formData.get('content'),
        category: formData.get('category'),
        audience,
        team_id,
        admin_id: AppState.currentUser?.id ?? null
      };

      try {
        const response = await apiPost('/announcements/create', announcementData);
        console.log('✅ Announcement created successfully:', response);
        
        // PUSH NEW ANNOUNCEMENT INTO LOCAL STATE FOR INSTANT UI UPDATE.
        const newAnnouncement = response?.data?.[0] || response?.data;
        if (newAnnouncement) {
          AppState.announcements.push(adaptAnnouncementRow(newAnnouncement));
        } else {
          // IF RESPONSE HAS NO ITEM, CLEAR CACHE SO NEXT RENDER REFETCHES.
          AppState.announcements = [];
        }
        
        window.closeSidebarCreateAnnouncementModal();
        form.reset();
        
        // RE-RENDER SIDEBAR SO USER SEES THE NEW ITEM RIGHT AWAY.
        await renderPersistentAnnouncementsSidebar();
      } catch (error) {
        console.error('❌ Create announcement failed:', error);
        alert(error.message || 'Unable to create announcement');
      }
    });

    isSidebarCreateFormBound = true;
  }

  // GLOBAL OPEN/CLOSE FUNCTIONS FOR CREATE-ANNOUNCEMENT MODAL.
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

  // FIND CREATE BUTTONS IN PAGE WRAPPERS AND BIND CLICK HANDLERS.
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

  // RENDER THE PERSISTENT ANNOUNCEMENTS SIDEBAR LIST.
  async function renderPersistentAnnouncementsSidebar() {
    const list = document.getElementById('persistent-announcements-list');
    if (!list) return;

    // BASIC COLOR MAP PER ANNOUNCEMENT CATEGORY.
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
      date: (announcement.created_at || announcement.date)
        ? new Date(announcement.created_at || announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '',
      title: announcement.title || 'Untitled announcement',
      author: getAnnouncementAuthorLabel(announcement)
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

  // ONLY THESE PAGES USE THE PERSISTENT RIGHT SIDEBAR.
  function shouldUsePersistentSidebar(page) {
    return page !== 'login' && page !== 'schedule';
  }

  // SESSIONS PAGE ALREADY HAS ITS OWN LAYOUT, SO SKIP WRAPPING THERE.
  function shouldInjectSidebarWrapper(page) {
    if (page === 'sessions') return false;
    return shouldUsePersistentSidebar(page);
  }

  // WRAP A PAGE VIEW WITH THE SHARED ANNOUNCEMENTS SIDEBAR TEMPLATE.
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

  // INJECT SHARED MODAL COMPONENTS INTO DOCUMENT BODY IF MISSING.
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

  // EXPOSE CONTROLLER FUNCTIONS USED BY THE APP ROUTER.
  return {
    bindSidebarCreateAnnouncementButtons,
    injectSharedComponents,
    renderPersistentAnnouncementsSidebar,
    shouldInjectSidebarWrapper,
    shouldUsePersistentSidebar,
    wrapPageWithPersistentSidebar
  };
}
