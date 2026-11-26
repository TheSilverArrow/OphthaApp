import React, { useState } from 'react';
import { MessageSquarePlus, Send, CheckCircle2 } from 'lucide-react';

const CREATOR_EMAIL = 'gioalfer@gmail.com';
const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 3;

function generateFeedbackId(): string {
  const rand = Math.random().toString(36).slice(2, 10).replace(/[^a-zA-Z0-9]/g, '');
  return `fb_${Date.now()}_${rand || 'entry'}`;
}

export default function SetupFeedbackSection() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setFormError(`Please enter at least ${MIN_MESSAGE_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    let emailSent = false;
    let backupSaved = false;

    // 1. Send directly to creator's email via FormSubmit (works on GitHub Pages without sign-in)
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${CREATOR_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: 'OphthApp Feedback / Suggestion',
          _captcha: 'false',
          message: trimmedMessage,
        }),
      });
      if (response.ok) {
        emailSent = true;
      }
    } catch {
      // Fall through to Firestore backup check
    }

    // 2. Dynamically load Firebase SDK only on submit to save a silent backup entry in Firestore
    const feedbackId = generateFeedbackId();
    const path = `feedback/${feedbackId}`;
    try {
      const [{ doc, setDoc, serverTimestamp }, { db, OperationType, handleFirestoreError }] =
        await Promise.all([import('firebase/firestore'), import('../firebase')]);
      try {
        await setDoc(doc(db, 'feedback', feedbackId), {
          category: 'suggestion',
          message: trimmedMessage,
          status: 'new',
          createdAt: serverTimestamp(),
        });
        backupSaved = true;
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.CREATE, path);
        } catch {
          // Structured error logged via handleFirestoreError
        }
      }
    } catch {
      // Ignore dynamic chunk load failure when offline
    }

    setSubmitting(false);

    if (emailSent || backupSaved) {
      setMessage('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4500);
    } else {
      setFormError('Could not send feedback right now. Please check your connection and try again.');
    }
  };

  return (
    <div className="bg-theme-surface p-4 rounded-[24px] border border-theme-border shadow-xl space-y-2.5 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex flex-col">
          <span className="text-theme-text font-black uppercase text-xs sm:text-sm italic leading-tight">
            Feedback & Suggestions
          </span>
          <span className="text-theme-dim text-[9px] uppercase font-mono tracking-wider">
            Send ideas or report issues
          </span>
        </div>
        <MessageSquarePlus size={18} className="text-theme-primary shrink-0" />
      </div>

      <form onSubmit={handleSubmitFeedback} className="space-y-2.5 flex-1 flex flex-col min-h-0">
        <div className="relative flex-1 min-h-[74px] flex flex-col">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH));
              if (formError) setFormError(null);
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={3}
            placeholder="Write your feedback or suggestion..."
            className="w-full h-full min-h-[74px] bg-theme-bg border border-theme-border rounded-2xl px-3.5 py-2.5 text-xs font-medium text-theme-text placeholder:text-theme-dim/60 focus:outline-none focus:border-theme-primary transition-colors resize-none"
          />
          <span className="absolute bottom-2 right-3 text-[9px] font-mono text-theme-dim/60 pointer-events-none">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>

        {formError && (
          <p className="text-[11px] font-semibold text-red-500 px-1 shrink-0">{formError}</p>
        )}

        {submittedSuccess && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-1.5 shrink-0">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>Sent! Thank you for your feedback.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || message.trim().length < MIN_MESSAGE_LENGTH}
          className="w-full bg-theme-primary text-white font-black uppercase tracking-wider text-xs py-2.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-45 disabled:active:scale-100 shrink-0"
        >
          <Send size={13} />
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  );
}
