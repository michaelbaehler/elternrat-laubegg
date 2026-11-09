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

Texte: Schweizer Schreibweise (ss, «»), Du-Form, freundlich und klar. Sitzungen sind für die Elternratsvertreter:innen, nicht für alle Eltern; alle Eltern können bei Helfereinsätzen, Elternbildung und Themengruppen mitmachen oder Elternratsvertreter:in werden. Themengruppen-Daten zentral in `src/lib/themen.ts`, Kontakt-E-Mail in `src/site.config.ts`. Themengrafiken (`public/images/themen/*.svg`) sind von Hand gezeichnete SVGs (Text als Pfade, Palette wie Logo).

Schema in `src/content/config.ts`. Dateiname = beliebiger Slug, wird zu URL-Segment.

**`helfereinsaetze/`** (Helfereinsatz-Anmeldungen, Datei pro Einsatz)
```yaml
title: "Schlittschuhausgabe Sonnenhof"
date: "2026-10-22"          # ISO, steuert "offen"/"vergangen"
time: "07:30–08:30"          # optional
location: "Schulhaus Sonnenhof"
description: "..."
formUrl: "https://docs.google.com/forms/d/e/…/viewform"  # optional
spotsTotal: 3                 # optional
spotsTaken: 0                 # optional, manuell nachführen
deadline: "2026-10-19"        # optional
active: true                  # auf false setzen statt löschen, um auszublenden
thema: "Schlittschuhverleih"  # optional: Schlittschuhverleih/Events/Elternbildung/Raus Laus/Sicherheit/Sonstiges
```
Body (Markdown unter dem Frontmatter) = zusätzliche Detailhinweise, optional.

Anmeldung läuft über **Google Forms** (pro Einsatz ein Formular, das die Elternratsvertretung selbst erstellt): Feld `formUrl`. Lange URL (`docs.google.com/forms/…`) wird eingebettet, `forms.gle/…` nur verlinkt; ohne `formUrl` zeigt die Seite «Anmeldung folgt» mit E-Mail-Link. `spotsTotal`/`spotsTaken` sind optional. Kein Netlify Form mehr.

**Termine aus dem Google Sheet:** Zusätzlich zu `termine/` liest `src/lib/termine.ts` beim Build ein als CSV veröffentlichtes Google Sheet («Kalender»; URL in `src/site.config.ts` oder Env `TERMINE_SHEET_CSV_URL`). Fällt das Sheet aus, baut die Seite trotzdem. Spalten, Veröffentlichung und täglicher Rebuild per Netlify-Build-Hook + Apps Script: `docs/termine-google-sheet.md`. Seiten nutzen `getAlleTermine()`, nicht direkt `getCollection('termine')`.

**`termine/`** (Terminübersicht)
```yaml
title: "1. Sitzung Elternrat 2026/2027"
date: "2026-09-07"
time: "19:30 Uhr"      # optional, Freitext
location: "Aula Schulhaus Laubegg"  # optional
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

Protokolle 2023/24–2025/26 verlinken noch auf passwortgeschützte Seiten der alten WordPress-Site (www.elternratlaubegg.ch). **Vor dem Domain-Umzug** als PDF sichern, sonst brechen die Links.

PDFs liegen in `public/uploads/`.

## Bekannte offene Punkte

- Startseite (`src/components/Startseite.astro`) nutzt Fotos von der alten Seite; das Schulhaus-Foto ist klein und hat einen Leinwand-Filter – bei Gelegenheit durch ein neues ersetzen.
- `sitzung-anmeldung.html` (öffentlicher Ordner, Einzelseite) ist aktuell **kaputt**: ruft die gelöschte Netlify-Funktion (`/api/sheets-proxy`) auf, die per Claude-API+MCP eine Google-Sheets-Zeile schreiben sollte. Nicht im aktuellen Scope — bei Bedarf neu aufgleisen (z.B. Google Apps Script Web App statt LLM-Umweg).
- Domain-Umzug `elternratlaubegg.ch` (Produktiv-Domain, aktuell noch alte Seite via Hoststar) auf Netlify steht noch aus; erst die Test-Subdomain `new.elternratlaubegg.ch` ist umgestellt.
