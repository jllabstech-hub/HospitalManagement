import { describe, expect, it } from 'vitest';
import { looksLikeForeignHospitalCopy, withoutForeignHospitalCopy } from '../foreign-hospital-copy';

describe('foreign hospital copy detection', () => {
  it('rejects competitor hospital brands', () => {
    expect(
      looksLikeForeignHospitalCopy(
        'Angioedema Clinic | Specialized Swelling Disorder Care – Manipal Hospitals India'
      )
    ).toBe(true);
    expect(looksLikeForeignHospitalCopy('Why Aster FAQs Patient Stories')).toBe(true);
    expect(looksLikeForeignHospitalCopy('Narayana Health provides compassionate care')).toBe(true);
  });

  it('rejects scraped SEO titles and site chrome', () => {
    expect(looksLikeForeignHospitalCopy('Best Cancer Hospital In India')).toBe(true);
    expect(looksLikeForeignHospitalCopy('ADHD Clinic In India')).toBe(true);
    expect(looksLikeForeignHospitalCopy('Find A Doctor')).toBe(true);
    expect(
      looksLikeForeignHospitalCopy(
        'Awake Craniotomy Overview Doctors Health Condition Why Aster FAQs'
      )
    ).toBe(true);
  });

  it('keeps this hospital’s own copy', () => {
    expect(looksLikeForeignHospitalCopy('Cardiology')).toBe(false);
    expect(
      looksLikeForeignHospitalCopy(
        'CarePulse Super Speciality Hospital',
        'Advanced cardiac care with faster recovery support.'
      )
    ).toBe(false);
  });

  it('filters catalog rows without treating faster as Aster', () => {
    const rows = [
      { name: 'Cardiology', shortDescription: 'Heart care with faster recovery.' },
      { name: 'Best Multispecialty Hospital In Bangalore | Aster CMI', shortDescription: null },
    ];
    expect(withoutForeignHospitalCopy(rows, (row) => [row.name, row.shortDescription])).toEqual([
      rows[0],
    ]);
  });
});
