const fs = require('fs');
let code = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

code = code.replace(
  /<th className="py-4 px-5 font-bold text-left text-xs uppercase tracking-wider text-brand-ink\/60">TAKIM<\/th>/i,
  ''
);

code = code.replace(
  /<th className="py-4 px-5 font-bold w-32">Takım<\/th>/i,
  ''
);

code = code.replace(
  /<th[^>]*>\s*Takım\s*<\/th>/gi,
  ''
);

fs.writeFileSync('src/views/StudentsView.tsx', code);
