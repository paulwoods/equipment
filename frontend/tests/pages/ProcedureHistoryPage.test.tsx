import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import ProcedureHistoryPage from '../../src/pages/ProcedureHistoryPage';
import type {Equipment} from '../../src/types/equipment';

const {mockGetEquipment} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({getEquipment: mockGetEquipment}));

const equipment: Equipment = {
    id: 'eq1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01',
    procedures: [{
        id: 'p1', name: 'Oil Change', steps: '', intervalDays: 30,
        history: [
            {id: 'h1', date: '2025-01-15T00:00:00Z', notes: 'Smooth'},
            {id: 'h2', date: '2024-10-01T00:00:00Z', notes: 'Fine'},
        ],
    }],
};

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1/procedures/p1/history']}>
            <Routes>
                <Route path="/equipment/:id/procedures/:procedureId/history" element={<ProcedureHistoryPage/>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('ProcedureHistoryPage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found when procedure is missing', async () => {
        mockGetEquipment.mockResolvedValue({...equipment, procedures: []});
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Procedure not found/i)).toBeInTheDocument();
    });

    it('renders the Performance History heading', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: /Performance History/i})).toBeInTheDocument();
    });

    it('renders procedure and equipment info', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Oil Change/)).toBeInTheDocument();
        expect(screen.getByText(/Acme/)).toBeInTheDocument();
    });

    it('renders history records with notes', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getAllByText('Smooth').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Fine').length).toBeGreaterThan(0);
    });

    it('shows empty state when no history records', async () => {
        const noHistory = {...equipment, procedures: [{...equipment.procedures![0], history: []}]};
        mockGetEquipment.mockResolvedValue(noHistory);
        await act(async () => {
            renderPage();
        });
        expect(screen.getAllByText(/No performance records/i).length).toBeGreaterThan(0);
    });
});
