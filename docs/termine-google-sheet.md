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
`=QUERY(Kalender!A:J; "select * where H is null or (H <> 'nein' and H <> 'intern')"; 1)`
(Spalte H = `Öffentlich`; leere Zellen gelten als sichtbar), und nur dieses veröffentlichen.

## 2. Sheet veröffentlichen

In Google Sheets: *Datei → Freigeben → Im Web veröffentlichen* → Tabellenblatt wählen →
*Kommagetrennte Werte (.csv)* → *Veröffentlichen* → Link kopieren.

Den Link entweder in `src/site.config.ts` bei `TERMINE_SHEET_CSV_URL` eintragen oder in Netlify unter
*Site configuration → Environment variables* als `TERMINE_SHEET_CSV_URL` hinterlegen.

## 3. Website aktualisieren (auf Anfrage)

Die Website liest das Sheet nur beim Bauen. Aktuell wird **nicht automatisch** synchronisiert: Wer Termine im
Sheet geändert hat, stösst den Build selbst an. Jeder Build ist ein Deploy und verbraucht Netlify-Credits
(je nach Plan rund 15 pro Production-Deploy), deshalb gibt es bewusst keinen Timer.

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

3. Beim ersten Mal den Zugriff erlauben. Danach erscheint im Sheet das Menü «Website»; ein Klick auf
   «Jetzt aktualisieren» baut die Seite neu. Es dauert ein paar Minuten, bis die Änderung live ist.

**Später automatisieren (optional):** Mit einem zeitgesteuerten Trigger (*Trigger → Trigger hinzufügen*) lässt sich
das Script regelmässig laufen. Damit dabei nur gebaut wird, wenn sich etwas geändert hat, vergleicht eine Variante
einen Fingerabdruck (SHA-256) des veröffentlichten CSV mit dem letzten Stand (`PropertiesService.getScriptProperties()`)
und ruft den Build-Hook nur bei Abweichung auf. Ein wöchentlicher Build zusätzlich lässt vergangene Termine
verschwinden, denn die Seite entscheidet beim Bauen, welche Termine «aktuell» sind.

**Credits sparen:** Reine Doku-Änderungen (`CLAUDE.md`, `docs/`) mit `[skip ci]` in der Commit-Nachricht
pushen, dann überspringt Netlify den Build. Mehrere Änderungen in einem Commit bündeln.
