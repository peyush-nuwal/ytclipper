import { useDebounce } from '@/hooks/use-debounce';
import {
  needsMetadataUpdate,
  useUpdateVideoMetadataMutation,
  useUpdateWatchedDurationMutation,
} from '@/services/videos';
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
  type VideoMetadata,
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
  const [watchedDuration, setWatchedDuration] = useState(0);
  const timestampsData = useAppSelector((data) => data.timestamps);
  const dispatch = useAppDispatch();
  const [updateVideoMetadata] = useUpdateVideoMetadataMutation();
  const [updateWatchedDuration] = useUpdateWatchedDurationMutation();

  const debouncedWatchedDuration = useDebounce(watchedDuration, 5000);
  const lastSentDurationRef = useRef(0);

  const handlePlayerReady = () => {
    setIsPlayerReady(true);
  };

  const handlePlayerError = (error: number) => {
    console.error('Player error:', error);
    setIsPlayerReady(false);
  };

  const handleVideoTitle = async (title: string) => {
    dispatch(setVideoTitle(title));

    if (needsMetadataUpdate(videoId)) {
      try {
        await updateVideoMetadata({
          video_id: videoId,
          youtube_url: `https://youtube.com/watch?v=${videoId}`,
          title,
        }).unwrap();
        console.log('Video metadata updated successfully');
      } catch (error) {
        console.error('Failed to update video metadata:', error);
      }
    } else {
      console.log('Video metadata already exists, skipping update');
    }
  };

  const handleVideoMetadata = async (metadata: VideoMetadata) => {
    if (needsMetadataUpdate(videoId)) {
      try {
        await updateVideoMetadata({
          video_id: videoId,
          youtube_url: `https://youtube.com/watch?v=${videoId}`,
          title: metadata.title,
          duration: metadata.duration,
          thumbnail_url: metadata.thumbnail_url,
          channel_title: metadata.channel_title,
        }).unwrap();
        console.log('Basic video metadata updated successfully');
      } catch (error) {
        console.error('Failed to update video metadata:', error);
      }
    }
  };

  const handleWatchedDurationUpdate = (duration: number) => {
    if (duration > watchedDuration) {
      setWatchedDuration(duration);
    }
  };

  useEffect(() => {
    if (debouncedWatchedDuration > lastSentDurationRef.current) {
      updateWatchedDuration({
        videoId,
        data: { watched_duration: Math.floor(debouncedWatchedDuration) },
      })
        .unwrap()
        .then(() => {
          lastSentDurationRef.current = debouncedWatchedDuration;
          console.log(
            'Watched duration sent to backend:',
            Math.floor(debouncedWatchedDuration),
          );
        })
        .catch((error) => {
          console.error('Failed to update watched duration:', error);
        });
    }
  }, [debouncedWatchedDuration, videoId, updateWatchedDuration]);

  useEffect(() => {
    return () => {
      if (watchedDuration > lastSentDurationRef.current) {
        updateWatchedDuration({
          videoId,
          data: { watched_duration: Math.floor(watchedDuration) },
        }).catch((error) => {
          console.error('Failed to send final watched duration update:', error);
        });
      }
    };
  }, [videoId, updateWatchedDuration, watchedDuration]);

  useEffect(() => {
    if (!isPlayerReady || !videoRef?.current) {
      return undefined;
    }

    const interval = setInterval(() => {
      const currentTime = videoRef.current?.getCurrentTime?.();
      if (typeof currentTime === 'number') {
        dispatch(setCurrentTimestamp(currentTime));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady, videoRef, dispatch]);

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
        onVideoTitle={handleVideoTitle}
        onVideoMetadata={handleVideoMetadata}
        onWatchedDurationUpdate={handleWatchedDurationUpdate}
        className={cn(className)}
        ref={videoRef}
      />
      <div className='bg-notes-bg p-3 border-t'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            <div>
              Current Time:{' '}
              <span className='text-orange-600 font-bold font-mono'>
                {formatTime(timestampsData.currentTimestamp)}
              </span>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleAddNote}
            className='text-xs h-8 px-3'
          >
            <Plus className='h-3 w-3 mr-1' />
            Add Note
          </Button>
        </div>
      </div>
    </Card>
  );
};
