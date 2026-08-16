import { describe, it, expect, vi } from 'vitest';
import { hostnameIsBlocked, ipIsPrivate, parseHttpUrl, assertSafeFetchUrl, UnsafeUrlError } from '../ssrf';
import { isPathAllowed, parseRobotsTxt } from '../robots';
import { canonicalName, dedupeFaqs, dedupeItems, faqKey, jaccard, parsePrice } from '../normalize';
import { extractFaqs, extractPage } from '../extract';
import { crawlHospitalSite } from '../crawler';
import { extractMainText } from '../html';
import type { FetchResult } from '../types';

describe('SSRF protection', () => {
  it('allows only http and https', () => {
    expect(() => parseHttpUrl('file:///etc/passwd')).toThrow(UnsafeUrlError);
    expect(() => parseHttpUrl('javascript:alert(1)')).toThrow(UnsafeUrlError);
    expect(() => parseHttpUrl('data:text/html,hi')).toThrow(UnsafeUrlError);
    expect(parseHttpUrl('https://www.examplehospital.com/about').hostname).toBe('www.examplehospital.com');
  });

  it('blocks localhost, private IPs, and metadata hosts', () => {
    expect(hostnameIsBlocked('localhost')).toBe(true);
    expect(hostnameIsBlocked('127.0.0.1')).toBe(true);
    expect(hostnameIsBlocked('169.254.169.254')).toBe(true);
    expect(hostnameIsBlocked('metadata.google.internal')).toBe(true);
    expect(ipIsPrivate('10.0.0.4')).toBe(true);
    expect(ipIsPrivate('192.168.1.9')).toBe(true);
    expect(ipIsPrivate('172.16.5.5')).toBe(true);
    expect(ipIsPrivate('8.8.8.8')).toBe(false);
    expect(() => parseHttpUrl('http://127.0.0.1/')).toThrow(UnsafeUrlError);
    expect(() => parseHttpUrl('http://localhost:3000')).toThrow(UnsafeUrlError);
    expect(() => parseHttpUrl('http://[::1]/')).toThrow(UnsafeUrlError);
    expect(() => parseHttpUrl('http://192.168.0.1/about')).toThrow(UnsafeUrlError);
    expect(() => parseHttpUrl('http://169.254.169.254/latest/meta-data')).toThrow(UnsafeUrlError);
    expect(ipIsPrivate('::1')).toBe(true);
    expect(ipIsPrivate('fc00::1')).toBe(true);
    expect(ipIsPrivate('fe80::1')).toBe(true);
    expect(ipIsPrivate('2001:4860:4860::8888')).toBe(false);
  });

  it('rejects redirect targets that point at private networks', () => {
    expect(() => parseHttpUrl('http://127.0.0.1/internal')).toThrow(UnsafeUrlError);
    expect(() => parseHttpUrl('http://10.0.0.8/cms')).toThrow(UnsafeUrlError);
  });

  it('rejects hosts that resolve to private addresses', async () => {
    const lookup = vi.fn(async () => [{ address: '127.0.0.1', family: 4 }]);
    await expect(assertSafeFetchUrl('https://evil.example', lookup as never)).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});

describe('robots.txt', () => {
  it('honours Disallow rules for *', () => {
    const policy = parseRobotsTxt(`
User-agent: *
Disallow: /login
Disallow: /admin
Allow: /admin/public
`);
    expect(isPathAllowed('/departments', policy)).toBe(true);
    expect(isPathAllowed('/login', policy)).toBe(false);
    expect(isPathAllowed('/admin/secret', policy)).toBe(false);
    expect(isPathAllowed('/admin/public', policy)).toBe(true);
  });
});

describe('normalization and duplicate removal', () => {
  it('maps high-confidence department aliases', () => {
    expect(canonicalName('Department of Cardiac Sciences')).toBe('Cardiology');
    expect(canonicalName('Heart Sciences')).toBe('Cardiology');
    expect(canonicalName('Orthopedics')).toBe('Orthopaedics');
    expect(canonicalName('Bone & Joint')).toBe('Orthopaedics');
  });

  it('does not merge ambiguous names', () => {
    expect(canonicalName('Heart Care Unit')).toBe('Heart Care Unit');
    const items = dedupeItems([
      { name: 'Cardiology' },
      { name: 'Cardiac Sciences' },
      { name: 'Neurology' },
    ]);
    expect(items.map((item) => item.name)).toEqual(['Cardiology', 'Neurology']);
  });

  it('deduplicates similar FAQs without aggressive merging', () => {
    const faqs = dedupeFaqs([
      { name: 'How can I book an appointment?', question: 'How can I book an appointment?', answer: 'Call the desk.' },
      { name: 'How can I book an appointment?', question: 'How can I book an appointment?', answer: 'Call the desk.' },
      { name: 'What are visiting hours?', question: 'What are visiting hours?', answer: '4pm to 6pm.' },
    ]);
    expect(faqs).toHaveLength(2);
    expect(faqKey('How can I book an appointment?')).toBe('how can i book an appointment');
    expect(jaccard('How can I book an appointment?', 'What are visiting hours?')).toBeLessThan(0.5);
  });

  it('parses explicit prices only', () => {
    expect(parsePrice('Package price ₹4999')).toBe('4999.00');
    expect(parsePrice('Rs 3500')).toBe('3500.00');
    expect(parsePrice('No amount mentioned')).toBeNull();
    expect(parsePrice('Includes 150 tests and 12 parameters')).toBeNull();
  });
});

describe('content extraction and sanitization', () => {
  const html = `
    <html><head><title>Departments | Demo Hospital</title>
    <script>alert('x')</script>
    <style>.x{color:red}</style></head>
    <body>
      <nav>Home Contact Login</nav>
      <header>Cookie banner</header>
      <main>
        <h1>Departments</h1>
        <a href="/departments/cardiology">Cardiology</a>
        <a href="/departments/neurology">Neurology</a>
        <h2>How do I book an appointment?</h2>
        <p>Call the hospital appointment desk.</p>
        <script type="application/ld+json">${JSON.stringify({
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What documents should I bring?',
              acceptedAnswer: { text: 'Bring a photo ID and previous reports.' },
            },
          ],
        })}</script>
      </main>
      <footer>All rights reserved</footer>
    </body></html>
  `;

  it('extracts departments and FAQs and strips scripts', () => {
    const preview = extractPage('https://hospital.test/departments', html);
    expect(preview.departments.some((item) => item.name === 'Cardiology')).toBe(true);
    expect(preview.faqs.some((item) => /documents/i.test(item.name))).toBe(true);
    const text = extractMainText(html);
    expect(text).not.toContain("alert('x')");
    expect(text.toLowerCase()).not.toContain('all rights reserved');
  });

  it('extracts a speciality leaf page from its heading', () => {
    const preview = extractPage(
      'https://hospital.test/specialities/cardiology',
      `<html><body><h1>Cardiology</h1><p>Specialised care for conditions affecting the heart and blood vessels.</p></body></html>`
    );
    expect(preview.specialities.some((item) => item.name === 'Cardiology')).toBe(true);
  });

  it('extracts a displayable speciality image from og:image', () => {
    const preview = extractPage(
      'https://hospital.test/specialities/cardiology',
      `<html><head><meta property="og:image" content="https://images.unsplash.com/photo-1631217868264-e5b90bb7e305?auto=format&fit=crop&w=1600&q=80" /></head><body><h1>Cardiology</h1><p>Specialised care for conditions affecting the heart and blood vessels.</p></body></html>`
    );
    expect(preview.specialities[0]?.imageUrl).toContain('images.unsplash.com');
  });

  it('maps specialities from headings', () => {
    const preview = extractPage(
      'https://hospital.test/specialities',
      `<html><body><h1>Specialities</h1><h2>Orthopedics</h2><h2>Cardiac Sciences</h2></body></html>`
    );
    expect(preview.specialities.map((item) => item.name)).toEqual(expect.arrayContaining(['Orthopaedics', 'Cardiology']));
  });

  it('does not extract competitor hospital specialities', () => {
    const preview = extractPage(
      'https://hospital.test/specialities/angioedema-clinic',
      `<html><body><h1>Angioedema Clinic | Specialized Swelling Disorder Care – Manipal Hospitals India</h1><p>English Angioedema Clinic at Manipal Hospitals India.</p></body></html>`
    );
    expect(preview.specialities).toHaveLength(0);
  });

  it('does not extract Aster treatment chrome as a speciality', () => {
    const preview = extractPage(
      'https://hospital.test/specialities/awake-craniotomy',
      `<html><body><h1>Awake Craniotomy</h1><p>Awake Craniotomy Overview Doctors Health Condition Why Aster FAQs Patient Stories</p></body></html>`
    );
    expect(preview.specialities).toHaveLength(0);
  });

  it('does not extract doctors', () => {
    const doctorHtml = `<html><body><h1>Our Doctors</h1><a href="/doctors/anil">Dr Anil Kumar</a></body></html>`;
    const preview = extractPage('https://hospital.test/doctors', doctorHtml);
    expect(preview.departments).toHaveLength(0);
    expect(preview.specialities).toHaveLength(0);
    expect(JSON.stringify(preview)).not.toContain('Anil Kumar');
  });

  it('extracts packages without inventing price', () => {
    const faqs = extractFaqs(`<html><body><details><summary>How do I make an appointment?</summary><p>Use the booking desk.</p></details></body></html>`);
    expect(faqs[0]?.question).toMatch(/appointment/i);
    const preview = extractPage(
      'https://hospital.test/packages',
      `<html><body><h1>Health Packages</h1><h2>Executive Health Check</h2><p>Includes ECG and blood tests. Price ₹4999.</p><h2>Women's Health Check</h2><p>Screening package with no listed amount.</p></body></html>`
    );
    expect(preview.packages.some((item) => /executive/i.test(item.name))).toBe(true);
    const unpaid = preview.packages.find((item) => /women/i.test(item.name));
    if (unpaid) expect(unpaid.price == null || unpaid.price === parsePrice(unpaid.description || '')).toBe(true);
  });
});

describe('crawler limits', () => {
  function pages(map: Record<string, string>) {
    return async (url: string): Promise<FetchResult> => {
      const body = map[url] ?? map[url.replace(/\/$/, '')] ?? map[`${url}/`];
      if (body == null) return { finalUrl: url, status: 404, contentType: 'text/html', body: '' };
      return { finalUrl: url, status: 200, contentType: 'text/html', body };
    };
  }

  it('respects max pages and does not follow blocked paths', async () => {
    const site: Record<string, string> = {
      'https://hospital.test/robots.txt': 'User-agent: *\nDisallow: /login\n',
      'https://hospital.test/sitemap.xml': '',
      'https://hospital.test': `<html><body>
        <a href="/departments">Departments</a>
        <a href="/login">Login</a>
        <a href="/doctors">Doctors</a>
      </body></html>`,
      'https://hospital.test/departments': `<html><body><h1>Departments</h1><a href="/departments/cardiology">Cardiology</a></body></html>`,
      'https://hospital.test/departments/cardiology': `<html><body><h1>Cardiology</h1><p>Department of Cardiology provides cardiac care.</p></body></html>`,
      'https://hospital.test/login': `<html><body>secret</body></html>`,
    };
    const { preview } = await crawlHospitalSite({
      startUrl: 'https://hospital.test',
      get: pages(site),
      limits: { maxPages: 5, maxDepth: 2, minRequestGapMs: 0 },
    });
    expect(preview.departments.some((item) => item.name === 'Cardiology')).toBe(true);
    expect(JSON.stringify(preview)).not.toContain('secret');
  });

  it('stops at max depth', async () => {
    const visited: string[] = [];
    const get = async (url: string): Promise<FetchResult> => {
      visited.push(url);
      if (url.endsWith('robots.txt') || url.endsWith('sitemap.xml')) {
        return { finalUrl: url, status: 404, contentType: 'text/plain', body: '' };
      }
      const depth = url.endsWith('/d3') ? 3 : url.endsWith('/d2') ? 2 : url.endsWith('/d1') ? 1 : 0;
      const next = depth === 0 ? '/d1' : depth === 1 ? '/d2' : depth === 2 ? '/d3' : '/d4';
      return {
        finalUrl: url,
        status: 200,
        contentType: 'text/html',
        body: `<html><body><a href="${next}">Next</a></body></html>`,
      };
    };
    await crawlHospitalSite({
      startUrl: 'https://hospital.test',
      get,
      limits: { maxPages: 20, maxDepth: 2, minRequestGapMs: 0 },
    });
    expect(visited.some((url) => url.endsWith('/d4'))).toBe(false);
    expect(visited.some((url) => url.endsWith('/d3'))).toBe(false);
  });

  it('follows nested sitemap indexes and skips xml pages', async () => {
    const htmlGets: string[] = [];
    const site: Record<string, string> = {
      'https://hospital.test/robots.txt': 'User-agent: *\nAllow: /\nSitemap: https://hospital.test/sitemap.xml\n',
      'https://hospital.test/sitemap.xml': `<?xml version="1.0"?><sitemapindex><sitemap><loc>https://hospital.test/specialities-sitemap.xml</loc></sitemap><sitemap><loc>https://hospital.test/doctors-sitemap.xml</loc></sitemap></sitemapindex>`,
      'https://hospital.test/specialities-sitemap.xml': `<?xml version="1.0"?><urlset><url><loc>https://hospital.test/specialities</loc></url><url><loc>https://hospital.test/specialities/neurology</loc></url></urlset>`,
      'https://hospital.test/doctors-sitemap.xml': `<?xml version="1.0"?><urlset><url><loc>https://hospital.test/doctors/anil</loc></url></urlset>`,
      'https://hospital.test': `<html><body><h1>Hospital</h1></body></html>`,
      'https://hospital.test/specialities': `<html><body><h1>Specialities</h1><a href="/specialities/neurology">Neurology</a></body></html>`,
      'https://hospital.test/specialities/neurology': `<html><body><h1>Neurology</h1><p>Care for brain and nerve conditions with a dedicated clinical team.</p></body></html>`,
    };
    const get = async (url: string): Promise<FetchResult> => {
      htmlGets.push(url);
      const body = site[url] ?? site[url.replace(/\/$/, '')] ?? site[`${url}/`];
      if (body == null) return { finalUrl: url, status: 404, contentType: 'text/html', body: '' };
      const contentType = url.endsWith('.xml') || url.endsWith('robots.txt') ? 'application/xml' : 'text/html';
      return { finalUrl: url, status: 200, contentType, body };
    };
    const { preview } = await crawlHospitalSite({
      startUrl: 'https://hospital.test',
      get,
      limits: { maxPages: 6, maxDepth: 2, minRequestGapMs: 0, maxSitemapFiles: 4, maxSitemapUrls: 20 },
    });
    expect(preview.specialities.some((item) => item.name === 'Neurology')).toBe(true);
    expect(htmlGets.some((url) => url.includes('/doctors/anil'))).toBe(false);
  });

  it('stops after the page limit', async () => {
    const htmlGets: string[] = [];
    const get = async (url: string): Promise<FetchResult> => {
      htmlGets.push(url);
      if (url.endsWith('robots.txt') || url.endsWith('sitemap.xml')) {
        return { finalUrl: url, status: 404, contentType: 'text/plain', body: '' };
      }
      return {
        finalUrl: url,
        status: 200,
        contentType: 'text/html',
        body: `<html><body>
          <a href="/departments">Departments</a>
          <a href="/services">Services</a>
          <a href="/packages">Packages</a>
          <a href="/faq">FAQ</a>
        </body></html>`,
      };
    };
    const { pagesVisited } = await crawlHospitalSite({
      startUrl: 'https://hospital.test',
      get,
      limits: { maxPages: 2, maxDepth: 5, minRequestGapMs: 0 },
    });
    expect(pagesVisited).toBe(2);
    const pageGets = htmlGets.filter((url) => !url.endsWith('robots.txt') && !url.endsWith('sitemap.xml'));
    expect(pageGets.length).toBeLessThanOrEqual(2);
  });
});
