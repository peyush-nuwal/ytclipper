import Loading from '@/components/loading';
// import { AddTimestampForm } from '@/components/timestamps/add-timestamp-form';
// import { TimestampsList } from '@/components/timestamps/timestamps-list';
// import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { YouTubePlayer } from '@/components/timestamps/youtube-player';
import { useYouTubePlayer } from '@/hooks/youtube-player';
import { useGetTimestampsQuery } from '@/services/timestamps';
import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { jumpToTimestamp } = useYouTubePlayer();

  const { data: timestampsData, isLoading } = useGetTimestampsQuery(
    videoId || '',
    {
      skip: !videoId,
    },
  );

  const [newTimestamp, setNewTimestamp] = useState({
    timestamp: '',
    title: '',
    note: '',
    tags: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
                  <input
                    type='number'
                    step='0.1'
                    placeholder='Time (seconds)'
                    value={newTimestamp.timestamp}
                    onChange={(e) =>
                      setNewTimestamp({
                        ...newTimestamp,
                        timestamp: e.target.value,
                      })
                    }
                    className='w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
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
                  onClick={() => {
                    console.log('Adding timestamp:', newTimestamp);
                  }}
                  className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'
                >
                  <Plus size={16} />
                  Add Timestamp
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Notes */}
          <div className='w-1/3 bg-white rounded-lg shadow-lg p-6 flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Notes & Timestamps</h3>
              <div className='text-sm text-gray-500'>
                {timestampsData?.data?.timestamps?.length} timestamp
                {timestampsData?.data?.timestamps?.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Timestamps List */}
            <div className='flex-1 overflow-y-auto'>
              <div className='space-y-3'>
                {timestampsData?.data?.timestamps.map((timestamp) => (
                  <div
                    key={timestamp.id}
                    className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center gap-3'>
                        <button
                          className='text-blue-600 font-mono text-sm hover:underline'
                          onClick={() => {
                            console.log(`Jump to ${timestamp.timestamp}`);
                            handleTimestampClick(timestamp.timestamp);
                            setEditingId(timestamp.id);
                          }}
                        >
                          {formatTimestamp(timestamp.timestamp)}
                        </button>
                        <h5 className='font-medium text-gray-900'>
                          {timestamp.title}
                        </h5>
                      </div>
                      <div className='flex items-center gap-1'>
                        <button
                          onClick={() => {
                            console.log(`Edit timestamp ${timestamp.id}`);
                          }}
                          className='p-1 text-gray-500 hover:text-blue-600 transition-colors'
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete timestamp');
                          }}
                          className='p-1 text-gray-500 hover:text-red-600 transition-colors'
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {editingId === timestamp.id ? (
                      <div className='space-y-2'>
                        <textarea
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                          rows={2}
                        />
                        <div className='flex gap-2'>
                          <button
                            onClick={() => {
                              console.log('Saving edited note:', editingNote);
                            }}
                            className='flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors'
                          >
                            <Save size={12} />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              console.log('Cancel editing');
                            }}
                            className='flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors'
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className='text-gray-700 text-sm mb-2'>
                          {timestamp.note}
                        </p>
                        <div className='flex justify-between items-center'>
                          <p className='text-xs text-gray-500'>
                            {new Date(
                              timestamp.created_at,
                            ).toLocaleDateString()}
                          </p>
                          {timestamp.updated_at !== timestamp.created_at && (
                            <p className='text-xs text-gray-400'>
                              Updated:{' '}
                              {new Date(
                                timestamp.updated_at,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
