import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import ProcedureList from '../../src/components/ProcedureList';
import type {Procedure} from '../../src/types/procedure';

const procedures: Procedure[] = [
    {id: 'p1', name: 'Oil Change', description: 'Change the oil', steps: '', intervalDays: 90},
    {id: 'p2', name: 'Filter Swap', description: 'Replace filter', steps: '', intervalDays: 30},
    {id: 'p3', name: 'Inspection', steps: '', intervalDays: 365},
];

const renderList = (overrides = procedures, onDelete = vi.fn()) =>
    render(
        <MemoryRouter>
            <ProcedureList equipmentId="eq1" procedures={overrides} onDelete={onDelete}/>
        </MemoryRouter>
    );

describe('ProcedureList', () => {
    it('renders all procedures', () => {
        renderList();
        expect(screen.getAllByText('Oil Change').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Filter Swap').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inspection').length).toBeGreaterThan(0);
    });

    it('shows empty state when no procedures', () => {
        renderList([]);
        expect(screen.getByText(/No procedures found/)).toBeInTheDocument();
    });

    it('filters procedures by search term', async () => {
        renderList();
        await userEvent.type(screen.getByPlaceholderText(/search procedures/i), 'Oil');
        expect(screen.queryAllByText('Filter Swap').length).toBe(0);
        expect(screen.getAllByText('Oil Change').length).toBeGreaterThan(0);
    });

    it('shows no-match message when search has no results', async () => {
        renderList();
        await userEvent.type(screen.getByPlaceholderText(/search procedures/i), 'xyznotfound');
        expect(screen.getByText(/No procedures match your search/)).toBeInTheDocument();
    });

    it('renders Perform, History, Edit, and Delete action links', () => {
        renderList();
        expect(screen.getAllByRole('link', {name: 'Perform'}).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('link', {name: 'History'}).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('link', {name: 'Edit'}).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', {name: 'Delete'}).length).toBeGreaterThan(0);
    });

    it('calls onDelete when Delete is clicked', async () => {
        const onDelete = vi.fn();
        renderList(procedures, onDelete);
        const deleteButtons = screen.getAllByRole('button', {name: 'Delete'});
        await userEvent.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('action links point to correct URLs', () => {
        renderList([procedures[0]]);
        expect(screen.getAllByRole('link', {name: 'Perform'})[0]).toHaveAttribute(
            'href', '/equipment/eq1/procedures/p1/perform'
        );
        expect(screen.getAllByRole('link', {name: 'History'})[0]).toHaveAttribute(
            'href', '/equipment/eq1/procedures/p1/history'
        );
        expect(screen.getAllByRole('link', {name: 'Edit'})[0]).toHaveAttribute(
            'href', '/equipment/eq1/procedures/p1/edit'
        );
    });
});
