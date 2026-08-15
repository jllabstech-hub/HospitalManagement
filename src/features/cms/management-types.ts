export type CmsListRecord = {
  id: string;
  name?: string | null;
  title?: string | null;
  question?: string | null;
};

export function cmsRecordLabel(record: CmsListRecord): string {
  return record.title || record.name || record.question || 'Record';
}
