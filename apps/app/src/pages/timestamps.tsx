import { AIChat, NotesPanel } from '@/components/notes';
import { VideoPlayer } from '@/components/video';
import { useYouTubePlayer } from '@/hooks/youtube-player';
import {
  useCreateTimestampMutation,
  useDeleteTimestampMutation,
  useGetTimestampsQuery,
} from '@/services/timestamps';
import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@ytclipper/ui';
import { Bot, FileText, Play } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { jumpToTimestamp, playerRef } = useYouTubePlayer();
  const [isFloatingNoteOpen, setIsFloatingNoteOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<string>('');

  const {
    data: timestampsData,
    isLoading: timestampsLoading,
    refetch,
  } = useGetTimestampsQuery(videoId || '', {
    skip: !videoId,
  });
  const [deleteTimestamp] = useDeleteTimestampMutation();
  const [createTimestamp, { isLoading: isCreating }] =
    useCreateTimestampMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');

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

  const extractVideoId = (url: string) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleVideoUrlSubmit = () => {
    if (videoUrl) {
      const id = extractVideoId(videoUrl);
      if (id) {
        // setVideoId(id);
        toast('Video loaded successfully!', {
          description: 'You can now start taking notes at any timestamp.',
        });
      } else {
        toast('Invalid YouTube URL', {
          description: 'Please enter a valid YouTube video URL.',
        });
      }
    }
  };

  const handleTimestampClick = (seconds: number) => {
    if (isPlayerReady) {
      jumpToTimestamp(seconds);
    }
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

  return (
    <div className='h-[calc(100vh-50px)] flex flex-col'>
      <main className='container mx-auto'>
        <ResizablePanelGroup direction='horizontal' className='min-h-full'>
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className='h-full pr-2'>
              <VideoPlayer
                videoId={videoId}
                className='w-full h-full rounded-b-none'
              />

              <div className='flex items-center justify-between'>
                <div className='w-full mt-4'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Paste YouTube video URL here...'
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleVideoUrlSubmit()
                      }
                    />
                    <Button onClick={handleVideoUrlSubmit}>
                      <Play className='h-4 w-4 mr-2' />
                      Load Video
                    </Button>
                  </div>
                </div>
              </div>
              <Card className='mt-4'>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Video Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-3'>
                    This area will contain an AI-generated summary of the video
                    content, key points, and important timestamps once the video
                    is analyzed.
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='outline'>#tutorial</Badge>
                    <Badge variant='outline'>#educational</Badge>
                    <Badge variant='outline'>#programming</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Notes & AI */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className='h-full pl-2'>
              <Tabs defaultValue='notes' className='h-full flex flex-col'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger
                    value='notes'
                    className='flex items-center gap-2'
                  >
                    <FileText className='h-4 w-4' />
                    Notes ({3})
                  </TabsTrigger>
                  <TabsTrigger value='ai' className='flex items-center gap-2'>
                    <Bot className='h-4 w-4' />
                    AI Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='notes' className='flex-1 mt-4'>
                  <NotesPanel
                    videoId={videoId}
                    onAddNote={() => {
                      setIsFloatingNoteOpen(true);
                      setActiveNote('');
                    }}
                  />
                </TabsContent>

                <TabsContent value='ai' className='flex-1 mt-4'>
                  <AIChat
                    videoTitle='abc'
                    currentTimestamp={new Date().getTime() / 1000}
                    onAskAboutTimestamp={(timestamp, question) => {
                      console.log(
                        'AI question at timestamp:',
                        timestamp,
                        question,
                      );
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};
