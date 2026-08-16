import { describe, expect, it } from 'vitest';
import { buildCmsImageAltText, buildCmsImagePrompt } from '../prompt';

describe('buildCmsImagePrompt', () => {
  it('builds a speciality prompt from CMS content instead of a title-only request', () => {
    const prompt = buildCmsImagePrompt({
      type: 'SPECIALITY',
      title: 'Cardiology',
      description: 'Heart and cardiovascular care for outpatient consultations.',
      services: ['ECG', 'Echo'],
    });

    expect(prompt).toContain('Cardiology');
    expect(prompt).toContain('Heart and cardiovascular care');
    expect(prompt).toContain('ECG');
    expect(prompt.toLowerCase()).toContain('cardiovascular');
    expect(prompt).not.toMatch(/^Generate an image of Cardiology\.?$/i);
    expect(prompt).toContain('No embedded text');
    expect(prompt).toContain('16:9');
  });

  it('adapts framing for department, service, and package content', () => {
    const department = buildCmsImagePrompt({ type: 'DEPARTMENT', title: 'Emergency Medicine' });
    const service = buildCmsImagePrompt({ type: 'SERVICE', title: 'MRI Diagnostics' });
    const pkg = buildCmsImagePrompt({ type: 'HEALTH_PACKAGE', title: 'Master Health Check' });

    expect(department).toContain('hospital department environment');
    expect(service).toContain('hospital service or treatment concept');
    expect(pkg).toContain('preventive health check');
    expect(department).not.toEqual(service);
  });

  it('keeps a shared hospital visual language across specialities while changing cues', () => {
    const cardio = buildCmsImagePrompt({ type: 'SPECIALITY', title: 'Cardiology' });
    const neuro = buildCmsImagePrompt({ type: 'SPECIALITY', title: 'Neurology' });
    const ortho = buildCmsImagePrompt({ type: 'SPECIALITY', title: 'Orthopaedics' });

    expect(cardio).toContain('premium, modern, clean, trustworthy');
    expect(neuro).toContain('premium, modern, clean, trustworthy');
    expect(ortho).toContain('premium, modern, clean, trustworthy');
    expect(cardio).toContain('cardiovascular');
    expect(neuro).toContain('neurological');
    expect(ortho).toContain('musculoskeletal');
  });
});

describe('buildCmsImageAltText', () => {
  it('creates meaningful alt text without mentioning AI', () => {
    expect(buildCmsImageAltText({ type: 'SPECIALITY', title: 'Cardiology' })).toBe(
      'Cardiology and cardiovascular care'
    );
    expect(buildCmsImageAltText({ type: 'SPECIALITY', title: 'Neurology' })).toBe(
      'Neurology and brain care'
    );
    expect(buildCmsImageAltText({ type: 'SPECIALITY', title: 'Orthopaedics' })).toBe(
      'Orthopaedics and bone and joint care'
    );
    expect(buildCmsImageAltText({ type: 'DEPARTMENT', title: 'Emergency' })).toBe(
      'Emergency hospital department'
    );
    expect(buildCmsImageAltText({ type: 'SERVICE', title: 'MRI' })).not.toMatch(/ai generated/i);
  });
});
