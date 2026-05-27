document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate test events for a "regular busy day" mapped to standard FullCalendar events
    const testEvents = [];
    let itemId = 1;

    const start = new Date(today);
    start.setHours(10, 0, 0, 0); // All start at 10:00

    const end = new Date(start);
    end.setHours(12, 0, 0, 0); // All end at 12:00

    for (let i = 1; i <= 12; i++) {
        testEvents.push({
            id: itemId++,
            title: `Termin ${i}`,
            start: start,
            end: end
        });
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'de',
        initialView: 'timeGridDay',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,dayGridWeek,dayGridMonth'
        },
        slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        slotMinTime: '06:00:00', // Start calendar at 6 AM
        slotMaxTime: '22:00:00', // End calendar at 10 PM
        events: testEvents,
        slotEventOverlap: false, // Prevents visual overlapping and puts them neatly side-by-side
        views: {
            dayGrid: {
                dayMaxEvents: 0, // Hides individual events and groups them
                moreLinkText: function(n) {
                    return n === 1 ? '1 Termin' : n + ' Termine';
                }
            }
        }
    });

    calendar.render();
});