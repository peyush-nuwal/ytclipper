import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface YTPlayerOptions {
  height?: string;
  width?: string;
  videoId: string;
  playerVars?: {
    playsinline?: number;
    enablejsapi?: number;
    origin?: string;
    autoplay?: number;
    controls?: number;
    rel?: number;
  };
  events?: {
    onReady?: (event: { target: YTPlayerClass }) => void;
    onError?: (event: { data: number }) => void;
    onStateChange?: (event: { data: number; target: YTPlayerClass }) => void;
  };
}

interface YTPlayerClass {
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
  getCurrentTime(): number;
  getDuration(): number;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: YTPlayerOptions,
      ) => YTPlayerClass;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onError?: (error: number) => void;
  className?: string;
}

interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

// Global state for API loading
let isAPILoaded = false;
let isAPILoading = false;
const waitingComponents: (() => void)[] = [];

const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isAPILoaded) {
      resolve();
      return;
    }

    if (isAPILoading) {
      waitingComponents.push(() => resolve());
      return;
    }

    isAPILoading = true;

    // Set global callback
    window.onYouTubeIframeAPIReady = () => {
      isAPILoaded = true;
      isAPILoading = false;
      waitingComponents.forEach((callback) => callback());
      waitingComponents.length = 0;
      resolve();
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existingScript) {
      return;
    }

    // Load the API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onload = () => {
      console.log('YouTube API script loaded');
    };
    tag.onerror = (error) => {
      console.error('Failed to load YouTube API script:', error);
      isAPILoading = false;
      reject(error);
    };

    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    // Timeout fallback
    setTimeout(() => {
      if (isAPILoading) {
        console.error('YouTube API loading timeout');
        isAPILoading = false;
        reject(new Error('YouTube API loading timeout'));
      }
    }, 15000);
  });
};

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ videoId, onReady, onError, className = '' }: YouTubePlayerProps, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerInstanceRef = useRef<YTPlayerClass | null>(null);
    const playerIdRef = useRef<string>(
      `youtube-player-${Math.random().toString(36).substring(2, 15)}`,
    );
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onReadyRef = useRef(onReady);
    const onErrorRef = useRef(onError);

    useEffect(() => {
      onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    const playerMethods = useMemo<YouTubePlayerRef>(() => {
      return {
        seekTo: (seconds: number) => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              playerInstanceRef.current.seekTo(seconds, true);
            } catch (error) {
              console.error('Error seeking:', error);
            }
          } else {
            console.warn(
              'Player not ready for seeking. Ready:',
              isPlayerReady,
              'Instance:',
              !!playerInstanceRef.current,
            );
          }
        },
        play: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              playerInstanceRef.current.playVideo();
            } catch (error) {
              console.error('Error playing:', error);
            }
          }
        },
        pause: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              playerInstanceRef.current.pauseVideo();
            } catch (error) {
              console.error('Error pausing:', error);
            }
          }
        },
        getCurrentTime: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              return playerInstanceRef.current.getCurrentTime();
            } catch (error) {
              console.error('Error getting current time:', error);
            }
          }
          return 0;
        },
        getDuration: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              return playerInstanceRef.current.getDuration();
            } catch (error) {
              console.error('Error getting duration:', error);
            }
          }
          return 0;
        },
      };
    }, [isPlayerReady]);
    React.useImperativeHandle(ref, () => playerMethods, [playerMethods]);

    const handlePlayerReady = useCallback(() => {
      setIsPlayerReady(true);
      setError(null);
      onReadyRef.current?.();
    }, []);

    const handlePlayerError = useCallback((event: { data: number }) => {
      console.error('YouTube player error:', event.data);
      const errorMessages: { [key: number]: string } = {
        2: 'Invalid video ID',
        5: 'HTML5 player error',
        100: 'Video not found or private',
        101: 'Video not allowed in embedded players',
        150: 'Video not allowed in embedded players',
      };
      const errorMessage =
        errorMessages[event.data] || `Unknown error (${event.data})`;
      setError(errorMessage);
      onErrorRef.current?.(event.data);
    }, []);

    useEffect(() => {
      const initializePlayer = async () => {
        const currentVideoId = videoId;
        if (!containerRef.current || !currentVideoId) {
          return;
        }

        try {
          await loadYouTubeAPI();

          containerRef.current.innerHTML = '';
          const playerDiv = document.createElement('div');
          playerDiv.id = playerIdRef.current;
          playerDiv.style.cssText = 'width: 100%; height: 100%;';
          containerRef.current.appendChild(playerDiv);

          playerInstanceRef.current = new window.YT.Player(
            playerIdRef.current,
            {
              height: '100%',
              width: '100%',
              videoId: currentVideoId,
              playerVars: {
                playsinline: 1,
                enablejsapi: 1,
                origin: window.location.origin,
                rel: 0,
                controls: 1,
                autoplay: 0,
              },
              events: {
                onReady: handlePlayerReady,
                onError: handlePlayerError,
                onStateChange: () => {},
              },
            },
          );
        } catch (err) {
          console.error('Failed to initialize YouTube player:', err);
          setError('Failed to load YouTube player');
        }
      };

      if (videoId) {
        setIsPlayerReady(false);
        setError(null);
        initializePlayer();
      }

      return () => {
        if (playerInstanceRef.current) {
          try {
            playerInstanceRef.current.destroy();
          } catch (err) {
            console.warn('Error destroying player:', err);
          }
          playerInstanceRef.current = null;
        }
        setIsPlayerReady(false);
      };
    }, [videoId, handlePlayerReady, handlePlayerError]);

    if (error) {
      return (
        <div
          className={`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded ${className}`}
        >
          <strong className='font-bold'>Error: </strong>
          <span>{error}</span>
        </div>
      );
    }

    return (
      <div
        className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      >
        <div
          ref={containerRef}
          className='w-full h-full'
          style={{ minHeight: '200px' }}
        />

        {!isPlayerReady && !error && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black'>
            <div className='text-center'>
              {/* Loading Spinner */}
              <div className='relative mb-4'>
                <div className='w-12 h-12 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin mx-auto' />
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='w-6 h-6 bg-red-500 rounded-full animate-pulse' />
                </div>
              </div>

              <div className='flex justify-center space-x-1'>
                <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' />
                <div
                  className='w-2 h-2 bg-gray-400 rounded-full animate-pulse'
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className='w-2 h-2 bg-gray-400 rounded-full animate-pulse'
                  style={{ animationDelay: '0.4s' }}
                />
              </div>

              <div className='text-gray-400 text-xs mt-3'>
                API Loaded: {isAPILoaded ? 'Yes' : 'No'} | API Loading:{' '}
                {isAPILoading ? 'Yes' : 'No'} | Video ID: {videoId} | Player
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

YouTubePlayer.displayName = 'YouTubePlayer';

export type { YouTubePlayerRef };
