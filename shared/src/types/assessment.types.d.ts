export declare enum QuestionType {
    MULTIPLE_CHOICE = "multiple_choice",
    TRUE_FALSE = "true_false",
    SHORT_ANSWER = "short_answer"
}
export interface Quiz {
    id: string;
    lessonId: string;
    title: string;
    description?: string;
    passingScore: number;
    timeLimit?: number;
    randomizeQuestions: boolean;
    maxAttempts: number;
    retakeCooldownHours: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Question {
    id: string;
    quizId: string;
    type: QuestionType;
    stem: string;
    options?: string[];
    correctAnswer: string | number;
    explanation?: string;
    points: number;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface QuizAttempt {
    id: string;
    userId: string;
    quizId: string;
    score: number;
    maxScore: number;
    passed: boolean;
    answers: QuizAnswer[];
    startedAt: Date;
    completedAt?: Date;
    timeSpentSeconds: number;
}
export interface QuizAnswer {
    questionId: string;
    answer: string | number;
    isCorrect: boolean;
    pointsEarned: number;
}
export declare class CreateQuizDto {
    lessonId: string;
    title: string;
    description?: string;
    passingScore: number;
    timeLimit?: number;
    randomizeQuestions?: boolean;
    maxAttempts?: number;
    retakeCooldownHours?: number;
}
export declare class CreateQuestionDto {
    quizId: string;
    type: QuestionType;
    stem: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points: number;
    orderIndex: number;
}
export declare class SubmitQuizDto {
    quizId: string;
    answers: {
        questionId: string;
        answer: string | number;
    }[];
}
export declare class SubmitQuizAttemptDto {
    userId: string;
    quizId: string;
    answers: {
        [questionId: string]: string | number;
    };
}
