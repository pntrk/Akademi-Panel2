const fs = require('fs');

// 1. ResultsView.tsx
let results = fs.readFileSync('src/views/ResultsView.tsx', 'utf-8');
results = results.replace(
  '<input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />',
  '{userRole === \'admin\' && <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />}'
);
results = results.replace(
  /<button onClick=\{\(\) => fileInputRef.current\?\.click\(\)\}[\s\S]*?Toplu Net Listesi Yükle\s*<\/button>/m,
  (match) => `{userRole === 'admin' && (\n            ${match}\n          )}`
);
results = results.replace(
  /<button onClick=\{handleExport\}[\s\S]*?Excel Aktar\s*<\/button>/m,
  (match) => `{userRole === 'admin' && (\n            ${match}\n          )}`
);
fs.writeFileSync('src/views/ResultsView.tsx', results);

// 2. StudentsView.tsx
let students = fs.readFileSync('src/views/StudentsView.tsx', 'utf-8');
students = students.replace(
  'const { state, setStudents, setResults, updateBudget, setExamHalls } = useAppContext();',
  'const { state, setStudents, setResults, updateBudget, setExamHalls, userRole } = useAppContext();'
);

const studentsImportPattern = /<input type="file" accept="\.xlsx, \.xls" className="hidden" ref=\{fileInputRef\}[^>]*>\s*<button\s*onClick=\{\(\) => fileInputRef\.current\?\.click\(\)\}[\s\S]*?İçe Aktar\s*<\/button>/m;
students = students.replace(studentsImportPattern, (match) => `{userRole === 'admin' && (\n          <>\n            ${match}\n          </>\n        )}`);

const studentsExportPattern = /<button\s*onClick=\{handleExport\}[\s\S]*?Dışa Aktar\s*<\/button>/m;
students = students.replace(studentsExportPattern, (match) => `{userRole === 'admin' && (\n          ${match}\n        )}`);

const studentsAddPattern = /<button\s*onClick=\{addEmptyStudent\}[\s\S]*?Yeni Öğrenci Ekle\s*<\/button>/m;
students = students.replace(studentsAddPattern, (match) => `{userRole === 'admin' && (\n          ${match}\n        )}`);

fs.writeFileSync('src/views/StudentsView.tsx', students);

// 3. ExamsView.tsx
let exams = fs.readFileSync('src/views/ExamsView.tsx', 'utf-8');
exams = exams.replace(
  'const { state, setExams, setResults, setExamHalls, updateBudget, setStudents } = useAppContext();',
  'const { state, setExams, setResults, setExamHalls, updateBudget, setStudents, userRole } = useAppContext();'
);

const examsImportPattern = /<input type="file" accept="\.xlsx, \.xls" className="hidden" ref=\{fileInputRef\}[^>]*>\s*<button\s*onClick=\{\(\) => fileInputRef\.current\?\.click\(\)\}[\s\S]*?İçe Aktar\s*<\/button>/m;
exams = exams.replace(examsImportPattern, (match) => `{userRole === 'admin' && (\n          <>\n            ${match}\n          </>\n        )}`);

const examsExportPattern = /<button\s*onClick=\{handleExport\}[\s\S]*?Dışa Aktar\s*<\/button>/m;
exams = exams.replace(examsExportPattern, (match) => `{userRole === 'admin' && (\n          ${match}\n        )}`);

const examsAddPattern = /<button\s*onClick=\{addEmptyExam\}[\s\S]*?\+ Yeni Sınav Ekle\s*<\/button>/m;
exams = exams.replace(examsAddPattern, (match) => `{userRole === 'admin' && (\n          ${match}\n        )}`);

fs.writeFileSync('src/views/ExamsView.tsx', exams);

