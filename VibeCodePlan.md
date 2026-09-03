# VibeCodePlan – KolpingHaus Buchungssystem Erweiterung

## Übersicht

Dieser Plan beschreibt die technische Umsetzung aller neuen Anforderungen aus `Plan.md`.  
Da es sich weiterhin um einen **Prototyp ohne Backend** handelt, werden alle Daten in `localStorage` persistiert. Die Architektur wird aber so aufgebaut, dass ein späterer Umbau zu einer echten WebApp (mit REST-API / Datenbank) mit minimalem Aufwand möglich ist.

> **WICHTIG:** Es werden **ausschließlich kostenlose FullCalendar-Features** (v6.1.11 Standard-Bundle) verwendet. Alle benötigten Features (timeGridDay, dayGridWeek, dayGridMonth, eventContent, eventClick, datesSet, addEvent, getEvents) sind in der freien Version enthalten.

---

## Neue Dateistruktur

```
KolpingHaus/
├── index.html              (erweitert: Login-Screen, Floor-Buttons, Filter-Bar, Glocke)
├── style.css               (erweitert: neue UI-Komponenten)
├── footer.css              (unverändert)
├── gebaeudeplan.svg        (unverändert)
├── logo.png                (unverändert)
├── js/
│   ├── app.js              (NEU: Einstiegspunkt, Init-Logik)
│   ├── auth.js             (NEU: Login-System, Session, Rollen)
│   ├── store.js            (NEU: Daten-Layer, localStorage-Abstraktion)
│   ├── calendar-manager.js (Refactored aus calendar.js: FullCalendar-Logik)
│   ├── svg-renderer.js     (NEU: SVG-Darstellung, Floor-Filter, Farbgebung)
│   ├── modal.js            (NEU: Modal-Logik, Formular, Validierung)
│   ├── filter.js           (NEU: Filter-Logik nach Accounttyp)
│   └── activity.js         (NEU: Aktivitäten-Feed)
└── Plan.md / VibeCodePlan.md
```

> **TIPP:** Die Aufteilung in Module macht den späteren Umbau einfacher: `store.js` wird dann durch API-Calls ersetzt, `auth.js` bekommt ein echtes Auth-Backend – der Rest bleibt weitgehend gleich.

---

## 1. Daten-Layer (`store.js`) – Fundament für alles

### Zweck
Zentrale Abstraktionsschicht für alle Daten (Termine, Accounts, Aktivitäten). Im Prototyp: `localStorage`. Später: REST-API.

### Datenmodell

```javascript
// Ein Termin (Event)
{
  id: "evt-001",
  title: "Vorstandssitzung",                    // Event-Name/Titel
  start: "2026-09-03T10:00:00",                // ISO-String
  end: "2026-09-03T12:00:00",                  // ISO-String
  rooms: ["Hauptsaal", "Foyer"],               // IMMER Array (auch bei einem Raum)
  ansprechpartner: "Max Mustermann",            // Umbenannt von "Mieter"
  email: "max@example.com",                     // NEU (mind. eins von email/telefon)
  telefon: "0661-12345",                        // NEU (mind. eins von email/telefon)
  bestuhlung: "U-Form",                         // Standard | U-Form | Kino
  personenanzahl: 42,
  notizen: "Beamer benötigt",
  serientermin: false,
  vertrag: {                                    // NEU
    vorhanden: true,                            // Checkbox
    status: "gesendet"                          // "erstellt" | "gesendet" | "unterschrieben"
  },
  erstelltVon: "tim.mueller",                   // NEU: Username des Erstellers
  erstelltAm: "2026-09-01T14:30:00",           // NEU: Zeitstempel der Erstellung
  rolle: "stadt"                                // NEU: "stadt" | "gastro" (Rolle des Erstellers)
}
```

```javascript
// Ein Account
{
  username: "tim.mueller",
  passwort: "demo123",       // Im Prototyp: Klartext. Später: gehashtes PW + Backend-Auth
  name: "Tim Müller",        // Anzeigename
  rolle: "stadt"             // "stadt" | "gastro"
}
```

```javascript
// Eine Aktivität
{
  id: "act-001",
  typ: "erstellt",                              // "erstellt" | "bearbeitet" | "gelöscht"
  username: "tim.mueller",
  displayName: "Tim Müller",
  terminTitel: "Trainingsabend SKC",
  terminDatum: "2026-09-20",                    // Datum des Termins
  zeitstempel: "2026-09-10T12:00:00"            // Wann die Aktion stattfand
}
```

