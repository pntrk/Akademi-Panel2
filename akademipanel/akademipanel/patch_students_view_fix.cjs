const fs = require('fs');
let code = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

code = code.replace(
  /                      <\/div>\n                    \)}\n                  <\/div>/g,
  `                  </div>`
);

fs.writeFileSync('src/views/StudentsView.tsx', code);
