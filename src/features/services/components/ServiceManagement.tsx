'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateServiceSchema, CreateServiceInput, UpdateServiceSchema, UpdateServiceInput } from '../schemas';
import { createServiceAction, updateServiceAction, deleteServiceAction } from '../actions';
import Button from '@/components/ui/Button';
import { cmsRecordDescription, cmsRecordImageUrl, cmsRecordLabel, type CmsListRecord } from '@/features/cms/management-types';
import CmsImageRecordList from '@/features/cms-images/components/CmsImageRecordList';
import CmsImagePicker from '@/features/cms-images/components/CmsImagePicker';

const emptyForm = { name: '', shortDescription: '', fullDescription: '', imageUrl: '' };

export default function ServiceManagement({ initialData }: { initialData: CmsListRecord[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<CreateServiceInput | UpdateServiceInput>({
    resolver: zodResolver(editingId ? UpdateServiceSchema : CreateServiceSchema),
    defaultValues: emptyForm,
  });

  const editing = initialData.find((item) => item.id === editingId) ?? null;

  const onSubmit = async (data: CreateServiceInput) => {
    setError('');
    const res = editingId
      ? await updateServiceAction({ ...data, id: editingId })
      : await createServiceAction(data);
    if (res.success) {
      setEditingId(null);
      reset(emptyForm);
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded border bg-white p-4">
        <h3 className="font-bold">{editingId ? 'Edit' : 'Create'} Service</h3>
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <label className="block text-sm">Name</label>
          <input {...register('name')} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm">Short Description</label>
          <input {...register('shortDescription')} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm">Full Description</label>
          <input {...register('fullDescription')} className="w-full border p-2" />
        </div>
        <CmsImagePicker
          label="Service image"
          description="This image appears on public service listings."
          value={watch('imageUrl')}
          onChange={(url) => setValue('imageUrl', url)}
          title={watch('name')}
          contentType="SERVICE"
          recordId={editing?.id}
        />
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting}>{editingId ? 'Update' : 'Create'}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); reset(emptyForm); }}>Cancel</Button>}
        </div>
      </form>

      <CmsImageRecordList
        contentType="SERVICE"
        records={initialData.map((item) => ({
          id: item.id,
          title: cmsRecordLabel(item),
          description: cmsRecordDescription(item),
          imageUrl: cmsRecordImageUrl(item),
        }))}
        onEdit={(id) => {
          const record = initialData.find((item) => item.id === id);
          if (!record) return;
          setEditingId(record.id);
          reset({ ...record, imageUrl: cmsRecordImageUrl(record) || '' } as unknown as CreateServiceInput);
        }}
        onDelete={async (id) => {
          if (confirm('Are you sure you want to delete this record?')) await deleteServiceAction(id);
        }}
      />
    </div>
  );
}
