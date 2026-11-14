# Termine aus dem Google Sheet

Die Website liest beim Bauen ein veröffentlichtes Google Sheet («Kalender») und zeigt dessen
Termine zusammen mit den Terminen aus `src/content/termine/` an (Code: `src/lib/termine.ts`).

## 1. Spalten im Sheet

Erste Zeile = Spaltennamen. Reihenfolge egal, Gross-/Kleinschreibung egal. Zusätzliche Spalten werden ignoriert.

| Spalte | Pflicht | Beispiel | Hinweise |
|---|---|---|---|
| `Datum` (oder `Von`) | ja | `16.11.2026` | auch `2026-11-16`, `16.11.26` oder `16.11.2026 19:30` |
| `Bis` | nein | `23.10.2026` | letzter Tag bei mehrtägigen Terminen. Alternativ beide Daten in der Zelle `Datum`: `22.10.2026 – 23.10.2026` oder `22.–23.10.2026` |
| `Titel` | ja | `Schlittschuh-Ausgabe` | auch `Termin`, `Anlass`, `Betreff` |
| `Uhrzeit` | nein | `19:30 Uhr` | Freitext; fehlt sie, wird eine Zeit aus dem Datum übernommen |
| `Standort` | nein | `Laubegg, Sonnenhof` | mehrere mit Komma trennen. Erlaubt: Laubegg, Laubeggstrasse, Sonnenhof, Wyssloch, Baumgarten, Egelsee, Schöngrün, Merzenacker, `Alle`. Leer = gilt für die ganze Schule |
| `Ort` | nein | `Aula Schulhaus Laubegg` | genauer Ort oder Treffpunkt |
| `Kategorie` | nein | `Sitzung` | Sitzung, Event, Schlittschuhverleih, Raus Laus, Elternbildung, Sicherheit; sonst «Sonstiges» |
| `Öffentlich` | nein | `nein` | `nein`/`intern` blendet den Termin auf der Website aus; leer = sichtbar |
| `Beschreibung` | nein | | kurzer Zusatztext, z. B. welcher Standort an welchem Tag |
| `Link` | nein | | z. B. Flyer oder Anmeldung |

Zeilen ohne Datum oder Titel werden übersprungen. Unbekannte Standorte werden beim Bauen im Protokoll gemeldet und ignoriert. Termine mit gleichem Datum und Titel wie
ein Termin aus der Website erscheinen nur einmal.

**Datenschutz:** Ein im Web veröffentlichtes Tabellenblatt kann jede Person mit dem Link lesen –
auch Zeilen mit `Öffentlich = nein`. Am besten ein eigenes Tabellenblatt «Website» anlegen, das nur
die öffentlichen Termine enthält, z. B. mit
`=QUERY(Kalender!A:H; "select * where F <> 'nein'"; 1)`, und nur dieses veröffentlichen.

## 2. Sheet veröffentlichen

In Google Sheets: *Datei → Freigeben → Im Web veröffentlichen* → Tabellenblatt wählen →
*Kommagetrennte Werte (.csv)* → *Veröffentlichen* → Link kopieren.

Den Link entweder in `src/site.config.ts` bei `TERMINE_SHEET_CSV_URL` eintragen oder in Netlify unter
*Site configuration → Environment variables* als `TERMINE_SHEET_CSV_URL` hinterlegen.

## 3. Website automatisch aktualisieren

Die Website liest das Sheet nur beim Bauen. Damit neue Termine erscheinen, stösst ein kleines
Google-Apps-Script einen Netlify-Build an. Jeder Build ist ein Deploy und verbraucht Netlify-Credits
(je nach Plan rund 15 pro Production-Deploy). Das Script baut deshalb **nur, wenn sich das Sheet geändert hat**.

1. Netlify: *Site configuration → Build & deploy → Build hooks → Add build hook* (Name «Google Sheet»),
   die angezeigte URL kopieren. Die URL nicht öffentlich teilen.
2. Im Sheet: *Erweiterungen → Apps Script*, diesen Code einfügen und beide URLs eintragen
   (`SHEET_CSV_URL` ist der Link aus Abschnitt 2):

```js
const NETLIFY_BUILD_HOOK = 'https://api.netlify.com/build_hooks/…';
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/…/pub?output=csv';

// Täglich: baut nur, wenn sich das veröffentlichte CSV geändert hat.
function websiteAktualisierenWennGeaendert() {
  const csv = UrlFetchApp.fetch(SHEET_CSV_URL).getContentText();
  const hash = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, csv));
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('csvHash') === hash) return;   // nichts Neues
  UrlFetchApp.fetch(NETLIFY_BUILD_HOOK, { method: 'post' });
  props.setProperty('csvHash', hash);
}

// Baut immer: für den Wochen-Trigger und das Menü «Website» im Sheet.
function websiteAktualisieren() {
  UrlFetchApp.fetch(NETLIFY_BUILD_HOOK, { method: 'post' });
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website')
    .addItem('Jetzt aktualisieren', 'websiteAktualisieren')
    .addToUi();
}
```

3. Links auf *Trigger* (Wecker-Symbol) → *Trigger hinzufügen*. Beim ersten Mal den Zugriff erlauben.
   Zwei Trigger anlegen:
   - `websiteAktualisierenWennGeaendert`, *Zeitgesteuert*, *Tagestimer*, z. B. 5–6 Uhr:
     neue oder geänderte Termine erscheinen am nächsten Morgen.
   - `websiteAktualisieren`, *Zeitgesteuert*, *Wochentimer*, z. B. Montag 5–6 Uhr:
     Die Seite entscheidet beim Bauen, welche Termine «aktuell» oder «vergangen» sind.
     Ohne Wochen-Build bleibt ein Termin nach seinem Datum sichtbar, bis jemand etwas ändert.

Das sind etwa 4 Deploys pro Monat plus einer pro tatsächliche Änderung im Sheet. Über das Menü «Website»
im Sheet lässt sich die Website auch sofort aktualisieren.

**Credits sparen:** Reine Doku-Änderungen (`CLAUDE.md`, `docs/`) mit `[skip ci]` in der Commit-Nachricht
pushen, dann überspringt Netlify den Build. Mehrere Änderungen in einem Commit bündeln.
