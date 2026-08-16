const FOREIGN_HOSPITAL_BRAND =
  /\b(apollo hospitals?|fortis(?:\s+healthcare)?|narayana health|manipal hospitals?|aster(?:\s+cmi|\s+hospitals?)?|max healthcare|max hospitals?)\b/i;

const SCRAPED_SEO_TITLE =
  /\b(best\b.{0,80}\b(hospital|clinic|centre|center)\b.{0,40}\bin india|(hospitals?|clinic|centre|center|treatment)\s+in (india|bangalore|bengaluru)|hospitals and services in india)\b/i;

const SCRAPED_NAV_CHROME =
  /\b(why aster|overview\s+(doctors|hospitals)\b|hospitals specialities doctors treatments|click.? to chat with us)\b/i;

const SCRAPED_JUNK_TITLE =
  /^(find a doctor|page[_ ]title|patient stories|written testimonial|need assistance|events|health days|life at a glance|doctor'?s speak|you.?re on our indian website|human care experts)$/i;

export function looksLikeForeignHospitalCopy(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => {
    const text = value?.trim();
    if (!text) return false;
    return (
      FOREIGN_HOSPITAL_BRAND.test(text) ||
      SCRAPED_SEO_TITLE.test(text) ||
      SCRAPED_NAV_CHROME.test(text) ||
      SCRAPED_JUNK_TITLE.test(text) ||
      /^english\s+[a-z]/i.test(text)
    );
  });
}

export function withoutForeignHospitalCopy<T>(
  items: T[],
  fields: (item: T) => Array<string | null | undefined>
): T[] {
  return items.filter((item) => !looksLikeForeignHospitalCopy(...fields(item)));
}
