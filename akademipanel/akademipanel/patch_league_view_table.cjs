const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

code = code.replace(/ATA-LİG Sınavlarına Katılan 8\. Sınıf Öğrencileri \(LP'ye Göre\)/g, "ATA-LİG Sınavlarına Katılan {selectedGrade === 'all' ? 'Tüm' : selectedGrade === 'Diğer' ? 'Diğer' : selectedGrade + '.'} Sınıf Öğrencileri (LP'ye Göre)");

fs.writeFileSync('src/views/LeagueView.tsx', code);
