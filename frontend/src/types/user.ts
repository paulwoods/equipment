export type UserRole = 'USER' | 'EDIT' | 'ADMIN' | 'SYSTEM_ADMIN';

export interface Role {
    id: string;
    name: UserRole;
}

export const canManageUsers = (roles: UserRole[]): boolean =>
    roles.includes('ADMIN') || roles.includes('SYSTEM_ADMIN');

export const canEditContent = (roles: UserRole[]): boolean =>
    roles.includes('EDIT') || roles.includes('ADMIN') || roles.includes('SYSTEM_ADMIN');

export const isSystemAdmin = (roles: UserRole[]): boolean =>
    roles.includes('SYSTEM_ADMIN');

export const assignableRoles = (callerRoles: UserRole[]): UserRole[] => {
    if (callerRoles.includes('SYSTEM_ADMIN')) return ['USER', 'EDIT', 'ADMIN', 'SYSTEM_ADMIN'];
    if (callerRoles.includes('ADMIN')) return ['USER', 'EDIT', 'ADMIN'];
    return [];
};

export interface User {
    id: string;
    name: string;
    email: string;
    roles: Role[];
}

export interface UserCreatePayload {
    name: string;
    email: string;
    password: string;
    roles: UserRole[];
}

export interface UserUpdatePayload {
    name: string;
    email: string;
    roles: UserRole[];
}
