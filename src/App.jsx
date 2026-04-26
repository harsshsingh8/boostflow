import { useState, useEffect, useCallback, useRef } from 'react';

const viewOptions = [
  { label: '1K', value: 1000, price: '$4.99' },
  { label: '10K', value: 10000, price: '$29.99' },
  { label: '50K', value: 50000, price: '$99.99' },
  { label: '100K', value: 100000, price: '$179.99' },
  { label: '1M', value: 1000000, price: '$899.99' },
];

const statusMessages = [
  'Connecting to Instagram API...',
  'Encrypted Link Verified...',
  'Authenticating Session...',
  'Allocating Server Resources...',
  'Initializing Drip-Feed Protocol...',
  'Verifying Account Integrity...',
  'Preparing View Distribution...',
];

function App() {
  const [reelLink, setReelLink] = useState('');
  const [selectedViews, setSelectedViews] = useState(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const apiResultRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isBoosting && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 0.5;
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isBoosting, progress]);

  useEffect(() => {
    if (isBoosting && progress < 100) {
      const messageIndex = Math.min(
        Math.floor((progress / 100) * statusMessages.length),
        statusMessages.length - 1
      );
      setCurrentStatus(statusMessages[messageIndex]);
    }
  }, [progress, isBoosting]);

  useEffect(() => {
    if (progress === 100 && isBoosting) {
      const timer = setTimeout(() => {
        setIsBoosting(false);
        if (apiResultRef.current?.error) {
          setApiError(apiResultRef.current.error);
          setIsComplete(false);
        } else if (apiResultRef.current?.order) {
          setOrderData(apiResultRef.current);
          setIsComplete(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, isBoosting]);

  useEffect(() => {
    if (reelLink.includes('instagram.com')) {
      setThumbnailUrl('https://placehold.co/400x400/1a1a2e/a855f7?text=Reel+Preview');
    } else {
      setThumbnailUrl(null);
    }
  }, [reelLink]);

  const handleStartBoost = useCallback(async () => {
    if (!reelLink || !selectedViews) return;
    setIsBoosting(true);
    setProgress(0);
    setIsComplete(false);
    setApiError(null);
    setOrderData(null);
    setCurrentStatus(statusMessages[0]);
    apiResultRef.current = null;

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: reelLink,
          quantity: selectedViews.value,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        apiResultRef.current = {
          error: data.error || data.message || 'Something went wrong',
        };
      } else {
        apiResultRef.current = {
          order: data.order,
          mode: data.mode,
          message: data.message,
        };
      }
    } catch (err) {
      apiResultRef.current = {
        error: err.message || 'Network error. Please try again.',
      };
    }
  }, [reelLink, selectedViews]);

  const handleReset = useCallback(() => {
    setIsComplete(false);
    setProgress(0);
    setCurrentStatus('');
    setReelLink('');
    setSelectedViews(null);
    setThumbnailUrl(null);
    setApiError(null);
    setOrderData(null);
    apiResultRef.current = null;
  }, []);

  return (
    <div className="min-h-screen bg-background text-gray-100 overflow-x-hidden">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-dark/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Boost</span>
              <span className="text-accent neon-text">Flow</span>
            </span>
          </div>
          <button className="px-5 py-2 rounded-lg border border-white/10 hover:border-accent/50 hover:bg-accent/10 transition-all duration-300 text-sm font-medium">
            Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center px-6 py-16 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-lg">
          {/* Glass Card */}
          <div className="glass glass-border rounded-2xl p-8 relative overflow-hidden">
            {/* Glowing top border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            {apiError && !isBoosting && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-red-400">Error</span>
                </div>
                <p className="text-sm text-red-300/80">{apiError}</p>
                <button
                  onClick={() => setApiError(null)}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {!isComplete ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">
                    Boost Your <span className="text-accent neon-text">Reel Views</span>
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Organic growth powered by AI drip-feed technology
                  </p>
                </div>

                {/* Link Input */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Instagram Reel Link
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={reelLink}
                      onChange={(e) => setReelLink(e.target.value)}
                      placeholder="https://instagram.com/reel/..."
                      disabled={isBoosting}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-300 placeholder:text-gray-600 text-sm disabled:opacity-50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Preview */}
                {thumbnailUrl && (
                  <div className="mb-6 flex justify-center">
                    <div className="relative rounded-xl overflow-hidden border border-accent/20 neon-border">
                      <img
                        src={thumbnailUrl}
                        alt="Reel Preview"
                        className="w-32 h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 text-xs font-medium text-white/80 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Link Verified
                      </div>
                    </div>
                  </div>
                )}

                {/* View Options */}
                <div className="mb-8">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Select View Package
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {viewOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => !isBoosting && setSelectedViews(option)}
                        disabled={isBoosting}
                        className={`relative p-4 rounded-xl border transition-all duration-300 text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedViews?.value === option.value
                            ? 'border-accent/60 bg-accent/10 neon-border'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className={`text-lg font-bold mb-1 ${selectedViews?.value === option.value ? 'text-accent' : 'text-white'}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-400">{option.price}</div>
                        {selectedViews?.value === option.value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boost Button / Progress */}
                {isBoosting ? (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent-dark via-accent to-accent-glow rounded-full progress-glow transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <span className="text-sm text-gray-300 font-medium">
                        {currentStatus}
                      </span>
                    </div>

                    <div className="text-center text-xs text-gray-500">
                      {Math.round(progress)}% complete
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleStartBoost}
                    disabled={!reelLink || !selectedViews}
                    className={`w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none ${
                      reelLink && selectedViews
                        ? 'bg-gradient-to-r from-accent-dark to-accent glow-button'
                        : 'bg-white/10'
                    }`}
                  >
                    Start Boost
                  </button>
                )}
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center neon-border">
                  <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">
                  Transaction Confirmed
                </h2>

                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-medium text-green-400">Natural Drip-Feed Active</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Estimated completion: <span className="text-white font-semibold">60 minutes</span>
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-400 mb-8">
                  <div className="flex justify-between px-4 py-2 bg-white/5 rounded-lg">
                    <span>Package</span>
                    <span className="text-white font-medium">{selectedViews?.label} Views</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 bg-white/5 rounded-lg">
                    <span>Order ID</span>
                    <span className="text-white font-medium font-mono">#{orderData?.order}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 bg-white/5 rounded-lg">
                    <span>Delivery Method</span>
                    <span className="text-white font-medium">12 Batches / 5 min</span>
                  </div>
                  {orderData?.mode === 'simulation' && (
                    <div className="px-4 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-lg text-yellow-400 text-xs text-center">
                      Running in simulation mode — configure .env to enable live API
                    </div>
                  )}
                  {orderData?.mode === 'internal-smm-panel' && (
                    <div className="px-4 py-2 bg-accent/5 border border-accent/10 rounded-lg text-accent text-xs text-center">
                      Powered by BoostFlow Internal SMM Panel
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-accent/50 hover:bg-accent/10 transition-all duration-300 text-sm font-medium"
                >
                  Boost Another Reel
                </button>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              256-bit Encryption
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              No Password Required
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
