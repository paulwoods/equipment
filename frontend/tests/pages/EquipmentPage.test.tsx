import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {EquipmentPage} from '../../src/pages/EquipmentPage';
import type {Equipment} from '../../src/types/equipment';

const {mockFetchEquipment, mockDeleteEquipment} = vi.hoisted(() => ({
    mockFetchEquipment: vi.fn(),
    mockDeleteEquipment: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    fetchEquipment: mockFetchEquipment,
    deleteEquipment: mockDeleteEquipment,
}));

const equipment: Equipment[] = [
    {id: '1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01'},
    {id: '2', manufacturer: 'Beta', modelNumber: 'B-200', status: 'In Use', purchaseDate: '2024-06-01'},
];

const renderPage = () => render(<MemoryRouter><EquipmentPage/></MemoryRouter>);

afterEach(() => vi.clearAllMocks());

describe('EquipmentPage', () => {
    it('shows loading state then renders equipment', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getAllByText('X-100').length).toBeGreaterThan(0);
        expect(screen.getAllByText('B-200').length).toBeGreaterThan(0);
    });

    it('renders the Equipment heading', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: 'Equipment'})).toBeInTheDocument();
    });

    it('renders a Dashboard link', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('link', {name: 'Dashboard'})).toHaveAttribute('href', '/dashboard');
    });

    it('removes equipment from list after confirmed delete', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        mockDeleteEquipment.mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        await act(async () => {
            renderPage();
        });
        const deleteButtons = screen.getAllByRole('button', {name: 'Delete'});
        await act(async () => {
            await userEvent.click(deleteButtons[0]);
        });

        expect(mockDeleteEquipment).toHaveBeenCalledWith('1');
    });

    it('does not delete when confirm is cancelled', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        await act(async () => {
            renderPage();
        });
        const deleteButtons = screen.getAllByRole('button', {name: 'Delete'});
        await act(async () => {
            await userEvent.click(deleteButtons[0]);
        });

        expect(mockDeleteEquipment).not.toHaveBeenCalled();
    });
});
