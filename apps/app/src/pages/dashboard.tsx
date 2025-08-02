import {
  MostUsedTags,
  MostUsedTagsLoader,
  RecentActivityList,
  RecentActivityLoader,
  RecentNotes,
  RecentNotesLoader,
  RecentVideos,
  RecentVideosLoader,
} from '../components/dashboard';
import LogoutButton from '../components/logout-button';
import {
  useGetMostUsedTagsQuery,
  useGetRecentActivityQuery,
  useGetRecentNotesQuery,
  useGetRecentVideosQuery,
} from '../services/dashboard';

export const DashboardPage = () => {
  const {
    data: tagsData,
    isLoading: tagsLoading,
    error: _tagsError,
  } = useGetMostUsedTagsQuery();
  const {
    data: videosData,
    isLoading: videosLoading,
    error: _videosError,
  } = useGetRecentVideosQuery();
  const {
    data: activityData,
    isLoading: activityLoading,
    error: _activityError,
  } = useGetRecentActivityQuery();
  const {
    data: notesData,
    isLoading: notesLoading,
    error: _notesError,
  } = useGetRecentNotesQuery();

  const allTags = new Set<string>();
  if (notesData?.success && notesData.data.notes) {
    notesData.data.notes.forEach((note) => {
      note.tags.forEach((tag) => allTags.add(tag));
    });
  }
  const availableTags = Array.from(allTags);

  return (
    <div className='p-4 px-12 space-y-6 w-full'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <LogoutButton />
      </div>

      <div className='flex-1 space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {tagsLoading ? (
            <MostUsedTagsLoader />
          ) : tagsData?.success ? (
            <MostUsedTags tags={tagsData.data.tags} />
          ) : (
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm'>Failed to load tags</p>
            </div>
          )}

          {activityLoading ? (
            <RecentActivityLoader />
          ) : activityData?.success ? (
            <RecentActivityList activities={activityData.data.activities} />
          ) : (
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm'>Failed to load activity</p>
            </div>
          )}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2'>
            {videosLoading ? (
              <RecentVideosLoader />
            ) : videosData?.success ? (
              <RecentVideos videos={videosData.data.videos} />
            ) : (
              <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-red-600 text-sm'>Failed to load videos</p>
              </div>
            )}
          </div>
          <div className='lg:col-span-1'>
            {notesLoading ? (
              <RecentNotesLoader />
            ) : notesData?.success ? (
              <RecentNotes
                notes={notesData.data.notes}
                availableTags={availableTags}
              />
            ) : (
              <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-red-600 text-sm'>Failed to load notes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
