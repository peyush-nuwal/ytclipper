'use client';

import { useState } from 'react';

interface WaitlistFormProps {
  source?: string;
  className?: string;
}

interface FormState {
  status: 'idle' | 'loading' | 'success' | 'already_registered' | 'error';
  message: string;
}

export default function WaitlistForm({
  source = 'landing',
  className = '',
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ status: 'loading', message: '' });

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormState({
          status: 'success',
          message: data.message || 'Successfully added to waitlist! 🎉',
        });
        setEmail('');
        setName('');
      } else {
        // Handle different types of errors
        if (data.type === 'already_registered') {
          setFormState({
            status: 'already_registered',
            message:
              data.error ||
              "Great news! You're already on our waitlist. We'll notify you as soon as YT Clipper is ready!",
          });
          setEmail('');
          setName('');
        } else if (
          data.type === 'security_violation' ||
          response.status === 429
        ) {
          setFormState({
            status: 'error',
            message:
              data.error ||
              'Too many requests. Please wait before trying again.',
          });
        } else if (data.details && Array.isArray(data.details)) {
          // Validation errors
          const errorMessages = data.details
            .map((detail: any) => detail.message)
            .join(', ');
          setFormState({
            status: 'error',
            message: errorMessages,
          });
        } else {
          setFormState({
            status: 'error',
            message: data.error || 'Something went wrong. Please try again.',
          });
        }
      }
    } catch (error) {
      setFormState({
        status: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const resetForm = () => {
    setFormState({ status: 'idle', message: '' });
    setEmail('');
    setName('');
  };

  const renderSuccessState = (message: string, isAlreadyRegistered = false) => (
    <div
      className={`glass p-6 border ${isAlreadyRegistered ? 'border-blue/30' : 'border-primary/30'} rounded-lg`}
    >
      <div className="flex items-center justify-center space-x-3 mb-3">
        <div
          className={`w-8 h-8 ${isAlreadyRegistered ? 'bg-blue' : 'bg-primary'} rounded-full flex items-center justify-center`}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <span className="text-white font-semibold text-lg">
          {isAlreadyRegistered
            ? 'Already on the list!'
            : 'Welcome to the waitlist!'}
        </span>
      </div>
      <p className="text-white/70 text-center mb-4">{message}</p>
      <button
        onClick={resetForm}
        className="text-primary hover:text-accent transition-colors text-sm font-medium w-full text-center"
      >
        Join with a different email →
      </button>
    </div>
  );

  const renderErrorState = (message: string) => (
    <div className="glass p-6 border border-red-400/30 rounded-lg">
      <div className="flex items-center justify-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <span className="text-white font-semibold text-lg">
          Oops, something went wrong
        </span>
      </div>
      <p className="text-white/70 text-center mb-4">{message}</p>
      <button
        onClick={resetForm}
        className="text-primary hover:text-accent transition-colors text-sm font-medium w-full text-center"
      >
        Try again →
      </button>
    </div>
  );

  if (formState.status === 'success') {
    return (
      <div className={className}>{renderSuccessState(formState.message)}</div>
    );
  }

  if (formState.status === 'already_registered') {
    return (
      <div className={className}>
        {renderSuccessState(formState.message, true)}
      </div>
    );
  }

  if (formState.status === 'error') {
    return (
      <div className={className}>{renderErrorState(formState.message)}</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-white/80 mb-2"
        >
          Name (optional)
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="input-modern w-full"
          placeholder="Your name"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-white/80 mb-2"
        >
          Email *
        </label>
        <input
          type="email"
          id="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="input-modern w-full"
          placeholder="your@email.com"
        />
      </div>

      <button
        type="submit"
        disabled={formState.status === 'loading' || !email}
        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {formState.status === 'loading' ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <span>Join Waitlist</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
