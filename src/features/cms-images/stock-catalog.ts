export interface StockImage {
  id: string;
  url: string;
  alt: string;
  keywords: string[];
}

function photo(id: string, alt: string, keywords: string[]): StockImage {
  return {
    id,
    url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`,
    alt,
    keywords: keywords.map((keyword) => keyword.toLowerCase()),
  };
}

export const CMS_STOCK_IMAGES: StockImage[] = [
  photo('photo-1519494026892-80bbd2d6fd0d', 'Hospital campus exterior', [
    'hospital', 'campus', 'building', 'default', 'general', 'about',
  ]),
  photo('photo-1586773860418-d37222d8fce3', 'Hospital corridor and nursing station', [
    'hospital', 'corridor', 'ward', 'nursing', 'inpatient', 'facility',
  ]),
  photo('photo-1631217868264-e5b90bb7e305', 'Cardiology ECG and heart monitoring', [
    'cardiology', 'cardiac', 'heart', 'ecg', 'echo', 'cath',
  ]),
  photo('photo-1628348068343-c6a848d2b6dd', 'Anatomical heart model', [
    'cardiology', 'cardiac', 'heart', 'vascular',
  ]),
  photo('photo-1559757175-5700dde675bc', 'Neurology brain imaging review', [
    'neurology', 'neuro', 'brain', 'stroke', 'neurosurgery',
  ]),
  photo('photo-1530497610245-94d3c16cda28', 'MRI scanner', [
    'radiology', 'mri', 'imaging', 'scan', 'diagnostic',
  ]),
  photo('photo-1530026405186-ed1f139313f8', 'X-ray imaging', [
    'radiology', 'xray', 'orthopaedics', 'orthopedics', 'bone', 'joint',
  ]),
  photo('photo-1579684385127-1ef15d508118', 'Surgical team in an operating theatre', [
    'surgery', 'surgical', 'theatre', 'operation', 'general surgery',
  ]),
  photo('photo-1551601651-2a8555f1a136', 'Close surgical procedure', [
    'surgery', 'laparoscopic', 'robotic', 'minimally',
  ]),
  photo('photo-1579684453423-f84349ef60b0', 'Operating room team', [
    'surgery', 'anaesthesia', 'anesthesia', 'theatre',
  ]),
  photo('photo-1579154204601-01588f351e67', 'Pathology laboratory work', [
    'pathology', 'lab', 'laboratory', 'diagnostics', 'blood',
  ]),
  photo('photo-1582719471384-894fbb16e074', 'Clinical laboratory scientist', [
    'lab', 'diagnostics', 'pathology', 'sample',
  ]),
  photo('photo-1505751171710-1f6d0ace5a85', 'Emergency ambulance arrival', [
    'emergency', 'trauma', 'ambulance', 'critical', 'icu', 'intensive',
  ]),
  photo('photo-1551076805-e1869033fa91', 'Hospital ward and patient care', [
    'ward', 'nursing', 'inpatient', 'facility', 'beds',
  ]),
  photo('photo-1512678080530-7760d81faba6', 'Hospital beds and recovery ward', [
    'ward', 'recovery', 'inpatient', 'beds', 'facility',
  ]),
  photo('photo-1666214280557-f1b5022eb634', 'Outpatient consultation', [
    'consultation', 'opd', 'clinic', 'physician', 'general medicine', 'internal',
  ]),
  photo('photo-1576091160399-112ba8d25d1d', 'Doctor reviewing digital records', [
    'consultation', 'telehealth', 'records', 'general',
  ]),
  photo('photo-1559839734-2b71ea197ec2', 'Consultant physician', [
    'doctor', 'consultant', 'physician', 'medicine',
  ]),
  photo('photo-1571772996211-2f02c9727629', 'Paediatric care', [
    'paediatric', 'pediatric', 'child', 'children', 'neonatal', 'nicu',
  ]),
  photo('photo-1489710437720-ebb67ec84f4b', 'Maternity and pregnancy care', [
    'maternity', 'obstetric', 'gynaecology', 'gynecology', 'pregnancy', 'women',
  ]),
  photo('photo-1606811841689-23dfddce3e95', 'Dental treatment', [
    'dental', 'dentistry', 'tooth', 'oral',
  ]),
  photo('photo-1588776814546-1ffcf472b00e', 'Dental clinic chair', [
    'dental', 'dentistry', 'oral',
  ]),
  photo('photo-1511174511562-5f7f18b874fe', 'Ophthalmology eye examination', [
    'ophthalmology', 'eye', 'vision', 'retina',
  ]),
  photo('photo-1571019614242-c5c5dee9f50b', 'Physiotherapy and rehabilitation', [
    'physiotherapy', 'rehab', 'rehabilitation', 'sports', 'orthopaedics', 'orthopedics',
  ]),
  photo('photo-1580281658626-ee379f0c0bc4', 'Hospital pharmacy', [
    'pharmacy', 'medicine', 'drug', 'prescription',
  ]),
  photo('photo-1587854693227-21d4e0ec82d4', 'Medicines and health package screening', [
    'package', 'screening', 'wellness', 'health check', 'pharmacy',
  ]),
  photo('photo-1551601651-bc60f254d532', 'Oncology and infusion care', [
    'oncology', 'cancer', 'chemo', 'tumour', 'tumor',
  ]),
  photo('photo-1581595220892-b0739db3b8c5', 'Ultrasound diagnostic scan', [
    'ultrasound', 'sonography', 'radiology', 'gynaecology', 'gynecology',
  ]),
  photo('photo-1516549655169-df83a0774514', 'Hospital lobby and patient services', [
    'services', 'lobby', 'reception', 'patient', 'international',
  ]),
  photo('photo-1498837166121-c90795e4b69e', 'Nutrition and wellness', [
    'nutrition', 'diet', 'wellness', 'package', 'lifestyle',
  ]),
  photo('photo-1576091160550-2173dba999ef', 'Multidisciplinary clinical meeting', [
    'centre', 'center', 'excellence', 'team', 'multidisciplinary',
  ]),
  photo('photo-1631815588090-d4bfec5b1ccb', 'Gastroenterology and endoscopy setting', [
    'gastro', 'gastroenterology', 'endoscopy', 'liver', 'digestive',
  ]),
  photo('photo-1584432810601-6c7f27d2362b', 'Pulmonology and respiratory care', [
    'pulmonology', 'respiratory', 'lung', 'chest', 'covid',
  ]),
  photo('photo-1666214282291-2d0d1ddf3e5c', 'Nephrology and urology consultation', [
    'nephrology', 'kidney', 'dialysis', 'urology', 'renal',
  ]),
  photo('photo-1559757148-5c350d0d3c56', 'Dermatology clinical assessment', [
    'dermatology', 'skin', 'cosmetic', 'plastic',
  ]),
  photo('photo-1544367567-0f2fcb009e0b', 'Wellness and lifestyle medicine', [
    'wellness', 'lifestyle', 'yoga', 'preventive',
  ]),
];

const DEFAULT_STOCK = CMS_STOCK_IMAGES[0];

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function scoreImage(image: StockImage, haystack: string, queryTokens: string[]): number {
  let score = 0;
  for (const keyword of image.keywords) {
    if (haystack.includes(keyword)) {
      score += keyword.includes(' ') ? 6 : 3;
    }
  }
  for (const token of queryTokens) {
    if (image.keywords.includes(token) || image.alt.toLowerCase().includes(token)) {
      score += 2;
    }
  }
  return score;
}

export function searchStockImages(query: string, limit = 24): StockImage[] {
  const trimmed = query.trim();
  if (!trimmed) return CMS_STOCK_IMAGES.slice(0, limit);
  const queryTokens = tokens(trimmed);
  const haystack = trimmed.toLowerCase();
  return [...CMS_STOCK_IMAGES]
    .map((image) => ({ image, score: scoreImage(image, haystack, queryTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.image);
}

export function matchStockImage(title: string, description?: string | null): StockImage {
  const haystack = `${title} ${description || ''}`.toLowerCase();
  const queryTokens = tokens(haystack);
  let best = DEFAULT_STOCK;
  let bestScore = 0;
  for (const image of CMS_STOCK_IMAGES) {
    const score = scoreImage(image, haystack, queryTokens);
    if (score > bestScore) {
      best = image;
      bestScore = score;
    }
  }
  return best;
}

export function isCatalogImageUrl(url: string): boolean {
  const normalized = url.trim();
  return CMS_STOCK_IMAGES.some((image) => normalized === image.url || normalized.startsWith(`${image.url.split('?')[0]}?`));
}
