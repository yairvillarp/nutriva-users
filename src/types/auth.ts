export interface LoginCredentials {
    email?: string;
    username?: string;
    password?: string;
}

export interface LoginResponse {
    accessToken: string;
    id: number;
    username: string;
    email: string;
    roles: string[];
    onboarding?: boolean;
    avatar?: string;
}
