import type {ChangeEvent, FormEvent} from 'react';
import React, {useState} from 'react';
import type {Equipment} from '../types/equipment';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (data: Omit<Equipment, 'id'> | Equipment) => void;
  onCancel: () => void;
}

export const EquipmentForm = ({equipment, onSubmit, onCancel}: EquipmentFormProps): React.JSX.Element => {
  const [formData, setFormData] = useState({
    manufacturer: equipment?.manufacturer ?? '',
    modelNumber: equipment?.modelNumber ?? '',
    serialNumber: equipment?.serialNumber ?? '',
    assetTag: equipment?.assetTag ?? '',
    location: equipment?.location ?? '',
    status: equipment?.status ?? 'Active' as Equipment['status'],
    description: equipment?.description ?? '',
    purchaseDate: equipment?.purchaseDate
      ? equipment.purchaseDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (equipment) {
      onSubmit({...formData, id: equipment.id} as Equipment);
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 rounded-lg border"
      style={{background: 'var(--card)', borderColor: 'var(--border)'}}
    >
      <h2 className="text-xl font-bold" style={{color: 'var(--card-foreground)'}}>
        {equipment ? 'Edit Equipment' : 'Add Equipment'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input id="manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modelNumber">Model Number</Label>
          <Input id="modelNumber" name="modelNumber" value={formData.modelNumber} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input id="serialNumber" name="serialNumber" value={formData.serialNumber} onChange={handleChange} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assetTag">Asset Tag</Label>
          <Input id="assetTag" name="assetTag" value={formData.assetTag} onChange={handleChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" value={formData.location} onChange={handleChange} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({...prev, status: value as Equipment['status']}))}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="In Use">In Use</SelectItem>
              <SelectItem value="Under Repair">Under Repair</SelectItem>
              <SelectItem value="Decommissioned">Decommissioned</SelectItem>
              <SelectItem value="In Storage">In Storage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purchaseDate">Purchase Date</Label>
        <Input id="purchaseDate" type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t" style={{borderColor: 'var(--border)'}}>
        <Button type="button" variant="outline" onClick={onCancel} className="order-2 sm:order-1">
          Cancel
        </Button>
        <Button type="submit" className="order-1 sm:order-2">
          {equipment ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
