import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import ProcedureShowPage from '../../src/pages/ProcedureShowPage';
import type {Equipment} from '../../src/types/equipment';
import type {Perform, Procedure} from '../../src/types/procedure';

const {mockGetEquipment, mockGetProcedure, mockFetchHistory} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
    mockGetProcedure: vi.fn(),
    mockFetchHistory: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getEquipment: mockGetEquipment,
    getProcedure: mockGetProcedure,
    fetchHistory: mockFetchHistory,
}));

const equipment: Equipment = {
    id: 'eq1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01',
};

const procedure: Procedure = {
    id: 'p1', name: 'Oil Change', description: 'Change the oil',
    steps: '1. Drain oil\n2. Fill oil', requiredTools: 'Wrench', intervalDays: 90,
};

const history: Perform[] = [{id: 'h1', date: '2025-01-01T00:00:00Z', notes: 'Done'}];

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1/procedures/p1']}>
            <Routes>
                <Route path="/equipment/:id/procedures/:procedureId" element={<ProcedureShowPage/>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('ProcedureShowPage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        mockGetProcedure.mockReturnValue(new Promise(() => {
        }));
        mockFetchHistory.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found when procedure is missing', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockRejectedValue(new Error('not found'));
        mockFetchHistory.mockResolvedValue([]);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Procedure not found/i)).toBeInTheDocument();
    });

    it('renders procedure name and details', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockFetchHistory.mockResolvedValue(history);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: 'Oil Change'})).toBeInTheDocument();
        expect(screen.getByText('Change the oil')).toBeInTheDocument();
        expect(screen.getByText(/Every 90 days/i)).toBeInTheDocument();
    });

    it('renders equipment context', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockFetchHistory.mockResolvedValue(history);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText('Acme X-100')).toBeInTheDocument();
    });

    it('renders Edit and Perform action links', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockFetchHistory.mockResolvedValue(history);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('link', {name: /Edit/i})).toHaveAttribute('href', '/equipment/eq1/procedures/p1/edit');
        expect(screen.getByRole('link', {name: /Perform/i})).toHaveAttribute('href', '/equipment/eq1/procedures/p1/perform');
    });

    it('renders View Full History link', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockFetchHistory.mockResolvedValue(history);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('link', {name: /View Full History/i})).toHaveAttribute('href', '/equipment/eq1/procedures/p1/history');
    });

    it('shows last performed date from history', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockFetchHistory.mockResolvedValue(history);
        await act(async () => {
            renderPage();
        });
        expect(screen.queryByText('Never')).not.toBeInTheDocument();
    });

    it('shows "Never" when no history', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockFetchHistory.mockResolvedValue([]);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText('Never')).toBeInTheDocument();
    });
});
