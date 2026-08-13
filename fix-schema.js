const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
// match any amount of whitespace between String and @db.Uuid
schema = schema.replace(/tenantId(\s+)String(\s+)@db\.Uuid/g, 'tenantId$1String$2@default(dbgenerated("gen_random_uuid()")) @db.Uuid');
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Fixed schema defaults');
