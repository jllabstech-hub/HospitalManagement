'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateNewsArticleSchema, CreateNewsArticleInput, UpdateNewsArticleSchema, UpdateNewsArticleInput } from '../schemas';
import { createNewsArticleAction, updateNewsArticleAction, deleteNewsArticleAction } from '../actions';
import Button from '@/components/ui/Button';
import { cmsRecordDescription, cmsRecordImageUrl, cmsRecordLabel, type CmsListRecord } from '@/features/cms/management-types';
import CmsImageRecordList from '@/features/cms-images/components/CmsImageRecordList';
import CmsImagePicker from '@/features/cms-images/components/CmsImagePicker';

const emptyForm = { title: '', excerpt: '', content: '', coverImageUrl: '' };

export default function NewsArticleManagement({ initialData }: { initialData: CmsListRecord[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<CreateNewsArticleInput | UpdateNewsArticleInput>({
    resolver: zodResolver(editingId ? UpdateNewsArticleSchema : CreateNewsArticleSchema),
    defaultValues: emptyForm,
  });

  const editing = initialData.find((item) => item.id === editingId) ?? null;

  const onSubmit = async (data: CreateNewsArticleInput) => {
    setError('');
    const res = editingId
      ? await updateNewsArticleAction({ ...data, id: editingId })
      : await createNewsArticleAction(data);
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
        <h3 className="font-bold">{editingId ? 'Edit' : 'Create'} NewsArticle</h3>
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <label className="block text-sm">Title</label>
          <input {...register('title')} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm">Excerpt</label>
          <input {...register('excerpt')} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm">Content</label>
          <input {...register('content')} className="w-full border p-2" />
        </div>
        <CmsImagePicker
          label="News cover image"
          description="This image appears on news listings and article pages."
          value={watch('coverImageUrl')}
          onChange={(url) => setValue('coverImageUrl', url)}
          title={watch('title')}
          contentType="NEWS"
          recordId={editing?.id}
        />
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting}>{editingId ? 'Update' : 'Create'}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); reset(emptyForm); }}>Cancel</Button>}
        </div>
      </form>

      <CmsImageRecordList
        contentType="NEWS"
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
          reset({ ...record, coverImageUrl: cmsRecordImageUrl(record) || '' } as unknown as CreateNewsArticleInput);
        }}
        onDelete={async (id) => {
          if (confirm('Are you sure you want to delete this record?')) await deleteNewsArticleAction(id);
        }}
      />
    </div>
  );
}
