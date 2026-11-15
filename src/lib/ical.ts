// Minimaler iCal-Parser (RFC 5545) für den öffentlichen Google Kalender des Elternrats.
// Kann: ganztägige und mehrtägige Termine, Uhrzeiten mit Zeitzone, wiederkehrende Termine (RRULE,
// EXDATE, einzeln geänderte oder abgesagte Wiederholungen) und abgesagte Termine.
// Ohne Abhängigkeiten und ohne Astro-Imports, damit sich die Datei einzeln testen lässt.

export interface IcsEreignis {
  title: string;
  date: string;       // YYYY-MM-DD (erster Tag, in Bern)
  dateEnd?: string;   // YYYY-MM-DD, nur bei mehrtägigen Terminen (letzter Tag, inklusive)
  time?: string;      // «19:30 Uhr» oder «19:30–21:00 Uhr»; leer bei ganztägigen Terminen
  location?: string;
  description?: string;
  url?: string;
}

const ZONE = 'Europe/Zurich';

// ---------- Datums-Hilfen ("YYYY-MM-DD" als UTC rechnen, damit keine Sommerzeit stört) ----------
const p2 = (n: number) => String(n).padStart(2, '0');
const teile = (d: string) => d.split('-').map(Number) as [number, number, number];
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => { const [y, m, t] = teile(d); return iso(Date.UTC(y, m - 1, t + n)); };
const utc = (d: string) => { const [y, m, t] = teile(d); return Date.UTC(y, m - 1, t); };
const tageZwischen = (a: string, b: string) => Math.round((utc(b) - utc(a)) / 86400000);
const wochentag = (d: string) => { const [y, m, t] = teile(d); return new Date(Date.UTC(y, m - 1, t)).getUTCDay(); }; // 0 = So
const tageImMonat = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

// ---------- Zeitzonen ----------
const formate = new Map<string, Intl.DateTimeFormat>();
function wand(tz: string, ms: number) {
  let f = formate.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    formate.set(tz, f);
  }
  const w: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(ms))) if (p.type !== 'literal') w[p.type] = Number(p.value);
  return w as { year: number; month: number; day: number; hour: number; minute: number };
}
const versatz = (tz: string, ms: number) => {
  const boden = Math.floor(ms / 60000) * 60000;
  const w = wand(tz, boden);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute) - boden;
};
function zonedZuUtc(tz: string, y: number, m: number, d: number, h: number, mi: number) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  return guess - versatz(tz, guess - versatz(tz, guess));
}
const alsBern = (ms: number) => { const w = wand(ZONE, ms); return { date: `${w.year}-${p2(w.month)}-${p2(w.day)}`, time: `${p2(w.hour)}:${p2(w.minute)}` }; };

interface Zeitpunkt { date: string; time?: string }

function parseZeit(wert: string, params: Record<string, string>): Zeitpunkt | undefined {
  const m = wert.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (m[4] === undefined) return { date: `${m[1]}-${m[2]}-${m[3]}` };
  const [h, mi] = [Number(m[4]), Number(m[5])];
  if (m[7]) return alsBern(Date.UTC(y, mo - 1, d, h, mi));
  const tz = params.TZID && params.TZID !== ZONE ? params.TZID : undefined;
  if (tz) {
    try { return alsBern(zonedZuUtc(tz, y, mo, d, h, mi)); } catch { /* unbekannte Zone: wie Bern behandeln */ }
  }
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
}

// ---------- Zeilen und Eigenschaften ----------
interface Eigenschaft { name: string; params: Record<string, string>; wert: string }

function parseZeile(zeile: string): Eigenschaft | undefined {
  let inAnf = false, doppel = -1;
  for (let i = 0; i < zeile.length; i++) {
    if (zeile[i] === '"') inAnf = !inAnf;
    else if (zeile[i] === ':' && !inAnf) { doppel = i; break; }
  }
  if (doppel < 0) return undefined;
  const kopf = zeile.slice(0, doppel);
  const teileKopf: string[] = [];
  let aktuell = '', anf = false;
  for (const c of kopf) {
    if (c === '"') anf = !anf;
    if (c === ';' && !anf) { teileKopf.push(aktuell); aktuell = ''; } else aktuell += c;
  }
  teileKopf.push(aktuell);
  const params: Record<string, string> = {};
  for (const t of teileKopf.slice(1)) {
    const eq = t.indexOf('=');
    if (eq > 0) params[t.slice(0, eq).toUpperCase()] = t.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: teileKopf[0].toUpperCase(), params, wert: zeile.slice(doppel + 1) };
}

const entschuetze = (s: string) => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

