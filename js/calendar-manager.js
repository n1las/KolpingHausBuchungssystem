/**
 * Calendar Manager for KolpingHaus Buchungssystem
 * Wraps FullCalendar logic.
 */
window.CalendarManager = (function() {
  let calendar = null;

  function storeEventToFcEvent(storeEvent) {
    const bgColor = storeEvent.rolle === 'stadt' ? '#2b65a4' : '#f0c040';
    const borderColor = storeEvent.rolle === 'stadt' ? '#1a497b' : '#d4a017';
    const textColor = storeEvent.rolle === 'stadt' ? '#ffffff' : '#333333';

    return {
      id: storeEvent.id,
      title: storeEvent.title,
      start: storeEvent.start,
      end: storeEvent.end,
      backgroundColor: bgColor,
      borderColor: borderColor,
      textColor: textColor,
      extendedProps: {
        rooms: storeEvent.rooms || [],
        ansprechpartner: storeEvent.ansprechpartner,
        email: storeEvent.email,
        telefon: storeEvent.telefon,
        bestuhlung: storeEvent.bestuhlung,
        personenanzahl: storeEvent.personenanzahl,
        notizen: storeEvent.notizen,
        serientermin: storeEvent.serientermin,
        vertrag: storeEvent.vertrag,
        erstelltVon: storeEvent.erstelltVon,
        erstelltAm: storeEvent.erstelltAm,
        rolle: storeEvent.rolle
      }
    };
  }

  function init(calendarEl, { onEventClick, onDateChange }) {
    calendar = new FullCalendar.Calendar(calendarEl, {
      locale: 'de',
      initialView: 'timeGridDay',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,dayGridWeek,dayGridMonth'
      },
      slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      slotEventOverlap: false,
      dayMaxEvents: 0,
      datesSet: function(info) {
        if (onDateChange) onDateChange(info);
      },
      eventClick: function(info) {
        if (onEventClick) {
          const pad = n => n < 10 ? '0' + n : n;
          const toLocalISO = (d) => {
            if (!d) return null;
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
          };
          const storeFormat = {
            id: info.event.id,
            title: info.event.title,
            start: toLocalISO(info.event.start),
            end: toLocalISO(info.event.end),
            ...info.event.extendedProps
          };
          onEventClick(storeFormat);
        }
      },
      eventContent: function(info) {
        const roomsList = info.event.extendedProps.rooms ? info.event.extendedProps.rooms.join(', ') : '';
        return {
          html: `<div class="fc-event-time">${info.timeText}</div>
                 <div class="fc-event-title">${info.event.title}</div>
                 <div class="fc-event-room" style="font-size: 0.85em; font-weight: bold; margin-top: 2px;">Räume: ${roomsList}</div>`
        };
      }
    });

    calendar.render();
  }

  function getCalendar() {
    return calendar;
  }

  function loadEvents(storeEvents) {
    if (!calendar) return;
    calendar.removeAllEvents();
    storeEvents.forEach(storeEvent => {
      calendar.addEvent(storeEventToFcEvent(storeEvent));
    });
  }

  function addEvent(storeEvent) {
    if (!calendar) return;
    calendar.addEvent(storeEventToFcEvent(storeEvent));
  }

  function updateEvent(storeEvent) {
    if (!calendar) return;
    const event = calendar.getEventById(storeEvent.id);
    if (event) {
      event.remove();
      calendar.addEvent(storeEventToFcEvent(storeEvent));
    }
  }

  function removeEvent(eventId) {
    if (!calendar) return;
    const event = calendar.getEventById(eventId);
    if (event) {
      event.remove();
    }
  }

  function applyFilter(filter) {
    if (!calendar) return;
    const events = calendar.getEvents();
    events.forEach(event => {
      const rolle = event.extendedProps.rolle;
      if (filter === 'alle' || filter === rolle) {
        event.setProp('display', 'auto');
      } else {
        event.setProp('display', 'none');
      }
    });
  }

  function getVisibleDateRange() {
    if (!calendar) return null;
    return {
      start: calendar.view.activeStart,
      end: calendar.view.activeEnd
    };
  }

  function getCurrentView() {
    if (!calendar) return null;
    return calendar.view.type;
  }

  return {
    init,
    getCalendar,
    loadEvents,
    addEvent,
    updateEvent,
    removeEvent,
    applyFilter,
    getVisibleDateRange,
    getCurrentView
  };
})();
