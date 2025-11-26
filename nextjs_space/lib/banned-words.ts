
/**
 * Verboden Woorden Filter
 * Deze woorden mogen NOOIT voorkomen in gegenereerde content
 */

// Nederlandse Banned Words
export const BANNED_WORDS_NL = [
  'wereld van',
  'in de wereld van',
  'in een wereld van',
  'in een wereld vol',
  'in een wereld vol keuzes',
  'cruciaal',
  'cruciale',
  'essentieel',
  'kortom',
  'conclusie',
  'duik',
  'duiken',
  'induiken',
  'duiken in',
  'dompel',
  'dompelen',
  'ontdek',
  'ontdekken',
  'verken',
  'verkennen',
  'vriend',
  'jungle',
  'juweel',
  'pareltje',
  'verborgen parel',
  'geheim',
  'geheime',
  'de sleutel',
  'superheld',
  'superheldin',
  'superkracht',
  'spul',
  'veilige haven',
  'gids',
  'voordelen',
  'voordelen van',
  'digitaal tijdperk',
  'zonder gedoe',
  'gedoe',
  'of je',
  'of je nu',
  'game changer',
  'gamechanger',
  'game-changer',
  'toverwoord',
  'tovermiddel',
  'wondermiddel',
  'heilige graal',
  'magische oplossing',
  'magisch middel',
  'revolutionair',
  'baanbrekend',
  'ultiem',
  'ultieme',
  'definitief',
  'definitieve',
  'absoluut',
  'absolute',
  'totaal',
  'totale',
  'volledig',
  'volledige',
  'perfect',
  'perfecte',
  'ideaal',
  'ideale',
  'onmisbaar',
  'onmisbare',
] as const;

// English Banned Words
export const BANNED_WORDS_EN = [
  'world of',
  'in a world of',
  'in a world full of',
  'crucial',
  'essentially',
  'in a nutshell',
  'conclusion',
  'dive',
  'dive in',
  'dive into',
  'immerse',
  'discover',
  'explore',
  'buddy',
  'friend',
  'jungle',
  'jewel',
  'gem',
  'hidden gem',
  'secret',
  'the key',
  'key',
  'superhero',
  'superpower',
  'stuff',
  'safe haven',
  'guide',
  'benefits',
  'digital age',
  'hassle',
  'hassle-free',
  'whether you',
  'whether you are',
  'game changer',
  'gamechanger',
  'game-changer',
  'magic word',
  'magic solution',
  'holy grail',
  'revolutionary',
  'groundbreaking',
  'ultimate',
  'definitive',
  'absolute',
  'total',
  'complete',
  'perfect',
  'ideal',
  'indispensable',
  'essential',
  'perhaps',
  'maybe',
  'unlock',
  'unlocking',
  'elevate',
  'elevating',
  'transform',
  'transformative',
  'seamless',
  'seamlessly',
  'embark',
  'embark on',
  'journey',
  'landscape',
  'realm',
  'delve',
  'delve into',
  'navigate',
  'navigating',
  'uncover',
  'unleash',
  'harness',
  'harnessing',
  'revolutionize',
  'cutting-edge',
  'state-of-the-art',
  'robust',
  'comprehensive',
  'holistic',
  'dynamic',
  'innovative',
  'paradigm',
  'meticulous',
  'meticulously',
  'intricate',
  'intricacies',
  'vibrant',
  'bustling',
  'treasure trove',
  'plethora',
  'myriad',
] as const;

// German Banned Words
export const BANNED_WORDS_DE = [
  'welt der',
  'welt von',
  'in einer welt',
  'in einer welt voller',
  'entscheidend',
  'wesentlich',
  'kurz gesagt',
  'fazit',
  'eintauchen',
  'tauchen',
  'entdecken',
  'erkunden',
  'freund',
  'dschungel',
  'juwel',
  'perle',
  'verstecktes juwel',
  'geheimnis',
  'geheime',
  'der schlüssel',
  'superheld',
  'superkraft',
  'zeug',
  'sicherer hafen',
  'leitfaden',
  'vorteile',
  'digitales zeitalter',
  'ohne aufwand',
  'aufwand',
  'ob du',
  'ob sie',
  'gamechanger',
  'zauberwort',
  'zauberlösung',
  'heiliger gral',
  'magische lösung',
  'revolutionär',
  'bahnbrechend',
  'ultimativ',
  'definitiv',
  'absolut',
  'total',
  'vollständig',
  'perfekt',
  'ideal',
  'unverzichtbar',
  'vielleicht',
  'möglicherweise',
  'erschließen',
  'erheben',
  'verwandeln',
  'nahtlos',
  'reise',
  'landschaft',
  'bereich',
  'vertiefen',
  'navigieren',
  'aufdecken',
  'entfesseln',
  'nutzen',
  'revolutionieren',
  'hochmodern',
  'robust',
  'umfassend',
  'ganzheitlich',
  'dynamisch',
  'innovativ',
  'paradigma',
  'akribisch',
  'komplex',
  'lebendig',
  'schatztruhe',
  'fülle',
  'unzählige',
] as const;

