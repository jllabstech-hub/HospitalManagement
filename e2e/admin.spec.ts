import { test, expect } from '@playwright/test';

test.describe('Admin Portal E2E Suite', () => {
  test('TEST 1: Admin Login, Dashboard Stats & Department CRUD', async ({ page }) => {
    // 1. Admin Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@hospital.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // 2. Verify Admin Dashboard Stats
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Departments')).toBeVisible();
    await expect(page.getByText('Total Doctors')).toBeVisible();

    // 3. Navigate to Departments Page
    await page.click('a:has-text("Departments")');
    await page.waitForURL('**/admin/departments');
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();

    // 4. Create New Department
    const deptName = `Test Dept ${Date.now()}`;
    await page.click('button:has-text("+ Add Department")');
    await page.fill('input[name="name"]', deptName);
    await page.fill('textarea[name="description"]', 'E2E test department description');
    await page.click('button[type="submit"]:has-text("Create Department")');

    // 5. Verify Department Created
    await expect(page.getByText(deptName)).toBeVisible();

    // 6. Edit Department
    await page.click(`tr:has-text("${deptName}") button:has-text("Edit")`);
    const updatedDeptName = `${deptName} Updated`;
    await page.fill('input[name="name"]', updatedDeptName);
    await page.click('button[type="submit"]:has-text("Save Changes")');
    await expect(page.getByText(updatedDeptName)).toBeVisible();

    // 7. Deactivate Department
    await page.click(`tr:has-text("${updatedDeptName}") button:has-text("Deactivate")`);
    await page.click('button:has-text("Confirm Deactivate")');
    await expect(page.getByText('Department deactivated successfully!')).toBeVisible();

    // 8. Reactivate Department
    await page.click(`tr:has-text("${updatedDeptName}") button:has-text("Activate")`);
    await page.click('button:has-text("Confirm Activate")');
    await expect(page.getByText('Department activated successfully!')).toBeVisible();
  });

  test('TEST 2: Admin Doctor CRUD Flow', async ({ page }) => {
    const doctorEmail = `dr.e2e.${Date.now()}@hospital.com`;

    // 1. Admin Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@hospital.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // 2. Navigate to Doctors Page
    await page.click('a:has-text("Doctors")');
    await page.waitForURL('**/admin/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors' })).toBeVisible();

    // 3. Create Doctor
    await page.click('button:has-text("+ Add Doctor")');
    await page.fill('input[name="fullName"]', 'Dr. E2E Specialist');
    await page.fill('input[name="email"]', doctorEmail);
    await page.fill('input[name="password"]', 'TempDocPass123!');
    await page.fill('input[name="qualification"]', 'MBBS, MS General Surgery');
    await page.fill('input[name="experienceYears"]', '7');
    await page.fill('input[name="phoneNumber"]', '+91 99887 76655');
    await page.click('button[type="submit"]:has-text("Create Doctor Account")');

    // 4. Verify Doctor Created in Table
    await expect(page.getByText(doctorEmail)).toBeVisible();

    // 5. Edit Doctor
    await page.click(`tr:has-text("${doctorEmail}") button:has-text("Edit")`);
    await page.fill('input[name="fullName"]', 'Dr. E2E Specialist Updated');
    await page.click('button[type="submit"]:has-text("Save Changes")');
    await expect(page.getByText('Dr. E2E Specialist Updated')).toBeVisible();

    // 6. Deactivate Doctor
    await page.click(`tr:has-text("${doctorEmail}") button:has-text("Deactivate")`);
    await page.click('button:has-text("Confirm Deactivate")');
    await expect(page.getByText('Doctor account deactivated successfully!')).toBeVisible();

    // 7. Reactivate Doctor
    await page.click(`tr:has-text("${doctorEmail}") button:has-text("Activate")`);
    await page.click('button:has-text("Confirm Activate")');
    await expect(page.getByText('Doctor account activated successfully!')).toBeVisible();
  });

  test('TEST 3: Non-Admin Role Authorization Boundary', async ({ page }) => {
    // 1. Patient Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // 2. Attempt Direct Access to Admin Departments
    await page.goto('/admin/departments');
    await page.waitForURL('**/patient/dashboard'); // Redirected back to patient dashboard

    // 3. Attempt Direct Access to Admin Doctors
    await page.goto('/admin/doctors');
    await page.waitForURL('**/patient/dashboard'); // Redirected back to patient dashboard
  });
});
