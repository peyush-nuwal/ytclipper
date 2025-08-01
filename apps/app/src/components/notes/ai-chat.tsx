import { useAppSelector } from '@/store/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  ScrollArea,
} from '@ytclipper/ui';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relatedTimestamp?: number;
}

interface AIChatProps {
  currentTimestamp?: number;
  onAskAboutTimestamp?: (timestamp: number, question: string) => void;
}

export const AIChat = ({ currentTimestamp }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content:
        "Hi! I'm here to help you understand this video better. You can ask me questions about any part of the video, and I'll provide detailed explanations based on the content.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const timeStampsSliceData = useAppSelector((state) => state.timestamps);
  const videoTitle = timeStampsSliceData.videoTitle;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      relatedTimestamp: currentTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you're asking about "${inputValue}". Based on the video content${currentTimestamp ? ` at timestamp ${formatTime(currentTimestamp)}` : ''}, here's what I can explain:\n\nThis is a simulated AI response. In a real implementation, this would connect to an AI service that has analyzed the video content and can provide contextual answers based on the video transcript and your notes.`,
        timestamp: new Date(),
        relatedTimestamp: currentTimestamp,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const suggestedQuestions = [
    'Summarize the main points',
    'What are the key takeaways?',
    'Explain this concept in simple terms',
    'What examples were given?',
    'How does this relate to...?',
  ];

  return (
    <Card className='h-full flex flex-col'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Bot className='h-5 w-5 text-accent' />
          AI Assistant
          <Sparkles className='h-4 w-4 text-accent' />
        </CardTitle>
        {videoTitle ? (
          <p className='text-sm text-muted-foreground'>
            Chatting about: {videoTitle}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className='flex-1 flex flex-col p-0'>
        {/* Messages */}
        <ScrollArea className='flex-1 px-4 max-h-[calc(100vh-200px-200px-100px-50px)]'>
          <div className='space-y-4 pb-4'>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className='h-4 w-4' />
                    ) : (
                      <Bot className='h-4 w-4' />
                    )}
                  </div>

                  <div
                    className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className='text-sm whitespace-pre-wrap'>
                      {message.content}
                    </div>
                    {message.relatedTimestamp !== undefined && (
                      <Badge variant='outline' className='mt-2 text-xs'>
                        At {formatTime(message.relatedTimestamp)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className='flex gap-3 justify-start'>
                <div className='w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center'>
                  <Bot className='h-4 w-4' />
                </div>
                <div className='bg-muted rounded-lg p-3'>
                  <div className='flex gap-1'>
                    <div className='w-2 h-2 bg-current rounded-full animate-bounce' />
                    <div
                      className='w-2 h-2 bg-current rounded-full animate-bounce'
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className='w-2 h-2 bg-current rounded-full animate-bounce'
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        <div className='px-4 py-3 border-t'>
          <div className='text-xs text-muted-foreground mb-2'>
            Suggested questions:
          </div>
          <div className='flex flex-wrap gap-1'>
            {suggestedQuestions.map((question) => (
              <Button
                key={question}
                variant='outline'
                size='sm'
                className='text-xs h-7'
                onClick={() => setInputValue(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className='p-4 border-t'>
          <div className='flex gap-2'>
            <Input
              placeholder={`Ask about the video${currentTimestamp ? ` at ${formatTime(currentTimestamp)}` : ''}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && !e.shiftKey && handleSendMessage()
              }
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size='icon'
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>
          {currentTimestamp !== undefined && (
            <div className='mt-2 text-xs text-muted-foreground'>
              Current timestamp: {formatTime(currentTimestamp)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
