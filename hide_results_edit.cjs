const fs = require('fs');
let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf-8');

// Hide the whole action buttons container except export
code = code.replace(
  '<button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-[#d4d19d] text-[#5a5a40] rounded-full border border-transparent text-sm font-bold shadow-sm hover:bg-[#e6e2d3] transition-all">\n            <UploadCloud className="h-4 w-4 mr-2" />\n            İçe Aktar (Excel)\n          </button>',
  '{userRole === \'admin\' && <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-[#d4d19d] text-[#5a5a40] rounded-full border border-transparent text-sm font-bold shadow-sm hover:bg-[#e6e2d3] transition-all">\n            <UploadCloud className="h-4 w-4 mr-2" />\n            İçe Aktar (Excel)\n          </button>}'
);

code = code.replace(
  '<button onClick={addEmptyResult} className="flex items-center px-4 py-2 bg-[#5a5a40] text-white rounded-full border border-transparent text-sm font-bold shadow-sm hover:bg-[#43423b] transition-all">\n            <Plus className="h-4 w-4 mr-2" />\n            Manuel Ekle\n          </button>',
  '{userRole === \'admin\' && <button onClick={addEmptyResult} className="flex items-center px-4 py-2 bg-[#5a5a40] text-white rounded-full border border-transparent text-sm font-bold shadow-sm hover:bg-[#43423b] transition-all">\n            <Plus className="h-4 w-4 mr-2" />\n            Manuel Ekle\n          </button>}'
);

// We need to also disable inputs or hide the save buttons.
// Let's hide the actions column in the table if they are not admin.
code = code.replace(
  '<th className="px-3 py-3 text-right text-[10px] font-bold text-[#8e8d82] uppercase tracking-wider">\n                      İşlem\n                    </th>',
  '{userRole === \'admin\' && <th className="px-3 py-3 text-right text-[10px] font-bold text-[#8e8d82] uppercase tracking-wider">\n                      İşlem\n                    </th>}'
);

code = code.replace(
  '<td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">\n                      <button onClick={() => removeResult(result.id)} className="text-[#8e8d82] hover:text-red-500 transition-colors p-1">\n                        <Trash2 className="w-4 h-4" />\n                      </button>\n                    </td>',
  '{userRole === \'admin\' && <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">\n                      <button onClick={() => removeResult(result.id)} className="text-[#8e8d82] hover:text-red-500 transition-colors p-1">\n                        <Trash2 className="w-4 h-4" />\n                      </button>\n                    </td>}'
);

// We should hide the "Sonuç Düzenle" panel if userRole is not admin.
code = code.replace(
  '{selectedResult && (\n        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">\n          <div',
  '{userRole === \'admin\' && selectedResult && (\n        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">\n          <div'
);

// Also remove `onClick={() => setSelectedResult(result)}` if userRole isn't admin
code = code.replace(
  'onClick={() => setSelectedResult(result)}',
  'onClick={() => userRole === \'admin\' ? setSelectedResult(result) : null}'
);
code = code.replace(
  'className="hover:bg-[#fcfbf7] transition-colors cursor-pointer border-b border-[#e6e2d3] last:border-0"',
  'className={`transition-colors border-b border-[#e6e2d3] last:border-0 ${userRole === \'admin\' ? \'hover:bg-[#fcfbf7] cursor-pointer\' : \'\'}`}'
);

fs.writeFileSync('src/views/ResultsView.tsx', code);
