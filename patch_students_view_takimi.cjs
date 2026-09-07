const fs = require('fs');
let code = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

code = code.replace(
  /<th width="140" className="py-4 px-5 font-mono text-\[0\.65rem\] text-brand-ink\/50 uppercase tracking-wider sticky top-0 bg-\[\#FAF9F6\]">TAKIMI<\/th>/i,
  ''
);

fs.writeFileSync('src/views/StudentsView.tsx', code);
