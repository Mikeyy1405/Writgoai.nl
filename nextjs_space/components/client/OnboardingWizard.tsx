"use client";

import { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Share2, FileText, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Welkom bij WritGo.nl! 🎉',
      description: 'Automatische content marketing voor jouw bedrijf',
      icon: <Sparkles className="h-8 w-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-purple-500 rounded-full mb-4">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Welkom bij WritGo.nl!</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              WritGo automatiseert je complete content marketing. Van SEO blogs tot social media posts - 
              alles wordt automatisch gegenereerd en gepubliceerd.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <FileText className="h-8 w-8 text-orange-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">SEO Blogs</h3>
              <p className="text-sm text-gray-400">Automatisch SEO-geoptimaliseerde blog posts voor je website</p>
            </div>

            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <Share2 className="h-8 w-8 text-purple-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Social Media</h3>
              <p className="text-sm text-gray-400">Dagelijkse posts voor Facebook, Instagram, LinkedIn en meer</p>
            </div>

            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <CheckCheck className="h-8 w-8 text-green-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Volledig Automatisch</h3>
              <p className="text-sm text-gray-400">Eenmaal ingesteld draait alles op de autopilot</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Kies je diensten',
      description: 'Welke services wil je gebruiken?',
      icon: <CheckCheck className="h-8 w-8" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Selecteer de diensten die je wilt activeren:</h3>
          
          <button
            onClick={() => {
              if (selectedServices.includes('blog')) {
                setSelectedServices(selectedServices.filter(s => s !== 'blog'));
              } else {
                setSelectedServices([...selectedServices, 'blog']);
              }
            }}
            className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
              selectedServices.includes('blog')
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedServices.includes('blog') ? 'bg-orange-500/20' : 'bg-gray-700'
              }`}>
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">SEO Blog Posts</h4>
                <p className="text-sm text-gray-400">
                  Automatisch SEO blogs voor je WordPress website (€150-€400/maand)
                </p>
              </div>
              {selectedServices.includes('blog') && (
                <CheckCircle2 className="h-6 w-6 text-orange-500 flex-shrink-0" />
              )}
            </div>
          </button>

          <button
            onClick={() => {
              if (selectedServices.includes('social')) {
                setSelectedServices(selectedServices.filter(s => s !== 'social'));
              } else {
                setSelectedServices([...selectedServices, 'social']);
              }
            }}
            className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
              selectedServices.includes('social')
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedServices.includes('social') ? 'bg-purple-500/20' : 'bg-gray-700'
              }`}>
                <Share2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Social Media Marketing</h4>
                <p className="text-sm text-gray-400">
                  Automatische posts voor Facebook, Instagram, LinkedIn (€250-€800/maand)
                </p>
              </div>
              {selectedServices.includes('social') && (
                <CheckCircle2 className="h-6 w-6 text-purple-500 flex-shrink-0" />
              )}
            </div>
          </button>

          {selectedServices.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-4">
              👆 Selecteer minimaal één dienst om door te gaan
            </p>
          )}
        </div>
      ),
    },
    {
      id: 2,
      title: 'Configureer Platforms',
      description: 'Verbind je social media accounts',
      icon: <Share2 className="h-8 w-8" />,
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white mb-4">Verbind je platforms</h3>
          
          {selectedServices.includes('blog') && (
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-400" />
                WordPress Website
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Je WritGo beheerder zal je WordPress gegevens voor je configureren.
              </p>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 <strong>Let op:</strong> Je WordPress credentials worden veilig opgeslagen en alleen gebruikt voor het publiceren van content.
                </p>
              </div>
            </div>
          )}

          {selectedServices.includes('social') && (
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-purple-400" />
                Social Media Accounts
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Ga na deze wizard naar "Platforms" om je social media accounts te verbinden via Late.dev.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Facebook Pagina's
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Instagram Business
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  LinkedIn Pages
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 3,
      title: 'Klaar! 🎉',
      description: 'Je account is ingesteld',
      icon: <CheckCheck className="h-8 w-8" />,
      content: (
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
            <CheckCheck className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Alles is ingesteld! 🎉</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Je WritGo account is klaar voor gebruik. Het systeem begint automatisch met het genereren 
            en publiceren van content zodra je platforms zijn verbonden.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link
              href="/dashboard/platforms"
              className="p-6 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-lg transition-all group"
            >
              <Share2 className="h-8 w-8 text-purple-400 mb-3 mx-auto" />
              <h4 className="font-semibold text-white mb-2">Verbind Platforms</h4>
              <p className="text-sm text-gray-400">Koppel je social media accounts</p>
            </Link>

            <Link
              href="/dashboard/content"
              className="p-6 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg transition-all group"
            >
              <FileText className="h-8 w-8 text-orange-400 mb-3 mx-auto" />
              <h4 className="font-semibold text-white mb-2">Bekijk Content</h4>
              <p className="text-sm text-gray-400">Zie je geplande posts</p>
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStep === 1 ? selectedServices.length > 0 : true;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                  index <= currentStep
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                    : 'border-gray-700 bg-gray-800 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-2 hidden md:block">{step.title.split(' ')[0]}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all ${
                  index < currentStep ? 'bg-orange-500' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                {steps[currentStep].icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{steps[currentStep].title}</h2>
                <p className="text-gray-400">{steps[currentStep].description}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {steps[currentStep].content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Vorige
            </button>

            {isLastStep ? (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all"
              >
                Start met WritGo
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={!canProceed}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
              >
                Volgende
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Skip Option */}
        {!isLastStep && (
          <div className="text-center mt-4">
            <button
              onClick={onComplete}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Wizard overslaan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
