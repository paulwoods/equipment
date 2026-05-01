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

export const roleBadgeClass = (role: UserRole): string => {
    switch (role) {
        case 'SYSTEM_ADMIN':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'ADMIN':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'EDIT':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
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
