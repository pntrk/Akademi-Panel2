const fs = require('fs');

let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf-8');

// Undo the broken replacements. 
code = code.replace(
  '{userRole === \'admin\' && <label className="bg-brand-accent hover:bg-[#c4a46e] text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto">',
  '<label className="bg-brand-accent hover:bg-[#c4a46e] text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto">'
);

// We replace ALL `</label>}` back to `</label>`
code = code.replaceAll('</label>}', '</label>');

// Now apply it specifically
let search = '<label className="bg-brand-accent hover:bg-[#c4a46e] text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto">\n              <Upload className="w-4 h-4 md:w-5 md:h-5" />\n              Excel\'den Sonuç Yükle\n              <input \n                type="file" \n                accept=".xlsx, .xls" \n                className="hidden"\n                onChange={handleFileUpload}\n              />\n            </label>';

let replace = '{userRole === \'admin\' && <label className="bg-brand-accent hover:bg-[#c4a46e] text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto">\n              <Upload className="w-4 h-4 md:w-5 md:h-5" />\n              Excel\'den Sonuç Yükle\n              <input \n                type="file" \n                accept=".xlsx, .xls" \n                className="hidden"\n                onChange={handleFileUpload}\n              />\n            </label>}';

code = code.replace(search, replace);

fs.writeFileSync('src/views/ResultsView.tsx', code);
