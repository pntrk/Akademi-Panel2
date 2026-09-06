const fs = require('fs');
let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');

code = code.replace(
  /\(b\.average \|\| 0\) - \(a\.average \|\| 0\)/g,
  `(() => {
        const aValid = Object.values(a.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const bValid = Object.values(b.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const aAvg = aValid.length > 0 ? aValid.reduce((sum, val) => sum + val, 0) / aValid.length : 0;
        const bAvg = bValid.length > 0 ? bValid.reduce((sum, val) => sum + val, 0) / bValid.length : 0;
        return bAvg - aAvg;
      })()`
);

code = code.replace(
  /<td className="py-2 text-center font-bold text-\[\#5a5a40\]">\{result\.average\?\.toFixed\(2\) \|\| '0\.00'\}<\/td>/g,
  `<td className="py-2 text-center font-bold text-[#5a5a40]">{
                      (() => {
                        const valid = Object.values(result.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
                        const avg = valid.length > 0 ? valid.reduce((sum, val) => sum + val, 0) / valid.length : 0;
                        return avg.toFixed(2);
                      })()
                    }</td>`
);

fs.writeFileSync('src/views/ResultsView.tsx', code);
