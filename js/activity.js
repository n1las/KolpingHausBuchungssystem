/**
 * Activity feed module for KolpingHaus application.
 * Manages the notification bell and dropdown.
 */
window.Activity = (function() {
  const LAST_SEEN_KEY = 'kolpinghaus_last_seen_activity';
  
  function updateBadge() {
    const activities = window.Store.getActivities();
    const lastSeenStr = sessionStorage.getItem(LAST_SEEN_KEY);
    const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
    
    const newCount = activities.filter(a => new Date(a.zeitstempel).getTime() > lastSeen).length;
    
    const badge = document.getElementById('activity-badge');
    if (badge) {
      if (newCount > 0) {
        badge.textContent = newCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  return {
    init: function() {
      const btn = document.getElementById('btn-activities');
      const dropdown = document.getElementById('activity-dropdown');
      
      if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
          if (isHidden) {
            dropdown.style.display = 'block';
            sessionStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
            updateBadge();
          } else {
            dropdown.style.display = 'none';
          }
        });

        document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            dropdown.style.display = 'none';
          }
        });
      }
      
      this.refreshDropdown();
    },

    log: function(type, eventTitle, eventDate) {
      const user = window.Auth.getCurrentUser();
      if (!user) return;

      const pad = n => n < 10 ? '0'+n : n;
      const now = new Date();
      const zeitstempel = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const activityData = {
        typ: type,
        username: user.username,
        displayName: user.name,
        terminTitel: eventTitle,
        terminDatum: eventDate,
        zeitstempel: zeitstempel
      };
      
      window.Store.addActivity(activityData);
      this.refreshDropdown();
    },

    refreshDropdown: function() {
      const list = document.getElementById('activity-list');
      if (!list) return;
      
      list.innerHTML = '';
      const activities = window.Store.getActivities().slice(0, 20); // Last 20
      
      if (activities.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Keine Aktivitäten vorhanden.';
        list.appendChild(li);
      } else {
        activities.forEach(act => {
          const li = document.createElement('li');
          const d = new Date(act.zeitstempel);
          const dateStr = d.toLocaleDateString('de-DE');
          const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          
          li.textContent = `${act.displayName} hat den Termin '${act.terminTitel}' am ${act.terminDatum} ${act.typ} (am ${dateStr} um ${timeStr}).`;
          list.appendChild(li);
        });
      }
      
      updateBadge();
    }
  };
})();
