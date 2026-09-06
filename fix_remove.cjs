const fs = require('fs');
let code = fs.readFileSync('src/views/ExamsView.tsx', 'utf-8');

code = code.replace(
  '  const removeExam = (id: string) => {\n    setExams(state.exams.filter(e => e.id !== id));\n\n    const updatedResults',
  '  const removeExam = (id: string) => {\n    setExams(state.exams.filter(e => e.id !== id));\n  };\n\n  const syncExamNameInResults = (oldName: string, newName: string) => {\n    const updatedResults'
);
fs.writeFileSync('src/views/ExamsView.tsx', code);
