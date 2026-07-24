import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  PlayIcon,
  ArrowPathIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { 
  aiChat, 
  getAiUsage, 
  getPersonalizedRecommendations, 
  getProgressInsights,
  adaptDifficulty,
  type LearningRecommendation,
  type ProgressInsight
} from '@/lib/api/ai';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestions?: string[];
    resources?: Array<{
      title: string;
      type: 'video' | 'article' | 'exercise';
      url?: string;
      duration?: string;
    }>;
    progress?: {
      current: number;
      total: number;
      topic: string;
    };
  };
}

interface LearningInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation';
  title: string;
  description: string;
  actionable?: boolean;
}

interface AILearningCompanionProps {
  courseId: string;
  lessonId?: string;
  userId: string;
  onProgressUpdate?: (insights: ProgressInsight[]) => void;
}

export default function AILearningCompanion({
  courseId,
  lessonId,
  userId,
  onProgressUpdate
}: AILearningCompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState<ProgressInsight[]>([]);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [usage, setUsage] = useState({ remaining: 30, limit: 30 });
  const [currentDifficulty, setCurrentDifficulty] = useState(15);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with welcome message and load data
  useEffect(() => {
    const initializeData = async () => {
      const welcomeMessage: Message = {
        id: '1',
        type: 'ai',
        content: `Hello! I'm your AI Learning Companion. I'm here to help you understand the material, answer questions, and provide personalized insights about your learning progress. How can I assist you today?`,
        timestamp: new Date(),
        metadata: {
          suggestions: [
            'Explain this concept in simpler terms',
            'Give me practice examples',
            'How am I progressing so far?',
            'What should I focus on next?'
          ]
        }
      };
      setMessages([welcomeMessage]);

      // Load initial data
      try {
        const [usageData, insightsData, recommendationsData] = await Promise.all([
          getAiUsage(),
          getProgressInsights(userId),
          getPersonalizedRecommendations(userId)
        ]);
        
        setUsage(usageData);
        setInsights(insightsData.slice(0, 3));
        setRecommendations(recommendationsData.slice(0, 3));
        
        if (onProgressUpdate) {
          onProgressUpdate(insightsData);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Set fallback data
        setInsights([{
          area: 'General Progress',
          score: 75,
          trend: 'improving',
          recommendation: 'Keep up the great work!',
          nextSteps: ['Continue with current lessons', 'Try practice exercises']
        }]);
      }
    };

    initializeData();
  }, [userId, onProgressUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<Message> => {
    try {
      // Use real AI chat API
      const response = await aiChat({
        lessonId: lessonId || '',
        mode: 'answer',
        level: currentDifficulty as 5 | 15 | 25,
        message: userMessage
      });

      // Update usage after successful call
      const newUsage = await getAiUsage();
      setUsage(newUsage);

      return {
        id: Date.now().toString(),
        type: 'ai',
        content: response.text,
        timestamp: new Date(),
        metadata: {
          suggestions: [
            'Tell me more about this',
            'Give me a practical example',
            'How does this relate to my goals?',
            'What should I practice next?'
          ]
        }
      };
    } catch (error) {
      console.error('AI chat error:', error);
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(inputValue);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to generate AI response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleResourceClick = (resource: any) => {
    // Handle resource click - would navigate to the resource
    console.log('Opening resource:', resource);
  };

  const handleInsightAction = (insight: ProgressInsight) => {
    // Generate a follow-up message based on the insight
    const followUpMessage = `Can you help me improve my ${insight.area}? Current score: ${insight.score}%`;
    setInputValue(followUpMessage);
    inputRef.current?.focus();
  };

  const handleRecommendationClick = (recommendation: LearningRecommendation) => {
    const followUpMessage = `Tell me more about: ${recommendation.title}`;
    setInputValue(followUpMessage);
    inputRef.current?.focus();
  };

  const adjustDifficultyLevel = async (performance: number) => {
    if (!lessonId) return;
    
    try {
      const adjustment = await adaptDifficulty({
        userId,
        lessonId,
        performance
      });
      
      setCurrentDifficulty(adjustment.adjustedLevel);
      
      const systemMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `🎯 Difficulty adjusted: ${adjustment.reasoning}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Difficulty adjustment error:', error);
    }
  };

  const speakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.volume = volume;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-primary-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <SparklesIcon className="h-6 w-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-0 right-0 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-primary-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Learning Companion</h3>
                    <p className="text-xs text-white/80">Personalized learning assistance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => speakMessage(messages[messages.length - 1]?.content || '')}
                    disabled={isSpeaking}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSpeaking ? (
                      <SpeakerWaveIcon className="h-4 w-4 animate-pulse" />
                    ) : (
                      <SpeakerWaveIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Insights Panel */}
            {(insights.length > 0 || recommendations.length > 0) && (
              <div className="bg-gray-50 p-3 border-b border-gray-200 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Your Learning Insights</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{usage.remaining}/{usage.limit} uses left</span>
                    <button
                      onClick={() => {
                        setInsights([]);
                        setRecommendations([]);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                
                {/* Progress Insights */}
                {insights.slice(0, 2).map(insight => (
                  <div key={insight.area} className="flex items-start space-x-2 p-2 bg-white rounded-lg mb-2">
                    <div className={`p-1 rounded ${
                      insight.trend === 'improving' ? 'bg-green-100' :
                      insight.trend === 'declining' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      {insight.trend === 'improving' ? (
                        <ChartBarIcon className="h-3 w-3 text-green-600" />
                      ) : insight.trend === 'declining' ? (
                        <ArrowPathIcon className="h-3 w-3 text-red-600" />
                      ) : (
                        <MinusIcon className="h-3 w-3 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{insight.area}</p>
                      <p className="text-xs text-gray-500">{insight.score}% • {insight.recommendation}</p>
                    </div>
                    <button
                      onClick={() => handleInsightAction(insight)}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      Help
                    </button>
                  </div>
                ))}

                {/* Recommendations */}
                {recommendations.slice(0, 1).map(rec => (
                  <div key={rec.title} className="flex items-start space-x-2 p-2 bg-primary-50 rounded-lg">
                    <div className="p-1 bg-primary-100 rounded">
                      <AcademicCapIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{rec.title}</p>
                      <p className="text-xs text-gray-500 truncate">{rec.estimatedTime} • {rec.difficulty}</p>
                    </div>
                    <button
                      onClick={() => handleRecommendationClick(rec)}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  } rounded-2xl p-3`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    
                    {/* Suggestions */}
                    {message.metadata?.suggestions && (
                      <div className="mt-2 space-y-1">
                        {message.metadata.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs p-2 bg-white/20 hover:bg-white/30 rounded transition-colors"
                          >
                            💡 {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    {message.metadata?.resources && (
                      <div className="mt-2 space-y-1">
                        {message.metadata.resources.map((resource, index) => (
                          <button
                            key={index}
                            onClick={() => handleResourceClick(resource)}
                            className="flex items-center space-x-2 w-full text-left text-xs p-2 bg-white/20 hover:bg-white/30 rounded transition-colors"
                          >
                            {resource.type === 'video' && <PlayIcon className="h-3 w-3" />}
                            {resource.type === 'article' && <BookOpenIcon className="h-3 w-3" />}
                            {resource.type === 'exercise' && <AcademicCapIcon className="h-3 w-3" />}
                            <span>{resource.title}</span>
                            {resource.duration && <span className="text-xs opacity-75">• {resource.duration}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Progress */}
                    {message.metadata?.progress && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{message.metadata.progress.topic}</span>
                          <span>{message.metadata.progress.current}%</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-500"
                            style={{ width: `${message.metadata.progress.current}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 text-gray-900 rounded-2xl p-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              {/* Difficulty Control */}
              <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-700">Difficulty:</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentDifficulty(5)}
                      className={`px-2 py-1 text-xs rounded ${
                        currentDifficulty === 5 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Beginner
                    </button>
                    <button
                      onClick={() => setCurrentDifficulty(15)}
                      className={`px-2 py-1 text-xs rounded ${
                        currentDifficulty === 15 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Intermediate
                    </button>
                    <button
                      onClick={() => setCurrentDifficulty(25)}
                      className={`px-2 py-1 text-xs rounded ${
                        currentDifficulty === 25 
                          ? 'bg-red-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => adjustDifficultyLevel(75)}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Auto-adjust
                </button>
              </div>

              <div className="flex items-end space-x-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything about your course..."
                  rows={1}
                  disabled={usage.remaining <= 0}
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping || usage.remaining <= 0}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
              
              {usage.remaining <= 0 && (
                <p className="mt-2 text-xs text-red-600">Daily limit reached. Try again tomorrow!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
