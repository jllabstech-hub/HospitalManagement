'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateInsurancePartnerSchema,
  CreateInsurancePartnerInput,
  UpdateInsurancePartnerSchema,
  UpdateInsurancePartnerInput,
} from '../schemas';
import {
  createInsurancePartnerAction,
  updateInsurancePartnerAction,
  deleteInsurancePartnerAction,
} from '../actions';
import Button from '@/components/ui/Button';
import { cmsRecordLabel, type CmsListRecord } from '@/features/cms/management-types';

export default function InsurancePartnerManagement({ initialData }: { initialData: CmsListRecord[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateInsurancePartnerInput | UpdateInsurancePartnerInput>({
    resolver: zodResolver(editingId ? UpdateInsurancePartnerSchema : CreateInsurancePartnerSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data: CreateInsurancePartnerInput) => {
    setError('');
    const res = editingId
      ? await updateInsurancePartnerAction({ ...data, id: editingId })
      : await createInsurancePartnerAction(data);
    if (res.success) {
      setEditingId(null);
      reset({ name: '', description: '' });
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded bg-white">
        <h3 className="font-bold">{editingId ? 'Edit' : 'Create'} Insurance Partner</h3>
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <label className="block text-sm">Name</label>
          <input {...register('name')} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Description</label>
          <textarea {...register('description')} className="border p-2 w-full" rows={3} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting}>{editingId ? 'Update' : 'Create'}</Button>
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
                  reset({ ...item } as unknown as CreateInsurancePartnerInput);
                }}
                className="text-brand-600 text-sm"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this record?')) {
                    await deleteInsurancePartnerAction(item.id);
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