### API-Oberfläche von `store.js`

```javascript
// Termine
Store.getEvents()                    → Array<Event>
Store.getEvent(id)                   → Event | null
Store.addEvent(eventData)            → Event (mit generierter ID)
Store.updateEvent(id, eventData)     → Event
Store.deleteEvent(id)                → void

// Accounts (im Prototyp fest eingebaut, später via API)
Store.getAccounts()                  → Array<Account>
Store.authenticate(username, pw)     → Account | null

// Aktivitäten
Store.getActivities()                → Array<Activity> (sortiert, neueste zuerst)
Store.addActivity(activityData)      → void

// Initialisierung
Store.init()                         → void (lädt localStorage oder erzeugt Demo-Daten)
```

### Demo-Accounts (fest in `store.js`)

| Username         | Passwort  | Name            | Rolle  |
|------------------|-----------|-----------------|--------|
| `tim.mueller`    | `demo123` | Tim Müller      | stadt  |
| `anna.schmidt`   | `demo123` | Anna Schmidt    | stadt  |
| `mario.rossi`    | `demo123` | Mario Rossi     | gastro |
| `lisa.weber`     | `demo123` | Lisa Weber      | gastro |

---

## 2. Login-System (`auth.js`)

### UI-Änderungen in `index.html`

- **Login-Screen**: Neuer `<div id="login-screen">` der die gesamte App überlagert (z-index: 2000).
  - Einfaches Formular: Benutzername + Passwort + Login-Button.
  - Fehlermeldung bei ungültigen Daten.
  - Kein Registrierungs-Formular (Accounts werden im Prototyp fest definiert).

- **Header-Änderung**: Der bestehende User-Icon-Button im Header zeigt nach Login den eingeloggten Benutzernamen an. Klick darauf → Logout.

### Logik

```
1. Beim Laden: Prüfe ob Session in sessionStorage existiert
   → Ja: App direkt laden, Login-Screen ausblenden
   → Nein: Login-Screen anzeigen

2. Login-Button-Click:
   → Store.authenticate(username, passwort)
   → Erfolg: Session in sessionStorage speichern, Login-Screen ausblenden, App initialisieren
   → Fehler: Fehlermeldung anzeigen

3. Logout:
   → sessionStorage leeren
   → Login-Screen wieder anzeigen
```

### Rollen-Verhalten nach Login

| Aspekt | Stadt-Mitarbeiter | Gastro-Mitarbeiter |
|--------|-------------------|--------------------|
| Termine erstellen | ✅ | ✅ |
| Termine bearbeiten | ✅ (alle eigenen) | ✅ (nur eigene) |
| Termine löschen | ✅ (alle Termine) | ❌ |
| Standard-Filter nach Login | Nur Stadt-Termine | Alle Termine |
| Filter änderbar | ✅ | ✅ |
| Löschen-Button sichtbar | ✅ | ❌ |

---

## 3. Dynamische Stockwerk-Ansicht (`svg-renderer.js`)

### UI: 4 Buttons neben der SVG-Darstellung

Position: **Über dem SVG** als Button-Leiste im `.plan-container`.

```html
<div class="floor-buttons">
  <button class="floor-btn active" data-floor="all">Alle</button>
  <button class="floor-btn" data-floor="og">OG</button>
  <button class="floor-btn" data-floor="eg">EG</button>
  <button class="floor-btn" data-floor="ug">UG</button>
</div>
```

### Stockwerk-Zuordnung (Mapping)

```javascript
const FLOOR_ROOMS = {
  og: ['Kolpingzimmer', 'Gaalbernstube', 'Galerie'],
  eg: ['Landernau', 'Neustädt', 'Foyer', 'Gastätte', 'Hessisches Kegelspiel', 'Hauptsaal', 'Wintergarten'],
  ug: ['Kegelbahn 1', 'Kegelbahn 2']
};
```

### Technische Umsetzung

```
1. Beim Klick auf einen Floor-Button:
   a. CSS-Klasse "active" auf den geklickten Button setzen
   b. SVG-Gruppen ein-/ausblenden:
      → Jede Raum-Gruppe hat eine ID wie "Kolpingzimmer-Gruppe"
      → style.display = "none" für ausgeblendete Räume
      → style.display = "" für sichtbare Räume
   c. SVG-ViewBox dynamisch anpassen:
      → BoundingBox aller sichtbaren Gruppen berechnen
      → viewBox des Root-SVG-Elements setzen (mit 10px Padding)
      → So wird automatisch gezoomt auf die sichtbaren Räume
   d. updateSvgText() erneut aufrufen (nur Events für sichtbare Räume rendern)
```

