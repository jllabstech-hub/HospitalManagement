'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSpecialitySchema, CreateSpecialityInput, UpdateSpecialitySchema, UpdateSpecialityInput } from '../schemas';
import { createSpecialityAction, updateSpecialityAction, deleteSpecialityAction } from '../actions';
import Button from '@/components/ui/Button';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';
import { cmsRecordDescription, cmsRecordImageUrl, cmsRecordLabel, type CmsListRecord } from '@/features/cms/management-types';
import CmsImageRecordList from '@/features/cms-images/components/CmsImageRecordList';
import CmsImagePicker from '@/features/cms-images/components/CmsImagePicker';

const emptyForm = { name: '', shortDescription: '', fullDescription: '', seoTitle: '', imageUrl: '' };

interface SpecialityManagementProps {
  initialData: CmsListRecord[];
  currentPage?: number;
  totalPages?: number;
  totalSpecialities?: number;
  currentSearch?: string;
  currentLimit?: number;
  missingCount?: number;
}

export default function SpecialityManagement({
  initialData,
  currentPage = 1,
  totalPages = 1,
  totalSpecialities = initialData.length,
  currentSearch = '',
  currentLimit = 12,
  missingCount,
}: SpecialityManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [limitFilter, setLimitFilter] = useState(currentLimit);

  useEffect(() => {
    setLimitFilter(currentLimit);
  }, [currentLimit]);

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<CreateSpecialityInput | UpdateSpecialityInput>({
    resolver: zodResolver(editingId ? UpdateSpecialitySchema : CreateSpecialitySchema),
    defaultValues: emptyForm,
  });

  const editing = initialData.find((item) => item.id === editingId) ?? null;

  const applyFilters = (newSearch = currentSearch, page = 1, newLimit = limitFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set('search', newSearch); else params.delete('search');
    params.set('page', page.toString());
    params.set('limit', newLimit.toString());
    router.push(`/admin/specialities?${params.toString()}`);
  };

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
      reset(emptyForm);
      applyFilters(data.name.trim(), 1, limitFilter);
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  const editRecord = (record: CmsListRecord) => {
    setEditingId(record.id);
    reset({ ...record, imageUrl: cmsRecordImageUrl(record) || '' } as unknown as CreateSpecialityInput);
  };

  const deleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteSpecialityAction(id);
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded border bg-white p-4">
        <h3 className="font-bold">{editingId ? 'Edit' : 'Create'} Speciality</h3>
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
        <div>
          <label className="block text-sm">SEO Title</label>
          <input {...register('seoTitle')} className="w-full border p-2" />
        </div>
        <CmsImagePicker
          label="Speciality image"
          description="Drag and drop a photo, upload, or browse the library. This image appears on /specialities."
          value={watch('imageUrl')}
          onChange={(url) => setValue('imageUrl', url, { shouldDirty: true, shouldTouch: true })}
          title={watch('name')}
          contentType="SPECIALITY"
          recordId={editing?.id}
        />
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting}>{editingId ? 'Update' : 'Create'}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); reset(emptyForm); }}>Cancel</Button>}
        </div>
      </form>

      <div className="card-surface grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-12">
        <div className="sm:col-span-8">
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Search specialities</label>
          <InteractiveSearchInput
            placeholder="Type speciality name or description..."
            defaultValue={currentSearch}
          />
        </div>
        <div className="sm:col-span-4">
          <label className="mb-1 block text-xs font-semibold text-ink-muted" htmlFor="speciality-page-size">
            Entries per page
          </label>
          <select
            id="speciality-page-size"
            value={limitFilter}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setLimitFilter(newLimit);
              applyFilters(currentSearch, 1, newLimit);
            }}
            className="input-field !py-2 text-xs font-medium sm:text-sm"
          >
            <option value="6">6 entries</option>
            <option value="9">9 entries</option>
            <option value="12">12 entries</option>
            <option value="24">24 entries</option>
            <option value="48">48 entries</option>
          </select>
        </div>
      </div>

      <CmsImageRecordList
        contentType="SPECIALITY"
        records={initialData.map((item) => ({
          id: item.id,
          title: cmsRecordLabel(item),
          description: cmsRecordDescription(item),
          imageUrl: cmsRecordImageUrl(item),
        }))}
        missingCount={missingCount}
        fillAllMissing
        onEdit={(id) => {
          const record = initialData.find((item) => item.id === id);
          if (record) editRecord(record);
        }}
        onDelete={deleteRecord}
      />

      {initialData.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-card border border-[#dde5e9] bg-surface-muted p-4 text-xs text-ink-muted sm:flex-row">
          <span>
            Showing page {currentPage} of {totalPages} ({totalSpecialities} specialities)
          </span>
          <div className="flex space-x-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => applyFilters(currentSearch, currentPage - 1, limitFilter)}
              className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => applyFilters(currentSearch, currentPage + 1, limitFilter)}
              className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
