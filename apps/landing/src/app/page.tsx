'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      setEmail('');
    }, 1200);
  };

  const scrollToWaitlist = () => {
    setMobileMenuOpen(false); // Close mobile menu if open
    emailInputRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 500);
  };

  return (
    <div className="gradient-bg">
      {/* Navigation Header */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-6 sm:space-x-8">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="yt-logo scale-90 sm:scale-100"></div>
            <span className="text-white font-semibold text-lg sm:text-xl tracking-tight">
              ytClipper
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              About
            </a>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white/80 hover:text-white transition-colors p-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Desktop join button */}
          <button
            onClick={scrollToWaitlist}
            className="hidden md:block text-white/80 hover:text-white transition-colors font-medium"
          >
            Join Waitlist
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 md:hidden">
            <div className="px-4 py-6 space-y-4">
              <a
                href="#"
                className="block text-white/80 hover:text-white transition-colors font-medium py-2"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/80 hover:text-white transition-colors font-medium py-2"
              >
                Features
              </a>
              <a
                href="#"
                className="block text-white/80 hover:text-white transition-colors font-medium py-2"
              >
                About
              </a>
              <button
                onClick={scrollToWaitlist}
                className="block w-full text-left bg-primary hover:bg-accent text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="hero-gradient absolute inset-0"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 text-center">
          {/* Badge */}
          <div className="badge inline-flex items-center space-x-2 mb-6 sm:mb-8 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Coming Soon - Chrome Extension for Researchers</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-6 sm:mb-8 leading-[0.9] tracking-tight">
            Collect YouTube
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Research Insights
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2">
            The ultimate Chrome extension for researchers. Save timestamps,
            highlights, and notes from YouTube lectures and podcasts.
          </p>

          {/* Waitlist Form */}
          <div className="max-w-lg mx-auto mb-8 sm:mb-10 md:mb-12 px-4 sm:px-0">
            {!isSubmitted ? (
              <form
                onSubmit={handleWaitlistSubmit}
                className="flex flex-col gap-3 sm:gap-4"
              >
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="input-modern w-full text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed py-4 sm:py-3"
                >
                  {isLoading ? (
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
            ) : (
              <div className="glass p-6 sm:p-8 border border-primary/30">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5 text-white"
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
                  <span className="text-white font-semibold text-base sm:text-lg">
                    You&apos;re on the waitlist!
                  </span>
                </div>
                <p className="text-white/70 text-sm sm:text-base">
                  We&apos;ll notify you when ytClipper launches.
                </p>
              </div>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-white/50 text-xs sm:text-sm font-medium px-4">
            <div className="flex items-center space-x-2">
              <svg
                className="w-3 sm:w-4 h-3 sm:h-4 text-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-3 sm:w-4 h-3 sm:h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span>Built for Researchers</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-3 sm:w-4 h-3 sm:h-4 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Free Beta Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24"
      >
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-2">
            Built for Academic Research
          </h2>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto font-light px-4">
            Streamline your research workflow with intelligent timestamping and
            note-taking
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="glass p-6 sm:p-8 group transition-all duration-300 hover:scale-[1.02]">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-all duration-300">
              <svg
                className="w-6 sm:w-7 h-6 sm:h-7 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Smart Timestamps
            </h3>
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">
              Capture precise moments with one click. Perfect for marking key
              insights in lectures and educational content.
            </p>
          </div>

          <div className="glass p-6 sm:p-8 group transition-all duration-300 hover:scale-[1.02]">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-blue/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue/20 transition-all duration-300">
              <svg
                className="w-6 sm:w-7 h-6 sm:h-7 text-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Research Notes
            </h3>
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">
              Take contextual notes linked to specific timestamps. Organize
              thoughts, citations, and insights seamlessly.
            </p>
          </div>

          <div className="glass p-6 sm:p-8 group transition-all duration-300 hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-accent/20 transition-all duration-300">
              <svg
                className="w-6 sm:w-7 h-6 sm:h-7 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Research Workspace
            </h3>
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">
              Sync all highlights and notes to a powerful dashboard. Search,
              organize, and export your research effortlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 text-center">
        <div className="glass p-8 sm:p-10 md:p-12 border border-white/10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-2">
            Join the Research Revolution
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto font-light leading-relaxed px-2">
            Be among the first researchers to experience a new way of collecting
            insights from YouTube content.
          </p>

          {!isSubmitted && (
            <form
              onSubmit={handleWaitlistSubmit}
              className="max-w-md mx-auto flex flex-col gap-3 sm:gap-4 px-4 sm:px-0"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your research email"
                className="input-modern w-full text-base"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 min-w-[140px] disabled:opacity-50 py-4 sm:py-3"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Join Now</span>
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
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="yt-logo scale-75 sm:scale-90"></div>
            <span className="text-white font-semibold text-base sm:text-lg tracking-tight">
              ytClipper
            </span>
          </div>
          <div className="flex items-center space-x-6 sm:space-x-8 text-white/50 text-xs sm:text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 text-center text-white/40 text-xs sm:text-sm">
          © 2025 ytClipper. Building the future of research.
        </div>
      </footer>
    </div>
  );
}