> **HINWEIS:** Die bestehende Auto-Zoom-Logik (Zeilen 292–310 in `calendar.js`) wird in `svg-renderer.js` verallgemeinert, sodass sie für jede Stockwerk-Auswahl funktioniert.

### SVG-Gruppen-IDs (aus Analyse)

| Raum | SVG-Gruppen-ID |
|------|----------------|
| Kolpingzimmer | `Kolpingzimmer-Gruppe` |
| Gaalbernstube | `Gaalbernstube-Gruppe` |
| Galerie | `Galerie-Gruppe` |
| Landernau | `Landernau-Gruppe` |
| Neustadt | `Neustadt-Gruppe` |
| Foyer | `Foyer-Gruppe` |
| Gaststätte | `Gaststaette-Gruppe` |
| Hessisches Kegelspiel | `HessischesKegelspiel-Gruppe` |
| Hauptsaal | `Hauptsaal-Gruppe` |
| Wintergarten | `Wintergarten-Gruppe` |
| Kegelbahn 1 | `Kegelbahn1-Gruppe` |
| Kegelbahn 2 | `Kegelbahn2-Gruppe` |

> **ACHTUNG:** `Gaststaette-Gruppe` und `HessischesKegelspiel-Gruppe` sind in der SVG unter einer Elterngruppe `Gastro-Gruppe` zusammengefasst. Beim Filtern auf EG müssen beide individuell ein-/ausgeblendet werden, nicht die Elterngruppe, da sonst beide zusammen verschwinden.

---

## 4. Farbgebung nach Accounttyp

### Farbschema

| Rolle | Kalender-Farbe | SVG-Text-Farbe | Hex |
|-------|---------------|-----------------|-----|
| Stadt-Mitarbeiter | Blau | Blau | `#2b65a4` (Primärblau der Website) |
| Gastro-Mitarbeiter | Gelb | Dunkelgelb | `#f0c040` / `#d4a017` |

### Umsetzung im Kalender (FullCalendar)

```javascript
// In der Event-Erstellung / beim Laden:
calendar.addEvent({
  ...eventData,
  backgroundColor: eventData.rolle === 'stadt' ? '#2b65a4' : '#f0c040',
  borderColor:     eventData.rolle === 'stadt' ? '#1a497b' : '#d4a017',
  textColor:       eventData.rolle === 'stadt' ? '#ffffff' : '#333333',
});
```

FullCalendar unterstützt `backgroundColor`, `borderColor` und `textColor` als Standard-Properties (kostenlos).

### Umsetzung in der SVG-Darstellung

- Die Termin-Texte im SVG bekommen ebenfalls die entsprechende Farbe:
  ```javascript
  // Beim Rendern der Event-Texte in updateSvgText():
  tspan.setAttribute('fill', event.rolle === 'stadt' ? '#2b65a4' : '#d4a017');
  ```
- Die Raum-Rechtecke (`<rect>`) werden **nicht** eingefärbt (bleiben grau `#D9D9D9`), da mehrere Termine verschiedener Rollen im selben Raum sein können. Stattdessen signalisiert die **Textfarbe** den Accounttyp.

---

## 5. Filter-Funktion (`filter.js`)

### UI: Filter-Leiste

Position: **Über dem Kalender** (rechte Seite) als kleine Button-Gruppe.

```html
<div class="filter-bar">
  <span class="filter-label">Filter:</span>
  <button class="filter-btn active" data-filter="alle">Alle</button>
  <button class="filter-btn" data-filter="stadt">
    <span class="color-dot stadt"></span> Stadt
  </button>
  <button class="filter-btn" data-filter="gastro">
    <span class="color-dot gastro"></span> Gastro
  </button>
</div>
```

Die farbigen Punkte (`.color-dot`) zeigen visuell die Zuordnung Blau = Stadt, Gelb = Gastro.

### Logik

```
1. Aktiver Filter wird global gespeichert: currentFilter = "alle" | "stadt" | "gastro"

2. Bei Änderung des Filters:
   a. FullCalendar-Events filtern:
      → Alle Events durchgehen
      → event.display = 'none' wenn Event.rolle ≠ Filter (und Filter ≠ "alle")
      → event.display = 'auto' wenn Event.rolle == Filter (oder Filter == "alle")
      → FullCalendar re-rendert automatisch
   b. SVG-Darstellung aktualisieren:
      → updateSvgText() erneut aufrufen
      → Nur Events anzeigen die zum Filter passen

3. Default-Filter nach Login:
   → Stadt-Mitarbeiter: currentFilter = "stadt"
   → Gastro-Mitarbeiter: currentFilter = "alle"
```

