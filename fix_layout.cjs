const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

code = code.replace(
  'pb-[70px]',
  'pb-[calc(70px+env(safe-area-inset-bottom))]'
);

fs.writeFileSync('src/components/Layout.tsx', code);
