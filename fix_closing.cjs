const fs = require('fs');

let file = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');
file = file.replace(
  '          </div>\n\n        </div>\n      </div>',
  '          </div>\n      </div>'
);
fs.writeFileSync('src/views/StudentsView.tsx', file);

let results = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');
results = results.replace(
  '            </div>\n\n        </div>',
  '            </div>\n'
);
results = results.replace(
  '              </div>\n\n          </div>',
  '              </div>\n'
);
fs.writeFileSync('src/views/ResultsView.tsx', results);

