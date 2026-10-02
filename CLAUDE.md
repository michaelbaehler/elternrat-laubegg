# Elternrat Laubegg Website

Astro 4 + Tailwind, statisch generiert, deployt über Netlify (Auto-Deploy bei Push auf `main`).

- Live: https://elternratlaubegg.netlify.app
- Test-Subdomain: https://new.elternratlaubegg.ch (CNAME → `elternratlaubegg.netlify.app`, DNS bei Hoststar)
- Produktiv-Domain `elternratlaubegg.ch` läuft noch auf der alten Seite bei Hoststar (noch nicht umgestellt)

## Workflow für Inhalts-Updates

Der Elternrat pflegt Inhalte nicht selbst über ein CMS, sondern teilt Claude in einer Unterhaltung mit, was zu ändern ist (neuer Termin, neues Protokoll, neuer Helfereinsatz etc.). Claude bearbeitet dann direkt die passende Markdown-Datei unter `src/content/`, committet und pusht (nach Rückfrage beim Nutzer).

Das Decap-CMS-Panel unter `/admin` existiert im Code, wird aber **nicht genutzt** — Netlify Identity/Git Gateway ist absichtlich nicht aktiviert, Login würde also nicht funktionieren. Das ist kein Bug, sondern bewusste Entscheidung.

## Content Collections (`src/content/`)

Schema in `src/content/config.ts`. Dateiname = beliebiger Slug, wird zu URL-Segment.

**`helfereinsaetze/`** (Helfereinsatz-Anmeldungen, Datei pro Einsatz)
```yaml
title: "Schlittschuhausgabe Sonnenhof"
date: "2026-10-22"          # ISO, steuert "offen"/"vergangen"
time: "07:30–08:30"          # optional
location: "Schulhaus Sonnenhof"
description: "..."
spotsTotal: 3
spotsTaken: 0                 # manuell nachführen bei Anmeldungen
deadline: "2026-10-19"        # optional
active: true                  # auf false setzen statt löschen, um auszublenden
thema: "Schlittschuhverleih"  # optional: Schlittschuhverleih/Events/Elternbildung/Raus Laus/Sicherheit/Sonstiges
```
Body (Markdown unter dem Frontmatter) = zusätzliche Detailhinweise, optional.

Anmeldung läuft über **ein gemeinsames Netlify Form** (`name="helfer-anmeldung"`, siehe `src/pages/helfereinsaetze/[slug].astro`) — pro Seite nur unterschiedliche hidden fields (`einsatz`, `datum`). Einträge landen im Netlify-Dashboard unter Forms, nicht in einer Datenbank/Sheet. (Wechsel zu individuellen Google Forms pro Einsatz war in Diskussion, aber noch nicht entschieden/umgesetzt.)

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
protokollUrl: "/uploads/protokoll-2025-11-17.pdf"   # PDF vorher nach public/uploads/ legen
passwort: true
```

**`erl-infos/`** (Elternrat-Infobriefe)
```yaml
title: "ERL-Info September 2024"
date: "2024-09-01"
fileUrl: "/uploads/erl-info-09-24.pdf"
summary: "..."
```

PDFs liegen in `public/uploads/`.

## Bekannte offene Punkte

- `sitzung-anmeldung.html` (öffentlicher Ordner, Einzelseite) ist aktuell **kaputt**: ruft eine mittlerweile gelöschte Netlify-Funktion (`/api/sheets-proxy`) auf, die per Claude-API+MCP eine Google-Sheets-Zeile schreiben sollte. Nicht im aktuellen Scope — bei Bedarf neu aufgleisen (z.B. Google Apps Script Web App statt LLM-Umweg).
- Domain-Umzug `elternratlaubegg.ch` (Produktiv-Domain, aktuell noch alte Seite via Hoststar) auf Netlify steht noch aus; erst die Test-Subdomain `new.elternratlaubegg.ch` ist umgestellt.
