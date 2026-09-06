const fs = require('fs');
let file = fs.readFileSync('src/views/ExamsView.tsx', 'utf8');

file = file.replace(
  '          </div>\n\n        </div>\n      </div>',
  '          </div>\n      </div>'
);

fs.writeFileSync('src/views/ExamsView.tsx', file);
