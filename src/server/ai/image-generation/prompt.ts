import type { ImageAspectRatio, ImageStyle } from './types';

export type CmsImagePromptType =
  | 'SPECIALITY'
  | 'DEPARTMENT'
  | 'CENTRE'
  | 'SERVICE'
  | 'HEALTH_PACKAGE'
  | 'FACILITY'
  | 'ARTICLE'
  | 'NEWS'
  | 'HOSPITAL_HERO';

export interface CmsImagePromptInput {
  type: CmsImagePromptType;
  title: string;
  description?: string | null;
  services?: string[];
  relatedNames?: string[];
  style?: ImageStyle;
  aspectRatio?: ImageAspectRatio;
}

const TYPE_FRAMING: Record<CmsImagePromptType, string> = {
  SPECIALITY:
    'Create one breathtaking photorealistic photograph representing this medical speciality for a premium hospital website speciality hero and card. The image must feel specific to this speciality, not a generic hospital stock shot.',
  DEPARTMENT:
    'Create a premium healthcare editorial image of a hospital department environment for a modern hospital website department page. Show a beautiful, lived-in clinical space that belongs to this department.',
  CENTRE:
    'Create a premium healthcare editorial image of an advanced clinical centre of excellence environment for a modern hospital website. The space should feel specialised, high-end, and reassuring.',
  SERVICE:
    'Create a premium healthcare editorial image representing this hospital service or treatment concept for a modern hospital website service card. Make the service instantly recognisable through environment and equipment, not text.',
  HEALTH_PACKAGE:
    'Create a premium healthcare editorial image representing a healthy lifestyle and preventive health check concept for a hospital health-package card. Warm, optimistic, and clinically trustworthy.',
  FACILITY:
    'Create a premium healthcare editorial image of a hospital facility and care environment for a modern hospital website. Architecture, light, and calm clinical detail should do the storytelling.',
  ARTICLE:
    'Create a conceptual editorial medical image for a hospital health-library article. Suggest the topic visually, not as an infographic.',
  NEWS:
    'Create a contextual healthcare editorial image for a hospital news story. Keep it calm, current, and suitable for a news card.',
  HOSPITAL_HERO:
    'Create a premium hospital homepage hero image: a modern, trustworthy hospital exterior or care environment with calm natural light, cinematic colour, and a wide welcoming composition.',
};

const STYLE_LANGUAGE: Record<ImageStyle, string> = {
  'medical-editorial':
    'Style: premium healthcare editorial photography, realistic but polished, magazine-quality, natural light, sophisticated hospital branding without logos. Shot like a National Geographic / healthcare magazine cover: 35mm cinematic look, shallow depth of field, rich colour grading, soft window light mixed with warm clinical fill, tack-sharp subject, creamy bokeh, no harsh flash.',
  'clinical-illustration':
    'Style: refined clinical illustration with photographic realism, tasteful medical visual cues, no labels, no diagrams with readable text. Keep it beautiful, luminous, and suitable for a hospital website.',
  'modern-hospital':
    'Style: contemporary hospital architecture and care spaces, clean lines, calm clinical interiors, trustworthy modern healthcare environment. Architectural photography quality, generous negative space, morning light through glass, premium materials.',
  'abstract-medical':
    'Style: abstract premium medical visual language using colour, light, and subtle anatomical suggestion. No text, no fake UI, no infographics. Elegant, high-end, and emotionally calm.',
};

const SHARED_CONSTRAINTS = [
  'Consistent visual language for one hospital website: premium, modern, clean, trustworthy, professional.',
  'Photorealistic beauty is required: balanced exposure, true-to-life skin and materials, no plastic CGI look, no watermarks, no collage.',
  'Subtle medical visual cues only. No excessive medical gore, blood, trauma, or frightening imagery.',
  'No identifiable patient faces or recognisable individuals. Faces may be turned away, cropped, or softly out of focus. No hospital logos, brand names, or brand-specific claims.',
  'No embedded text, titles, captions, statistics, signage, or fake user interfaces. The website supplies all copy.',
  'Do not generate a literal infographic unless the scene naturally includes unreadable distant charts.',
].join(' ');

