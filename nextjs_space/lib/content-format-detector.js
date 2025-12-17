"use strict";
/**
 * Content Format Detector
 *
 * Automatisch detecteren van:
 * 1. Content format op basis van search intent en keywords
 * 2. Taal op basis van website URL en titel
 *
 * Gebruikt door content generation APIs om de juiste templates te kiezen
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentFormatDetector = exports.getContentTemplate = exports.detectLanguage = exports.detectContentFormat = void 0;
// ============================================================================
// Format Detection
// ============================================================================
/**
 * Detecteer content format op basis van search intent en keywords
 */
function detectContentFormat(title, keywords, searchIntent) {
    var titleLower = title.toLowerCase();
    var keywordsLower = keywords.map(function (k) { return k.toLowerCase(); }).join(' ');
    var combined = "".concat(titleLower, " ").concat(keywordsLower);
    // ==========================================
    // STAP 1: Check explicit format indicators in title/keywords
    // ==========================================
    // Top 10 / Best of lists
    var listPatterns = [
        /beste.*\d+/i,
        /top\s*\d+/i,
        /\d+.*beste/i,
        /meest.*populaire/i,
        /\d+.*tips/i,
        /lijst/i, // "Lijst"
    ];
    if (listPatterns.some(function (pattern) { return pattern.test(combined); })) {
        return 'beste-lijstje';
    }
    // How-to guides
    var howToPatterns = [
        /hoe.*je/i,
        /hoe.*moet/i,
        /how\s*to/i,
        /stappenplan/i,
        /handleiding/i,
        /uitleg/i, // "Uitleg"
    ];
    if (howToPatterns.some(function (pattern) { return pattern.test(combined); })) {
        return 'how-to';
    }
    // Product reviews
    var reviewPatterns = [
        /review/i,
        /test/i,
        /ervaringen/i,
        /beoordelingen/i, // "Beoordelingen"
    ];
    if (reviewPatterns.some(function (pattern) { return pattern.test(combined); })) {
        return 'product-review';
    }
    // Comparisons
    var comparisonPatterns = [
        /vs\.?/i,
        /versus/i,
        /vergelijking/i,
        /vergelijken/i,
        /verschil/i, // "Verschil tussen"
    ];
    if (comparisonPatterns.some(function (pattern) { return pattern.test(combined); })) {
        return 'vergelijking';
    }
    // Guides
    var guidePatterns = [
        /complete.*gids/i,
        /ultieme.*gids/i,
        /beginners.*gids/i,
        /guide/i, // "Guide"
    ];
    if (guidePatterns.some(function (pattern) { return pattern.test(combined); })) {
        return 'gids';
    }
    // ==========================================
    // STAP 2: Use search intent as fallback
    // ==========================================
    if (searchIntent) {
        switch (searchIntent) {
            case 'commercial':
                return 'beste-lijstje';
            case 'transactional':
                return 'product-review';
            case 'navigational':
                return 'how-to';
            case 'informational':
            default:
                return 'informatief';
        }
    }
    // ==========================================
    // STAP 3: Default to informational article
    // ==========================================
    return 'informatief';
}
exports.detectContentFormat = detectContentFormat;
// ============================================================================
// Language Detection
// ============================================================================
/**
 * Detecteer taal op basis van website URL en titel
 */
