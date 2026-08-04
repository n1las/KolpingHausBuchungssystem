const rooms = ['Kolpingzimmer', 'Gaalbernstube', 'Galerie', 'Landernau', 'Neustädt', 'Foyer', 'Gastätte', 'Hessisches Kegelspiel', 'Hauptsaal',
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
    let currentEvent = null;

    // --- TAG 0 (Heute) - Alle Räume gleichzeitig belegt (10:00–12:00) ---
    addTestEvent("Vorstandssitzung Kolpingwerk",  0, 10, 12, 'Kolpingzimmer');
    addTestEvent("Besprechung Stadtrat",          0, 10, 12, 'Gaalbernstube');
    addTestEvent("Kunstausstellung Aufbau",       0, 10, 12, 'Galerie');
    addTestEvent("Erste-Hilfe-Kurs DRK",         0, 10, 12, 'Landernau');
    addTestEvent("Vereinssitzung Kolpingsfamilie",0, 10, 12, 'Neustädt');
    addTestEvent("Informationsstand Bürger",      0, 10, 12, 'Foyer');
    addTestEvent("Mittagstisch Senioren",         0, 10, 12, 'Gastätte');
    addTestEvent("Trainingsabend SKC",            0, 10, 12, 'Hessisches Kegelspiel');
    addTestEvent("Chorprobe Liederkranz",         0, 10, 12, 'Hauptsaal');
    addTestEvent("Kaffeerunde Kolpingsfamilie",   0, 10, 12, 'Wintergarten');
    addTestEvent("Ligaspiel Kegelclub",           0, 10, 12, 'Kegelbahn 1');
    addTestEvent("Juniorentraining Kegeln",       0, 10, 12, 'Kegelbahn 2');

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
    addTestEvent("Workshop Nachmittag", 1, 14, 18, 'Gaalbernstube');

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
    addTestEvent("Abschlussfeier", 6, 10, 14, 'Gastätte');
    addTestEvent("Abschlussfeier", 6, 10, 14, 'Wintergarten');
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
            currentEvent = info.event;
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

        const roomToRectMapping = {
            'Kolpingzimmer': 'Kolpingzimmer-Rect',
            'Gaalbernstube': 'Gaalbernstube-Rect',
            'Galerie': 'Gallerie-Rect',
            'Landernau': 'Landernau-Rect',
            'Neustädt': 'Neustadt-Rect',
            'Foyer': 'Foyer-Rect',
            'Gastätte': 'Gaststaette-Rect',
            'Hessisches Kegelspiel': 'HessischesKegelspiel-Rect',
            'Hauptsaal': 'Hauptsaal-Rect',
            'Wintergarten': 'Wintergarten-Rect',
            'Kegelbahn 1': 'Kegelbahn1-Rect',
            'Kegelbahn 2': 'Kegelbahn2-Rect'
        };

        // Initialize and clear all new text elements
        Object.values(roomToRectMapping).forEach(rectId => {
            const rectEl = svgDoc.getElementById(rectId);
            if (!rectEl) return;

            const textId = rectId + '-events';
            let textEl = svgDoc.getElementById(textId);

            if (!textEl) {
                const rectBbox = rectEl.getBBox();
                textEl = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
                textEl.setAttribute('id', textId);
                textEl.setAttribute('x', rectBbox.x + rectBbox.width / 2);
                textEl.setAttribute('font-family', 'Arial, sans-serif');
                textEl.setAttribute('font-size', '12px');
                textEl.setAttribute('fill', 'black');
                textEl.setAttribute('text-anchor', 'middle');
                textEl.setAttribute('dominant-baseline', 'hanging');
                rectEl.parentNode.appendChild(textEl);
            }

            // Clear content (so nothing is displayed on empty days or week/month views)
            textEl.innerHTML = '';
            textEl.textContent = '';
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
            const rectId = roomToRectMapping[room];
            if (!rectId) return;

            const textId = rectId + '-events';
            const textEl = svgDoc.getElementById(textId);
            const rectEl = svgDoc.getElementById(rectId);
            if (!textEl || !rectEl) return;
            const rectBbox = rectEl.getBBox();

            const events = eventsByRoom[room];
            events.sort((a, b) => a.start - b.start);

            const fontSize = 12; // px
            const lineHeightEm = 1.2;
            const maxWidth = Math.max(0, rectBbox.width - 8); // 8px padding
            const startX = textEl.getAttribute('x');
            let totalLines = 0;

            events.forEach((event) => {
                const startTime = event.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                const endTime = event.end ? event.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
                const timeStr = endTime ? `${startTime} - ${endTime}` : startTime;

                const fullText = `${timeStr} ${event.title}`;
                const words = fullText.split(' ');

                let currentLine = words[0];
                let currentTspan = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                currentTspan.setAttribute('x', startX);
                currentTspan.textContent = currentLine;
                textEl.appendChild(currentTspan);
                totalLines++;

                for (let i = 1; i < words.length; i++) {
                    const word = words[i];
                    currentTspan.textContent = currentLine + ' ' + word;

                    if (currentTspan.getComputedTextLength() > maxWidth) {
                        currentTspan.textContent = currentLine;
                        currentLine = word;
                        currentTspan = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        currentTspan.setAttribute('x', startX);
                        currentTspan.textContent = currentLine;
                        textEl.appendChild(currentTspan);
                        totalLines++;
                    } else {
                        currentLine += ' ' + word;
                    }
                }
            });

            const totalTextHeight = totalLines * fontSize * lineHeightEm;
            const startY = rectBbox.y + (rectBbox.height - totalTextHeight) / 2;
            textEl.setAttribute('y', startY);

            const tspans = textEl.querySelectorAll('tspan');
            tspans.forEach((tspan, index) => {
                tspan.setAttribute('dy', index === 0 ? '0' : `${lineHeightEm}em`);
            });
        });
    }

    // Ensure it runs once the SVG is completely loaded
    const svgObject = document.getElementById('mein-plan');
    if (svgObject) {
        svgObject.addEventListener('load', function() {
            const svgDoc = svgObject.contentDocument;
            if (svgDoc) {
                const targetGroup = svgDoc.getElementById('KolpingHaus-BigGruppe');
                if (targetGroup) {
                    const bbox = targetGroup.getBBox();
                    const padding = 10; // Adds a little bit of space around the group
                    const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`;
                    svgDoc.documentElement.setAttribute('viewBox', viewBox);
                }
            }

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
        const raum = document.getElementById('termin-raum').value;
        const anfang = document.getElementById('termin-anfang').value;
        const ende = document.getElementById('termin-ende').value;
        const mieter = document.getElementById('termin-mieter').value || 'Neuer Termin';

        if (!raum || !anfang) {
            alert('Bitte Raum und Startzeit angeben.');
            return;
        }

        const startDate = new Date(anfang);
        const endDate = ende ? new Date(ende) : new Date(startDate.getTime() + 60*60*1000); // 1hr fallback

        if (currentEvent) {
            currentEvent.setProp('title', mieter);
            currentEvent.setExtendedProp('room', raum);
            currentEvent.setDates(startDate, endDate);
        } else {
            calendar.addEvent({
                id: String(itemId++),
                title: mieter,
                start: startDate,
                end: endDate,
                extendedProps: { room: raum }
            });
        }

        formInputs.forEach(input => input.disabled = true);
        btnSpeichern.style.display = 'none';
        btnBearbeiten.style.display = 'inline-block';
        modal.style.display = 'none';

        if (calendar.view) {
            updateSvgText({ view: calendar.view });
        }
    }

    const btnTerminHinzufuegen = document.getElementById('btn-termin-hinzufuegen');
    if (btnTerminHinzufuegen) {
        btnTerminHinzufuegen.onclick = function() {
            currentEvent = null;
            modal.style.display = 'block';
            document.getElementById('termin-form').reset();
            formInputs.forEach(input => input.disabled = false);
            btnBearbeiten.style.display = 'none';
            btnSpeichern.style.display = 'inline-block';
        };
    }
});