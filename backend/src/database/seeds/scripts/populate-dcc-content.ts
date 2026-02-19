import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Course } from '../../../courses/entities/course.entity';
import { Lesson } from '../../../courses/entities/lesson.entity';

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
}

/**
 * Converts markdown text to contentBlocks format
 */
function markdownToContentBlocks(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = markdown.split('\n');
  let currentBlock: { type: string; content: string[] } | null = null;
  let order = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines at the start
    if (!trimmed && !currentBlock) continue;

    // Check for headings
    if (trimmed.startsWith('#### ')) {
      // Save previous block
      if (currentBlock) {
        blocks.push({
          id: `block-${order}`,
          type: currentBlock.type as any,
          content: currentBlock.content.join('\n').trim(),
          order: order++,
        });
      }
      // Start new heading block
      currentBlock = {
        type: 'heading',
        content: [trimmed.replace(/^####\s+/, '')],
      };
    } else if (trimmed.startsWith('### ')) {
      // Save previous block
      if (currentBlock) {
        blocks.push({
          id: `block-${order}`,
          type: currentBlock.type as any,
          content: currentBlock.content.join('\n').trim(),
          order: order++,
        });
      }
      // Start new heading block (larger heading)
      currentBlock = {
        type: 'heading',
        content: [trimmed.replace(/^###\s+/, '')],
      };
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      // Bold text - treat as heading
      if (currentBlock) {
        blocks.push({
          id: `block-${order}`,
          type: currentBlock.type as any,
          content: currentBlock.content.join('\n').trim(),
          order: order++,
        });
      }
      currentBlock = {
        type: 'heading',
        content: [trimmed.replace(/\*\*/g, '')],
      };
    } else if (trimmed.startsWith('```')) {
      // Code block
      if (currentBlock && currentBlock.type !== 'code') {
        blocks.push({
          id: `block-${order}`,
          type: currentBlock.type as any,
          content: currentBlock.content.join('\n').trim(),
          order: order++,
        });
      }
      const language = trimmed.replace(/```/, '').trim();
      const codeLines: string[] = [];
      i++; // Skip the opening ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        id: `block-${order}`,
        type: 'code',
        content: codeLines.join('\n').trim(),
        metadata: { language: language || 'text' },
        order: order++,
      });
      currentBlock = null;
    } else if (trimmed) {
      // Regular text content
      if (!currentBlock) {
        currentBlock = { type: 'text', content: [] };
      }
      if (currentBlock.type === 'text') {
        currentBlock.content.push(line);
      } else {
        // Save previous block and start new text block
        blocks.push({
          id: `block-${order}`,
          type: currentBlock.type as any,
          content: currentBlock.content.join('\n').trim(),
          order: order++,
        });
        currentBlock = { type: 'text', content: [line] };
      }
    } else if (currentBlock && currentBlock.type === 'text') {
      // Empty line in text block - preserve it
      currentBlock.content.push('');
    }
  }

  // Save last block
  if (currentBlock) {
    blocks.push({
      id: `block-${order}`,
      type: currentBlock.type as any,
      content: currentBlock.content.join('\n').trim(),
      order: order++,
    });
  }

  return blocks.filter(block => block.content.trim().length > 0);
}

/**
 * Extracts lesson content from markdown text
 * Returns content from "#### Lesson Content" section until next lesson or module
 */
function extractLessonContent(markdown: string, lessonStartIndex: number): string {
  const lines = markdown.split('\n');
  let contentStart = -1;
  let contentEnd = lines.length;

  // Find "#### Lesson Content" section
  for (let i = lessonStartIndex; i < lines.length; i++) {
    if (lines[i].includes('#### Lesson Content')) {
      contentStart = i + 1;
      break;
    }
  }

  if (contentStart === -1) {
    // If no "Lesson Content" section, start after learning objectives or lesson title
    // Skip past duration, learning objectives, etc.
    for (let i = lessonStartIndex + 1; i < Math.min(lessonStartIndex + 20, lines.length); i++) {
      const line = lines[i].trim();
      // Start content after learning objectives section
      if (line.startsWith('#### Learning Objectives')) {
        // Find end of learning objectives (next #### or ###)
        for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
          if (lines[j].trim().startsWith('####') || lines[j].trim().startsWith('###')) {
            contentStart = j;
            break;
          }
        }
        break;
      }
    }
    
    if (contentStart === -1) {
      // Fallback: start a few lines after lesson title
      contentStart = lessonStartIndex + 5;
    }
  }

  // Find the end - next lesson (### Lesson) or next module (## MODULE)
  for (let i = contentStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('### Lesson') || line.startsWith('## MODULE')) {
      contentEnd = i;
      break;
    }
    // Stop at major separator if followed by next lesson/module
    if (line === '---' && i > contentStart + 10) {
      // Check if this is the end of the lesson
      let foundNextLesson = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('### Lesson') || nextLine.startsWith('## MODULE')) {
          foundNextLesson = true;
          break;
        }
      }
      if (foundNextLesson) {
        contentEnd = i;
        break;
      }
    }
    // Stop at sections that indicate end of lesson content
    if (line.startsWith('#### Reading Materials') || 
        line.startsWith('#### Discussion') ||
        line.startsWith('#### Self-Assessment') ||
        line.startsWith('#### Assessment')) {
      // Include these sections in content, but stop before next lesson
      continue;
    }
  }

  const content = lines.slice(contentStart, contentEnd).join('\n').trim();
  
  // Remove trailing separators and empty lines
  return content.replace(/\n---+\s*$/, '').trim();
}

/**
 * Parses markdown file and extracts lessons with their content
 */
function parseMarkdownFile(markdownPath: string): Map<string, string> {
  const markdown = readFileSync(markdownPath, 'utf-8');
  const lessonMap = new Map<string, string>();
  const lines = markdown.split('\n');

  let currentModule = '';
  let currentLesson: { title: string; startIndex: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect modules
    if (line.startsWith('## MODULE')) {
      currentModule = line.replace(/^## MODULE\s+\d+:\s*/, '');
      continue;
    }

    // Detect lessons
    if (line.startsWith('### Lesson')) {
      // Save previous lesson if exists
      if (currentLesson) {
        const content = extractLessonContent(markdown, currentLesson.startIndex);
        if (content) {
          lessonMap.set(currentLesson.title, content);
        }
      }

      // Extract lesson title (remove "Lesson X.Y:" prefix)
      const lessonTitle = line.replace(/^### Lesson\s+\d+\.\d+:\s*/, '');
      currentLesson = {
        title: lessonTitle,
        startIndex: i,
      };
    }
  }

  // Save last lesson
  if (currentLesson) {
    const content = extractLessonContent(markdown, currentLesson.startIndex);
    if (content) {
      lessonMap.set(currentLesson.title, content);
    }
  }

  return lessonMap;
}

/**
 * Manual mapping of markdown lesson titles to database lesson titles
 * This maps the actual markdown structure to the database structure
 */
const LESSON_TITLE_MAPPING: Record<string, string[]> = {
  // Module 1: Political Mobilization and Organization
  'History and Evolution of DCCs in Zimbabwe': [
    'Grassroots Organizing Fundamentals',
    'History and Evolution',
  ],
  'DCC Structure and Composition': [
    'Ward-Based Mobilization Strategies',
    'DCC Structure',
  ],
  'Ward-Based Coordination and Cell Structures': [
    'Cell Structure Development',
    'Ward-Based Coordination',
  ],
  // Module 2: Party-Government Coordination
  'Understanding Party-Government Relations': [
    'Understanding District Administrative Structures',
    'Party-Government Relations',
  ],
  'Community Development Project Coordination': [
    'Coordinating with Rural District Councils',
    'Community Development',
  ],
};

/**
 * Maps markdown lesson titles to database lesson titles
 */
function mapLessonTitle(markdownTitle: string, dbTitle: string): boolean {
  // Try exact match first
  if (markdownTitle.toLowerCase() === dbTitle.toLowerCase()) {
    return true;
  }

  // Check manual mapping
  for (const [markdownKey, dbTitles] of Object.entries(LESSON_TITLE_MAPPING)) {
    if (markdownTitle.includes(markdownKey) || markdownKey.includes(markdownTitle)) {
      if (dbTitles.some(t => dbTitle.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(dbTitle.toLowerCase()))) {
        return true;
      }
    }
  }

  // Try partial match (markdown might have more detail)
  const markdownWords = markdownTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const dbWords = dbTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Check if significant words match
  const matchingWords = markdownWords.filter(mw => 
    dbWords.some(dw => mw.includes(dw) || dw.includes(mw))
  );

  // If at least 2 significant words match, consider it a match
  return matchingWords.length >= Math.min(2, Math.min(markdownWords.length, dbWords.length));
}

/**
 * Main function to populate DCC Training course lessons with content from markdown
 */
export async function populateDCCTrainingContent(dataSource: DataSource) {
  console.log('Starting to populate DCC Training course content from markdown...');

  const courseRepository = dataSource.getRepository(Course);
  const lessonRepository = dataSource.getRepository(Lesson);

  // Find DCC Training course
  const dccCourse = await courseRepository.findOne({
    where: { title: 'District Coordinating Committee (DCC) Training' },
    relations: ['modules', 'modules.lessons'],
  });

  if (!dccCourse) {
    console.log('❌ DCC Training course not found');
    return;
  }

  console.log(`✅ Found DCC Training course: ${dccCourse.id}`);

  // Read and parse markdown file
  const markdownPath = join(__dirname, '../course-content/dcc-training-lessons.md');
  console.log(`Reading markdown file: ${markdownPath}`);

  let lessonContentMap: Map<string, string>;
  try {
    lessonContentMap = parseMarkdownFile(markdownPath);
    console.log(`✅ Parsed ${lessonContentMap.size} lessons from markdown`);
  } catch (error) {
    console.error('❌ Failed to read/parse markdown file:', error);
    return;
  }

  // Update each lesson
  let updatedCount = 0;
  let skippedCount = 0;
  const markdownLessons = Array.from(lessonContentMap.entries());
  let markdownIndex = 0;

  for (const module of dccCourse.modules || []) {
    console.log(`\nProcessing module: ${module.title}`);
    
    // Sort lessons by orderIndex
    const sortedLessons = (module.lessons || []).sort((a, b) => a.orderIndex - b.orderIndex);

    for (const lesson of sortedLessons) {
      // Update both TEXT and VIDEO lessons (VIDEO lessons can have text content too)
      // Skip only if it's not a text/html lesson and has no content field
      if (lesson.type !== 'text' && lesson.type !== 'html' && lesson.type !== 'video') {
        console.log(`  ⏭️  Skipping lesson with type "${lesson.type}": "${lesson.title}"`);
        continue;
      }

      // Find matching markdown content
      let matchedContent: string | null = null;
      let matchedTitle: string | null = null;

      // First try to find exact/partial match
      for (const [markdownTitle, content] of markdownLessons) {
        if (mapLessonTitle(markdownTitle, lesson.title)) {
          matchedContent = content;
          matchedTitle = markdownTitle;
          break;
        }
      }

      // If no match found, use next available markdown lesson in order
      if (!matchedContent && markdownIndex < markdownLessons.length) {
        const [title, content] = markdownLessons[markdownIndex];
        matchedContent = content;
        matchedTitle = title;
        markdownIndex++;
        console.log(`  ℹ️  Using markdown lesson in order: "${matchedTitle}" for "${lesson.title}"`);
      }

      if (!matchedContent) {
        console.log(`  ⚠️  No content available for lesson: "${lesson.title}"`);
        skippedCount++;
        continue;
      }

      // Convert markdown to contentBlocks
      const contentBlocks = markdownToContentBlocks(matchedContent);

      if (contentBlocks.length === 0) {
        console.log(`  ⚠️  No content blocks generated for lesson: "${lesson.title}"`);
        skippedCount++;
        continue;
      }

      // Convert to JSON string
      const contentJson = JSON.stringify(contentBlocks);

      // Update lesson in database (keep original type, just add content)
      await lessonRepository.update(lesson.id, {
        content: contentJson,
        // Don't change the lesson type - VIDEO lessons can have text content too
      });

      console.log(`  ✅ Updated lesson: "${lesson.title}" (${contentBlocks.length} blocks, matched: "${matchedTitle}")`);
      updatedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ DCC Training content population completed!');
  console.log(`   Updated: ${updatedCount} lessons`);
  console.log(`   Skipped: ${skippedCount} lessons`);
  console.log('='.repeat(60));
}

// Note: This script is designed to be called from run-seeds.ts
// For standalone execution, use update-dcc-content.ts instead