/** Google liefert Beschreibungen teils als HTML (Zeilenumbrüche, Links). */
export function klartext(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|ul|ol)>/gi, '\n')
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) => {
      const t = text.replace(/<[^>]+>/g, '').trim();
      return !t || /^https?:\/\//i.test(t) ? href : `${t} (${href})`;
    })
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- Wiederholungen ----------
interface Regel { FREQ?: string; INTERVAL?: string; COUNT?: string; UNTIL?: string; BYDAY?: string; BYMONTHDAY?: string; BYMONTH?: string }
const KUERZEL: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function parseByDay(s: string) {
  return s.split(',').map(t => {
    const m = t.trim().toUpperCase().match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/);
    return m ? { n: m[1] ? Number(m[1]) : undefined, wd: KUERZEL[m[2]] } : undefined;
  }).filter((x): x is { n: number | undefined; wd: number } => !!x);
}

function monatsTage(y: number, m: number, byday: ReturnType<typeof parseByDay>, bymd: number[], standard: number): string[] {
  const dim = tageImMonat(y, m);
  const tag = (t: number) => `${y}-${p2(m)}-${p2(t)}`;
  let tage: number[];
  if (bymd.length) {
    tage = bymd.map(n => (n > 0 ? n : dim + n + 1)).filter(t => t >= 1 && t <= dim);
    if (byday.length) tage = tage.filter(t => byday.some(b => b.wd === wochentag(tag(t))));
  } else if (byday.length) {
    tage = [];
    for (const b of byday) {
      const passend = [...Array(dim).keys()].map(i => i + 1).filter(t => wochentag(tag(t)) === b.wd);
      if (b.n === undefined) tage.push(...passend);
      else { const t = b.n > 0 ? passend[b.n - 1] : passend[passend.length + b.n]; if (t) tage.push(t); }
    }
  } else tage = standard <= dim ? [standard] : [];
  return [...new Set(tage)].sort((a, b) => a - b).map(tag);
}

/** Alle Starttage der Wiederholung (inklusive Beginn), höchstens bis `bis`. */
function wiederholungen(start: string, regel: Regel, bis: string, bisZeitpunkt?: string): string[] {
  const freq = (regel.FREQ ?? '').toUpperCase();
  const intervall = Math.max(1, Number(regel.INTERVAL) || 1);
  const maxAnzahl = regel.COUNT ? Number(regel.COUNT) : Infinity;
  const ende = bisZeitpunkt && bisZeitpunkt < bis ? bisZeitpunkt : bis;
  const byday = regel.BYDAY ? parseByDay(regel.BYDAY) : [];
  const bymd = regel.BYMONTHDAY ? regel.BYMONTHDAY.split(',').map(Number).filter(Number.isFinite) : [];
  const bymonat = regel.BYMONTH ? regel.BYMONTH.split(',').map(Number).filter(Number.isFinite) : [];
  const [sj, sm, st] = teile(start);
  const startWd = wochentag(start);
  const out: string[] = [];
  let anzahl = 0;

  for (let k = 0; k < 5000; k++) {
    let periode: string[];
    let periodenStart: string;
    if (freq === 'DAILY') {
      periodenStart = addDays(start, k * intervall); periode = [periodenStart];
    } else if (freq === 'WEEKLY') {
      const montag = addDays(start, -((startWd + 6) % 7) + 7 * k * intervall);
      const wds = byday.length ? byday.map(b => b.wd) : [startWd];
      periode = wds.map(wd => addDays(montag, (wd + 6) % 7)).sort();
      periodenStart = montag;
    } else if (freq === 'MONTHLY') {
      const monatIndex = sm - 1 + k * intervall;
      const y = sj + Math.floor(monatIndex / 12), m = (monatIndex % 12) + 1;
      periode = monatsTage(y, m, byday, bymd, st);
      periodenStart = `${y}-${p2(m)}-01`;
    } else if (freq === 'YEARLY') {
      const y = sj + k * intervall;
      periode = (bymonat.length ? bymonat : [sm]).flatMap(m => monatsTage(y, m, byday, bymd, st)).sort();
      periodenStart = `${y}-01-01`;
    } else return [start];

    if (periodenStart > ende) break;
    for (const d of periode) {
      if (d < start) continue;
      if (d > ende) return out;
      if (++anzahl > maxAnzahl) return out;
      out.push(d);
    }
  }
  return out;
}

// ---------- Hauptfunktion ----------
interface Roh {
  uid: string;
  titel: string;
  status: string;
  start?: Zeitpunkt;
  ende?: Zeitpunkt;
  rrule?: Regel;
  ausnahmen: Set<string>;
  recurrenceId?: string;
  ort?: string;
  beschreibung?: string;
  url?: string;
}

