const fs = require('fs');
let file = fs.readFileSync('src/views/ExamsView.tsx', 'utf8');

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
  '</table>\n        </div>\n        <div className="md:hidden flex-1 overflow-auto w-full p-4 flex flex-col gap-4">'
);

// We need to make sure the closing </div> is matched properly.
// Previously it was:
//          </table>
//          <div className="md:hidden flex flex-col gap-4 p-4">
//            ...
//          </div>
//        </div>
//      </div>
// So if we closed `overflow-auto` early, we need to remove one closing div at the end.
file = file.replace(
  '        </div>\n      </div>\n\n      {/* Edit/Create Exam Modal */}',
  '      </div>\n\n      {/* Edit/Create Exam Modal */}'
);

fs.writeFileSync('src/views/ExamsView.tsx', file);
