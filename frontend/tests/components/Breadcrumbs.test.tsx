import {describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import Breadcrumbs from '../../src/components/Breadcrumbs';

vi.mock('../../src/api/client', () => ({
    fetchEquipment: vi.fn().mockResolvedValue([]),
}));

const renderAt = async (path: string) => {
    let result: ReturnType<typeof render>;
    await act(async () => {
        result = render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="*" element={<Breadcrumbs/>}/>
                </Routes>
            </MemoryRouter>
        );
    });
    return result!;
};

describe('Breadcrumbs', () => {
    it('renders nothing on /', async () => {
        const {container} = await renderAt('/');
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing on /login', async () => {
        const {container} = await renderAt('/login');
        expect(container).toBeEmptyDOMElement();
    });

    it('renders Home link on /equipment', async () => {
        await renderAt('/equipment');
        expect(screen.getByRole('link', {name: /home/i})).toHaveAttribute('href', '/');
    });

    it('renders Equipment breadcrumb on /equipment', async () => {
        await renderAt('/equipment');
        expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('renders Dashboard breadcrumb on /dashboard', async () => {
        await renderAt('/dashboard');
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders nested breadcrumbs on /equipment/123/procedures', async () => {
        await renderAt('/equipment/123/procedures');
        expect(screen.getByRole('link', {name: /home/i})).toBeInTheDocument();
        expect(screen.getByText('Procedures')).toBeInTheDocument();
    });
});
