import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import NewEquipmentPage from '../../src/pages/NewEquipmentPage';

const {mockAddEquipment} = vi.hoisted(() => ({
    mockAddEquipment: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({addEquipment: mockAddEquipment}));

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/new']}>
            <Routes>
                <Route path="/equipment/new" element={<NewEquipmentPage/>}/>
                <Route path="/equipment" element={<div>Equipment List</div>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('NewEquipmentPage', () => {
    it('renders the Add Equipment form', () => {
        renderPage();
        expect(screen.getByRole('heading', {name: 'Add Equipment'})).toBeInTheDocument();
    });

    it('renders a back link to /equipment', () => {
        renderPage();
        expect(screen.getByRole('link', {name: /Back to Equipment List/i})).toHaveAttribute('href', '/equipment');
    });

    it('calls addEquipment and navigates to /equipment on submit', async () => {
        mockAddEquipment.mockResolvedValue({id: 'new1'});
        const {container} = renderPage();
        const {fireEvent} = await import('@testing-library/react');

        fireEvent.change(container.querySelector('input[name="manufacturer"]')!, {target: {value: 'Acme'}});
        fireEvent.change(container.querySelector('input[name="modelNumber"]')!, {target: {value: 'X-100'}});

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Create'}));
        });

        expect(mockAddEquipment).toHaveBeenCalled();
        expect(screen.getByText('Equipment List')).toBeInTheDocument();
    });

    it('navigates to /equipment on cancel', async () => {
        renderPage();
        const {fireEvent} = await import('@testing-library/react');
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(screen.getByText('Equipment List')).toBeInTheDocument();
    });
});