> **HINWEIS:** FullCalendar Standard bietet `event.setProp('display', 'none')` und `event.setProp('display', 'auto')` – beides kostenlose Features. Damit können Events ein-/ausgeblendet werden ohne sie zu löschen.

---

## 6. Multi-Room-Termine

### Problem
Aktuell speichert `extendedProps.room` teilweise einen String, teilweise ein Array. Das ist inkonsistent.

### Lösung: Immer Array

```javascript
// Datenmodell: rooms ist IMMER ein Array
rooms: ["Hauptsaal", "Foyer"]
```

### UI-Änderung im Modal

Das bisherige `<select>` für den Raum wird durch **Checkboxen** ersetzt:

```html
<fieldset class="room-selection">
  <legend>Räume auswählen:</legend>
  <div class="room-checkboxes">
    <!-- Generiert aus rooms-Array, gruppiert nach Stockwerk -->
    <h4>OG</h4>
    <label><input type="checkbox" name="rooms" value="Kolpingzimmer"> Kolpingzimmer</label>
    <label><input type="checkbox" name="rooms" value="Gaalbernstube"> Gaalbernstube</label>
    <label><input type="checkbox" name="rooms" value="Galerie"> Galerie</label>
    <h4>EG</h4>
    <!-- ... alle EG-Räume -->
    <h4>UG</h4>
    <!-- ... alle UG-Räume -->
  </div>
</fieldset>
```

### Darstellung im Kalender

- Ein Multi-Room-Event wird als **ein einzelner Event** im Kalender angezeigt.
- Im `eventContent`-Hook werden alle Räume aufgelistet:
  ```
  10:00 - 12:00
  Große Firmenfeier
  Räume: Hauptsaal, Foyer, Gaststätte
  ```

### Darstellung in der SVG

- Der Event-Text wird in **jedem** der gebuchten Räume angezeigt.
- Gleiche Farbe (basierend auf Rolle) in allen Räumen → visueller Zusammenhang erkennbar.

---

## 7. Neue Termin-Eigenschaften (Modal-Überarbeitung)

### Überarbeitetes Modal-Formular

```
┌──────────────────────────────────────┐
│  Termin Details                   ✕  │
├──────────────────────────────────────┤
│                                      │
│  Titel / Veranstaltung:  [________]  │
│                                      │
│  ── Räume ──────────────────────     │
│  OG: ☐ Kolpingzimmer                │
│       ☐ Gaalbernstube                │
│       ☐ Galerie                      │
│  EG: ☐ Landernau    ☐ Neustadt      │
│       ☐ Foyer       ☐ Gaststätte    │
│       ☐ Hess.Kegelsp ☐ Hauptsaal   │
│       ☐ Wintergarten                 │
│  UG: ☐ Kegelbahn 1  ☐ Kegelbahn 2  │
│                                      │
│  Anfang:   [_____datetime-local____] │
│  Ende:     [_____datetime-local____] │
│                                      │
│  ── Ansprechpartner ────────────     │
│  Name:     [________________________]│
│  Email:    [________________________]│  ← mind. eins
│  Telefon:  [________________________]│  ← davon nötig
│                                      │
│  Bestuhlung:  [Standard ▾]          │
│  Personenanzahl: [____]             │
│                                      │
│  ── Vertrag ────────────────────     │
│  ☐ Vertrag vorhanden                │
│  Status: [erstellt ▾]  (disabled     │
│           wenn Checkbox nicht aktiv)  │
│                                      │
│  Notizen:                            │
│  [_________________________________]│
│  [_________________________________]│
│                                      │
│  ☐ Serientermin                      │
│                                      │
│  Erstellt von: Tim Müller            │  ← Nur Anzeige,
│  Erstellt am:  01.09.2026 14:30      │     nicht editierbar
│                                      │
│        [Löschen]  [Speichern]        │
│         (nur Stadt)                   │
└──────────────────────────────────────┘
```

### Feldänderungen im Detail

