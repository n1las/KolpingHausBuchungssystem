# Plan: Verbesserung der Testdaten in `calendar.js`

## Analyse des bestehenden Codes

### Problem
In `calendar.js` (Zeilen 31–41) wird für **TAG 0 (Heute)** eine `for`-Schleife verwendet, die alle 12 Räume mit dem generischen Titel `Termin ${i}` (also „Termin 1" bis „Termin 12") befüllt:

```js
for (let i = 1; i <= 12; i++) {
    testEvents.push({
        id: itemId++,
        title: `Termin ${i}`,   // <-- Problem: nichts sagender Name
        start: start,
        end: end,
        extendedProps: {
            room: rooms[i - 1]
        }
    });
}
```

Alle 12 Räume haben dieselbe Startzeit (10:00) und Endzeit (12:00) – das ist für Testzwecke unrealistisch.

### Was ist schon gut (TAG 1–6)
Ab TAG 1 werden sprechende, reale Terminbezeichnungen verwendet:
- „Konferenz Vormittag", „Workshop Nachmittag"
- „Vereinsfeier", „Kegelturnier"
- „Große Firmenfeier", „Schulung", „Vorstandssitzung"
- „Hochzeit", „Kinderbetreuung", „Frühschoppen", „Ausstellung"

Diese Daten sind bereits gut und bleiben **unverändert**.

### Modal-Testdaten (Zeilen 147–151)
Beim Klick auf einen Termin werden im Modal folgende Testdaten befüllt:
- **Bestuhlung**: „U-Form" → bleibt, ist sinnvoll
- **Notizen**: Enthält `info.event.title` am Ende (wird durch bessere Titel automatisch besser)
- **Mieter**: „Max Mustermann" → bleibt
- **Personenanzahl**: 42 → bleibt
- **Serientermin**: true → bleibt

---

## Geplante Änderungen

### Ziel
Die `for`-Schleife für TAG 0 durch **12 individuelle, realistische Termineinträge** ersetzen – passend zum jeweiligen Raum des Kolpinghauses Hünfeld.

### Neue Termine für TAG 0 (Heute)

| # | Raum                  | Neuer Titel                    | Uhrzeit       |
|---|-----------------------|--------------------------------|---------------|
| 1 | Kolpingzimmer         | Vorstandssitzung Kolpingwerk   | 09:00–11:00   |
| 2 | Gaalbernstube         | Besprechung Stadtrat           | 10:00–12:00   |
| 3 | Galerie               | Kunstausstellung Aufbau        | 08:00–12:00   |
| 4 | Landernau             | Erste-Hilfe-Kurs               | 09:00–13:00   |
| 5 | Neustädt              | Vereinssitzung DRK             | 10:00–12:00   |
| 6 | Foyer                 | Informationsstand Bürger       | 09:00–17:00   |
| 7 | Gastätte              | Mittagstisch Senioren          | 11:30–14:00   |
| 8 | Hessisches Kegelspiel | Trainingsabend SKC             | 10:00–12:00   |
| 9 | Hauptsaal             | Chorprobe Liederkranz          | 09:30–11:30   |
|10 | Wintergarten          | Kaffeerunde Kolpingsfamilie    | 10:00–12:00   |
|11 | Kegelbahn 1           | Ligaspiel Kegelclub            | 10:00–12:00   |
|12 | Kegelbahn 2           | Juniorentraining Kegeln        | 10:00–12:00   |

### Art der Änderung
- Die `for`-Schleife (Zeilen 31–41) wird durch **12 einzelne `addTestEvent()`-Aufrufe** ersetzt (gleiche Struktur wie TAG 1–6).
- Uhrzeiten werden leicht variiert, um realistische Überschneidungen zu simulieren.
- Die Hilfsfunktion `addTestEvent()` wird **nicht verändert**.
- Alle Funktionen (Modal, SVG-Update, Kalender-Rendering) bleiben **vollständig unberührt**.

### Was sich NICHT ändert
- Keine Änderungen an der Logik
- Keine Änderungen an HTML oder CSS
- Keine Änderungen an den Terminen TAG 1–6
- Keine Änderungen an Modal-Feldern (Mieter, Bestuhlung etc.)