function detectLanguage(websiteUrl, title, keywords) {
    var urlLower = websiteUrl.toLowerCase();
    // ==========================================
    // STAP 1: Check domain TLD
    // ==========================================
    if (urlLower.endsWith('.nl') || urlLower.includes('.nl/')) {
        return 'nl';
    }
    if (urlLower.endsWith('.be') || urlLower.includes('.be/')) {
        return 'nl'; // België = meestal Nederlands
    }
    if (urlLower.endsWith('.de') || urlLower.includes('.de/')) {
        return 'de';
    }
    if (urlLower.endsWith('.fr') || urlLower.includes('.fr/')) {
        return 'fr';
    }
    if (urlLower.endsWith('.es') || urlLower.includes('.es/')) {
        return 'es';
    }
    // ==========================================
    // STAP 2: Check title and keywords for Dutch words
    // ==========================================
    if (title || keywords) {
        var textToCheck_1 = __spreadArray([
            title || ''
        ], (keywords || []), true).join(' ').toLowerCase();
        // Common Dutch words
        var dutchWords = [
            'beste', 'top', 'hoe', 'wat', 'waarom', 'voor', 'met', 'een', 'de', 'het',
            'naar', 'van', 'op', 'in', 'aan', 'bij', 'over', 'door', 'als', 'maar',
            'ook', 'meer', 'veel', 'goed', 'nieuwe', 'jaar', 'tijd', 'moet', 'kan',
            'zijn', 'hebben', 'maken', 'gaan', 'komen', 'zien', 'krijgen', 'worden',
        ];
        // Count Dutch word occurrences
        var dutchCount = dutchWords.filter(function (word) {
            var regex = new RegExp("\\b".concat(word, "\\b"), 'i');
            return regex.test(textToCheck_1);
        }).length;
        // If 3+ Dutch words found, likely Dutch content
        if (dutchCount >= 3) {
            return 'nl';
        }
        // Common English words
        var englishWords = [
            'best', 'top', 'how', 'what', 'why', 'for', 'with', 'the', 'and', 'that',
            'this', 'from', 'which', 'about', 'more', 'when', 'where', 'should', 'can',
            'will', 'would', 'could', 'get', 'make', 'know', 'take', 'see', 'come', 'think',
        ];
        var englishCount = englishWords.filter(function (word) {
            var regex = new RegExp("\\b".concat(word, "\\b"), 'i');
            return regex.test(textToCheck_1);
        }).length;
        // If 3+ English words and more English than Dutch, likely English
        if (englishCount >= 3 && englishCount > dutchCount) {
            return 'en';
        }
    }
    // ==========================================
    // STAP 3: Default to English for .com, .org, etc.
    // ==========================================
    return 'en';
}
exports.detectLanguage = detectLanguage;
// ============================================================================
// Format Templates
// ============================================================================
/**
 * Get content prompt template based on format and language
 */
