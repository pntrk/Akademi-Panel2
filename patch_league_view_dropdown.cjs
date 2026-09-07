const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetDropdown = `<select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-white border border-[#e6e2d3] text-[#5a5a40] text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-ink/20 outline-none font-medium min-w-[140px] shadow-sm"
            >
              <option value="all">Tüm Sınıflar</option>
              {availableGradeLevels.map(lvl => (
                <option key={lvl} value={lvl}>{lvl === 'Diğer' ? 'Diğer' : \`\${lvl}. Sınıflar\`}</option>
              ))}
            </select>`;

const replaceDropdown = `<select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-[#e6e2d3] text-[#5a5a40] text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-ink/20 outline-none font-medium min-w-[140px] shadow-sm"
            >
              <option value="all">Toplam Puan</option>
              {availableMonths.map(m => {
                 const [year, month] = m.split('-');
                 const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                 const monthName = monthNames[parseInt(month) - 1];
                 return <option key={m} value={m}>{monthName} {year}</option>;
              })}
            </select>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-white border border-[#e6e2d3] text-[#5a5a40] text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-ink/20 outline-none font-medium min-w-[140px] shadow-sm"
            >
              <option value="all">Tüm Sınıflar</option>
              {availableGradeLevels.map(lvl => (
                <option key={lvl} value={lvl}>{lvl === 'Diğer' ? 'Diğer' : \`\${lvl}. Sınıflar\`}</option>
              ))}
            </select>`;

code = code.replace(targetDropdown, replaceDropdown);

fs.writeFileSync('src/views/LeagueView.tsx', code);
