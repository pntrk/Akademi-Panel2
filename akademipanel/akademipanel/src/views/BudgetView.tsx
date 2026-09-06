import React from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../lib/utils';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  CheckSquare, 
  Square, 
  MinusSquare,
  Sparkles,
  RefreshCw,
  Coins
} from 'lucide-react';

export const BudgetView = () => {
  const { state, updateBudget, setStudents } = useAppContext();
  const { incomes, expenses, debts } = state.budget;

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalIncome - totalExpense;

  // Selection states
  const [selectedIncomeIds, setSelectedIncomeIds] = React.useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<string[]>([]);
  const [selectedDebtIds, setSelectedDebtIds] = React.useState<string[]>([]);
  const [selectedStudentDebtKeys, setSelectedStudentDebtKeys] = React.useState<string[]>([]);

  // Collapse/expand states for groups
  const [expandedIncomes, setExpandedIncomes] = React.useState<Record<string, boolean>>({});
  const [expandedExpenses, setExpandedExpenses] = React.useState<Record<string, boolean>>({});
  const [expandedStudentDebts, setExpandedStudentDebts] = React.useState<Record<string, boolean>>({});

  const toggleIncomeGroup = (examId: string) => {
    setExpandedIncomes(prev => ({ ...prev, [examId]: !prev[examId] }));
  };

  const toggleExpenseGroup = (publisherName: string) => {
    setExpandedExpenses(prev => ({ ...prev, [publisherName]: !prev[publisherName] }));
  };

  const toggleStudentDebtGroup = (examId: string) => {
    setExpandedStudentDebts(prev => ({ ...prev, [examId]: !prev[examId] }));
  };

  // Helper to detect if an item name matches any exam
  const findMatchingExam = React.useCallback((itemName: string) => {
    if (!itemName) return undefined;
    // Sort exams by name length descending to match longest possible exam name first
    const sortedExams = [...state.exams].sort((a, b) => b.name.length - a.name.length);
    return sortedExams.find(exam => itemName.toLowerCase().includes(exam.name.toLowerCase()));
  }, [state.exams]);

  // Dynamic student registrations that are unpaid
  const studentDebts = React.useMemo(() => {
    const list: Array<{ studentId: string; studentName: string; studentClass: string; examId: string; examName: string; fee: number; date: string }> = [];
    state.students.forEach(student => {
      (student.examRegistrations || []).forEach(reg => {
        if (!reg.isPaid && reg.fee > 0) {
          const examObj = state.exams.find(e => e.id === reg.examId);
          list.push({
            studentId: student.id,
            studentName: student.name,
            studentClass: student.className || '',
            examId: reg.examId,
            examName: examObj ? examObj.name : 'Sınav',
            fee: reg.fee,
            date: reg.dateRegistered || ''
          });
        }
      });
    });
    return list;
  }, [state.students, state.exams]);

  // Grouped Student Debts
  const groupedStudentDebts = React.useMemo(() => {
    const groups: Record<string, { examId: string; examName: string; totalFee: number; list: typeof studentDebts }> = {};
    studentDebts.forEach(debt => {
      if (!groups[debt.examId]) {
        groups[debt.examId] = {
          examId: debt.examId,
          examName: debt.examName,
          totalFee: 0,
          list: []
        };
      }
      groups[debt.examId].totalFee += debt.fee;
      groups[debt.examId].list.push(debt);
    });
    return Object.values(groups);
  }, [studentDebts]);

  // Grouped Incomes
  const groupedIncomes = React.useMemo(() => {
    const groups: Record<string, { examId: string; examName: string; totalAmount: number; items: typeof incomes }> = {};
    const ungrouped: typeof incomes = [];

    incomes.forEach(item => {
      const matchedExam = item.examId 
        ? state.exams.find(e => e.id === item.examId) 
        : findMatchingExam(item.name);
        
      if (matchedExam) {
        if (!groups[matchedExam.id]) {
          groups[matchedExam.id] = {
            examId: matchedExam.id,
            examName: matchedExam.name,
            totalAmount: 0,
            items: []
          };
        }
        groups[matchedExam.id].totalAmount += item.amount;
        groups[matchedExam.id].items.push(item);
      } else {
        ungrouped.push(item);
      }
    });

    return {
      examGroups: Object.values(groups),
      ungrouped
    };
  }, [incomes, state.exams, findMatchingExam]);

  // Grouped Expenses by Publisher
  const groupedExpenses = React.useMemo(() => {
    const groups: Record<string, { publisherName: string; totalAmount: number; items: typeof expenses }> = {};
    const ungrouped: typeof expenses = [];

    expenses.forEach(item => {
      const matchedExam = item.examId
        ? state.exams.find(e => e.id === item.examId)
        : findMatchingExam(item.name);
      const publisher = matchedExam?.publisher?.trim();

      if (publisher) {
        if (!groups[publisher]) {
          groups[publisher] = {
            publisherName: publisher,
            totalAmount: 0,
            items: []
          };
        }
        groups[publisher].totalAmount += item.amount;
        groups[publisher].items.push(item);
      } else {
        ungrouped.push(item);
      }
    });

    return {
      publisherGroups: Object.values(groups),
      ungrouped
    };
  }, [expenses, state.exams, findMatchingExam]);

  const totalCorporateDebt = debts.reduce((sum, item) => sum + item.amount, 0);
  const totalStudentDebt = studentDebts.reduce((sum, item) => sum + item.fee, 0);
  const totalDebt = totalCorporateDebt + totalStudentDebt;

  const handleAdd = (type: 'incomes' | 'expenses' | 'debts') => {
    const list = state.budget[type];
    const newItem = type === 'expenses' 
      ? { id: generateId(), no: list.length + 1, name: '', amount: 0 }
      : { id: generateId(), name: '', amount: 0 };
    updateBudget(type, [...list, newItem]);
  };

  const handleUpdate = (type: 'incomes' | 'expenses' | 'debts', id: string, field: string, value: any) => {
    const list = state.budget[type];
    const updated = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    updateBudget(type, updated);
  };

  const handleRemove = (type: 'incomes' | 'expenses' | 'debts', id: string) => {
    const list = state.budget[type];
    updateBudget(type, list.filter(item => item.id !== id));
    
    // Clear selection if deleted
    if (type === 'incomes') setSelectedIncomeIds(prev => prev.filter(i => i !== id));
    if (type === 'expenses') setSelectedExpenseIds(prev => prev.filter(i => i !== id));
    if (type === 'debts') setSelectedDebtIds(prev => prev.filter(i => i !== id));
  };

  // Single Debt pay
  const handlePayDebt = (item: any) => {
    if (!item.name && !item.amount) return;
    
    const newExpense = {
      id: generateId(),
      no: expenses.length + 1,
      name: item.name ? `${item.name} (Ödenen Borç)` : "Ödenen Borç",
      amount: item.amount || 0
    };
    
    const newDebts = debts.filter(d => d.id !== item.id);
    
    updateBudget('expenses', [...expenses, newExpense]);
    updateBudget('debts', newDebts);
    setSelectedDebtIds(prev => prev.filter(id => id !== item.id));
  };

  // Single Student Debt collect
  const handleCollectStudentDebt = (item: typeof studentDebts[0]) => {
    const student = state.students.find(s => s.id === item.studentId);
    if (!student) return;

    // 1. Mark as paid in student's registration
    const updatedStudents = state.students.map(s => {
      if (s.id === item.studentId) {
        const regs = (s.examRegistrations || []).map(r => {
          if (r.examId === item.examId) {
            return { ...r, isPaid: true };
          }
          return r;
        });
        return { ...s, examRegistrations: regs };
      }
      return s;
    });
    setStudents(updatedStudents);

    // Clear key from selections
    const key = `${item.studentId}_${item.examId}`;
    setSelectedStudentDebtKeys(prev => prev.filter(k => k !== key));

    alert(`${item.studentName} isimli öğrenciden ₺${item.fee} kayıt ücreti tahsil edildi ve bütçe gelirlerine eklendi!`);
  };

  // --- Bulk Operation Handlers ---

  // Incomes Bulk Actions
  const toggleSelectAllIncomes = () => {
    const allIds = incomes.map(i => i.id);
    if (selectedIncomeIds.length === allIds.length) {
      setSelectedIncomeIds([]);
    } else {
      setSelectedIncomeIds(allIds);
    }
  };

  const toggleSelectIncomeGroup = (items: typeof incomes, event: React.MouseEvent) => {
    event.stopPropagation();
    const itemIds = items.map(i => i.id);
    const allSelected = itemIds.every(id => selectedIncomeIds.includes(id));
    
    if (allSelected) {
      setSelectedIncomeIds(prev => prev.filter(id => !itemIds.includes(id)));
    } else {
      setSelectedIncomeIds(prev => {
        const next = [...prev];
        itemIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleBulkDeleteIncomes = () => {
    if (selectedIncomeIds.length === 0) return;
    if (confirm(`Seçili ${selectedIncomeIds.length} gelir kalemini silmek istediğinize emin misiniz?`)) {
      const updated = incomes.filter(item => !selectedIncomeIds.includes(item.id));
      updateBudget('incomes', updated);
      setSelectedIncomeIds([]);
    }
  };

  // Expenses Bulk Actions
  const toggleSelectAllExpenses = () => {
    const allIds = expenses.map(e => e.id);
    if (selectedExpenseIds.length === allIds.length) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(allIds);
    }
  };

  const toggleSelectExpenseGroup = (items: typeof expenses, event: React.MouseEvent) => {
    event.stopPropagation();
    const itemIds = items.map(i => i.id);
    const allSelected = itemIds.every(id => selectedExpenseIds.includes(id));
    
    if (allSelected) {
      setSelectedExpenseIds(prev => prev.filter(id => !itemIds.includes(id)));
    } else {
      setSelectedExpenseIds(prev => {
        const next = [...prev];
        itemIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleBulkDeleteExpenses = () => {
    if (selectedExpenseIds.length === 0) return;
    if (confirm(`Seçili ${selectedExpenseIds.length} harcama kalemini silmek istediğinize emin misiniz?`)) {
      const updated = expenses.filter(item => !selectedExpenseIds.includes(item.id));
      updateBudget('expenses', updated);
      setSelectedExpenseIds([]);
    }
  };

  // Corporate Debts Bulk Actions
  const toggleSelectAllDebts = () => {
    const allIds = debts.map(d => d.id);
    if (selectedDebtIds.length === allIds.length) {
      setSelectedDebtIds([]);
    } else {
      setSelectedDebtIds(allIds);
    }
  };

  const handleBulkDeleteDebts = () => {
    if (selectedDebtIds.length === 0) return;
    if (confirm(`Seçili ${selectedDebtIds.length} borç kalemini silmek istediğinize emin misiniz?`)) {
      const updated = debts.filter(item => !selectedDebtIds.includes(item.id));
      updateBudget('debts', updated);
      setSelectedDebtIds([]);
    }
  };

  const handleBulkPayDebts = () => {
    if (selectedDebtIds.length === 0) return;
    const debtsToPay = debts.filter(d => selectedDebtIds.includes(d.id));
    const validDebts = debtsToPay.filter(d => d.name || d.amount);
    
    if (validDebts.length === 0) return;

    if (confirm(`Seçili ${validDebts.length} borç ödemesini gerçekleştirip harcamalara aktarmak istiyor musunuz?`)) {
      const newExpenses = validDebts.map((item, idx) => ({
        id: generateId(),
        no: expenses.length + idx + 1,
        name: item.name ? `${item.name} (Ödenen Borç)` : "Ödenen Borç",
        amount: item.amount || 0
      }));

      const remainingDebts = debts.filter(d => !selectedDebtIds.includes(d.id));

      updateBudget('expenses', [...expenses, ...newExpenses]);
      updateBudget('debts', remainingDebts);
      setSelectedDebtIds([]);
      
      alert(`Seçili ${validDebts.length} borç ödenerek harcama kalemlerine aktarıldı!`);
    }
  };

  // Student Debts Bulk Actions
  const toggleSelectAllStudentDebts = () => {
    const allKeys = studentDebts.map(d => `${d.studentId}_${d.examId}`);
    if (selectedStudentDebtKeys.length === allKeys.length) {
      setSelectedStudentDebtKeys([]);
    } else {
      setSelectedStudentDebtKeys(allKeys);
    }
  };

  const toggleSelectStudentDebtGroup = (list: typeof studentDebts, event: React.MouseEvent) => {
    event.stopPropagation();
    const itemKeys = list.map(d => `${d.studentId}_${d.examId}`);
    const allSelected = itemKeys.every(key => selectedStudentDebtKeys.includes(key));
    
    if (allSelected) {
      setSelectedStudentDebtKeys(prev => prev.filter(key => !itemKeys.includes(key)));
    } else {
      setSelectedStudentDebtKeys(prev => {
        const next = [...prev];
        itemKeys.forEach(key => {
          if (!next.includes(key)) next.push(key);
        });
        return next;
      });
    }
  };

  const handleBulkCollectStudentDebts = () => {
    if (selectedStudentDebtKeys.length === 0) return;

    const debtsToCollect = studentDebts.filter(d => 
      selectedStudentDebtKeys.includes(`${d.studentId}_${d.examId}`)
    );

    if (debtsToCollect.length === 0) return;

    if (confirm(`Seçili ${debtsToCollect.length} öğrenciden toplam ₺${debtsToCollect.reduce((sum, d) => sum + d.fee, 0)} kayıt ücreti tahsil etmek istediğinize emin misiniz?`)) {
      // 1. Mark registrations as paid in state
      const updatedStudents = state.students.map(s => {
        const studentSelectedDebts = debtsToCollect.filter(d => d.studentId === s.id);
        if (studentSelectedDebts.length > 0) {
          const examIds = studentSelectedDebts.map(d => d.examId);
          const regs = (s.examRegistrations || []).map(r => {
            if (examIds.includes(r.examId)) {
              return { ...r, isPaid: true };
            }
            return r;
          });
          return { ...s, examRegistrations: regs };
        }
        return s;
      });
      setStudents(updatedStudents);

      setSelectedStudentDebtKeys([]);
      alert(`Seçili ${debtsToCollect.length} öğrenciden toplam ₺${debtsToCollect.reduce((sum, d) => sum + d.fee, 0)} başarıyla tahsil edilerek bütçe gelirlerine entegre edildi!`);
    }
  };

  // Helper checkbox state checker for partial/all
  const isAllIncomesSelected = incomes.length > 0 && selectedIncomeIds.length === incomes.length;
  const isAnyIncomesSelected = selectedIncomeIds.length > 0;

  const isAllExpensesSelected = expenses.length > 0 && selectedExpenseIds.length === expenses.length;
  const isAnyExpensesSelected = selectedExpenseIds.length > 0;

  const isAllDebtsSelected = debts.length > 0 && selectedDebtIds.length === debts.length;
  const isAnyDebtsSelected = selectedDebtIds.length > 0;

  const isAllStudentDebtsSelected = studentDebts.length > 0 && selectedStudentDebtKeys.length === studentDebts.length;
  const isAnyStudentDebtsSelected = selectedStudentDebtKeys.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6 flex flex-col h-full font-sans text-brand-ink">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#5a5a40] font-bold tracking-tight leading-tight">Bütçe Takibi</h2>
          </div>
          <p className="text-brand-ink/60 text-xs sm:text-sm mt-0.5">Sınav ve yayın bazlı gruplanmış gelir, harcama, borç takibi ve finansal özet</p>
        </div>
        
        {/* Top Summary Cards (2x2 grid on mobile, 4 in a row on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full xl:w-auto shrink-0">
          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/80 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-800/70 uppercase tracking-wider">Toplam Gelir</span>
            <span className="text-base sm:text-lg font-serif font-bold text-emerald-800">₺{totalIncome.toLocaleString('tr-TR')}</span>
          </div>
          <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200/80 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-800/70 uppercase tracking-wider">Toplam Gider</span>
            <span className="text-base sm:text-lg font-serif font-bold text-rose-800">₺{totalExpense.toLocaleString('tr-TR')}</span>
          </div>
          <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-800/70 uppercase tracking-wider">Bekleyen Borç</span>
            <span className="text-base sm:text-lg font-serif font-bold text-amber-800">₺{totalDebt.toLocaleString('tr-TR')}</span>
          </div>
          <div className={`p-3 rounded-2xl border flex flex-col justify-between ${remaining >= 0 ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-rose-700 text-white border-rose-800'}`}>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Net Durum</span>
            <span className="text-base sm:text-lg font-serif font-bold text-white">₺{remaining.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[32px] p-4 sm:p-6 shadow-sm border border-[#e6e2d3] flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 h-full">
            
            {/* Gelir Sütunu */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-[#e6e2d3] pb-2 shrink-0">
                <div className="flex items-center space-x-2">
                  {incomes.length > 0 && (
                    <input
                      type="checkbox"
                      checked={isAllIncomesSelected}
                      ref={el => {
                        if (el) {
                          el.indeterminate = isAnyIncomesSelected && !isAllIncomesSelected;
                        }
                      }}
                      onChange={toggleSelectAllIncomes}
                      className="w-4 h-4 rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer"
                    />
                  )}
                  <h3 className="text-sm font-bold text-[#8e8d82] uppercase tracking-wider">GELİR (TAHSİLATLAR)</h3>
                </div>
                {isAnyIncomesSelected && (
                  <button
                    onClick={handleBulkDeleteIncomes}
                    className="flex items-center space-x-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all"
                    title="Seçilen Gelirleri Toplu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Toplu Sil ({selectedIncomeIds.length})</span>
                  </button>
                )}
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                 {/* Grouped Incomes by Exam */}
                 {groupedIncomes.examGroups.map(group => {
                   const isExpanded = !!expandedIncomes[group.examId];
                   const groupItemIds = group.items.map(i => i.id);
                   const isAllGroupSelected = groupItemIds.every(id => selectedIncomeIds.includes(id));
                   const isAnyGroupSelected = groupItemIds.some(id => selectedIncomeIds.includes(id));

                   return (
                     <div key={group.examId} className="border border-[#e6e2d3] rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                       <div
                         onClick={() => toggleIncomeGroup(group.examId)}
                         className="flex items-center justify-between p-3 bg-emerald-50/50 hover:bg-emerald-100/40 cursor-pointer transition-colors"
                       >
                         <div className="flex items-center space-x-2.5 text-emerald-900 min-w-0">
                           <input
                             type="checkbox"
                             checked={isAllGroupSelected}
                             ref={el => {
                               if (el) el.indeterminate = isAnyGroupSelected && !isAllGroupSelected;
                             }}
                             onClick={(e) => e.stopPropagation()}
                             onChange={(e) => toggleSelectIncomeGroup(group.items, e as any)}
                             className="w-3.5 h-3.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer shrink-0"
                           />
                           {isExpanded ? (
                             <ChevronDown className="w-4 h-4 text-emerald-700 shrink-0" />
                           ) : (
                             <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />
                           )}
                           <span className="text-xs font-bold truncate">💸 {group.examName} Gelirleri</span>
                           <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                             {group.items.length} Kalem
                           </span>
                         </div>
                         <span className="text-sm font-bold text-emerald-800 shrink-0 ml-2">₺{group.totalAmount}</span>
                       </div>

                       {isExpanded && (
                         <div className="p-2 bg-emerald-50/10 border-t border-emerald-100 space-y-2 divide-y divide-emerald-100">
                           {group.items.map((item, index) => {
                             const isSelected = selectedIncomeIds.includes(item.id);
                             return (
                               <div key={item.id} className={`flex items-center group relative p-1 transition-all rounded-lg pl-8 ${isSelected ? 'bg-emerald-50/20' : 'hover:bg-white'}`}>
                                 <input
                                   type="checkbox"
                                   checked={isSelected}
                                   onChange={() => {
                                     setSelectedIncomeIds(prev =>
                                       prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                     );
                                   }}
                                   className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer"
                                 />
                                 <div className="w-6 text-center text-[10px] font-bold text-[#8e8d82] shrink-0">{index + 1}</div>
                                 <input
                                   type="text"
                                   value={item.name}
                                   onChange={e => handleUpdate('incomes', item.id, 'name', e.target.value)}
                                   className="flex-1 p-1 w-full min-w-0 text-xs font-medium bg-transparent focus:ring-0 border-none text-[#5a5a40]"
                                   placeholder="Gelir Kalemi"
                                 />
                                 <div className="font-bold text-[#5a5a40] flex items-center pr-2 shrink-0">
                                   ₺<input
                                     type="number"
                                     value={item.amount || ''}
                                     onChange={e => handleUpdate('incomes', item.id, 'amount', parseInt(e.target.value) || 0)}
                                     className="w-16 sm:w-20 p-1 text-xs font-bold text-right bg-transparent focus:ring-0 border-none"
                                   />
                                 </div>
                                 <button
                                   onClick={() => handleRemove('incomes', item.id)}
                                   className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                               </div>
                             );
                           })}
                         </div>
                       )}
                     </div>
                   );
                 })}

                 {/* Ungrouped/Manual Incomes */}
                 {groupedIncomes.ungrouped.map((item, index) => {
                   const isSelected = selectedIncomeIds.includes(item.id);
                   return (
                     <div key={item.id} className={`flex items-center group rounded-xl p-2 border transition-colors relative pl-9 ${isSelected ? 'bg-emerald-50/10 border-emerald-300' : 'bg-white border-[#e6e2d3] hover:border-[#5a5a40]/30'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedIncomeIds(prev =>
                              prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                            );
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer"
                        />
                        <div className="w-6 text-center text-xs font-bold text-[#8e8d82] shrink-0">{index + 1}</div>
                        <input type="text" value={item.name} onChange={e => handleUpdate('incomes', item.id, 'name', e.target.value)} className="flex-1 min-w-0 p-2 text-sm font-medium bg-transparent focus:ring-0 border-none text-[#5a5a40]" placeholder="Gelir Kalemi" />
                        <div className="font-bold text-[#5a5a40] flex items-center pr-2 shrink-0">
                          ₺<input type="number" value={item.amount || ''} onChange={e => handleUpdate('incomes', item.id, 'amount', parseInt(e.target.value)||0)} className="w-16 sm:w-20 p-2 text-sm font-bold text-right bg-transparent focus:ring-0 border-none" />
                        </div>
                        <button onClick={() => handleRemove('incomes', item.id)} className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                     </div>
                   );
                 })}

                 <button onClick={() => handleAdd('incomes')} className="w-full text-center py-3 text-sm text-[#5a5a40] hover:bg-[#f5f5f0] font-medium rounded-xl border border-dashed border-[#d6d2c3] mt-2">+ Gelir Ekle</button>
              </div>
              
              <div className="mt-6 flex justify-between items-center py-4 border-t border-[#e6e2d3] shrink-0">
                  <span className="text-sm font-bold text-[#8e8d82] uppercase tracking-wider">TOPLAM GELİR</span>
                  <span className="text-lg xl:text-xl font-bold text-emerald-700">₺{totalIncome}</span>
              </div>
            </div>

            {/* Gider Sütunu */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-[#e6e2d3] pb-2 shrink-0">
                <div className="flex items-center space-x-2">
                  {expenses.length > 0 && (
                    <input
                      type="checkbox"
                      checked={isAllExpensesSelected}
                      ref={el => {
                        if (el) {
                          el.indeterminate = isAnyExpensesSelected && !isAllExpensesSelected;
                        }
                      }}
                      onChange={toggleSelectAllExpenses}
                      className="w-4 h-4 rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer"
                    />
                  )}
                  <h3 className="text-sm font-bold text-[#8e8d82] uppercase tracking-wider">GİDER (HARCAMALAR)</h3>
                </div>
                {isAnyExpensesSelected && (
                  <button
                    onClick={handleBulkDeleteExpenses}
                    className="flex items-center space-x-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all"
                    title="Seçilen Harcamaları Toplu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Toplu Sil ({selectedExpenseIds.length})</span>
                  </button>
                )}
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                 {/* Grouped Publisher Expenses */}
                 {groupedExpenses.publisherGroups.map(group => {
                   const isExpanded = !!expandedExpenses[group.publisherName];
                   const groupItemIds = group.items.map(i => i.id);
                   const isAllGroupSelected = groupItemIds.every(id => selectedExpenseIds.includes(id));
                   const isAnyGroupSelected = groupItemIds.some(id => selectedExpenseIds.includes(id));

                   return (
                     <div key={group.publisherName} className="border border-[#e6e2d3] rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                       <div
                         onClick={() => toggleExpenseGroup(group.publisherName)}
                         className="flex items-center justify-between p-3 bg-amber-50/70 hover:bg-amber-100/60 cursor-pointer transition-colors"
                       >
                         <div className="flex items-center space-x-2.5 text-amber-900 min-w-0">
                           <input
                             type="checkbox"
                             checked={isAllGroupSelected}
                             ref={el => {
                               if (el) el.indeterminate = isAnyGroupSelected && !isAllGroupSelected;
                             }}
                             onClick={(e) => e.stopPropagation()}
                             onChange={(e) => toggleSelectExpenseGroup(group.items, e as any)}
                             className="w-3.5 h-3.5 rounded border-amber-300 text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer shrink-0"
                           />
                           {isExpanded ? (
                             <ChevronDown className="w-4 h-4 text-amber-700 shrink-0" />
                           ) : (
                             <ChevronRight className="w-4 h-4 text-amber-700 shrink-0" />
                           )}
                           <span className="text-xs font-bold truncate">🏢 {group.publisherName} Harcamaları</span>
                           <span className="text-[10px] bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                             {group.items.length} Kalem
                           </span>
                         </div>
                         <span className="text-sm font-bold text-amber-800 shrink-0 ml-2">₺{group.totalAmount}</span>
                       </div>

                       {isExpanded && (
                         <div className="p-2 bg-[#fcfbf7]/40 border-t border-[#e6e2d3] space-y-2 divide-y divide-[#f5f5f0]">
                           {group.items.map((item, index) => {
                             const isSelected = selectedExpenseIds.includes(item.id);
                             return (
                               <div key={item.id} className={`flex items-center group relative p-1 transition-all rounded-lg pl-8 ${isSelected ? 'bg-amber-50/20' : 'hover:bg-white'}`}>
                                 <input
                                   type="checkbox"
                                   checked={isSelected}
                                   onChange={() => {
                                     setSelectedExpenseIds(prev =>
                                       prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                     );
                                   }}
                                   className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer"
                                 />
                                 <div className="w-6 text-center text-[10px] font-bold text-[#8e8d82] shrink-0">{index + 1}</div>
                                 <input
                                   type="text"
                                   value={item.name}
                                   onChange={e => handleUpdate('expenses', item.id, 'name', e.target.value)}
                                   className="flex-1 p-1 w-full min-w-0 text-xs font-medium bg-transparent focus:ring-0 border-none text-[#5a5a40]"
                                   placeholder="Harcama Kalemi"
                                 />
                                 <div className="font-bold text-[#5a5a40] flex items-center pr-2 shrink-0">
                                   ₺<input
                                     type="number"
                                     value={item.amount || ''}
                                     onChange={e => handleUpdate('expenses', item.id, 'amount', parseInt(e.target.value) || 0)}
                                     className="w-16 sm:w-20 p-1 text-xs font-bold text-right bg-transparent focus:ring-0 border-none"
                                   />
                                 </div>
                                 <button
                                   onClick={() => handleRemove('expenses', item.id)}
                                   className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                   <Trash2 className="w-3 h-3" />
                                 </button>
                               </div>
                             );
                           })}
                         </div>
                       )}
                     </div>
                   );
                 })}

                 {/* Ungrouped/Manual Expenses */}
                 {groupedExpenses.ungrouped.map((item, index) => {
                   const isSelected = selectedExpenseIds.includes(item.id);
                   return (
                     <div key={item.id} className={`flex items-center group rounded-xl p-2 border transition-colors relative pl-9 ${isSelected ? 'bg-amber-50/10 border-amber-300' : 'bg-white border-[#e6e2d3] hover:border-[#5a5a40]/30'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedExpenseIds(prev =>
                              prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                            );
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer"
                        />
                        <div className="w-6 text-center text-xs font-bold text-[#8e8d82] shrink-0">{index + 1}</div>
                        <input type="text" value={item.name} onChange={e => handleUpdate('expenses', item.id, 'name', e.target.value)} className="flex-1 min-w-0 p-2 text-sm font-medium bg-transparent focus:ring-0 border-none text-[#5a5a40]" placeholder="Harcama Kalemi" />
                        <div className="font-bold text-[#5a5a40] flex items-center pr-2 shrink-0">
                          ₺<input type="number" value={item.amount || ''} onChange={e => handleUpdate('expenses', item.id, 'amount', parseInt(e.target.value)||0)} className="w-16 sm:w-20 p-2 text-sm font-bold text-right bg-transparent focus:ring-0 border-none" />
                        </div>
                        <button onClick={() => handleRemove('expenses', item.id)} className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                     </div>
                   );
                 })}

                 <button onClick={() => handleAdd('expenses')} className="w-full text-center py-3 text-sm text-[#5a5a40] hover:bg-[#f5f5f0] font-medium rounded-xl border border-dashed border-[#d6d2c3] mt-2">+ Harcama Ekle</button>
              </div>
              
              <div className="mt-6 flex justify-between items-center py-4 border-t border-[#e6e2d3] shrink-0">
                  <span className="text-sm font-bold text-[#8e8d82] uppercase tracking-wider">TOPLAM HARCAMA</span>
                  <span className="text-lg xl:text-xl font-bold text-[#5a5a40]">₺{totalExpense}</span>
              </div>
            </div>

            {/* Borç Sütunu */}
            <div className="flex flex-col space-y-6">
               <div>
                 <div className="flex items-center justify-between mb-4 border-b border-[#e6e2d3] pb-2 shrink-0">
                    <div className="flex items-center space-x-2">
                      {debts.length > 0 && (
                        <input
                          type="checkbox"
                          checked={isAllDebtsSelected}
                          ref={el => {
                            if (el) {
                              el.indeterminate = isAnyDebtsSelected && !isAllDebtsSelected;
                            }
                          }}
                          onChange={toggleSelectAllDebts}
                          className="w-4 h-4 rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] transition-colors cursor-pointer"
                        />
                      )}
                      <h3 className="text-sm font-bold text-[#8e8d82] uppercase tracking-wider">BORÇ (GENEL)</h3>
                    </div>
                    {isAnyDebtsSelected && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={handleBulkPayDebts}
                          className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-all"
                          title="Seçilen Borçları Öde ve Giderlere Aktar"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Öde ({selectedDebtIds.length})</span>
                        </button>
                        <button
                          onClick={handleBulkDeleteDebts}
                          className="flex items-center space-x-1 text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all"
                          title="Seçilen Borçları Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </div>
                    )}
                 </div>

                 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                   {debts.map(item => {
                     const isSelected = selectedDebtIds.includes(item.id);
                     return (
                       <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center group rounded-xl p-2 border transition-colors relative gap-2 sm:gap-0 pl-10 ${isSelected ? 'bg-red-50/30 border-red-200' : 'bg-[#f5f5f0] border-[#e6e2d3] hover:border-red-300'}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedDebtIds(prev =>
                                prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                              );
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded border-[#e6e2d3] text-red-600 focus:ring-red-500 transition-colors cursor-pointer"
                          />
                          <input type="text" value={item.name} onChange={e => handleUpdate('debts', item.id, 'name', e.target.value)} className="flex-1 min-w-0 p-2 text-sm font-medium bg-transparent focus:ring-0 border-none text-red-900" placeholder="Borç Kalemi" />
                          
                          <div className="flex items-center justify-between sm:justify-end shrink-0 pl-2">
                            <div className="font-bold text-red-700 flex items-center pr-2">
                              ₺<input type="number" value={item.amount || ''} onChange={e => handleUpdate('debts', item.id, 'amount', parseInt(e.target.value)||0)} className="w-16 sm:w-20 p-2 text-sm font-bold text-right bg-transparent focus:ring-0 border-none" />
                            </div>
                            <button 
                              onClick={() => handlePayDebt(item)} 
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1.5 rounded-lg flex items-center space-x-1 text-xs font-bold transition-colors ml-1"
                              title="Ödendi İşaretle (Harcamalara Aktar)"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Öde</span>
                            </button>
                          </div>

                          <button onClick={() => handleRemove('debts', item.id)} className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                       </div>
                     );
                   })}
                   <button onClick={() => handleAdd('debts')} className="w-full text-center py-2.5 text-xs text-red-700 hover:bg-red-50 font-bold rounded-xl border border-dashed border-red-200 mt-2">+ Genel Borç Ekle</button>
                 </div>
               </div>

               {/* Öğrenci Sınav Borçları Listesi */}
               <div className="flex-1 flex flex-col min-h-[220px]">
                 <div className="flex items-center justify-between mb-3 border-b border-[#e6e2d3] pb-1.5 shrink-0">
                   <div className="flex items-center space-x-2">
                     {studentDebts.length > 0 && (
                       <input
                         type="checkbox"
                         checked={isAllStudentDebtsSelected}
                         ref={el => {
                           if (el) {
                             el.indeterminate = isAnyStudentDebtsSelected && !isAllStudentDebtsSelected;
                           }
                         }}
                         onChange={toggleSelectAllStudentDebts}
                         className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500 transition-colors cursor-pointer"
                       />
                     )}
                     <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center">
                       <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600 shrink-0" />
                       ÖĞRENCİ SINAV BORÇLARI ({studentDebts.length})
                     </h4>
                   </div>
                   {isAnyStudentDebtsSelected && (
                     <button
                       onClick={handleBulkCollectStudentDebts}
                       className="flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-all"
                       title="Seçili Öğrencilerin Kayıt Ücretini Toplu Tahsil Et"
                     >
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                       <span>Toplu Tahsil Et ({selectedStudentDebtKeys.length})</span>
                     </button>
                   )}
                 </div>
                 
                 <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
                   {groupedStudentDebts.map(group => {
                     const isExpanded = !!expandedStudentDebts[group.examId];
                     const groupKeys = group.list.map(d => `${d.studentId}_${d.examId}`);
                     const isAllGroupSelected = groupKeys.every(key => selectedStudentDebtKeys.includes(key));
                     const isAnyGroupSelected = groupKeys.some(key => selectedStudentDebtKeys.includes(key));

                     return (
                       <div key={group.examId} className="border border-red-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                         <div
                           onClick={() => toggleStudentDebtGroup(group.examId)}
                           className="flex items-center justify-between p-3 bg-red-50/75 hover:bg-red-100/60 cursor-pointer transition-colors"
                         >
                           <div className="flex items-center space-x-2 text-red-900 min-w-0">
                             <input
                               type="checkbox"
                               checked={isAllGroupSelected}
                               ref={el => {
                                 if (el) el.indeterminate = isAnyGroupSelected && !isAllGroupSelected;
                               }}
                               onClick={(e) => e.stopPropagation()}
                               onChange={(e) => toggleSelectStudentDebtGroup(group.list, e as any)}
                               className="w-3.5 h-3.5 rounded border-red-300 text-red-600 focus:ring-red-500 transition-colors cursor-pointer shrink-0"
                             />
                             {isExpanded ? (
                               <ChevronDown className="w-4 h-4 text-red-700 shrink-0" />
                             ) : (
                               <ChevronRight className="w-4 h-4 text-red-700 shrink-0" />
                             )}
                             <span className="text-xs font-bold truncate">⚠️ {group.examName} Borçları</span>
                             <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                               {group.list.length} Öğrenci
                             </span>
                           </div>
                           <span className="text-sm font-bold text-red-800 shrink-0 ml-2">₺{group.totalFee}</span>
                         </div>
                         
                         {isExpanded && (
                           <div className="p-2 bg-red-50/10 border-t border-red-100 space-y-2 divide-y divide-red-100">
                             {group.list.map((item, idx) => {
                               const key = `${item.studentId}_${item.examId}`;
                               const isSelected = selectedStudentDebtKeys.includes(key);
                               return (
                                 <div key={idx} className={`border border-red-50/40 rounded-xl p-2.5 flex items-center justify-between transition-all shadow-xs relative pl-9 ${isSelected ? 'bg-red-50/30' : 'bg-white/80 hover:bg-white'}`}>
                                   <input
                                     type="checkbox"
                                     checked={isSelected}
                                     onChange={() => {
                                       setSelectedStudentDebtKeys(prev =>
                                         prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                                       );
                                     }}
                                     className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded border-red-200 text-red-600 focus:ring-red-500 transition-colors cursor-pointer"
                                   />
                                   <div className="min-w-0">
                                     <p className="text-xs font-bold text-[#5a5a40] truncate">{item.studentName}</p>
                                     <p className="text-[10px] text-gray-500 font-semibold">{item.studentClass}</p>
                                   </div>
                                   <div className="flex items-center space-x-2 shrink-0">
                                     <span className="text-xs font-bold text-red-700">₺{item.fee}</span>
                                     <button
                                       onClick={() => handleCollectStudentDebt(item)}
                                       className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-0.5"
                                       title="Kayıt ücretini tahsil et ve bütçeye kaydet"
                                     >
                                       <CheckCircle2 className="w-3 h-3" />
                                       Tahsil Et
                                     </button>
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     );
                   })}
                   
                   {studentDebts.length === 0 && (
                     <div className="text-center py-8 text-xs text-emerald-800 bg-emerald-50/50 rounded-xl border border-emerald-100 font-medium">
                       Aktif ödenmemiş öğrenci sınav borcu bulunmuyor. Tebrikler! 🎉
                     </div>
                   )}
                 </div>
               </div>

               <div className="mt-6 pt-4 border-t border-[#e6e2d3] space-y-1.5 shrink-0">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                    <span>Kurumsal Borçlar:</span>
                    <span>₺{totalCorporateDebt}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-red-700">
                    <span>Öğrenci Sınav Borçları:</span>
                    <span>₺{totalStudentDebt}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-dashed border-[#e6e2d3]">
                    <span className="text-sm font-bold text-[#5a5a40] uppercase tracking-wider">TOPLAM BORÇ</span>
                    <span className="text-lg xl:text-xl font-bold text-red-700">₺{totalDebt}</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
