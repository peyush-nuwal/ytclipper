import type { RecentVideo } from '@/services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { BookOpen, Calendar, Clock, StickyNote } from 'lucide-react';
import { Link } from 'react-router';

interface RecentVideosProps {
  videos: RecentVideo[];
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
};

export const RecentVideos = ({ videos }: RecentVideosProps) => {
  return (
    <Card className='shadow-sm border-0 bg-white'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
            <BookOpen className='w-5 h-5 text-orange-600' />
            Recent Videos
          </CardTitle>
          <Link
            to='/videos'
            className='text-sm text-orange-600 hover:text-orange-700 font-medium'
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-4'>
          {videos.map((video) => (
            <div key={video.video_id} className='flex items-start space-x-3'>
              <div className='flex-shrink-0 w-16 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <div className='w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center'>
                  <div className='w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5' />
                </div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-medium text-gray-900 truncate'>
                  {video.title}
                </h3>
                <div className='flex items-center space-x-4 mt-1 text-xs text-gray-500'>
                  <div className='flex items-center space-x-1'>
                    <Clock className='w-3 h-3' />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <StickyNote className='w-3 h-3' />
                    <span>{video.note_count} notes</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Calendar className='w-3 h-3' />
                    <span>{formatDate(video.latest_timestamp)}</span>
                  </div>
                </div>
                <div className='mt-2'>
                  <div className='w-full bg-gray-200 rounded-full h-1.5'>
                    <div
                      className='bg-orange-500 h-1.5 rounded-full'
                      style={{ width: `${video.watch_progress}%` }}
                    />
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>
                    {video.watch_progress}% watched
                  </div>
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <p className='text-gray-500 text-sm'>No videos watched yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
