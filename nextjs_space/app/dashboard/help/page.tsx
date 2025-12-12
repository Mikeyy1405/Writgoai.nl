'use client';

import { HelpCircle, BookOpen, Video, MessageCircle, Mail } from 'lucide-react';

export default function ClientHelpPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gray-800 rounded-lg">
            <HelpCircle className="w-6 h-6 text-[#FF9933]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Help & Support</h1>
        </div>
        <p className="text-gray-400">
          Vind antwoorden op je vragen en leer hoe je WritGo optimaal gebruikt
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HelpCard
          icon={BookOpen}
          title="Documentatie"
          description="Lees de volledige documentatie over alle features"
          color="orange"
        />
        <HelpCard
          icon={Video}
          title="Video Tutorials"
          description="Bekijk video's over hoe je WritGo gebruikt"
          color="purple"
        />
        <HelpCard
          icon={MessageCircle}
          title="Chat Support"
          description="Chat direct met ons support team"
          color="green"
        />
      </div>

      {/* FAQ */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Veelgestelde Vragen</h2>
        
        <div className="space-y-4">
          <FAQItem
            question="Hoe werkt de Blog Content Pipeline?"
            answer="De Blog Content Pipeline analyseert je website, genereert een topical authority map en maakt vervolgens automatisch SEO-geoptimaliseerde artikelen. Je kunt kiezen voor handmatige generatie of autopilot modus."
          />
          <FAQItem
            question="Wat is een Topical Authority Map?"
            answer="Een topical authority map is een strategisch content plan met pillar en cluster artikelen. Pillar artikelen zijn uitgebreide hoofdartikelen, en cluster artikelen zijn specifiekere artikelen die linken naar de pillar artikelen. Dit helpt je om autoriteit op te bouwen in je niche."
          />
          <FAQItem
            question="Hoe verbind ik mijn WordPress website?"
            answer="Ga naar Instellingen → WordPress en voer je website URL, gebruikersnaam en application password in. Application passwords kun je aanmaken in WordPress onder Users → Profile."
          />
          <FAQItem
            question="Hoe werkt de Social Media integratie?"
            answer="WritGo gebruikt Getlate.dev voor social media scheduling. Je kunt je social media accounts verbinden via Instellingen → Social Media. Eenmaal verbonden kun je automatisch posts genereren en publiceren naar alle platforms."
          />
          <FAQItem
            question="Wat is Autopilot?"
            answer="Autopilot is een volledig automatische modus waarbij WritGo automatisch content genereert en publiceert volgens een door jou ingesteld schema. Je kunt de frequentie, tijd en dagen instellen wanneer content gepubliceerd moet worden."
          />
          <FAQItem
            question="Hoeveel artikelen kan ik per maand genereren?"
            answer="Dit hangt af van je pakket. Check je huidige pakket in Instellingen → Profiel. Je kunt je pakket upgraden voor meer artikelen en features."
          />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#FF9933]/10 rounded-lg">
            <Mail className="w-5 h-5 text-[#FF9933]" />
          </div>
          <h2 className="text-xl font-bold text-white">Contact Opnemen</h2>
        </div>
        <p className="text-gray-400 mb-4">
          Heb je een vraag die hier niet beantwoord wordt? Neem contact met ons op!
        </p>
        <a
          href="mailto:info@writgo.nl"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF9933] hover:bg-[#FF8555] text-white rounded-lg font-medium transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email ons
        </a>
      </div>
    </div>
  );
}

interface HelpCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'orange' | 'purple' | 'green';
}

function HelpCard({ icon: Icon, title, description, color }: HelpCardProps) {
  const colors = {
    orange: 'from-[#FF9933]/10 to-[#FF6B35]/10 text-[#FF9933]',
    purple: 'from-purple-500/10 to-purple-600/10 text-purple-400',
    green: 'from-green-500/10 to-green-600/10 text-green-400'
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-200 cursor-pointer group">
      <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} inline-flex mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-white mb-2 group-hover:text-[#FF9933] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-400">
        {description}
      </p>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <details className="group bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/80 transition-colors">
        <span className="font-medium text-white">{question}</span>
        <svg
          className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 text-gray-400 text-sm">
        {answer}
      </div>
    </details>
  );
}
