import Loading from '@/components/loading';
import { TimestampCard } from '@/components/timestamps/timestamp-card';
import { YouTubePlayer } from '@/components/timestamps/youtube-player';
import { useYouTubePlayer } from '@/hooks/youtube-player';
import {
  useCreateTimestampMutation,
  useDeleteTimestampMutation,
  useGetTimestampsQuery,
} from '@/services/timestamps';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { formatTimestamp } from '../lib/utils';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { jumpToTimestamp, playerRef } = useYouTubePlayer();

  const {
    data: timestampsData,
    isLoading,
    refetch,
  } = useGetTimestampsQuery(videoId || '', {
    skip: !videoId,
  });
  const [deleteTimestamp] = useDeleteTimestampMutation();
  const [createTimestamp, { isLoading: isCreating }] =
    useCreateTimestampMutation();

  const [newTimestamp, setNewTimestamp] = useState({
    timestamp: '',
    title: '',
    note: '',
    tags: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  const handleAddTimestamp = async () => {
    if (!videoId || !newTimestamp.title) {
      return;
    }
    try {
      await createTimestamp({
        video_id: videoId,
        timestamp: currentTimestamp,
        title: newTimestamp.title,
        note: newTimestamp.note,
        tags: newTimestamp.tags,
      }).unwrap();

      setNewTimestamp({
        timestamp: '',
        title: '',
        note: '',
        tags: [],
      });

      refetch();
    } catch (err) {
      console.error('Failed to create timestamp:', err);
    }
  };

  useEffect(() => {
    if (!isPlayerReady || !playerRef?.current) {
      return;
    }

    const interval = setInterval(() => {
      const currentTime = playerRef.current?.getCurrentTime?.();
      if (typeof currentTime === 'number') {
        setCurrentTimestamp(currentTime);
      }
    }, 1000); // update every second

    return () => clearInterval(interval);
  }, [isPlayerReady, playerRef]);

  const handleTimestampClick = (seconds: number) => {
    if (isPlayerReady) {
      jumpToTimestamp(seconds);
    }
  };
  const handlePlayerReady = () => {
    console.log('Player is ready!');
    setIsPlayerReady(true);
  };

  const handlePlayerError = (error: number) => {
    console.error('Player error:', error);
    setIsPlayerReady(false);
  };
  const startEditing = (id: string, currentNote: string) => {
    setEditingId(id);
    setEditingNote(currentNote);
  };

  const saveEdit = async (id: string, newNote: string) => {
    console.log('Saving edit for:', id, 'with note:', newNote);
    // Here you would call your API to update the timestamp
    try {
      // await updateTimestampApiCall(id, newNote);
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update timestamp:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteTimestamp = async (id: string) => {
    try {
      await deleteTimestamp(id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete timestamp:', error);
    }
  };

  if (!videoId) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Invalid Video ID
          </h2>
          <p className='text-gray-600'>
            No video ID provided in the URL parameters.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex gap-6 h-[calc(100vh-200px)]'>
          <div className='w-2/3 bg-white rounded-lg shadow-lg p-6 flex flex-col'>
            <div className='aspect-video bg-black rounded-lg mb-4 flex items-center justify-center relative overflow-hidden flex-1'>
              <YouTubePlayer
                ref={playerRef}
                videoId={videoId}
                onReady={handlePlayerReady}
                onError={handlePlayerError}
                className='w-full h-full'
              />
            </div>
            <div className='mb-4 text-sm text-gray-600'>
              Player Status: {isPlayerReady ? '✅ Ready' : '⏳ Loading...'}
            </div>

            {/* Add New Timestamp - Moved to bottom of video */}
            <div className='border rounded-lg p-4 bg-gray-50'>
              <h4 className='font-medium mb-3'>Add New Timestamp</h4>
              <div className='space-y-3'>
                <div className='flex gap-2'>
                  <div className='w-32 px-3 py-2 border rounded-md bg-gray-100 text-gray-800 text-sm text-center'>
                    {formatTimestamp(currentTimestamp)}
                  </div>
                  <input
                    type='text'
                    placeholder='Title'
                    value={newTimestamp.title}
                    onChange={(e) =>
                      setNewTimestamp({
                        ...newTimestamp,
                        title: e.target.value,
                      })
                    }
                    className='flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <textarea
                  placeholder='Note (optional)'
                  value={newTimestamp.note}
                  onChange={(e) =>
                    setNewTimestamp({ ...newTimestamp, note: e.target.value })
                  }
                  className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                  rows={2}
                />
                <button
                  onClick={handleAddTimestamp}
                  className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'
                >
                  <Plus size={16} />
                  {isCreating ? 'Adding...' : 'Add Timestamp'}
                </button>
              </div>
            </div>
          </div>

          <div className='w-1/3 bg-white rounded-lg shadow-lg p-6 flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Notes & Timestamps</h3>
              <div className='text-sm text-gray-500'>
                {timestampsData?.data?.timestamps?.length} timestamp
                {timestampsData?.data?.timestamps?.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='space-y-3'>
                {timestampsData?.data?.timestamps?.length ? (
                  timestampsData.data.timestamps.map((timestamp) => (
                    <TimestampCard
                      key={timestamp.id}
                      timestamp={timestamp}
                      isEditing={editingId === timestamp.id}
                      onSeek={handleTimestampClick}
                      onEditStart={(id) => startEditing(id, timestamp.note)}
                      onEditSave={saveEdit}
                      onEditCancel={cancelEdit}
                      onDelete={handleDeleteTimestamp}
                      editNoteValue={editingNote}
                      onEditNoteChange={setEditingNote}
                    />
                  ))
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <div className='mb-2'>No timestamps yet</div>
                    <div className='text-sm'>Add timestamps to appear here</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