function getContentTemplate(format, language) {
    var _a;
    var templates = {
        nl: {
            'informatief': "\n## Structuur voor Informatief Artikel:\n\n1. **Inleiding** (100-150 woorden)\n   - Waarom dit onderwerp belangrijk is\n   - Wat de lezer gaat leren\n\n2. **Wat is [onderwerp]?** (200-300 woorden)\n   - Heldere definitie\n   - Context en achtergrond\n\n3. **Hoe werkt het?** (300-500 woorden)\n   - Stapsgewijze uitleg\n   - Praktische voorbeelden\n\n4. **Voordelen en nadelen** (200-300 woorden)\n   - Objectieve analyse\n   - Voor- en nadelen tabel\n\n5. **Praktische tips** (300-400 woorden)\n   - Concrete handvatten\n   - Veelgemaakte fouten\n\n6. **Conclusie** (100-150 woorden)\n   - Samenvatting\n   - Call-to-action\n",
            'beste-lijstje': "\n## Structuur voor Top 10 / Beste Lijstje:\n\n1. **Inleiding** (100-150 woorden)\n   - Waarom deze lijst relevant is\n   - Wie heeft er baat bij\n\n2. **Onze selectiecriteria** (100-150 woorden)\n   - Hoe we hebben geselecteerd\n   - Wat we hebben meegewogen\n\n3. **Top 10 items** (elk 200-300 woorden)\n   Voor elk item:\n   - **[#] [Naam Product/Service]**\n   - Korte beschrijving\n   - \u2705 Voordelen (3-5 bullets)\n   - \u274C Nadelen (2-3 bullets)\n   - \uD83D\uDCB0 Prijs/waarde\n   - \u2B50 Overall score\n\n4. **Vergelijkingstabel** (overzicht alle items)\n\n5. **Conclusie en aanbeveling** (150-200 woorden)\n   - Beste keuze voor wie?\n   - Alternatieve opties\n",
            'product-review': "\n## Structuur voor Product Review:\n\n1. **Inleiding** (100-150 woorden)\n   - Eerste indruk\n   - Voor wie is dit product?\n\n2. **Specificaties** (tabel)\n   - Belangrijkste specs\n   - Technische details\n\n3. **Design en bouwkwaliteit** (200-300 woorden)\n   - Uiterlijk en materialen\n   - Gebruikservaring\n\n4. **Performance en features** (400-500 woorden)\n   - Hoe presteert het in de praktijk?\n   - Belangrijkste functies\n   - Sterke punten\n\n5. **Voor- en nadelen** (200-250 woorden)\n   - \u2705 Voordelen (5-7 bullets)\n   - \u274C Nadelen (3-5 bullets)\n\n6. **Prijs-kwaliteit verhouding** (150-200 woorden)\n   - Is het zijn geld waard?\n   - Vergelijking met alternatieven\n\n7. **Conclusie** (150-200 woorden)\n   - Eindoordeel\n   - \u2B50 Score (bijv. 8.5/10)\n   - Aanbeveling\n",
            'how-to': "\n## Structuur voor How-To Guide:\n\n1. **Inleiding** (100-150 woorden)\n   - Wat ga je leren?\n   - Waarom is dit nuttig?\n\n2. **Wat heb je nodig?** (100-150 woorden)\n   - Benodigdheden\n   - Voorkennis\n\n3. **Stap-voor-stap instructies** (500-800 woorden)\n   Voor elke stap:\n   - **Stap [#]: [Actie]**\n   - Duidelijke uitleg\n   - Eventueel screenshot/afbeelding\n   - \u26A0\uFE0F Let op: belangrijke punten\n\n4. **Tips en tricks** (200-300 woorden)\n   - Handige tips\n   - Shortcuts\n   - Best practices\n\n5. **Veelgemaakte fouten** (150-200 woorden)\n   - Wat moet je vermijden?\n   - Hoe herstel je fouten?\n\n6. **Conclusie** (100-150 woorden)\n   - Samenvatting\n   - Volgende stappen\n",
            'vergelijking': "\n## Structuur voor Vergelijking:\n\n1. **Inleiding** (100-150 woorden)\n   - Wat vergelijken we?\n   - Voor wie is deze vergelijking?\n\n2. **Overzicht beide opties** (200-300 woorden)\n   - Optie A: korte intro\n   - Optie B: korte intro\n\n3. **Vergelijking per categorie** (600-800 woorden)\n   Voor elke categorie:\n   - **[Categorie naam]**\n   - Optie A: prestatie\n   - Optie B: prestatie\n   - Conclusie\n\n4. **Vergelijkingstabel** (overzicht)\n\n5. **Voor- en nadelen** (200-300 woorden)\n   - Optie A: voordelen en nadelen\n   - Optie B: voordelen en nadelen\n\n6. **Conclusie** (150-200 woorden)\n   - Welke is beter?\n   - Voor wie is welke optie geschikt?\n",
            'gids': "\n## Structuur voor Complete Gids:\n\n1. **Inleiding** (150-200 woorden)\n   - Waarom deze gids?\n   - Wat ga je leren?\n\n2. **Basis concepten** (300-500 woorden)\n   - Fundamentele kennis\n   - Belangrijke terminologie\n\n3. **Hoofdstuk 1: [Onderwerp]** (500-800 woorden)\n   - Uitgebreide uitleg\n   - Voorbeelden\n   - Praktische tips\n\n4. **Hoofdstuk 2: [Onderwerp]** (500-800 woorden)\n   - Uitgebreide uitleg\n   - Voorbeelden\n   - Praktische tips\n\n5. **Best practices** (300-400 woorden)\n   - Professionele tips\n   - Veelgemaakte fouten\n\n6. **Conclusie en volgende stappen** (200-250 woorden)\n   - Samenvatting\n   - Vervolgacties\n",
            'nieuws': "\n## Structuur voor Nieuws Artikel:\n\n1. **Lead** (50-100 woorden)\n   - Wie, wat, waar, wanneer, waarom?\n   - Belangrijkste informatie voorop\n\n2. **Context en achtergrond** (200-300 woorden)\n   - Wat is er gebeurd?\n   - Waarom is dit belangrijk?\n\n3. **Details en ontwikkelingen** (300-400 woorden)\n   - Verdere informatie\n   - Citaten van betrokkenen\n\n4. **Impact en consequenties** (200-300 woorden)\n   - Wat betekent dit?\n   - Wat zijn de gevolgen?\n\n5. **Conclusie** (100-150 woorden)\n   - Samenvatting\n   - Vooruitblik\n",
            'mening': "\n## Structuur voor Opinie Artikel:\n\n1. **Inleiding** (100-150 woorden)\n   - Controversi\u00EBle stelling\n   - Waarom dit onderwerp?\n\n2. **Standpunt** (200-300 woorden)\n   - Duidelijke mening\n   - Waarom denk je dit?\n\n3. **Argumenten** (400-600 woorden)\n   - 3-5 sterke argumenten\n   - Onderbouwing met voorbeelden\n   - Tegenargumenten weerleggen\n\n4. **Nuance** (200-300 woorden)\n   - Andere perspectieven\n   - Zwakke punten in eigen argumentatie\n\n5. **Conclusie** (150-200 woorden)\n   - Herhaling standpunt\n   - Call-to-action\n",
        },
        en: {
            'informatief': "\n## Structure for Informational Article:\n\n1. **Introduction** (100-150 words)\n   - Why this topic matters\n   - What readers will learn\n\n2. **What is [topic]?** (200-300 words)\n   - Clear definition\n   - Context and background\n\n3. **How does it work?** (300-500 words)\n   - Step-by-step explanation\n   - Practical examples\n\n4. **Pros and cons** (200-300 words)\n   - Objective analysis\n   - Comparison table\n\n5. **Practical tips** (300-400 words)\n   - Actionable advice\n   - Common mistakes to avoid\n\n6. **Conclusion** (100-150 words)\n   - Summary\n   - Call-to-action\n",
            'beste-lijstje': "\n## Structure for Top 10 / Best List:\n\n1. **Introduction** (100-150 words)\n   - Why this list matters\n   - Who benefits from it\n\n2. **Our selection criteria** (100-150 words)\n   - How we selected\n   - What we considered\n\n3. **Top 10 items** (each 200-300 words)\n   For each item:\n   - **[#] [Product/Service Name]**\n   - Brief description\n   - \u2705 Pros (3-5 bullets)\n   - \u274C Cons (2-3 bullets)\n   - \uD83D\uDCB0 Price/value\n   - \u2B50 Overall rating\n\n4. **Comparison table** (overview all items)\n\n5. **Conclusion and recommendation** (150-200 words)\n   - Best choice for who?\n   - Alternative options\n",
            'product-review': "\n## Structure for Product Review:\n\n1. **Introduction** (100-150 words)\n   - First impression\n   - Who is this product for?\n\n2. **Specifications** (table)\n   - Key specs\n   - Technical details\n\n3. **Design and build quality** (200-300 words)\n   - Appearance and materials\n   - User experience\n\n4. **Performance and features** (400-500 words)\n   - Real-world performance\n   - Key features\n   - Standout points\n\n5. **Pros and cons** (200-250 words)\n   - \u2705 Advantages (5-7 bullets)\n   - \u274C Disadvantages (3-5 bullets)\n\n6. **Value for money** (150-200 words)\n   - Is it worth the price?\n   - Comparison with alternatives\n\n7. **Conclusion** (150-200 words)\n   - Final verdict\n   - \u2B50 Score (e.g. 8.5/10)\n   - Recommendation\n",
            'how-to': "\n## Structure for How-To Guide:\n\n1. **Introduction** (100-150 words)\n   - What will you learn?\n   - Why is this useful?\n\n2. **What you need** (100-150 words)\n   - Requirements\n   - Prerequisites\n\n3. **Step-by-step instructions** (500-800 words)\n   For each step:\n   - **Step [#]: [Action]**\n   - Clear explanation\n   - Screenshots/images if needed\n   - \u26A0\uFE0F Note: important points\n\n4. **Tips and tricks** (200-300 words)\n   - Helpful tips\n   - Shortcuts\n   - Best practices\n\n5. **Common mistakes** (150-200 words)\n   - What to avoid\n   - How to fix errors\n\n6. **Conclusion** (100-150 words)\n   - Summary\n   - Next steps\n",
            // Add more English templates as needed...
        },
    };
    return ((_a = templates[language]) === null || _a === void 0 ? void 0 : _a[format]) || templates.en['informatief'];
}
exports.getContentTemplate = getContentTemplate;
// ============================================================================
// Exports
// ============================================================================
exports.ContentFormatDetector = {
    detectFormat: detectContentFormat,
    detectLanguage: detectLanguage,
    getTemplate: getContentTemplate,
};
