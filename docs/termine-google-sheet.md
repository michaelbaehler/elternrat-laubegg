# Termine aus dem Google Sheet

Die Website liest beim Bauen ein veröffentlichtes Google Sheet («Kalender») und zeigt dessen
Termine zusammen mit den Terminen aus `src/content/termine/` an (Code: `src/lib/termine.ts`).

## 1. Spalten im Sheet

Erste Zeile = Spaltennamen. Reihenfolge egal, Gross-/Kleinschreibung egal. Zusätzliche Spalten werden ignoriert.

| Spalte | Pflicht | Beispiel | Hinweise |
|---|---|---|---|
| `Datum` | ja | `16.11.2026` | auch `2026-11-16`, `16.11.26` oder `16.11.2026 19:30` |
| `Titel` | ja | `2. Elternratssitzung` | auch `Termin`, `Anlass`, `Betreff` |
| `Uhrzeit` | nein | `19:30 Uhr` | Freitext; fehlt sie, wird eine Zeit aus dem Datum übernommen |
| `Ort` | nein | `Aula Schulhaus Laubegg` | |
| `Kategorie` | nein | `Sitzung` | Sitzung, Event, Schlittschuhverleih, Raus Laus, Elternbildung, Sicherheit; sonst «Sonstiges» |
| `Öffentlich` | nein | `nein` | `nein`/`intern` blendet den Termin auf der Website aus; leer = sichtbar |
| `Beschreibung` | nein | | kurzer Zusatztext |
| `Link` | nein | | z. B. Flyer oder Anmeldung |

Zeilen ohne Datum oder Titel werden übersprungen. Termine mit gleichem Datum und Titel wie
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

Die Website liest das Sheet nur beim Bauen. Damit neue Termine erscheinen, lässt ein kleines
Google-Apps-Script die Website regelmässig neu bauen:

1. Netlify: *Site configuration → Build & deploy → Build hooks → Add build hook* (Name «Google Sheet»),
   die angezeigte URL kopieren. Die URL nicht öffentlich teilen.
2. Im Sheet: *Erweiterungen → Apps Script*, diesen Code einfügen und die URL eintragen:

```js
const NETLIFY_BUILD_HOOK = 'https://api.netlify.com/build_hooks/…';

function websiteAktualisieren() {
  UrlFetchApp.fetch(NETLIFY_BUILD_HOOK, { method: 'post' });
}

// Menü «Website» → «Jetzt aktualisieren» im Sheet
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website')
    .addItem('Jetzt aktualisieren', 'websiteAktualisieren')
    .addToUi();
}
```

3. Links auf *Trigger* (Wecker-Symbol) → *Trigger hinzufügen* → Funktion `websiteAktualisieren`,
   Ereignisquelle *Zeitgesteuert*, *Tagestimer*, z. B. 5–6 Uhr. Beim ersten Mal den Zugriff erlauben.

Danach ist die Website jeden Morgen aktuell; über das Menü «Website» geht es auch sofort.
