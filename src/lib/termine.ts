// Termine aus zwei Quellen zusammenführen:
//  1. Markdown-Dateien in src/content/termine/ (CMS)
//  2. Google Sheet «Kalender», als CSV veröffentlicht (siehe src/site.config.ts)
//
// Das Sheet wird beim Bauen der Website gelesen. Fällt es aus, baut die Seite
// trotzdem – dann eben nur mit den Terminen aus den Markdown-Dateien.

import { getCollection } from 'astro:content';
import { TERMINE_SHEET_CSV_URL } from '../site.config';

export const KATEGORIEN = [
  'Sitzung', 'Event', 'Schlittschuhverleih', 'Raus Laus', 'Elternbildung', 'Sicherheit', 'Sonstiges',
] as const;
export type Kategorie = (typeof KATEGORIEN)[number];

export interface Termin {
  title: string;
  date: string;          // YYYY-MM-DD
  time?: string;
  location?: string;
  category: Kategorie;
  description?: string;
  link?: string;
  quelle: 'website' | 'sheet';
}

// Spaltennamen im Sheet (Gross-/Kleinschreibung egal). Die erste passende Spalte gewinnt.
const SPALTEN: Record<keyof Omit<Termin, 'quelle'> | 'public', string[]> = {
  date:        ['datum', 'date', 'tag', 'start', 'startdatum', 'beginn'],
  time:        ['zeit', 'uhrzeit', 'time', 'von'],
  title:       ['titel', 'title', 'termin', 'anlass', 'was', 'betreff', 'name'],
  location:    ['ort', 'location', 'wo', 'treffpunkt'],
  category:    ['kategorie', 'category', 'thema', 'themengruppe', 'typ'],
  description: ['beschreibung', 'description', 'details', 'info', 'bemerkung', 'bemerkungen'],
  link:        ['link', 'url', 'anmeldung', 'formular'],
  public:      ['öffentlich', 'oeffentlich', 'public', 'website', 'auf website', 'publizieren'],
};

/** Minimaler CSV-Parser (RFC 4180: Anführungszeichen, Kommas und Zeilenumbrüche in Feldern). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

/** Akzeptiert 2026-11-16, 16.11.2026, 16.11.26, 16/11/2026 und 16.11.2026 19:30. */
export function parseDatum(raw: string): string | undefined {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})\b/);
  if (m) {
    const jahr = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${jahr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return undefined;
}

function zeitAusDatum(raw: string): string | undefined {
  const m = raw.match(/\b(\d{1,2}):(\d{2})\b/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]} Uhr` : undefined;
}

function normKategorie(raw: string | undefined): Kategorie {
  const k = (raw ?? '').trim().toLowerCase().replace(/[-_]/g, ' ');
  if (!k) return 'Sonstiges';
  if (k.startsWith('sitzung') || k === 'er sitzung') return 'Sitzung';
  if (k.includes('schlittschuh')) return 'Schlittschuhverleih';
  if (k.includes('laus')) return 'Raus Laus';
  if (k.includes('bildung')) return 'Elternbildung';
  if (k.includes('sicherheit') || k.includes('verkehr') || k.includes('schulweg')) return 'Sicherheit';
  if (k.includes('event') || k.includes('anlass') || k.includes('fest')) return 'Event';
  return 'Sonstiges';
}

const NEIN = ['nein', 'no', 'false', '0', 'n', 'intern', 'privat'];

export function termineAusCsv(csv: string): Termin[] {
  const [kopf, ...zeilen] = parseCsv(csv);
  if (!kopf) return [];
  const namen = kopf.map(h => h.trim().toLowerCase());
  const index = Object.fromEntries(
    Object.entries(SPALTEN).map(([feld, alias]) => [feld, namen.findIndex(n => alias.includes(n))]),
  ) as Record<keyof typeof SPALTEN, number>;
  const wert = (z: string[], feld: keyof typeof SPALTEN) =>
    index[feld] >= 0 ? (z[index[feld]] ?? '').trim() || undefined : undefined;

  const termine: Termin[] = [];
  for (const z of zeilen) {
    const datumRoh = wert(z, 'date');
    const title = wert(z, 'title');
    const date = datumRoh && parseDatum(datumRoh);
    if (!date || !title) continue;
    if (NEIN.includes((wert(z, 'public') ?? '').toLowerCase())) continue;
    termine.push({
      title,
      date,
      time: wert(z, 'time') ?? zeitAusDatum(datumRoh!),
      location: wert(z, 'location'),
      category: normKategorie(wert(z, 'category')),
      description: wert(z, 'description'),
      link: wert(z, 'link'),
      quelle: 'sheet',
    });
  }
  return termine;
}

let cache: Promise<Termin[]> | undefined;

async function sheetTermine(): Promise<Termin[]> {
  const url = import.meta.env.TERMINE_SHEET_CSV_URL || process.env.TERMINE_SHEET_CSV_URL || TERMINE_SHEET_CSV_URL;
  if (!url) return [];
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const termine = termineAusCsv(await res.text());
    console.log(`[termine] ${termine.length} Termine aus dem Google Sheet gelesen`);
    return termine;
  } catch (e) {
    console.warn(`[termine] Google Sheet nicht lesbar (${(e as Error).message}) – nur Termine aus der Website`);
    return [];
  }
}

/** Alle öffentlichen Termine, aufsteigend nach Datum. Doppelte (gleiches Datum + Titel) werden zusammengeführt. */
export function getAlleTermine(): Promise<Termin[]> {
  cache ??= (async () => {
    const eigene = (await getCollection('termine', t => t.data.public)).map<Termin>(t => ({
      title: t.data.title,
      date: t.data.date,
      time: t.data.time,
      location: t.data.location,
      category: t.data.category,
      quelle: 'website',
    }));
    const alle = [...eigene];
    const schluessel = new Set(eigene.map(t => `${t.date}|${t.title.toLowerCase()}`));
    for (const t of await sheetTermine()) {
      const k = `${t.date}|${t.title.toLowerCase()}`;
      if (!schluessel.has(k)) { schluessel.add(k); alle.push(t); }
    }
    return alle.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
  })();
  return cache;
}

export function heute(): string {
  // Datum in Bern, nicht UTC – sonst kippt ein Termin kurz vor Mitternacht zu früh.
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}