function liesEreignisse(text: string): Roh[] {
  const zeilen = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const out: Roh[] = [];
  let e: Roh | undefined;
  let verschachtelt = 0; // VALARM u. ä. innerhalb eines VEVENT ignorieren
  for (const zeile of zeilen) {
    if (zeile === 'BEGIN:VEVENT') { e = { uid: '', titel: '', status: '', ausnahmen: new Set() }; verschachtelt = 0; continue; }
    if (!e) continue;
    if (zeile === 'END:VEVENT') { out.push(e); e = undefined; continue; }
    if (zeile.startsWith('BEGIN:')) { verschachtelt++; continue; }
    if (zeile.startsWith('END:')) { verschachtelt--; continue; }
    if (verschachtelt > 0) continue;
    const p = parseZeile(zeile);
    if (!p) continue;
    switch (p.name) {
      case 'UID': e.uid = p.wert.trim(); break;
      case 'SUMMARY': e.titel = entschuetze(p.wert).trim(); break;
      case 'STATUS': e.status = p.wert.trim().toUpperCase(); break;
      case 'DTSTART': e.start = parseZeit(p.wert, p.params); break;
      case 'DTEND': e.ende = parseZeit(p.wert, p.params); break;
      case 'RRULE': e.rrule = Object.fromEntries(p.wert.split(';').map(t => { const i = t.indexOf('='); return [t.slice(0, i).toUpperCase(), t.slice(i + 1)]; })) as Regel; break;
      case 'EXDATE': for (const w of p.wert.split(',')) { const z = parseZeit(w, p.params); if (z) e.ausnahmen.add(z.date); } break;
      case 'RECURRENCE-ID': e.recurrenceId = parseZeit(p.wert, p.params)?.date; break;
      case 'LOCATION': e.ort = klartext(entschuetze(p.wert)); break;
      case 'DESCRIPTION': e.beschreibung = klartext(entschuetze(p.wert)); break;
      case 'URL': e.url = p.wert.trim(); break;
    }
  }
  return out;
}

/**
 * Liest einen iCal-Feed und liefert alle Termine, die zwischen `von` und `bis` (YYYY-MM-DD) liegen.
 * Wiederkehrende Termine werden zu einzelnen Terminen aufgelöst; abgesagte werden weggelassen.
 */
export function parseIcs(text: string, { von, bis }: { von: string; bis: string }): IcsEreignis[] {
  const roh = liesEreignisse(text).filter(e => e.start && e.titel);
  const hauptTermine = roh.filter(e => !e.recurrenceId);
  const aenderungen = new Map<string, Map<string, Roh>>();
  for (const e of roh.filter(e => e.recurrenceId)) {
    if (!aenderungen.has(e.uid)) aenderungen.set(e.uid, new Map());
    aenderungen.get(e.uid)!.set(e.recurrenceId!, e);
  }

  const out: IcsEreignis[] = [];
  const ausgeben = (e: Roh, tag: string) => {
    if (e.status === 'CANCELLED') return;
    const s = e.start!;
    const ganztags = s.time === undefined;
    // Letzter Tag (inklusive): bei ganztägigen Terminen ist DTEND exklusiv.
    let letzter = s.date;
    if (e.ende) {
      letzter = ganztags ? addDays(e.ende.date, -1) : (e.ende.time === '00:00' && e.ende.date > s.date ? addDays(e.ende.date, -1) : e.ende.date);
    }
    if (letzter < s.date) letzter = s.date;
    const delta = tageZwischen(s.date, letzter);
    const datum = tag, datumEnde = delta > 0 ? addDays(tag, delta) : undefined;
    if ((datumEnde ?? datum) < von || datum > bis) return;
    let zeit: string | undefined;
    if (s.time) {
      zeit = e.ende?.time && delta === 0 && e.ende.date === s.date && e.ende.time !== s.time ? `${s.time}–${e.ende.time} Uhr` : `${s.time} Uhr`;
      if (delta > 0) zeit = `ab ${s.time} Uhr`;
    }
    out.push({ title: e.titel, date: datum, dateEnd: datumEnde, time: zeit, location: e.ort || undefined, description: e.beschreibung || undefined, url: e.url || undefined });
  };

  for (const e of hauptTermine) {
    const ueberschrieben = aenderungen.get(e.uid);
    if (!e.rrule) { ausgeben(e, e.start!.date); continue; }
    for (const tag of wiederholungen(e.start!.date, e.rrule, bis, e.rrule.UNTIL ? parseZeit(e.rrule.UNTIL, {})?.date : undefined)) {
      if (e.ausnahmen.has(tag)) continue;
      const geaendert = ueberschrieben?.get(tag);
      if (geaendert) continue; // wird unten als eigener Termin ausgegeben
      ausgeben(e, tag);
    }
  }
  // Einzeln geänderte Wiederholungen stehen mit ihrem eigenen Datum und ihrer eigenen Zeit im Feed.
  for (const karte of aenderungen.values()) for (const e of karte.values()) ausgeben(e, e.start!.date);
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '') || a.title.localeCompare(b.title));
}
