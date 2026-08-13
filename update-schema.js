const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const modelsToSkip = [
  'HospitalProfile', 
  'DoctorSpeciality', 
  'DoctorCentre', 
  'CentreSpeciality', 
  'CentreService'
];

// Regex to match "model ModelName {" and then find the end of the block
const modelRegex = /model\s+([A-Za-z0-9_]+)\s+{([^}]+)}/g;

let updatedSchema = schema.replace(modelRegex, (match, modelName, blockContent) => {
  if (modelsToSkip.includes(modelName)) {
    return match;
  }

  // Check if tenantId already exists
  if (blockContent.includes('tenantId')) {
    return match; // Already processed
  }

  // Insert tenantId and relation before the first @@index or at the end
  let newContent = blockContent;
  const injection = `\n  tenantId         String          @db.Uuid\n  tenant           HospitalProfile @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n`;

  if (newContent.includes('@@')) {
    newContent = newContent.replace(/(\n\s*@@)/, `${injection}$1`);
  } else {
    newContent = newContent.trimEnd() + `\n${injection}\n`;
  }

  return `model ${modelName} {${newContent}}`;
});

// Add inverse relations to HospitalProfile
const inverseRelations = [];
const modelsFound = [...updatedSchema.matchAll(/model\s+([A-Za-z0-9_]+)\s+{/g)].map(m => m[1]);

modelsFound.forEach(modelName => {
  if (!modelsToSkip.includes(modelName) && modelName !== 'Notification') {
    // lowercase first letter
    let propName = modelName.charAt(0).toLowerCase() + modelName.slice(1) + 's';
    if (propName.endsWith('ys')) propName = propName.slice(0, -2) + 'ies';
    if (!updatedSchema.includes(`  ${propName} `)) {
        inverseRelations.push(`  ${propName} ${modelName}[]`);
    }
  }
});

updatedSchema = updatedSchema.replace(
  /(model HospitalProfile\s+{[^}]+)(\n})/,
  (match, p1, p2) => `${p1}\n${inverseRelations.join('\n')}${p2}`
);

fs.writeFileSync(schemaPath, updatedSchema);
console.log('Schema updated successfully');
