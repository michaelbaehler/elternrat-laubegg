// Standorte der Schule Laubegg. Dienen als Tags für Termine und Helfereinsätze und als Filter.
// Quelle: https://kirchenfeld-schosshalde.ch/laubegg/schulhaeuser und …/kindergaerten (Stand November 2026).
// Schulhäuser: Baumgarten, Laubegg, Laubeggstrasse, Sonnenhof, Wyssloch. Nur Kindergarten: Egelsee, Schöngrün, Merzenacker.
// Gleichnamige Schulhäuser und Kindergärten (Sonnenhof, Wyssloch) teilen sich einen Tag.
// Die gleiche Liste steht im CMS (public/admin/config.yml, Feld «standorte»): bei Änderungen beide anpassen.
export const STANDORTE = [
  'Laubegg', 'Laubeggstrasse', 'Sonnenhof', 'Wyssloch', 'Baumgarten', 'Egelsee', 'Schöngrün', 'Merzenacker',
] as const;

/** Sonderwert: gilt für alle Standorte. Ein leeres Feld bedeutet: gilt für die ganze Schule. */
export const ALLE = 'Alle Standorte';

const kanon = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ö/g, 'o').trim();
const BEKANNT = new Map<string, string>([...STANDORTE, ALLE].map(s => [kanon(s), s]));

/** Macht aus «Laubegg, sonnenhof» oder ['Laubegg'] eine saubere Liste bekannter Standorte. */
export function normStandorte(v: unknown): string[] {
  const teile = Array.isArray(v) ? v.map(String) : typeof v === 'string' ? v.split(/[,;/|]|\bund\b/i) : [];
  const out: string[] = [];
  for (const t of teile) {
    const k = kanon(t);
    if (!k) continue;
    const treffer = k === 'alle' ? ALLE : BEKANNT.get(k);
    if (treffer && !out.includes(treffer)) out.push(treffer);
    else if (!treffer) console.warn(`[standorte] Unbekannter Standort «${t.trim()}» ignoriert`);
  }
  return out;
}

/** Passt ein Eintrag zum gewählten Filter? Leer oder «Alle Standorte» passt immer. */
export function passtZu(standorte: string[], filter: string): boolean {
  return !filter || standorte.length === 0 || standorte.includes(ALLE) || standorte.includes(filter);
}

/** Standorte, die in den Einträgen vorkommen, in der Reihenfolge der Hauptliste (für die Filter-Knöpfe). */
export function verwendeteStandorte(listen: string[][]): string[] {
  const set = new Set(listen.flat());
  return STANDORTE.filter(s => set.has(s));
}
