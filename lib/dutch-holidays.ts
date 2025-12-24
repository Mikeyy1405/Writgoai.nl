/**
 * Dutch Holidays Utility
 * Contains all Dutch holidays (fixed and variable) with content suggestions
 */

interface Holiday {
  name: string;
  date: Date;
  type: 'national' | 'cultural' | 'commercial' | 'seasonal';
  contentIdeas: string[];
  hashtags: string[];
  emoji: string;
}

interface HolidayDefinition {
  name: string;
  type: 'national' | 'cultural' | 'commercial' | 'seasonal';
  contentIdeas: string[];
  hashtags: string[];
  emoji: string;
  getDate: (year: number) => Date | null;
}

// Helper function to calculate Easter Sunday (Computus algorithm)
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper to get Mother's Day (2nd Sunday of May)
function getMothersDay(year: number): Date {
  const may = new Date(year, 4, 1); // May 1st
  const dayOfWeek = may.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  return new Date(year, 4, 1 + daysUntilSunday + 7); // 2nd Sunday
}

// Helper to get Father's Day (3rd Sunday of June)
function getFathersDay(year: number): Date {
  const june = new Date(year, 5, 1); // June 1st
  const dayOfWeek = june.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  return new Date(year, 5, 1 + daysUntilSunday + 14); // 3rd Sunday
}

