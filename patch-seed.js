const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'prisma', 'seed.ts');
let seedContent = fs.readFileSync(seedPath, 'utf8');

// 1. Capture the tenant creation
seedContent = seedContent.replace(
  /await prisma\.hospitalProfile\.create\(\{/g,
  'const tenant = await prisma.hospitalProfile.create({'
);

// 2. Insert tenantId extraction
seedContent = seedContent.replace(
  /isActive: true,\n    },\n  }\);\n/g,
  'isActive: true,\n    },\n  });\n  const tenantId = tenant.id;\n'
);

// 3. Inject tenantId into create { data: {
seedContent = seedContent.replace(
  /data: {/g,
  'data: {\n        tenantId,'
);
// Revert HospitalProfile tenantId injection because it doesn't have a tenantId
seedContent = seedContent.replace(
  /hospitalProfile\.create\(\{\n\s*data: \{\n\s*tenantId,/g,
  'hospitalProfile.create({\n      data: {'
);
// Revert DoctorSpeciality, DoctorCentre, CentreSpeciality, CentreService
seedContent = seedContent.replace(/prisma\.(doctorSpeciality|doctorCentre|centreSpeciality|centreService)\.create\(\{\n\s*data: \{\n\s*tenantId,/g, 'prisma.$1.create({\n      data: {');

// 4. Inject tenantId into createMany array items
seedContent = seedContent.replace(
  /data: \[\n\s*\{/g,
  'data: [\n      { tenantId,'
);
seedContent = seedContent.replace(
  /,\n\s*\{/g,
  ',\n      { tenantId,'
);

// Specifically handle CentreSpeciality/CentreService arrays which don't have tenantId
seedContent = seedContent.replace(/\{ tenantId, centreId:/g, '{ centreId:');
seedContent = seedContent.replace(/\{ tenantId, doctorId:/g, '{ doctorId:');

fs.writeFileSync(seedPath, seedContent);
console.log('seed.ts patched successfully');
