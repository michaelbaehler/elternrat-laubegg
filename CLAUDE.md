# Elternrat Laubegg Website

Astro 4 + Tailwind, statisch generiert, deployt über Netlify (Auto-Deploy bei Push auf `main`).

- Live: https://elternratlaubegg.netlify.app
- Test-Subdomain: https://new.elternratlaubegg.ch (CNAME → `elternratlaubegg.netlify.app`, DNS bei Hoststar)
- Produktiv-Domain `elternratlaubegg.ch` läuft noch auf der alten Seite bei Hoststar (noch nicht umgestellt)

## Workflow für Inhalts-Updates

Zwei Wege:

1. **CMS unter `/admin`** (Decap CMS) für Routine-Inhalte (Termine, Helfereinsätze, Sitzungen/Protokolle). Login mit GitHub-Konto (Backend `github`, Netlify als OAuth-Provider über `base_url: https://api.netlify.com` / `site_domain`). Voraussetzung: GitHub-OAuth-App, deren Client-ID/Secret in Netlify unter *Site configuration → Access & security → OAuth* hinterlegt ist; Callback-URL `https://api.netlify.com/auth/done`. Bearbeiter brauchen Schreibrecht aufs Repo. Jede Speicherung ist ein Commit direkt auf `main` (→ Auto-Deploy).
2. **Über Claude** für grössere Änderungen: Claude bearbeitet direkt die Dateien, committet und pusht (nach Rückfrage beim Nutzer).

Netlify Identity / Git Gateway wird **nicht** genutzt.

Datumsfelder werden in `src/content/config.ts` über `isoDate` normalisiert, weil das CMS Daten teils ohne Anführungszeichen speichert (YAML liest sie dann als Date).

## Content Collections (`src/content/`)

Texte: Schweizer Schreibweise (ss, «»), Du-Form, freundlich und klar. Sitzungen sind für die Elternratsvertreter:innen, nicht für alle Eltern; alle Eltern können bei Helfereinsätzen, Elternbildung und Themengruppen mitmachen oder Elternratsvertreter:in werden. Themengruppen-Daten zentral in `src/lib/themen.ts`, Kontakt-E-Mail in `src/site.config.ts`. Themengrafiken (`public/images/themen/*.webp`) sind KI-Illustrationen im Stil des Gestaltungshandbuchs, zugeschnitten auf 20:11 (1536×845). Frühere handgezeichnete SVGs liegen in der Git-Historie.

**Standorte** sind Tags (`src/lib/standorte.ts`, Liste auch in `public/admin/config.yml` pflegen) und dienen auf `/termine` und `/helfereinsaetze` als Filter (`StandortFilter.astro`, `?standort=Laubegg`). Leer oder «Alle Standorte» = erscheint bei jedem Filter. Mehrtägiges über `dateEnd`; «aktuell» gilt bis zum letzten Tag (`istAktuell`).

Schema in `src/content/config.ts`. Dateiname = beliebiger Slug, wird zu URL-Segment.

**`helfereinsaetze/`** (Helfereinsatz-Anmeldungen, Datei pro Einsatz)
```yaml
title: "Schlittschuhausgabe Sonnenhof"
date: "2026-10-22"          # Beginn (bei mehreren Daten: erstes Datum), steuert Sortierung und "offen"/"vergangen"
dateEnd: "2026-10-23"        # optional: letzter Tag
datumText: "Woche nach den Herbstferien"  # optional: ersetzt die Datumsanzeige
time: "07:30–08:30"          # optional
standorte: ["Laubegg", "Sonnenhof"]  # optional Tags; leer = ganze Schule
location: "vor der Treppe"   # optional Freitext (Treffpunkt)
description: "..."
formUrl: "https://docs.google.com/forms/d/e/…/viewform"  # optional
spotsTotal: 3                 # optional
spotsTaken: 0                 # optional, manuell nachführen
deadline: "2026-10-19"        # optional
active: true                  # auf false setzen statt löschen, um auszublenden
thema: "Schlittschuhverleih"  # optional: Schlittschuhverleih/Events/Elternbildung/Raus Laus/Sicherheit/Sonstiges
```
Es gibt **keine Detailseite** pro Einsatz: Die Kachel (`HelferCard.astro`) führt direkt zum Google Formular (neuer Tab). Details gehören ins Formular. Alte URLs `/helfereinsaetze/<slug>` leitet `netlify.toml` auf die Übersicht um.

Anmeldung läuft über **Google Forms** (pro Einsatz ein Formular, das die Elternratsvertretung selbst erstellt): Feld `formUrl`, jeder Link-Typ funktioniert (auch `forms.gle/…`). Ohne `formUrl` führt die Kachel zu einer E-Mail-Anfrage. `spotsTotal`/`spotsTaken` sind optional; bei «besetzt» ist die Kachel nicht mehr anklickbar. Kein Netlify Form mehr.

