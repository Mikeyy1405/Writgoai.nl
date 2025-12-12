"use client";

import { CheckCircle2, Circle, ArrowRight, Users, Settings, Sparkles, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface GettingStartedStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface GettingStartedProps {
  clientCount: number;
  hasActiveClients: boolean;
}

export default function GettingStarted({ clientCount, hasActiveClients }: GettingStartedProps) {
  const [steps, setSteps] = useState<GettingStartedStep[]>([
    {
      id: 'add-client',
      title: 'Voeg je eerste klant toe',
      description: 'Start met het aanmaken van een nieuwe klant in het systeem',
      href: '/admin/klanten',
      icon: <Users className="h-6 w-6" />,
      completed: clientCount > 0,
    },
    {
      id: 'configure-platforms',
      title: 'Configureer social media',
      description: 'Verbind Late.dev en social media accounts van je klant',
      href: '/admin/distribution',
      icon: <Settings className="h-6 w-6" />,
      completed: false, // TODO: Check if platforms are configured
    },
    {
      id: 'generate-content',
      title: 'Genereer eerste content',
      description: 'Maak automatisch blogs en social media posts',
      href: '/admin/blog',
      icon: <Sparkles className="h-6 w-6" />,
      completed: false, // TODO: Check if content exists
    },
    {
      id: 'view-analytics',
      title: 'Bekijk analytics',
      description: 'Monitor de performance van je content',
      href: '/admin/statistieken',
      icon: <BarChart3 className="h-6 w-6" />,
      completed: hasActiveClients,
    },
  ]);

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Don't show if all steps completed
  if (completedSteps === steps.length) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          🚀 Welkom bij WritGo.nl!
        </h2>
        <p className="text-gray-400">
          Volg deze stappen om snel te starten met je eerste klant
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Voortgang</span>
          <span className="text-sm font-medium text-white">{completedSteps}/{steps.length} voltooid</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className="group block"
          >
            <div className="flex items-start gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 rounded-lg transition-all duration-200">
              {/* Icon & Checkbox */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-700 group-hover:bg-orange-500/20 rounded-lg transition-colors">
                  {step.icon}
                </div>
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Na het voltooien van deze stappen draait alles automatisch!
          Het systeem genereert content en post automatisch naar social media.
        </p>
      </div>
    </div>
  );
}
