import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {NewProcedurePage} from '../../src/pages/NewProcedurePage';
import type {Equipment} from '../../src/types/equipment';

const {mockGetEquipment, mockAddProcedure} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
    mockAddProcedure: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getEquipment: mockGetEquipment,
    addProcedure: mockAddProcedure,
}));

vi.mock('react-simplemde-editor', () => ({
    default: ({value, onChange}: { value: string; onChange: (v: string) => void }) => (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}/>
    ),
}));

const equipment: Equipment = {
    id: 'eq1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01',
};

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1/procedures/new']}>
            <Routes>
                <Route path="/equipment/:id/procedures/new" element={<NewProcedurePage/>}/>
                <Route path="/equipment/:id/procedures" element={<div>Procedures List</div>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('NewProcedurePage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the Add Procedure form with equipment context', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: 'Add Procedure'})).toBeInTheDocument();
        expect(screen.getByText('Acme X-100')).toBeInTheDocument();
    });

    it('calls addProcedure and navigates on submit', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockAddProcedure.mockResolvedValue({id: 'p1'});
        const {container} = renderPage();
        await act(async () => {
        });

        const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
        const {fireEvent} = await import('@testing-library/react');
        fireEvent.change(nameInput, {target: {value: 'Oil Change'}});

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Create'}));
        });

        expect(mockAddProcedure).toHaveBeenCalledWith('eq1', expect.objectContaining({name: 'Oil Change'}));
        expect(screen.getByText('Procedures List')).toBeInTheDocument();
    });

    it('navigates to procedures list on cancel', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });

        const {fireEvent} = await import('@testing-library/react');
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(screen.getByText('Procedures List')).toBeInTheDocument();
    });
});
