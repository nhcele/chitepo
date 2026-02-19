export declare enum UserRole {
    LEARNER = "learner",
    INSTRUCTOR = "instructor",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    jobTitle?: string;
    skillInterests?: string[];
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class CreateUserDto {
    email: string;
    name: string;
    password: string;
    jobTitle?: string;
    skillInterests?: string[];
    role?: UserRole;
}
export declare class UpdateUserDto {
    name?: string;
    avatar?: string;
    jobTitle?: string;
    skillInterests?: string[];
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
