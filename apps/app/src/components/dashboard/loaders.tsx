import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { BookOpen, Calendar, Hash, StickyNote } from 'lucide-react';

export const MostUsedTagsLoader = () => (
  <Card className='shadow-sm border-0 bg-white'>
    <CardHeader className='pb-3'>
      <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
        <Hash className='w-5 h-5 text-orange-600' />
        Most Used Tags
      </CardTitle>
    </CardHeader>
    <CardContent className='pt-0'>
      <div className='flex flex-wrap gap-2'>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`tag-loader-${i}`}
            className='h-8 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full animate-pulse'
            style={{
              width: `${Math.random() * 60 + 80}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const RecentActivityLoader = () => (
  <Card className='shadow-sm border-0 bg-white'>
    <CardHeader className='pb-3'>
      <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
        <Calendar className='w-5 h-5 text-orange-600' />
        Recent Activity
      </CardTitle>
    </CardHeader>
    <CardContent className='pt-0'>
      <div className='space-y-3'>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={`activity-loader-${i}`}
            className='flex items-start space-x-3'
          >
            <div className='flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2 animate-pulse' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse' />
              <div className='h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse w-3/4' />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const RecentVideosLoader = () => (
  <Card className='shadow-sm border-0 bg-white'>
    <CardHeader className='pb-3'>
      <div className='flex items-center justify-between'>
        <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
          <BookOpen className='w-5 h-5 text-orange-600' />
          Recent Videos
        </CardTitle>
        <div className='h-4 w-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded animate-pulse' />
      </div>
    </CardHeader>
    <CardContent className='pt-0'>
      <div className='space-y-4'>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={`video-loader-${i}`} className='flex items-start space-x-3'>
            <div className='flex-shrink-0 w-16 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg animate-pulse' />
            <div className='flex-1 min-w-0 space-y-2'>
              <div className='h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse' />
              <div className='flex items-center space-x-4'>
                <div className='h-3 w-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse' />
                <div className='h-3 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse' />
                <div className='h-3 w-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse' />
              </div>
              <div className='w-full bg-gray-200 rounded-full h-1.5'>
                <div
                  className='bg-gradient-to-r from-orange-400 to-orange-500 h-1.5 rounded-full animate-pulse'
                  style={{ width: `${Math.random() * 60 + 20}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const RecentNotesLoader = () => (
  <Card className='shadow-sm border-0 bg-white'>
    <CardHeader className='pb-3'>
      <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
        <StickyNote className='w-5 h-5 text-orange-600' />
        Recent Notes
      </CardTitle>
    </CardHeader>
    <CardContent className='pt-0'>
      <div className='space-y-4'>
        <div className='relative'>
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 rounded animate-pulse' />
          <div className='w-full h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse' />
        </div>

        <div className='flex flex-wrap gap-2'>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`filter-loader-${i}`}
              className='h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full animate-pulse'
              style={{
                width: `${Math.random() * 40 + 60}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className='space-y-3'>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`note-loader-${i}`}
              className='p-3 bg-gray-50 rounded-lg space-y-2'
            >
              <div className='h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse' />
              <div className='h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse w-2/3' />
              <div className='flex items-center justify-between'>
                <div className='flex gap-1'>
                  {Array.from({ length: 2 }, (_, j) => (
                    <div
                      key={`note-tag-loader-${i}-${j}`}
                      className='h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded border animate-pulse'
                      style={{ width: `${Math.random() * 30 + 40}px` }}
                    />
                  ))}
                </div>
                <div className='h-3 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);
