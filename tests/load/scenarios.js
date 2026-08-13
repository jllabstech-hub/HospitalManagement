import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Baseline
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 250 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 }, // Stress
    { duration: '30s', target: 0 },   // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests should be below 1.5s
    http_req_failed: ['rate<0.01'],    // Error rate should be <1%
  },
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  group('1. Homepage', () => {
    const res = http.get(BASE_URL);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('2. Global Search', () => {
    const res = http.get(`${BASE_URL}/api/search?q=cardio`);
    // Assuming search endpoint returns JSON list
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('3. Doctor Search', () => {
    const res = http.get(`${BASE_URL}/doctors`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('4. Doctor Profile', () => {
    // We would dynamically pick an ID, but for load testing, let's just hit the route that will SSR/SSG.
    // If we have actual IDs, we could load them from a JSON file.
    // Let's use a known static route or simple dynamic route.
    const res = http.get(`${BASE_URL}/doctors/dr-ananya-rao`);
    // If it 404s, it's fine, we are testing the server's load handling.
    check(res, { 'status is 200 or 404': (r) => r.status === 200 || r.status === 404 });
  });

  group('5. Slot Availability', () => {
    const res = http.get(`${BASE_URL}/api/appointments/availability?doctorId=test`);
    check(res, { 'status is 200 or 404': (r) => r.status === 200 || r.status === 404 });
  });

  group('6. Patient Dashboard', () => {
    const res = http.get(`${BASE_URL}/patient/dashboard`);
    // Typically 307/302 redirect if unauthorized, which is still processing load
    check(res, { 'status is 200 or redirect': (r) => [200, 302, 307].includes(r.status) });
  });

  group('7. Doctor Dashboard', () => {
    const res = http.get(`${BASE_URL}/doctor/dashboard`);
    check(res, { 'status is 200 or redirect': (r) => [200, 302, 307].includes(r.status) });
  });

  group('8. Admin Dashboard', () => {
    const res = http.get(`${BASE_URL}/admin/dashboard`);
    check(res, { 'status is 200 or redirect': (r) => [200, 302, 307].includes(r.status) });
  });

  group('9. CMS Content API', () => {
    const res = http.get(`${BASE_URL}/admin/content`);
    check(res, { 'status is 200 or redirect': (r) => [200, 302, 307].includes(r.status) });
  });

  group('10. Appointment Booking Intent', () => {
    // Only simulating the form view load, not the actual POST request 
    // to avoid polluting the DB during massive load testing.
    const res = http.get(`${BASE_URL}/book-appointment`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  sleep(1); // Think time
}
