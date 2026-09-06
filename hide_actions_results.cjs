const fs = require('fs');

let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf-8');

code = code.replace(
  'const { state, setResults, setStudents } = useAppContext();',
  'const { state, setResults, setStudents, userRole } = useAppContext();'
);

// We need to find the "Excel'den Sonuç Yükle" button and hide it
code = code.replace(
  '<label className="bg-brand-accent hover:bg-[#c4a46e] text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto">',
  '{userRole === \'admin\' && <label className="bg-brand-accent hover:bg-[#c4a46e] text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto">'
);
code = code.replace(
  '</label>',
  '</label>}'
);

// Sınav Sil button
code = code.replace(
  '<button\n                        onClick={() => {\n                          if (window.confirm(`${selectedExamObj.name} sonuçlarını silmek istediğinize emin misiniz?`)) {\n                            setResults(state.results.filter(r => !Object.keys(r.scores).includes(selectedExamObj.id)));\n                          }\n                        }}\n                        className="bg-red-500/10 text-red-500 p-2 md:p-2.5 rounded-xl hover:bg-red-500/20 transition-all"',
  '{userRole === \'admin\' && <button\n                        onClick={() => {\n                          if (window.confirm(`${selectedExamObj.name} sonuçlarını silmek istediğinize emin misiniz?`)) {\n                            setResults(state.results.filter(r => !Object.keys(r.scores).includes(selectedExamObj.id)));\n                          }\n                        }}\n                        className="bg-red-500/10 text-red-500 p-2 md:p-2.5 rounded-xl hover:bg-red-500/20 transition-all"'
);
code = code.replace(
  '<Trash2 className="w-4 h-4 md:w-5 md:h-5" />\n                      </button>',
  '<Trash2 className="w-4 h-4 md:w-5 md:h-5" />\n                      </button>}'
);

fs.writeFileSync('src/views/ResultsView.tsx', code);
