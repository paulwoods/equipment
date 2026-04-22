import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {PerformProcedurePage} from '../../src/pages/PerformProcedurePage';
import type {Equipment} from '../../src/types/equipment';
import type {Procedure} from '../../src/types/procedure';

const {mockGetEquipment, mockGetProcedure, mockRecordPerformance} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
    mockGetProcedure: vi.fn(),
    mockRecordPerformance: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getEquipment: mockGetEquipment,
    getProcedure: mockGetProcedure,
    recordPerformance: mockRecordPerformance,
}));

const equipment: Equipment = {
    id: 'eq1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01',
};

const procedure: Procedure = {
    id: 'p1', name: 'Oil Change', steps: '1. Drain oil', requiredTools: 'Wrench', intervalDays: 30,
};

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1/procedures/p1/perform']}>
            <Routes>
                <Route path="/equipment/:id/procedures/:procedureId/perform" element={<PerformProcedurePage/>}/>
                <Route path="/dashboard" element={<div>Dashboard</div>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('PerformProcedurePage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        mockGetProcedure.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found when equipment is missing', async () => {
        mockGetEquipment.mockRejectedValue(new Error('not found'));
        mockGetProcedure.mockRejectedValue(new Error('not found'));
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Equipment not found/i)).toBeInTheDocument();
    });

    it('renders equipment and procedure info', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText('Acme X-100')).toBeInTheDocument();
        expect(screen.getByText('Oil Change')).toBeInTheDocument();
    });

    it('renders procedure steps and required tools', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Drain oil/i)).toBeInTheDocument();
        expect(screen.getByText(/Required Tools/i)).toBeInTheDocument();
    });

    it('renders the Record Performance form', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: /Record Performance/i})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Record Performance/i})).toBeInTheDocument();
    });

    it('calls recordPerformance and navigates to dashboard on submit', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockGetProcedure.mockResolvedValue(procedure);
        mockRecordPerformance.mockResolvedValue({id: 'h1'});
        await act(async () => {
            renderPage();
        });

        await act(async () => {
            await userEvent.click(screen.getByRole('button', {name: /Record Performance/i}));
        });

        expect(mockRecordPerformance).toHaveBeenCalledWith('eq1', 'p1', expect.any(String), expect.any(String));
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
});
