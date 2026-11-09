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

export const KONTAKT_EMAIL = 'elternrat_laubegg@gmx.ch';
