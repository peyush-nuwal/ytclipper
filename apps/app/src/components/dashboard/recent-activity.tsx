import type { RecentActivity } from '@/services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { Calendar, Clock } from 'lucide-react';

interface RecentActivityListProps {
  activities: RecentActivity[];
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })} at ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })}`;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const RecentActivityList = ({ activities }: RecentActivityListProps) => {
  return (
    <Card className='shadow-sm border-0 bg-white'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
          <Calendar className='w-5 h-5 text-orange-600' />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-3'>
          {activities.map((activity) => (
            <div
              key={`${activity.title}-${activity.timestamp}`}
              className='flex items-start space-x-3'
            >
              <div className='flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2' />
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-medium text-gray-900'>
                  {activity.title}
                </h3>
                <div className='flex items-center space-x-4 mt-1 text-xs text-gray-500'>
                  <span>{formatDateTime(activity.timestamp)}</span>
                  <div className='flex items-center space-x-1'>
                    <Clock className='w-3 h-3' />
                    <span>{formatDuration(activity.duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className='text-gray-500 text-sm'>No recent activity to show</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
