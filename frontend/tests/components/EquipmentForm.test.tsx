import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {EquipmentForm} from '../../src/components/EquipmentForm';
import type {Equipment} from '../../src/types/equipment';

const baseEquipment: Equipment = {
    id: 'eq1',
    manufacturer: 'Acme',
    modelNumber: 'X-100',
    serialNumber: 'SN-001',
    assetTag: 'AT-001',
    location: 'Building A',
    status: 'Active',
    description: 'Test equipment',
    purchaseDate: '2024-01-15T00:00:00Z',
};

describe('EquipmentForm', () => {
    it('renders "Add Equipment" heading when no equipment is provided', () => {
        render(<EquipmentForm onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        expect(screen.getByRole('heading', {name: 'Add Equipment'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create'})).toBeInTheDocument();
    });

    it('renders "Edit Equipment" heading when equipment is provided', () => {
        render(<EquipmentForm equipment={baseEquipment} onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        expect(screen.getByRole('heading', {name: 'Edit Equipment'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Update'})).toBeInTheDocument();
    });

    it('pre-populates fields from existing equipment', () => {
        render(<EquipmentForm equipment={baseEquipment} onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
        expect(screen.getByDisplayValue('X-100')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Building A')).toBeInTheDocument();
    });

    it('calls onCancel when Cancel is clicked', async () => {
        const onCancel = vi.fn();
        render(<EquipmentForm onSubmit={vi.fn()} onCancel={onCancel}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('calls onSubmit with form data on submit', async () => {
        const onSubmit = vi.fn();
        const {container} = render(<EquipmentForm onSubmit={onSubmit} onCancel={vi.fn()}/>);

        const manufacturerInput = container.querySelector('input[name="manufacturer"]') as HTMLInputElement;
        const modelNumberInput = container.querySelector('input[name="modelNumber"]') as HTMLInputElement;
        await userEvent.type(manufacturerInput, 'TestCo');
        await userEvent.type(modelNumberInput, 'M-200');

        await userEvent.click(screen.getByRole('button', {name: 'Create'}));

        expect(onSubmit).toHaveBeenCalledOnce();
        const submitted = onSubmit.mock.calls[0][0];
        expect(submitted.manufacturer).toBe('TestCo');
        expect(submitted.modelNumber).toBe('M-200');
    });

    it('calls onSubmit with id when editing existing equipment', async () => {
        const onSubmit = vi.fn();
        render(<EquipmentForm equipment={baseEquipment} onSubmit={onSubmit} onCancel={vi.fn()}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Update'}));
        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onSubmit.mock.calls[0][0]).toMatchObject({id: 'eq1'});
    });

    it('renders all status options', () => {
        render(<EquipmentForm onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        const options = Array.from(select.options).map(o => o.value);
        expect(options).toContain('Active');
        expect(options).toContain('In Use');
        expect(options).toContain('Under Repair');
        expect(options).toContain('Decommissioned');
        expect(options).toContain('In Storage');
    });
});
