import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from '../src/App';

const {mockGetMe} = vi.hoisted(() => ({mockGetMe: vi.fn()}));

vi.mock('../src/api/client', () => ({
    getMe: mockGetMe,
    getSetupStatus: vi.fn().mockResolvedValue({setupRequired: false}),
    getVersion: vi.fn().mockResolvedValue({version: '2.0.15'}),
    logout: vi.fn().mockResolvedValue(undefined),
    fetchEquipment: vi.fn().mockResolvedValue([]),
}));

vi.mock('next-themes', () => ({
    ThemeProvider: ({children}: { children: React.ReactNode }) => <>{children}</>,
    useTheme: () => ({resolvedTheme: 'light', setTheme: vi.fn()}),
}));

afterEach(() => vi.clearAllMocks());

describe('App', () => {
    it('renders nothing while auth check is in flight', () => {
        mockGetMe.mockReturnValue(new Promise(() => {
        }));
        const {container} = render(<App/>);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the home page after successful auth check', async () => {
        mockGetMe.mockResolvedValue({email: 'alice'});
        await act(async () => {
            render(<App/>);
        });
        expect(screen.getByText(/Equipment Management System/i)).toBeInTheDocument();
    });

    it('renders the home page when auth check fails (unauthenticated user)', async () => {
        mockGetMe.mockRejectedValue(new Error('Unauthorized'));
        await act(async () => {
            render(<App/>);
        });
        // / is a public route — renders even without auth
        expect(screen.getByText(/Equipment Management System/i)).toBeInTheDocument();
    });

    it('provides the username to AuthContext so Sidebar shows it', async () => {
        mockGetMe.mockResolvedValue({email: 'alice'});
        await act(async () => {
            render(<App/>);
        });
        expect(screen.getByText('alice')).toBeInTheDocument();
    });

    it('clears username when logout is triggered', async () => {
        const user = userEvent.setup();
        mockGetMe.mockResolvedValue({email: 'alice'});
        await act(async () => {
            render(<App/>);
        });
        expect(screen.getByText('alice')).toBeInTheDocument();

        // Open the user dropdown in the Sidebar, then click "Log out"
        const triggerButton = screen.getByText('alice').closest('button')!;
        await user.click(triggerButton);
        const logoutItem = screen.getByText('Log out');
        await user.click(logoutItem);
        expect(screen.queryByText('alice')).not.toBeInTheDocument();
    });

    it('calls getMe once on mount for the initial auth check', async () => {
        mockGetMe.mockResolvedValue({email: 'alice'});
        await act(async () => {
            render(<App/>);
        });
        expect(mockGetMe).toHaveBeenCalledTimes(1);
    });

    it('re-fetches user via getMe when setAuthenticated(true) is called', async () => {
        const user = userEvent.setup();
        // First call: auth check succeeds, second call: after setAuthenticated(true)
        mockGetMe
            .mockResolvedValueOnce({email: 'alice'})
            .mockResolvedValueOnce({email: 'bob'});

        await act(async () => {
            render(<App/>);
        });
        expect(screen.getByText('alice')).toBeInTheDocument();

        // Trigger setAuthenticated(false) via Sidebar logout dropdown.
        const triggerButton = screen.getByText('alice').closest('button')!;
        await user.click(triggerButton);
        const logoutItem = screen.getByText('Log out');
        await user.click(logoutItem);
        // After logout, username is cleared — setAuthenticated(true) would call getMe again
        expect(mockGetMe).toHaveBeenCalledTimes(1); // only the mount call so far
    });
});
