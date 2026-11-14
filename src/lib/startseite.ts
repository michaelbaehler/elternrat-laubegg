// Gemeinsame Daten für die Startseite (und ihre Entwürfe).
import { getCollection } from 'astro:content';
import { getAlleTermine, heute, istAktuell } from './termine';

export async function startseitenDaten() {
  const today = heute();
  const termine = (await getAlleTermine()).filter(t => istAktuell(t, today));
  const einsaetze = (await getCollection('helfereinsaetze', e => e.data.active && istAktuell(e.data, today)))
    .sort((a, b) => a.data.date.localeCompare(b.data.date));
  return { termine, einsaetze };
}
