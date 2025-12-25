=== Writgo Connector ===
Contributors: writgo
Tags: writgo, api, content, automation, seo, yoast, rankmath
Requires at least: 5.6
Tested up to: 6.4
Stable tag: 1.1.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Verbind je WordPress site eenvoudig en veilig met Writgo.nl voor geautomatiseerde content creatie en SEO optimalisatie. Ondersteunt Yoast SEO en RankMath SEO.

== Description ==

Writgo Connector maakt het eenvoudig om je WordPress site te verbinden met Writgo.nl zonder technische configuratie.

**Waarom Writgo Connector?**

* ✅ **Geen IP whitelisting nodig** - Works gewoon, altijd
* ✅ **Automatische setup** - Genereer API key en klaar
* ✅ **100% betrouwbaar** - Geen blocking door hosting providers
* ✅ **Real-time sync** - Webhooks voor instant updates
* ✅ **Veilig** - Eigen API key, geen passwords nodig
* ✅ **Compatibel** - Werkt met alle hosting providers

**Features:**

* Custom REST API endpoints (geen conflicts met WordPress REST API)
* Automatische Wordfence IP whitelisting
* Real-time webhooks bij post updates
* **Yoast SEO ondersteuning** - Automatische sync van meta titles, descriptions, en focus keywords
* **RankMath SEO ondersteuning** - Volledige compatibiliteit met RankMath meta data
* Featured image upload from URL
* Eenvoudige one-click setup
* Automatische detectie van geïnstalleerde SEO plugin

== Installation ==

**Automatische Installatie:**

1. WordPress Admin → Plugins → Add New
2. Zoek naar "Writgo Connector"
3. Klik "Install Now" en daarna "Activate"

**Handmatige Installatie:**

1. Download writgo-connector.zip
2. WordPress Admin → Plugins → Add New → Upload Plugin
3. Kies het zip bestand en klik "Install Now"
4. Activeer de plugin

**Configuratie:**

1. Ga naar Settings → Writgo
2. Klik "Genereer API Key"
3. Kopieer de API Key en endpoint
4. Ga naar Writgo.nl → Project Settings
5. Kies "WordPress Connector Plugin"
6. Plak de API Key en endpoint
7. Klik "Test Connection"
8. Klaar!

== Frequently Asked Questions ==

= Werkt dit met mijn hosting provider? =

Ja! De plugin werkt met ALLE hosting providers, inclusief TransIP, Antagonist, Byte, Vimexx, Hostnet, en alle anderen.

= Moet ik mijn Application Password gebruiken? =

Nee! De plugin genereert een eigen veilige API key. Je hoeft geen WordPress password te delen.

= Werkt dit als ik Wordfence heb? =

Ja! De plugin whitelisted automatisch het Writgo IP adres in Wordfence.

= Moet ik technische kennis hebben? =

Nee! Gewoon plugin installeren, API key genereren, en klaar.

= Wat gebeurt er bij updates van mijn posts? =

Met webhooks krijgt Writgo automatisch een notificatie als je een post publiceert, update, of verwijdert.

= Is dit veilig? =

Ja! De plugin gebruikt een unieke API key voor authenticatie. Alleen Writgo met jouw API key kan toegang krijgen.

= Werkt dit met Yoast SEO? =

Ja! SEO titles, descriptions, focus keywords en canonical URLs worden automatisch gesynchroniseerd.

= Werkt dit met RankMath SEO? =

Ja! De plugin detecteert automatisch welke SEO plugin je gebruikt (Yoast of RankMath) en synchroniseert alle SEO meta data correct.

= Kan ik de plugin weer verwijderen? =

Ja, gewoon deactiveren en verwijderen via WordPress. Alle plugin data wordt verwijderd.

== Screenshots ==

1. Settings pagina - Eenvoudige configuratie
2. API Key generatie
3. Connection status
4. Webhook configuratie

== Changelog ==

= 1.1.0 =
* Added: RankMath SEO support
* Added: Automatic SEO plugin detection (Yoast or RankMath)
* Added: Canonical URL support for both SEO plugins
* Added: SEO plugin info in connection test response
* Improved: SEO meta data handling with unified get/set functions
* Updated: Plugin description to mention both SEO plugins

= 1.0.0 =
* Initial release
* Custom REST API endpoints
* API key authenticatie
* Webhook support
* Automatische Wordfence whitelisting
* Yoast SEO support

== Upgrade Notice ==

= 1.1.0 =
Update voegt RankMath SEO ondersteuning toe. Plugin werkt nu met zowel Yoast als RankMath.

= 1.0.0 =
Eerste versie van Writgo Connector.
