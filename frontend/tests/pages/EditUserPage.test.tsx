import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {EditUserPage} from '../../src/pages/EditUserPage';
import {AuthContext} from '../../src/hooks/useAuth';
import type {User} from '../../src/types/user';

const {mockGetUser, mockUpdateUser} = vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockUpdateUser: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getUser: mockGetUser,
    updateUser: mockUpdateUser,
}));

const adminUser: User = {
    id: 'user-99',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
};

const renderPage = (userId: string | null = 'other-user') =>
    render(
        <AuthContext.Provider value={{username: 'admin@example.com', userId, role: 'ADMIN', setAuthenticated: vi.fn()}}>
            <MemoryRouter initialEntries={['/users/user-99/edit']}>
                <Routes>
                    <Route path="/users/:id/edit" element={<EditUserPage/>}/>
                    <Route path="/users" element={<div>Users List</div>}/>
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );

afterEach(() => vi.clearAllMocks());

describe('EditUserPage', () => {
    it('shows loading initially', () => {
        mockGetUser.mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found when user is missing', async () => {
        mockGetUser.mockRejectedValue(new Error('not found'));
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/User not found/i)).toBeInTheDocument();
    });

    it('renders the Edit User form pre-populated', async () => {
        mockGetUser.mockResolvedValue(adminUser);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: 'Edit User'})).toBeInTheDocument();
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument();
    });

    it('shows role select when editing a different user', async () => {
        mockGetUser.mockResolvedValue(adminUser);
        await act(async () => {
            renderPage('other-user');
        });
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows read-only role badge instead of select when self-editing', async () => {
        mockGetUser.mockResolvedValue(adminUser);
        await act(async () => {
            renderPage('user-99');
        });
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    it('calls updateUser and navigates on submit', async () => {
        mockGetUser.mockResolvedValue(adminUser);
        mockUpdateUser.mockResolvedValue(adminUser);
        await act(async () => {
            renderPage('other-user');
        });

        const {fireEvent} = await import('@testing-library/react');
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Save Changes'}));
        });

        expect(mockUpdateUser).toHaveBeenCalledWith('user-99', expect.any(Object));
        expect(screen.getByText('Users List')).toBeInTheDocument();
    });

    it('navigates to /users on cancel', async () => {
        mockGetUser.mockResolvedValue(adminUser);
        await act(async () => {
            renderPage();
        });

        const {fireEvent} = await import('@testing-library/react');
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(screen.getByText('Users List')).toBeInTheDocument();
    });
});
