document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');

  // Generate 12 appointments at the EXACT same time for May 24th
  const exampleEvents = [];
  for (let i = 0; i < 12; i++) {
    exampleEvents.push({
      id: `appointment-${i + 1}`,
      title: `Appointment ${i + 1}`,
      start: '2026-05-24T08:00:00',
      end: '2026-05-24T12:00:00',
    });
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'de',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    themeSystem: 'bootstrap5',
    initialView: 'timeGridDay',
    initialDate: '2026-05-24',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth'
    },
    events: exampleEvents,
  });

  calendar.render();
});