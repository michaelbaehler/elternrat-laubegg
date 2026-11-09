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

const helfereinsaetze = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    date:        isoDate,                  // ISO date "2025-10-23"
    time:        z.string().optional(),    // "08:00–12:00"
    location:    z.string(),
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
    time:     z.string().optional(),
    location: z.string().optional(),
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
