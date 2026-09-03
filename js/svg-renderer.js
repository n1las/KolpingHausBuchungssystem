/**
 * SVG Renderer module for KolpingHaus application.
 * Handles SVG floor plan display, floor switching, and event text rendering.
 */
window.SvgRenderer = (function() {
  let svgDoc = null;
  let svgRoot = null;
  let svgObjectEl = null;
  let currentFloor = 'all';
  let initialized = false;

  // Room name → SVG Rect ID mapping (handles naming inconsistencies in the SVG)
  const ROOM_TO_RECT = {
    'Kolpingzimmer': 'Kolpingzimmer-Rect',
    'Gaalbernstube': 'Gaalbernstube-Rect',
    'Galerie': 'Gallerie-Rect',
    'Landernau': 'Landernau-Rect',
    'Neustadt': 'Neustadt-Rect',
    'Foyer': 'Foyer-Rect',
    'Gaststätte': 'Gaststaette-Rect',
    'Hessisches Kegelspiel': 'HessischesKegelspiel-Rect',
    'Hauptsaal': 'Hauptsaal-Rect',
    'Wintergarten': 'Wintergarten-Rect',
    'Kegelbahn 1': 'Kegelbahn1-Rect',
    'Kegelbahn 2': 'Kegelbahn2-Rect'
  };

  // Room name → SVG Group ID mapping
  const ROOM_TO_GROUP = {
    'Kolpingzimmer': 'Kolpingzimmer-Gruppe',
    'Gaalbernstube': 'Gaalbernstube-Gruppe',
    'Galerie': 'Galerie-Gruppe',
    'Landernau': 'Landernau-Gruppe',
    'Neustadt': 'Neustadt-Gruppe',
    'Foyer': 'Foyer-Gruppe',
    'Gaststätte': 'Gaststaette-Gruppe',
    'Hessisches Kegelspiel': 'HessischesKegelspiel-Gruppe',
    'Hauptsaal': 'Hauptsaal-Gruppe',
    'Wintergarten': 'Wintergarten-Gruppe',
    'Kegelbahn 1': 'Kegelbahn1-Gruppe',
    'Kegelbahn 2': 'Kegelbahn2-Gruppe'
  };

  // Floor → Room mapping
  const FLOOR_ROOMS = {
    og: ['Kolpingzimmer', 'Gaalbernstube', 'Galerie'],
    eg: ['Landernau', 'Neustadt', 'Foyer', 'Gaststätte', 'Hessisches Kegelspiel', 'Hauptsaal', 'Wintergarten'],
    ug: ['Kegelbahn 1', 'Kegelbahn 2']
  };

  const ALL_ROOMS = [...FLOOR_ROOMS.og, ...FLOOR_ROOMS.eg, ...FLOOR_ROOMS.ug];

  /** Get list of rooms visible for the current floor selection */
  function getVisibleRooms() {
    if (currentFloor === 'all') return ALL_ROOMS;
    return FLOOR_ROOMS[currentFloor] || ALL_ROOMS;
  }

  /** Show/hide SVG groups and recalculate viewBox */
  function applyFloorVisibility() {
    if (!svgDoc) return;

    const visibleRooms = getVisibleRooms();

    // Show/hide each room group individually
    ALL_ROOMS.forEach(room => {
      const groupId = ROOM_TO_GROUP[room];
      const group = svgDoc.getElementById(groupId);
      if (group) {
        group.style.display = visibleRooms.includes(room) ? '' : 'none';
      }
    });

    // Ensure parent group Gastro-Gruppe is visible when any of its children are
    const gastroParent = svgDoc.getElementById('Gastro-Gruppe');
    if (gastroParent) {
      const gastroChildrenVisible = visibleRooms.includes('Gaststätte') || visibleRooms.includes('Hessisches Kegelspiel');
      gastroParent.style.display = gastroChildrenVisible ? '' : 'none';
    }

    // Recalculate viewBox to zoom to visible rooms
    recalculateViewBox();
  }

  /** Recalculate SVG viewBox to fit all visible room groups */
  function recalculateViewBox() {
    if (!svgDoc || !svgRoot) return;

    const visibleRooms = getVisibleRooms();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let foundAny = false;

    visibleRooms.forEach(room => {
      const groupId = ROOM_TO_GROUP[room];
      const group = svgDoc.getElementById(groupId);
      if (group && group.style.display !== 'none') {
        try {
          const bbox = group.getBBox();
          if (bbox.width > 0 && bbox.height > 0) {
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
            foundAny = true;
          }
        } catch (e) { /* getBBox can fail on hidden elements */ }
      }
    });

    if (foundAny) {
      const padding = 15;
      svgRoot.setAttribute('viewBox',
        `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`
      );
    }
  }

  /** Clear all dynamically injected event text from the SVG */
  function clearAllText() {
    if (!svgDoc) return;
    ALL_ROOMS.forEach(room => {
      const rectId = ROOM_TO_RECT[room];
      const textEl = svgDoc.getElementById(rectId + '-events');
      if (textEl) {
        textEl.textContent = '';
      }
    });
  }

  /**
   * Render event text inside SVG room rectangles.
   * Ported from the original calendar.js updateSvgText() with enhancements for
   * multi-room, role-based colors, and floor/filter awareness.
   */
  function renderEventText(events, currentFilter) {
    if (!svgDoc) return;
    clearAllText();

    const visibleRooms = getVisibleRooms();

    // Group events by room
    const roomEvents = {};
    visibleRooms.forEach(room => { roomEvents[room] = []; });

    events.forEach(event => {
      // Apply filter
      if (currentFilter !== 'alle' && event.rolle !== currentFilter) return;

      const eventRooms = Array.isArray(event.rooms) ? event.rooms : [event.rooms];
      eventRooms.forEach(room => {
        if (visibleRooms.includes(room)) {
          roomEvents[room].push(event);
        }
      });
    });

    // Render text for each room
    visibleRooms.forEach(room => {
      const roomEvts = roomEvents[room];
      if (!roomEvts || roomEvts.length === 0) return;

      const rectId = ROOM_TO_RECT[room];
      const rect = svgDoc.getElementById(rectId);
      if (!rect) return;

      const rectBbox = rect.getBBox();
      const maxWidth = rectBbox.width - 8;

      // Sort events by start time
      roomEvts.sort((a, b) => new Date(a.start) - new Date(b.start));

      // Get or create text element
      let textEl = svgDoc.getElementById(rectId + '-events');
      if (!textEl) {
        textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('id', rectId + '-events');
        textEl.setAttribute('font-family', 'Arial, sans-serif');
        textEl.setAttribute('font-size', '11');
        textEl.setAttribute('dominant-baseline', 'hanging');
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('x', rectBbox.x + rectBbox.width / 2);
        rect.parentNode.appendChild(textEl);
      }
      textEl.textContent = '';
      textEl.setAttribute('x', rectBbox.x + rectBbox.width / 2);

      // Build lines with word wrapping
      const allTspans = [];
      const fontSize = 11;
      const lineHeight = fontSize * 1.2;

      roomEvts.forEach((event, idx) => {
        const startD = new Date(event.start);
        const endD = new Date(event.end);
        const pad = n => n < 10 ? '0' + n : n;
        const timeStr = `${pad(startD.getHours())}:${pad(startD.getMinutes())} - ${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
        const displayText = `${timeStr} ${event.title}`;
        const color = event.rolle === 'stadt' ? '#2b65a4' : '#d4a017';

        // Add separator between events
        if (idx > 0) {
          const sepTspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          sepTspan.setAttribute('x', rectBbox.x + rectBbox.width / 2);
          sepTspan.setAttribute('dy', lineHeight + 'px');
          sepTspan.setAttribute('fill', '#ccc');
          sepTspan.setAttribute('font-size', '6');
          sepTspan.textContent = '───────';
          allTspans.push(sepTspan);
        }

        // Word wrap the display text
        const words = displayText.split(' ');
        let currentLine = '';

        words.forEach(word => {
          const testLine = currentLine ? currentLine + ' ' + word : word;

          // Create a temp tspan to measure
          const tempTspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tempTspan.textContent = testLine;
          tempTspan.setAttribute('font-size', fontSize);
          textEl.appendChild(tempTspan);
          const width = tempTspan.getComputedTextLength();
          textEl.removeChild(tempTspan);

          if (width > maxWidth && currentLine) {
            // Current line is full, create tspan for it
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', rectBbox.x + rectBbox.width / 2);
            tspan.setAttribute('dy', allTspans.length === 0 ? '0' : lineHeight + 'px');
            tspan.setAttribute('fill', color);
            tspan.textContent = currentLine;
            allTspans.push(tspan);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });

        // Push remaining text
        if (currentLine) {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', rectBbox.x + rectBbox.width / 2);
          tspan.setAttribute('dy', allTspans.length === 0 ? '0' : lineHeight + 'px');
          tspan.setAttribute('fill', color);
          tspan.textContent = currentLine;
          allTspans.push(tspan);
        }
      });

      // Calculate vertical centering
      const totalHeight = allTspans.length * lineHeight;
      const startY = rectBbox.y + (rectBbox.height - totalHeight) / 2;

      // Apply all tspans
      allTspans.forEach((tspan, i) => {
        if (i === 0) {
          tspan.setAttribute('dy', '0');
        }
        textEl.appendChild(tspan);
      });

      // Set starting Y position
      textEl.setAttribute('y', startY);
    });
  }

  return {
    /**
     * Initialize the SVG renderer.
     * @param {HTMLObjectElement} objectEl - The SVG <object> element
     */
    init: function(objectEl) {
      svgObjectEl = objectEl;

      const doInit = () => {
        svgDoc = svgObjectEl.contentDocument;
        if (!svgDoc) return;
        svgRoot = svgDoc.querySelector('svg');
        if (!svgRoot) return;
        initialized = true;
        applyFloorVisibility();
      };

      // SVG may already be loaded or not
      if (svgObjectEl.contentDocument && svgObjectEl.contentDocument.querySelector('svg')) {
        doInit();
      } else {
        svgObjectEl.addEventListener('load', doInit);
      }
    },

    /**
     * Update the SVG display with event data.
     * @param {Array} events - Array of store-format event objects
     * @param {string} currentFilter - Current filter: 'alle', 'stadt', or 'gastro'
     */
    updateDisplay: function(events, currentFilter) {
      if (!initialized) return;
      renderEventText(events, currentFilter);
    },

    /**
     * Set the visible floor and update the display.
     * @param {string} floor - 'all', 'og', 'eg', or 'ug'
     */
    setFloor: function(floor) {
      currentFloor = floor;
      if (initialized) {
        applyFloorVisibility();
      }
    },

    /**
     * Get the currently selected floor.
     * @returns {string} Current floor ('all', 'og', 'eg', 'ug')
     */
    getCurrentFloor: function() {
      return currentFloor;
    }
  };
})();
