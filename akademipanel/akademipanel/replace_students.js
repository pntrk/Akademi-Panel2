const fs = require('fs');
let file = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

file = file.replace(
  '<table className="w-full border-collapse text-left min-w-full md:min-w-[800px] mobile-card-table">',
  '<table className="hidden md:table w-full border-collapse text-left min-w-[800px]">'
);

const mobileHtml = `
          </table>
          <div className="md:hidden flex flex-col gap-4 p-4">
            {filteredStudents.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              return (
                <div key={student.id} className={\`bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-3 \${isSelected ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border'}\`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <button onClick={() => toggleSelectStudent(student.id)} className="p-1 rounded text-brand-ink transition-colors">
                        {isSelected ? <CheckSquare className="h-5 w-5 text-brand-accent" /> : <Square className="h-5 w-5 text-brand-ink/30" />}
                      </button>
                      <span className="font-mono font-semibold text-brand-accent text-sm">#{student.no || ''}</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingStudentId(student.id);
                            setIsStudentModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center transition-all bg-white hover:border-brand-accent hover:text-brand-accent"
                          title="Öğrenciyi Düzenle"
                        >
                          <Edit2 className="h-4 w-4 mx-auto" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center transition-all bg-white hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                          title="Öğrenciyi Sil"
                        >
                          <X className="h-4 w-4 mx-auto" />
                        </button>
                    </div>
                  </div>
                  <div>
                    <button 
                      onClick={() => {
                        setEditingStudentId(student.id);
                        setIsStudentModalOpen(true);
                      }}
                      className={\`font-bold text-lg hover:underline text-left \${(student.examRegistrations || []).some(reg => !state.examHalls.some(h => (h.examId === reg.examId || h.examIds?.includes(reg.examId)) && h.seatingPlan?.some(sp => sp.studentId === student.id))) ? 'text-red-600' : 'text-brand-ink'}\`}
                    >
                      {student.name || 'İsimsiz'}
                    </button>
                    <div className="text-sm text-brand-ink/70 mt-1">Sınıf: <span className="font-semibold text-brand-ink">{student.className || '-'}</span></div>
                    <div className="text-sm text-brand-ink/70 mt-1">Salon: <span className="font-semibold text-brand-ink">
                        {(studentHallsMap[student.id] || []).length > 0 ? (
                          (studentHallsMap[student.id] || []).map(hall => hall.name).join(', ')
                        ) : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-brand-border/50 pt-3">
                    <div className="text-xs font-bold uppercase text-brand-ink/50 mb-2">Kayıtlı Sınavlar</div>
                    <div className="flex flex-wrap gap-2">
                        {(student.examRegistrations || []).map(reg => {
                          const ex = state.exams.find(e => e.id === reg.examId);
                          if(!ex) return null;
                          return (
                            <div key={reg.examId} className="flex items-stretch border border-brand-border/60 rounded-md overflow-hidden bg-white group hover:border-red-200 hover:shadow-sm transition-all h-[26px]">
                              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 flex items-center text-brand-ink/80 truncate max-w-[120px] sm:max-w-[150px]" title={ex.name}>
                                {ex.name}
                              </span>
                              <button 
                                onClick={() => handleDeregisterFromExam(student.id, reg.examId)}
                                className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-2 flex items-center justify-center transition-colors border-l border-brand-border/60 group-hover:border-red-200"
                                title="Kaydı Sil"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                        <button 
                          onClick={() => {
                            setSingleStudentToRegister(student.id);
                            setIsSingleRegisterModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold bg-[#F3F2EE] hover:bg-[#EAE8E0] text-brand-ink px-2.5 py-0.5 rounded-md transition-colors h-[26px] border border-transparent hover:border-brand-border/60 shadow-sm"
                        >
                          <Plus className="w-3 h-3" /> <span className="inline">Ekle</span>
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-brand-ink/50 italic">Öğrenci bulunamadı.</div>
            )}
          </div>
`;

file = file.replace('</table>\n        </div>\n      </div>', mobileHtml + '\n        </div>\n      </div>');

fs.writeFileSync('src/views/StudentsView.tsx', file);
