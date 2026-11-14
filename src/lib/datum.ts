// Datumsformate für die Schweiz. Daten sind "YYYY-MM-DD"-Strings und werden als UTC
// gelesen; darum auch in UTC formatieren, sonst verrutscht der Tag je nach Server-Zeitzone.
const opts = (o: Intl.DateTimeFormatOptions) => ({ ...o, timeZone: 'UTC' });

export const datumLang  = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
export const datumMittel = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }));
export const datumKurz  = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ day: 'numeric', month: 'long', year: 'numeric' }));
export const tag        = (d: string) => new Date(d).getUTCDate();
export const monat      = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ month: 'short' })).replace('.', '');

const tagKurz = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ weekday: 'short' }));
const monatLang = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ month: 'long' }));
const jahr = (d: string) => new Date(d).getUTCFullYear();

/** Einzeldatum oder Zeitraum, z. B. «Do. 22. – Fr. 23. Oktober 2026». */
export function datumBereich(von: string, bis?: string, lang = false): string {
  if (!bis || bis <= von) return lang ? datumLang(von) : datumMittel(von);
  const gleichesJahr = jahr(von) === jahr(bis);
  const gleicherMonat = gleichesJahr && monatLang(von) === monatLang(bis);
  const d = (x: string) => `${tagKurz(x)} ${tag(x)}.`;
  if (gleicherMonat) return `${d(von)} – ${d(bis)} ${monatLang(bis)} ${jahr(bis)}`;
  if (gleichesJahr) return `${d(von)} ${monatLang(von)} – ${d(bis)} ${monatLang(bis)} ${jahr(bis)}`;
  return `${d(von)} ${monatLang(von)} ${jahr(von)} – ${d(bis)} ${monatLang(bis)} ${jahr(bis)}`;
}

/** Kurzform für den Datumsblock einer Karte: «22–23» bei Zeiträumen im gleichen Monat, sonst nur der Starttag. */
export function blockTag(von: string, bis?: string): string {
  return bis && bis > von && monatLang(von) === monatLang(bis) && jahr(von) === jahr(bis) ? `${tag(von)}–${tag(bis)}` : String(tag(von));
}

/** Letzter Tag eines Eintrags: Ende, sonst Start. Entscheidet, ob er noch aktuell ist. */
export const letzterTag = (e: { date: string; dateEnd?: string }) => (e.dateEnd && e.dateEnd > e.date ? e.dateEnd : e.date);