| Feld | Vorher | Nachher |
|------|--------|---------|
| Raum | `<select>` (einzeln) | Checkboxen (multi-select, nach Stockwerk gruppiert) |
| Mieter | `<input text>` | Umbenannt zu **Ansprechpartner** |
| Email | — | **NEU**: `<input type="email">` |
| Telefon | — | **NEU**: `<input type="tel">` |
| Vertrag vorhanden | — | **NEU**: `<input type="checkbox">` |
| Vertrag-Status | — | **NEU**: `<select>` mit "erstellt", "gesendet", "unterschrieben" (nur aktiv wenn Checkbox gesetzt) |
| Erstellt von | — | **NEU**: Automatisch, nur Anzeige |
| Erstellt am | — | **NEU**: Automatisch, nur Anzeige |
| Löschen-Button | — | **NEU**: Nur für Stadt-Mitarbeiter sichtbar |
| Titel | Wurde aus "Mieter" abgeleitet | **Eigenes Feld** für den Veranstaltungsnamen |

### Validierung beim Speichern

```
1. Mindestens ein Raum muss ausgewählt sein
2. Anfang muss gesetzt sein
3. Ende muss nach Anfang liegen (Default: Anfang + 1 Stunde)
4. Ansprechpartner-Name muss gesetzt sein
5. Mindestens Email ODER Telefon muss ausgefüllt sein
6. Wenn Vertrag-Checkbox aktiv → Status muss ausgewählt sein
```

### Automatische Felder

```javascript
// Beim Erstellen eines neuen Termins:
event.erstelltVon = currentUser.username;
event.erstelltAm = new Date().toISOString();
event.rolle = currentUser.rolle;
```

---

## 8. Löschen-Funktion

### Nur für Stadt-Mitarbeiter

- Im Modal erscheint ein **roter "Löschen"-Button** (nur wenn `currentUser.rolle === 'stadt'`).
- Vor dem Löschen: **Bestätigungsdialog** (`confirm("Termin wirklich löschen?")`).
- Nach Bestätigung:
  1. `Store.deleteEvent(id)` → Entfernt aus localStorage
  2. `calendar.getEventById(id).remove()` → Entfernt aus FullCalendar
  3. Aktivität loggen: `Store.addActivity({ typ: "gelöscht", ... })`
  4. Modal schließen
  5. SVG aktualisieren

---

## 9. Aktivitäten-Feature (`activity.js`)

### UI: Glocke im Header

```html
<!-- In .header-actions, vor dem User-Button -->
<div class="activity-wrapper">
  <button class="icon-btn" id="btn-activities">
    <!-- Glocken-SVG-Icon -->
    <span class="activity-badge" id="activity-badge" style="display:none;">3</span>
  </button>
  <div class="activity-dropdown" id="activity-dropdown" style="display:none;">
    <h3>Letzte Aktivitäten</h3>
    <ul id="activity-list">
      <!-- Dynamisch befüllt -->
    </ul>
  </div>
</div>
```

### Aktivitäten-Einträge

Format: **"{Name} hat den Termin {Titel} am {Termin-Datum} {Aktion} am {Aktions-Datum} um {Uhrzeit}."**

Beispiele:
- "Tim Müller hat den Termin **Trainingsabend SKC** am 20.09.2026 **bearbeitet** am 10.09. um 12:00 Uhr."
- "Anna Schmidt hat den Termin **Hochzeitsfeier** am 25.09.2026 **erstellt** am 08.09. um 09:15 Uhr."
- "Tim Müller hat den Termin **Vorstandssitzung** am 15.09.2026 **gelöscht** am 12.09. um 14:30 Uhr."

### Logik

```
1. Bei jeder Termin-Aktion (erstellen/bearbeiten/löschen):
   → Store.addActivity({
       typ: "erstellt" | "bearbeitet" | "gelöscht",
       username: currentUser.username,
       displayName: currentUser.name,
       terminTitel: event.title,
       terminDatum: event.start,
       zeitstempel: new Date().toISOString()
     })

2. Klick auf Glocke:
   → Dropdown toggle
   → Liste der letzten 20 Aktivitäten anzeigen (neueste zuerst)
   → Badge ausblenden

3. Badge:
   → Zeigt Anzahl neuer Aktivitäten seit letztem Öffnen
   → Gespeichert in sessionStorage: lastSeenActivityTimestamp
```

---

## 10. Implementierungs-Reihenfolge

Die Features bauen aufeinander auf. Empfohlene Reihenfolge:

### Phase 1: Fundament
1. **`store.js`** – Daten-Layer mit localStorage, Demo-Daten, Event-CRUD
2. **`auth.js`** + Login-UI – Login-Screen, Session-Management, Demo-Accounts
3. **`calendar-manager.js`** – Refactoring von `calendar.js`, Integration mit `store.js`

