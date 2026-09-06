const fs = require('fs');
let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');

const targetStr = `              Object.keys(row).forEach(key => {
                if (key.toUpperCase().startsWith('DENEME') || key.toUpperCase().startsWith('SINAV')) {
                  const score = parseTurkishFloat(row[key]);
                  scores[key.toUpperCase()] = score;
                  total += score;
                  count++;
                }
              });`;

const replaceStr = `              Object.keys(row).forEach(key => {
                if (key.toUpperCase().startsWith('DENEME') || key.toUpperCase().startsWith('SINAV')) {
                  const rawVal = row[key];
                  if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                      const score = parseTurkishFloat(rawVal);
                      if (score > 0) {
                          scores[key.toUpperCase()] = score;
                          total += score;
                          count++;
                      }
                  }
                }
              });`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/views/ResultsView.tsx', code);
