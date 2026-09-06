const fs = require('fs');
let file = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

file = file.replace(
  '<div className="overflow-auto flex-1 w-full">',
  '<div className="overflow-auto flex-1 w-full hidden md:block">'
);

file = file.replace(
  '<table className="hidden md:table w-full border-collapse text-left min-w-[800px]">',
  '<table className="w-full border-collapse text-left min-w-[800px]">'
);

file = file.replace(
  '</table>\n          <div className="md:hidden flex flex-col gap-4 p-4">',
  '</table>\n        </div>\n        <div className="md:hidden flex-1 overflow-auto w-full p-4 flex flex-col gap-4 bg-brand-bg/10">'
);

file = file.replace(
  '          </div>\n        </div>\n      </div>',
  '          </div>\n      </div>'
);

fs.writeFileSync('src/views/StudentsView.tsx', file);
