import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentTimestamp,
  setVideoTitle,
} from '@/store/slices/timestampSlice';
import { Button, Card, cn } from '@ytclipper/ui';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  YouTubePlayer,
  type YouTubePlayerProps,
  type YouTubePlayerRef,
} from '../timestamps/youtube-player';

interface VideoPlayerProps extends Omit<YouTubePlayerProps, 'videoId'> {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onAddNote?: (timestamp: number) => void;
}

export const VideoPlayer = ({
  videoId,
  onAddNote,
  className,
}: VideoPlayerProps) => {
  const videoRef = useRef<YouTubePlayerRef>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const timestampsData = useAppSelector((data) => data.timestamps);
  const dispatch = useAppDispatch();

  const handlePlayerReady = () => {
    setIsPlayerReady(true);
  };

  const handlePlayerError = (error: number) => {
    console.error('Player error:', error);
    setIsPlayerReady(false);
  };

  useEffect(() => {
    if (!isPlayerReady || !videoRef?.current) {
      return;
    }

    const interval = setInterval(() => {
      const currentTime = videoRef.current?.getCurrentTime?.();
      if (typeof currentTime === 'number') {
        dispatch(setCurrentTimestamp(currentTime));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady, videoRef, dispatch]);

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddNote = () => {
    onAddNote?.(timestampsData.currentTimestamp);
  };

  return (
    <Card className='w-full bg-video-bg p-0 gap-0 overflow-hidden shadow-video'>
      <YouTubePlayer
        videoId={videoId}
        onError={handlePlayerError}
        onReady={handlePlayerReady}
        onVideoTitle={(title) => {
          console.log('Video title:', title);
          dispatch(setVideoTitle(title));
        }}
        className={cn(className)}
        ref={videoRef}
      />
      <div className='bg-notes-bg p-3 border-t'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            Current Time:{' '}
            <span className='text-orange-600 font-bold font-mono'>
              {formatTime(timestampsData.currentTimestamp)}
            </span>
          </div>
          <Button size='sm' onClick={handleAddNote}>
            <Plus className='h-4 w-4' />
            Add Note at {formatTime(timestampsData.currentTimestamp)}
          </Button>
        </div>
      </div>
    </Card>
  );
};
