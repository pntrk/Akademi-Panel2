const fs = require('fs');
let code = fs.readFileSync('src/views/ExamsView.tsx', 'utf-8');

const searchRemoveExam = `  // Remove mock exam
  const removeExam = (id: string) => {
    setExams(state.exams.filter(e => e.id !== id));

    // Öğrencilerin kayıtlı sınavlarından bu sınavı sil (Senkronizasyon)
    const updatedStudents = state.students.map(s => {
      const regs = s.examRegistrations || [];
      const filtered = regs.filter(r => r.examId !== id);
      if (filtered.length !== regs.length) {
        return {
          ...s,
          examRegistrations: filtered
        };
      }
      return s;
    });
    setStudents(updatedStudents);

    // Sınav salonlarından bu sınavı kaldır ve salonları güncelle (Senkronizasyon)
    const updatedHalls = state.examHalls.map(h => {
      const examIds = (h.examIds || []).filter(eid => eid !== id);
      const examId = h.examId === id ? (examIds[0] || undefined) : h.examId;
      
      const sp = h.seatingPlan || [];
      const newSp = sp.filter(item => {
        const student = updatedStudents.find(st => st.id === item.studentId);
        if (!student) return false;
        
        // Is student still registered for any of the remaining exams in this hall?
        if (examIds.length > 0) {
           return student.examRegistrations?.some(r => examIds.includes(r.examId));
        }
        return false;
      });
      return { ...h, examIds, examId, seatingPlan: newSp };
    });
    setExamHalls(updatedHalls);
  };`;

const replaceRemoveExam = `  // Remove mock exam
  const removeExam = (id: string) => {
    setExams(state.exams.filter(e => e.id !== id));
  };`;

code = code.replace(searchRemoveExam, replaceRemoveExam);
fs.writeFileSync('src/views/ExamsView.tsx', code);
