const fs = require('fs');

let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf-8');

code = code.replace(
  'const { state, setStudents, updateLeagueSettings, approveTransfer } = useAppContext();',
  'const { state, setStudents, updateLeagueSettings, approveTransfer, userRole } = useAppContext();'
);

code = code.replace(
  '<button \n                     onClick={(e) => { e.stopPropagation(); approveTransfer(s.no, pt.examName, pt.to); }}\n                     className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded"\n                  >\n                     Onayla\n                  </button>',
  '{userRole === \'admin\' && <button \n                     onClick={(e) => { e.stopPropagation(); approveTransfer(s.no, pt.examName, pt.to); }}\n                     className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded"\n                  >\n                     Onayla\n                  </button>}'
);

fs.writeFileSync('src/views/LeagueView.tsx', code);
