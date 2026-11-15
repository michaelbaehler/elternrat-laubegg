// Kategorie eines Termins aus Stichwörtern im Titel erraten (für Einträge im Google Kalender,
// die keine Zeile «Kategorie: …» in der Beschreibung haben). Reine Funktion ohne Astro-Imports.
// Die Reihenfolge zählt: der erste passende Treffer gewinnt.

export type KategorieName =
  | 'Sitzung' | 'Event' | 'Schlittschuhverleih' | 'Raus Laus' | 'Elternbildung' | 'Sicherheit' | 'Sonstiges';

const REGELN: [KategorieName, RegExp][] = [
  ['Schlittschuhverleih', /schlittschuh/],
  // «Raus Laus», «RausLaus», «Läusekontrolle», «lausen» – aber nicht «Klausur» oder «Hausaufgaben»
  ['Raus Laus', /raus[\s-]?laus|\bläuse|\blausen\b|\blaus\b/],
  ['Sitzung', /sitzung|konferenz|kreiselternrat|präsidium|präsidien|praesidium|vorbesprechung/],
  ['Elternbildung', /elternbildung|workshop|infoabend|informationsabend|vortrag|referat|kurs\b|weiterbildung/],
  ['Sicherheit', /sicherheit|schulweg|verkehr|lotse|lotsen|fussgänger|fussgaenger|zebrastreifen/],
  ['Event', /adventsznüni|adventssingen|znüni|frühlingstreffen|frühjahrstreffen|frühjahrsbegegnung|begegnung|apéro|apero|\bfest\b|fest\b|\bfeier|singen|anlass|event|treffen/],
];

/** «Schlittschuh-Ausgabe» → Schlittschuhverleih, «Konferenz Elternrats-Präsidien» → Sitzung, sonst Sonstiges. */
export function kategorieAusText(text: string): KategorieName {
  const t = text.toLowerCase();
  for (const [name, regel] of REGELN) if (regel.test(t)) return name;
  return 'Sonstiges';
}
