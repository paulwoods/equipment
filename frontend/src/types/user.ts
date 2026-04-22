export type UserRole = 'ADMIN' | 'USER';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface UserCreatePayload {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface UserUpdatePayload {
    name: string;
    email: string;
    role: UserRole;
}
