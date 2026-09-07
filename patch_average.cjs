const fs = require('fs');
let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');

code = code.replace(
  /const values = Object\.values\(newScores\) as number\[\];\s*newAverage = values\.length > 0 \? values\.reduce\(\(a, b\) => a \+ b, 0\) \/ values\.length : 0;/g,
  `const values = Object.values(newScores) as number[];
              const validValues = values.filter(v => v > 0);
              newAverage = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;`
);

code = code.replace(
  /const values = Object\.values\(newScores\) as number\[\];\s*const avg = values\.length > 0 \? values\.reduce\(\(a, b\) => a \+ b, 0\) \/ values\.length : 0;/g,
  `const values = Object.values(newScores) as number[];
              const validValues = values.filter(v => v > 0);
              const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;`
);

code = code.replace(
  /scores: forcedExamName \? \{ \[forcedExamName\]: count > 0 \? total\/count : 0 \} : scores,\s*average: count > 0 \? \(total \/ count\) : 0/g,
  `scores: forcedExamName ? { [forcedExamName]: count > 0 ? total/count : 0 } : scores,
                average: (Object.values(scores).filter((v: any) => v > 0).length > 0) ? (Object.values(scores).filter((v: any) => v > 0).reduce((a: any, b: any) => a + b, 0) / Object.values(scores).filter((v: any) => v > 0).length) : (count > 0 ? total/count : 0)`
);

fs.writeFileSync('src/views/ResultsView.tsx', code);