// Spanish Banned Words
export const BANNED_WORDS_ES = [
  'mundo de',
  'en un mundo de',
  'en un mundo lleno de',
  'crucial',
  'esencialmente',
  'en resumen',
  'conclusión',
  'sumergir',
  'sumergirse',
  'descubrir',
  'explorar',
  'amigo',
  'jungla',
  'joya',
  'joya oculta',
  'secreto',
  'la clave',
  'superhéroe',
  'superpoder',
  'refugio seguro',
  'guía',
  'ventajas',
  'era digital',
  'sin complicaciones',
  'complicaciones',
  'cambio de juego',
  'palabra mágica',
  'solución mágica',
  'santo grial',
  'revolucionario',
  'innovador',
  'definitivo',
  'absoluto',
  'total',
  'completo',
  'perfecto',
  'ideal',
  'imprescindible',
  'quizás',
  'posiblemente',
  'desbloquear',
  'elevar',
  'transformar',
  'sin problemas',
  'viaje',
  'paisaje',
  'ámbito',
  'profundizar',
  'navegar',
  'revelar',
  'desatar',
  'aprovechar',
  'robusto',
  'integral',
  'holístico',
  'dinámico',
  'paradigma',
  'meticuloso',
  'complejo',
  'vibrante',
  'tesoro',
  'abundancia',
  'innumerables',
] as const;

// French Banned Words
export const BANNED_WORDS_FR = [
  'monde de',
  'dans un monde de',
  'dans un monde plein de',
  'crucial',
  'essentiellement',
  'en bref',
  'conclusion',
  'plonger',
  'immerger',
  'découvrir',
  'explorer',
  'ami',
  'jungle',
  'bijou',
  'joyau caché',
  'secret',
  'la clé',
  'super-héros',
  'super-pouvoir',
  'refuge sûr',
  'guide',
  'avantages',
  'ère numérique',
  'sans tracas',
  'tracas',
  'changeur de jeu',
  'mot magique',
  'solution magique',
  'saint graal',
  'révolutionnaire',
  'innovant',
  'ultime',
  'définitif',
  'absolu',
  'total',
  'complet',
  'parfait',
  'idéal',
  'indispensable',
  'peut-être',
  'éventuellement',
  'débloquer',
  'élever',
  'transformer',
  'transparent',
  'voyage',
  'paysage',
  'domaine',
  'approfondir',
  'naviguer',
  'révéler',
  'déchaîner',
  'tirer parti',
  'robuste',
  'complet',
  'holistique',
  'dynamique',
  'paradigme',
  'méticuleux',
  'complexe',
  'vibrant',
  'trésor',
  'abondance',
  'innombrables',
] as const;

// Italian Banned Words
export const BANNED_WORDS_IT = [
  'mondo di',
  'in un mondo di',
  'in un mondo pieno di',
  'cruciale',
  'essenzialmente',
  'in breve',
  'conclusione',
  'immergersi',
  'tuffarsi',
  'scoprire',
  'esplorare',
  'amico',
  'giungla',
  'gioiello',
  'gemma nascosta',
  'segreto',
  'la chiave',
  'supereroe',
  'superpotere',
  'rifugio sicuro',
  'guida',
  'vantaggi',
  'era digitale',
  'senza problemi',
  'problemi',
  'cambia tutto',
  'parola magica',
  'soluzione magica',
  'santo graal',
  'rivoluzionario',
  'innovativo',
  'definitivo',
  'assoluto',
  'totale',
  'completo',
  'perfetto',
  'ideale',
  'indispensabile',
  'forse',
  'possibilmente',
  'sbloccare',
  'elevare',
  'trasformare',
  'senza intoppi',
  'viaggio',
  'paesaggio',
  'ambito',
  'approfondire',
  'navigare',
  'rivelare',
  'scatenare',
  'sfruttare',
  'robusto',
  'completo',
  'olistico',
  'dinamico',
  'paradigma',
  'meticoloso',
  'complesso',
  'vibrante',
  'tesoro',
  'abbondanza',
  'innumerevoli',
] as const;

