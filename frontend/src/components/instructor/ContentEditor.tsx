import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  LinkIcon,
  CodeBracketIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  EyeIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  DocumentIcon,
  UsersIcon,
  CircleStackIcon,
  BellIcon
} from '@heroicons/react/24/outline';

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

interface ContentVersion {
  id: string;
  version: number;
  blocks: ContentBlock[];
  timestamp: Date;
  author: string;
  changes: string;
  isAutoSave: boolean;
}

interface CollaborativeUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    blockId: string;
    position: number;
  };
  isOnline: boolean;
}

interface ContentEditorProps {
  lessonId: string;
  initialBlocks?: ContentBlock[];
  onSave: (blocks: ContentBlock[]) => Promise<void>;
  onPreview: () => void;
  loading?: boolean;
  collaborators?: CollaborativeUser[];
  onComment?: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
}

export default function ContentEditor({
  lessonId,
  initialBlocks = [],
  onSave,
  onPreview,
  loading = false,
  collaborators = [],
  onComment
}: ContentEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Versioning state
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Collaboration state
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>(collaborators);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedCommentBlock, setSelectedCommentBlock] = useState<string | null>(null);
  const [showPresence, setShowPresence] = useState(true);

  const createVersion = useCallback((changes: string, isAutoSave: boolean = false) => {
    const newVersion: ContentVersion = {
      id: Date.now().toString(),
      version: currentVersion,
      blocks: JSON.parse(JSON.stringify(blocks)),
      timestamp: new Date(),
      author: 'Current User',
      changes,
      isAutoSave
    };
    
    setVersions(prev => [newVersion, ...prev].slice(0, 50)); // Keep last 50 versions
    setCurrentVersion(prev => prev + 1);
  }, [blocks, currentVersion]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const autoSaveTimer = setInterval(() => {
      if (hasUnsavedChanges && blocks.length > 0) {
        createVersion('Auto-save', true);
        setHasUnsavedChanges(false);
        setLastAutoSave(new Date());
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [blocks, hasUnsavedChanges, autoSaveEnabled, createVersion]);

  // Simulate real-time collaboration
  useEffect(() => {
    const collaborationTimer = setInterval(() => {
      // Simulate user presence updates
      setActiveUsers(prev => prev.map(user => ({
        ...user,
        isOnline: Math.random() > 0.1,
        cursor: Math.random() > 0.7 ? {
          blockId: blocks[Math.floor(Math.random() * blocks.length)]?.id || '',
          position: Math.floor(Math.random() * 100)
        } : undefined
      })));
    }, 5000);

    return () => clearInterval(collaborationTimer);
  }, [blocks]);

  const restoreVersion = useCallback((version: ContentVersion) => {
    setBlocks(version.blocks);
    setCurrentVersion(version.version + 1);
    setHasUnsavedChanges(true);
    setShowVersionHistory(false);
  }, []);

  const addComment = useCallback((blockId: string, content: string) => {
    if (!content.trim() || !onComment) return;

    const comment: Comment = {
      id: Date.now().toString(),
      blockId,
      userId: 'current-user',
      userName: 'Current User',
      content,
      timestamp: new Date(),
      resolved: false
    };

    setComments(prev => [...prev, comment]);
    onComment(comment);
    setNewComment('');
  }, [onComment]);

  const resolveComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ));
  }, []);

  const addBlock = useCallback((type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'New Heading' : '',
      order: blocks.length,
      metadata: type === 'code' ? { language: 'javascript' } : undefined,
      lastModified: new Date(),
      modifiedBy: 'Current User'
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
    setHasUnsavedChanges(true);
  }, [blocks.length]);

  const updateBlock = useCallback((blockId: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { 
        ...block, 
        ...updates,
        lastModified: new Date(),
        modifiedBy: 'Current User'
      } : block
    ));
    setHasUnsavedChanges(true);
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    setSelectedBlock(null);
    setHasUnsavedChanges(true);
  }, []);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const newBlocks = [...blocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
  }, [blocks]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type === 'application/pdf') {
      setAiProcessing(true);
      try {
        // Simulate PDF processing with AI
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const processedBlocks: ContentBlock[] = [
          {
            id: Date.now().toString(),
            type: 'heading',
            content: file.name.replace('.pdf', ''),
            order: blocks.length
          },
          {
            id: (Date.now() + 1).toString(),
            type: 'pdf',
            content: file.name,
            metadata: {
              url: URL.createObjectURL(file),
              thumbnail: '/pdf-thumbnail.png'
            },
            order: blocks.length + 1
          },
          {
            id: (Date.now() + 2).toString(),
            type: 'text',
            content: 'Content extracted from PDF. This would normally contain the processed text from your document.',
            order: blocks.length + 2
          }
        ];
        
        setBlocks(prev => [...prev, ...processedBlocks]);
        setShowPdfUpload(false);
      } catch (error) {
        console.error('Failed to process PDF:', error);
      } finally {
        setAiProcessing(false);
      }
    }
  }, [blocks.length]);

  const handleAiGenerate = useCallback(async () => {
    setAiProcessing(true);
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const aiGeneratedBlock: ContentBlock = {
        id: Date.now().toString(),
        type: 'text',
        content: `# AI-Generated Content\n\nThis is an example of content generated by AI based on your lesson topic. The AI can create comprehensive explanations, examples, and exercises tailored to your learning objectives.\n\n## Key Concepts\n\n1. **Fundamental Principle**: Explain the core concept\n2. **Practical Application**: Show how it's used in real scenarios\n3. **Common Pitfalls**: Highlight mistakes to avoid\n\n## Example\n\n\`\`\`javascript\n// Example code\nfunction example() {\n  return "Hello, World!";\n}\n\`\`\`\n\nThis content was generated using advanced AI technology to provide high-quality educational material.`,
        order: blocks.length
      };
      
      setBlocks(prev => [...prev, aiGeneratedBlock]);
    } catch (error) {
      console.error('Failed to generate AI content:', error);
    } finally {
      setAiProcessing(false);
    }
  }, [blocks.length]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(blocks);
      createVersion('Manual save');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save content:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [blocks, onSave, createVersion]);

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-pewter"
            placeholder="Enter heading..."
          />
        );
      
      case 'text':
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            rows={4}
            className="w-full bg-transparent border-none outline-none resize-none placeholder-pewter"
            placeholder="Enter your content here..."
          />
        );
      
      case 'code':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <select
                value={block.metadata?.language || 'javascript'}
                onChange={(e) => updateBlock(block.id, { 
                  metadata: { ...block.metadata, language: e.target.value }
                })}
                className="text-sm border border-border/60 rounded px-2 py-1"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              rows={6}
              className="w-full font-mono text-sm bg-paper border border-border/60 rounded p-3"
              placeholder="// Enter your code here..."
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="Enter image URL..."
              className="w-full px-3 py-2 border border-border/60 rounded"
            />
            <input
              type="text"
              value={block.metadata?.alt || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, alt: e.target.value }
              })}
              placeholder="Alt text..."
              className="w-full px-3 py-2 border border-border/60 rounded"
            />
            {block.metadata?.url && (
              <Image 
                src={block.metadata.url} 
                alt={block.metadata?.alt || 'Content image'}
                width={800}
                height={600}
                className="max-w-full h-auto rounded"
              />
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="Enter video URL..."
              className="w-full px-3 py-2 border border-border/60 rounded"
            />
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Video title..."
              className="w-full px-3 py-2 border border-border/60 rounded"
            />
          </div>
        );
      
      case 'embed':
        return (
          <div>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              rows={3}
              className="w-full font-mono text-sm bg-paper border border-border/60 rounded p-3"
              placeholder="Enter embed code..."
            />
          </div>
        );
      
      case 'pdf':
        return (
          <div className="border border-border/60 rounded-md p-4">
            <div className="flex items-center space-x-3">
              <DocumentArrowUpIcon className="h-8 w-8 text-terracotta-500" />
              <div>
                <p className="font-medium">{block.content}</p>
                <p className="text-sm text-stone">PDF document</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getBlockIcon = (type: ContentBlock['type']) => {
    switch (type) {
      case 'heading': return PencilIcon;
      case 'text': return DocumentTextIcon;
      case 'code': return CodeBracketIcon;
      case 'image': return PhotoIcon;
      case 'video': return VideoCameraIcon;
      case 'embed': return LinkIcon;
      case 'pdf': return DocumentArrowUpIcon;
      default: return DocumentTextIcon;
    }
  };

  const getBlockTitle = (type: ContentBlock['type']) => {
    switch (type) {
      case 'heading': return 'Heading';
      case 'text': return 'Text';
      case 'code': return 'Code Block';
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'embed': return 'Embed';
      case 'pdf': return 'PDF Document';
      default: return 'Content';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md shadow-sm border border-border/60 p-6 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-charcoal">Content Editor</h2>
              {hasUnsavedChanges && (
                <span className="px-2 py-1 text-xs font-medium text-ochre-700 bg-ochre-100 rounded-full">
                  Unsaved changes
                </span>
              )}
              {lastAutoSave && (
                <span className="text-xs text-stone">
                  Auto-saved {lastAutoSave.toLocaleTimeString()}
                </span>
              )}
            </div>
            <p className="text-stone">Create rich, engaging content for your lesson</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Version History */}
            <button
              onClick={() => setShowVersionHistory(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <CircleStackIcon className="h-4 w-4 mr-1" />
              v{currentVersion}
            </button>
            
            {/* Collaborative Users */}
            {activeUsers.length > 0 && (
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {activeUsers.slice(0, 3).map(user => (
                    <div
                      key={user.id}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: user.color }}
                      title={user.name}
                    >
                      {user.name.charAt(0)}
                    </div>
                  ))}
                  {activeUsers.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-forest-100 flex items-center justify-center text-xs font-medium text-stone">
                      +{activeUsers.length - 3}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPresence(!showPresence)}
                  className="ml-2 p-1 text-pewter hover:text-stone"
                >
                  <UsersIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* Comments */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              Comments
              {comments.filter(c => !c.resolved).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-terracotta-500 text-white text-xs rounded-full flex items-center justify-center">
                  {comments.filter(c => !c.resolved).length}
                </span>
              )}
            </button>
            
            <button
              onClick={handleAiGenerate}
              disabled={aiProcessing}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-terracotta-700 bg-terracotta-50 rounded-md hover:bg-terracotta-100 transition-colors disabled:opacity-50"
            >
              {aiProcessing ? (
                <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4 mr-2" />
              )}
              {aiProcessing ? 'Processing...' : 'AI Generate'}
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
            >
              <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
              Upload PDF
            </button>
            
            <button
              onClick={onPreview}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content Blocks */}
      <div className="space-y-4">
        <AnimatePresence>
          {blocks.map((block, index) => {
            const Icon = getBlockIcon(block.type);
            const isSelected = selectedBlock === block.id;
            
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-md shadow-sm border ${
                  isSelected ? 'border-primary-300 ring-2 ring-forest-100' : 'border-border/60'
                } overflow-hidden`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/60">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-paper rounded-md">
                      <Icon className="h-4 w-4 text-stone" />
                    </div>
                    <span className="text-sm font-medium text-charcoal">
                      {getBlockTitle(block.type)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-pewter hover:text-stone disabled:opacity-50"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1 text-pewter hover:text-stone disabled:opacity-50"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedBlock(isSelected ? null : block.id)}
                      className="p-1 text-pewter hover:text-primary-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 text-pewter hover:text-terracotta-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Block Content */}
                <div className="p-4">
                  {renderBlock(block)}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Content Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: blocks.length * 0.1 }}
        className="mt-6"
      >
        <div className="bg-white rounded-md shadow-sm border border-border/60 p-6">
          <h3 className="text-sm font-medium text-charcoal mb-4">Add Content</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => addBlock('heading')}
              className="flex flex-col items-center p-3 border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <PencilIcon className="h-6 w-6 text-stone mb-1" />
              <span className="text-xs text-stone">Heading</span>
            </button>
            
            <button
              onClick={() => addBlock('text')}
              className="flex flex-col items-center p-3 border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <DocumentTextIcon className="h-6 w-6 text-stone mb-1" />
              <span className="text-xs text-stone">Text</span>
            </button>
            
            <button
              onClick={() => addBlock('code')}
              className="flex flex-col items-center p-3 border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <CodeBracketIcon className="h-6 w-6 text-stone mb-1" />
              <span className="text-xs text-stone">Code</span>
            </button>
            
            <button
              onClick={() => addBlock('image')}
              className="flex flex-col items-center p-3 border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <PhotoIcon className="h-6 w-6 text-stone mb-1" />
              <span className="text-xs text-stone">Image</span>
            </button>
            
            <button
              onClick={() => addBlock('video')}
              className="flex flex-col items-center p-3 border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <VideoCameraIcon className="h-6 w-6 text-stone mb-1" />
              <span className="text-xs text-stone">Video</span>
            </button>
            
            <button
              onClick={() => addBlock('embed')}
              className="flex flex-col items-center p-3 border border-border/60 rounded-md hover:bg-paper transition-colors"
            >
              <LinkIcon className="h-6 w-6 text-stone mb-1" />
              <span className="text-xs text-stone">Embed</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
      />

      {/* Version History Modal */}
      {showVersionHistory && (
        <VersionHistoryModal
          versions={versions}
          onRestore={restoreVersion}
          onClose={() => setShowVersionHistory(false)}
        />
      )}

      {/* Comments Sidebar */}
      {showComments && (
        <CommentsSidebar
          comments={comments}
          blocks={blocks}
          onAddComment={addComment}
          onResolveComment={resolveComment}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* User Presence Panel */}
      {showPresence && activeUsers.length > 0 && (
        <UserPresencePanel
          users={activeUsers}
          onClose={() => setShowPresence(false)}
        />
      )}
    </div>
  );
}

// Version History Modal Component
interface VersionHistoryModalProps {
  versions: ContentVersion[];
  onRestore: (version: ContentVersion) => void;
  onClose: () => void;
}

function VersionHistoryModal({ versions, onRestore, onClose }: VersionHistoryModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-md shadow-sm max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-border/60 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-charcoal">Version History</h3>
            <button
              onClick={onClose}
              className="text-pewter hover:text-stone"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-stone">
              <DocumentIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No versions saved yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 border border-border/60 rounded-md hover:bg-paper"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-charcoal">v{version.version}</span>
                      {version.isAutoSave && (
                        <span className="px-2 py-1 text-xs font-medium text-stone bg-forest-100 rounded">
                          Auto-save
                        </span>
                      )}
                      <span className="text-sm text-stone">
                        {version.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-stone mt-1">{version.changes}</p>
                    <p className="text-xs text-stone mt-1">by {version.author}</p>
                  </div>
                  <button
                    onClick={() => onRestore(version)}
                    className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
                  >
                    <ArrowUturnLeftIcon className="h-3 w-3 inline mr-1" />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Comments Sidebar Component
interface CommentsSidebarProps {
  comments: Comment[];
  blocks: ContentBlock[];
  onAddComment: (blockId: string, content: string) => void;
  onResolveComment: (commentId: string) => void;
  onClose: () => void;
}

function CommentsSidebar({ comments, blocks, onAddComment, onResolveComment, onClose }: CommentsSidebarProps) {
  const [newComment, setNewComment] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');

  const handleAddComment = () => {
    if (selectedBlock && newComment.trim()) {
      onAddComment(selectedBlock, newComment);
      setNewComment('');
    }
  };

  const blockComments = comments.filter(c => !c.resolved);

  return (
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: 0 }}
      exit={{ x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-sm border-l border-border/60 z-50"
    >
      <div className="p-6 border-b border-border/60">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charcoal">Comments</h3>
          <button
            onClick={onClose}
            className="text-pewter hover:text-stone"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Add Comment */}
        <div className="mb-6">
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-border/60 rounded-md text-sm"
          >
            <option value="">Select a block to comment on...</option>
            {blocks.map(block => (
              <option key={block.id} value={block.id}>
                {block.type}: {block.content.substring(0, 50)}...
              </option>
            ))}
          </select>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-3 py-2 border border-border/60 rounded-md text-sm resize-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!selectedBlock || !newComment.trim()}
            className="mt-2 w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors disabled:opacity-50"
          >
            Add Comment
          </button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {blockComments.length === 0 ? (
            <div className="text-center py-8 text-stone">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
            </div>
          ) : (
            blockComments.map(comment => {
              const block = blocks.find(b => b.id === comment.blockId);
              return (
                <div key={comment.id} className="border border-border/60 rounded-md p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                          {comment.userName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-charcoal">{comment.userName}</span>
                        <span className="text-xs text-stone">
                          {comment.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal mb-2">{comment.content}</p>
                      <p className="text-xs text-stone">
                        On: {block?.type} block - {block?.content.substring(0, 30)}...
                      </p>
                    </div>
                    <button
                      onClick={() => onResolveComment(comment.id)}
                      className="ml-2 text-xs text-forest-600 hover:text-forest-800"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

// User Presence Panel Component
interface UserPresencePanelProps {
  users: CollaborativeUser[];
  onClose: () => void;
}

function UserPresencePanel({ users, onClose }: UserPresencePanelProps) {
  const onlineUsers = users.filter(u => u.isOnline);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-4 w-80 bg-white rounded-md shadow-sm border border-border/60 z-40"
    >
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-charcoal">Active Users ({onlineUsers.length})</h3>
          <button
            onClick={onClose}
            className="text-pewter hover:text-stone"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-stone text-center">No active users</p>
        ) : (
          <div className="space-y-3">
            {onlineUsers.map(user => (
              <div key={user.id} className="flex items-center space-x-3">
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-forest-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{user.name}</p>
                  {user.cursor && (
                    <p className="text-xs text-stone">Editing...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
