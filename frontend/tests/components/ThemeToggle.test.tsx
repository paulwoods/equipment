import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ThemeToggle} from '../../src/components/ThemeToggle';

const mockSetTheme = vi.fn();
let mockResolvedTheme = 'light';

vi.mock('next-themes', () => ({
    useTheme: () => ({resolvedTheme: mockResolvedTheme, setTheme: mockSetTheme}),
}));

afterEach(() => {
    vi.clearAllMocks();
    mockResolvedTheme = 'light';
});

describe('ThemeToggle', () => {
    it('renders the toggle button', () => {
        render(<ThemeToggle/>);
        expect(screen.getByRole('button', {name: /toggle theme/i})).toBeInTheDocument();
    });

    it('switches from light to dark when clicked', async () => {
        mockResolvedTheme = 'light';
        render(<ThemeToggle/>);
        await userEvent.click(screen.getByRole('button', {name: /toggle theme/i}));
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('switches from dark to light when clicked', async () => {
        mockResolvedTheme = 'dark';
        render(<ThemeToggle/>);
        await userEvent.click(screen.getByRole('button', {name: /toggle theme/i}));
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
});
