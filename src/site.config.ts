// Zentrale Einstellungen der Website.

/**
 * Google Sheet mit den Terminen («Kalender»), als CSV veröffentlicht:
 * In Google Sheets: Datei → Freigeben → Im Web veröffentlichen →
 * Tabellenblatt wählen → «Kommagetrennte Werte (.csv)» → Link hier einfügen.
 *
 * Leer lassen, solange es kein Sheet gibt. Alternativ kann der Link in Netlify
 * als Umgebungsvariable TERMINE_SHEET_CSV_URL hinterlegt werden (hat Vorrang).
 */
export const TERMINE_SHEET_CSV_URL = '';

/**
 * Öffentlicher Google Kalender des Elternrats (Konto er.laubeggbern@gmail.com).
 * Wird beim Bauen als iCal-Feed gelesen. Alternativ per Netlify-Umgebungsvariable TERMINE_ICAL_URL
 * (hat Vorrang). Leer lassen, um den Kalender abzuschalten.
 */
export const KALENDER_ID = '6c88d0cdbb8d677a36b5c23784fad6db165eb0b54b72788fe50c64e4add2d056@group.calendar.google.com';
export const TERMINE_ICAL_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(KALENDER_ID)}/public/basic.ics`;

export const KONTAKT_EMAIL = 'elternrat_laubegg@gmx.ch';
