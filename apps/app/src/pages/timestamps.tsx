import Loading from '@/components/loading';
import { FloatingNoteTaker } from '@/components/timestamps/floating-note-taking';
import { TimestampCard } from '@/components/timestamps/timestamp-card';
import { YouTubePlayer } from '@/components/timestamps/youtube-player';
import { useYouTubePlayer } from '@/hooks/youtube-player';
import {
  useCreateTimestampMutation,
  useDeleteTimestampMutation,
  useGetTimestampsQuery,
} from '@/services/timestamps';
import '@uiw/react-markdown-preview/markdown.css';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@ytclipper/ui';
import { StickyNote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { jumpToTimestamp, playerRef } = useYouTubePlayer();
  const [isFloatingNoteOpen, setIsFloatingNoteOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<string>('');

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

        // Highlight matching note in real-time
        const match = timestampsData?.data?.timestamps.find((ts) => {
          return Math.abs(ts.timestamp - currentTime) < 3; // within 3 seconds window
        });
        if (match && match.note !== activeNote) {
          setActiveNote(match.note);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerReady, playerRef, timestampsData, activeNote]);

  const handleTimestampClick = (seconds: number) => {
    if (isPlayerReady) {
      jumpToTimestamp(seconds);
    }
  };

  const handlePlayerReady = () => {
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
    try {
      console.log('Saving edit for ID:', id, 'with note:', newNote);
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
      <ResizablePanelGroup direction='horizontal' className='h-full'>
        {/* Left Panel - Video Player */}
        <ResizablePanel defaultSize={75} minSize={50}>
          <div className='h-full flex flex-col relative'>
            <div className='aspect-video w-full bg-black'>
              <YouTubePlayer
                ref={playerRef}
                videoId={videoId}
                onReady={handlePlayerReady}
                onError={handlePlayerError}
                className='w-full h-full'
              />

              {/* Floating Note Button */}
              <button
                onClick={() => setIsFloatingNoteOpen(true)}
                className='absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10'
                title='Take a quick note'
              >
                <StickyNote size={20} />
              </button>
            </div>

            {/* Empty space or additional content can go here */}
            <div className='flex-1 bg-gray-50'>
              {/* You can add video controls, description, or other content here */}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - Notes & Timestamps with Tabs */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
          <div className='h-full bg-white border-l border-gray-200 flex flex-col'>
            {/* Header */}
            <div className='p-4 border-b border-gray-200 bg-gray-50'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                  🕒 Notes & Timestamps
                </h2>
                <span className='text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full'>
                  {timestampsData?.data?.timestamps?.length || 0} total
                </span>
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue='current-note' className='flex-1 flex flex-col'>
              <div className='px-4 pt-3 border-b border-gray-200'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='current-note'>Current Note</TabsTrigger>
                  <TabsTrigger value='all-notes'>All Notes</TabsTrigger>
                </TabsList>
              </div>

              {/* Current Note Tab */}
              <TabsContent
                value='current-note'
                className='flex-1 p-0 m-0 overflow-hidden'
              >
                <div className='h-full flex flex-col p-4 overflow-hidden'>
                  <div className='flex-1 overflow-y-auto'>
                    {activeNote ? (
                      <div className='h-full flex flex-col space-y-3'>
                        {!editingId ? (
                          // Markdown rendered view
                          <div className='flex-1 overflow-auto border border-blue-100 bg-blue-50 rounded-lg p-4'>
                            <div className='text-xs text-blue-600 mb-2 font-medium flex items-center gap-1'>
                              <StickyNote size={12} />
                              Active note at current time:
                            </div>
                            <div className='text-sm text-gray-700 whitespace-pre-line'>
                              <MDEditor.Markdown
                                source={activeNote}
                                style={{ background: 'transparent' }}
                              />
                            </div>
                            <div className='mt-4'>
                              <button
                                className='px-4 py-1 text-sm font-medium rounded bg-blue-500 text-white hover:bg-blue-600'
                                onClick={() => setEditingId('active')}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Editable markdown editor
                          <div className='flex-1 overflow-auto border border-yellow-200 bg-yellow-50 rounded-lg p-4'>
                            <div className='text-xs text-yellow-600 mb-2 font-medium flex items-center gap-1'>
                              <StickyNote size={12} />
                              Editing current note:
                            </div>
                            <div className='mb-2'>
                              <MDEditor
                                value={editingNote}
                                onChange={(val) => setEditingNote(val || '')}
                                height={200}
                              />
                            </div>
                            <div className='flex gap-2'>
                              <button
                                className='px-3 py-1 text-sm font-medium bg-green-500 text-white rounded hover:bg-green-600'
                                onClick={() => {
                                  const match =
                                    timestampsData?.data?.timestamps.find(
                                      (ts) =>
                                        Math.abs(
                                          ts.timestamp - currentTimestamp,
                                        ) < 3,
                                    );
                                  if (match) {
                                    saveEdit(match.id, editingNote);
                                  }
                                }}
                              >
                                Save
                              </button>
                              <button
                                className='px-3 py-1 text-sm font-medium bg-gray-300 text-gray-800 rounded hover:bg-gray-400'
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='flex items-center justify-center h-full text-gray-500 text-sm'>
                        <div className='text-center'>
                          <StickyNote
                            size={48}
                            className='mx-auto mb-3 text-gray-300'
                          />
                          <p className='font-medium'>
                            No note for current time
                          </p>
                          <p className='text-xs mt-1 text-gray-400'>
                            Notes will appear here when you reach timestamped
                            sections
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* All Notes Tab */}
              <TabsContent
                value='all-notes'
                className='flex-1 p-0 m-0 overflow-hidden'
              >
                <div className='h-full flex flex-col p-4 overflow-hidden'>
                  <div className='flex-1 overflow-y-auto space-y-3'>
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
                      <div className='text-center text-sm text-gray-500 py-8'>
                        <StickyNote
                          size={48}
                          className='mx-auto mb-3 text-gray-300'
                        />
                        <p className='font-medium'>No timestamps added yet</p>
                        <p className='text-xs mt-1 text-gray-400'>
                          Click the floating note button on the video to start
                          taking notes!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Floating Note Taker Component */}
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
