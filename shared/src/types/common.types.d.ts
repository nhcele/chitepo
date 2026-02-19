export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    meta?: ResponseMeta;
}
export interface ResponseMeta {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export declare enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}
export declare class PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
}
export interface SearchQuery extends PaginationQuery {
    q?: string;
    filters?: Record<string, any>;
}
export declare class SearchDto extends PaginationDto {
    q?: string;
    filters?: Record<string, any>;
}
export interface FileUpload {
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedAt: Date;
}
export interface VideoProcessingStatus {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    hlsUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    error?: string;
}
export interface CarbonFootprint {
    estimatedCO2Grams: number;
    gridCarbonIntensity: number;
    isLowCarbon: boolean;
    carbonSavingsEnabled: boolean;
}
