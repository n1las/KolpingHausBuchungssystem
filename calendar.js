const rooms = ['Kolpingzimmer', 'Gaalberstube', 'Galerie', 'Landernau', 'Neustädt', 'Foyer', 'Gastätte', 'Hessisches Kegelspiel', 'Hauptsaal',
    'Wintergarten', 'Kegelbahn 1', 'Kegelbahn 2'];
document.addEventListener('DOMContentLoaded', function() {

    // Dynamisch die Räume in das Dropdown des Modals laden
    const raumSelect = document.getElementById('termin-raum');
    rooms.forEach(room => {
        let option = document.createElement('option');
        option.value = room;
        option.textContent = room;
        raumSelect.appendChild(option);
    });

    const calendarEl = document.getElementById('calendar');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate test events for a "regular busy day" mapped to standard FullCalendar events
    const testEvents = [];
    let itemId = 1;

    // --- TAG 0 (Heute) - Behalte die Original-Daten ---
    const start = new Date(today);
    start.setHours(10, 0, 0, 0); // All start at 10:00

    const end = new Date(start);
    end.setHours(12, 0, 0, 0); // All end at 12:00

    for (let i = 1; i <= 12; i++) {
        testEvents.push({
            id: itemId++,
            title: `Termin ${i}`,
            start: start,
            end: end,
            extendedProps: {
                room: rooms[i - 1] // Jeder Test-Termin bekommt genau einen eindeutigen Raum zugewiesen
            }
        });
    }

    // Hilfsfunktion: Fügt einen Termin für einen Raum an einem bestimmten Tag hinzu
    function addTestEvent(title, dayOffset, startHour, endHour, room) {
        const eventStart = new Date(today);
        eventStart.setDate(today.getDate() + dayOffset);
        eventStart.setHours(startHour, 0, 0, 0);

        const eventEnd = new Date(today);
        eventEnd.setDate(today.getDate() + dayOffset);
        eventEnd.setHours(endHour, 0, 0, 0);

        testEvents.push({
            id: itemId++,
            title: title,
            start: eventStart,
            end: eventEnd,
            extendedProps: {
                room: room // Speichert den Raum für das Modal
            }
        });
    }

    // --- TAG 1 (Morgen) ---
    // 3 Termine gleichzeitig, danach 2 Termine gleichzeitig
    addTestEvent("Konferenz Vormittag", 1, 9, 13, 'Hauptsaal');
    addTestEvent("Konferenz Vormittag", 1, 9, 13, 'Foyer');
    addTestEvent("Konferenz Vormittag", 1, 9, 13, 'Galerie');
    addTestEvent("Workshop Nachmittag", 1, 14, 18, 'Kolpingzimmer');
    addTestEvent("Workshop Nachmittag", 1, 14, 18, 'Gaalberstube');

    // --- TAG 2 ---
    addTestEvent("Vereinsfeier", 2, 17, 22, 'Gastätte');
    addTestEvent("Vereinsfeier", 2, 17, 22, 'Wintergarten');
    addTestEvent("Kegelturnier", 2, 18, 22, 'Kegelbahn 1');
    addTestEvent("Kegelturnier", 2, 18, 22, 'Kegelbahn 2');

    // --- TAG 3 ---
    addTestEvent("Große Firmenfeier", 3, 14, 22, 'Hauptsaal');
    addTestEvent("Große Firmenfeier", 3, 14, 22, 'Foyer');
    addTestEvent("Große Firmenfeier", 3, 14, 22, 'Gastätte');
    addTestEvent("Große Firmenfeier", 3, 14, 22, 'Wintergarten');

    // --- TAG 4 bis 6 ---
    addTestEvent("Schulung", 4, 8, 16, 'Landernau');
    addTestEvent("Schulung", 4, 8, 16, 'Neustädt');
    addTestEvent("Vorstandssitzung", 4, 18, 20, ['Hessisches Kegelspiel']);
    addTestEvent("Hochzeit", 5, 12, 22, 'Hauptsaal');
    addTestEvent("Hochzeit", 5, 12, 22, 'Foyer');
    addTestEvent("Hochzeit", 5, 12, 22, 'Gastätte');
    addTestEvent("Kinderbetreuung", 5, 14, 19, ['Kolpingzimmer']);
    addTestEvent("Frühschoppen", 6, 10, 14, 'Gastätte');
    addTestEvent("Frühschoppen", 6, 10, 14, 'Wintergarten');
    addTestEvent("Ausstellung", 6, 10, 18, 'Galerie');
    addTestEvent("Ausstellung", 6, 10, 18, 'Foyer');

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
        },
        datesSet: function(info) {
            updateSvgText(info);
        },
        eventContent: function(info) {
            // Passt das Aussehen der Termine im Kalender an, um den Raum anzuzeigen
            return {
                html: `<div class="fc-event-time">${info.timeText}</div>
                       <div class="fc-event-title">${info.event.title}</div>
                       <div class="fc-event-room" style="font-size: 0.85em; font-weight: bold; margin-top: 2px;">Raum: ${info.event.extendedProps.room}</div>`
            };
        },
        eventClick: function(info) {
            const modal = document.getElementById('termin-modal');
            modal.style.display = 'block';

            // Helper Function: Formats date objects for datetime-local input types
            const toLocalIsoString = (date) => {
                if (!date) return "";
                const pad = n => n < 10 ? '0' + n : n;
                return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' +
                       pad(date.getHours()) + ':' + pad(date.getMinutes());
            };

            // Populate fields with FullCalendar actual time and dummy test data
            document.getElementById('termin-raum').value = info.event.extendedProps.room;
            document.getElementById('termin-anfang').value = toLocalIsoString(info.event.start);
            document.getElementById('termin-ende').value = toLocalIsoString(info.event.end || info.event.start);
            document.getElementById('termin-bestuhlung').value = "U-Form"; // Test Data
            document.getElementById('termin-notizen').value = "//Prechter \nEs wird nur die Gastätte benötigt\n//Peronal\n Hauptsaal benötigt hälfte U-Bestuhulng andere Hälfte Kino Bestuhlung  " + info.event.title; // Test Data
            document.getElementById('termin-mieter').value = "Max Mustermann"; // Test Data
            document.getElementById('termin-personenanzahl').value = 42; // Test Data
            document.getElementById('termin-serientermin').checked = true; // Test Data

            // Ensure fields are locked initially when the modal is opened
            const formInputs = document.querySelectorAll('#termin-form input, #termin-form select, #termin-form textarea');
            formInputs.forEach(input => input.disabled = true);
            document.getElementById('btn-bearbeiten').style.display = 'inline-block';
            document.getElementById('btn-speichern').style.display = 'none';
        }
    });

    calendar.render();

    function updateSvgText(info) {
        const svgObject = document.getElementById('mein-plan');
        if (!svgObject || !svgObject.contentDocument) return;
        const svgDoc = svgObject.contentDocument;

        const feldToRectMapping = {
            'Kolpoingzimmer-Feld': 'Kolpingzimmer-Rect',
            'Gaalberstube-Feld': 'Gaalberstube-Rect',
            'Galerie-Feld': 'Gallerie-Rect',
            'Landernau-Feld': 'Landernau-Rect',
            'Neustadt-Feld': 'Neustadt-Rect',
            'Foyer-Feld': 'Foyer-Rect',
            'Gasstaette-Feld': 'Gaststaette-Rect',
            'HessichesKegelspiel-Feld': 'HessischesKegelspiel-Rect',
            'Hauptsaal-Feld': 'Hauptsaal-Rect',
            'Wintergarten-Feld': 'Wintergarten-Rect',
            'Kegelbahn1-Feld': 'Kegelbahn1-Rect',
            'Kegelbahn2-Feld': 'Kegelbahn2-Rect'
        };

        const roomMapping = {
            'Kolpingzimmer': 'Kolpoingzimmer-Feld',
            'Gaalberstube': 'Gaalberstube-Feld',
            'Galerie': 'Galerie-Feld',
            'Landernau': 'Landernau-Feld',
            'Neustädt': 'Neustadt-Feld',
            'Foyer': 'Foyer-Feld',
            'Gastätte': 'Gasstaette-Feld',
            'Hessisches Kegelspiel': 'HessichesKegelspiel-Feld',
            'Hauptsaal': 'Hauptsaal-Feld',
            'Wintergarten': 'Wintergarten-Feld',
            'Kegelbahn 1': 'Kegelbahn1-Feld',
            'Kegelbahn 2': 'Kegelbahn2-Feld'
        };

        // Initialize and clear all text elements
        Object.values(roomMapping).forEach(feldId => {
            let feldEl = svgDoc.getElementById(feldId);
            if (!feldEl) return;

            // If the element is still a path, replace it dynamically with a text element
            if (feldEl.tagName.toLowerCase() === 'path') {
                const rectId = feldToRectMapping[feldId];
                const rectEl = svgDoc.getElementById(rectId);
                if (!rectEl) return;

                const rectBbox = rectEl.getBBox();
                const textEl = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
                textEl.setAttribute('id', feldId);
                textEl.setAttribute('x', rectBbox.x + rectBbox.width / 2);
                textEl.setAttribute('font-family', 'Arial, sans-serif');
                textEl.setAttribute('font-size', '12px');
                textEl.setAttribute('fill', 'black');
                textEl.setAttribute('text-anchor', 'middle');
                textEl.setAttribute('dominant-baseline', 'hanging');
                feldEl.parentNode.replaceChild(textEl, feldEl);
                feldEl = textEl;
            }

            // Clear content (so nothing is displayed on empty days or week/month views)
            feldEl.innerHTML = '';
            feldEl.textContent = '';
        });

        // Only display text for the current day view
        if (info.view.type !== 'timeGridDay') {
            return;
        }

        // Get events for the currently visible day
        const currentEvents = calendar.getEvents().filter(event => {
            return event.start < info.view.activeEnd && (event.end || event.start) >= info.view.activeStart;
        });

        const eventsByRoom = {};
        currentEvents.forEach(event => {
            let roomsForEvent = event.extendedProps.room;
            if (!roomsForEvent) return;
            if (!Array.isArray(roomsForEvent)) {
                roomsForEvent = [roomsForEvent];
            }
            roomsForEvent.forEach(r => {
                if (!eventsByRoom[r]) eventsByRoom[r] = [];
                eventsByRoom[r].push(event);
            });
        });

        // Add events to SVG
        Object.keys(eventsByRoom).forEach(room => {
            const feldId = roomMapping[room];
            if (!feldId) return;
            const textEl = svgDoc.getElementById(feldId);
            if (!textEl) return;

            const rectId = feldToRectMapping[feldId];
            const rectEl = svgDoc.getElementById(rectId);
            if (!rectEl) return;
            const rectBbox = rectEl.getBBox();

            const events = eventsByRoom[room];
            events.sort((a, b) => a.start - b.start);

            const fontSize = 12; // px
            const lineHeightEm = 1.2;
            const totalTextHeight = events.length * fontSize * lineHeightEm;

            const startY = rectBbox.y + (rectBbox.height - totalTextHeight) / 2;
            textEl.setAttribute('y', startY);

            const startX = textEl.getAttribute('x');

            events.forEach((event, index) => {
                const startTime = event.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                const endTime = event.end ? event.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
                const timeStr = endTime ? `${startTime} - ${endTime}` : startTime;

                const tspan = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('x', startX);
                tspan.setAttribute('dy', index === 0 ? '0' : `${lineHeightEm}em`);
                tspan.textContent = `${timeStr} ${event.title}`;
                textEl.appendChild(tspan);
            });
        });
    }

    // Ensure it runs once the SVG is completely loaded
    const svgObject = document.getElementById('mein-plan');
    if (svgObject) {
        svgObject.addEventListener('load', function() {
            if (calendar.view) {
                updateSvgText({ view: calendar.view });
            }
        });
    }

    // --- Event Listeners for the modal ---
    const modal = document.getElementById('termin-modal');
    const closeBtn = document.querySelector('.close-btn');
    const btnBearbeiten = document.getElementById('btn-bearbeiten');
    const btnSpeichern = document.getElementById('btn-speichern');
    const formInputs = document.querySelectorAll('#termin-form input, #termin-form select, #termin-form textarea');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    btnBearbeiten.onclick = function() {
        formInputs.forEach(input => input.disabled = false);
        btnBearbeiten.style.display = 'none';
        btnSpeichern.style.display = 'inline-block';
    }

    btnSpeichern.onclick = function() {
        formInputs.forEach(input => input.disabled = true);
        btnSpeichern.style.display = 'none';
        btnBearbeiten.style.display = 'inline-block';
    }
});