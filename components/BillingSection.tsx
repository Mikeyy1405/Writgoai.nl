'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STRIPE_PACKAGES, type PackageTier } from '@/lib/stripe-config';

interface SubscriptionInfo {
  credits_remaining: number;
  monthly_credits: number;
  subscription_tier: string | null;
  subscription_active: boolean;
  next_billing_date: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
}

export default function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingPortal, setManagingPortal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageTier | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);

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

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await fetch('/api/stripe/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setShowInvoices(true);
      } else {
        alert('Kon facturen niet ophalen');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      alert('Fout bij ophalen facturen');
    } finally {
      setLoadingInvoices(false);
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
        alert('Kon het abonnementsbeheer niet openen. Heb je al een abonnement?');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Fout bij openen abonnementsbeheer');
    } finally {
      setManagingPortal(false);
    }
  };

  const handleSubscribe = async (packageTier: PackageTier) => {
    setSubscribing(true);
    setSelectedPackage(packageTier);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ package: packageTier }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error || 'Kon checkout niet starten'}`);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Fout bij starten checkout');
    } finally {
      setSubscribing(false);
      setSelectedPackage(null);
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

  // No active subscription - Show package selection
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
                Kies een pakket om te beginnen met het genereren van content.
              </p>
            </div>
          </div>
        </div>

        {/* Package Selection */}
        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(STRIPE_PACKAGES) as PackageTier[]).map((tier) => {
            const pkg = STRIPE_PACKAGES[tier];
            const isPopular = 'popular' in pkg && pkg.popular;

            return (
              <div
                key={tier}
                className={`bg-gray-800/50 border rounded-xl p-6 hover:border-orange-500/50 transition-all ${
                  isPopular ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-700'
                }`}
              >
                {isPopular && (
                  <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                    🔥 POPULAIR
                  </div>
                )}

                <h3 className="text-xl font-bold text-white mb-2 capitalize">{pkg.name}</h3>

                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">€{pkg.price_eur}</span>
                  <span className="text-gray-400">/maand</span>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-2">{pkg.description}</div>
                  <div className="text-sm font-semibold text-orange-400">
                    {pkg.credits} credits per maand
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={subscribing}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isPopular
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/50'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {subscribing && selectedPackage === tier ? 'Openen...' : 'Kies dit pakket'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-sm text-gray-400 text-center">
          <p>
            ✓ Opzeggen wanneer je wilt • ✓ Alle features inbegrepen • ✓ Veilig betalen via Stripe
          </p>
        </div>
      </div>
    );
  }

  // Active subscription - Show subscription details and management
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
      <div className="space-y-3 mb-6">
        <button
          onClick={handleManageSubscription}
          disabled={managingPortal}
          className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {managingPortal ? 'Openen...' : 'Wijzig Abonnement of Opzeggen'}
        </button>

        <button
          onClick={fetchInvoices}
          disabled={loadingInvoices}
          className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingInvoices ? 'Laden...' : 'Bekijk Facturen'}
        </button>
      </div>

      {/* Invoices List */}
      {showInvoices && (
        <div className="mb-6 p-6 bg-gray-800/30 border border-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">📄 Facturen</h3>
            <button
              onClick={() => setShowInvoices(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Sluiten
            </button>
          </div>

          {invoices.length === 0 ? (
            <p className="text-gray-400 text-sm">Geen facturen gevonden</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div>
                    <div className="text-white font-medium">
                      €{(invoice.amount / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(invoice.created * 1000).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {invoice.status === 'paid' ? 'Betaald' : invoice.status}
                    </span>

                    {invoice.invoice_pdf && (
                      <a
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-gray-400">
        <p className="mb-2">
          ✓ Wijzig je abonnement (upgrade/downgrade) wanneer je wilt via Stripe
        </p>
        <p className="mb-2">
          ✓ Download facturen voor je administratie
        </p>
        <p>
          ✓ Credits resetten automatisch op je factuurdatum
        </p>
      </div>
    </div>
  );
}
