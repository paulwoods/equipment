export type UserRole = 'USER' | 'EDIT' | 'ADMIN' | 'SYSTEM_ADMIN';

export const canManageUsers = (role: UserRole | null): boolean =>
    role === 'ADMIN' || role === 'SYSTEM_ADMIN';

export const canEditContent = (role: UserRole | null): boolean =>
    role === 'EDIT' || role === 'ADMIN' || role === 'SYSTEM_ADMIN';

export const isSystemAdmin = (role: UserRole | null): boolean =>
    role === 'SYSTEM_ADMIN';

export const assignableRoles = (callerRole: UserRole | null): UserRole[] => {
    if (callerRole === 'SYSTEM_ADMIN') return ['USER', 'EDIT', 'ADMIN', 'SYSTEM_ADMIN'];
    if (callerRole === 'ADMIN') return ['USER', 'EDIT'];
    return [];
};

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
