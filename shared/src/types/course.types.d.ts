export declare enum CourseStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived"
}
export declare enum LessonType {
    VIDEO = "video",
    TEXT = "text",
    HTML = "html",
    EMBED = "embed",
    DOWNLOAD = "download"
}
export declare enum CourseDifficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced"
}
export interface Course {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    tags: string[];
    trailerVideoUrl?: string;
    coverImageUrl?: string;
    instructorId: string;
    status: CourseStatus;
    difficulty: CourseDifficulty;
    estimatedDuration: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Module {
    id: string;
    courseId: string;
    title: string;
    summary?: string;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Lesson {
    id: string;
    moduleId: string;
    title: string;
    type: LessonType;
    contentUrl?: string;
    content?: string;
    durationSeconds?: number;
    transcript?: string;
    orderIndex: number;
    isPreview: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    progressPercent: number;
    lastLessonSeenAt?: Date;
    completedAt?: Date;
    enrolledAt: Date;
    updatedAt: Date;
}
export declare class CreateCourseDto {
    title: string;
    subtitle?: string;
    description: string;
    tags: string[];
    difficulty: CourseDifficulty;
    estimatedDuration: number;
    price: number;
    trailerVideoUrl?: string;
    coverImageUrl?: string;
}
export declare class UpdateCourseDto {
    title?: string;
    subtitle?: string;
    description?: string;
    tags?: string[];
    difficulty?: CourseDifficulty;
    estimatedDuration?: number;
    price?: number;
    status?: CourseStatus;
}
export declare class CreateModuleDto {
    courseId: string;
    title: string;
    summary?: string;
    orderIndex: number;
}
export declare class CreateLessonDto {
    moduleId: string;
    title: string;
    type: LessonType;
    contentUrl?: string;
    content?: string;
    durationSeconds?: number;
    orderIndex: number;
    isPreview?: boolean;
}
