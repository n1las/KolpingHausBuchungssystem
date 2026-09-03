/**
 * App module for KolpingHaus Buchungssystem.
 * Main entry point that wires all modules together.
 */
window.App = (function() {

  /** Main initialization – called on DOMContentLoaded */
  function init() {
    // 1. Initialize data layer and auth
    Store.init();
    Auth.init();

    // 2. Set up login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (Auth.login(username, password)) {
          // Hide login, show app
          document.getElementById('login-screen').style.display = 'none';
          document.getElementById('app-container').style.display = 'block';
          if (errorEl) errorEl.style.display = 'none';
          initApp();
        } else {
          if (errorEl) errorEl.style.display = 'block';
        }
      });
    }

    // 3. Check for existing session
    if (Auth.isLoggedIn()) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-container').style.display = 'block';
      initApp();
    } else {
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('app-container').style.display = 'none';
    }
  }

  /** Initialize the full application after successful login */
  function initApp() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Update header user display
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) userDisplay.textContent = user.name;

    // Logout handler
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        Auth.logout();
        // Reload to reset all state cleanly
        window.location.reload();
      });
    }

    // Default filter: Stadt sees only Stadt, Gastro sees all
    const defaultFilter = user.rolle === 'stadt' ? 'stadt' : 'alle';

    // Initialize Activity feed
    Activity.init();

    // Initialize Filter with default and change handler
    Filter.init(defaultFilter, (newFilter) => {
      CalendarManager.applyFilter(newFilter);
      refreshSvg();
    });

    // Initialize Modal
    Modal.init({
      onSave: handleSave,
      onDelete: handleDelete,
      currentUserRole: user.rolle
    });

    // Initialize Calendar
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
      CalendarManager.init(calendarEl, {
        onEventClick: handleEventClick,
        onDateChange: handleDateChange
      });

      // Load events from store and apply initial filter
      CalendarManager.loadEvents(Store.getEvents());
      CalendarManager.applyFilter(defaultFilter);
    }

    // Initialize SVG Renderer
    const svgEl = document.getElementById('mein-plan');
    if (svgEl) {
      SvgRenderer.init(svgEl);
    }

    // Floor button handlers
    document.querySelectorAll('.floor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const floor = e.currentTarget.getAttribute('data-floor');
        SvgRenderer.setFloor(floor);
        refreshSvg();
      });
    });

    // "Termin hinzufügen" button
    const btnAdd = document.getElementById('btn-termin-hinzufuegen');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        Modal.openForCreate();
      });
    }

    // Initial SVG render (with small delay to allow SVG load)
    setTimeout(refreshSvg, 200);
  }

  /**
   * Handle save from the modal.
   * Checks for room conflicts, then creates or updates the event.
   */
  function handleSave(formData) {
    // Check for room conflicts
    const conflictCheck = Store.checkRoomConflict(
      formData.rooms,
      formData.start,
      formData.end,
      formData.eventId || null
    );

    if (conflictCheck.conflict) {
      alert('Raumkonflikt: ' + conflictCheck.message);
      return; // Don't close modal – let user fix the issue
    }

    const currentUser = Auth.getCurrentUser();

    if (formData.eventId) {
      // EDITING an existing event – preserve original creation metadata
      const existing = Store.getEvent(formData.eventId);
      if (!existing) return;

      const updateData = {
        title: formData.title,
        rooms: formData.rooms,
        start: formData.start,
        end: formData.end,
        ansprechpartner: formData.ansprechpartner,
        email: formData.email,
        telefon: formData.telefon,
        bestuhlung: formData.bestuhlung,
        personenanzahl: formData.personenanzahl,
        vertrag: formData.vertrag,
        notizen: formData.notizen,
        serientermin: formData.serientermin,
        // Preserve original metadata
        erstelltVon: existing.erstelltVon,
        erstelltAm: existing.erstelltAm,
        rolle: existing.rolle
      };

      const updatedEvent = Store.updateEvent(formData.eventId, updateData);
      CalendarManager.updateEvent(updatedEvent);
      Activity.log('bearbeitet', formData.title, formData.start);

    } else {
      // CREATING a new event
      const newData = {
        title: formData.title,
        rooms: formData.rooms,
        start: formData.start,
        end: formData.end,
        ansprechpartner: formData.ansprechpartner,
        email: formData.email,
        telefon: formData.telefon,
        bestuhlung: formData.bestuhlung,
        personenanzahl: formData.personenanzahl,
        vertrag: formData.vertrag,
        notizen: formData.notizen,
        serientermin: formData.serientermin,
        erstelltVon: currentUser.username,
        erstelltAm: new Date().toISOString(),
        rolle: currentUser.rolle
      };

      const createdEvent = Store.addEvent(newData);
      CalendarManager.addEvent(createdEvent);
      Activity.log('erstellt', formData.title, formData.start);
    }

    Modal.close();
    refreshSvg();
  }

  /** Handle delete from the modal */
  function handleDelete(eventId) {
    const event = Store.getEvent(eventId);
    if (!event) return;

    Store.deleteEvent(eventId);
    CalendarManager.removeEvent(eventId);
    Activity.log('gelöscht', event.title, event.start);
    Modal.close();
    refreshSvg();
  }

  /** Handle event click from the calendar */
  function handleEventClick(eventObj) {
    Modal.openForView(eventObj);
  }

  /** Handle date/view change in the calendar */
  function handleDateChange(info) {
    refreshSvg();
  }

  /**
   * Refresh the SVG display with current events, filter, and view.
   * Only renders event text in the Day view (timeGridDay).
   */
  function refreshSvg() {
    if (!window.SvgRenderer) return;

    // Only render events in day view
    const currentView = CalendarManager.getCurrentView();
    if (currentView !== 'timeGridDay') {
      SvgRenderer.updateDisplay([], 'alle'); // Clear SVG text
      return;
    }

    const currentFilter = Filter.getCurrentFilter();
    const range = CalendarManager.getVisibleDateRange();

    // Get events from store and filter by visible date range
    let events = Store.getEvents();
    if (range) {
      events = events.filter(e => {
        const eventStart = new Date(e.start);
        const eventEnd = new Date(e.end);
        return eventStart < range.end && eventEnd > range.start;
      });
    }

    SvgRenderer.updateDisplay(events, currentFilter);
  }

  return { init };
})();

// Bootstrap the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
