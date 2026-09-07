const fs = require('fs');
let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');

code = code.replace(
  /row\['ORTALAMA'\] = r\.average\.toFixed\(2\);/g,
  `const valid = Object.values(r.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const avg = valid.length > 0 ? valid.reduce((sum, val) => sum + val, 0) / valid.length : 0;
        row['ORTALAMA'] = avg.toFixed(2);`
);

code = code.replace(
  /\{result\.average\.toFixed\(2\)\.replace\('\.', ','\)\}/g,
  `{(() => {
                        const valid = Object.values(result.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
                        const avg = valid.length > 0 ? valid.reduce((sum, val) => sum + val, 0) / valid.length : 0;
                        return avg.toFixed(2).replace('.', ',');
                      })()}`
);

fs.writeFileSync('src/views/ResultsView.tsx', code);
