import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ThemeToggle} from '../../src/components/ThemeToggle';

const mockSetTheme = vi.fn();

vi.mock('next-themes', () => ({
    useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {
    it('renders a placeholder button when not mounted', () => {
        vi.mocked(useTheme).mockReturnValue({resolvedTheme: 'light', setTheme: mockSetTheme} as any);
        // On initial render before useEffect fires, mounted=false → placeholder
        render(<ThemeToggle/>);
        expect(screen.getByRole('button', {name: /toggle theme/i})).toBeInTheDocument();
    });

    it('switches from light to dark when clicked', async () => {
        vi.mocked(useTheme).mockReturnValue({resolvedTheme: 'light', setTheme: mockSetTheme} as any);
        render(<ThemeToggle/>);
        // Trigger mount via act (useEffect runs synchronously in jsdom with vitest)
        await userEvent.click(screen.getByRole('button', {name: /toggle theme/i}));
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('switches from dark to light when clicked', async () => {
        vi.mocked(useTheme).mockReturnValue({resolvedTheme: 'dark', setTheme: mockSetTheme} as any);
        render(<ThemeToggle/>);
        await userEvent.click(screen.getByRole('button', {name: /toggle theme/i}));
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
});