// Portuguese Banned Words
export const BANNED_WORDS_PT = [
  'mundo de',
  'em um mundo de',
  'em um mundo cheio de',
  'crucial',
  'essencialmente',
  'em resumo',
  'conclusão',
  'mergulhar',
  'imergir',
  'descobrir',
  'explorar',
  'amigo',
  'selva',
  'joia',
  'joia escondida',
  'segredo',
  'a chave',
  'super-herói',
  'super-poder',
  'refúgio seguro',
  'guia',
  'vantagens',
  'era digital',
  'sem complicações',
  'complicações',
  'mudança de jogo',
  'palavra mágica',
  'solução mágica',
  'santo graal',
  'revolucionário',
  'inovador',
  'definitivo',
  'absoluto',
  'total',
  'completo',
  'perfeito',
  'ideal',
  'indispensável',
  'talvez',
  'possivelmente',
  'desbloquear',
  'elevar',
  'transformar',
  'sem problemas',
  'jornada',
  'paisagem',
  'âmbito',
  'aprofundar',
  'navegar',
  'revelar',
  'desencadear',
  'aproveitar',
  'robusto',
  'abrangente',
  'holístico',
  'dinâmico',
  'paradigma',
  'meticuloso',
  'complexo',
  'vibrante',
  'tesouro',
  'abundância',
  'inúmeros',
] as const;

// Legacy export for backward compatibility
export const BANNED_WORDS = [...BANNED_WORDS_NL, ...BANNED_WORDS_EN, ...BANNED_WORDS_DE, ...BANNED_WORDS_ES, ...BANNED_WORDS_FR, ...BANNED_WORDS_IT, ...BANNED_WORDS_PT] as const;

/**
 * Get banned words for specific language
 */
export function getBannedWordsForLanguage(language: 'nl' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt'): readonly string[] {
  switch (language) {
    case 'nl':
      return BANNED_WORDS_NL;
    case 'en':
      return BANNED_WORDS_EN;
    case 'de':
      return BANNED_WORDS_DE;
    case 'es':
      return BANNED_WORDS_ES;
    case 'fr':
      return BANNED_WORDS_FR;
    case 'it':
      return BANNED_WORDS_IT;
    case 'pt':
      return BANNED_WORDS_PT;
    default:
      return BANNED_WORDS_NL;
  }
}

/**
 * Detecteer verboden woorden in tekst (case-insensitive)
 */
export function detectBannedWords(text: string, language?: 'nl' | 'en' | 'de'): string[] {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  const wordsToCheck = language ? getBannedWordsForLanguage(language) : BANNED_WORDS;
  
  for (const word of wordsToCheck) {
    // Gebruik word boundaries voor volledige woorden
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerText)) {
      found.push(word);
    }
  }
  
  return [...new Set(found)]; // Unieke woorden
}

/**
 * Verwijder verboden woorden uit tekst
 * LET OP: Deze functie vervangt woorden met alternatief - NOOIT ALLEEN VERWIJDEREN
 */
