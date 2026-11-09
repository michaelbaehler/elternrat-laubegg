// Gemeinsame Daten für die Startseite (und ihre Entwürfe).
import { getCollection } from 'astro:content';
import { getAlleTermine, heute } from './termine';

export async function startseitenDaten() {
  const today = heute();
  const termine = (await getAlleTermine()).filter(t => t.date >= today);
  const einsaetze = (await getCollection('helfereinsaetze', e => e.data.active && e.data.date >= today))
    .sort((a, b) => a.data.date.localeCompare(b.data.date));
  return { termine, einsaetze };
}
