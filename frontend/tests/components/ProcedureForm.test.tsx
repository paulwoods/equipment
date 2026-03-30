import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProcedureForm from '../../src/components/ProcedureForm';
import type {Procedure} from '../../src/types/procedure';
import type {Equipment} from '../../src/types/equipment';

// SimpleMDE requires CodeMirror DOM APIs — mock it to a plain textarea
vi.mock('react-simplemde-editor', () => ({
    default: ({value, onChange, options}: {
        value: string;
        onChange: (v: string) => void;
        options?: { placeholder?: string }
    }) => (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={options?.placeholder}
        />
    ),
}));

const baseProcedure: Procedure = {
    id: 'p1',
    name: 'Oil Change',
    description: 'Change the oil',
    steps: '1. Drain oil',
    requiredTools: 'Wrench',
    intervalDays: 90,
};

const baseEquipment: Equipment = {
    id: 'eq1',
    manufacturer: 'Acme',
    modelNumber: 'X-100',
    status: 'Active',
    purchaseDate: '2024-01-01',
};

describe('ProcedureForm', () => {
    it('renders "Add Procedure" heading when no procedure is provided', () => {
        render(<ProcedureForm onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        expect(screen.getByRole('heading', {name: 'Add Procedure'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create'})).toBeInTheDocument();
    });

    it('renders "Edit Procedure" heading when procedure is provided', () => {
        render(<ProcedureForm procedure={baseProcedure} onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        expect(screen.getByRole('heading', {name: 'Edit Procedure'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Update'})).toBeInTheDocument();
    });

    it('pre-populates fields from existing procedure', () => {
        render(<ProcedureForm procedure={baseProcedure} onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        expect(screen.getByDisplayValue('Oil Change')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Change the oil')).toBeInTheDocument();
        expect(screen.getByDisplayValue('90')).toBeInTheDocument();
    });

    it('shows equipment details section when equipment is provided', () => {
        render(<ProcedureForm equipment={baseEquipment} onSubmit={vi.fn()} onCancel={vi.fn()}/>);
        expect(screen.getByText('Equipment Details')).toBeInTheDocument();
        expect(screen.getByText('Acme X-100')).toBeInTheDocument();
    });

    it('calls onCancel when Cancel is clicked', async () => {
        const onCancel = vi.fn();
        render(<ProcedureForm onSubmit={vi.fn()} onCancel={onCancel}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('calls onSubmit with form data on submit', async () => {
        const onSubmit = vi.fn();
        const {container} = render(<ProcedureForm onSubmit={onSubmit} onCancel={vi.fn()}/>);

        const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
        const intervalInput = container.querySelector('input[name="intervalDays"]') as HTMLInputElement;
        await userEvent.type(nameInput, 'Tire Rotation');
        await userEvent.clear(intervalInput);
        await userEvent.type(intervalInput, '30');

        await userEvent.click(screen.getByRole('button', {name: 'Create'}));

        expect(onSubmit).toHaveBeenCalledOnce();
        const submitted = onSubmit.mock.calls[0][0];
        expect(submitted.name).toBe('Tire Rotation');
        expect(submitted.intervalDays).toBe(30);
    });

    it('calls onSubmit with id when editing existing procedure', async () => {
        const onSubmit = vi.fn();
        render(<ProcedureForm procedure={baseProcedure} onSubmit={onSubmit} onCancel={vi.fn()}/>);
        await userEvent.click(screen.getByRole('button', {name: 'Update'}));
        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onSubmit.mock.calls[0][0]).toMatchObject({id: 'p1'});
    });
});
