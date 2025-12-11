'use client';

/**
 * Email Composer Page
 * /admin/email/compose
 * 
 * Compose new emails, reply, forward, or edit drafts
 * Query params:
 * - ?reply=[uid] - Reply to email
 * - ?forward=[uid] - Forward email
 * - ?draft=[id] - Edit existing draft
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Send, Save, X, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/email/RichTextEditor';

interface Mailbox {
  id: string;
  email: string;
  displayName?: string;
}

export default function EmailComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query params
  const replyUid = searchParams.get('reply');
  const forwardUid = searchParams.get('forward');
  const draftId = searchParams.get('draft');

  // Form state
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [bodyHtml, setBodyHtml] = useState<string>('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Meta state
  const [inReplyTo, setInReplyTo] = useState<string | null>(null);
  const [references, setReferences] = useState<string[]>([]);
  const [isReply, setIsReply] = useState(false);
  const [isForward, setIsForward] = useState(false);
  const [originalMessageId, setOriginalMessageId] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiTone, setAiTone] = useState<'zakelijk' | 'vriendelijk' | 'neutraal'>('zakelijk');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);

  // Load mailboxes on mount
  useEffect(() => {
    loadMailboxes();
  }, []);

  // Load data based on query params
  useEffect(() => {
    if (!mailboxes.length) return;

    if (draftId) {
      loadDraft(draftId);
    } else if (replyUid) {
      loadReplyData(replyUid);
    } else if (forwardUid) {
      loadForwardData(forwardUid);
    } else {
      setLoadingData(false);
    }
  }, [draftId, replyUid, forwardUid, mailboxes]);

  // Auto-save effect
  useEffect(() => {
    if (!selectedMailbox || loadingData) return;

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer (auto-save every 30 seconds)
    const timer = setTimeout(() => {
      if (to || subject || bodyHtml) {
        handleSaveDraft(true); // Silent save
      }
    }, 30000);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [to, cc, bcc, subject, bodyHtml, selectedMailbox]);

  const loadMailboxes = async () => {
    try {
      const res = await fetch('/api/admin/email/accounts');
      const data = await res.json();

      if (data.accounts) {
        setMailboxes(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedMailbox(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load mailboxes:', error);
      toast.error('Fout bij laden mailboxen');
    }
  };

  const loadDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/email/drafts/${id}`);
      const data = await res.json();

      if (data.draft) {
        const draft = data.draft;
        setSelectedMailbox(draft.mailboxId);
        setTo(draft.to.join(', '));
        setCc(draft.cc.join(', '));
        setBcc(draft.bcc.join(', '));
        setSubject(draft.subject);
        setBodyHtml(draft.bodyHtml);
        setInReplyTo(draft.inReplyTo);
        setReferences(draft.references || []);
        setIsReply(draft.isReply);
        setIsForward(draft.isForward);
        setOriginalMessageId(draft.originalMessageId);

        if (draft.cc.length > 0) setShowCc(true);
        if (draft.bcc.length > 0) setShowBcc(true);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error('Fout bij laden concept');
    } finally {
      setLoadingData(false);
    }
  };

  const loadReplyData = async (uid: string) => {
    try {
      const res = await fetch(`/api/admin/email/message?uid=${uid}`);
      const data = await res.json();

      if (data.message) {
        const msg = data.message;

        // Set mailbox
        setSelectedMailbox(msg.mailboxId);

        // Set to (reply to sender)
        setTo(msg.from);

        // Set subject
        setSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);

        // Quote original message
        const quotedBody = `
          <br><br>
          <div style="border-left: 2px solid #ccc; padding-left: 10px; color: #666;">
            <p><strong>Op ${new Date(msg.receivedAt).toLocaleString('nl-NL')} schreef ${msg.fromName || msg.from}:</strong></p>
            ${msg.htmlBody || msg.textBody || ''}
          </div>
        `;
        setBodyHtml(quotedBody);

        // Set threading metadata
        setInReplyTo(msg.messageId);
        setReferences([...(msg.references || []), msg.messageId]);
        setIsReply(true);
        setOriginalMessageId(uid);
      }
    } catch (error) {
      console.error('Failed to load reply data:', error);
      toast.error('Fout bij laden email');
    } finally {
      setLoadingData(false);
    }
  };

  const loadForwardData = async (uid: string) => {
    try {
      const res = await fetch(`/api/admin/email/message?uid=${uid}`);
      const data = await res.json();

      if (data.message) {
        const msg = data.message;

        // Set mailbox
        setSelectedMailbox(msg.mailboxId);

        // Set subject
        setSubject(msg.subject.startsWith('Fwd:') ? msg.subject : `Fwd: ${msg.subject}`);

        // Include original message
        const forwardedBody = `
          <br><br>
          <div style="border-left: 2px solid #ccc; padding-left: 10px;">
            <p><strong>---------- Doorgestuurd bericht ----------</strong></p>
            <p><strong>Van:</strong> ${msg.fromName || msg.from}</p>
            <p><strong>Datum:</strong> ${new Date(msg.receivedAt).toLocaleString('nl-NL')}</p>
            <p><strong>Onderwerp:</strong> ${msg.subject}</p>
            <p><strong>Aan:</strong> ${msg.to.join(', ')}</p>
            <br>
            ${msg.htmlBody || msg.textBody || ''}
          </div>
        `;
        setBodyHtml(forwardedBody);

        // Set metadata
        setIsForward(true);
        setOriginalMessageId(uid);
      }
    } catch (error) {
      console.error('Failed to load forward data:', error);
      toast.error('Fout bij laden email');
    } finally {
      setLoadingData(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // 🤖 AI EMAIL GENERATION
  // ═══════════════════════════════════════════════════════

  const handleGenerateAiEmail = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Voer een beschrijving in voor de email');
      return;
    }

    try {
      setGeneratingAi(true);

      const response = await fetch('/api/admin/email/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: aiTone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fout bij genereren email');
      }

      // Fill subject and body
      setSubject(data.email.subject);
      setBodyHtml(data.email.body.replace(/\n/g, '<br>'));
      
      toast.success('✨ Email gegenereerd! Je kunt de tekst nog aanpassen.');
      
      // Clear AI prompt after successful generation
      setAiPrompt('');
    } catch (err: any) {
      console.error('Error generating AI email:', err);
      toast.error(err.message || 'Fout bij genereren email');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveDraft = async (silent = false) => {
    if (!selectedMailbox) {
      toast.error('Selecteer een mailbox');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        mailboxId: selectedMailbox,
        to: to.split(',').map((e) => e.trim()).filter(Boolean),
        cc: cc.split(',').map((e) => e.trim()).filter(Boolean),
        bcc: bcc.split(',').map((e) => e.trim()).filter(Boolean),
        subject,
        bodyHtml,
        bodyText: '', // We could strip HTML to get text
        inReplyTo,
        references,
        isReply,
        isForward,
        originalMessageId,
      };

      let res;
      if (draftId) {
        // Update existing draft
        res = await fetch(`/api/admin/email/drafts/${draftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new draft
        res = await fetch('/api/admin/email/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (data.success) {
        if (!silent) {
          toast.success('Concept opgeslagen');
        }

        // If new draft, update URL to include draft ID
        if (!draftId && data.draft?.id) {
          router.replace(`/admin/email/compose?draft=${data.draft.id}`);
        }
      } else {
        throw new Error(data.error || 'Fout bij opslaan');
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      if (!silent) {
        toast.error(error.message || 'Fout bij opslaan concept');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    // Validation
    if (!selectedMailbox) {
      toast.error('Selecteer een mailbox');
      return;
    }

    if (!to.trim()) {
      toast.error('Voer een ontvanger in');
      return;
    }

    if (!subject.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    if (!bodyHtml.trim()) {
      toast.error('Voer een bericht in');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        mailboxId: selectedMailbox,
        to: to.split(',').map((e) => e.trim()).filter(Boolean),
        cc: cc.split(',').map((e) => e.trim()).filter(Boolean),
        bcc: bcc.split(',').map((e) => e.trim()).filter(Boolean),
        subject,
        bodyHtml,
        bodyText: '', // Strip HTML for text version
        inReplyTo,
        references,
        draftId, // If sending from draft, delete it
      };

      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Email verzonden!');
        router.push('/admin/email/inbox');
      } else {
        throw new Error(data.error || 'Fout bij verzenden');
      }
    } catch (error: any) {
      console.error('Failed to send email:', error);
      toast.error(error.message || 'Fout bij verzenden email');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {isReply ? 'Beantwoorden' : isForward ? 'Doorsturen' : draftId ? 'Concept Bewerken' : 'Nieuwe Email'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Stel een nieuwe email op en verstuur
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Composer Form */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          {/* Mailbox Selection */}
          <div className="p-4 border-b border-gray-800">
            <label className="block text-sm text-gray-400 mb-2">Van</label>
            <select
              value={selectedMailbox}
              onChange={(e) => setSelectedMailbox(e.target.value)}
              className="w-full bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {mailboxes.map((mb) => (
                <option key={mb.id} value={mb.id}>
                  {mb.displayName ? `${mb.displayName} <${mb.email}>` : mb.email}
                </option>
              ))}
            </select>
          </div>

          {/* To */}
          <div className="p-4 border-b border-gray-800">
            <label className="block text-sm text-gray-400 mb-2">Aan</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@example.com, another@example.com"
              className="w-full bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* CC */}
          {showCc && (
            <div className="p-4 border-b border-gray-800">
              <label className="block text-sm text-gray-400 mb-2">CC</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* BCC */}
          {showBcc && (
            <div className="p-4 border-b border-gray-800">
              <label className="block text-sm text-gray-400 mb-2">BCC</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* CC/BCC Toggle */}
          {(!showCc || !showBcc) && (
            <div className="px-4 py-2 border-b border-gray-800 flex gap-4">
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="text-sm text-orange-500 hover:text-orange-400"
                >
                  + CC
                </button>
              )}
              {!showBcc && (
                <button
                  onClick={() => setShowBcc(true)}
                  className="text-sm text-orange-500 hover:text-orange-400"
                >
                  + BCC
                </button>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="p-4 border-b border-gray-800">
            <label className="block text-sm text-gray-400 mb-2">Onderwerp</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email onderwerp"
              className="w-full bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* AI Email Generator */}
          <div className="border-b border-gray-800">
            <button
              onClick={() => setShowAiSection(!showAiSection)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-gray-100 font-medium">✨ AI Schrijven</span>
              </div>
              {showAiSection ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {showAiSection && (
              <div className="p-4 bg-gray-900/50 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Waar moet de email over gaan?
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Bijvoorbeeld: 'Bevestig afspraak voor volgende week dinsdag om 14:00' of 'Bedank klant voor bestelling en geef verzendinfo'"
                    className="w-full bg-gray-800 text-gray-100 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-y"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {aiPrompt.length}/500 karakters
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Toon</label>
                  <div className="flex gap-2">
                    {(['zakelijk', 'vriendelijk', 'neutraal'] as const).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setAiTone(tone)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          aiTone === tone
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateAiEmail}
                  disabled={generatingAi || !aiPrompt.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {generatingAi ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Email genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Genereer Email
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  De AI schrijft automatisch een professionele email. Je kunt de tekst daarna nog aanpassen.
                </p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-4">
            <RichTextEditor
              content={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Schrijf je bericht..."
            />
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-800 flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={loading || !selectedMailbox || !to.trim()}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Verzenden...' : 'Versturen'}
              </button>

              <button
                onClick={() => handleSaveDraft(false)}
                disabled={saving || !selectedMailbox}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-gray-100 px-6 py-2 rounded-lg font-medium border border-gray-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Opslaan...' : 'Concept Opslaan'}
              </button>
            </div>

            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-300"
            >
              Annuleren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
