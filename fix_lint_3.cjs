const fs = require('fs');
let code = fs.readFileSync('src/services/storeService.ts', 'utf8');

code = code.replace(/this\.entityMutationTimestamps\?\.set\(.*?\);\s*/g, '');

fs.writeFileSync('src/services/storeService.ts', code);
