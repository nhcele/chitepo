import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@mindelta/shared';
import Layout from '@/components/Layout';
import ContentEditor from '@/components/instructor/ContentEditor';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  SparklesIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getCourse } from '@/lib/api/courses';
import { updateLesson } from '@/lib/api/instructor';

interface ContentBlock {
  id: string;
  type: 'text' | 'heading' | 'image' | 'video' | 'code' | 'embed' | 'pdf' | 'quiz';
  content: string;
  metadata?: {
    alt?: string;
    caption?: string;
    language?: string;
    url?: string;
    thumbnail?: string;
    duration?: number;
    questions?: any[];
  };
  order: number;
  lastModified?: Date;
  modifiedBy?: string;
  comments?: Comment[];
}

interface Comment {
  id: string;
  blockId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  resolved: boolean;
}

interface LessonData {
  id: string;
  title: string;
  type: 'video' | 'text' | 'html' | 'embed' | 'download' | 'quiz';
  content: string;
  durationSeconds?: number;
  isPreview: boolean;
  orderIndex: number;
  moduleId: string;
  contentBlocks?: ContentBlock[];
}

export default function LessonEditor() {
  const { courseId, lessonId } = useRouter().query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Mock collaborative users
  const mockCollaborativeUsers = [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      color: '#3B82F6',
      isOnline: true,
      cursor: { blockId: 'block-1', position: 25 }
    },
    {
      id: 'user-2', 
      name: 'Bob Smith',
      color: '#10B981',
      isOnline: true,
      cursor: { blockId: 'block-2', position: 10 }
    },
    {
      id: 'user-3',
      name: 'Carol White',
      color: '#F59E0B',
      isOnline: false
    }
  ];

  const handleComment = (comment: Omit<Comment, 'id' | 'timestamp'>) => {
    // In real app, this would send comment to backend
    console.log('New comment:', comment);
  };

  // Fetch lesson data from API
  useEffect(() => {
    const fetchLesson = async () => {
      if (!courseId || !lessonId) return;
      
      setLoading(true);
      try {
        // Fetch course which includes modules and lessons
        const course = await getCourse(courseId as string) as any;
        
        // Find the lesson in the course modules
        let foundLesson: any = null;
        if (course.modules) {
          for (const module of course.modules) {
            if (module.lessons) {
              const lesson = module.lessons.find((l: any) => l.id === lessonId);
              if (lesson) {
                foundLesson = lesson;
                foundLesson.moduleId = module.id;
                break;
              }
            }
          }
        }
        
        if (!foundLesson) {
          console.error('Lesson not found');
          setLoading(false);
          return;
        }
        
        // Parse content if it's JSON (contentBlocks), otherwise use as-is
        let contentBlocks: ContentBlock[] = [];
        if (foundLesson.content) {
          try {
            const parsed = JSON.parse(foundLesson.content);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
              contentBlocks = parsed;
            } else {
              // If it's not contentBlocks format, create a text block from the content
              contentBlocks = [{
                id: '1',
                type: 'text',
                content: foundLesson.content,
                order: 0
              }];
            }
          } catch (e) {
            // Not JSON, treat as plain text
            if (foundLesson.content.trim()) {
              contentBlocks = [{
                id: '1',
                type: 'text',
                content: foundLesson.content,
                order: 0
              }];
            }
          }
        }
        
        const lessonData: LessonData = {
          id: foundLesson.id,
          title: foundLesson.title,
          type: foundLesson.type || 'video',
          content: foundLesson.content || '',
          durationSeconds: foundLesson.durationSeconds || foundLesson.videoDuration || 0,
          isPreview: foundLesson.isPreview || false,
          orderIndex: foundLesson.orderIndex || 0,
          moduleId: foundLesson.moduleId,
          contentBlocks
        };
        
        setLessonData(lessonData);
        setContentBlocks(contentBlocks);
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLesson();
  }, [courseId, lessonId]);

  const handleSaveContent = async (blocks: ContentBlock[]) => {
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }
    
    setSaving(true);
    try {
      // Convert contentBlocks to JSON string for storage
      const contentJson = JSON.stringify(blocks);
      
      // Update lesson via API
      await updateLesson(lessonId as string, {
        content: contentJson,
        content_json: blocks // Also store as structured data if backend supports it
      });
      
      // Update local state
      setContentBlocks(blocks);
      
      if (lessonData) {
        const updatedLesson = {
          ...lessonData,
          contentBlocks: blocks,
          content: contentJson
        };
        setLessonData(updatedLesson);
      }
    } catch (error) {
      console.error('Failed to save lesson content:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (loading) {
    return (
      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Layout>
      </RoleGuard>
    );
  }

  return (
    <>
      <Head>
        <title>Lesson Editor - Mindelta</title>
        <meta name="description" content="Create and edit lesson content for your courses on Mindelta." />
      </Head>
      
      <RoleGuard allow={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <Layout>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {lessonData?.title || 'Lesson Editor'}
                      </h1>
                      <p className="text-gray-500">
                        Course ID: {courseId} • Lesson ID: {lessonId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePreview}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Preview
                  </button>
                </div>
              </div>

              {/* Lesson Stats */}
              {lessonData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
                >
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Content Blocks</div>
                    <div className="text-2xl font-bold text-gray-900">{contentBlocks.length}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Duration</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {lessonData.durationSeconds ? Math.ceil(lessonData.durationSeconds / 60) : 0}m
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Lesson Type</div>
                    <div className="text-2xl font-bold text-green-600 capitalize">
                      {lessonData.type}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {lessonData.isPreview ? 'Preview' : 'Premium'}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Content Editor */}
            {lessonData && (
              <ContentEditor
                lessonId={lessonId as string}
                initialBlocks={contentBlocks}
                onSave={handleSaveContent}
                onPreview={handlePreview}
                loading={saving}
                collaborators={mockCollaborativeUsers}
                onComment={handleComment}
              />
            )}

            {/* Preview Modal */}
            {showPreview && (
              <LessonPreviewModal
                lesson={lessonData}
                contentBlocks={contentBlocks}
                onClose={() => setShowPreview(false)}
              />
            )}
          </motion.div>
        </Layout>
      </RoleGuard>
    </>
  );
}

// Lesson Preview Modal Component
interface LessonPreviewModalProps {
  lesson: LessonData | null;
  contentBlocks: ContentBlock[];
  onClose: () => void;
}

function LessonPreviewModal({ lesson, contentBlocks, onClose }: LessonPreviewModalProps) {
  if (!lesson) return null;

  const renderContentBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'heading':
        return <h2 className="text-2xl font-bold text-gray-900 mb-4">{block.content}</h2>;
      
      case 'text':
        return <p className="text-gray-700 mb-4 leading-relaxed">{block.content}</p>;
      
      case 'code':
        return (
          <div className="mb-4">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">{block.content}</code>
            </pre>
          </div>
        );
      
      case 'image':
        return (
          <div className="mb-4">
            <Image 
              src={block.metadata?.url || ''} 
              alt={block.metadata?.alt || 'Content image'}
              width={800}
              height={600}
              className="max-w-full h-auto rounded-lg"
            />
            {block.metadata?.caption && (
              <p className="text-sm text-gray-500 mt-2 italic">{block.metadata.caption}</p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="mb-4">
            <h3 className="font-medium mb-2">{block.content}</h3>
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg flex items-center justify-center">
              <VideoCameraIcon className="h-12 w-12 text-gray-400" />
            </div>
          </div>
        );
      
      case 'embed':
        return (
          <div className="mb-4">
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );
      
      case 'pdf':
        return (
          <div className="mb-4">
            <div className="border border-gray-200 rounded-lg p-4 flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-medium">{block.content}</p>
                <p className="text-sm text-gray-500">PDF document</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lesson Preview</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Duration: {lesson.durationSeconds ? Math.ceil(lesson.durationSeconds / 60) : 0} minutes</span>
              <span>Type: {lesson.type}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                lesson.isPreview 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-primary-700 bg-primary-50'
              }`}>
                {lesson.isPreview ? 'Free Preview' : 'Premium Content'}
              </span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            {contentBlocks.map((block) => (
              <div key={block.id}>
                {renderContentBlock(block)}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close Preview
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
