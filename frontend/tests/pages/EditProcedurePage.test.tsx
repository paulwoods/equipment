import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import EditProcedurePage from '../../src/pages/EditProcedurePage';
import type {Equipment} from '../../src/types/equipment';
import type {Procedure} from '../../src/types/procedure';

const {mockGetEquipment, mockGetProcedure, mockUpdateProcedure} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
    mockGetProcedure: vi.fn(),
    mockUpdateProcedure: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getEquipment: mockGetEquipment,
    getProcedure: mockGetProcedure,
    updateProcedure: mockUpdateProcedure,
}));

vi.mock('react-simplemde-editor', () => ({
    default: ({value, onChange}: { value: string; onChange: (v: string) => void }) => (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}/>
    ),
}));

const equipment: Equipment = {
    id: 'eq1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01',
};

const procedure: Procedure = {id: 'p1', name: 'Oil Change', steps: '', intervalDays: 30};

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1/procedures/p1/edit']}>
            <Routes>
                <Route path="/equipment/:id/procedures/:procedureId/edit" element={<EditProcedurePage/>}/>
                <Route path="/equipment/:id/procedures" element={<div>Procedures List</div>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('EditProcedurePage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        mockGetProcedure.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found when procedure is missing', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockRejectedValue(new Error('not found'));
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Procedure not found/i)).toBeInTheDocument();
    });

    it('renders the Edit Procedure form pre-populated', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: 'Edit Procedure'})).toBeInTheDocument();
        expect(screen.getByDisplayValue('Oil Change')).toBeInTheDocument();
    });

    it('calls updateProcedure and navigates on submit', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockUpdateProcedure.mockResolvedValue({});
        await act(async () => {
            renderPage();
        });

        const {fireEvent} = await import('@testing-library/react');
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Update'}));
        });

        expect(mockUpdateProcedure).toHaveBeenCalledWith('eq1', 'p1', expect.any(Object));
        expect(screen.getByText('Procedures List')).toBeInTheDocument();
    });

    it('navigates to procedures list on cancel', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        await act(async () => {
            renderPage();
        });

        const {fireEvent} = await import('@testing-library/react');
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(screen.getByText('Procedures List')).toBeInTheDocument();
    });
});