### Phase 2: Kern-Features
4. **Modal-Überarbeitung** (`modal.js`) – Neue Felder, Multi-Room-Checkboxen, Validierung, Löschen-Button
5. **Farbgebung** – Event-Farben nach Rolle im Kalender und SVG
6. **Multi-Room-Events** – Array-basierte Raumauswahl, Darstellung im Kalender und SVG

### Phase 3: UI-Erweiterungen
7. **Stockwerk-Buttons** (`svg-renderer.js`) – Floor-Filter mit ViewBox-Anpassung
8. **Filter-Funktion** (`filter.js`) – Rollen-Filter mit Default je nach Login-Rolle
9. **Aktivitäten-Feed** (`activity.js`) – Glocke, Dropdown, Logging

### Phase 4: Cleanup
10. **Bugfixes** – Tote `script.js`-Referenz entfernen, Raum-Namens-Inkonsistenzen dokumentieren
11. **Demo-Daten** aktualisieren – Realistische Testdaten mit Rollen-Zuordnung
12. **Testing** – Manuelles Durchspielen aller User-Flows

---

## 11. Offene Fragen

Bevor ich mit der Implementierung beginne, möchte ich folgende Punkte klären:

1. **Serientermine**: Die Checkbox "Serientermin" existiert bereits im Formular, aber es gibt keine Logik dafür. Soll das Feature jetzt implementiert werden (Wiederholungsmuster wie wöchentlich/monatlich), oder bleibt es erstmal als Platzhalter?

2. **Termin-Bearbeitung durch andere Rollen**: Darf ein Stadt-Mitarbeiter auch Termine von Gastro-Mitarbeitern bearbeiten? Oder kann jeder nur seine eigenen Termine bearbeiten?

3. **Überlappungs-Prüfung**: Soll das System prüfen, ob ein Raum zu einem Zeitpunkt bereits belegt ist und ggf. eine Warnung anzeigen? Oder dürfen Räume doppelt gebucht werden?

4. **Raum-Namens-Schreibweisen**: Im Code stehen aktuell "Neustädt" und "Gastätte" (vermutlich Tippfehler). Sollen die korrekten Namen "Neustadt" und "Gaststätte" verwendet werden?

---

## 12. Technische Hinweise

### FullCalendar Standard-Features (kostenlos, die wir nutzen)

| Feature | Verwendung | Status |
|---------|-----------|--------|
| `timeGridDay` View | Tagesansicht | ✅ Kostenlos |
| `dayGridWeek` View | Wochenansicht | ✅ Kostenlos |
| `dayGridMonth` View | Monatsansicht | ✅ Kostenlos |
| `eventContent` Hook | Custom Event-Rendering | ✅ Kostenlos |
| `eventClick` Hook | Modal öffnen | ✅ Kostenlos |
| `datesSet` Hook | SVG aktualisieren | ✅ Kostenlos |
| `addEvent()` | Events hinzufügen | ✅ Kostenlos |
| `getEvents()` | Events abrufen | ✅ Kostenlos |
| `event.remove()` | Events löschen | ✅ Kostenlos |
| `event.setProp('display', ...)` | Events filtern | ✅ Kostenlos |
| `backgroundColor/borderColor` | Event-Farben | ✅ Kostenlos |
| Locale `de` | Deutsche Sprache | ✅ Kostenlos |

### Nicht verwendete Premium-Features

- ❌ Timeline View (Resource-basiert) – Premium
- ❌ Resource DayGrid/TimeGrid – Premium
- ❌ Event Drag & Resize (Resize ist frei, aber nicht zwingend nötig)

### localStorage-Struktur

```
localStorage:
  "kolpinghaus_events"     → JSON-Array aller Termine
  "kolpinghaus_accounts"   → JSON-Array aller Accounts (Demo-Daten)
  "kolpinghaus_activities" → JSON-Array aller Aktivitäten
```

### Spätere Backend-Migration

Für die Umstellung auf eine echte WebApp müsste nur `store.js` angepasst werden:

```javascript
// Vorher (Prototyp):
Store.getEvents = () => JSON.parse(localStorage.getItem('kolpinghaus_events')) || [];

// Nachher (WebApp):
Store.getEvents = async () => {
  const response = await fetch('/api/events');
  return response.json();
};
```

Alle anderen Module bleiben gleich, nur die Aufrufe werden `async/await`.
