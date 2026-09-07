const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetStr = `      {/* Sınıf Seviyesi Seçim Alanı */}
      <div className="bg-white rounded-[24px] p-4 shadow-sm border border-[#e6e2d3] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-[#5a5a40]" />
          <span className="text-sm font-bold text-[#5a5a40]">Sınıf Seviyesi Seçin:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedGrade('all')}
            className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
              selectedGrade === 'all'
                ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
            }\`}
          >
            Tüm Sınıflar
          </button>
          {availableGradeLevels.map(lvl => {
            return (
              <button
                key={lvl}
                onClick={() => setSelectedGrade(lvl)}
                className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
                  selectedGrade === lvl
                    ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                    : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
                }\`}
              >
                {lvl === 'Diğer' ? 'Diğer Sınıflar' : \`\${lvl}. Sınıflar\`}
              </button>
            );
          })}
        </div>
      </div>`;

const replaceStr = `      {/* Filtreleme Alanı */}
      <div className="bg-white rounded-[24px] p-4 shadow-sm border border-[#e6e2d3] flex flex-col md:flex-row items-start justify-between gap-4">
        
        {/* Ay Filtresi */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-[#5a5a40]">Zaman Aralığı Seçin:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedMonth('all')}
              className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
                selectedMonth === 'all'
                  ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                  : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
              }\`}
            >
              Toplam Puan
            </button>
            {availableMonths.map(m => {
              const [year, month] = m.split('-');
              const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
              const monthName = monthNames[parseInt(month) - 1];
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
                    selectedMonth === m
                      ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                      : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
                  }\`}
                >
                  {monthName} {year}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sınıf Seviyesi Seçim Alanı */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-[#5a5a40]" />
            <span className="text-sm font-bold text-[#5a5a40]">Sınıf Seviyesi Seçin:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
            <button
              onClick={() => setSelectedGrade('all')}
              className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
                selectedGrade === 'all'
                  ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                  : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
              }\`}
            >
              Tüm Sınıflar
            </button>
            {availableGradeLevels.map(lvl => {
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedGrade(lvl)}
                  className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
                    selectedGrade === lvl
                      ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                      : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
                  }\`}
                >
                  {lvl === 'Diğer' ? 'Diğer Sınıflar' : \`\${lvl}. Sınıflar\`}
                </button>
              );
            })}
          </div>
        </div>

      </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/views/LeagueView.tsx', code);