**Termine aus dem Google Sheet:** Zusätzlich zu `termine/` liest `src/lib/termine.ts` beim Build ein als CSV veröffentlichtes Google Sheet («Kalender»; URL in `src/site.config.ts` oder Env `TERMINE_SHEET_CSV_URL`). Fällt das Sheet aus, baut die Seite trotzdem. Spalten, Veröffentlichung und Sync nur auf Anfrage per Netlify-Build-Hook + Apps-Script-Menü «Website» (kein Timer, spart Netlify-Credits; Sheet «Kalender Elternrat Laubegg» im Drive von Michael, noch nicht veröffentlicht): `docs/termine-google-sheet.md`. Seiten nutzen `getAlleTermine()`, nicht direkt `getCollection('termine')`.

**`termine/`** (Terminübersicht)
```yaml
title: "1. Sitzung Elternrat 2026/2027"
date: "2026-09-07"
dateEnd: "2026-09-08"  # optional, nur bei mehrtägigen Terminen
time: "19:30 Uhr"      # optional, Freitext
standorte: ["Laubegg"] # optional Tags; leer = gilt für die ganze Schule
location: "Aula Schulhaus Laubegg"  # optional Freitext
description: "..."     # optional
category: "Sitzung"    # enum: Sitzung/Event/Schlittschuhverleih/Raus Laus/Elternbildung/Sicherheit/Sonstiges
public: true
```

**`sitzungen/`** (Sitzungsprotokolle)
```yaml
title: "2. Sitzung Elternrat 2025/2026"
date: "2025-11-17"
schuljahr: "2025/2026"
protokollUrl: "/uploads/protokoll-2025-11-17.pdf"   # PDF liegt in public/uploads/ (im CMS direkt hochladbar)
praesentationUrl: "/uploads/praesentation-2025-11-17.pdf"  # optional
passwort: true
```

**Protokolle sind konsequent PDFs** in `public/uploads/` (`protokoll-JJJJ-MM-TT.pdf`, Datum der Sitzung), verlinkt über `protokollUrl`; `netlify.toml` setzt für sie `X-Robots-Tag: noindex`. Die PDFs 2023/24–2025/26 wurden im November 2026 aus den Protokollen der alten WordPress-Site erzeugt und **anonymisiert**: Nur das Präsidium (Michael Bähler, Jennifer Donath, Cornelia Bosshard) steht mit Namen; Eltern, Schulleitung, Tagesschule und Referierende sind durch Funktionen ersetzt, private E-Mail-Adressen und Telefonnummern sind entfernt. Neue Protokolle vor der Veröffentlichung genauso behandeln. Die PDFs 2022/23 und das vom 1.6.2026 sind nicht anonymisiert. Eine Fassung als Webseiten (Text unter dem Frontmatter, Seite `/sitzungen/<slug>`, CMS-Feld «Protokolltext») liegt unverbunden auf dem Branch `protokolle-uebernehmen` und ist nicht gemergt.

PDFs liegen in `public/uploads/`.

## Bekannte offene Punkte

- Fotos der Schule (Drive-Ordner «Schulfotos», 31 Bilder zu Laubegg, Sonnenhof, Wittigkofen, Wyssloch) liegen nur teilweise im Repo: Hero, Galerie «Unsere Schule» und «Über uns» nutzen die Laubegg-Fotos aus `public/images/fotos/*.webp`. Fotos der anderen Standorte sind noch nicht eingebaut.
- **Bildrechte vor dem Domain-Umzug klären:** Die Herkunft und Nutzungsrechte der Fotos in `public/images/fotos/` (Hero `schulhaus-laubegg-hero.webp`, Galerie, Über uns, Aula `aula-laubegg.jpg`, Schulfest-Fotos) sind nicht dokumentiert. Plan: von jedem Standort eigene Fotos machen und diese ersetzen (Querformat, Originalauflösung, Hauptfassade frontal bei Tageslicht; keine erkennbaren Kinder ohne Einwilligung). Die Fotos auf kirchenfeld-schosshalde.ch/laubegg/schulhaeuser gehören dem Schulkreis und werden nicht verwendet. Bis zum Umzug auf `elternratlaubegg.ch` ist die Test-Subdomain unkritisch.
- `sitzung-anmeldung.html` (öffentlicher Ordner, Einzelseite) ist aktuell **kaputt**: ruft die gelöschte Netlify-Funktion (`/api/sheets-proxy`) auf, die per Claude-API+MCP eine Google-Sheets-Zeile schreiben sollte. Nicht im aktuellen Scope — bei Bedarf neu aufgleisen (z.B. Google Apps Script Web App statt LLM-Umweg).
- Domain-Umzug `elternratlaubegg.ch` (Produktiv-Domain, aktuell noch alte Seite via Hoststar) auf Netlify steht noch aus; erst die Test-Subdomain `new.elternratlaubegg.ch` ist umgestellt.
