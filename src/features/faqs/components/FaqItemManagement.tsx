'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFaqItemSchema, CreateFaqItemInput, UpdateFaqItemSchema, UpdateFaqItemInput } from '../schemas';
import { createFaqItemAction, updateFaqItemAction, deleteFaqItemAction } from '../actions';
import Button from '@/components/ui/Button';

export default function FaqItemManagement({ initialData }: { initialData: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, reset } = useForm<CreateFaqItemInput | UpdateFaqItemInput>({
    resolver: zodResolver(editingId ? UpdateFaqItemSchema : CreateFaqItemSchema),
    defaultValues: { question: '', answer: '', category: '' },
  });

  const onSubmit = async (data: any) => {
    setError('');
    let res;
    if (editingId) {
      res = await updateFaqItemAction({ ...data, id: editingId });
    } else {
      res = await createFaqItemAction(data);
    }
    if (res.success) {
      setEditingId(null);
      reset({ question: '', answer: '', category: '' });
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  const editRecord = (record: any) => {
    setEditingId(record.id);
    reset({ ...record });
  };

  const deleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteFaqItemAction(id);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded bg-white">
        <h3 className="font-bold">{editingId ? 'Edit' : 'Create'} FaqItem</h3>
        {error && <p className="text-red-500">{error}</p>}
        
        <div>
          <label className="block text-sm">Question</label>
          <input {...register('question')} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Answer</label>
          <input {...register('answer')} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Category</label>
          <input {...register('category')} className="border p-2 w-full" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); reset(); }}>Cancel</Button>}
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialData.map((item) => (
          <div key={item.id} className="p-4 border rounded bg-white">
            <h4 className="font-bold">{item.title || item.name || item.question || 'Record'}</h4>
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