// All Dutch holidays definitions
const DUTCH_HOLIDAYS: HolidayDefinition[] = [
  // Fixed National Holidays
  {
    name: 'Nieuwjaarsdag',
    type: 'national',
    contentIdeas: [
      'Nieuwjaarsvoornemens voor {niche}',
      'Terugblik op {year-1}: wat hebben we geleerd?',
      'Trends voor {year} in {niche}',
      'Frisse start: tips voor het nieuwe jaar',
    ],
    hashtags: ['#nieuwjaar', '#goedevoornemen', '#2025', '#frissestart'],
    emoji: '🎆',
    getDate: (year) => new Date(year, 0, 1),
  },
  {
    name: 'Koningsdag',
    type: 'national',
    contentIdeas: [
      'Oranje inspiratie voor {niche}',
      'Koningsdag special: onze Nederlandse roots',
      'Feest met {niche} tips voor Koningsdag',
      'Vrijmarkt tips & tricks',
    ],
    hashtags: ['#koningsdag', '#oranje', '#nederland', '#27april'],
    emoji: '👑',
    getDate: (year) => new Date(year, 3, 27), // April 27
  },
  {
    name: 'Bevrijdingsdag',
    type: 'national',
    contentIdeas: [
      'Vrijheid vieren: wat betekent vrijheid in {niche}?',
      'Dankbaar voor vrijheid',
      'Herdenken en vieren',
    ],
    hashtags: ['#bevrijdingsdag', '#vrijheid', '#5mei'],
    emoji: '🕊️',
    getDate: (year) => new Date(year, 4, 5), // May 5
  },
  {
    name: 'Dodenherdenking',
    type: 'national',
    contentIdeas: [
      'Moment van stilte en respect',
      'Herdenken van onze helden',
    ],
    hashtags: ['#dodenherdenking', '#4mei', '#herdenken'],
    emoji: '🕯️',
    getDate: (year) => new Date(year, 4, 4), // May 4
  },

  // Variable Religious Holidays (based on Easter)
  {
    name: 'Goede Vrijdag',
    type: 'cultural',
    contentIdeas: [
      'Tijd voor bezinning',
      'Even stilstaan bij wat echt belangrijk is',
    ],
    hashtags: ['#goedevrijdag', '#pasen', '#bezinning'],
    emoji: '✝️',
    getDate: (year) => addDays(getEasterSunday(year), -2),
  },
  {
    name: 'Pasen',
    type: 'national',
    contentIdeas: [
      'Vrolijk Pasen! Spring tips voor {niche}',
      'Lente in {niche}: nieuwe kansen',
      'Paasbrunch ideeën',
      'Familie tijd: kwaliteit boven kwantiteit',
    ],
    hashtags: ['#pasen', '#lente', '#paasei', '#voorjaar'],
    emoji: '🐰',
    getDate: (year) => getEasterSunday(year),
  },
  {
    name: 'Tweede Paasdag',
    type: 'national',
    contentIdeas: [
      'Genieten van de paasdagen',
      'Tips voor een productieve week na Pasen',
    ],
    hashtags: ['#tweedepaasdag', '#pasen', '#vrij'],
    emoji: '🐣',
    getDate: (year) => addDays(getEasterSunday(year), 1),
  },
  {
    name: 'Hemelvaartsdag',
    type: 'national',
    contentIdeas: [
      'Lang weekend tips',
      'Tijd voor reflectie en groei',
      'Brugdag plannen',
    ],
    hashtags: ['#hemelvaart', '#langweekend', '#brugdag'],
    emoji: '☁️',
    getDate: (year) => addDays(getEasterSunday(year), 39),
  },
  {
    name: 'Pinksteren',
    type: 'national',
    contentIdeas: [
      'Pinksterweekend: tijd voor inspiratie',
      'Zomer nadert: voorbereidingstips',
    ],
    hashtags: ['#pinksteren', '#pinksterweekend', '#inspiratie'],
    emoji: '🕊️',
    getDate: (year) => addDays(getEasterSunday(year), 49),
  },
  {
    name: 'Tweede Pinksterdag',
    type: 'national',
    contentIdeas: [
      'Laatste dag van het lang weekend',
      'Energie opdoen voor de week',
    ],
    hashtags: ['#tweedepinksterdag', '#langweekend'],
    emoji: '🌸',
    getDate: (year) => addDays(getEasterSunday(year), 50),
  },

  // Cultural/Commercial Holidays
  {
    name: 'Valentijnsdag',
    type: 'commercial',
    contentIdeas: [
      'Liefde voor {niche}',
      'Waarom we van {niche} houden',
      'Cadeautips voor {niche} liefhebbers',
      'Self-love: investeren in jezelf',
    ],
    hashtags: ['#valentijnsdag', '#liefde', '#valentine', '#love'],
    emoji: '💝',
    getDate: (year) => new Date(year, 1, 14),
  },
  {
    name: 'Carnaval',
    type: 'cultural',
    contentIdeas: [
      'Alaaf! Feestelijke {niche} content',
      'Carnaval inspiratie',
      'Kleurrijk en creatief',
    ],
    hashtags: ['#carnaval', '#alaaf', '#vastelaovend'],
    emoji: '🎭',
    getDate: (year) => addDays(getEasterSunday(year), -47), // 47 days before Easter
  },
  {
    name: 'Moederdag',
    type: 'commercial',
    contentIdeas: [
      'Bedankt mama! {niche} cadeautips',
      'Moederdag special',
      'Voor alle supermoeders',
      'Quality time met mama',
    ],
    hashtags: ['#moederdag', '#mama', '#mothersday', '#liefde'],
    emoji: '👩‍👧',
    getDate: (year) => getMothersDay(year),
  },
  {
    name: 'Vaderdag',
    type: 'commercial',
    contentIdeas: [
      'Vaderdag: bedankt papa!',
      'De beste cadeaus voor vaders',
      'Papa weet het beste',
    ],
    hashtags: ['#vaderdag', '#papa', '#fathersday'],
    emoji: '👨‍👧',
    getDate: (year) => getFathersDay(year),
  },
  {
    name: 'Prinsjesdag',
    type: 'cultural',
    contentIdeas: [
      'Prinsjesdag: wat betekent het voor {niche}?',
      'Economische vooruitzichten',
      'Koopkracht en {niche}',
    ],
    hashtags: ['#prinsjesdag', '#denhaag', '#miljoenennota'],
    emoji: '🎩',
    getDate: (year) => {
      // Third Tuesday of September
      const sept = new Date(year, 8, 1);
      const dayOfWeek = sept.getDay();
      const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
      return new Date(year, 8, 1 + daysUntilTuesday + 14);
    },
  },
  {
    name: 'Dierendag',
    type: 'cultural',
    contentIdeas: [
      'Dierendag: onze viervoetige vrienden',
      'Huisdieren en {niche}',
      'Voor alle dierenliefhebbers',
    ],
    hashtags: ['#dierendag', '#huisdieren', '#dieren'],
    emoji: '🐕',
    getDate: (year) => new Date(year, 9, 4),
  },
  {
    name: 'Halloween',
    type: 'commercial',
    contentIdeas: [
      'Spooky {niche} content',
      'Halloween special',
      'Tricks and treats voor {niche}',
    ],
    hashtags: ['#halloween', '#spooky', '#trickortreat'],
    emoji: '🎃',
    getDate: (year) => new Date(year, 9, 31),
  },
  {
    name: 'Sint-Maarten',
    type: 'cultural',
    contentIdeas: [
      'Sint-Maarten: lichtjes in het donker',
      'Delen en geven',
      'Traditionele feesten',
    ],
    hashtags: ['#sintmaarten', '#lampion', '#11november'],
    emoji: '🏮',
    getDate: (year) => new Date(year, 10, 11),
  },
  {
    name: 'Sinterklaas',
    type: 'cultural',
    contentIdeas: [
      'Pakjesavond: de beste {niche} cadeaus',
      'Sinterklaas surprise ideeën',
      'Gedichtentijd!',
      'Sinterklaas tips voor {niche}',
    ],
    hashtags: ['#sinterklaas', '#pakjesavond', '#5december', '#sint'],
    emoji: '🎅',
    getDate: (year) => new Date(year, 11, 5),
  },
  {
    name: 'Kerst',
    type: 'national',
    contentIdeas: [
      'Kerstspecial: onze beste {niche} tips',
      'Kerst cadeaugids',
      'Gezellig de kerst door met {niche}',
      'Terugblik op het jaar',
      'Kerstgroet van ons team',
    ],
    hashtags: ['#kerst', '#christmas', '#kerstmis', '#gezellig'],
    emoji: '🎄',
    getDate: (year) => new Date(year, 11, 25),
  },
  {
    name: 'Tweede Kerstdag',
    type: 'national',
    contentIdeas: [
      'Tweede kerstdag: uitrusten of avonturen',
      'Nakaarten van kerst',
    ],
    hashtags: ['#tweedekerstdag', '#kerst', '#familie'],
    emoji: '🎁',
    getDate: (year) => new Date(year, 11, 26),
  },
  {
    name: 'Oudejaarsavond',
    type: 'national',
    contentIdeas: [
      'Terugblik op {year}',
      'Hoogtepunten van het jaar',
      'Klaar voor {year+1}',
      'Dankbaar voor dit jaar',
    ],
    hashtags: ['#oudjaar', '#oudennieuw', '#bye{year}', '#welkom{year+1}'],
    emoji: '🥂',
    getDate: (year) => new Date(year, 11, 31),
  },

  // Seasonal
  {
    name: 'Start Lente',
    type: 'seasonal',
    contentIdeas: [
      'Lente is begonnen! Frisse {niche} ideeën',
      'Voorjaarsmotivatie',
      'Nieuwe seizoen, nieuwe kansen',
    ],
    hashtags: ['#lente', '#spring', '#voorjaar', '#nieuwbegin'],
    emoji: '🌷',
    getDate: (year) => new Date(year, 2, 20), // ~March 20
  },
  {
    name: 'Start Zomer',
    type: 'seasonal',
    contentIdeas: [
      'Zomer is hier! {niche} zomertips',
      'Zomerse inspiratie',
      'Vakantie voorbereidingen',
    ],
    hashtags: ['#zomer', '#summer', '#vakantie', '#zon'],
    emoji: '☀️',
    getDate: (year) => new Date(year, 5, 21), // ~June 21
  },
  {
    name: 'Start Herfst',
    type: 'seasonal',
    contentIdeas: [
      'Herfst: tijd voor {niche} vernieuwing',
      'Cozy herfst vibes',
      'Back to business',
    ],
    hashtags: ['#herfst', '#autumn', '#fall', '#cozy'],
    emoji: '🍂',
    getDate: (year) => new Date(year, 8, 22), // ~September 22
  },
  {
    name: 'Start Winter',
    type: 'seasonal',
    contentIdeas: [
      'Winter is coming: {niche} wintergids',
      'Gezellige wintertijd',
      'Reflectie en planning',
    ],
    hashtags: ['#winter', '#gezellig', '#hygge'],
    emoji: '❄️',
    getDate: (year) => new Date(year, 11, 21), // ~December 21
  },

  // Commercial Days
  {
    name: 'Black Friday',
    type: 'commercial',
    contentIdeas: [
      'Black Friday deals voor {niche}',
      'De beste aanbiedingen',
      'Slim shoppen tips',
    ],
    hashtags: ['#blackfriday', '#deals', '#korting', '#aanbieding'],
    emoji: '🏷️',
    getDate: (year) => {
      // 4th Friday of November
      const nov = new Date(year, 10, 1);
      const dayOfWeek = nov.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      return new Date(year, 10, 1 + daysUntilFriday + 21);
    },
  },
  {
    name: 'Cyber Monday',
    type: 'commercial',
    contentIdeas: [
      'Cyber Monday: online {niche} aanbiedingen',
      'Laatste kans voor deals',
    ],
    hashtags: ['#cybermonday', '#online', '#deals'],
    emoji: '💻',
    getDate: (year) => {
      // Monday after Black Friday
      const nov = new Date(year, 10, 1);
      const dayOfWeek = nov.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      const blackFriday = new Date(year, 10, 1 + daysUntilFriday + 21);
      return addDays(blackFriday, 3);
    },
  },
];

