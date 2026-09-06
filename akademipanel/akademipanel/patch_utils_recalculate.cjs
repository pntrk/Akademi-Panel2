const fs = require('fs');
let code = fs.readFileSync('src/lib/utils.ts', 'utf8');

const targetStr = `          const { earnedLP, badgeCounts } = calculateAtaLigPoints(score, prevAverage, details, historyExamsForStudent, teamForThisExam);
          
          totalLP += earnedLP;
          Object.keys(badgeCounts).forEach(k => {
             badges[k] += badgeCounts[k as keyof typeof badgeCounts];
          });`;

const replaceStr = `          const { earnedLP, badgeCounts } = calculateAtaLigPoints(score, prevAverage, details, historyExamsForStudent, teamForThisExam);
          
          totalLP += earnedLP;
          Object.keys(badgeCounts).forEach(k => {
             badges[k] += badgeCounts[k as keyof typeof badgeCounts];
          });
          
          // Track monthly points and badges based on exam.date
          const dateObj = new Date(exam.date);
          const monthKey = \`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}\`;
          if (!student.monthlyLeagueData) student.monthlyLeagueData = {};
          if (!student.monthlyLeagueData[monthKey]) {
            student.monthlyLeagueData[monthKey] = {
              points: 0,
              badges: { kalkan: 0, ivme: 0, zirve: 0, tamIsabet: 0, kirmiziKart: 0, zirveBekcisi: 0, ivmeSampiyonu: 0, barajYikici: 0, stratejiMuhendisi: 0, istikrarElcisi: 0, lgsFatihi: 0, ankaKusu: 0, sozelSovalyesi: 0, sayisalKalesi: 0, matematikUyanisi: 0, dengeCambazi: 0, keskinNisanci: 0, temelAtici: 0 }
            };
          }
          student.monthlyLeagueData[monthKey].points += earnedLP;
          Object.keys(badgeCounts).forEach(k => {
            if (student.monthlyLeagueData[monthKey].badges[k] !== undefined) {
               student.monthlyLeagueData[monthKey].badges[k] += badgeCounts[k as keyof typeof badgeCounts];
            } else {
               student.monthlyLeagueData[monthKey].badges[k] = badgeCounts[k as keyof typeof badgeCounts];
            }
          });`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/lib/utils.ts', code);
