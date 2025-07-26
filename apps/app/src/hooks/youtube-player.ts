import type { YouTubePlayerRef } from '@/components/timestamps/youtube-player';
import { useCallback, useRef } from 'react';

export const useYouTubePlayer = () => {
  const playerRef = useRef<YouTubePlayerRef | null>(null);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
  }, []);

  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const getDuration = useCallback(() => {
    return playerRef.current?.getDuration() ?? 0;
  }, []);

  const jumpToTimestamp = useCallback(
    (seconds: number) => {
      seekTo(seconds);
      play();
    },
    [seekTo, play],
  );

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