const VISUAL_CUES: Array<{ match: RegExp; cue: string }> = [
  {
    match: /cardio|heart|cardiac|vascular/i,
    cue: 'Include subtle cardiovascular cues such as a calm cardiac care setting, ECG traces as environmental detail, or a heart-health clinical environment. Suggest a cath-lab glow, echocardiography room, or a consultant reviewing a heartbeat waveform on a monitor in the background.',
  },
  {
    match: /neuro|brain|stroke|spine/i,
    cue: 'Include subtle neurological cues such as a quiet neuro clinic, brain-care environment, or neural imaging as background context. Soft MRI suite lighting or a calm spine-care consultation space works well.',
  },
  {
    match: /ortho|bone|joint|sports med|musculo/i,
    cue: 'Include subtle musculoskeletal cues such as joint-care, mobility, or orthopaedic clinical environment details. A bright physio-adjacent clinic, joint model on a desk, or post-operative mobility space.',
  },
  {
    match: /oncol|cancer|tumou?r/i,
    cue: 'Include subtle oncology cues such as a calm infusion or cancer-care environment, never frightening imagery. Warm daylight, comfortable chairs, quiet dignity.',
  },
  {
    match: /gastro|digest|liver|hepat|endoscop/i,
    cue: 'Include subtle digestive-care cues such as a gastroenterology clinic or abdominal diagnostic environment. Clean endoscopy suite atmosphere without graphic procedures.',
  },
  {
    match: /derma|skin|cosmet/i,
    cue: 'Include subtle dermatology cues such as a clean skin-care clinic with calm lighting, never graphic skin disease close-ups.',
  },
  {
    match: /paediat|pediat|child|neonat|nicu/i,
    cue: 'Include a warm paediatric care environment. Do not show identifiable children; keep faces unseen or out of frame. Soft colours, gentle light, reassuring paediatric clinic details.',
  },
  {
    match: /emergenc|trauma|icu|critical/i,
    cue: 'Include a composed emergency or critical-care environment. No gore, no distress, no graphic injuries. Organised trauma bay or ICU with calm staff silhouettes.',
  },
  {
    match: /pulmon|respirat|lung|chest|asthma/i,
    cue: 'Include a calm respiratory-care setting: pulmonary clinic, spirometry room, or a softly lit chest-medicine consultation space.',
  },
  {
    match: /nephro|kidney|dialys|urolog|renal/i,
    cue: 'Include a serene nephrology or urology care environment: dialysis suite calm, or a specialist consultation room with soft clinical lighting.',
  },
  {
    match: /ophthal|eye|retina|vision/i,
    cue: 'Include an ophthalmology clinic with a slit-lamp or eye-exam setting, beautiful bokeh, no identifiable faces.',
  },
  {
    match: /dental|dentist|oral/i,
    cue: 'Include a premium dental operatory with clean lines, soft light, and unoccupied treatment chair. No graphic dentistry.',
  },
  {
    match: /gynaec|gynec|obstetric|maternity|pregnan|women/i,
    cue: 'Include a warm maternity or women\'s health clinic. No identifiable faces, no graphic medical procedures, calm and dignified.',
  },
  {
    match: /radiol|mri|ct |imaging|x-?ray|ultrasound/i,
    cue: 'Include a sophisticated diagnostic imaging suite: MRI, CT, or ultrasound room with cinematic lighting and a sense of advanced technology.',
  },
  {
    match: /ent|otolaryng|ear|nose|throat/i,
    cue: 'Include an ENT clinic with specialised examination equipment as quiet background detail, never graphic.',
  },
];

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function visualCueFor(title: string, description?: string | null): string {
  const haystack = `${title} ${description ?? ''}`;
  const matched = VISUAL_CUES.filter((entry) => entry.match.test(haystack)).map((entry) => entry.cue);
  if (matched.length > 0) return matched.join(' ');
  return `Visually represent the concept of "${title}" with tasteful, specific clinical cues so it does not look identical to other hospital speciality images. Invent a distinctive, beautiful scene that could only belong to ${title}.`;
}

function aspectInstruction(aspectRatio: ImageAspectRatio): string {
  return aspectRatio === '1:1'
    ? 'Compose for a square 1:1 frame with the subject centered and generous safe margins.'
    : 'Compose for a wide 16:9 landscape frame suitable for a website hero or card, with important content away from the edges.';
}

export function buildCmsImageAltText(input: Pick<CmsImagePromptInput, 'type' | 'title'>): string {
  const title = input.title.trim() || 'Hospital care';
  const lower = title.toLowerCase();
  if (input.type === 'SPECIALITY' || input.type === 'DEPARTMENT') {
    if (/cardio|heart|cardiac/.test(lower)) return `${title} and cardiovascular care`;
    if (/neuro|brain/.test(lower)) return `${title} and brain care`;
    if (/ortho|bone|joint/.test(lower)) return `${title} and bone and joint care`;
    if (/oncol|cancer/.test(lower)) return `${title} and cancer care`;
    if (/gastro|digest/.test(lower)) return `${title} and digestive care`;
    if (/derma|skin/.test(lower)) return `${title} and skin care`;
  }
  switch (input.type) {
    case 'SPECIALITY':
      return `${title} and specialist care`;
    case 'DEPARTMENT':
      return `${title} hospital department`;
    case 'CENTRE':
      return `${title} centre of excellence`;
    case 'SERVICE':
      return `${title} hospital service`;
    case 'HEALTH_PACKAGE':
      return `${title} health check package`;
    case 'FACILITY':
      return `${title} hospital facility`;
    case 'ARTICLE':
    case 'NEWS':
      return title;
    case 'HOSPITAL_HERO':
      return `${title} hospital`;
    default:
      return title;
  }
}

export function buildCmsImagePrompt(input: CmsImagePromptInput): string {
  const title = input.title.trim();
  if (!title) {
    throw new Error('A CMS title is required to build an image prompt.');
  }

  const style = input.style ?? 'medical-editorial';
  const aspectRatio = input.aspectRatio ?? '16:9';
  const description = input.description?.trim();
  const related = uniqueNonEmpty([...(input.services ?? []), ...(input.relatedNames ?? [])]);

  const parts = [
    TYPE_FRAMING[input.type],
    `Subject: ${title}.`,
    description ? `Context from the hospital CMS: ${description.slice(0, 400)}` : null,
    related.length > 0 ? `Related clinical context: ${related.slice(0, 8).join(', ')}.` : null,
    visualCueFor(title, description),
    STYLE_LANGUAGE[style],
    aspectInstruction(aspectRatio),
    SHARED_CONSTRAINTS,
    'Output a single finished photograph only.',
  ];

  return parts.filter(Boolean).join(' ');
}
