'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InternationalPageSchema, InternationalPageInput } from '../schemas';
import { upsertInternationalPageAction } from '../actions';
import Button from '@/components/ui/Button';

export default function InternationalPageForm({ initialData }: { initialData: InternationalPageInput }) {
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit } = useForm<InternationalPageInput>({
    resolver: zodResolver(InternationalPageSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: InternationalPageInput) => {
    setError('');
    setSaved(false);
    const res = await upsertInternationalPageAction(data);
    if (res.success) {
      setSaved(true);
    } else {
      setError(res.error || 'Save failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded bg-white">
      <h3 className="font-bold">International Patient Desk</h3>
      {error && <p className="text-red-500">{error}</p>}
      {saved && <p className="text-green-700">Saved. Refresh the public page to preview.</p>}
      <div>
        <label className="block text-sm">Title</label>
        <input {...register('title')} className="border p-2 w-full" />
      </div>
      <div>
        <label className="block text-sm">Introduction</label>
        <textarea {...register('introduction')} className="border p-2 w-full" rows={3} />
      </div>
      <div>
        <label className="block text-sm">How to request care</label>
        <textarea {...register('howToRequest')} className="border p-2 w-full" rows={3} />
      </div>
      <div>
        <label className="block text-sm">Second opinion</label>
        <textarea {...register('secondOpinion')} className="border p-2 w-full" rows={3} />
      </div>
      <div>
        <label className="block text-sm">Required documents</label>
        <textarea {...register('requiredDocuments')} className="border p-2 w-full" rows={3} />
      </div>
      <div>
        <label className="block text-sm">Travel information</label>
        <textarea {...register('travelInformation')} className="border p-2 w-full" rows={3} />
      </div>
      <div>
        <label className="block text-sm">Accommodation</label>
        <textarea {...register('accommodationInfo')} className="border p-2 w-full" rows={3} />
      </div>
      <div>
        <label className="block text-sm">Coordinator contact</label>
        <input {...register('coordinatorContact')} className="border p-2 w-full" />
      </div>
      <Button type="submit">Save page content</Button>
    </form>
  );
}
