const fs = require('fs');
let file = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');

file = file.replaceAll(
  '<div className="overflow-auto flex-1 w-full">',
  '<div className="overflow-auto flex-1 w-full hidden md:block">'
);

file = file.replaceAll(
  '<table className="hidden md:table w-full text-left min-w-[800px]">',
  '<table className="w-full text-left min-w-[800px]">'
);

file = file.replaceAll(
  '</table>\n            <div className="md:hidden flex flex-col gap-4 p-4">',
  '</table>\n          </div>\n          <div className="md:hidden flex-1 overflow-auto w-full p-4 flex flex-col gap-4 bg-brand-bg/10">'
);

file = file.replaceAll(
  '</table>\n              <div className="md:hidden flex flex-col gap-4 p-4">',
  '</table>\n            </div>\n            <div className="md:hidden flex-1 overflow-auto w-full p-4 flex flex-col gap-4 bg-brand-bg/10">'
);

file = file.replaceAll(
  '            </div>\n          </div>\n        </div>',
  '            </div>\n        </div>'
);

file = file.replaceAll(
  '              </div>\n            </div>\n          </div>',
  '              </div>\n          </div>'
);


fs.writeFileSync('src/views/ResultsView.tsx', file);
