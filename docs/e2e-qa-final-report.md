# E2E QA Final Report

## EXECUTIVE SUMMARY

**Application:** Hospital Appointment Management System (CarePulse Hospital)  
**Test Date:** 2026-08-11  
**Environment:** Local Playwright against `next start` on `http://localhost:5001` after `prisma db seed` (test/dev database only)  
**Browser:** Chromium (Playwright Desktop Chrome)  
**Database:** TEST / local DATABASE_URL only — not production Neon  

**Final Decision: GO**

All critical flows, RBAC, booking concurrency (unit + E2E slot conflict), database integrity, production build, lint, Prisma validate, and the full Playwright suite passed after defect fix loop.

---

## TEST COVERAGE

| Area | Coverage |
|------|----------|
| Public Pages | 22/22 list routes smoked (+ detail/404/search/book) |
| Authentication | Covered (register/login/logout/RBAC redirects) |
| Patient | Discovery, booking, appointments, cancel |
| Doctor | Dashboard, availability, status transitions |
| Admin | Dashboard, departments, doctors, appointments, CMS |
| Security/RBAC | Cross-role denial + IDOR + no passwordHash leak |
| Booking | Book + conflict/rebook lifecycles |
| Concurrency | Unit parallel race + E2E slot conflict |
| Accessibility | Labels, dialog semantics, headings smoke |
| Responsive | 320 / 375 / 768 / 1280 + role dashboards |
| SSR | Public HTML smoke + homepage JSON-LD |

Route inventory: `docs/e2e-route-inventory.md`

---

## RESULTS

| Metric | Count |
|--------|-------|
| Total E2E tests | 90 |
| Passed | 90 |
| Failed | 0 |
| Skipped | 0 |
| Pass percentage | 100% |

