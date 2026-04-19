import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import ProceduresPage from '../../src/pages/ProceduresPage';
import type {Equipment} from '../../src/types/equipment';
import type {Procedure} from '../../src/types/procedure';

const {mockGetEquipment, mockFetchProcedures, mockDeleteProcedure} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
    mockFetchProcedures: vi.fn(),
    mockDeleteProcedure: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getEquipment: mockGetEquipment,
    fetchProcedures: mockFetchProcedures,
    deleteProcedure: mockDeleteProcedure,
}));

const equipment: Equipment = {
    id: 'eq1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01',
};

const procedures: Procedure[] = [
    {id: 'p1', name: 'Oil Change', steps: '', intervalDays: 30},
    {id: 'p2', name: 'Filter Swap', steps: '', intervalDays: 90},
];

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1/procedures']}>
            <Routes>
                <Route path="/equipment/:id/procedures" element={<ProceduresPage/>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('ProceduresPage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        mockFetchProcedures.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders equipment name and procedures', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue(procedures);
        await act(async () => {
            renderPage();
        });
        expect(screen.getAllByText('Acme X-100').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Oil Change').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Filter Swap').length).toBeGreaterThan(0);
    });

    it('renders the Add Procedure link', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue(procedures);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('link', {name: 'Add Procedure'})).toHaveAttribute('href', '/equipment/eq1/procedures/new');
    });

    it('deletes procedure after confirmation', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue(procedures);
        mockDeleteProcedure.mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        await act(async () => {
            renderPage();
        });
        const deleteButtons = screen.getAllByRole('button', {name: 'Delete'});
        await act(async () => {
            await userEvent.click(deleteButtons[0]);
        });

        expect(mockDeleteProcedure).toHaveBeenCalledWith('eq1', expect.any(String));
    });
});
