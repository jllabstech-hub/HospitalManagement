import { test as base, expect } from '@playwright/test';
import { resetE2eMutableData } from '../helpers/reset-data';

export const test = base.extend({
  forEachTest: [
    async ({}, use) => {
      await resetE2eMutableData();
      await use();
    },
    { auto: true },
  ],
});

export { expect };
