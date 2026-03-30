import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import DashboardPage from '../../src/pages/DashboardPage';
import type {Equipment} from '../../src/types/equipment';

const {mockFetchEquipment, mockDeleteProcedure, mockSendDashboardEmail} = vi.hoisted(() => ({
    mockFetchEquipment: vi.fn(),
    mockDeleteProcedure: vi.fn(),
    mockSendDashboardEmail: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
    fetchEquipment: mockFetchEquipment,
    deleteProcedure: mockDeleteProcedure,
    sendDashboardEmail: mockSendDashboardEmail,
}));

// CalendarView uses complex DOM — mock it
vi.mock('../../src/components/CalendarView', () => ({
    default: () => <div>Calendar View</div>,
}));

const equipment: Equipment[] = [{
    id: 'eq1', manufacturer: 'Acme', modelNumber: 'X-100', status: 'Active', purchaseDate: '2024-01-01',
    procedures: [
        {id: 'p1', name: 'Oil Change', steps: '', intervalDays: 30},
        {id: 'p2', name: 'Filter Swap', steps: '', intervalDays: 90},
    ],
}];

const renderPage = () => render(<MemoryRouter><DashboardPage/></MemoryRouter>);

afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

describe('DashboardPage', () => {
    it('shows loading initially', () => {
        mockFetchEquipment.mockReturnValue(new Promise(() => {
        }));
        renderPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the Dashboard heading', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('heading', {name: 'Dashboard'})).toBeInTheDocument();
    });

    it('renders flattened procedures from all equipment', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getAllByText('Oil Change').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Filter Swap').length).toBeGreaterThan(0);
    });

    it('renders Equipment link', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByRole('link', {name: 'Equipment'})).toHaveAttribute('href', '/equipment');
    });

    it('shows empty state when no procedures', async () => {
        mockFetchEquipment.mockResolvedValue([{...equipment[0], procedures: []}]);
        await act(async () => {
            renderPage();
        });
        expect(screen.getByText(/No procedures found/i)).toBeInTheDocument();
    });

    it('filters procedures by search term', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });

        await userEvent.type(screen.getByPlaceholderText(/search procedures/i), 'Oil');
        expect(screen.queryAllByText('Filter Swap').length).toBe(0);
        expect(screen.getAllByText('Oil Change').length).toBeGreaterThan(0);
    });

    it('sends dashboard email and shows success alert', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        mockSendDashboardEmail.mockResolvedValue({success: true});
        vi.spyOn(window, 'alert').mockImplementation(() => {
        });
        await act(async () => {
            renderPage();
        });

        await act(async () => {
            await userEvent.click(screen.getByRole('button', {name: /Email Dashboard/i}));
        });

        expect(mockSendDashboardEmail).toHaveBeenCalledOnce();
        expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/sent successfully/i));
    });

    it('shows failure alert when email send fails', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        mockSendDashboardEmail.mockResolvedValue({success: false, error: 'SMTP error'});
        vi.spyOn(window, 'alert').mockImplementation(() => {
        });
        await act(async () => {
            renderPage();
        });

        await act(async () => {
            await userEvent.click(screen.getByRole('button', {name: /Email Dashboard/i}));
        });

        expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed/i));
    });

    it('switches to Calendar View tab', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        await act(async () => {
            renderPage();
        });

        await userEvent.click(screen.getByRole('button', {name: /Calendar View/i}));
        // The mocked CalendarView component renders a div with this text
        expect(screen.getAllByText('Calendar View').length).toBeGreaterThan(1);
    });

    it('deletes a procedure after confirmation', async () => {
        mockFetchEquipment.mockResolvedValue(equipment);
        mockDeleteProcedure.mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        await act(async () => {
            renderPage();
        });

        const deleteButtons = screen.getAllByRole('button', {name: 'Delete'});
        await act(async () => {
            await userEvent.click(deleteButtons[0]);
        });

        expect(mockDeleteProcedure).toHaveBeenCalledOnce();
    });
});
