const fs = require('fs');

// 1. StudentsView
let studentsCode = fs.readFileSync('src/views/StudentsView.tsx', 'utf-8');
studentsCode = studentsCode.replace(
  'return matchesSearch && matchesClass && matchesExam && matchesHall;\n    });\n  }, [state.students, searchQuery, classFilter, examFilter, hallFilter, state.exams, studentHallsMap]);',
  'return matchesSearch && matchesClass && matchesExam && matchesHall;\n    }).reverse(); // En son eklenen en üstte çıksın\n  }, [state.students, searchQuery, classFilter, examFilter, hallFilter, state.exams, studentHallsMap]);'
);
fs.writeFileSync('src/views/StudentsView.tsx', studentsCode);

// 2. ExamsView
let examsCode = fs.readFileSync('src/views/ExamsView.tsx', 'utf-8');
const searchExamsSort = `    result.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (dateA !== dateB) return dateA - dateB;
      return (a.no || 0) - (b.no || 0);
    });`;

const replaceExamsSort = `    result.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      
      // Tarihi boş olanlar (yeni eklenenler) her zaman en üstte
      if (dateA === 0 && dateB !== 0) return -1;
      if (dateB === 0 && dateA !== 0) return 1;
      
      if (dateA !== dateB) return dateB - dateA; // En yeni tarih en üstte
      return (b.no || 0) - (a.no || 0); // Aynı tarihliyse son eklenen en üstte
    });`;
examsCode = examsCode.replace(searchExamsSort, replaceExamsSort);
fs.writeFileSync('src/views/ExamsView.tsx', examsCode);

// 3. ResultsView
let resultsCode = fs.readFileSync('src/views/ResultsView.tsx', 'utf-8');
const searchResultsSort = `      return matchesSearch && matchesGrade && matchesClass;
    }).sort((a, b) => (() => {
        const aValid = Object.values(a.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const bValid = Object.values(b.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const aAvg = aValid.length > 0 ? aValid.reduce((sum, val) => sum + val, 0) / aValid.length : 0;
        const bAvg = bValid.length > 0 ? bValid.reduce((sum, val) => sum + val, 0) / bValid.length : 0;
        return bAvg - aAvg;
      })());
  },`;

const replaceResultsSort = `      return matchesSearch && matchesGrade && matchesClass;
    }).reverse().sort((a, b) => {
        const aIsNew = a.studentNo === 0 && (!a.studentName || a.studentName.trim() === '');
        const bIsNew = b.studentNo === 0 && (!b.studentName || b.studentName.trim() === '');
        if (aIsNew && !bIsNew) return -1;
        if (bIsNew && !aIsNew) return 1;

        const aValid = Object.values(a.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const bValid = Object.values(b.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const aAvg = aValid.length > 0 ? aValid.reduce((sum, val) => sum + val, 0) / aValid.length : 0;
        const bAvg = bValid.length > 0 ? bValid.reduce((sum, val) => sum + val, 0) / bValid.length : 0;
        
        if (bAvg !== aAvg) return bAvg - aAvg;
        return 0;
    });
  },`;
resultsCode = resultsCode.replace(searchResultsSort, replaceResultsSort);
fs.writeFileSync('src/views/ResultsView.tsx', resultsCode);

