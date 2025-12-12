/**
 * Event Chatbot Component
 * 
 * AI-powered Q&A chatbot for event pages.
 * Answers questions about specific events using context.
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService, type ChatRequest } from '@/lib/ai-service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedQuestions?: string[];
}

interface EventChatbotProps {
  eventId: string;
  eventName: string;
  eventType: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  capacity?: number;
  price?: number;
  registrationDeadline?: string;
  requirements?: string;
  agenda?: string;
  professors?: string[];
  faculty?: string;
  userId?: string;
  userRole?: string;
  className?: string;
}

export function EventChatbot({
  eventId,
  eventName,
  eventType,
  description,
  location,
  startDate,
  endDate,
  capacity,
  price,
  registrationDeadline,
  requirements,
  agenda,
  professors,
  faculty,
  userId,
  userRole,
  className,
}: EventChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build event context
  const eventContext: ChatRequest['event_context'] = {
    event_id: eventId,
    event_name: eventName,
    event_type: eventType,
    description,
    location,
    start_date: startDate,
    end_date: endDate,
    capacity,
    price,
    registration_deadline: registrationDeadline,
    requirements,
    agenda,
    professors,
    faculty,
  };

  // Load suggested questions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'}/api/ai/chatbot/common-questions/${eventType}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestedQuestions(data.questions || []);
        }
      } catch (error) {
        // Use fallback questions
        setSuggestedQuestions([
          'What is this event about?',
          'When and where is it?',
          'How do I register?',
        ]);
      }
    };

    loadSuggestions();
  }, [eventType]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Add initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! 👋 I'm here to help you with questions about **${eventName}**. What would you like to know?`,
          timestamp: new Date(),
          suggestedQuestions: suggestedQuestions.slice(0, 3),
        },
      ]);
    }
  }, [isOpen, eventName, suggestedQuestions]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.askQuestion({
        event_context: eventContext,
        message: input,
        conversation_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        user_id: userId,
        user_role: userRole,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        suggestedQuestions: response.suggested_questions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I couldn't process your question. Please try again or contact the event organizers directly.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
          'bg-primary hover:bg-primary/90',
          className
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 w-96 shadow-2xl z-50 overflow-hidden',
        'transition-all duration-200',
        isMinimized ? 'h-14' : 'h-[500px]',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="p-3 bg-primary text-primary-foreground flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <CardTitle className="text-sm font-medium">Event Assistant</CardTitle>
          <Sparkles className="h-3 w-3 opacity-70" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary-foreground/10"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary-foreground/10"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-56px)]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index}>
                  <div
                    className={cn(
                      'flex items-start gap-2',
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.content}
                    </div>
                  </div>

                  {/* Suggested Questions */}
                  {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                    <div className="mt-2 ml-10 flex flex-wrap gap-1">
                      {message.suggestedQuestions.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleSuggestedQuestion(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this event..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default EventChatbot;
