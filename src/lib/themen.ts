// Die Themengruppen – gemeinsame Daten für Startseite und Themenübersicht.
export const THEMEN = [
  {
    name: 'Schlittschuhverleih',
    href: '/themen/schlittschuhverleih',
    img: '/images/themen/schlittschuhverleih.svg',
    kurz: 'Ein Paar Schlittschuhe für die ganze Saison – für Fr. 20.–.',
    badge: 'Oktober bis März',
  },
  {
    name: 'Events',
    href: '/themen/events',
    img: '/images/themen/events.svg',
    kurz: 'Frühlingstreffen, Adventsznüni und weitere Anlässe, die verbinden.',
    badge: 'Übers Jahr',
  },
  {
    name: 'Elternbildung',
    href: '/themen/elternbildung',
    img: '/images/themen/elternbildung.svg',
    kurz: 'Infoabende, Workshops und Austausch zu Themen, die Familien bewegen.',
    badge: 'Von Zeit zu Zeit',
  },
  {
    name: 'Raus Laus',
    href: '/themen/raus-laus',
    img: '/images/themen/raus-laus.svg',
    kurz: 'Läusekontrolle nach den Ferien – zusammen mit dem Gesundheitsdienst.',
    badge: 'Nach den Ferien',
  },
  {
    name: 'Sicherheit',
    href: '/themen/sicherheit',
    img: '/images/themen/sicherheit.svg',
    kurz: 'Für sichere Schulwege: Plakate, Flyer und Aktionen am Fussgängerstreifen.',
    badge: 'Das ganze Jahr',
  },
] as const;
