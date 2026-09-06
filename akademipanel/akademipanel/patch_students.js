const fs = require('fs');
let content = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

const targetStr = `return (
                              <tr key={reg.examId} className="border-b border-[#f5f5f0] hover:bg-[#fcfbf7]">
                                <td className="py-2.5 px-4 font-bold text-[#5a5a40]">`;

const replacement = `const isExpanded = expandedExamId === reg.examId;
                            const studentResult = state.results.find(r => r.studentNo === student.no);
                            const examDetail = studentResult?.details?.[examName];
                            
                            return (
                              <React.Fragment key={reg.examId}>
                              <tr onClick={() => setExpandedExamId(isExpanded ? null : reg.examId)} className="border-b border-[#f5f5f0] hover:bg-[#fcfbf7] cursor-pointer">
                                <td className="py-2.5 px-4 font-bold text-[#5a5a40] flex items-center gap-2">
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-[#8e8d82]" />}
                                  {examName}
                                </td>`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/views/StudentsView.tsx', content);
