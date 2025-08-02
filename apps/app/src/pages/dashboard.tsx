import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import LogoutButton from '../components/logout-button';
import { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Hash,
  StickyNote,
  TrendingUp,
  Video,
} from 'lucide-react';

interface InfoCardData {
  id: number;
  title: string;
  data: string;
  desc?: string;
  icon: React.ReactNode;
  redirect?: string;
}

export const DashboardPage = () => {
  const [infoCards, setInfoCards] = useState<InfoCardData[]>([
    {
      id: 1,
      title: 'Total Notes',
      data: '3',
      desc: 'abc',
      icon: <StickyNote />,
      redirect: 'abc',
    },
    {
      id: 2,
      title: 'Videos watched',
      data: '3',
      desc: 'abc',
      icon: <Video />,
      redirect: 'abc',
    },
    {
      id: 3,
      title: 'Total Watch Time',
      data: '3',
      desc: 'abc',
      icon: <Clock />,
      redirect: 'abc',
    },
    {
      id: 4,
      title: 'Weekly Activity',
      data: '3',
      desc: 'abc',
      icon: <TrendingUp />,
      redirect: 'abc',
    },
  ]);

  return (
    <div className='p-4 px-12 space-y-6 w-full'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <LogoutButton />
      </div>

      <div className='flex-1 space-y-4'>
        {/* User Profile */}
        {/* <UserProfile /> */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full'>
          {infoCards.map((infoCard) => {
            return (
              <Card key={infoCard.id} className='w-full gap-2'>
                <CardHeader>
                  <CardTitle>
                    <div className='flex justify-between items-center text-md'>
                      {infoCard.title}
                      <div className='text-primary'>{infoCard.icon}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl'>{infoCard.data}</div>
                  <div className='text-sm'>{infoCard.desc}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 w-full'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Hash className='text-primary' />
                <div className='text-xl'>Most Used Tags</div>
              </CardTitle>
            </CardHeader>
            <CardContent>content</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='text-primary' />
                <div className='text-xl'>Recent Activity</div>
              </CardTitle>
            </CardHeader>
            <CardContent>No recent activity to show</CardContent>
          </Card>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 w-full'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BookOpen className='text-primary' />
                <div className='text-xl'>Recent Videos</div>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <StickyNote className='text-primary' />
                <div className='text-xl'>Recent Videos</div>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};
