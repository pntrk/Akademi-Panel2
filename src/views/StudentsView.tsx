import React, { useRef, useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Student } from '../types';
import { exportToExcel, importFromExcel, generateId, normalizeForSearch } from '../lib/utils';
import { 
  Upload, Download, Edit2, Plus, Trash2, X, CheckSquare, Square, 
  Search, Calendar, DollarSign, Users, Award, Sparkles, BookOpen, 
  AlertCircle, SlidersHorizontal, Trash, ChevronDown, ChevronRight,
  TrendingUp, Wallet, Check, UserPlus, Filter, DoorOpen, CheckCircle2,
  XCircle, ArrowUpDown
} from 'lucide-react';

export const StudentsView = () => {
  const { state, setStudents, setResults, updateBudget, setExamHalls, userRole } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [hallFilter, setHallFilter] = useState('');

  // Selection states
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Bulk modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedBulkExamIds, setSelectedBulkExamIds] = useState<string[]>([]);
  const [registrationFee, setRegistrationFee] = useState<number>(0);
  const [registrationPaid, setRegistrationPaid] = useState<boolean>(false);

  // New registration states inside student details modal
  const [selectedDetailExamIds, setSelectedDetailExamIds] = useState<string[]>([]);
  const [newRegFee, setNewRegFee] = useState<number>(0);
  const [newRegPaid, setNewRegPaid] = useState<boolean>(false);

  // Single student details modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Map student IDs to their assigned exam halls
  const studentHallsMap = useMemo(() => {
    const map: Record<string, { id: string; name: string }[]> = {};
    state.examHalls.forEach(h => {
      if (h.seatingPlan) {
        h.seatingPlan.forEach(item => {
          if (!map[item.studentId]) {
            map[item.studentId] = [];
          }
          if (!map[item.studentId].some(existing => existing.id === h.id)) {
            map[item.studentId].push({ id: h.id, name: h.name });
          }
        });
      }
    });
    return map;
  }, [state.examHalls]);

  // Compute unique classes for filter dropdown
  const uniqueClassesForFilter = useMemo(() => {
    const classes = new Set<string>();
    state.students.forEach(s => {
      if (s.className) classes.add(s.className.trim());
    });
    return Array.from(classes).sort();
  }, [state.students]);

  // Compute unique halls for filter dropdown
  const uniqueHallsForFilter = useMemo(() => {
    return state.examHalls.map(h => ({ id: h.id, name: h.name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.examHalls]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return state.students.filter(s => {
      const matchesSearch = normalizeForSearch(s.name).includes(normalizeForSearch(searchQuery)) || 
                            (s.no && s.no.toString().includes(searchQuery));
      const matchesClass = !classFilter || s.className === classFilter;
      
      let matchesExam = true;
      if (examFilter) {
        const exam = state.exams.find(e => e.id === examFilter);
        if (exam && exam.participatingClasses && exam.participatingClasses.length > 0) {
          const studentGrade = s.className ? (s.className.trim().match(/^(\d+)/)?.[1] || 'Diğer') : 'Diğer';
          matchesExam = exam.participatingClasses.includes(studentGrade);
        } else {
          matchesExam = s.examRegistrations?.some(r => r.examId === examFilter) || false;
        }
      }

      let matchesHall = true;
      if (hallFilter) {
        const assignedHalls = studentHallsMap[s.id] || [];
        matchesHall = assignedHalls.some(h => h.id === hallFilter);
      }

      return matchesSearch && matchesClass && matchesExam && matchesHall;
    }).reverse(); // En son eklenen en üstte çıksın
  }, [state.students, searchQuery, classFilter, examFilter, hallFilter, state.exams, studentHallsMap]);

  // Overall registration statistics
  const stats = useMemo(() => {
    let totalRegistrations = 0;
    let totalFees = 0;
    let totalUnpaidFees = 0;
    state.students.forEach(s => {
      const regs = s.examRegistrations || [];
      totalRegistrations += regs.length;
      regs.forEach(r => {
        if (r.isPaid) {
          totalFees += r.fee;
        } else {
          totalUnpaidFees += r.fee;
        }
      });
    });
    return {
      totalStudents: state.students.length,
      totalRegistrations,
      totalFees,
      totalUnpaidFees
    };
  }, [state.students]);

  // Checkbox functions
  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const allFilteredSelected = useMemo(() => {
    return filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id));
  }, [filteredStudents, selectedStudentIds]);

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect only filtered students
      const filteredIds = filteredStudents.map(s => s.id);
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Add all filtered student ids to selection
      const newIds = new Set([...selectedStudentIds, ...filteredStudents.map(s => s.id)]);
      setSelectedStudentIds(Array.from(newIds));
    }
  };

  // Perform bulk registration
  const handleBulkRegister = () => {
    if (selectedBulkExamIds.length === 0) {
      alert("Lütfen en az bir deneme sınavı seçiniz.");
      return;
    }
    const exams = state.exams.filter(e => selectedBulkExamIds.includes(e.id));
    if (exams.length === 0) return;

    const fee = parseFloat(registrationFee.toString()) || 0;

    // 1. Update students in state with their new exam registrations
    let updatedStudents = [...state.students];
    
    exams.forEach(exam => {
      updatedStudents = updatedStudents.map(s => {
        if (selectedStudentIds.includes(s.id)) {
          const regs = s.examRegistrations || [];
          // Prevent duplicate registrations for the same exam by removing prior entry
          const filteredRegs = regs.filter(r => r.examId !== exam.id);
          return {
            ...s,
            examRegistrations: [
              ...filteredRegs,
              {
                examId: exam.id,
                fee: fee,
                isPaid: registrationPaid,
                dateRegistered: new Date().toLocaleDateString()
              }
            ]
          };
        }
        return s;
      });
    });

    setStudents(updatedStudents);

    alert(`Seçilen ${selectedStudentIds.length} öğrenci seçilen sınavlara başarıyla kaydedildi!`);
    setSelectedStudentIds([]);
    setIsBulkModalOpen(false);
    setSelectedBulkExamIds([]);
    setRegistrationFee(0);
    setRegistrationPaid(false);
  };

  const handleBulkDelete = () => {
    const remainingStudents = state.students.filter(s => !selectedStudentIds.includes(s.id));
    setStudents(remainingStudents);
    
    // Salon oturma planlarından toplu silinen öğrencileri kaldır
    const updatedHalls = state.examHalls.map(h => {
      const sp = h.seatingPlan || [];
      const filtered = sp.filter(item => !selectedStudentIds.includes(item.studentId));
      if (filtered.length !== sp.length) {
        return {
          ...h,
          seatingPlan: filtered
        };
      }
      return h;
    });
    setExamHalls(updatedHalls);

    setSelectedStudentIds([]);
    
    // Sync all exams since we might have removed registered students
    syncAllExamBudgets(remainingStudents);
  };

  const handlePayAllRegistrations = (studentId: string) => {
    const updatedStudents = state.students.map(s => {
      if (s.id === studentId) {
        const regs = s.examRegistrations || [];
        const hasUnpaid = regs.some(r => !r.isPaid);
        if (!hasUnpaid) return s; // Nothing to pay
        return {
          ...s,
          examRegistrations: regs.map(r => ({ ...r, isPaid: true }))
        };
      }
      return s;
    });
    setStudents(updatedStudents);
  };

  // Remove a single registration from a student
  const removeSingleRegistration = (studentId: string, examId: string) => {
    const student = state.students.find(s => s.id === studentId);
    const reg = student?.examRegistrations?.find(r => r.examId === examId);

    const updatedStudents = state.students.map(s => {
      if (s.id === studentId) {
        const regs = s.examRegistrations || [];
        return {
          ...s,
          examRegistrations: regs.filter(r => r.examId !== examId)
        };
      }
      return s;
    });
    setStudents(updatedStudents);

    // Also remove the student from any exam hall seating plan for this exam (Sync info)
    const updatedHalls = state.examHalls.map(h => {
      const isForThisExam = h.examId === examId || h.examIds?.includes(examId);
      if (isForThisExam && h.seatingPlan?.some(sp => sp.studentId === studentId)) {
        return {
          ...h,
          seatingPlan: h.seatingPlan.filter(sp => sp.studentId !== studentId)
        };
      }
      return h;
    });
    setExamHalls(updatedHalls);
  };

  // Add exam registrations to a student from the detail modal
  const addDetailRegistrations = (studentId: string) => {
    if (selectedDetailExamIds.length === 0) return;
    
    const exams = state.exams.filter(e => selectedDetailExamIds.includes(e.id));
    if (exams.length === 0) return;

    const fee = parseFloat(newRegFee.toString()) || 0;

    let updatedStudents = [...state.students];

    exams.forEach(exam => {
      updatedStudents = updatedStudents.map(s => {
        if (s.id === studentId) {
          const regs = s.examRegistrations || [];
          const filteredRegs = regs.filter(r => r.examId !== exam.id);
          return {
            ...s,
            examRegistrations: [
              ...filteredRegs,
              {
                examId: exam.id,
                fee: fee,
                isPaid: newRegPaid,
                dateRegistered: new Date().toLocaleDateString()
              }
            ]
          };
        }
        return s;
      });
    });

    setStudents(updatedStudents);

    // Reset states
    setSelectedDetailExamIds([]);
    setNewRegFee(0);
    setNewRegPaid(false);
  };

  // Toggle single registration payment status
  const toggleRegistrationPayment = (studentId: string, examId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const updatedStudents = state.students.map(s => {
      if (s.id === studentId) {
        const regs = (s.examRegistrations || []).map(r => {
          if (r.examId === examId) {
            const nextPaid = !r.isPaid;
            return { ...r, isPaid: nextPaid };
          }
          return r;
        });
        return { ...s, examRegistrations: regs };
      }
      return s;
    });

    setStudents(updatedStudents);
  };

  // Change student's exam hall seating plan assignment directly (Synchronously synced)
  const handleHallChange = (examId: string, targetHallId: string) => {
    const student = state.students.find(s => s.id === editingStudentId);
    if (!student) return;

    // Clone examHalls so we can modify them
    let updatedHalls = [...state.examHalls];

    // 1. Remove the student from any existing hall seating plan for this exam
    updatedHalls = updatedHalls.map(h => {
      const isForThisExam = h.examId === examId || h.examIds?.includes(examId);
      if (isForThisExam && h.seatingPlan?.some(sp => sp.studentId === student.id)) {
        return {
          ...h,
          seatingPlan: h.seatingPlan.filter(sp => sp.studentId !== student.id)
        };
      }
      return h;
    });

    // 2. If a target hall is selected (not empty / "none")
    if (targetHallId && targetHallId !== 'unassigned') {
      const hallIndex = updatedHalls.findIndex(h => h.id === targetHallId);
      if (hallIndex !== -1) {
        const h = updatedHalls[hallIndex];
        
        // Calculate capacity
        const calculatedCapacity = h.columns?.reduce((acc, col) => acc + (col.deskCount * col.seatsPerDesk), 0) || h.capacity || 30;
        
        // Find empty desk numbers
        const occupiedDesks = (h.seatingPlan || []).map(sp => sp.deskNumber);
        let targetDesk = -1;
        for (let d = 1; d <= calculatedCapacity; d++) {
          if (!occupiedDesks.includes(d)) {
            targetDesk = d;
            break;
          }
        }

        if (targetDesk === -1) {
          alert(`Seçilen "${h.name}" salonunun tüm sıraları doludur (Kapasite: ${calculatedCapacity}). Lütfen başka bir salon seçin veya salon kapasitesini artırın.`);
          return;
        }

        // Add student to the seating plan of the target hall
        const newSeatingItem = {
          deskNumber: targetDesk,
          studentId: student.id,
          studentNo: student.no,
          studentName: student.name,
          studentClass: student.className
        };

        const updatedSeatingPlan = [...(h.seatingPlan || []), newSeatingItem];
        
        // Ensure the student's class is in the hall's selectedClasses
        let updatedClasses = [...(h.selectedClasses || [])];
        if (student.className && !updatedClasses.includes(student.className)) {
          updatedClasses.push(student.className);
        }

        updatedHalls[hallIndex] = {
          ...h,
          seatingPlan: updatedSeatingPlan,
          selectedClasses: updatedClasses
        };
      }
    }

    // 3. Update the exam halls state
    setExamHalls(updatedHalls);
  };

  // Excel integration helpers
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFromExcel(file, (data) => {
        const currentStudents = [...state.students];
        
        data.forEach((rawRow: any) => {
          const row: any = {};
          Object.keys(rawRow).forEach(k => {
            row[k.toString().trim().toUpperCase()] = rawRow[k];
          });

          let no = parseInt(row['NO'] || row['ÖĞRENCİ NO'] || row['ÖĞR. NO'] || row['ÖĞR.NO'] || row['NUMARA'] || row['ÖĞRENCİ NUMARASI'] || '0');
          const name = (row['ADI SOYADI'] || row['ADI'] || row['SOYADI'] || row['AD SOYAD'] || row['İSİM'] || row['NAME'] || '').toString().trim();
          const className = (row['SINIFI'] || row['SINIF'] || row['ŞUBE'] || row['CLASS'] || '').toString().trim();
          
          if (!name && no === 0) return;
          
          let existing = currentStudents.find(s => s.no === no && no !== 0);
          
          if (!existing && name) {
            existing = currentStudents.find(s => s.name.toLowerCase() === name.toLowerCase());
          }
          
          if (existing) {
            // Update existing
            if (no === 0 && existing.no !== 0) {
                no = existing.no; // use existing number if excel doesn't have it
            }
            existing.no = no !== 0 ? no : existing.no;
            existing.name = name || existing.name;
            existing.className = className || existing.className;
          } else {
            // Create new
            currentStudents.push({
              id: generateId(),
              no,
              name,
              className,
              examRegistrations: []
            });
          }
        });
        
        setStudents(currentStudents);
      });
    }
  };

  const handleExport = () => {
    const dataToExport = state.students.map(s => {
      const regsStr = (s.examRegistrations || [])
        .map(r => {
          const exam = state.exams.find(e => e.id === r.examId);
          return `${exam ? exam.name : 'Sınav'} (₺${r.fee})`;
        })
        .join(', ');

      return {
        NO: s.no,
        'ADI SOYADI': s.name,
        'SINIFI': s.className,
        'KAYITLI SINAVLAR': regsStr || 'Kayıt Yok'
      };
    });
    exportToExcel(dataToExport, 'ogrenciler_ve_sinav_kayitlari');
  };

  const addEmptyStudent = () => {
    setStudents([...state.students, { id: generateId(), no: 0, name: '', className: '', examRegistrations: [] }]);
  };

  const updateStudent = (id: string, field: keyof Student, value: string | number) => {
    const oldStudent = state.students.find(s => s.id === id);
    if (!oldStudent) return;
    
    setStudents(state.students.map(s => s.id === id ? { ...s, [field]: value } : s));
    
    // Eğer öğrenci numarası veya adı güncelleniyorsa, bağlı sonuçlara da yansıt (atardamar mantığı)
    if (field === 'no' && oldStudent.no !== value) {
      setResults(state.results.map(r => {
        if (r.studentNo === oldStudent.no) {
          return { ...r, studentNo: value as number, studentId: id };
        }
        return r;
      }));
    } else if (field === 'name' && oldStudent.name !== value) {
      setResults(state.results.map(r => {
        if (r.studentNo === oldStudent.no) {
          return { ...r, studentName: value as string, studentId: id };
        }
        return r;
      }));
    } else if (field === 'className' && oldStudent.className !== value) {
      setResults(state.results.map(r => {
        if (r.studentNo === oldStudent.no) {
          return { ...r, studentClass: value as string, studentId: id };
        }
        return r;
      }));
    }

    // Salon oturma planlarındaki öğrenci bilgilerini senkronize et
    if (field === 'no' || field === 'name' || field === 'className') {
      const updatedHalls = state.examHalls.map(h => {
        const seatingPlan = h.seatingPlan || [];
        if (seatingPlan.some(sp => sp.studentId === id)) {
          return {
            ...h,
            seatingPlan: seatingPlan.map(sp => {
              if (sp.studentId === id) {
                return {
                  ...sp,
                  studentNo: field === 'no' ? (value as number) : sp.studentNo,
                  studentName: field === 'name' ? (value as string) : sp.studentName,
                  studentClass: field === 'className' ? (value as string) : sp.studentClass,
                };
              }
              return sp;
            })
          };
        }
        return h;
      });
      setExamHalls(updatedHalls);
    }
  };

  const removeStudent = (id: string) => {
    const remainingStudents = state.students.filter(s => s.id !== id);
    setStudents(remainingStudents);
    setSelectedStudentIds(prev => prev.filter(item => item !== id));
    
    // Salon oturma planlarından silinen öğrenciyi kaldır
    const updatedHalls = state.examHalls.map(h => {
      const sp = h.seatingPlan || [];
      if (sp.some(item => item.studentId === id)) {
        return {
          ...h,
          seatingPlan: sp.filter(item => item.studentId !== id)
        };
      }
      return h;
    });
    setExamHalls(updatedHalls);
    
    // Sync all exams
    syncAllExamBudgets(remainingStudents);
  };

  // Helper to sync all exam budgets when students are removed globally
  const syncAllExamBudgets = (currentStudents: Student[]) => {
    // No-op: budget expenses are now decoupled from student count and managed by order quantity in ExamsView
  };

  return (
    <div className="space-y-2.5 sm:space-y-6 md:space-y-8 flex flex-col h-full relative font-sans text-brand-ink">
      {/* Header bar - Ultra-Compact on Mobile, Rich on Desktop */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-brand-accent/15 text-brand-accent flex items-center justify-center sm:hidden shrink-0 font-bold">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h2 className="text-lg sm:text-3xl md:text-4xl font-serif text-brand-ink font-bold tracking-tight leading-tight">Öğrenci Kayıtları</h2>
            </div>
            <span className="sm:hidden text-[11px] font-medium text-brand-ink/50 bg-[#f5f4f0] px-2 py-0.5 rounded-full border border-brand-border/60">
              {stats.totalStudents} Öğrenci
            </span>
          </div>
          <p className="hidden sm:block text-brand-ink/60 text-xs sm:text-sm mt-0.5">Sisteme kayıtlı öğrenciler, salon yerleşimleri ve sınav ücreti yönetimi</p>
        </div>
        
        {/* Action Buttons: Ultra-Compact & Grid-Optimized on Mobile */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto py-0.5">
          {userRole === 'admin' && (
            <>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-white border border-brand-border text-[11px] sm:text-xs font-bold text-brand-ink rounded-xl transition-all hover:bg-[#FAF9F6] active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
                title="Excel'den İçe Aktar"
              >
                <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-ink/70 shrink-0" />
                <span className="truncate">İçe Aktar</span>
              </button>

              <button 
                onClick={handleExport} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-white border border-brand-border text-[11px] sm:text-xs font-bold text-brand-ink rounded-xl transition-all hover:bg-[#FAF9F6] active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
                title="Excel'e Dışa Aktar"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-ink/70 shrink-0" />
                <span className="truncate">Dışa Aktar</span>
              </button>

              <button 
                onClick={addEmptyStudent} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-[#151618] border border-[#151618] text-white text-[11px] sm:text-xs font-bold rounded-xl transition-all hover:bg-black active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
              >
                <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">+ Öğrenci</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Stats Grid - Compact 2x2 on Mobile, 4 Cols on Desktop */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
        {/* Stat 1: Toplam Öğrenci */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-brand-accent/50">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Toplam Öğrenci</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-brand-ink leading-none">{stats.totalStudents}</span>
            <span className="text-[10px] sm:text-xs text-brand-ink/50 font-medium">kişi</span>
          </div>
        </div>

        {/* Stat 2: Aktif Sınav Kaydı */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-brand-accent/50">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Aktif Kayıt</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-brand-ink leading-none">{stats.totalRegistrations}</span>
            <span className="text-[10px] sm:text-xs text-brand-ink/50 font-medium">sınav</span>
          </div>
        </div>

        {/* Stat 3: Gelen Gelir */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-emerald-300">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Gelen Gelir</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-emerald-700 leading-none">₺{stats.totalFees}</span>
        </div>

        {/* Stat 4: Toplam Borç */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-rose-300">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Toplam Borç</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-rose-600 leading-none">₺{stats.totalUnpaidFees}</span>
        </div>
      </section>

      {/* Filter Bar - Modern, Ergonomic, Mobile-Optimized */}
      <section className="bg-white p-3 sm:p-4 rounded-2xl border border-brand-border/70 shadow-sm flex flex-col gap-2.5 sm:gap-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40 h-4 w-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Öğrenci adı veya numarası ile ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F4F0] border border-transparent rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-brand-ink placeholder-brand-ink/40 font-medium focus:bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-ink/40 hover:text-brand-ink p-1 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns - Grid on Mobile (Zero Overflow), Flex on Desktop */}
          <div className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-2 items-center w-full sm:w-auto shrink-0 py-0.5">
            <div className="relative w-full min-w-0">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full appearance-none pl-2 sm:pl-3 pr-5 sm:pr-7 py-2 border border-brand-border/80 text-[11px] sm:text-xs bg-white rounded-xl text-brand-ink focus:outline-none focus:border-brand-accent font-semibold truncate shadow-xs cursor-pointer sm:min-w-[105px]"
              >
                <option value="">Tüm Şubeler</option>
                {uniqueClassesForFilter.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-ink/40 absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>

            <div className="relative w-full min-w-0">
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full appearance-none pl-2 sm:pl-3 pr-5 sm:pr-7 py-2 border border-brand-border/80 text-[11px] sm:text-xs bg-white rounded-xl text-brand-ink focus:outline-none focus:border-brand-accent font-semibold truncate shadow-xs cursor-pointer sm:min-w-[110px] sm:max-w-[160px]"
              >
                <option value="">Tüm Sınavlar</option>
                {state.exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-ink/40 absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>

            <div className="relative w-full min-w-0">
              <select
                value={hallFilter}
                onChange={(e) => setHallFilter(e.target.value)}
                className="w-full appearance-none pl-2 sm:pl-3 pr-5 sm:pr-7 py-2 border border-brand-border/80 text-[11px] sm:text-xs bg-white rounded-xl text-brand-ink focus:outline-none focus:border-brand-accent font-semibold truncate shadow-xs cursor-pointer sm:min-w-[105px]"
              >
                <option value="">Tüm Salonlar</option>
                {uniqueHallsForFilter.map(hall => (
                  <option key={hall.id} value={hall.id}>{hall.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-ink/40 absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>

            {(searchQuery || classFilter || examFilter || hallFilter) && (
              <button 
                onClick={() => { setSearchQuery(''); setClassFilter(''); setExamFilter(''); setHallFilter(''); }}
                className="col-span-3 sm:col-span-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold shrink-0 transition-colors shadow-xs active:scale-95 cursor-pointer mt-1 sm:mt-0"
              >
                <X className="w-3 h-3" />
                <span>Temizle</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Student List Container */}
      <div className="bg-white border border-brand-border/70 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px]">
        
        {/* Desktop Table View */}
        <div className="overflow-auto flex-1 w-full hidden md:block">
          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
              <tr className="bg-[#FAF9F6] border-b-2 border-brand-ink">
                <th width="50" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider text-center sticky top-0 bg-[#FAF9F6]">
                  <button 
                    onClick={handleSelectAll}
                    className="p-1 rounded hover:bg-black/5 text-brand-ink transition-colors cursor-pointer"
                    title="Hepsini Seç / Bırak"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-accent" />
                    ) : (
                      <Square className="h-4 w-4 text-brand-ink/40" />
                    )}
                  </button>
                </th>
                <th width="90" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">NO</th>
                <th className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">ADI SOYADI</th>
                <th width="120" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">SINIFI</th>
                <th width="180" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">SINAV SALONU</th>
                <th className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">KAYITLI SINAVLAR</th>
                <th width="80" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider text-center sticky top-0 bg-[#FAF9F6]">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-[0.85rem]">
              {filteredStudents.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <tr 
                    key={student.id} 
                    className={`border-b border-brand-border/60 transition-all hover:bg-[#FAF9F6] ${
                      isSelected ? 'bg-brand-accent/5' : ''
                    }`}
                  >
                    {/* Checkbox column */}
                    <td className="py-4 px-5 text-center" data-label="SEÇİM">
                      <button 
                        onClick={() => toggleSelectStudent(student.id)}
                        className="p-1 rounded text-brand-ink transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-brand-accent" />
                        ) : (
                          <Square className="h-4 w-4 text-brand-ink/30 hover:text-brand-ink" />
                        )}
                      </button>
                    </td>

                    {/* Student Number Input */}
                    <td className="py-4 px-5" data-label="NO">
                      <span className="font-mono font-semibold text-brand-accent">{student.no || ''}</span>
                    </td>

                    {/* Student Name Input */}
                    <td className="py-4 px-5" data-label="ADI SOYADI">
                      <button 
                        onClick={() => {
                          setEditingStudentId(student.id);
                          setIsStudentModalOpen(true);
                        }}
                        className={`font-semibold hover:underline text-left cursor-pointer transition-all ${
                          (student.examRegistrations || []).some(reg => 
                            !state.examHalls.some(h => 
                              (h.examId === reg.examId || h.examIds?.includes(reg.examId)) && 
                              h.seatingPlan?.some(sp => sp.studentId === student.id)
                            )
                          ) ? 'text-red-600' : 'text-brand-ink'
                        }`}
                      >
                        {student.name || 'İsimsiz'}
                      </button>
                    </td>

                    {/* Student Class Input */}
                    <td className="py-4 px-5" data-label="SINIFI">
                      <span className="bg-[#F3F2EE] px-2.5 py-1 text-[0.7rem] font-semibold text-brand-ink rounded">{student.className || '-'}</span>
                    </td>

                    {/* Student Exam Hall */}
                    <td className="py-4 px-5" data-label="SINAV SALONU">
                      <div className="flex flex-col gap-1">
                        {(studentHallsMap[student.id] || []).length > 0 ? (
                          (studentHallsMap[student.id] || []).map(hall => (
                            <span key={hall.id} className="text-[0.75rem] text-brand-ink font-semibold bg-[#151618]/5 px-2 py-0.5 rounded border border-brand-border w-fit">
                              {hall.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-brand-ink/40 font-semibold">-</span>
                        )}
                      </div>
                    </td>

                    {/* Live Exam Registrations Badges with quick-delete / quick-add */}
                    <td className="py-4 px-5" data-label="KAYITLI SINAVLAR" id="student-exam-regs-cell">
                      <div className="flex flex-wrap gap-2 items-center">
                        {(student.examRegistrations || []).map((reg) => {
                          const examObj = state.exams.find(e => e.id === reg.examId);
                          const examName = examObj ? examObj.name : 'Sınav';
                          
                          return (
                            <span 
                              key={reg.examId} 
                              className="inline-flex items-center bg-[#F3F2EE] text-brand-ink border border-brand-border px-3 py-0.5 rounded text-[0.75rem] font-semibold"
                            >
                              {examName}
                            </span>
                          );
                        })}
                        
                        {/* Quick Register Plus Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentIds([student.id]);
                            setIsBulkModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-transparent border border-dashed border-brand-accent text-brand-accent hover:bg-brand-accent/5 rounded text-[0.7rem] font-semibold transition-all cursor-pointer shrink-0"
                          title="Bu Öğrenciyi Sınava Kaydet"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Sınav Ekle</span>
                        </button>
                      </div>
                    </td>

                    {/* Single Actions */}
                    <td className="py-4 px-5 text-center" data-label="SEÇİM">
                      <button 
                        onClick={() => removeStudent(student.id)} 
                        className="w-7 h-7 rounded-full border border-brand-border flex items-center justify-center cursor-pointer transition-all bg-white hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                        title="Öğrenciyi Sil"
                      >
                        <X className="h-3.5 w-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-brand-ink/40 font-medium">
                    {state.students.length === 0 
                      ? "Kayıtlı öğrenci bulunmuyor. Yeni ekleyebilir veya Excel'den aktarabilirsiniz." 
                      : "Arama kriterine uyan öğrenci bulunamadı."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Modern Cards View */}
        <div className="md:hidden flex-1 overflow-auto w-full p-3 flex flex-col gap-2.5 bg-[#F9F8F5]">
          
          {/* Mobile List Quick Control Bar */}
          <div className="flex items-center justify-between px-1 py-1 text-xs text-brand-ink/60 font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-brand-ink">{filteredStudents.length}</span>
              <span>öğrenci listelendi</span>
            </div>
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs text-brand-accent font-bold hover:underline cursor-pointer active:scale-95 transition-all"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-brand-accent" />
                  <span>Seçimi Kaldır</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-brand-ink/40" />
                  <span>Tümünü Seç</span>
                </>
              )}
            </button>
          </div>

          {filteredStudents.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            const studentHalls = studentHallsMap[student.id] || [];
            const registrations = student.examRegistrations || [];
            
            const unpaidTotal = registrations.reduce((acc, r) => !r.isPaid ? acc + (r.fee || 0) : acc, 0);
            const paidTotal = registrations.reduce((acc, r) => r.isPaid ? acc + (r.fee || 0) : acc, 0);
            const hasRegistrations = registrations.length > 0;

            const hasMissingHall = registrations.some(reg => 
              !state.examHalls.some(h => 
                (h.examId === reg.examId || h.examIds?.includes(reg.examId)) && 
                h.seatingPlan?.some(sp => sp.studentId === student.id)
              )
            );

            return (
              <div 
                key={student.id} 
                className={`bg-white rounded-2xl p-3.5 border transition-all duration-200 shadow-sm flex flex-col gap-2.5 ${
                  isSelected 
                    ? 'border-brand-accent bg-amber-500/[0.04] ring-1 ring-brand-accent/40' 
                    : 'border-brand-border/80 hover:border-brand-border'
                }`}
              >
                {/* Card Top Control Row: Selection Checkbox + Student No + Class Badge + Actions */}
                <div className="flex items-center justify-between gap-2 border-b border-brand-border/40 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button 
                      onClick={() => toggleSelectStudent(student.id)} 
                      className="p-1 text-brand-ink active:scale-90 transition-transform shrink-0 cursor-pointer"
                      title="Öğrenci Seç"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-brand-accent" />
                      ) : (
                        <Square className="h-5 w-5 text-brand-ink/30 hover:text-brand-ink" />
                      )}
                    </button>

                    <div className="bg-amber-100/90 text-amber-950 border border-amber-200/80 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold shrink-0 flex items-center gap-1 shadow-2xs">
                      <span className="text-[10px] text-amber-800/70 font-sans uppercase">No:</span>
                      <span>{student.no || '-'}</span>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-bold truncate">
                      {student.className || '-'}
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => {
                        setEditingStudentId(student.id);
                        setIsStudentModalOpen(true);
                      }}
                      className="w-8 h-8 rounded-xl bg-gray-50 border border-brand-border/70 flex items-center justify-center text-brand-ink/70 hover:text-brand-accent hover:border-brand-accent transition-all active:scale-95 cursor-pointer"
                      title="Öğrenciyi Düzenle / Detay"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => removeStudent(student.id)}
                      className="w-8 h-8 rounded-xl bg-gray-50 border border-brand-border/70 flex items-center justify-center text-brand-ink/40 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 cursor-pointer"
                      title="Öğrenciyi Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Student Name Section (Super legible, high hierarchy) */}
                <div className="py-0.5">
                  <button 
                    onClick={() => {
                      setEditingStudentId(student.id);
                      setIsStudentModalOpen(true);
                    }}
                    className={`text-base font-serif font-bold text-left leading-snug hover:underline cursor-pointer transition-colors block w-full break-words ${
                      hasMissingHall ? 'text-rose-600' : 'text-brand-ink'
                    }`}
                  >
                    {student.name || 'İsimsiz Öğrenci'}
                  </button>
                </div>

                {/* Card Meta Badges (Hall, Payment Status) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Hall Badge */}
                  <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 border ${
                    studentHalls.length > 0 
                      ? 'bg-amber-50/80 border-amber-200/80 text-amber-900' 
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}>
                    <DoorOpen className="w-3 h-3 shrink-0 opacity-70" />
                    <span className="truncate max-w-[150px]">
                      {studentHalls.length > 0 ? studentHalls.map(h => h.name).join(', ') : 'Salonsuz'}
                    </span>
                  </div>

                  {/* Payment Status Badge */}
                  {hasRegistrations && (
                    unpaidTotal > 0 ? (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>₺{unpaidTotal} Borç</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Ödendi</span>
                      </div>
                    )
                  )}
                </div>

                {/* Card Bottom: Registrations Chips & Quick Add Button */}
                <div className="pt-2 border-t border-brand-border/40 flex flex-wrap items-center gap-1.5">
                  {registrations.map(reg => {
                    const ex = state.exams.find(e => e.id === reg.examId);
                    if (!ex) return null;
                    return (
                      <div 
                        key={reg.examId} 
                        className={`flex items-center border rounded-xl overflow-hidden pl-2 pr-1 py-1 gap-1 text-[11px] font-semibold transition-all ${
                          reg.isPaid 
                            ? 'bg-emerald-50/50 border-emerald-200/70 text-emerald-900' 
                            : 'bg-rose-50/50 border-rose-200/70 text-rose-900'
                        }`}
                      >
                        <button 
                          onClick={() => toggleRegistrationPayment(student.id, reg.examId)}
                          className="flex items-center gap-1 hover:underline cursor-pointer"
                          title={reg.isPaid ? "Ödendi (Değiştirmek için tıkla)" : "Ödenmedi (Ödendi yapmak için tıkla)"}
                        >
                          <span className="truncate max-w-[110px]">{ex.name}</span>
                          <span className="text-[10px] opacity-75">(₺{reg.fee})</span>
                          {reg.isPaid ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                          )}
                        </button>
                        
                        <button 
                          onClick={() => removeSingleRegistration(student.id, reg.examId)}
                          className="text-gray-400 hover:text-rose-600 p-0.5 rounded hover:bg-black/5 transition-colors ml-0.5"
                          title="Sınav Kaydını Sil"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Quick Add Exam to Student */}
                  <button 
                    onClick={() => {
                      setSelectedStudentIds([student.id]);
                      setIsBulkModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-xl transition-all shadow-xs active:scale-95"
                    title="Yeni Sınav Ekle"
                  >
                    <Plus className="w-3 h-3 text-amber-700" />
                    <span>+ Sınav</span>
                  </button>

                  {/* Quick Pay All Unpaid Fees Button */}
                  {unpaidTotal > 0 && (
                    <button 
                      onClick={() => handlePayAllRegistrations(student.id)}
                      className="flex items-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-xl transition-all shadow-xs active:scale-95 ml-auto"
                      title="Öğrencinin tüm sınav borçlarını ödendi yap"
                    >
                      <Check className="w-3 h-3" />
                      <span>Tahsil Et</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-brand-border/60">
              <Users className="w-8 h-8 text-brand-ink/20 mx-auto mb-2" />
              <p className="text-xs text-brand-ink/60 font-semibold">Arama veya filtre kriterlerine uyan öğrenci bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* STICKY FLOATING BULK ACTIONS BAR - Modern Curved Glass on Mobile */}
      {selectedStudentIds.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-[#151618]/95 backdrop-blur-xl text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-2xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 z-40 max-w-2xl w-[92%] animate-slide-up">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <span className="bg-brand-accent/20 border border-brand-accent/40 text-brand-accent px-3 py-1 rounded-xl text-xs font-bold font-mono shrink-0">
              {selectedStudentIds.length} Öğrenci Seçildi
            </span>
            <button 
              onClick={() => setSelectedStudentIds([])}
              className="text-white/60 hover:text-white text-xs underline sm:hidden"
            >
              Vazgeç
            </button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={() => setIsBulkModalOpen(true)}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-brand-accent to-[#9c7b48] text-white hover:opacity-90 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-white shrink-0" />
              <span>Sınava Toplu Kaydet</span>
            </button>
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 active:scale-95 cursor-pointer shrink-0"
              title="Seçili Öğrencileri Sil"
            >
              <Trash className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Sil</span>
            </button>
            <button 
              onClick={() => setSelectedStudentIds([])}
              className="text-white/60 hover:text-white px-2 py-2 text-xs transition-colors cursor-pointer hidden sm:inline"
            >
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* BULK REGISTRATION & FEE INPUT MODAL            */}
      {/* ============================================== */}
      {isBulkModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-opacity animate-fade-in"
          onClick={() => {
            setIsBulkModalOpen(false);
            if (selectedStudentIds.length === 1) setSelectedStudentIds([]); // Clean up if single action
          }}
        >
          <div 
            className="bg-white rounded-t-[28px] sm:rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full max-w-md overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-slide-up sm:animate-none pb-safe sm:pb-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#fcfbf7] border-b border-[#e6e2d3] p-4 sm:p-5 flex items-center justify-between rounded-t-[28px] sm:rounded-t-[32px]">
              <div className="flex items-center space-x-2.5">
                <div className="bg-[#5a5a40]/10 p-2 rounded-xl">
                  <Award className="h-5 w-5 text-[#5a5a40]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif text-[#5a5a40] font-bold">Kayıtlı Sınavlar ve Ücret Modalı</h3>
                  <p className="text-[10px] text-[#8e8d82] font-semibold">{selectedStudentIds.length} Öğrenci İşleme Alınacak</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsBulkModalOpen(false);
                  if (selectedStudentIds.length === 1) setSelectedStudentIds([]);
                }}
                className="p-2 text-[#8e8d82] hover:text-[#5a5a40] hover:bg-[#f5f5f0] rounded-full transition-all active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#5a5a40] uppercase tracking-wider">Deneme Sınavı Seçimi</label>
                  {state.exams.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedBulkExamIds.length === state.exams.length) {
                          setSelectedBulkExamIds([]);
                        } else {
                          setSelectedBulkExamIds(state.exams.map(e => e.id));
                        }
                      }}
                      className="text-[10px] font-bold text-[#5a5a40] bg-[#e6e2d3]/50 hover:bg-[#e6e2d3] px-2 py-0.5 rounded transition-colors"
                    >
                      {selectedBulkExamIds.length === state.exams.length ? 'Tümünü Kaldır' : 'Tümüne Katıl'}
                    </button>
                  )}
                </div>
                {state.exams.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3">
                    {state.exams.map(exam => (
                      <label key={exam.id} className="flex items-center space-x-3 hover:bg-[#f5f5f0] p-1.5 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBulkExamIds.includes(exam.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBulkExamIds([...selectedBulkExamIds, exam.id]);
                            } else {
                              setSelectedBulkExamIds(selectedBulkExamIds.filter(id => id !== exam.id));
                            }
                          }}
                          className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40]"
                        />
                        <span className="text-sm font-semibold text-[#5a5a40]">{exam.name} {exam.date ? `(${exam.date})` : ''}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Kayıtlı Sınav Bulunamadı!</p>
                      <p className="text-[11px] text-amber-700/90 leading-normal mt-0.5">
                        Öncelikle "Deneme Sınavları" sekmesinden yeni bir sınav oluşturmanız gerekmektedir.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5a5a40] uppercase tracking-wider mb-1.5">
                  Öğrenci Başına Ödenecek Ücret
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e8d82] text-sm font-bold">₺</span>
                  <input
                    type="number"
                    value={registrationFee || ''}
                    onChange={(e) => setRegistrationFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                    placeholder="0,00"
                    min="0"
                  />
                </div>
                <p className="text-[10px] text-[#8e8d82] leading-normal mt-1 italic">
                  Öğrenci başına sınav kayıt ücreti belirleyebilirsiniz. Bu ücret ödeme durumuna göre bütçeye entegre edilir.
                </p>
              </div>

              {registrationFee > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#5a5a40] uppercase tracking-wider mb-1.5">Ödeme Durumu</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#fcfbf7] p-1 border border-[#e6e2d3] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRegistrationPaid(true)}
                      className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                        registrationPaid
                          ? 'bg-[#5a5a40] text-white shadow-sm'
                          : 'text-[#8e8d82] hover:text-[#5a5a40]'
                      }`}
                    >
                      Ödendi (Gelir)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationPaid(false)}
                      className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                        !registrationPaid
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-[#8e8d82] hover:text-red-600'
                      }`}
                    >
                      Ödenmedi (Borç)
                    </button>
                  </div>
                </div>
              )}

              {selectedBulkExamIds.length > 0 && registrationFee > 0 && (
                registrationPaid ? (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-emerald-800 space-y-1">
                    <p className="text-xs font-bold flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                      Bütçe Geliri Otomatik Eşitlenecek!
                    </p>
                    <p className="text-[10px] text-emerald-700/90 leading-normal">
                      {selectedStudentIds.length} Öğrenci × {selectedBulkExamIds.length} Sınav × ₺{registrationFee} = <strong>₺{selectedStudentIds.length * selectedBulkExamIds.length * registrationFee}</strong> toplam kayıt geliri bütçenize otomatik olarak gelir kalemi olarak eklenecektir.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-red-800 space-y-1">
                    <p className="text-xs font-bold flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-red-600 shrink-0" />
                      Öğrenci Borcu Otomatik Entegre Edilecek!
                    </p>
                    <p className="text-[10px] text-red-700/90 leading-normal">
                      {selectedStudentIds.length} Öğrenci × {selectedBulkExamIds.length} Sınav × ₺{registrationFee} = <strong>₺{selectedStudentIds.length * selectedBulkExamIds.length * registrationFee}</strong> toplam tutar bütçede ve öğrenci detaylarında borç olarak görünecek, bütçede otomatik entegre olacaktır.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-[#fcfbf7] border-t border-[#e6e2d3] p-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  if (selectedStudentIds.length === 1) setSelectedStudentIds([]);
                }}
                className="px-4 py-2 text-sm text-[#8e8d82] hover:text-[#5a5a40] font-bold rounded-full hover:bg-[#f5f5f0] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleBulkRegister}
                disabled={selectedBulkExamIds.length === 0}
                className={`px-5 py-2 text-sm font-bold rounded-full transition-all shadow-sm ${
                  selectedBulkExamIds.length > 0
                    ? 'bg-[#5a5a40] hover:bg-[#43423b] text-white border border-transparent'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-transparent'
                }`}
              >
                Kaydı Tamamla ve Eşitle
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================== */}
      {/* SINGLE STUDENT DETAILS MODAL                   */}
      {/* ============================================== */}
      {isStudentModalOpen && editingStudentId && (() => {
        const student = state.students.find(s => s.id === editingStudentId);
        if (!student) return null;

        return (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-opacity animate-fade-in"
            onClick={() => {
              setIsStudentModalOpen(false);
              setEditingStudentId(null);
            }}
          >
            <div 
              className="bg-white rounded-t-[28px] sm:rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:animate-none pb-safe sm:pb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#fcfbf7] border-b border-[#e6e2d3] p-4 sm:p-5 flex items-center justify-between shrink-0 rounded-t-[28px] sm:rounded-t-[32px]">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#5a5a40]/10 p-2 sm:p-2.5 rounded-xl">
                    <Users className="h-5 w-5 text-[#5a5a40]" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif text-[#5a5a40] font-bold">Öğrenci Detayları</h3>
                    <p className="text-xs text-[#8e8d82] font-semibold">{student.name} ({student.no})</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsStudentModalOpen(false);
                    setEditingStudentId(null);
                  }}
                  className="p-2 text-[#8e8d82] hover:text-[#5a5a40] hover:bg-[#f5f5f0] rounded-full transition-all active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#8e8d82] uppercase tracking-wider mb-1.5">Öğrenci No</label>
                    <input 
                      type="number" 
                      value={student.no || ''} 
                      onChange={(e) => updateStudent(student.id, 'no', parseInt(e.target.value) || 0)}
                      className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2.5 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#8e8d82] uppercase tracking-wider mb-1.5">Adı Soyadı</label>
                    <input 
                      type="text" 
                      value={student.name} 
                      onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                      className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2.5 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#8e8d82] uppercase tracking-wider mb-1.5">Sınıfı</label>
                    <input 
                      type="text" 
                      value={student.className} 
                      onChange={(e) => updateStudent(student.id, 'className', e.target.value)}
                      className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2.5 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                    />
                  </div>
                </div>

                {/* Exam History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-[#5a5a40] uppercase tracking-wider flex items-center">
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      Deneme Sınavı Geçmişi ve Salon Bilgileri
                    </h4>
                    {student.examRegistrations && student.examRegistrations.some(r => !r.isPaid) && (
                      <button
                        type="button"
                        onClick={() => handlePayAllRegistrations(student.id)}
                        className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-full shadow-sm transition-colors"
                      >
                        Tümünü Öde
                      </button>
                    )}
                  </div>
                  
                  {student.examRegistrations && student.examRegistrations.length > 0 ? (
                    <div className="bg-white border border-[#e6e2d3] rounded-2xl overflow-hidden shadow-inner">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#fcfbf7]">
                          <tr className="text-xs text-[#8e8d82] border-b border-[#e6e2d3]">
                            <th className="py-2.5 px-4 font-bold">Deneme Sınavı</th>
                            <th className="py-2.5 px-4 font-bold">Ödenen Ücret</th>
                            <th className="py-2.5 px-4 font-bold">Kayıt Tarihi</th>
                            <th className="py-2.5 px-4 font-bold">Sınav Salonu / Sıra</th>
                            <th className="py-2.5 px-4 font-bold w-12 text-center">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.examRegistrations.map((reg) => {
                            const exam = state.exams.find(e => e.id === reg.examId);
                            const examName = exam ? exam.name : 'Silinmiş Sınav';
                            
                            // Find which hall this student is in for this exam
                            let deskNo = '-';
                            
                            const hall = state.examHalls.find(h => 
                              (h.examId === reg.examId || h.examIds?.includes(reg.examId)) && 
                              h.seatingPlan?.some(sp => sp.studentId === student.id)
                            );
                            
                            if (hall) {
                              const seating = hall.seatingPlan?.find(sp => sp.studentId === student.id);
                              if (seating) {
                                deskNo = seating.deskNumber.toString();
                              }
                            }

                            // Get all eligible halls for this specific exam
                            const eligibleHalls = state.examHalls.filter(h => 
                              h.examId === reg.examId || h.examIds?.includes(reg.examId)
                            );

                            const isExpanded = expandedExamId === reg.examId;
                            const studentResult = state.results.find(r => (r.studentNo === student.no || r.studentNo === Number(student.no)));
                            const examDetail = studentResult?.details?.[examName];
                            
                            return (
                              <React.Fragment key={reg.examId}>
                              <tr onClick={() => setExpandedExamId(isExpanded ? null : reg.examId)} className="border-b border-[#f5f5f0] hover:bg-[#fcfbf7] cursor-pointer">
                                <td className="py-2.5 px-4 font-bold text-[#5a5a40] flex items-center gap-2">
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-[#8e8d82]" />}
                                  {examName}
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-emerald-700">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-[#5a5a40]">₺{reg.fee}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleRegistrationPayment(student.id, reg.examId)}
                                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                                        reg.isPaid
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                      }`}
                                      title={reg.isPaid ? "Ödeme alındı. Borç olarak işaretlemek için tıklayın." : "Borç ödenmedi. Ödeme almak için tıklayın."}
                                    >
                                      {reg.isPaid ? 'Ödendi' : 'Borç'}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-[#8e8d82]">
                                  {reg.dateRegistered || '-'}
                                </td>
                                <td className="py-2.5 px-4">
                                  <select
                                    value={hall ? hall.id : 'unassigned'}
                                    onChange={(e) => handleHallChange(reg.examId, e.target.value)}
                                    className={`text-xs font-bold rounded-lg border px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-[#5a5a40] focus:outline-none transition-all ${
                                      hall ? 'text-[#5a5a40] border-[#e6e2d3]' : 'text-red-600 border-red-200 font-bold bg-red-50/50'
                                    }`}
                                  >
                                    <option value="unassigned">Yerleştirilmedi</option>
                                    {eligibleHalls.map(h => {
                                      const cap = h.columns?.reduce((acc, col) => acc + (col.deskCount * col.seatsPerDesk), 0) || h.capacity || 30;
                                      const occupiedCount = h.seatingPlan?.length || 0;
                                      const isCurrent = hall?.id === h.id;
                                      const isFull = occupiedCount >= cap;
                                      
                                      return (
                                        <option key={h.id} value={h.id} disabled={isFull && !isCurrent}>
                                          {h.name} {isCurrent ? `(Sıra: ${deskNo})` : `(${occupiedCount}/${cap}${isFull ? ' - Dolu' : ''})`}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <button
                                    onClick={() => removeSingleRegistration(student.id, reg.examId)}
                                    className="p-1.5 text-[#8e8d82] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Kaydı Sil"
                                  >
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && examDetail && examDetail.lessons && (
                                <tr className="bg-[#fcfbf7]/60">
                                  <td colSpan={5} className="p-4 border-b border-[#e6e2d3]">
                                    <div className="bg-white rounded-xl border border-[#e6e2d3] p-4 shadow-sm">
                                      <h5 className="text-xs font-bold text-[#5a5a40] uppercase tracking-wider mb-3">Derslere Göre Net ve Karne Özeti</h5>
                                      <table className="w-full text-left text-xs">
                                        <thead>
                                          <tr className="text-[#8e8d82] border-b border-[#e6e2d3]">
                                            <th className="py-1.5 px-2">Ders</th>
                                            <th className="py-1.5 px-2 text-center text-emerald-600">D</th>
                                            <th className="py-1.5 px-2 text-center text-red-500">Y</th>
                                            <th className="py-1.5 px-2 text-center text-amber-500">B</th>
                                            <th className="py-1.5 px-2 text-center text-blue-600">Net</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(() => {
                                            const lessonsArray = Array.isArray(examDetail.lessons) ? examDetail.lessons : Object.entries(examDetail.lessons).map(([name, data]) => ({ name, ...(data as object) }));
                                            return lessonsArray.map((l: any, idx) => {
                                              const stdName = l.name || l.lessonName || '';
                                              if (!stdName || stdName.toLowerCase().includes('toplam') || stdName.toLowerCase().includes('genel')) return null;
                                              const nVal = typeof l === 'number' ? l : (l.N ?? l.n ?? l.net ?? (parseFloat(l.N || l.n || l.net || '0') || 0));
                                              return (
                                                <tr key={idx} className="border-b border-[#e6e2d3]/30">
                                                  <td className="py-1.5 px-2 font-semibold text-[#5a5a40]">{stdName}</td>
                                                  <td className="py-1.5 px-2 text-center font-bold text-emerald-600">{l.D ?? 0}</td>
                                                  <td className="py-1.5 px-2 text-center font-bold text-red-500">{l.Y ?? 0}</td>
                                                  <td className="py-1.5 px-2 text-center font-bold text-amber-500">{l.B ?? 0}</td>
                                                  <td className="py-1.5 px-2 text-center font-bold text-blue-600">{nVal.toFixed(2).replace('.', ',')}</td>
                                                </tr>
                                              );
                                            }).filter(Boolean);
                                          })()}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-[#fcfbf7] border border-[#e6e2d3] rounded-2xl p-6 text-center text-[#8e8d82] text-sm">
                      Öğrencinin kayıtlı olduğu bir deneme sınavı bulunmuyor.
                    </div>
                  )}

                  {/* Inline Exam Registration Form inside Detail Modal */}
                  {(() => {
                    const studentRegisteredExamIds = (student.examRegistrations || []).map(r => r.examId);
                    const studentGrade = student.className ? (student.className.trim().match(/^(\d+)/)?.[1] || 'Diğer') : 'Diğer';
                    const availableExamsForReg = state.exams.filter(ex => {
                      if (studentRegisteredExamIds.includes(ex.id)) return false;
                      if (!ex.participatingClasses || ex.participatingClasses.length === 0) return true;
                      return ex.participatingClasses.includes(studentGrade);
                    });
                    
                    if (availableExamsForReg.length === 0) return null;

                    return (
                      <div className="mt-4 p-4 bg-[#fcfbf7] border border-[#e6e2d3] rounded-2xl space-y-4">
                        <h5 className="text-xs font-bold text-[#5a5a40] uppercase tracking-wider">
                          Yeni Sınav Kaydı Ekle (Toplu Seçim)
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-[10px] font-bold text-[#8e8d82] uppercase">
                                Sınav Seçimi
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedDetailExamIds.length === availableExamsForReg.length) {
                                    setSelectedDetailExamIds([]);
                                  } else {
                                    setSelectedDetailExamIds(availableExamsForReg.map(e => e.id));
                                  }
                                }}
                                className="text-[10px] font-bold text-[#5a5a40] bg-[#e6e2d3]/50 hover:bg-[#e6e2d3] px-2 py-0.5 rounded transition-colors"
                              >
                                {selectedDetailExamIds.length === availableExamsForReg.length ? 'Tümünü Kaldır' : 'Tümüne Katıl'}
                              </button>
                            </div>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto bg-white border border-[#e6e2d3] rounded-xl p-2.5">
                              {availableExamsForReg.map(ex => (
                                <label key={ex.id} className="flex items-center space-x-2.5 hover:bg-[#f5f5f0] p-1 rounded cursor-pointer text-xs font-semibold text-[#5a5a40]">
                                  <input
                                    type="checkbox"
                                    checked={selectedDetailExamIds.includes(ex.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedDetailExamIds([...selectedDetailExamIds, ex.id]);
                                      } else {
                                        setSelectedDetailExamIds(selectedDetailExamIds.filter(id => id !== ex.id));
                                      }
                                    }}
                                    className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] w-3.5 h-3.5"
                                  />
                                  <span>{ex.name} {ex.date ? `(${ex.date})` : ''}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#8e8d82] uppercase mb-1">
                                Sınav Başına Kayıt Ücreti
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8e8d82] text-xs font-bold">₺</span>
                                <input
                                  type="number"
                                  value={newRegFee || ''}
                                  onChange={(e) => setNewRegFee(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-white border border-[#e6e2d3] rounded-xl pl-6 pr-2 py-1.5 text-xs font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#8e8d82] uppercase mb-1">
                                Ödeme Durumu
                              </label>
                              <select
                                value={newRegPaid ? 'paid' : 'debt'}
                                onChange={(e) => setNewRegPaid(e.target.value === 'paid')}
                                className="w-full bg-white border border-[#e6e2d3] rounded-xl px-2.5 py-1.5 text-xs text-[#5a5a40] font-semibold focus:ring-1 focus:ring-[#5a5a40]"
                              >
                                <option value="debt">Ödenmedi (Borç)</option>
                                <option value="paid">Ödendi (Gelir)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => addDetailRegistrations(student.id)}
                            disabled={selectedDetailExamIds.length === 0}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all shadow-sm ${
                              selectedDetailExamIds.length > 0
                                ? 'bg-[#5a5a40] hover:bg-[#43423b] text-white'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Öğrenciyi Seçilen Sınavlara Kaydet
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-[#fcfbf7] border-t border-[#e6e2d3] p-4 flex items-center justify-end shrink-0">
                <button
                  onClick={() => {
                    setIsStudentModalOpen(false);
                    setEditingStudentId(null);
                  }}
                  className="px-6 py-2.5 bg-[#5a5a40] hover:bg-[#43423b] text-white text-sm font-bold rounded-full shadow-sm transition-all"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
