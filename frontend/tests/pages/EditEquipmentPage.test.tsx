import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {EditEquipmentPage} from '../../src/pages/EditEquipmentPage';
import type {Equipment} from '../../src/types/equipment';

const {mockGetEquipment, mockUpdateEquipment} = vi.hoisted(() => ({
    mockGetEquipment: vi.fn(),
    mockUpdateEquipment: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    getEquipment: mockGetEquipment,
    updateEquipment: mockUpdateEquipment,
}));

const equipment: Equipment = {
    id: 'eq1',
    manufacturer: 'Acme',
    modelNumber: 'X-100',
    status: 'Active',
    purchaseDate: '2024-01-15',
};

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/equipment/eq1/edit']}>
            <Routes>
                <Route path="/equipment/:id/edit" element={<EditEquipmentPage/>}/>
                <Route path="/equipment" element={<div>Equipment List</div>}/>
            </Routes>
        </MemoryRouter>
    );

afterEach(() => vi.clearAllMocks());

describe('EditEquipmentPage', () => {
    it('shows loading initially', () => {
        mockGetEquipment.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found when equipment is missing', async () => {
        mockGetEquipment.mockRejectedValue(new Error('not found'));
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/Equipment not found/i)).toBeInTheDocument();
    });

    it('renders the Edit Equipment form pre-populated', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: 'Edit Equipment'})).toBeInTheDocument();
        expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
    });

    it('calls updateEquipment and navigates to /equipment on submit', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        mockUpdateEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });

        const {fireEvent} = await import('@testing-library/react');
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Update'}));
        });

        expect(mockUpdateEquipment).toHaveBeenCalledWith('eq1', expect.any(Object));
        expect(screen.getByText('Equipment List')).toBeInTheDocument();
    });

    it('navigates to /equipment on cancel', async () => {
        mockGetEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });

        const {fireEvent} = await import('@testing-library/react');
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(screen.getByText('Equipment List')).toBeInTheDocument();
    });
});
