'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSpecialitySchema, CreateSpecialityInput, UpdateSpecialitySchema, UpdateSpecialityInput } from '../schemas';
import { createSpecialityAction, updateSpecialityAction, deleteSpecialityAction } from '../actions';
import Button from '@/components/ui/Button';
import { cmsRecordLabel, type CmsListRecord } from '@/features/cms/management-types';

export default function SpecialityManagement({ initialData }: { initialData: CmsListRecord[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateSpecialityInput | UpdateSpecialityInput>({
    resolver: zodResolver(editingId ? UpdateSpecialitySchema : CreateSpecialitySchema),
    defaultValues: { name: '', shortDescription: '', fullDescription: '', seoTitle: '' },
  });

  const onSubmit = async (data: CreateSpecialityInput) => {
    setError('');
    let res;
    if (editingId) {
      res = await updateSpecialityAction({ ...data, id: editingId });
    } else {
      res = await createSpecialityAction(data);
    }
    if (res.success) {
      setEditingId(null);
      reset({ name: '', shortDescription: '', fullDescription: '', seoTitle: '' });
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  const editRecord = (record: CmsListRecord) => {
    setEditingId(record.id);
    reset({ ...record } as unknown as CreateSpecialityInput);
  };

  const deleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteSpecialityAction(id);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded bg-white">
        <h3 className="font-bold">{editingId ? 'Edit' : 'Create'} Speciality</h3>
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <label className="block text-sm">Name</label>
          <input {...register('name')} className="border p-2 w-full" />
        </div>
        
        <div>
          <label className="block text-sm">Short Description</label>
          <input {...register('shortDescription')} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Full Description</label>
          <input {...register('fullDescription')} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">SEO Title</label>
          <input {...register('seoTitle')} className="border p-2 w-full" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting}>{editingId ? 'Update' : 'Create'}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); reset(); }}>Cancel</Button>}
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialData.map((item) => (
          <div key={item.id} className="p-4 border rounded bg-white">
            <h4 className="font-bold">{cmsRecordLabel(item)}</h4>
            <div className="mt-4 flex gap-2">
              <button onClick={() => editRecord(item)} className="text-brand-600 text-sm">Edit</button>
              <button onClick={() => deleteRecord(item.id)} className="text-red-600 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
