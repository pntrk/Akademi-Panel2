import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ExamHall, SeatingPlanItem } from '../types';
import { generateId, exportToExcel } from '../lib/utils';
import { Plus, Trash2, Download, LayoutTemplate, X, Users, RefreshCw, AlertCircle, Building, MapPin } from 'lucide-react';

export const HallsView = () => {
  const { state, setExamHalls } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHallId, setEditingHallId] = useState<string | null>(null);
  
  // Modal states
  const [hallName, setHallName] = useState('');
  const [columns, setColumns] = useState<{id: string, deskCount: number, seatsPerDesk: number, name: string}[]>([
    { id: generateId(), name: 'Cam Kenarı', deskCount: 5, seatsPerDesk: 2 },
    { id: generateId(), name: 'Orta', deskCount: 5, seatsPerDesk: 2 },
    { id: generateId(), name: 'Duvar Kenarı', deskCount: 5, seatsPerDesk: 2 }
  ]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [seatingPlan, setSeatingPlan] = useState<SeatingPlanItem[]>([]);
  const [deselectedStudentIds, setDeselectedStudentIds] = useState<string[]>([]);
  const [draggedSeatNum, setDraggedSeatNum] = useState<number | null>(null);
  const [dragOverSeatNum, setDragOverSeatNum] = useState<number | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const capacity = columns.reduce((acc, col) => acc + (col.deskCount * col.seatsPerDesk), 0);

  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(state.students.map(s => s.className).filter(Boolean))).sort();
  }, [state.students]);

  // Helper to extract grade level from class name
  const getGradeLevel = (clsName: string): string => {
    const match = clsName.trim().match(/^(\d+)/);
    return match ? match[1] : 'Diğer';
  };

  // Unique grade levels compiled from uniqueClasses
  const availableGradeLevels = useMemo(() => {
    const levels = new Set<string>();
    uniqueClasses.forEach(cls => {
      const match = cls.trim().match(/^(\d+)/);
      if (match) {
        levels.add(match[1]);
      } else {
        levels.add('Diğer');
      }
    });
    return Array.from(levels).sort((a, b) => {
      if (a === 'Diğer') return 1;
      if (b === 'Diğer') return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [uniqueClasses]);

  const toggleGrade = (grade: string) => {
    const isChecked = selectedGrades.includes(grade);
    const classesOfThisGrade = uniqueClasses.filter(c => getGradeLevel(c) === grade);
    
    if (isChecked) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
      setSelectedClasses(selectedClasses.filter(c => getGradeLevel(c) !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
      // Add all classes of this grade to selectedClasses (avoiding duplicates)
      const otherClasses = selectedClasses.filter(c => getGradeLevel(c) !== grade);
      setSelectedClasses([...otherClasses, ...classesOfThisGrade]);
    }
  };

  const toggleBranch = (clsName: string) => {
    const grade = getGradeLevel(clsName);
    if (selectedClasses.includes(clsName)) {
      const nextClasses = selectedClasses.filter(c => c !== clsName);
      setSelectedClasses(nextClasses);
      const hasRemainingOfThisGrade = nextClasses.some(c => getGradeLevel(c) === grade);
      if (!hasRemainingOfThisGrade) {
        setSelectedGrades(selectedGrades.filter(g => g !== grade));
      }
    } else {
      setSelectedClasses([...selectedClasses, clsName]);
      if (!selectedGrades.includes(grade)) {
        setSelectedGrades([...selectedGrades, grade]);
      }
    }
  };

  // Filtered exams based on selected grade levels of the hall
  const filteredExams = useMemo(() => {
    if (selectedGrades.length === 0) return [];
    return state.exams.filter(ex => {
      const examGrades = ex.participatingClasses || [];
      return examGrades.some(g => selectedGrades.includes(g));
    });
  }, [state.exams, selectedGrades]);

  const registeredStudentsForSeating = useMemo(() => {
    if (selectedClasses.length === 0) return [];
    return state.students.filter(s => {
      const classMatch = selectedClasses.includes(s.className);
      if (!classMatch) return false;
      if (selectedExamIds.length > 0) {
        return (s.examRegistrations || []).some(reg => selectedExamIds.includes(reg.examId));
      }
      return (s.examRegistrations || []).length > 0;
    });
  }, [state.students, selectedClasses, selectedExamIds]);

  const activeStudentsForSeating = useMemo(() => {
    return registeredStudentsForSeating.filter(s => !deselectedStudentIds.includes(s.id));
  }, [registeredStudentsForSeating, deselectedStudentIds]);

  const openNewModal = () => {
    setEditingHallId(null);
    setHallName('');
    setColumns([
      { id: generateId(), name: 'Cam Kenarı', deskCount: 5, seatsPerDesk: 2 },
      { id: generateId(), name: 'Orta', deskCount: 5, seatsPerDesk: 2 },
      { id: generateId(), name: 'Duvar Kenarı', deskCount: 5, seatsPerDesk: 2 }
    ]);
    setSelectedExamIds([]);
    setSelectedClasses([]);
    setSelectedGrades([]);
    setSeatingPlan([]);
    setDeselectedStudentIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (hall: ExamHall) => {
    setEditingHallId(hall.id);
    setHallName(hall.name);
    setColumns(hall.columns && hall.columns.length > 0 ? hall.columns : [
      { id: generateId(), name: 'Sıra Düzeni', deskCount: Math.ceil((hall.capacity || 30) / 2), seatsPerDesk: 2 }
    ]);
    
    // Backwards compatibility check
    let initialExamIds = hall.examIds || [];
    if (initialExamIds.length === 0 && hall.examId) {
      initialExamIds = [hall.examId];
    }
    setSelectedExamIds(initialExamIds);
    setSelectedClasses(hall.selectedClasses || []);
    
    // Initialize selectedGrades from selectedClasses
    const initialClasses = hall.selectedClasses || [];
    const initialGrades = Array.from(new Set(initialClasses.map(c => {
      const match = c.trim().match(/^(\d+)/);
      return match ? match[1] : 'Diğer';
    })));
    setSelectedGrades(initialGrades);

    setSeatingPlan(hall.seatingPlan || []);
    
    // Determine which eligible registered students are NOT seated
    const registered = state.students.filter(s => {
      const classMatch = (hall.selectedClasses || []).includes(s.className);
      if (!classMatch) return false;
      if (initialExamIds.length > 0) {
        return (s.examRegistrations || []).some(reg => initialExamIds.includes(reg.examId));
      }
      return (s.examRegistrations || []).length > 0;
    });
    const seatedIds = (hall.seatingPlan || []).map(sp => sp.studentId);
    const initialDeselected = registered.filter(s => !seatedIds.includes(s.id)).map(s => s.id);
    setDeselectedStudentIds(initialDeselected);
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHallId(null);
  };

  const handleDragStart = (e: React.DragEvent, seatNum: number) => {
    setDraggedSeatNum(seatNum);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', seatNum.toString());
  };

  const handleDragOver = (e: React.DragEvent, seatNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSeatNum !== seatNum) {
      setDragOverSeatNum(seatNum);
    }
  };

  const handleDragLeave = (e: React.DragEvent, seatNum: number) => {
    e.preventDefault();
    if (dragOverSeatNum === seatNum) {
      setDragOverSeatNum(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSeatNum: number) => {
    e.preventDefault();
    setDragOverSeatNum(null);
    
    // Fallback to dataTransfer if state was lost
    const sourceSeatNumStr = e.dataTransfer.getData('text/plain');
    const sourceSeatNum = draggedSeatNum !== null ? draggedSeatNum : (sourceSeatNumStr ? parseInt(sourceSeatNumStr, 10) : null);
    
    if (sourceSeatNum === null || sourceSeatNum === targetSeatNum) {
      setDraggedSeatNum(null);
      return;
    }

    setSeatingPlan(prev => {
      const newPlan = [...prev];
      const sourceIndex = newPlan.findIndex(s => s.deskNumber === sourceSeatNum);
      const targetIndex = newPlan.findIndex(s => s.deskNumber === targetSeatNum);

      if (sourceIndex > -1 && targetIndex > -1) {
        // Swap
        const tempDesk = newPlan[sourceIndex].deskNumber;
        newPlan[sourceIndex] = { ...newPlan[sourceIndex], deskNumber: newPlan[targetIndex].deskNumber };
        newPlan[targetIndex] = { ...newPlan[targetIndex], deskNumber: tempDesk };
      } else if (sourceIndex > -1) {
        // Move source to empty target
        newPlan[sourceIndex] = { ...newPlan[sourceIndex], deskNumber: targetSeatNum };
      } else if (targetIndex > -1) {
        // Move target to empty source
        newPlan[targetIndex] = { ...newPlan[targetIndex], deskNumber: sourceSeatNum };
      }

      return newPlan;
    });
    setDraggedSeatNum(null);
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 1500);
  };

  const handleGenerateSeating = () => {
    if (selectedClasses.length === 0) {
      alert("Lütfen önce sınıfları seçin.");
      return;
    }
    
    const eligibleStudents = activeStudentsForSeating;
    if (eligibleStudents.length === 0) {
      alert("Seçilen ve sınava katılması onaylanan (seçili) aktif öğrenci bulunmuyor.");
      return;
    }

    // Shuffle students randomly
    const shuffled = [...eligibleStudents].sort(() => 0.5 - Math.random());
    
    const newPlan: SeatingPlanItem[] = [];
    const maxDesks = Math.min(capacity, shuffled.length);
    
    for (let i = 0; i < maxDesks; i++) {
      newPlan.push({
        deskNumber: i + 1,
        studentId: shuffled[i].id,
        studentNo: shuffled[i].no,
        studentName: shuffled[i].name,
        studentClass: shuffled[i].className
      });
    }

    setSeatingPlan(newPlan);
  };

  const handleSaveHall = () => {
    if (!hallName.trim()) {
      alert("Lütfen salon adı girin.");
      return;
    }

    const hallData: ExamHall = {
      id: editingHallId || generateId(),
      name: hallName,
      capacity,
      examId: selectedExamIds.length > 0 ? selectedExamIds[0] : undefined, // backwards compatibility
      examIds: selectedExamIds,
      selectedClasses,
      seatingPlan,
      columns
    };

    if (editingHallId) {
      setExamHalls(state.examHalls.map(h => h.id === editingHallId ? hallData : h));
    } else {
      setExamHalls([...state.examHalls, hallData]);
    }
    closeModal();
  };

  const removeHall = (hallId: string) => {
    setExamHalls(state.examHalls.filter(h => h.id !== hallId));
  };

  const handleExport = (hall: ExamHall) => {
    if (!hall.seatingPlan || hall.seatingPlan.length === 0) {
      alert("Dışa aktarılacak oturma düzeni bulunmuyor.");
      return;
    }

    const data = hall.seatingPlan.map(item => ({
      'SIRA NO / SIRA': item.deskNumber,
      'ÖĞRENCİ NO': item.studentNo,
      'ADI SOYADI': item.studentName,
      'SINIFI': item.studentClass,
      'İMZA / YOKLAMA': ''
    }));
    
    exportToExcel(data, `Sinav_Salonu_Yoklama_${hall.name.replace(/\s+/g, '_')}`);
  };

  const handlePrintSchematic = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup engelleyiciyi kapatıp tekrar deneyin veya yeni sekmede açın.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>${hallName || 'Sinav Salonu'} - Oturma Duzeni</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              color: #000; 
              margin: 0; 
              padding: 0; 
              width: 190mm;
              height: 277mm;
              display: flex;
              flex-direction: column;
            }
            * { box-sizing: border-box; }
            .header { text-align: center; margin-bottom: 20px; flex-shrink: 0; }
            .header h1 { margin: 0 0 5px 0; font-size: 20px; font-weight: bold; }
            .header p { margin: 0; color: #666; font-size: 12px; }
            
            .grid-container {
               display: flex;
               gap: 15px;
               justify-content: center;
               align-items: stretch;
               flex: 1;
               min-height: 0;
            }
            .column {
               display: flex;
               flex-direction: column;
               gap: 10px;
               flex: 1;
               min-width: 0;
            }
            .col-title {
               text-align: center;
               font-weight: bold;
               text-transform: uppercase;
               color: #333;
               margin-bottom: 2px;
               font-size: 12px;
               flex-shrink: 0;
            }
            .desk-row {
               display: flex;
               gap: 5px;
               padding: 5px;
               border: 1.5px solid #ccc;
               border-radius: 6px;
               background: #f9f9f9;
               flex: 1;
               min-height: 0;
            }
            .seat {
               flex: 1;
               min-width: 0;
               border: 1px solid #000;
               border-radius: 4px;
               padding: 4px;
               display: flex;
               flex-direction: column;
               align-items: center;
               justify-content: center;
               position: relative;
               background: #fff;
               overflow: hidden;
            }
            .seat.empty {
               border: 1px dashed #aaa;
               background: #fafafa;
            }
            .seat-num {
               position: absolute;
               top: 2px;
               left: 4px;
               font-size: 9px;
               font-weight: bold;
               color: #333;
            }
            .student-name {
               font-size: 10px;
               font-weight: bold;
               text-align: center;
               margin-top: 6px;
               line-height: 1.1;
               color: #000;
               display: -webkit-box;
               -webkit-line-clamp: 2;
               -webkit-box-orient: vertical;
               overflow: hidden;
               word-break: break-word;
            }
            .student-meta {
               margin-top: auto;
               display: flex;
               flex-wrap: wrap;
               justify-content: center;
               gap: 2px;
            }
            .student-meta span {
               font-size: 8px;
               padding: 1px 3px;
               border: 1px solid #ccc;
               border-radius: 2px;
               color: #444;
               white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${hallName || 'Sınav Salonu'}</h1>
            <p>Oturma Düzeni Şeması</p>
          </div>
          <div class="grid-container">
            ${columns.map((col, colIdx) => `
              <div class="column">
                <div class="col-title">${col.name}</div>
                ${Array.from({ length: col.deskCount }).map((_, rowIdx) => `
                  <div class="desk-row">
                    ${Array.from({ length: col.seatsPerDesk }).map((_, seatIdx) => {
                      let seatNum = 0;
                      for (let i = 0; i < colIdx; i++) {
                        seatNum += columns[i].deskCount * columns[i].seatsPerDesk;
                      }
                      seatNum += (rowIdx * col.seatsPerDesk) + seatIdx + 1;
                      const student = seatingPlan.find(s => s.deskNumber === seatNum);
                      
                      if (student) {
                        return `
                          <div class="seat">
                            <span class="seat-num">${seatNum}</span>
                            <span class="student-name">${student.studentName}</span>
                            <div class="student-meta">
                              <span>${student.studentNo}</span>
                              <span>${student.studentClass}</span>
                            </div>
                          </div>
                        `;
                      } else {
                        return `
                          <div class="seat empty">
                            <span class="seat-num">${seatNum}</span>
                            <span style="color:#aaa; font-size: 12px; margin-top: 10px;">Boş</span>
                          </div>
                        `;
                      }
                    }).join('')}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
               setTimeout(function() {
                 window.print();
                 window.close();
               }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-serif text-[#5a5a40]">Sınav Salonları</h2>
          <p className="text-[#8e8d82] mt-1">Sınav salonlarını, kapasitelerini ve otomatik oturma düzenlerini yönetin</p>
        </div>
        <button onClick={openNewModal} className="flex items-center px-6 py-2 bg-[#5a5a40] text-white rounded-full text-sm font-bold hover:bg-[#43423b] shadow-sm transition-all">
            <Plus className="h-4 w-4 mr-1.5" /> Yeni Salon Oluştur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto pb-10">
        {state.examHalls.map(hall => {
          const usedCapacity = hall.seatingPlan?.length || 0;
          const totalCapacity = hall.capacity || 0;
          const percentage = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
          
          return (
            <div key={hall.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-[#e6e2d3] flex flex-col group hover:border-[#d4d19d] transition-all relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-serif text-[#5a5a40] font-bold">{hall.name}</h3>
                  <div className="text-xs text-[#8e8d82] mt-1 flex items-center">
                    <Building className="w-3.5 h-3.5 mr-1" />
                    Kapasite: {totalCapacity} Kişi
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleExport(hall)} className="p-2 text-[#5a5a40] hover:bg-[#f5f5f0] bg-white border border-transparent hover:border-[#e6e2d3] rounded-full transition-colors" title="Yoklama Listesi İndir">
                    <Download className="w-4 h-4"/>
                  </button>
                  <button onClick={() => removeHall(hall.id)} className="p-2 text-[#8e8d82] hover:text-red-500 hover:bg-red-50 bg-white border border-transparent rounded-full transition-colors" title="Salonu Sil">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-[#f5f5f0] space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-[#8e8d82]">Doluluk</span>
                  <span className="font-bold text-[#5a5a40]">{usedCapacity} / {totalCapacity}</span>
                </div>
                <div className="w-full bg-[#f5f5f0] h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${percentage >= 100 ? 'bg-amber-500' : 'bg-[#d4d19d]'}`} 
                    style={{ width: `${Math.min(100, percentage)}%` }} 
                  />
                </div>
                
                <button 
                  onClick={() => openEditModal(hall)} 
                  className="w-full py-2 bg-[#fcfbf7] border border-[#e6e2d3] text-[#5a5a40] font-bold text-xs rounded-full hover:bg-[#f5f5f0] transition-colors"
                >
                  Detayları ve Oturma Düzenini Gör
                </button>
              </div>
            </div>
          );
        })}
        
        {state.examHalls.length === 0 && (
            <div className="col-span-full text-center p-16 bg-white rounded-[32px] border border-dashed border-[#d6d2c3] text-[#8e8d82]">
                <LayoutTemplate className="w-12 h-12 mx-auto mb-4 text-[#d6d2c3]" />
                <p>Henüz sınav salonu oluşturmadınız.<br/>Yukarıdan yeni bir salon oluşturarak başlayabilirsiniz.</p>
            </div>
        )}
      </div>

      {/* ========================================= */}
      {/* EXAM HALL MODAL */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-slide-up max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#fcfbf7] border-b border-[#e6e2d3] p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-[#d4d19d]/30 p-2.5 rounded-2xl border border-[#d4d19d]/50">
                  <MapPin className="h-6 w-6 text-[#5a5a40]" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-[#5a5a40] font-bold">
                    {editingHallId ? 'Sınav Salonu Düzenle' : 'Yeni Sınav Salonu Oluştur'}
                  </h3>
                  <p className="text-xs text-[#8e8d82]">
                    Salon detayları, kapasite ve otomatik oturma düzeni yapılandırması
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 text-[#8e8d82] hover:text-[#5a5a40] hover:bg-[#f5f5f0] rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#fcfbf7]/40">
              
              {/* Left Sidebar Form */}
              <div className="w-full md:w-1/3 border-r border-[#e6e2d3] p-6 overflow-y-auto space-y-5 bg-white">
                
                <div>
                  <label className="block text-xs font-bold text-[#8e8d82] mb-1.5 uppercase tracking-wider">Salon Adı / Yeri</label>
                  <input 
                    type="text" 
                    value={hallName} 
                    onChange={e => setHallName(e.target.value)}
                    className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2.5 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                    placeholder="Örn: 1. Kat - Salon A"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#8e8d82] uppercase tracking-wider">Oturma Düzeni (Sütunlar)</label>
                    <span className="text-xs font-bold text-[#5a5a40] bg-[#f5f5f0] px-2 py-1 rounded-full border border-[#e6e2d3]">Toplam: {capacity}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {columns.map((col, idx) => (
                      <div key={col.id} className="flex flex-col bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3 gap-2 relative group">
                        <button 
                          type="button"
                          onClick={() => setColumns(columns.filter(c => c.id !== col.id))}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <input 
                          type="text" 
                          value={col.name} 
                          onChange={e => {
                            const newCols = [...columns];
                            newCols[idx].name = e.target.value;
                            setColumns(newCols);
                          }}
                          className="w-full bg-white border border-[#e6e2d3] rounded-lg px-2 py-1.5 text-xs font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                          placeholder="Sütun Adı (örn: Cam Kenarı)"
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] text-[#8e8d82] font-semibold mb-1 block">Sıra Sayısı</label>
                            <input 
                              type="number" 
                              value={col.deskCount || ''} 
                              onChange={e => {
                                const newCols = [...columns];
                                newCols[idx].deskCount = parseInt(e.target.value) || 0;
                                setColumns(newCols);
                              }}
                              className="w-full bg-white border border-[#e6e2d3] rounded-lg px-2 py-1.5 text-xs font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                              min="1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-[#8e8d82] font-semibold mb-1 block">Sıra Tipi</label>
                            <select 
                              value={col.seatsPerDesk}
                              onChange={e => {
                                const newCols = [...columns];
                                newCols[idx].seatsPerDesk = parseInt(e.target.value);
                                setColumns(newCols);
                              }}
                              className="w-full bg-white border border-[#e6e2d3] rounded-lg px-2 py-1.5 text-xs font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                            >
                              <option value={1}>Tekli</option>
                              <option value={2}>İkili</option>
                              <option value={3}>Üçlü</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setColumns([...columns, { id: generateId(), name: `Sütun ${columns.length + 1}`, deskCount: 5, seatsPerDesk: 2 }])}
                    className="w-full py-2 border-2 border-dashed border-[#d4d19d] text-[#5a5a40] text-xs font-bold rounded-xl hover:bg-[#f5f5f0] transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Sütun Ekle
                  </button>
                </div>

                {/* Katılacak Sınıf Seviyeleri */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#8e8d82] uppercase tracking-wider">
                    Katılacak Sınıf Seviyeleri
                  </label>
                  <p className="text-[11px] text-[#8e8d82] leading-tight">
                    Salonun atanacağı sınıf seviyelerini seçin.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableGradeLevels.map(lvl => {
                      const isChecked = selectedGrades.includes(lvl);
                      const classesOfThisGrade = uniqueClasses.filter(c => getGradeLevel(c) === lvl);
                      const selectedCount = classesOfThisGrade.filter(c => selectedClasses.includes(c)).length;
                      
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => toggleGrade(lvl)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col justify-center items-center ${
                            isChecked 
                              ? 'bg-[#5a5a40] text-white border-transparent shadow-sm' 
                              : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-[#f5f5f0]'
                          }`}
                        >
                          <span>{lvl === 'Diğer' ? 'Diğer Sınıflar' : `${lvl}. Sınıflar`}</span>
                          {classesOfThisGrade.length > 0 && (
                            <span className={`text-[9px] mt-0.5 font-normal ${isChecked ? 'text-gray-200' : 'text-[#8e8d82]'}`}>
                              ({selectedCount}/{classesOfThisGrade.length} Şube)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {availableGradeLevels.length === 0 && (
                    <div className="text-xs text-[#8e8d82] italic">Sistemde henüz sınıf tanımlanmamış.</div>
                  )}
                </div>

                {/* Sınıf Şubeleri Filtreleme */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#8e8d82] uppercase tracking-wider">
                      Şube Filtreleme / Seçimi
                    </label>
                    {selectedClasses.length > 0 && (
                      <span className="text-[10px] font-bold text-[#5a5a40] bg-[#f5f5f0] px-2 py-0.5 rounded-full border border-[#e6e2d3]">
                        {selectedClasses.length} Şube Seçili
                      </span>
                    )}
                  </div>
                  
                  {selectedGrades.length === 0 ? (
                    <div className="text-xs text-[#8e8d82] bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3 italic">
                      Yukarıdan sınıf seviyesi seçtiğinizde şubeler burada listelenir.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {uniqueClasses
                        .filter(c => selectedGrades.includes(getGradeLevel(c)))
                        .map(clsName => {
                          const isChecked = selectedClasses.includes(clsName);
                          return (
                            <button
                              key={clsName}
                              type="button"
                              onClick={() => toggleBranch(clsName)}
                              className={`p-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                                isChecked 
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm font-bold' 
                                  : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
                              }`}
                            >
                              {clsName}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Bağlantılı Deneme Sınavları */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#8e8d82] mb-1 uppercase tracking-wider">
                    Bağlantılı Deneme Sınavları
                  </label>
                  <p className="text-[11px] text-[#8e8d82] leading-tight mb-2">
                    Bu sınav salonunda uygulanacak olan ve seçili sınıf seviyelerine uygun deneme sınavlarını seçin.
                  </p>
                  <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {selectedGrades.length === 0 ? (
                      <div className="text-xs text-[#8e8d82] bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3 italic">
                        Bağlantılı sınavları görebilmek için önce katılacak sınıf seviyelerini seçin.
                      </div>
                    ) : filteredExams.length > 0 ? (
                      filteredExams.map(ex => {
                        const isChecked = selectedExamIds.includes(ex.id);
                        return (
                          <label key={ex.id} className="flex items-start space-x-2 cursor-pointer p-2 rounded-xl hover:bg-[#f5f5f0] border border-transparent hover:border-[#e6e2d3] transition-all bg-white shadow-sm">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedExamIds(selectedExamIds.filter(id => id !== ex.id));
                                } else {
                                  setSelectedExamIds([...selectedExamIds, ex.id]);
                                }
                              }}
                              className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] mt-1 shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#5a5a40] truncate">{ex.name}</span>
                              <span className="text-[9px] text-[#8e8d82] mt-0.5">
                                Sınıf Seviyeleri: {ex.participatingClasses?.map(g => `${g}. Sınıf`).join(', ') || 'Belirtilmemiş'}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-xs text-[#8e8d82] bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3 italic leading-normal">
                        Seçili sınıf seviyelerine ({selectedGrades.map(g => `${g === 'Diğer' ? 'Diğer' : `${g}. Sınıf`}`).join(', ')}) uygun tanımlanmış aktif deneme sınavı bulunamadı.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sınava Kayıtlı Öğrenciler ve Toplu Seçim */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#8e8d82] uppercase tracking-wider">
                      Sınava Kayıtlı Öğrenciler
                    </label>
                    {registeredStudentsForSeating.length > 0 && (
                      <span className="text-[10px] font-bold text-[#5a5a40] bg-[#f5f5f0] px-2 py-0.5 rounded-full border border-[#e6e2d3]">
                        {activeStudentsForSeating.length} / {registeredStudentsForSeating.length} Seçili
                      </span>
                    )}
                  </div>
                  
                  {selectedClasses.length === 0 ? (
                    <div className="text-xs text-[#8e8d82] bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3 italic">
                      Katılacak sınıfları seçtiğinizde kayıtlı öğrenciler burada listelenir.
                    </div>
                  ) : selectedExamIds.length === 0 ? (
                    <div className="text-xs text-[#8e8d82] bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3 italic">
                      Lütfen önce yukarıdan deneme sınavı seçin.
                    </div>
                  ) : registeredStudentsForSeating.length === 0 ? (
                    <div className="text-xs text-[#8e8d82] bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl p-3 italic">
                      Seçilen sınıflarda bu sınava kayıtlı öğrenci bulunamadı.
                    </div>
                  ) : (
                    <div className="border border-[#e6e2d3] rounded-xl bg-[#fcfbf7] overflow-hidden">
                      {/* Toplu Seçim Başlığı */}
                      <div className="flex items-center justify-between px-3 py-2 bg-[#f5f5f0] border-b border-[#e6e2d3]">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={registeredStudentsForSeating.length > 0 && deselectedStudentIds.length === 0}
                            ref={el => {
                              if (el) {
                                el.indeterminate = deselectedStudentIds.length > 0 && deselectedStudentIds.length < registeredStudentsForSeating.length;
                              }
                            }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDeselectedStudentIds([]);
                              } else {
                                setDeselectedStudentIds(registeredStudentsForSeating.map(s => s.id));
                              }
                            }}
                            className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] h-3.5 w-3.5"
                          />
                          <span className="text-xs font-bold text-[#5a5a40]">Tümünü Seç</span>
                        </label>
                      </div>
                      
                      {/* Öğrenci Listesi */}
                      <div className="max-h-[160px] overflow-y-auto p-1.5 space-y-1">
                        {registeredStudentsForSeating.map(student => {
                          const isSelected = !deselectedStudentIds.includes(student.id);
                          return (
                            <label 
                              key={student.id} 
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-white border-[#d4d19d]/50 hover:bg-[#fcfbf7]' 
                                  : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setDeselectedStudentIds([...deselectedStudentIds, student.id]);
                                    } else {
                                      setDeselectedStudentIds(deselectedStudentIds.filter(id => id !== student.id));
                                    }
                                  }}
                                  className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] shrink-0 h-3.5 w-3.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className={`font-bold truncate ${isSelected ? 'text-[#5a5a40]' : 'text-gray-400'}`}>
                                    {student.name}
                                  </div>
                                  <div className="text-[10px] text-[#8e8d82] flex items-center gap-1.5 mt-0.5">
                                    <span>No: {student.no}</span>
                                    <span>•</span>
                                    <span className="font-bold text-[#5a5a40]">{student.className}</span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleGenerateSeating}
                    className="w-full flex items-center justify-center space-x-2 bg-[#d4d19d] text-[#5a5a40] font-bold text-sm py-3 rounded-xl hover:bg-[#e6e2d3] transition-all shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Oturma Düzeni Oluştur</span>
                  </button>
                  <p className="text-[10px] text-[#8e8d82] text-center mt-2 leading-tight">
                    Seçili sınıflardaki öğrenciler rastgele karıştırılarak belirtilen kapasiteye göre sıralanır.
                  </p>
                </div>
              </div>

              {/* Right Content - Seating Plan Preview */}
              <div className="w-full md:w-2/3 p-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <div>
                    <h4 className="text-lg font-serif font-bold text-[#5a5a40]">Oturma Düzeni Önizlemesi</h4>
                    {seatingPlan.length > 0 && (
                      <p className="text-xs font-medium text-amber-600 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Öğrencileri sürükleyip bırakarak yerlerini değiştirebilirsiniz.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {seatingPlan.length > 0 && (
                      <button 
                        onClick={handlePrintSchematic}
                        className="flex items-center px-3 py-1.5 bg-[#fcfbf7] border border-[#e6e2d3] text-[#5a5a40] text-xs font-bold rounded-full hover:bg-[#f5f5f0] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> PDF İndir
                      </button>
                    )}
                    <span className="bg-[#f5f5f0] border border-[#e6e2d3] text-[#5a5a40] px-3 py-1.5 rounded-full text-xs font-bold">
                      Yerleşen: {seatingPlan.length} / {capacity}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#fcfbf7]/50 border border-[#e6e2d3] rounded-2xl shadow-inner p-2 sm:p-4 print:bg-white print:border-none print:shadow-none print:p-0 print:overflow-visible" id="seating-plan-printable">
                  {showSaveToast && (
                    <div className="absolute top-4 right-4 z-50 bg-green-50 text-green-700 px-3 py-1.5 rounded-full shadow-sm border border-green-200 text-xs font-bold flex items-center print:hidden animate-in fade-in slide-in-from-top-2 duration-300">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Kaydediliyor...
                    </div>
                  )}
                  {/* Ekran için başlık (yazdırıldığında görünür) */}
                  <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold">{hallName || 'Sınav Salonu'}</h1>
                    <p className="text-gray-500 mt-2">Oturma Düzeni</p>
                  </div>
                  
                  {seatingPlan.length > 0 ? (
                    <div className="flex gap-2 sm:gap-4 items-start w-full justify-between print:w-full print:justify-center print:gap-8 pb-4">
                      {columns.map((col, colIdx) => (
                        <div key={col.id} className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="text-center font-bold text-[#8e8d82] text-[10px] sm:text-xs uppercase tracking-wider print:text-black truncate px-1">
                            {col.name}
                          </div>
                          
                          {Array.from({ length: col.deskCount }).map((_, rowIdx) => (
                            <div key={rowIdx} className="flex gap-1 sm:gap-2 p-1 sm:p-2 rounded-xl bg-[#f5f5f0]/50 border-2 border-[#e6e2d3]/50 print:border-black/20 print:bg-transparent">
                              {Array.from({ length: col.seatsPerDesk }).map((_, seatIdx) => {
                                // Calculate global seat number
                                let seatNum = 0;
                                for (let i = 0; i < colIdx; i++) {
                                  seatNum += columns[i].deskCount * columns[i].seatsPerDesk;
                                }
                                seatNum += (rowIdx * col.seatsPerDesk) + seatIdx + 1;
                                
                                const student = seatingPlan.find(s => s.deskNumber === seatNum);
                                
                                return (
                                  <div 
                                    key={seatIdx}
                                    draggable={!!student}
                                    onDragStart={(e) => {
                                      if (student) handleDragStart(e, seatNum);
                                    }}
                                    onDragOver={(e) => handleDragOver(e, seatNum)}
                                    onDragLeave={(e) => handleDragLeave(e, seatNum)}
                                    onDrop={(e) => handleDrop(e, seatNum)}
                                    className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg border relative min-h-[4.5rem] sm:min-h-[5rem] flex-1 min-w-0 print:h-24 print:w-32 transition-transform hover:scale-105 hover:z-10 ${
                                      student 
                                        ? 'bg-white border-[#d4d19d] shadow-sm print:border-black cursor-grab active:cursor-grabbing' 
                                        : 'bg-[#fcfbf7] border-dashed border-[#e6e2d3] print:border-gray-300'
                                    } ${draggedSeatNum === seatNum ? 'opacity-50 ring-2 ring-[#B08D57]' : ''} ${dragOverSeatNum === seatNum ? 'ring-2 ring-amber-500 bg-amber-50 scale-105' : ''}`}
                                  >
                                    <span className="absolute top-0.5 left-1 sm:top-1 sm:left-1.5 text-[8px] sm:text-[10px] font-bold text-[#8e8d82] print:text-black print:text-xs">
                                      {seatNum}
                                    </span>
                                    
                                    {student ? (
                                      <>
                                        <span className="text-[9px] sm:text-[11px] font-bold text-[#5a5a40] text-center line-clamp-2 leading-tight px-0.5 mt-2 sm:mt-2 print:text-black print:text-sm break-words">
                                          {student.studentName}
                                        </span>
                                        <div className="mt-auto flex items-center justify-center gap-0.5 sm:gap-1 w-full print:mt-1 flex-wrap">
                                          <span className="text-[8px] sm:text-[9px] bg-[#f5f5f0] text-[#8e8d82] px-1 py-0.5 rounded font-semibold print:bg-transparent print:border print:border-gray-300 print:text-black truncate max-w-full">
                                            {student.studentNo}
                                          </span>
                                          <span className="text-[8px] sm:text-[9px] bg-[#d4d19d]/20 text-[#5a5a40] px-1 py-0.5 rounded font-bold print:bg-transparent print:border print:border-gray-300 print:text-black truncate max-w-full">
                                            {student.studentClass}
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-[9px] sm:text-[10px] text-[#8e8d82]/50 font-medium">Boş</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#8e8d82] p-8 text-center space-y-3">
                      <div className="bg-[#f5f5f0] p-4 rounded-full">
                        <Users className="w-8 h-8 text-[#d6d2c3]" />
                      </div>
                      <p className="text-sm">
                        Henüz oturma düzeni oluşturulmadı.<br/>Sınıf seçip <strong>"Oturma Düzeni Oluştur"</strong> butonuna tıklayın.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#fcfbf7] border-t border-[#e6e2d3] p-4 flex items-center justify-end space-x-3 shrink-0">
              <button
                onClick={closeModal}
                className="px-5 py-2 text-sm text-[#8e8d82] hover:text-[#5a5a40] font-bold rounded-full hover:bg-[#f5f5f0] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveHall}
                className="px-6 py-2 bg-[#5a5a40] hover:bg-[#43423b] text-white text-sm font-bold rounded-full shadow-sm transition-all"
              >
                Salonu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
