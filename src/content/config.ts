import { defineCollection, z } from 'astro:content';

// Datumsfelder als "YYYY-MM-DD"-String. Das CMS kann Daten ohne Anführungszeichen
// speichern, die YAML dann als Date-Objekt liest – beides wird hier vereinheitlicht.
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string(),
);

// Das CMS speichert leere optionale Felder teils als "" oder null.
const leer = (v: unknown) => (v === '' || v === null ? undefined : v);
const optDate = z.preprocess(leer, isoDate.optional());
const optUrl  = z.preprocess(leer, z.string().url().optional());
const optNum  = z.preprocess(leer, z.number().optional());
const optText = z.preprocess(leer, z.string().optional());
// Uhrzeiten: Speichert das CMS «19:30» ohne Anführungszeichen, liest YAML 1.1 das als Zahl (Minuten, 19:30 = 1170).
// Das wird wieder zu «19:30 Uhr». Ein reines «19:30» als Text bekommt ebenfalls «Uhr»; Bereiche («07:30–08:30») bleiben unverändert.
const uhrzeit = (v: unknown) => {
  v = leer(v);
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 24 * 60) return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')} Uhr`;
  if (typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v.trim())) return `${v.trim().padStart(5, '0')} Uhr`;
  return v;
};
const optTime = z.preprocess(uhrzeit, z.string().optional());
// Standorte: Liste von Namen (siehe src/lib/standorte.ts). Fehlt das Feld, gilt der Eintrag für die ganze Schule.
const standorte = z.preprocess(
  (v) => (v === undefined || v === null || v === '' ? [] : Array.isArray(v) ? v : [v]),
  z.array(z.string()),
);

const helfereinsaetze = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    date:        isoDate,                  // Beginn, ISO "2025-10-23" (bei mehreren Tagen: erster Tag)
    dateEnd:     optDate,                  // optional: letzter Tag
    datumText:   optText,                  // optional: Datum als Text, ersetzt die Anzeige («Woche nach den Herbstferien»)
    time:        optTime,                  // "08:00–12:00"
    standorte,                             // Tags: Laubegg, Sonnenhof, …
    location:    optText,                  // Treffpunkt / Ort als Freitext
    description: z.string(),
    formUrl:     optUrl,                   // Link zum Google Formular
    spotsTotal:  optNum,                   // optional: Anzahl gesuchter Personen
    spotsTaken:  z.preprocess(leer, z.number().default(0)),
    deadline:    optDate,
    active:      z.boolean().default(true),
    thema:       z.string().optional(),    // "Schlittschuhverleih", "Events", etc.
  }),
});

const termine = defineCollection({
  type: 'content',
  schema: z.object({
    title:    z.string(),
    date:     isoDate,
    dateEnd:  optDate,
    datumText: optText,
    time:     optTime,
    standorte,
    location: optText,
    description: optText,
    category: z.enum(['Sitzung', 'Event', 'Schlittschuhverleih', 'Raus Laus', 'Elternbildung', 'Sicherheit', 'Sonstiges']),
    public:   z.boolean().default(true),
  }),
});

const sitzungen = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    date:        isoDate,
    schuljahr:   z.string(),               // "2025/2026"
    protokollUrl: z.preprocess(leer, z.string().optional()),     // PDF, Google Doc oder Seite
    praesentationUrl: z.preprocess(leer, z.string().optional()), // Präsentation (PDF)
    passwort:    z.boolean().default(true),
  }),
});

export const collections = {
  helfereinsaetze,
  termine,
  sitzungen,
};
