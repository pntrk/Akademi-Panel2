const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetStr = `    }).map(s => {
      let displayPoints = (s.displayPoints !== undefined ? s.displayPoints : s.leaguePoints) || 0;
      let displayBadges = (s.displayBadges || s.badges) || {};
      if (selectedMonth !== 'all' && s.monthlyLeagueData && s.monthlyLeagueData[selectedMonth]) {
         displayPoints = s.monthlyLeagueData[selectedMonth].points || 0;
         displayBadges = s.monthlyLeagueData[selectedMonth].badges || {};
      } else if (selectedMonth !== 'all') {
         displayPoints = 0;
         displayBadges = {};
      }
      return { ...s, displayPoints, displayBadges };
    }).sort((a, b) => (b.displayPoints || 0) - (a.displayPoints || 0));`;

const replaceStr = `    }).map(s => {
      let displayPoints = s.leaguePoints || 0;
      let displayBadges = s.badges || {};
      if (selectedMonth !== 'all') {
         if (s.monthlyLeagueData && s.monthlyLeagueData[selectedMonth]) {
           displayPoints = s.monthlyLeagueData[selectedMonth].points || 0;
           displayBadges = s.monthlyLeagueData[selectedMonth].badges || {};
         } else {
           displayPoints = 0;
           displayBadges = {};
         }
      }
      return { ...s, displayPoints, displayBadges };
    }).sort((a, b) => (b.displayPoints || 0) - (a.displayPoints || 0));`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/views/LeagueView.tsx', code);
