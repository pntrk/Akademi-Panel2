const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetStr = `      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">`;

const replaceStr = `      {/* Sınıf Seviyesi Seçim Alanı */}
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
          {['5', '6', '7', '8'].map(lvl => {
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
                {lvl}. Sınıflar
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/views/LeagueView.tsx', code);
