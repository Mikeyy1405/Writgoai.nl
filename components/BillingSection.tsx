'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STRIPE_PACKAGES } from '@/lib/stripe-config';

interface SubscriptionInfo {
  credits_remaining: number;
  monthly_credits: number;
  subscription_tier: string | null;
  subscription_active: boolean;
  next_billing_date: string | null;
}

export default function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('Kon het abonnementsbeheer niet openen');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Fout bij openen abonnementsbeheer');
    } finally {
      setManagingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (!subscription || !subscription.subscription_active) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">💳 Abonnement & Facturering</h2>
        
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Geen actief abonnement
              </h3>
              <p className="text-gray-300 mb-4">
                Je hebt momenteel geen actief abonnement. Kies een pakket om te beginnen met het genereren van content.
              </p>
              <Link
                href="/#pricing"
                className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Bekijk Pakketten
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const packageInfo = subscription.subscription_tier ? 
    STRIPE_PACKAGES[subscription.subscription_tier as keyof typeof STRIPE_PACKAGES] : null;

  const percentage = (subscription.credits_remaining / subscription.monthly_credits) * 100;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">💳 Abonnement & Facturering</h2>

      {/* Current Plan */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Huidig Pakket</div>
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="text-3xl font-bold text-white capitalize">
              {subscription.subscription_tier}
            </span>
            {packageInfo && (
              <span className="text-lg text-gray-400">€{packageInfo.price_eur}/maand</span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {subscription.monthly_credits} credits per maand
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Credits Over</div>
          <div className="flex items-baseline space-x-2 mb-3">
            <span className="text-3xl font-bold text-white">
              {subscription.credits_remaining}
            </span>
            <span className="text-lg text-gray-400">/ {subscription.monthly_credits}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percentage < 20 ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Billing Date */}
      {subscription.next_billing_date && (
        <div className="mb-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Volgende Factuurdatum</div>
          <div className="text-white font-medium">
            {new Date(subscription.next_billing_date).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleManageSubscription}
          disabled={managingPortal}
          className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {managingPortal ? 'Openen...' : 'Beheer Abonnement via Stripe'}
        </button>
        
        <Link
          href="/#pricing"
          className="block w-full text-center bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Upgrade Pakket
        </Link>
      </div>

      {/* Info */}
      <div className="mt-6 text-sm text-gray-400">
        <p className="mb-2">
          Via Stripe kun je je betalingsmethode wijzigen, facturen downloaden, of je abonnement opzeggen.
        </p>
        <p>
          Credits resetten automatisch op je factuurdatum. Ongebruikte credits vervallen.
        </p>
      </div>
    </div>
  );
}
