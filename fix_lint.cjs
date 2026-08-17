const fs = require('fs');
let code = fs.readFileSync('src/services/storeService.ts', 'utf8');

code = code.replace(/this\.entityMutationTimestamps\?\.set\([^)]+\);\s*/g, '');

const funcs = ['Category', 'Product', 'User', 'Coupon', 'Settings'];
for (const f of funcs) {
  // Save Verified
  code = code.replace(/\/\/\s*Fire and forget since Supabase functions catch their own errors currently\s*if \(res && res\.error\) \{\s*cloudResult = \{ success: false, error: res\.error \};\s*\}/g,
    ``);
  code = code.replace(/if \(res && res\.error\) cloudResult = \{ success: false, error: res\.error \};/g,
    ``);
}

// Delete Verified
code = code.replace(/if \(res && res\.error\) \{ cloudResult = \{ success: false, error: res\.error \}; \}/g,
  ``);

fs.writeFileSync('src/services/storeService.ts', code);
