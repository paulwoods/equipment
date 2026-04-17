import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import Footer from '../../src/components/Footer';

vi.mock('../../src/api/client', () => ({
    getVersion: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Footer', () => {
    it('renders Equipment Manager text', async () => {
        const {getVersion} = await import('../../src/api/client');
        (getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({version: '2.0.15'});

        render(<Footer/>);
        expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
    });

    it('renders client version immediately', async () => {
        const {getVersion} = await import('../../src/api/client');
        (getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({version: '2.0.15'});

        render(<Footer/>);
        expect(screen.getByText(/Client Version/)).toBeInTheDocument();
    });

    it('renders server version after fetch resolves', async () => {
        const {getVersion} = await import('../../src/api/client');
        (getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({version: '2.0.15'});

        render(<Footer/>);

        await waitFor(() => {
            expect(screen.getByText(/Server Version 2\.0\.15/)).toBeInTheDocument();
        });
    });

    it('omits server version on fetch error', async () => {
        const {getVersion} = await import('../../src/api/client');
        (getVersion as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

        render(<Footer/>);

        await waitFor(() => {
            expect(getVersion).toHaveBeenCalledOnce();
        });

        expect(screen.queryByText(/Server Version/)).not.toBeInTheDocument();
    });
});
