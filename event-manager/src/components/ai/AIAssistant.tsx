/**
 * AI Assistant Component
 * 
 * A beautiful, generic AI-powered assistant that floats on all pages.
 * Helps students with:
 * - Finding events
 * - Event information
 * - Registration help
 * - Cancellations
 * - General questions
 * 
 * Features:
 * - Smooth animations
 * - Context-aware responses
 * - Quick action buttons
 * - Conversation history
 * - Voice input support
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  X,
  Sparkles,
  Minimize2,
  Calendar,
  Search,
  HelpCircle,
  TicketX,
  ChevronRight,
  Mic,
  MicOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { MarkdownViewer } from '@/components/ui/markdown-viewer';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickActions?: QuickAction[];
}

interface QuickAction {
  label: string;
  action: string;
  icon?: 'calendar' | 'search' | 'help' | 'cancel';
  actionType?: string;
  eventId?: string;
}

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

// Quick action suggestions based on context
const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Find events', action: 'What events are happening this week?', icon: 'search' },
  { label: 'My registrations', action: 'Show me my upcoming events', icon: 'calendar' },
  { label: 'Cancel booking', action: 'How do I cancel a registration?', icon: 'cancel' },
  { label: 'Get help', action: 'What can you help me with?', icon: 'help' },
];

const ICON_MAP = {
  calendar: Calendar,
  search: Search,
  help: HelpCircle,
  cancel: TicketX,
};

// Check if speech recognition is supported
const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export function AIAssistant() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Check speech recognition support on mount
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);
  
  // Initialize speech recognition
  useEffect(() => {
    if (!speechSupported) return;
    
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      
      setInput(transcript);
      
      // Auto-send when speech is final
      if (lastResult.isFinal) {
        setIsListening(false);
        // Small delay to ensure state is updated
        setTimeout(() => {
          if (transcript.trim()) {
            // Trigger send
            inputRef.current?.form?.requestSubmit();
          }
        }, 100);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it in your browser settings.');
      } else if (event.error !== 'aborted') {
        toast.error('Voice input error. Please try again.');
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      recognition.abort();
    };
  }, [speechSupported]);
  
  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput(''); // Clear input before starting
      try {
        recognitionRef.current.start();
      } catch (error) {
        // Recognition might already be running
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isListening]);
  
  // tRPC mutations for actions
  const utils = trpc.useUtils();
  const registerMutation = trpc.events.registerForEvent.useMutation();
  const cancelMutation = trpc.events.cancelRegistration.useMutation();

  // Fetch upcoming events accessible to user (filters out whitelisted events user can't access)
  const { data: accessibleEvents } = trpc.events.getAccessibleUpcoming.useQuery(
    { limit: 15 },
    { enabled: isOpen && !!user, staleTime: 60000 }
  );
  
  // Fetch user's registrations for context
  const { data: userRegistrations } = trpc.events.getMyRegistrations.useQuery(
    { page: 1, limit: 50 },
    { enabled: isOpen && !!user, staleTime: 60000 }
  );

  // Don't show for logged out users, ADMIN, or EVENT_OFFICE
  // Don't show for logged out users, ADMIN, or EVENT_OFFICE
  const shouldShow = !!user && user.role !== 'ADMIN' && user.role !== 'EVENT_OFFICE';

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userName = user?.firstName;
      const greeting = userName 
        ? `Hi ${userName}! 👋 I'm your Another Compile L assistant. How can I help you today?`
        : "Hi there! 👋 I'm your Another Compile L assistant. How can I help you today?";
      
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        quickActions: QUICK_ACTIONS,
      }]);
    }
  }, [isOpen, user?.firstName, messages.length]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Format events for AI context (only events user has access to)
      const eventsContext = accessibleEvents?.events?.map((e: any) => ({
        id: e.id || e._id,
        name: e.name,
        type: e.type,
        description: e.description?.substring(0, 200),
        location: e.location,
        startDate: e.startDate,
        price: e.price,
        capacity: e.capacity,
        registrationCount: e.registrationCount,
        isExclusive: e.isWhitelisted, // Let AI know if event is exclusive
      })) || [];

      // Call the general assistant endpoint
      const response = await fetch(`${AI_SERVICE_URL}/api/ai/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
          user_context: user ? {
            user_id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            faculty: user.faculty,
          } : null,
          available_events: eventsContext,
          registered_event_ids: userRegistrations?.registrations
            ?.filter((r: any) => r.event?.id)
            .map((r: any) => r.event.id) || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that. Please try again!",
        timestamp: new Date(),
        quickActions: data.suggested_actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Assistant error:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. You can:\n\n• Browse events from the **Events** page\n• Check your registrations in **My Events**\n• Contact support at **events@guc.edu.eg**",
        timestamp: new Date(),
        quickActions: QUICK_ACTIONS.slice(0, 2),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, messages, user, accessibleEvents, userRegistrations]);

  const handleSend = () => sendMessage(input);

  const handleQuickAction = async (quickAction: QuickAction) => {
    const { action, actionType, eventId } = quickAction;
    
    // Handle executable actions
    if (actionType === 'register' && eventId) {
      try {
        await registerMutation.mutateAsync({ eventId });
        
        // Check if it's a free event or needs payment
        const event = accessibleEvents?.events?.find((e: any) => e.id === eventId);
        const isFree = !event?.price || event.price === 0;
        
        if (isFree) {
          toast.success('Successfully registered for this free event!');
          const confirmMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '✅ Done! You\'re registered for this event. You can view it in "My Events".',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, confirmMessage]);
        } else {
          // Redirect to payment for paid events
          toast.success('Seat held! Redirecting to payment...');
          const params = new URLSearchParams({
            eventId: eventId,
            amountMinor: String((event?.price || 0) * 100),
            currency: 'egp'
          });
          setTimeout(() => {
            window.location.href = `/payment?${params.toString()}`;
          }, 1000);
        }
        
        // Invalidate queries
        utils.events.isRegistered.invalidate({ eventId });
      } catch (error: any) {
        toast.error(error.message || 'Failed to register');
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ Sorry, registration failed: ${error.message || 'Unknown error'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }
    
    if (actionType === 'cancel' && eventId) {
      // For cancellation, we need the registrationId, not eventId
      // We need to find the registration first
      const registration = userRegistrations?.registrations?.find(
        (r: any) => r.event?.id === eventId
      );
      
      if (!registration) {
        toast.error('Registration not found');
        return;
      }
      
      try {
        await cancelMutation.mutateAsync({ registrationId: registration.id });
        toast.success('Registration cancelled');
        const confirmMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '✅ Registration cancelled. Refund will be processed if applicable.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMessage]);
        
        // Refresh registrations
        utils.events.isRegistered.invalidate({ eventId });
      } catch (error: any) {
        toast.error(error.message || 'Failed to cancel');
      }
      return;
    }
    
    if (actionType === 'navigate') {
      if (action === 'navigate:events') {
        window.location.href = '/events';
        setIsOpen(false);
      } else if (action === 'navigate:my-events') {
        window.location.href = '/dashboard';
        setIsOpen(false);
      }
      return;
    }
    
    // Default: send as text message
    setInput(action);
    sendMessage(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render for logged out users, ADMIN, or EVENT_OFFICE
  if (!shouldShow) {
    return null;
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'bg-gradient-to-r from-primary to-primary/80',
            'hover:shadow-xl hover:scale-105 transition-all duration-200',
            'group'
          )}
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="sr-only">Open AI Assistant</span>
          
          {/* Pulse animation */}
          <span className="absolute -top-1 -right-1 h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-primary items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
            </span>
          </span>
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-[380px] max-w-[calc(100vw-48px)]',
          'rounded-2xl shadow-2xl overflow-hidden',
          'border bg-background',
          'flex flex-col',
          isMinimized ? 'h-[60px]' : 'h-[550px] max-h-[calc(100vh-48px)]'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-4 py-3',
          'bg-gradient-to-r from-primary to-primary/80',
          'text-primary-foreground shrink-0'
        )}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Another Compile L Assistant</h3>
              <p className="text-xs text-primary-foreground/70">Always here to help</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary-foreground/10 text-primary-foreground"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary-foreground/10 text-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content - Only visible when not minimized */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={cn(
                          'flex items-start gap-2',
                          message.role === 'user' ? 'flex-row-reverse' : ''
                        )}
                      >
                        <div
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
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
                            'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-md'
                              : 'bg-muted rounded-tl-md'
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <MarkdownViewer 
                              content={message.content} 
                              className="text-sm leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-1"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      {message.quickActions && message.quickActions.length > 0 && (
                        <div className="mt-3 ml-10 flex flex-wrap gap-2">
                          {message.quickActions.map((action, i) => {
                            const IconComponent = action.icon ? ICON_MAP[action.icon] : ChevronRight;
                            const isExecutable = action.actionType === 'register' || action.actionType === 'cancel';
                            return (
                              <Button
                                key={i}
                                variant={isExecutable ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 text-xs gap-1.5",
                                  isExecutable 
                                    ? "bg-primary hover:bg-primary/90" 
                                    : "hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                )}
                                onClick={() => handleQuickAction(action)}
                                disabled={registerMutation.isPending || cancelMutation.isPending}
                              >
                                <IconComponent className="h-3.5 w-3.5" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-muted/30 shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening..." : "Ask me anything..."}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 rounded-full px-4 bg-background transition-all",
                      isListening && "ring-2 ring-primary ring-offset-2 animate-pulse"
                    )}
                  />
                  {/* Voice Input Button */}
                  {speechSupported && (
                    <Button
                      type="button"
                      onClick={toggleVoiceInput}
                      disabled={isLoading}
                      size="icon"
                      variant={isListening ? "default" : "outline"}
                      className={cn(
                        "rounded-full h-10 w-10 shrink-0 transition-all",
                        isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
                      )}
                      title={isListening ? "Stop listening" : "Voice input"}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="rounded-full h-10 w-10 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {speechSupported ? "Powered by AI • Click 🎤 to speak" : "Powered by AI • Responses may not always be accurate"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

export default AIAssistant;