| Gate | Result |
|------|--------|
| `npm test` (Vitest) | **96/96 PASS** |
| `npm run test:e2e` | **90/90 PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npx prisma validate` | **PASS** |

**Playwright HTML report:** `playwright-report/index.html`  
**JUnit:** `docs/e2e-junit-results.xml`

---

## DEFECTS FOUND

### E2E-001 — Stale department filter UUIDs (HIGH)

- **Area:** Patient doctor discovery  
- **Problem:** Filtering by Cardiology sometimes returned 0 doctors despite seeded Cardiology doctor.  
- **Root Cause:** `getPublicDepartments()` used `unstable_cache` with live department UUIDs as `<option value>`. After reseed, cached IDs no longer matched FK rows → empty results. Debounced `InteractiveSearchInput` could also rewrite the query from a stale `useSearchParams` closure and wipe concurrent GET filters.  
- **Fix:** Removed caching from `getPublicDepartments()`. Debounce now reads `window.location.search` so department/search params are preserved.  
- **Files Changed:** `src/features/doctors/queries.ts`, `src/components/shared/InteractiveSearchInput.tsx`  
- **Regression Test:** `e2e/doctor/availability-extended.spec.ts` (Cardiology filter) + existing Orthopedics filter  
- **Final Status:** FIXED

### E2E-002 — Horizontal overflow at 320px homepage (MEDIUM)

- **Area:** Public layout / responsive  
- **Problem:** `documentElement.scrollWidth > clientWidth` at 320px.  
- **Root Cause:** Header utility strip packed long left copy + phone; brand/tagline competed for width on narrow screens.  
- **Fix:** Hide utility left copy below `sm`; compact emergency phone on xs; constrain brand with `min-w-0` / truncate; slightly smaller hero title; email `break-all`; overflow guards on `html`/`body`/`container-page`.  
- **Files Changed:** `SiteHeaderClient.tsx`, `BrandLogo.tsx`, `Hero.tsx`, `ContactSection.tsx`, `globals.css`  
- **Regression Test:** `e2e/responsive/viewports.spec.ts`  
- **Final Status:** FIXED

### E2E-003 — Broken Unsplash hero image (LOW)

- **Area:** Public homepage  
- **Problem:** Next.js image optimizer logged upstream 404 for hero photo.  
- **Root Cause:** Remote Unsplash asset no longer available at that URL.  
- **Fix:** Replaced with a working Unsplash hospital/medical image URL.  
- **Files Changed:** `src/components/home/Hero.tsx`  
- **Regression Test:** Public route / SSR smokes  
- **Final Status:** FIXED

### E2E-004 — Contact a11y locator strict-mode (LOW / test harness)

- **Area:** Accessibility smoke  
- **Problem:** `input[name="name"]` matched contact + enquiry forms.  
- **Root Cause:** Two forms share field names on `/contact`.  
- **Fix:** Scope assertions to “Send a message” section labels.  
- **Files Changed:** `e2e/accessibility/a11y-smoke.spec.ts`  
- **Final Status:** FIXED

### E2E-005 — IDOR assertion fragility (LOW / test harness)

- **Area:** Security  
- **Problem:** Text matcher for 404 body was unreliable.  
- **Root Cause:** App correctly `notFound()`s; assertion needed HTTP 404.  
- **Fix:** Assert response status 404 and absence of Consultation Details.  
- **Files Changed:** `e2e/security/rbac.spec.ts`  
- **Final Status:** FIXED (app behavior correct)

---

## SECURITY RESULTS

| Check | Result |
|-------|--------|
| RBAC | PASS |
| IDOR | PASS |
| Authentication | PASS |
| Session | PASS |
| Sensitive Data Exposure | PASS |
| Double Booking | PASS (Vitest parallel race + E2E conflict) |
| Server Validation | PASS |

---

## DATABASE RESULTS

| Check | Result |
|-------|--------|
| Schema (`prisma validate`) | PASS |
| Foreign Keys / orphan appointments | PASS |
| Active Slot Uniqueness | PASS |
| Orphan role profiles | PASS |
| Invalid Statuses | PASS |

`unique_active_doctor_slot` behavior remains enforced (concurrency suite expects P2002 / `SLOT_UNAVAILABLE`).

---

## SSR RESULTS

| Check | Result |
|-------|--------|
| Public SSR pages smoked | PASS |
| Hydration errors (suite) | 0 blocking failures |
| Client-only primary content violations | None detected in SSR smokes |

---

## ACCESSIBILITY RESULTS

| Check | Result |
|-------|--------|
| Keyboard / focusable controls (login) | PASS |
| Dialog semantics (booking confirm) | PASS |
| Form labels (contact) | PASS |
| Headings (doctor availability) | PASS |

Note: Full WCAG audit tool (axe) not run; smoke coverage only.

---

## RESPONSIVE RESULTS

| Viewport | Result |
|----------|--------|
| 320×568 | PASS (after E2E-002) |
| 375×667 | PASS |
| 768×1024 | PASS |
| 1280×800 | PASS |
| Patient / Doctor / Admin dashboards | PASS |

---

## SOURCE-CODE FIXES (this QA loop)

1. `src/features/doctors/queries.ts` — stop caching public department filter IDs  
2. `src/components/shared/InteractiveSearchInput.tsx` — preserve live query params on debounce  
3. `src/components/layout/SiteHeaderClient.tsx` — narrow-viewport utility/header layout  
4. `src/components/layout/BrandLogo.tsx` — truncate / hide tagline on small screens  
5. `src/components/home/Hero.tsx` — smaller mobile title + valid image URL  
6. `src/components/home/ContactSection.tsx` — `break-all` on email  
7. `src/app/globals.css` — overflow / container min-width guards  

## NEW / MODIFIED E2E ASSETS

- `docs/e2e-route-inventory.md`  
- `e2e/fixtures/auth.ts`  
- `e2e/public/routes.spec.ts`  
- `e2e/security/rbac.spec.ts`  
- `e2e/security/database-integrity.spec.ts`  
- `e2e/admin/admin-extended.spec.ts`  
- `e2e/responsive/viewports.spec.ts`  
- `e2e/accessibility/a11y-smoke.spec.ts`  
- `e2e/doctor/availability-extended.spec.ts`  
- `playwright.config.ts` (HTML + JUnit reporters, failure artifacts)  

---

## FINAL REGRESSION

```
npm test              → 96/96 PASS
npm run test:e2e      → 90/90 PASS
npm run lint          → PASS
npm run build         → PASS
npx prisma validate   → PASS
```

---

## FINAL GO / NO-GO

### GO

Blockers: **none**

Critical booking concurrency, RBAC, database integrity, and production build all pass. No critical or high-severity defects remain open.
