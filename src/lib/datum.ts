// Datumsformate für die Schweiz. Daten sind "YYYY-MM-DD"-Strings und werden als UTC
// gelesen; darum auch in UTC formatieren, sonst verrutscht der Tag je nach Server-Zeitzone.
const opts = (o: Intl.DateTimeFormatOptions) => ({ ...o, timeZone: 'UTC' });

export const datumLang  = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
export const datumMittel = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }));
export const datumKurz  = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ day: 'numeric', month: 'long', year: 'numeric' }));
export const tag        = (d: string) => new Date(d).getUTCDate();
export const monat      = (d: string) => new Date(d).toLocaleDateString('de-CH', opts({ month: 'short' })).replace('.', '');
