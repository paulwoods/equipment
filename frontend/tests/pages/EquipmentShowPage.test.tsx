import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {EquipmentShowPage} from '../../src/pages/EquipmentShowPage';
import type {Equipment} from '../../src/types/equipment';
import type {Procedure} from '../../src/types/procedure';

const {mockGetEquipment, mockFetchProcedures, mockDeleteEquipment} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
    mockFetchProcedures: vi.fn(),
    mockDeleteEquipment: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getEquipment: mockGetEquipment,
    fetchProcedures: mockFetchProcedures,
    deleteEquipment: mockDeleteEquipment,
}));

const equipment: Equipment = {
    id: 'eq1',
    manufacturer: 'Acme',
    modelNumber: 'X-100',
    serialNumber: 'SN-001',
    assetTag: 'AT-001',
    location: 'Building A',
    status: 'Active',
    description: 'A test device',
    purchaseDate: '2024-01-15T00:00:00Z',
};

const procedures: Procedure[] = [
    {id: 'p1', name: 'Oil Change', steps: '', intervalDays: 30},
];

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1']}>
            <Routes>
                <Route path="/equipment/:id" element={<EquipmentShowPage/>}/>
                <Route path="/equipment" element={<div>Equipment List</div>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('EquipmentShowPage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        mockFetchProcedures.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found when equipment is missing', async () => {
        mockGetEquipment.mockRejectedValue(new Error('not found'));
        mockFetchProcedures.mockResolvedValue([]);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Equipment not found/i)).toBeInTheDocument();
    });

    it('renders equipment details', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue(procedures);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText('X-100')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('A test device')).toBeInTheDocument();
    });

    it('renders procedures list', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue(procedures);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText('Oil Change')).toBeInTheDocument();
    });

    it('shows no-procedures message when empty', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue([]);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/No procedures defined/i)).toBeInTheDocument();
    });

    it('renders Edit and View Procedures links', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue(procedures);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('link', {name: /Edit/i})).toHaveAttribute('href', '/equipment/eq1/edit');
        expect(screen.getByRole('link', {name: /View Procedures/i})).toHaveAttribute('href', '/equipment/eq1/procedures');
    });

    it('navigates to equipment list after confirmed delete', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockFetchProcedures.mockResolvedValue(procedures);
        mockDeleteEquipment.mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        await act(async () => {
            renderPage();
        });
        await act(async () => {
            await userEvent.click(screen.getByRole('button', {name: /Delete/i}));
        });

        expect(mockDeleteEquipment).toHaveBeenCalledWith('eq1');
        expect(screen.getByText('Equipment List')).toBeInTheDocument();
    });
});
