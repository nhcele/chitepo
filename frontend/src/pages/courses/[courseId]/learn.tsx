import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AILearningCompanion from '../../../components/learner/AILearningCompanion';
import LearningDashboard from '../../../components/learner/LearningDashboard';
import { getPersonalizedRecommendations, getProgressInsights, type ProgressInsight } from '../../../lib/api/ai';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function LearnPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mockStats = {
    totalCoursesEnrolled: 5,
    coursesCompleted: 2,
    totalLearningTime: 1200, // 20 hours
    currentStreak: 7,
    longestStreak: 14,
    certificatesEarned: 2,
    averageCompletionRate: 78
  };

  const mockRecentCourses = [
    {
      id: (courseId as string) || 'course-1',
      title: 'Advanced JavaScript Concepts',
      instructor: 'Dr. Sarah Smith',
      progress: 65,
      lastAccessed: '2024-01-15',
      coverImage: '/images/js-course.jpg',
      nextLesson: 'Async Programming Patterns'
    }
  ];

  const mockAchievements = [
    {
      id: '1',
      title: 'Fast Learner',
      description: 'Complete 5 lessons in one day',
      icon: <span>🚀</span>,
      earned: true,
      earnedDate: '2024-01-10'
    },
    {
      id: '2',
      title: 'Consistency King',
      description: 'Maintain a 7-day streak',
      icon: <span>👑</span>,
      earned: true,
      earnedDate: '2024-01-15'
    }
  ];

  useEffect(() => {
    // Simulate loading user data
    const mockUser: User = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Learning: Advanced JavaScript
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome back, {user?.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Advanced JavaScript Concepts
              </h2>
              <p className="text-gray-600 mb-4">
                Master advanced JavaScript patterns and best practices for modern web development.
              </p>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Course Progress</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>

              {/* Current Lesson */}
              <div className="bg-primary-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary-900 mb-2">
                  Current Lesson: Async Programming Patterns
                </h3>
                <p className="text-primary-700 text-sm mb-3">
                  Learn about promises, async/await, and handling asynchronous operations in JavaScript.
                </p>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Continue Learning
                </button>
              </div>
            </div>

            {/* Learning Dashboard with AI Features */}
            <LearningDashboard
              userId={user?.id || ''}
              stats={mockStats}
              recentCourses={mockRecentCourses}
              achievements={mockAchievements}
              recommendations={[]}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Learning Companion */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Learning Assistant
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get personalized help with your course content, ask questions, and receive AI-powered insights.
              </p>
              
              {/* AI Companion Features */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Smart Explanations</p>
                    <p className="text-xs text-gray-600">Get concepts explained your way</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Adaptive Difficulty</p>
                    <p className="text-xs text-gray-600">Content adjusts to your level</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Progress Insights</p>
                    <p className="text-xs text-gray-600">AI analyzes your learning patterns</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Powered by OpenAI GPT-4o
                </p>
                <p className="text-xs text-gray-400">
                  30 daily uses • Resets at midnight
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  📚 View Course Materials
                </button>
                <button className="w-full px-4 py-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  📝 Take Practice Quiz
                </button>
                <button className="w-full px-4 py-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  💬 Join Discussion Forum
                </button>
                <button className="w-full px-4 py-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  📄 Download Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Learning Companion - Fixed Position */}
      <AILearningCompanion
        courseId={courseId as string}
        lessonId="lesson-123"
        userId={user?.id || ''}
        onProgressUpdate={(insights: ProgressInsight[]) => {
          console.log('Progress insights updated:', insights);
        }}
      />
    </div>
  );
}
