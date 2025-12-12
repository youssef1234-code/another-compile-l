/**
 * AI Service Client
 * 
 * Client for communicating with the Python AI service.
 * Provides typed methods for all AI features.
 */

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

// Types
export interface GenerateDescriptionRequest {
  event_name: string;
  event_type: 'WORKSHOP' | 'TRIP' | 'BAZAAR' | 'CONFERENCE' | 'GYM_SESSION';
  location: string;
  start_date: string;
  end_date?: string;
  basic_info?: string;
  target_audience?: string;
  key_topics?: string[];
  professors?: string[];
  tone?: 'professional' | 'casual' | 'academic' | 'exciting';
  include_markdown?: boolean;
}

export interface DescriptionResponse {
  description: string;
  markdown: boolean;
  suggestions: string[];
  word_count: number;
}

export interface ModerateCommentRequest {
  comment: string;
  comment_id?: string;
  event_id?: string;
  user_id?: string;
  context?: string;
}

export interface ModerationResult {
  is_appropriate: boolean;
  confidence: number;
  flags: string[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
  detected_issues?: Record<string, any>;
}

export interface RecommendationRequest {
  user_profile: {
    user_id: string;
    role: string;
    faculty?: string;
    interests?: string[];
  };
  registration_history?: {
    event_ids: string[];
    event_types: string[];
    rated_events?: Record<string, number>;
  };
  favorite_event_ids?: string[];
  available_events: any[];
  limit?: number;
  exclude_registered?: boolean;
}

export interface RecommendationResponse {
  recommendations: any[];
  reasoning: string;
  personalization_factors: string[];
}

export interface ChatRequest {
  event_context: {
    event_id: string;
    event_name: string;
    event_type: string;
    description: string;
    location: string;
    start_date: string;
    end_date?: string;
    capacity?: number;
    price?: number;
    registration_deadline?: string;
    requirements?: string;
    agenda?: string;
    professors?: string[];
    faculty?: string;
  };
  message: string;
  conversation_history?: { role: 'user' | 'assistant'; content: string }[];
  user_id?: string;
  user_role?: string;
}

export interface ChatResponse {
  response: string;
  confidence: number;
  sources: string[];
  suggested_questions: string[];
  action_buttons?: { label: string; action: string; target: string }[];
}

export interface EventInsightsRequest {
  event_id: string;
  event_data: any;
  registrations: any[];
  feedback: any[];
  include_recommendations?: boolean;
}

export interface EventInsightsResponse {
  summary: string;
  key_metrics: Record<string, any>;
  trends: string[];
  sentiment_analysis?: Record<string, any>;
  recommendations: string[];
  highlights: string[];
  concerns: string[];
}

// API Client Class
class AIServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = AI_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Service Error: ${error}`);
    }

    return response.json();
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  // Description Generation
  async generateDescription(data: GenerateDescriptionRequest): Promise<DescriptionResponse> {
    return this.request('/api/ai/description/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async improveDescription(
    currentDescription: string,
    eventType: string,
    tone: string = 'professional'
  ): Promise<DescriptionResponse> {
    return this.request('/api/ai/description/improve', {
      method: 'POST',
      body: JSON.stringify({
        current_description: currentDescription,
        event_type: eventType,
        improvement_focus: 'engagement',
        tone,
        include_markdown: true,
      }),
    });
  }

  async generateAgenda(
    workshopName: string,
    durationHours: number,
    topics: string[],
    skillLevel: string = 'intermediate'
  ): Promise<{ agenda: string; estimated_times: Record<string, string> }> {
    return this.request('/api/ai/description/agenda', {
      method: 'POST',
      body: JSON.stringify({
        workshop_name: workshopName,
        duration_hours: durationHours,
        topics,
        skill_level: skillLevel,
      }),
    });
  }

  // Comment Moderation
  async moderateComment(data: ModerateCommentRequest): Promise<{ comment_id?: string; result: ModerationResult }> {
    return this.request('/api/ai/moderate/comment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async moderateBatch(
    comments: { id: string; text: string }[],
    eventId?: string
  ): Promise<{ total: number; flagged: number; results: any[] }> {
    return this.request('/api/ai/moderate/batch', {
      method: 'POST',
      body: JSON.stringify({ comments, event_id: eventId }),
    });
  }

  // Recommendations
  async getRecommendations(data: RecommendationRequest): Promise<RecommendationResponse> {
    return this.request('/api/ai/recommendations/personalized', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSimilarEvents(
    eventId: string,
    eventData: any,
    availableEvents: any[],
    limit: number = 5
  ): Promise<{ similar_events: any[]; similarity_factors: string[] }> {
    return this.request('/api/ai/recommendations/similar', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        event_data: eventData,
        available_events: availableEvents,
        limit,
      }),
    });
  }

  // Analytics
  async getEventInsights(data: EventInsightsRequest): Promise<EventInsightsResponse> {
    return this.request('/api/ai/analytics/event-insights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDashboardInsights(
    events: any[],
    timePeriod: string = 'month'
  ): Promise<any> {
    return this.request('/api/ai/analytics/dashboard-insights', {
      method: 'POST',
      body: JSON.stringify({ events, time_period: timePeriod }),
    });
  }

  async analyzeFeedback(
    eventId: string,
    feedback: any[],
    depth: string = 'standard'
  ): Promise<any> {
    return this.request('/api/ai/analytics/feedback-analysis', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        feedback,
        analysis_depth: depth,
      }),
    });
  }

  // Chatbot
  async askQuestion(data: ChatRequest): Promise<ChatResponse> {
    return this.request('/api/ai/chatbot/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateFAQ(
    eventContext: ChatRequest['event_context'],
    numQuestions: number = 5
  ): Promise<{ faqs: { question: string; answer: string }[]; event_id: string }> {
    return this.request('/api/ai/chatbot/generate-faq', {
      method: 'POST',
      body: JSON.stringify({
        event_context: eventContext,
        num_questions: numQuestions,
      }),
    });
  }

  async summarizeEvent(
    eventContext: ChatRequest['event_context'],
    _length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<{ summary: string; event_id: string }> {
    return this.request('/api/ai/chatbot/summarize-event', {
      method: 'POST',
      body: JSON.stringify(eventContext),
    });
  }
}

// Export singleton instance
export const aiService = new AIServiceClient();

// Export class for custom instances
export { AIServiceClient };
