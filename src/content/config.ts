import { defineCollection, z } from 'astro:content';

const helfereinsaetze = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    date:        z.string(),               // ISO date "2025-10-23"
    time:        z.string().optional(),    // "08:00–12:00"
    location:    z.string(),
    description: z.string(),
    spotsTotal:  z.number(),
    spotsTaken:  z.number().default(0),
    deadline:    z.string().optional(),
    active:      z.boolean().default(true),
    thema:       z.string().optional(),    // "Schlittschuhverleih", "Events", etc.
  }),
});

const termine = defineCollection({
  type: 'content',
  schema: z.object({
    title:    z.string(),
    date:     z.string(),
    time:     z.string().optional(),
    location: z.string().optional(),
    category: z.enum(['Sitzung', 'Event', 'Schlittschuhverleih', 'Raus Laus', 'Elternbildung', 'Sicherheit', 'Sonstiges']),
    public:   z.boolean().default(true),
  }),
});

const erlInfos = defineCollection({
  type: 'content',
  schema: z.object({
    title:    z.string(),
    date:     z.string(),
    fileUrl:  z.string().optional(),       // Link zu PDF
    summary:  z.string().optional(),
  }),
});

const sitzungen = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    date:        z.string(),
    schuljahr:   z.string(),               // "2025/2026"
    protokollUrl: z.string().optional(),   // Link zu PDF
    passwort:    z.boolean().default(true),
  }),
});

export const collections = {
  helfereinsaetze,
  termine,
  'erl-infos': erlInfos,
  sitzungen,
};