export function removeBannedWords(text: string): string {
  if (!text) return text;
  
  let cleanedText = text;
  
  // UITGEBREIDE VERVANGINGEN - Elke banned word krijgt een goed alternatief
  const replacements: Record<string, string> = {
    // Nederlandse AI woorden
    'cruciaal': 'belangrijk',
    'cruciale': 'belangrijke',
    'essentieel': 'noodzakelijk',
    'essentiële': 'noodzakelijke',
    'kortom': 'samenvattend',
    'conclusie': 'tot slot',
    'duik': 'ga',
    'duiken': 'gaan',
    'induiken': 'ingaan op',
    'duiken in': 'gaan we in op',
    'dompel': 'verdiep',
    'dompelen': 'verdiepen',
    'ontdek': 'zie',
    'ontdekken': 'zien',
    'verken': 'bekijk',
    'verkennen': 'bekijken',
    'vriend': 'iemand',
    'jungle': 'oerwoud',
    'juweel': 'parel',
    'pareltje': 'juweeltje',
    'verborgen parel': 'verborgen juweeltje',
    'geheim': 'bijzonder',
    'geheime': 'bijzondere',
    'de sleutel': 'het belangrijkste',
    'superheld': 'professional',
    'superheldin': 'professional',
    'superkracht': 'sterke eigenschap',
    'spul': 'dingen',
    'veilige haven': 'betrouwbare plek',
    'gids': 'overzicht',
    'voordelen': 'pluspunten',
    'voordelen van': 'pluspunten van',
    'digitaal tijdperk': 'digitale wereld',
    'zonder gedoe': 'eenvoudig',
    'gedoe': 'moeite',
    'of je': 'als je',
    'of je nu': 'als je',

    'toverwoord': 'magisch woord',
    'tovermiddel': 'wondermiddel',
    'wondermiddel': 'krachtig middel',
    'heilige graal': 'ideale oplossing',
    'magische oplossing': 'perfecte oplossing',
    'magisch middel': 'krachtig middel',
    'revolutionair': 'vernieuwend',
    'baanbrekend': 'vernieuwend',
    'ultiem': 'beste',
    'ultieme': 'beste',
    'definitief': 'eindelijk',
    'definitieve': 'eindelijke',
    'absoluut': 'zeker',
    'absolute': 'zekere',
    'totaal': 'heel',
    'totale': 'hele',
    'volledig': 'compleet',
    'volledige': 'complete',
    'perfect': 'heel goed',
    'perfecte': 'zeer goede',
    'ideaal': 'uitstekend',
    'ideale': 'uitstekende',
    'onmisbaar': 'waardevol',
    'onmisbare': 'waardevolle',
    'wereld van': 'wereld met',
    'in de wereld van': 'in de wereld met',
    'in een wereld van': 'in een wereld met',
    'in een wereld vol': 'in een wereld met',
    'in een wereld vol keuzes': 'bij alle keuzes',
    
    // Engelse AI woorden (alleen unieke, geen duplicaten met NL/DE)
    'world of': 'world with',
    'in a world of': 'in a world with',
    'in a world full of': 'with all the',
    'crucial': 'important',
    'essentially': 'basically',
    'in a nutshell': 'in summary',
    'immerse': 'engage',
    'buddy': 'friend',
    'jewel': 'gem',
    'hidden gem': 'hidden treasure',
    'the key': 'the important thing',
    'superpower': 'strength',
    'stuff': 'things',
    'safe haven': 'secure place',
    'benefits': 'advantages',
    'hassle': 'trouble',
    'hassle-free': 'easy',
    'whether you': 'if you',
    'whether you are': 'if you are',
    'magic word': 'powerful word',
    'magic solution': 'great solution',
    'groundbreaking': 'innovative',
    'perhaps': 'maybe',
    'unlock': 'access',
    'unlocking': 'accessing',
    'elevate': 'improve',
    'elevating': 'improving',
    'transformative': 'game-changing',
    'seamless': 'smooth',
    'seamlessly': 'smoothly',
    'embark': 'start',
    'embark on': 'start on',
    'journey': 'path',
    'landscape': 'environment',
    'realm': 'area',
    'delve': 'dig',
    'delve into': 'dig into',
    'navigate': 'work through',
    'navigating': 'working through',
    'uncover': 'reveal',
    'unleash': 'release',
    'harness': 'utilize',
    'harnessing': 'utilizing',
    'revolutionize': 'transform',
    'cutting-edge': 'modern',
    'state-of-the-art': 'advanced',
    'meticulous': 'careful',
    'meticulously': 'carefully',
    'intricate': 'detailed',
    'intricacies': 'details',
    'vibrant': 'lively',
    'bustling': 'busy',
    'treasure trove': 'collection',
    'plethora': 'many',
    'myriad': 'countless',
    
    // Duitse AI woorden (alleen unieke, geen duplicaten met NL/EN)
    'welt der': 'welt mit',
    'welt von': 'welt mit',
    'in einer welt': 'in der welt',
    'in einer welt voller': 'bei allen',
    'entscheidend': 'wichtig',
    'wesentlich': 'notwendig',
    'kurz gesagt': 'zusammenfassend',
    'fazit': 'abschließend',
    'eintauchen': 'eingehen',
    'tauchen': 'gehen',
    'freund (de)': 'person',
    'dschungel': 'welt',
    'verstecktes juwel': 'versteckter schatz',
    'geheimnis': 'besonderheit',
    'zeug': 'sachen',
    'sicherer hafen': 'sicherer ort',
    'leitfaden': 'übersicht',
    'digitales zeitalter': 'digitale welt',
    'ohne aufwand': 'einfach',
    'aufwand': 'mühe',
    'ob du': 'wenn du',
    'ob sie': 'wenn sie',
    'zauberwort': 'mächtiges wort',
    'zauberlösung': 'großartige lösung',
    'heiliger gral (de)': 'ideale lösung',
    'magische lösung': 'perfekte lösung',
    'vielleicht': 'möglicherweise',
    'erschließen': 'zugreifen',
    'erheben': 'verbessern',
    'verwandeln': 'ändern',
    'nahtlos': 'reibungslos',
    'reise': 'weg',
    'landschaft (de)': 'umgebung',
    'bereich': 'gebiet',
    'vertiefen': 'erkunden',
    'navigieren (de)': 'durcharbeiten',
    'entfesseln': 'freisetzen',
    'nutzen': 'verwenden',
    'revolutionieren': 'ändern',
    'hochmodern': 'modern',
    'akribisch': 'sorgfältig',
    'komplex': 'kompliziert',
    'lebendig': 'lebhaft',
    'schatztruhe': 'sammlung',
    'fülle': 'viele',
    'unzählige': 'zahlreiche',
    
    // Spaanse AI woorden
    // Spaanse AI woorden
    'es_mundo de': 'mundo con',
    'es_en un mundo de': 'en un mundo con',
    'es_en un mundo lleno de': 'con muchas opciones',
    'es_crucial': 'importante',
    'esencialmente': 'básicamente',
    'en resumen': 'resumiendo',
    'es_conclusión': 'finalmente',
    'sumergir': 'explorar',
    'sumergirse': 'explorar',
    'es_descubrir': 'ver',
    'es_explorar': 'revisar',
    'es_amigo': 'alguien',
    'jungla': 'selva',
    'joya': 'tesoro',
    'joya oculta': 'tesoro escondido',
    'es_secreto': 'especial',
    'la clave': 'lo importante',
    'superhéroe': 'profesional',
    'superpoder': 'gran ventaja',
    'refugio seguro': 'lugar confiable',
    'es_guía': 'resumen',
    'ventajas': 'beneficios',
    'es_era digital': 'mundo digital',
    'sin complicaciones': 'fácilmente',
    'es_complicaciones': 'dificultades',
    'cambio de juego': 'gran cambio',
    'palabra mágica': 'solución ideal',
    'solución mágica': 'solución perfecta',
    'es_santo grial': 'solución ideal',
    'revolucionario': 'innovador',
    'es_definitivo': 'final',
    'es_absoluto': 'completo',
    'es_total': 'completo',
    'es_completo': 'íntegro',
    'es_perfecto': 'excelente',
    'es_ideal': 'óptimo',
    'imprescindible': 'necesario',
    
    // Franse AI woorden
    'monde de': 'monde avec',
    'dans un monde de': 'dans un monde avec',
    'dans un monde plein de': 'avec beaucoup de choix',
    'fr_crucial': 'important',
    'essentiellement': 'fondamentalement',
    'en bref': 'en résumé',
    'fr_conclusion': 'finalement',
    'plonger': 'explorer',
    'immerger': 'explorer',
    'découvrir': 'voir',
    'fr_explorer': 'examiner',
    'ami': 'quelqu\'un',
    'fr_jungle': 'forêt',
    'bijou': 'trésor',
    'joyau caché': 'trésor caché',
    'fr_secret': 'spécial',
    'la clé': 'l\'important',
    'super-héros': 'professionnel',
    'super-pouvoir': 'grand avantage',
    'refuge sûr': 'endroit fiable',
    'fr_guide': 'aperçu',
    'avantages': 'bénéfices',
    'ère numérique': 'monde numérique',
    'sans tracas': 'facilement',
    'tracas': 'difficultés',
    'changeur de jeu': 'grand changement',
    'mot magique': 'solution idéale',
    'solution magique': 'solution parfaite',
    'fr_saint graal': 'solution idéale',
    'révolutionnaire': 'innovant',
    'fr_définitif': 'final',
    'fr_absolu': 'complet',
    'fr_total': 'complet',
    'fr_complet': 'entier',
    'parfait': 'excellent',
    'fr_idéal': 'optimal',
    'indispensable': 'nécessaire',
    
    // Italiaanse AI woorden
    'mondo di': 'mondo con',
    'in un mondo di': 'in un mondo con',
    'in un mondo pieno di': 'con molte scelte',
    'it_cruciale': 'importante',
    'it_essenzialmente': 'fondamentalmente',
    'in breve': 'riassumendo',
    'it_conclusione': 'finalmente',
    'immergersi': 'esplorare',
    'tuffarsi': 'esplorare',
    'scoprire': 'vedere',
    'it_esplorare': 'esaminare',
    'it_amico': 'qualcuno',
    'giungla': 'foresta',
    'gioiello': 'tesoro',
    'gemma nascosta': 'tesoro nascosto',
    'segreto': 'speciale',
    'la chiave': 'l\'importante',
    'supereroe': 'professionista',
    'superpotere': 'grande vantaggio',
    'rifugio sicuro': 'posto affidabile',
    'it_guida': 'panoramica',
    'vantaggi': 'benefici',
    'it_era digitale': 'mondo digitale',
    'senza problemi': 'facilmente',
    'problemi': 'difficoltà',
    'cambia tutto': 'grande cambiamento',
    'parola magica': 'soluzione ideale',
    'soluzione magica': 'soluzione perfetta',
    'it_santo graal': 'soluzione ideale',
    'rivoluzionario': 'innovativo',
    'it_definitivo': 'finale',
    'it_assoluto': 'completo',
    'it_totale': 'completo',
    'it_completo': 'intero',
    'perfetto': 'eccellente',
    'it_ideale': 'ottimale',
    'it_indispensabile': 'necessario',
    
    // Portugese AI woorden
    'pt_mundo de': 'mundo com',
    'em um mundo de': 'em um mundo com',
    'em um mundo cheio de': 'com muitas escolhas',
    'pt_crucial': 'importante',
    'pt_essencialmente': 'basicamente',
    'pt_em resumo': 'resumindo',
    'pt_conclusão': 'finalmente',
    'mergulhar': 'explorar',
    'imergir': 'explorar',
    'pt_descobrir': 'ver',
    'pt_explorar': 'examinar',
    'pt_amigo': 'alguém',
    'selva': 'floresta',
    'joia': 'tesouro',
    'joia escondida': 'tesouro escondido',
    'pt_segredo': 'especial',
    'a chave': 'o importante',
    'super-herói': 'profissional',
    'super-poder': 'grande vantagem',
    'refúgio seguro': 'lugar confiável',
    'pt_guia': 'visão geral',
    'vantagens': 'benefícios',
    'pt_era digital': 'mundo digital',
    'sem complicações': 'facilmente',
    'pt_complicações': 'dificuldades',
    'mudança de jogo': 'grande mudança',
    'palavra mágica': 'solução ideal',
    'solução mágica': 'solução perfeita',
    'pt_santo graal': 'solução ideal',
    'pt_revolucionário': 'inovador',
    'pt_definitivo': 'final',
    'pt_absoluto': 'completo',
    'pt_total': 'completo',
    'pt_completo': 'inteiro',
    'perfeito': 'excelente',
    'pt_ideal': 'ótimo',
    'pt_indispensável': 'necessário',
  };
  
  // Sorteer op lengte (langste eerst) om overlappende matches te voorkomen
  const sortedReplacements = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);
  
  // Vervang alle verboden woorden met hun alternatief
  for (const [banned, replacement] of sortedReplacements) {
    // Escape special regex characters
    const escapedBanned = banned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Word boundary voor hele woorden, maar flexibel voor phrases
    const regex = new RegExp(`\\b${escapedBanned}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, replacement);
  }
  
  // Opschonen: dubbele spaties en extra witruimte
  cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim();
  
  // Fix dubbele punten, komma's etc
  cleanedText = cleanedText.replace(/([.,!?])\s*\1+/g, '$1');
  
  return cleanedText;
}

/**
 * Valideer of tekst vrij is van verboden woorden
 */
export function isContentValid(text: string): {
  valid: boolean;
  bannedWords: string[];
  message?: string;
} {
  const found = detectBannedWords(text);
  
  if (found.length === 0) {
    return { valid: true, bannedWords: [] };
  }
  
  return {
    valid: false,
    bannedWords: found,
    message: `Verboden woorden gevonden: ${found.join(', ')}. Deze moeten verwijderd worden.`
  };
}

/**
 * Genereer taalspecifieke instructies voor AI om verboden woorden te vermijden
 */
export function getBannedWordsInstructions(language: 'nl' | 'en' | 'de' = 'nl'): string {
  if (language === 'en') {
    return getEnglishBannedWordsInstructions();
  } else if (language === 'de') {
    return getGermanBannedWordsInstructions();
  }
  
  return `
❌ VERBODEN WOORDEN - Deze woorden/zinnen mogen NOOIT gebruikt worden:

Nederlandse woorden:
- wereld van, in een wereld van, in een wereld vol keuzes (gebruik: wereld, gebied, domein, nu, tegenwoordig)
- cruciaal, cruciale (gebruik: belangrijk, essentieel voor)
- essentieel (gebruik: noodzakelijk, belangrijk) 
- kortom (gebruik: samengevat, kort gezegd)
- conclusie (gebruik: afsluiting, tot slot, samenvatting)
- duik, duiken, induiken, duiken in (gebruik: kijk, bekijk, ga naar)
- dompel, dompelen (gebruik: verdiep je, ga mee)
- ontdek, ontdekken (gebruik: zie, vind, bekijk)
- verken, verkennen (gebruik: bekijk, bezoek, zie)
- vriend (gebruik: persoon, bezoeker)
- jungle (gebruik: overvloed, keuze, variëteit)
- juweel, pareltje, verborgen parel (gebruik: aanrader, favoriet, toplocatie)
- geheim, geheime (gebruik: bijzonder, speciaal, minder bekend)
- de sleutel, key (gebruik: het belangrijkste, de kern)
- superheld, superheldin, superkracht (gebruik: expert, specialist)
- spul (gebruik: zaken, items, dingen)
- veilige haven (gebruik: betrouwbare plek, goede keuze)
- gids (gebruik: handleiding, overzicht, tips)
- voordelen, voordelen van (gebruik: pluspunten, sterke punten, waarom kiezen voor)
- digitaal tijdperk (gebruik: moderne tijd, tegenwoordig)
- zonder gedoe, gedoe (gebruik: eenvoudig, gemakkelijk, zonder moeite)
- of je, of je nu (gebruik: of je, ongeacht)
- ultiem, ultieme (gebruik: beste, ideale, perfecte)
- vielleicht (NOOIT Duitse woorden - gebruik: misschien, wellicht)

Engelse varianten (GEBRUIK ALLEEN NEDERLANDS):
- key (gebruik: belangrijk, main)
- guide (gebruik: handleiding, overview)
- hassle (gebruik: moeite, effort)
- in a nutshell (gebruik: in het kort, briefly)
- dive in, dive into (gebruik: bekijk, explore)
- crucial (gebruik: belangrijk, important)
- essential (gebruik: noodzakelijk, necessary)
- world of (gebruik: wereld, domain)
- buddy (gebruik: persoon, friend)
- stuff (gebruik: zaken, things)
- safe haven (gebruik: betrouwbare plek, reliable place)
- superhero (gebruik: expert, specialist)
- digital age (gebruik: moderne tijd, modern times)
- discover (gebruik: zie, vind, find)
- explore (gebruik: bekijk, bezoek, visit)
- jewel, hidden gem (gebruik: favoriet, aanrader, great choice)
- secret (gebruik: bijzonder, special)
- immerse (gebruik: ervaar, geniet, enjoy)
- ultimate (gebruik: beste, ideale, best)
- game changer (gebruik: innovatief, vernieuwend, innovative)
- revolutionary (gebruik: vernieuwend, baanbrekend, innovative)
- perhaps, maybe (gebruik: misschien, wellicht)

✅ Gebruik ALTIJD alternatieven zoals aangegeven tussen haakjes.
✅ Wees creatief met synoniemen, maar GEBRUIK NOOIT de verboden woorden.
✅ Schrijf natuurlijk en toegankelijk, alsof je een vriend adviseert (gebruik "je" vorm).
✅ Vermijd AI-detecteerbare patronen en clichés.
✅ ALLEEN NEDERLANDS - GEEN Duitse, Engelse of andere woorden!
`.trim();
}


/**
 * English banned words instructions
 */
function getEnglishBannedWordsInstructions(): string {
  return `
❌ BANNED WORDS - These words/phrases must NEVER be used:

- world of, in a world of, in a world full of (use: area, field, nowadays)
- crucial (use: important, vital)
- essentially (use: basically, fundamentally)
- in a nutshell (use: in summary, briefly)
- conclusion (use: summary, to sum up)
- dive, dive in, dive into (use: look at, explore, check out)
- immerse (use: experience, engage with)
- discover (use: find, see, learn about)
- explore (use: look at, check out, examine)
- buddy, friend (use: person, visitor)
- jungle (use: variety, range, selection)
- jewel, gem, hidden gem (use: favorite, great choice, recommendation)
- secret (use: special, unique, lesser-known)
- the key, key (use: important, main point, core)
- superhero, superpower (use: expert, specialist)
- stuff (use: things, items)
- safe haven (use: reliable place, good choice)
- guide (use: overview, tips, information)
- benefits (use: advantages, strong points, why choose)
- digital age (use: modern times, nowadays, today)
- hassle, hassle-free (use: easy, simple, without effort)
- whether you (use: if you, regardless of)
- unlock, unlocking (use: access, enable, open up)
- elevate, elevating (use: improve, enhance, raise)
- transform, transformative (use: change, improve, modify)
- seamless, seamlessly (use: smooth, easy, effortless)
- embark, embark on (use: start, begin, undertake)
- journey (use: experience, process, path)
- landscape (use: field, area, scene)
- realm (use: area, field, domain)
- delve, delve into (use: examine, look at, study)
- navigate, navigating (use: find your way, manage, handle)
- uncover (use: find, reveal, show)
- unleash (use: release, use, apply)
- harness, harnessing (use: use, apply, utilize)
- revolutionize (use: change, improve, innovate)
- cutting-edge, state-of-the-art (use: modern, advanced, latest)
- robust (use: strong, solid, reliable)
- comprehensive (use: complete, thorough, full)
- holistic (use: complete, full, overall)
- dynamic (use: active, changing, flexible)
- innovative (use: new, creative, original)
- paradigm (use: model, approach, way)
- meticulous, meticulously (use: careful, detailed, thorough)
- intricate, intricacies (use: complex, detailed, nuanced)
- vibrant, bustling (use: lively, active, busy)
- treasure trove (use: collection, variety, range)
- plethora, myriad (use: many, various, lots of)
- game changer, gamechanger (use: innovative, breakthrough, major improvement)
- revolutionary (use: innovative, groundbreaking, major change)
- ultimate (use: best, ideal, top)
- perhaps, maybe (use: possibly, potentially, might)

✅ ALWAYS use alternatives as indicated in parentheses.
✅ Be creative with synonyms, but NEVER use the banned words.
✅ Write naturally and accessibly, avoid robotic AI patterns.
✅ Avoid AI-detectable patterns and clichés.
✅ ONLY ENGLISH - NO Dutch, German or other language words!
`.trim();
}

/**
 * German banned words instructions
 */
function getGermanBannedWordsInstructions(): string {
  return `
❌ VERBOTENE WÖRTER - Diese Wörter/Phrasen dürfen NIEMALS verwendet werden:

- welt der, welt von, in einer welt, in einer welt voller (verwenden Sie: Bereich, Gebiet, heutzutage)
- entscheidend (verwenden Sie: wichtig, wesentlich)
- wesentlich (verwenden Sie: notwendig, wichtig)
- kurz gesagt (verwenden Sie: zusammengefasst, kurz)
- fazit (verwenden Sie: zusammenfassung, abschluss)
- eintauchen, tauchen (verwenden Sie: schauen, ansehen, erkunden)
- entdecken (verwenden Sie: finden, sehen, kennenlernen)
- erkunden (verwenden Sie: ansehen, besuchen, untersuchen)
- freund (verwenden Sie: Person, Besucher)
- dschungel (verwenden Sie: Vielfalt, Auswahl, Angebot)
- juwel, perle, verstecktes juwel (verwenden Sie: Empfehlung, Favorit, Top-Wahl)
- geheimnis, geheime (verwenden Sie: besonders, speziell, weniger bekannt)
- der schlüssel (verwenden Sie: das Wichtigste, der Kern)
- superheld, superkraft (verwenden Sie: Experte, Spezialist)
- zeug (verwenden Sie: Dinge, Sachen)
- sicherer hafen (verwenden Sie: zuverlässiger Ort, gute Wahl)
- leitfaden (verwenden Sie: Übersicht, Tipps, Informationen)
- vorteile (verwenden Sie: Pluspunkte, Stärken, warum wählen)
- digitales zeitalter (verwenden Sie: moderne Zeit, heutzutage)
- ohne aufwand, aufwand (verwenden Sie: einfach, mühelos, leicht)
- ob du, ob sie (verwenden Sie: ob, unabhängig davon)
- erschließen (verwenden Sie: zugänglich machen, öffnen)
- erheben (verwenden Sie: verbessern, steigern)
- verwandeln (verwenden Sie: ändern, verbessern, modifizieren)
- nahtlos (verwenden Sie: reibungslos, einfach, mühelos)
- reise (verwenden Sie: Erfahrung, Prozess, Weg)
- landschaft (verwenden Sie: Bereich, Gebiet, Szene)
- bereich (verwenden Sie: Gebiet, Feld, Domain)
- vertiefen (verwenden Sie: untersuchen, ansehen, studieren)
- navigieren (verwenden Sie: den Weg finden, handhaben)
- aufdecken (verwenden Sie: finden, zeigen, enthüllen)
- entfesseln (verwenden Sie: freisetzen, nutzen, anwenden)
- nutzen (verwenden Sie: verwenden, anwenden, einsetzen)
- revolutionieren (verwenden Sie: ändern, verbessern, erneuern)
- hochmodern (verwenden Sie: modern, fortschrittlich, neueste)
- robust (verwenden Sie: stark, solide, zuverlässig)
- umfassend (verwenden Sie: vollständig, gründlich, komplett)
- ganzheitlich (verwenden Sie: komplett, vollständig, gesamt)
- dynamisch (verwenden Sie: aktiv, veränderlich, flexibel)
- innovativ (verwenden Sie: neu, kreativ, originell)
- paradigma (verwenden Sie: Modell, Ansatz, Weg)
- akribisch (verwenden Sie: sorgfältig, detailliert, gründlich)
- komplex (verwenden Sie: detailliert, nuanciert, vielschichtig)
- lebendig (verwenden Sie: lebhaft, aktiv, geschäftig)
- schatztruhe (verwenden Sie: Sammlung, Vielfalt, Angebot)
- fülle, unzählige (verwenden Sie: viele, verschiedene, zahlreiche)
- gamechanger (verwenden Sie: innovativ, bahnbrechend, große Verbesserung)
- revolutionär (verwenden Sie: innovativ, bahnbrechend, große Veränderung)
- ultimativ (verwenden Sie: beste, ideale, top)
- vielleicht, möglicherweise (verwenden Sie: eventuell, potenziell, könnte)

✅ Verwenden Sie IMMER Alternativen wie in Klammern angegeben.
✅ Seien Sie kreativ mit Synonymen, aber verwenden Sie NIEMALS die verbotenen Wörter.
✅ Schreiben Sie natürlich und zugänglich, vermeiden Sie roboterhafte KI-Muster.
✅ Vermeiden Sie KI-erkennbare Muster und Klischees.
✅ NUR DEUTSCH - KEINE niederländischen, englischen oder andere Wörter!
`.trim();
}