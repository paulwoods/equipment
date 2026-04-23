import type {ChangeEvent, FormEvent} from 'react';
import React, {useMemo, useState} from 'react';
import type {Procedure} from '../types/procedure';
import type {Equipment} from '../types/equipment';
import SimpleMDE from 'react-simplemde-editor';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';

interface ProcedureFormProps {
  equipment?: Equipment;
  procedure?: Procedure;
  onSubmit: (data: Omit<Procedure, 'id'> | Procedure) => void;
  onCancel: () => void;
}

export const ProcedureForm = ({equipment, procedure, onSubmit, onCancel}: ProcedureFormProps): React.JSX.Element => {
  const [formData, setFormData] = useState<Omit<Procedure, 'id'>>({
    name: procedure?.name ?? '',
    description: procedure?.description ?? '',
    steps: procedure?.steps ?? '',
    requiredTools: procedure?.requiredTools ?? '',
    intervalDays: procedure?.intervalDays ?? 0,
  });

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Enter steps here...',
    status: false,
  }), []);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (procedure) {
      onSubmit({...formData, id: procedure.id} as Procedure);
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const {name, value} = e.target;
    if (name === 'intervalDays') {
      setFormData((prev) => ({...prev, [name]: parseInt(value) || 0}));
    } else {
      setFormData((prev) => ({...prev, [name]: value}));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 rounded-lg border"
      style={{background: 'var(--card)', borderColor: 'var(--border)'}}
    >
      {equipment && (
        <div className="p-4 rounded-md border" style={{background: 'var(--muted)', borderColor: 'var(--border)'}}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: 'var(--muted-foreground)'}}>
            Equipment Details
          </h3>
          <div className="text-sm font-bold" style={{color: 'var(--card-foreground)'}}>
            {equipment.manufacturer} {equipment.modelNumber}
          </div>
          {equipment.description && (
            <div className="text-sm mt-1" style={{color: 'var(--muted-foreground)'}}>{equipment.description}</div>
          )}
        </div>
      )}

      <h2 className="text-xl font-bold" style={{color: 'var(--card-foreground)'}}>
        {procedure ? 'Edit Procedure' : 'Add Procedure'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intervalDays">Interval (Days)</Label>
          <Input id="intervalDays" type="number" name="intervalDays" value={formData.intervalDays} onChange={handleChange} required min="0" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Label>Required Tools / PPE</Label>
          <SimpleMDE
            value={formData.requiredTools}
            onChange={(value) => setFormData((prev) => ({...prev, requiredTools: value}))}
            options={{...mdeOptions, placeholder: 'e.g., "10mm wrench", "Multimeter", "Safety glasses"'}}
          />
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Label>Procedure Steps</Label>
          <SimpleMDE
            value={formData.steps}
            onChange={(value) => setFormData((prev) => ({...prev, steps: value}))}
            options={mdeOptions}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t" style={{borderColor: 'var(--border)'}}>
        <Button type="button" variant="outline" onClick={onCancel} className="order-2 sm:order-1">
          Cancel
        </Button>
        <Button type="submit" className="order-1 sm:order-2">
          {procedure ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
