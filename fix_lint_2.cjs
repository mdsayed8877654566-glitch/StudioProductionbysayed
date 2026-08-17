const fs = require('fs');
let code = fs.readFileSync('src/services/storeService.ts', 'utf8');

code = code.replace(/const res = await /g, 'await ');

fs.writeFileSync('src/services/storeService.ts', code);
