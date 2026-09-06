const fs = require('fs');
let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');

const targetStr = `  const updateResultScore = (id: string, examKey: string, scoreStr: string) => {
      const score = parseFloat(scoreStr) || 0;
      setResults(state.results.map(r => {
          if (r.id === id) {
              const newScores = { ...r.scores, [examKey]: score };
              const values = Object.values(newScores) as number[];
              const validValues = values.filter(v => v > 0);
              const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
              return { ...r, scores: newScores, average: avg };
          }
          return r;
      }));
  };`;

const replaceStr = `  const updateResultScore = (id: string, examKey: string, scoreStr: string) => {
      setResults(state.results.map(r => {
          if (r.id === id) {
              const newScores = { ...r.scores };
              if (scoreStr.trim() === '') {
                  delete newScores[examKey];
              } else {
                  newScores[examKey] = parseFloat(scoreStr.replace(',', '.')) || 0;
              }
              const values = Object.values(newScores) as number[];
              const validValues = values.filter(v => v > 0);
              const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
              return { ...r, scores: newScores, average: avg };
          }
          return r;
      }));
  };`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/views/ResultsView.tsx', code);
