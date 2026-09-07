const fs = require('fs');
const path = 'src/views/BudgetView.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-serif text-[#5a5a40]">Bütçe Takibi</h2>
          <p className="text-[#8e8d82] mt-1">Sınav bazlı gruplanmış gelir, harcama, borç durumları ve toplu işlemler</p>
        </div>
      </div>`;

const replacement = `      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-3xl font-serif text-[#5a5a40]">Bütçe Takibi</h2>
          <p className="text-[#8e8d82] mt-1">Sınav bazlı gruplanmış gelir, harcama, borç durumları ve toplu işlemler</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 flex flex-col items-end">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Toplam Gelir</span>
            <span className="text-xl font-bold text-emerald-700">₺{totalIncome.toLocaleString('tr-TR')}</span>
          </div>
          <div className="bg-red-50 px-5 py-3 rounded-2xl border border-red-100 flex flex-col items-end">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Toplam Gider</span>
            <span className="text-xl font-bold text-red-700">₺{totalExpense.toLocaleString('tr-TR')}</span>
          </div>
          <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 flex flex-col items-end">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Bekleyen Borç</span>
            <span className="text-xl font-bold text-amber-700">₺{totalDebt.toLocaleString('tr-TR')}</span>
          </div>
          <div className={\`px-6 py-3 rounded-2xl border flex flex-col items-end \${remaining >= 0 ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-red-500 border-red-600 text-white'}\`}>
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider mb-1">NET DURUM</span>
            <span className="text-2xl font-bold">₺{remaining.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(path, code);
  console.log('Successfully patched BudgetView.tsx');
} else {
  console.error('Target string not found in BudgetView.tsx');
}
