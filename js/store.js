/**
 * Data layer for KolpingHaus application.
 * Abstracts localStorage access and handles data initialization.
 */
window.Store = (function() {
  const EVENTS_KEY = 'kolpinghaus_events';
  const ACCOUNTS_KEY = 'kolpinghaus_accounts';
  const ACTIVITIES_KEY = 'kolpinghaus_activities';

  const ROOMS = [
    'Kolpingzimmer', 'Gaalbernstube', 'Galerie', 'Landernau', 
    'Neustadt', 'Foyer', 'Gaststätte', 'Hessisches Kegelspiel', 
    'Hauptsaal', 'Wintergarten', 'Kegelbahn 1', 'Kegelbahn 2'
  ];

  const DEMO_ACCOUNTS = [
    { username: "tim.mueller", passwort: "demo123", name: "Tim Müller", rolle: "stadt" },
    { username: "anna.schmidt", passwort: "demo123", name: "Anna Schmidt", rolle: "stadt" },
    { username: "mario.rossi", passwort: "demo123", name: "Mario Rossi", rolle: "gastro" },
    { username: "lisa.weber", passwort: "demo123", name: "Lisa Weber", rolle: "gastro" }
  ];

  function generateId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  }

  function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function createDemoData() {
    saveToStorage(ACCOUNTS_KEY, DEMO_ACCOUNTS);
    saveToStorage(ACTIVITIES_KEY, []);

    const pad = n => n < 10 ? '0' + n : n;
    const now = new Date();
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    function makeDate(dayOffset, hour, minute) {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, minute || 0, 0, 0);
      return d;
    }

    const createdAt = toISO(now);

    // Realistic demo events spread across rooms, floors, roles, and days
    const demoEvents = [
      { title: 'Vorstandssitzung Kolpingwerk', rooms: ['Kolpingzimmer'], day: 0, sh: 9, eh: 12, ap: 'Hans Meier', email: 'meier@kolping.de', tel: '0661-1001', rolle: 'stadt', user: 0, vertrag: { vorhanden: true, status: 'unterschrieben' }, pers: 15, best: 'U-Form' },
      { title: 'Mittagsessen Seniorengruppe', rooms: ['Gaststätte'], day: 0, sh: 11, eh: 14, ap: 'Claudia Stein', email: '', tel: '0661-2002', rolle: 'gastro', user: 2, pers: 35, best: 'Standard' },
      { title: 'Ausstellung Kunstverein', rooms: ['Galerie'], day: 0, sh: 14, eh: 18, ap: 'Petra Wolf', email: 'wolf@kunstverein.de', tel: '', rolle: 'stadt', user: 1, pers: 50 },
      { title: 'Trainingsabend SKC', rooms: ['Kegelbahn 1', 'Kegelbahn 2'], day: 0, sh: 18, eh: 21, ap: 'Thomas Berger', email: 'berger@skc.de', tel: '0661-3003', rolle: 'stadt', user: 0, pers: 20 },
      { title: 'Hochzeitsfeier Schmidt', rooms: ['Hauptsaal', 'Foyer', 'Wintergarten'], day: 1, sh: 14, eh: 22, ap: 'Julia Schmidt', email: 'julia@schmidt.de', tel: '0170-1234567', rolle: 'stadt', user: 1, vertrag: { vorhanden: true, status: 'gesendet' }, pers: 120, best: 'Kino' },
      { title: 'Frühschoppen Stammtisch', rooms: ['Gaststätte'], day: 1, sh: 10, eh: 13, ap: 'Karl Braun', email: '', tel: '0661-4004', rolle: 'gastro', user: 2, pers: 25 },
      { title: 'Bürgerversammlung', rooms: ['Hauptsaal'], day: 2, sh: 18, eh: 21, ap: 'Bürgermeister Weber', email: 'weber@huenfeld.de', tel: '0661-5005', rolle: 'stadt', user: 0, pers: 200, best: 'Kino', vertrag: { vorhanden: false, status: '' } },
      { title: 'Kochkurs Italienisch', rooms: ['Gaststätte', 'Hessisches Kegelspiel'], day: 2, sh: 16, eh: 20, ap: 'Mario Rossi', email: 'mario@rossi.de', tel: '', rolle: 'gastro', user: 2, pers: 15, best: 'U-Form' },
      { title: 'Schulung Digitalisierung', rooms: ['Landernau'], day: 3, sh: 9, eh: 16, ap: 'Dr. Anna Fuchs', email: 'fuchs@digital.de', tel: '0661-6006', rolle: 'stadt', user: 1, pers: 30, best: 'Kino' },
      { title: 'Weinprobe Rheingau', rooms: ['Gaalbernstube'], day: 3, sh: 19, eh: 22, ap: 'Lisa Weber', email: 'lisa@weber.de', tel: '0661-7007', rolle: 'gastro', user: 3, pers: 20, best: 'U-Form', vertrag: { vorhanden: true, status: 'erstellt' } },
      { title: 'Kinderbetreuung Ferienprogramm', rooms: ['Neustadt', 'Foyer'], day: 4, sh: 8, eh: 13, ap: 'Sarah Hoffmann', email: 'hoffmann@jugend.de', tel: '', rolle: 'stadt', user: 0, pers: 40 },
      { title: 'Abschlussfeier Realschule', rooms: ['Hauptsaal', 'Foyer', 'Gaststätte', 'Wintergarten'], day: 4, sh: 17, eh: 22, ap: 'Direktor Müller', email: 'mueller@realschule.de', tel: '0661-8008', rolle: 'stadt', user: 1, pers: 180, best: 'Kino', vertrag: { vorhanden: true, status: 'unterschrieben' } },
      { title: 'Kegelabend Feuerwehr', rooms: ['Kegelbahn 1'], day: 5, sh: 19, eh: 22, ap: 'Wehrführer Koch', email: '', tel: '0661-9009', rolle: 'stadt', user: 0, pers: 12 },
      { title: 'Sonntagsbrunch', rooms: ['Gaststätte', 'Wintergarten'], day: 5, sh: 10, eh: 14, ap: 'Lisa Weber', email: 'lisa@weber.de', tel: '0661-7007', rolle: 'gastro', user: 3, pers: 60, best: 'Standard' },
      { title: 'Vereinssitzung Gesangverein', rooms: ['Kolpingzimmer'], day: 6, sh: 19, eh: 21, ap: 'Helmut Richter', email: 'richter@gesangverein.de', tel: '', rolle: 'stadt', user: 0, pers: 25, best: 'U-Form' },
      { title: 'Catering Firmenjubiläum', rooms: ['Hauptsaal', 'Foyer'], day: 6, sh: 12, eh: 18, ap: 'Mario Rossi', email: 'mario@rossi.de', tel: '0661-3030', rolle: 'gastro', user: 2, pers: 80, vertrag: { vorhanden: true, status: 'gesendet' } },
    ];

    const events = demoEvents.map(de => ({
      id: generateId('evt'),
      title: de.title,
      start: toISO(makeDate(de.day, de.sh)),
      end: toISO(makeDate(de.day, de.eh)),
      rooms: de.rooms,
      ansprechpartner: de.ap,
      email: de.email || '',
      telefon: de.tel || '',
      bestuhlung: de.best || 'Standard',
      personenanzahl: de.pers || 0,
      notizen: '',
      serientermin: false,
      vertrag: de.vertrag || { vorhanden: false, status: '' },
      erstelltVon: DEMO_ACCOUNTS[de.user].username,
      erstelltAm: createdAt,
      rolle: de.rolle
    }));

    saveToStorage(EVENTS_KEY, events);
  }

  return {
    init: function() {
      if (!localStorage.getItem(EVENTS_KEY) || !localStorage.getItem(ACCOUNTS_KEY)) {
        createDemoData();
      }
    },

    getEvents: function() {
      return getFromStorage(EVENTS_KEY);
    },

    getEvent: function(id) {
      const events = this.getEvents();
      return events.find(e => e.id === id) || null;
    },

    addEvent: function(data) {
      const events = this.getEvents();
      const newEvent = { ...data, id: generateId('evt') };
      events.push(newEvent);
      saveToStorage(EVENTS_KEY, events);
      return newEvent;
    },

    updateEvent: function(id, data) {
      const events = this.getEvents();
      const index = events.findIndex(e => e.id === id);
      if (index !== -1) {
        events[index] = { ...events[index], ...data };
        saveToStorage(EVENTS_KEY, events);
        return events[index];
      }
      return null;
    },

    deleteEvent: function(id) {
      let events = this.getEvents();
      events = events.filter(e => e.id !== id);
      saveToStorage(EVENTS_KEY, events);
    },

    authenticate: function(username, password) {
      const accounts = this.getAccounts();
      const account = accounts.find(a => a.username === username && a.passwort === password);
      return account || null;
    },

    getAccounts: function() {
      return getFromStorage(ACCOUNTS_KEY);
    },

    getActivities: function() {
      const acts = getFromStorage(ACTIVITIES_KEY);
      acts.sort((a, b) => new Date(b.zeitstempel) - new Date(a.zeitstempel));
      return acts;
    },

    addActivity: function(data) {
      const activities = this.getActivities();
      const newActivity = { ...data, id: generateId('act') };
      activities.push(newActivity);
      saveToStorage(ACTIVITIES_KEY, activities);
    },

    checkRoomConflict: function(rooms, startISO, endISO, excludeEventId = null) {
      const events = this.getEvents();
      const start1 = new Date(startISO).getTime();
      const end1 = new Date(endISO).getTime();

      for (const event of events) {
        if (excludeEventId && event.id === excludeEventId) continue;
        
        const start2 = new Date(event.start).getTime();
        const end2 = new Date(event.end).getTime();

        // Check time overlap
        if (start1 < end2 && start2 < end1) {
          // Check room overlap
          for (const room of rooms) {
            if (event.rooms.includes(room)) {
              const formattedDate = new Date(event.start).toLocaleDateString('de-DE');
              const formattedStart = new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
              const formattedEnd = new Date(event.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
              return {
                conflict: true,
                message: `Raum '${room}' ist am ${formattedDate} von ${formattedStart} bis ${formattedEnd} bereits belegt ('${event.title}').`
              };
            }
          }
        }
      }

      return { conflict: false, message: '' };
    }
  };
})();
