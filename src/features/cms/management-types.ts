export type CmsListRecord = {
  id: string;
  name?: string | null;
  title?: string | null;
  question?: string | null;
  slug?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  excerpt?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  heroImageUrl?: string | null;
};

export function cmsRecordLabel(record: CmsListRecord): string {
  return record.title || record.name || record.question || 'Record';
}

export function cmsRecordImageUrl(record: CmsListRecord): string | null {
  return record.imageUrl || record.coverImageUrl || record.heroImageUrl || null;
}

export function cmsRecordDescription(record: CmsListRecord): string | null {
  return record.shortDescription || record.description || record.excerpt || null;
}
