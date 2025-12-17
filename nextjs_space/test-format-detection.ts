/**
 * Test script voor format en taal detectie
 */

import { ContentFormatDetector } from './lib/content-format-detector';

console.log('='.repeat(80));
console.log('TESTING FORMAT DETECTION');
console.log('='.repeat(80));

// Test cases voor format detectie
const formatTests = [
  {
    title: 'Beste Puppy Brokken 2024: Top 10 Merken Getest en Vergeleken',
    keywords: ['beste puppy brokken', 'hondenvoer', 'puppy voeding'],
    intent: 'commercial',
    expected: 'beste-lijstje',
  },
  {
    title: 'Premium vs Budget Droogvoer: Is Duur Hondenvoer Het Geld Waard?',
    keywords: ['premium hondenvoer', 'vergelijking', 'budget'],
    intent: 'commercial',
    expected: 'vergelijking',
  },
  {
    title: 'De 5 Beste Interactieve Kattenspeelgoed van 2024: Complete Vergelijking en Test',
    keywords: ['beste interactieve kattenspeelgoed', 'kattenspeeltjes'],
    intent: 'commercial',
    expected: 'beste-lijstje',
  },
  {
    title: 'Hoe Vaak Moet Je Een Puppy Voeren? Complete Voedingsschema',
    keywords: ['hoe vaak puppy voeren', 'voedingsschema'],
    intent: 'navigational',
    expected: 'how-to',
  },
  {
    title: 'Wat is Topical Authority en Waarom Belangrijk voor SEO?',
    keywords: ['topical authority', 'seo', 'content strategie'],
    intent: 'informational',
    expected: 'informatief',
  },
];

formatTests.forEach(test => {
  const detected = ContentFormatDetector.detectFormat(
    test.title,
    test.keywords,
    test.intent as any
  );
  
  const match = detected === test.expected ? '✅' : '❌';
  console.log(`\n${match} Title: "${test.title}"`);
  console.log(`   Intent: ${test.intent}`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Detected: ${detected}`);
});

console.log('\n' + '='.repeat(80));
console.log('TESTING LANGUAGE DETECTION');
console.log('='.repeat(80));

// Test cases voor taal detectie
const languageTests = [
  {
    url: 'https://gigadier.nl',
    title: 'Beste Puppy Brokken 2024: Top 10 Merken Getest en Vergeleken',
    keywords: ['beste puppy brokken', 'hondenvoer', 'puppy voeding'],
    expected: 'nl',
  },
  {
    url: 'https://example.com',
    title: 'Best Dog Food 2024: Top 10 Brands Tested and Compared',
    keywords: ['best dog food', 'pet food', 'dog nutrition'],
    expected: 'en',
  },
  {
    url: 'https://writgo.nl',
    title: 'Hoe Maak Je Een Contentplan?',
    keywords: ['contentplan', 'seo', 'strategie'],
    expected: 'nl',
  },
  {
    url: 'https://example.de',
    title: 'Die besten Hundespielzeuge',
    keywords: ['hundespielzeug'],
    expected: 'de',
  },
];

languageTests.forEach(test => {
  const detected = ContentFormatDetector.detectLanguage(
    test.url,
    test.title,
    test.keywords
  );
  
  const match = detected === test.expected ? '✅' : '❌';
  console.log(`\n${match} URL: ${test.url}`);
  console.log(`   Title: "${test.title}"`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Detected: ${detected}`);
});

console.log('\n' + '='.repeat(80));
console.log('TESTING TEMPLATE GENERATION');
console.log('='.repeat(80));

// Test template generatie
const templateTest = {
  format: 'beste-lijstje' as const,
  language: 'nl' as const,
};

const template = ContentFormatDetector.getTemplate(
  templateTest.format,
  templateTest.language
);

console.log(`\n✅ Template for ${templateTest.format} (${templateTest.language}):`);
console.log(template.substring(0, 500) + '...');

console.log('\n' + '='.repeat(80));
console.log('ALL TESTS COMPLETED');
console.log('='.repeat(80));
