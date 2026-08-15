'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateFacilitySchema,
  CreateFacilityInput,
  UpdateFacilitySchema,
  UpdateFacilityInput,
} from '../schemas';
import { createFacilityAction, updateFacilityAction, deleteFacilityAction } from '../actions';
import Button from '@/components/ui/Button';
import { cmsRecordLabel, type CmsListRecord } from '@/features/cms/management-types';

export default function FacilityManagement({ initialData }: { initialData: CmsListRecord[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset } = useForm<CreateFacilityInput | UpdateFacilityInput>({
    resolver: zodResolver(editingId ? UpdateFacilitySchema : CreateFacilitySchema),
    defaultValues: { name: '', category: '', description: '' },
  });

  const onSubmit = async (data: CreateFacilityInput) => {
    setError('');
    const res = editingId
      ? await updateFacilityAction({ ...data, id: editingId })
      : await createFacilityAction(data);
    if (res.success) {
      setEditingId(null);
      reset({ name: '', category: '', description: '' });
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded bg-white">
        <h3 className="font-bold">{editingId ? 'Edit' : 'Create'} Facility</h3>
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <label className="block text-sm">Name</label>
          <input {...register('name')} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Category</label>
          <input {...register('category')} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Description</label>
          <textarea {...register('description')} className="border p-2 w-full" rows={3} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
          {editingId && (
            <Button variant="outline" onClick={() => { setEditingId(null); reset(); }}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialData.map((item) => (
          <div key={item.id} className="p-4 border rounded bg-white">
            <h4 className="font-bold">{cmsRecordLabel(item)}</h4>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setEditingId(item.id);
                  reset({ ...item } as unknown as CreateFacilityInput);
                }}
                className="text-brand-600 text-sm"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this record?')) {
                    await deleteFacilityAction(item.id);
                  }
                }}
                className="text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
