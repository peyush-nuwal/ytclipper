import type { YouTubePlayerRef } from '@/components/timestamps/youtube-player';
import { useCallback, useRef } from 'react';

export const useYouTubePlayer = () => {
  const playerRef = useRef<YouTubePlayerRef>(null);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      console.log('Hook: Seeking to', seconds);
      playerRef.current.seekTo(seconds);
    } else {
      console.warn('Hook: Player ref not available');
    }
  }, []);

  const play = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const getDuration = useCallback(() => {
    return playerRef.current?.getDuration() ?? 0;
  }, []);

  const jumpToTimestamp = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
      setTimeout(() => {
        playerRef.current?.play();
      }, 100); // Small delay to ensure seek completes
    } else {
      console.warn('Hook: Player not available for jumping');
    }
  }, []);

  return {
    playerRef,
    seekTo,
    play,
    pause,
    getCurrentTime,
    getDuration,
    jumpToTimestamp,
  };
};
