import Loading from '@/components/loading';
import { TimestampCard } from '@/components/timestamps/timestamp-card';
import { YouTubePlayer } from '@/components/timestamps/youtube-player';
import { useYouTubePlayer } from '@/hooks/youtube-player';
import {
  useCreateTimestampMutation,
  useDeleteTimestampMutation,
  useGetTimestampsQuery,
} from '@/services/timestamps';
import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import { StickyNote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useParams } from 'react-router';
import { FloatingNoteTaker } from '../components/timestamps/floating-note-taking';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { jumpToTimestamp, playerRef } = useYouTubePlayer();
  const [isFloatingNoteOpen, setIsFloatingNoteOpen] = useState(false);

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  const handleFloatingNoteAdd = async (data: {
    title: string;
    note: string;
    tags: string[];
    timestamp: number;
  }) => {
    if (!videoId) {
      return;
    }

    await createTimestamp({
      video_id: videoId,
      timestamp: data.timestamp,
      title: data.title,
      note: data.note,
      tags: data.tags,
    }).unwrap();

    refetch();
    setIsFloatingNoteOpen(false);
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
    <div className='h-screen overflow-hidden'>
      <PanelGroup direction='horizontal' className='flex w-full h-full'>
        <Panel
          minSize={50}
          className='flex flex-col flex-grow border-r border-gray-200 min-w-0'
        >
          {/* Video Player */}
          <div className='aspect-video bg-black'>
            <YouTubePlayer
              ref={playerRef}
              videoId={videoId}
              onReady={handlePlayerReady}
              onError={handlePlayerError}
              className='w-full h-full'
            />
            <button
              onClick={() => setIsFloatingNoteOpen(true)}
              className='absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              title='Take a quick note'
            >
              <StickyNote size={20} />
            </button>
          </div>
        </Panel>
        <PanelResizeHandle className='w-2 bg-gray-300 cursor-col-resize' />
        <Panel
          minSize={20}
          defaultSize={25}
          className='flex flex-col bg-white border-gray-200 overflow-y-auto px-4 py-4'
        >
          <div className='flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2'>
            <h2 className='text-lg font-bold text-gray-900'>
              🕒 Notes & Timestamps
            </h2>
            <span className='text-sm text-gray-500'>
              {timestampsData?.data?.timestamps?.length} total
            </span>
          </div>
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
              <div className='text-center text-sm text-gray-500 pt-6'>
                No timestamps added yet.
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
      <FloatingNoteTaker
        isOpen={isFloatingNoteOpen}
        onClose={() => setIsFloatingNoteOpen(false)}
        currentTimestamp={currentTimestamp}
        onAddTimestamp={handleFloatingNoteAdd}
        isCreating={isCreating}
      />
    </div>
  );
};
