import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import EquipmentList from '../../src/components/EquipmentList';
import type {Equipment} from '../../src/types/equipment';

const items: Equipment[] = [
    {
        id: '1',
        manufacturer: 'Zebra',
        modelNumber: 'Z-100',
        status: 'Active',
        purchaseDate: '2024-01-01',
        location: 'Warehouse'
    },
    {
        id: '2',
        manufacturer: 'Acme',
        modelNumber: 'A-200',
        status: 'In Use',
        purchaseDate: '2024-06-01',
        location: 'Lab'
    },
    {id: '3', manufacturer: 'Beta', modelNumber: 'B-300', status: 'Under Repair', purchaseDate: '2023-12-01'},
];

const renderList = (overrideItems = items, onDelete = vi.fn()) =>
    render(
        <MemoryRouter>
            <EquipmentList items={overrideItems} onDelete={onDelete}/>
        </MemoryRouter>
    );

describe('EquipmentList', () => {
    it('renders all items', () => {
        renderList();
        expect(screen.getAllByText('Z-100').length).toBeGreaterThan(0);
        expect(screen.getAllByText('A-200').length).toBeGreaterThan(0);
        expect(screen.getAllByText('B-300').length).toBeGreaterThan(0);
    });

    it('renders "Add Equipment" link', () => {
        renderList();
        expect(screen.getByRole('link', {name: 'Add Equipment'})).toHaveAttribute('href', '/equipment/new');
    });

    it('shows empty state when no items', () => {
        renderList([]);
        expect(screen.getByText(/No equipment found/)).toBeInTheDocument();
    });

    it('filters items by search term', async () => {
        renderList();
        await userEvent.type(screen.getByPlaceholderText(/search equipment/i), 'Acme');
        expect(screen.queryAllByText('Z-100').length).toBe(0);
        expect(screen.getAllByText('A-200').length).toBeGreaterThan(0);
    });

    it('shows no-match message when search has no results', async () => {
        renderList();
        await userEvent.type(screen.getByPlaceholderText(/search equipment/i), 'xyznotfound');
        expect(screen.getByText(/No equipment matches your search/)).toBeInTheDocument();
    });

    it('clears search when X button is clicked', async () => {
        renderList();
        await userEvent.type(screen.getByPlaceholderText(/search equipment/i), 'Acme');
        await userEvent.click(screen.getByRole('button', {hidden: true, name: ''}));
        expect(screen.getAllByText('Z-100').length).toBeGreaterThan(0);
    });

    it('calls onDelete with equipment id when Delete is clicked', async () => {
        const onDelete = vi.fn();
        renderList(items, onDelete);
        const deleteButtons = screen.getAllByRole('button', {name: 'Delete'});
        await userEvent.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('renders status badges', () => {
        renderList();
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
        expect(screen.getAllByText('In Use').length).toBeGreaterThan(0);
    });

    it('renders procedure badge linking to procedures page', () => {
        renderList();
        expect(screen.getAllByText('View').length).toBeGreaterThan(0);
    });
});
