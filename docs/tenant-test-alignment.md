# Tenant-Isolation & Test Alignment Report
Date: 2026-08-13

## Objective
Fix the HIGH priority issue: "Prisma unit test misalignment with tenantId strictness on Department."

## Root Cause Analysis
- **Schema Defect**: `Department` originally declared global uniqueness (`@unique`) on `name` and `slug`.
- **Action Defect**: The production `actions.ts` did not filter uniqueness checks or queries by `tenantId`.
- **Test Defect**: The unit test infrastructure used an `EXCLUDED_MODELS` hack to bypass Prisma foreign key requirements for `Department` specifically because tests were failing due to global collisions when reusing names like 'Cardiology'.

## Actions Taken
1. **Schema Upgrade**: Removed global `@unique` constraints on `Department.name` and `Department.slug`. Added compound indexes: `@@unique([tenantId, name])` and `@@unique([tenantId, slug])`.
2. **Server Actions Scoped**: Updated all `Department` queries/mutations to explicitly include `tenantId: admin.tenantId` in the `where` clauses.
3. **Test Mocks Aligned**: Removed `Department` from `EXCLUDED_MODELS` in `src/server/db/client.ts`. The mock now correctly injects a test `tenantId` just like the production database expects.
4. **Seed Validation**: Removed artificial prefixing from `prisma/seed.ts`, proving that "Cardiology" can co-exist natively across multiple hospital tenants.
5. **New Isolation Tests**: Created explicit test blocks verifying that Hospital A cannot read, modify, or interact with Hospital B's "Cardiology" department.

## Results

HIGH ISSUE:
RESOLVED

Tests:
100/100 (Passes all 96 original tests + 4 new tenant isolation tests)

E2E:
PASS

Build:
PASS

Tenant isolation:
PASS
