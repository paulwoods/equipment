import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {AuthContext} from '../../src/hooks/useAuth';
import Header from '../../src/components/Header';

vi.mock('../../src/api/client', () => ({
    logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next-themes', () => ({
    useTheme: () => ({resolvedTheme: 'light', setTheme: vi.fn()}),
}));

const renderHeader = (username: string | null = null) => {
    const setAuthenticated = vi.fn();
    render(
        <MemoryRouter>
            <AuthContext.Provider value={{username, setAuthenticated}}>
                <Header/>
            </AuthContext.Provider>
        </MemoryRouter>
    );
    return {setAuthenticated};
};

afterEach(() => {
    vi.clearAllMocks();
});

describe('Header', () => {
    it('renders the app title linking to /', () => {
        renderHeader();
        const link = screen.getByRole('link', {name: /Equipment Manager/i});
        expect(link).toHaveAttribute('href', '/');
    });

    it('does not render username when no user is logged in', () => {
        renderHeader(null);
        expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
    });

    it('renders welcome message with username when logged in', () => {
        renderHeader('alice');
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    });

    it('calls logout and setAuthenticated on logout button click', async () => {
        const {logout} = await import('../../src/api/client');
        const {setAuthenticated} = renderHeader('alice');

        // ThemeToggle has aria-label="Toggle theme"; the logout button does not
        const buttons = screen.getAllByRole('button');
        const logoutButton = buttons.find(b => b.getAttribute('aria-label') !== 'Toggle theme')!;
        await act(async () => {
            await userEvent.click(logoutButton);
        });

        expect(logout).toHaveBeenCalledOnce();
        expect(setAuthenticated).toHaveBeenCalledWith(false);
    });
});