/**
 * Get all holidays for a specific year
 */
export function getHolidaysForYear(year: number): Holiday[] {
  return DUTCH_HOLIDAYS
    .map((def) => {
      const date = def.getDate(year);
      if (!date) return null;
      return {
        name: def.name,
        date,
        type: def.type,
        contentIdeas: def.contentIdeas,
        hashtags: def.hashtags,
        emoji: def.emoji,
      };
    })
    .filter((h): h is Holiday => h !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get upcoming holidays within a date range
 */
export function getUpcomingHolidays(
  fromDate: Date,
  toDate: Date
): Holiday[] {
  const fromYear = fromDate.getFullYear();
  const toYear = toDate.getFullYear();

  const holidays: Holiday[] = [];

  for (let year = fromYear; year <= toYear; year++) {
    const yearHolidays = getHolidaysForYear(year);
    holidays.push(
      ...yearHolidays.filter(
        (h) => h.date >= fromDate && h.date <= toDate
      )
    );
  }

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get the next holiday from today
 */
export function getNextHoliday(fromDate: Date = new Date()): Holiday | null {
  const year = fromDate.getFullYear();
  const holidays = [
    ...getHolidaysForYear(year),
    ...getHolidaysForYear(year + 1),
  ];

  return (
    holidays.find((h) => h.date >= fromDate) || null
  );
}

/**
 * Check if a date is a holiday (or within X days of one)
 */
export function getHolidayForDate(
  date: Date,
  daysBuffer: number = 0
): Holiday | null {
  const year = date.getFullYear();
  const holidays = getHolidaysForYear(year);

  for (const holiday of holidays) {
    const diff = Math.abs(date.getTime() - holiday.date.getTime());
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    if (daysDiff <= daysBuffer) {
      return holiday;
    }
  }

  return null;
}

/**
 * Get holiday content suggestion for a given niche
 */
export function getHolidayContentIdea(
  holiday: Holiday,
  niche: string,
  year: number = new Date().getFullYear()
): string {
  const ideas = holiday.contentIdeas;
  const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];

  return randomIdea
    .replace('{niche}', niche)
    .replace('{year}', year.toString())
    .replace('{year-1}', (year - 1).toString())
    .replace('{year+1}', (year + 1).toString());
}

/**
 * Check if we should create holiday content for a given scheduled date
 * Returns the holiday if content should be created 1-3 days before the holiday
 */
export function getRelevantHolidayForScheduledDate(
  scheduledDate: Date
): Holiday | null {
  const year = scheduledDate.getFullYear();
  const holidays = [
    ...getHolidaysForYear(year),
    ...getHolidaysForYear(year + 1),
  ];

  for (const holiday of holidays) {
    const diffMs = holiday.date.getTime() - scheduledDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Post should be 0-3 days before the holiday (day of or up to 3 days before)
    if (diffDays >= 0 && diffDays <= 3) {
      return holiday;
    }
  }

  return null;
}

export type { Holiday, HolidayDefinition };
