import { AIChat, NotesPanel } from '@/components/notes';
import { VideoPlayer } from '@/components/video';
import { useGenerateSummaryMutation } from '@/services/timestamps';
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
import {
  Bot,
  Check,
  Copy,
  FileText,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  const [generateSummary] = useGenerateSummaryMutation();

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
        // Navigate to the new video page
        navigate(`/timestamps/${id}`);
        setVideoUrl('');
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

  const handleGenerateSummary = async () => {
    if (!videoId) {
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await generateSummary({
        video_id: videoId,
        type: 'brief',
      }).unwrap();

      setSummary(response.data.summary);
      toast('Summary generated successfully!', {
        description: 'AI has analyzed your video notes and created a summary.',
      });
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast('Failed to generate summary', {
        description: 'Please try again later.',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
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

              <div className='flex items-center justify-between mt-4'>
                <div className='w-full'>
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

              {/* Video Summary Card */}
              <Card className='mt-4'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <FileText className='h-5 w-5' />
                      Video Summary
                    </CardTitle>
                    <div className='flex gap-2'>
                      {summary ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => copyToClipboard(summary)}
                        >
                          {copied ? (
                            <Check className='h-4 w-4 text-green-600' />
                          ) : (
                            <Copy className='h-4 w-4' />
                          )}
                        </Button>
                      ) : null}
                      <Button
                        size='sm'
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                      >
                        {isGeneratingSummary ? (
                          <>
                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className='h-4 w-4 mr-2' />
                            Generate Summary
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {summary ? (
                    <div className='space-y-3'>
                      <div className='bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap'>
                        {summary}
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant='outline'>#ai-generated</Badge>
                        <Badge variant='outline'>#video-summary</Badge>
                        <Badge variant='outline'>#key-points</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <p className='text-sm text-muted-foreground'>
                        This area will contain an AI-generated summary of the
                        video content, key points, and important timestamps once
                        you generate it.
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant='outline'>#tutorial</Badge>
                        <Badge variant='outline'>#educational</Badge>
                        <Badge variant='outline'>#programming</Badge>
                      </div>
                    </div>
                  )}
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
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value='ai' className='flex items-center gap-2'>
                    <Bot className='h-4 w-4' />
                    AI Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='notes' className='flex-1 mt-4'>
                  <NotesPanel videoId={videoId} />
                </TabsContent>

                <TabsContent value='ai' className='flex-1 mt-4'>
                  <AIChat
                    videoId={videoId}
                    currentTimestamp={Date.now() / 1000}
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
