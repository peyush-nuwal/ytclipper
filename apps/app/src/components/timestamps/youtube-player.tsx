import { useEffect, useRef, useState } from 'react';

interface YTPlayerOptions {
  height?: string;
  width?: string;
  videoId?: string;
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
      console.log('YouTube API already loaded');
      resolve();
      return;
    }

    if (isAPILoading) {
      console.log('YouTube API already loading, waiting...');
      waitingComponents.push(() => resolve());
      return;
    }

    console.log('Starting to load YouTube API...');
    isAPILoading = true;

    // Set global callback
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API loaded successfully');
      isAPILoaded = true;
      isAPILoading = false;

      // Resolve all waiting components
      waitingComponents.forEach((callback) => callback());
      waitingComponents.length = 0;

      resolve();
    };

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
    }, 10000);
  });
};

export const YouTubePlayer = ({
  videoId,
  onReady,
  onError,
  className = '',
}: YouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YTPlayerClass | null>(null);
  const playerIdRef = useRef<string>(
    `youtube-player-${Math.random().toString(36).substr(2, 9)}`,
  );
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expose player methods via ref
  const playerRef = useRef<YouTubePlayerRef>({
    seekTo: (seconds: number) => {
      if (playerInstanceRef.current && isPlayerReady) {
        playerInstanceRef.current.seekTo(seconds, true);
      }
    },
    play: () => {
      if (playerInstanceRef.current && isPlayerReady) {
        playerInstanceRef.current.playVideo();
      }
    },
    pause: () => {
      if (playerInstanceRef.current && isPlayerReady) {
        playerInstanceRef.current.pauseVideo();
      }
    },
    getCurrentTime: () => {
      if (playerInstanceRef.current && isPlayerReady) {
        return playerInstanceRef.current.getCurrentTime();
      }
      return 0;
    },
    getDuration: () => {
      if (playerInstanceRef.current && isPlayerReady) {
        return playerInstanceRef.current.getDuration();
      }
      return 0;
    },
  });

  const initializePlayer = async () => {
    if (!containerRef.current || !videoId) {
      return;
    }

    try {
      // Ensure API is loaded
      await loadYouTubeAPI();

      // Clear any existing content and create the player div FIRST
      containerRef.current.innerHTML = '';
      const playerDiv = document.createElement('div');
      playerDiv.id = playerIdRef.current;
      playerDiv.style.cssText = 'width: 100%; height: 100%;';
      containerRef.current.appendChild(playerDiv);

      console.log('Initializing YouTube player for video:', videoId);

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        playerInstanceRef.current = new window.YT.Player(playerIdRef.current, {
          height: '100%',
          width: '100%',
          videoId,
          playerVars: {
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
            controls: 1,
            autoplay: 0,
          },
          events: {
            onReady: (event) => {
              console.log('YouTube player ready');
              setIsPlayerReady(true);
              setError(null);
              onReady?.();
            },
            onError: (event) => {
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
              onError?.(event.data);
            },
            onStateChange: (event) => {
              console.log('Player state changed:', event.data);
            },
          },
        });
      }, 100);
    } catch (err) {
      console.error('Failed to initialize YouTube player:', err);
      setError('Failed to load YouTube player');
    }
  };

  useEffect(() => {
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
  }, [videoId]);

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
    <div className={`relative bg-black ${className}`}>
      <div
        ref={containerRef}
        className='w-full h-full'
        style={{ minHeight: '200px' }}
      />

      {!isPlayerReady && !error && (
        <div className='absolute inset-0 flex flex-col items-center justify-center bg-black text-white text-sm'>
          <div>Loading YouTube player...</div>
          <div className='mt-2 text-xs text-gray-400'>
            API Loaded: {isAPILoaded ? 'Yes' : 'No'} | API Loading:{' '}
            {isAPILoading ? 'Yes' : 'No'} | Video ID: {videoId}
          </div>
        </div>
      )}
    </div>
  );
};

// Export the ref type for TypeScript users
export type { YouTubePlayerRef };
