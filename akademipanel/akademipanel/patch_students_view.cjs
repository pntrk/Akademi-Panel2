const fs = require('fs');
let code = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

code = code.replace(
  /<th className="py-4 px-5 font-bold w-32">Takım<\/th>/g,
  ''
);

code = code.replace(
  /\s*{\/\* Team Badge \*\/}\s*<td className="py-4 px-5">\s*<span className={`px-2 py-1 rounded-full text-\[0\.65rem\] font-bold inline-block \${[^}]*}`}>\s*\{student\.leagueTeam \|\| 'Atanmadı'\}\s*<\/span>\s*<\/td>/g,
  ''
);

fs.writeFileSync('src/views/StudentsView.tsx', code);
