import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Student, Exam, ExamResult, BudgetData, ExamHall, SeatingPlanItem, FullBackupData } from '../types';
import { generateId, recalculateLeagueForStudents } from '../lib/utils';
import { autoSyncToDrive, getAutoSyncEnabled, getAccessToken } from '../lib/googleDrive';

export interface AppUser {
  name: string;
  email: string;
  role: 'admin' | 'teacher';
}

export interface AppState {
  students: Student[];
  exams: Exam[];
  results: ExamResult[];
  budget: BudgetData;
  examHalls: ExamHall[];
  leagueMentors?: Record<string, string>;
  leagueTeamPoints?: Record<string, number>;
  approvedTransfers?: { studentNo: number; examName: string; toTeam: string }[];
  admins?: string[];
  teachers?: string[];
}

export interface AppContextType {
  state: AppState;
  userRole: 'admin' | 'teacher';
  setUserRole: (role: 'admin' | 'teacher') => void;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  syncStatus: 'synced' | 'saving';
  syncErrorMessage?: string | null;
  updateUsers: (admins: string[], teachers: string[]) => void;
  setStudents: (students: Student[]) => void;
  setExams: (exams: Exam[]) => void;
  setResults: (results: ExamResult[]) => void;
  setBudget: (budget: BudgetData) => void;
  setExamHalls: (halls: ExamHall[]) => void;
  updateBudget: (type: 'incomes' | 'expenses' | 'debts', data: any[]) => void;
  updateLeagueSettings: (mentors: Record<string, string>, teamPoints: Record<string, number>) => void;
  approveTransfer: (studentNo: number, examName: string, toTeam: string) => void;
  overwriteState: (newState: AppState) => void;
  restoreBackup: (backupData: any) => Promise<{ success: boolean; message: string; summary?: any }>;
  saveNow: () => Promise<void>;
}

const defaultState: AppState = {
  students: [],
  exams: [],
  results: [],
  budget: { incomes: [], expenses: [], debts: [] },
  examHalls: [],
  leagueMentors: {},
  leagueTeamPoints: {},
  approvedTransfers: [],
  admins: ['kirklareliataturkortaokulu@gmail.com'],
  teachers: []
};

const defaultUser: AppUser = {
  name: 'Yönetici',
  email: 'kirklareliataturkortaokulu@gmail.com',
  role: 'admin'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Financial Sync Engine ---
const syncFinancials = (students: Student[], exams: Exam[], budget: BudgetData): BudgetData => {
  const safeBudget: BudgetData = {
    incomes: budget?.incomes || [],
    expenses: budget?.expenses || [],
    debts: budget?.debts || []
  };

  const currentIncomeMap = new Map(safeBudget.incomes.map(i => [`${i.studentId}-${i.examId}`, i]));
  const currentExpenseMap = new Map(safeBudget.expenses.map(e => [e.examId, e]));
  
  const newIncomes = students.flatMap(student => {
    return (student.examRegistrations || []).filter(reg => reg.isPaid).map(reg => {
      const exam = exams.find(e => e.id === reg.examId);
      const key = `${student.id}-${reg.examId}`;
      const existing = currentIncomeMap.get(key);
      if (existing) return existing;
      
      return {
        id: generateId(),
        name: `${student.name} - ${exam?.name || 'Sınav'} Katılım Ücreti`,
        amount: reg.fee,
        studentId: student.id,
        examId: reg.examId
      };
    });
  });

  const otherIncomes = safeBudget.incomes.filter(i => !i.studentId);
  
  const newExpenses = exams.filter(e => e.publisher && e.publisherFee && e.orderQuantity).map(exam => {
    const key = exam.id;
    const existing = currentExpenseMap.get(key);
    if (existing) return existing;
    
    return {
      id: generateId(),
      no: exam.no,
      name: `${exam.name} - ${exam.publisher} Yayınları Ödemesi`,
      amount: (exam.publisherFee || 0) * (exam.orderQuantity || 0),
      examId: exam.id
    };
  });

  const otherExpenses = safeBudget.expenses.filter(e => !e.examId);

  return {
    incomes: [...newIncomes, ...otherIncomes],
    expenses: [...newExpenses, ...otherExpenses],
    debts: safeBudget.debts
  };
};

const propagateManualBudgetChanges = (students: Student[], exams: Exam[], budget: BudgetData) => {
  let updatedStudents = students.map(student => {
    let studentRegsChanged = false;
    const updatedRegs = (student.examRegistrations || []).map(reg => {
      const budgetItem = budget.incomes.find(i => i.studentId === student.id && i.examId === reg.examId);
      if (budgetItem && budgetItem.amount !== reg.fee) {
        studentRegsChanged = true;
        return { ...reg, fee: budgetItem.amount };
      }
      return reg;
    });
    if (studentRegsChanged) {
      return { ...student, examRegistrations: updatedRegs };
    }
    return student;
  });

  let updatedExams = exams.map(exam => {
    const budgetItem = budget.expenses.find(exp => exp.examId === exam.id);
    const totalFee = (exam.publisherFee || 0) * (exam.orderQuantity || 0);
    if (budgetItem && budgetItem.amount !== totalFee) {
      const qty = exam.orderQuantity || 1;
      return {
        ...exam,
        publisherFee: budgetItem.amount / qty
      };
    }
    return exam;
  });

  return {
    updatedStudents,
    updatedExams,
    cleanedBudget: budget
  };
};

const loadInitialState = (): AppState => {
  try {
    const saved = localStorage.getItem('okulYonetimState');
    if (saved) {
      const parsed = JSON.parse(saved);
      const safe: AppState = {
        students: parsed.students || [],
        exams: parsed.exams || [],
        results: parsed.results || [],
        budget: parsed.budget || { incomes: [], expenses: [], debts: [] },
        examHalls: parsed.examHalls || [],
        leagueMentors: parsed.leagueMentors || {},
        leagueTeamPoints: parsed.leagueTeamPoints || {},
        approvedTransfers: parsed.approvedTransfers || [],
        admins: parsed.admins || ['kirklareliataturkortaokulu@gmail.com'],
        teachers: parsed.teachers || []
      };
      safe.budget = syncFinancials(safe.students, safe.exams, safe.budget);
      return safe;
    }
  } catch (e) {
    console.error('Error loading initial local state:', e);
  }
  return defaultState;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const savedUser = localStorage.getItem('app_current_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return defaultUser;
  });
  const [userRole, setUserRoleState] = useState<'admin' | 'teacher'>(currentUser.role || 'admin');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving'>('synced');
  const stateRef = useRef<AppState>(state);

  const setUserRole = (role: 'admin' | 'teacher') => {
    setUserRoleState(role);
    const updatedUser = { ...currentUser, role };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('app_current_user', JSON.stringify(updatedUser));
    } catch (e) {}
  };

  const handleSetCurrentUser = (user: AppUser) => {
    setCurrentUser(user);
    setUserRoleState(user.role);
    try {
      localStorage.setItem('app_current_user', JSON.stringify(user));
    } catch (e) {}
  };

  // Pure Local State Persistence
  const persistState = (newState: AppState) => {
    stateRef.current = newState;
    setState(newState);
    setSyncStatus('saving');
    try {
      localStorage.setItem('okulYonetimState', JSON.stringify(newState));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    setTimeout(() => {
      setSyncStatus('synced');
    }, 150);
  };

  // Background Auto-sync to Google Drive if connected and enabled
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);

    autoSyncTimerRef.current = setTimeout(async () => {
      try {
        const isAutoSync = getAutoSyncEnabled();
        const token = await getAccessToken();
        if (isAutoSync && token && state.students?.length > 0) {
          const backupObj: FullBackupData = {
            appName: "AkademiPanel",
            version: "2.0",
            backupDate: new Date().toISOString(),
            school: "Kırklareli Atatürk Ortaokulu",
            modules: [
              "Öğrenci Kayıtları",
              "Deneme Sınavları",
              "Sınav Sonuçları",
              "Akademi Arena",
              "Sınav Salonları",
              "Bütçe Takibi"
            ],
            summary: {
              studentCount: state.students?.length || 0,
              examCount: state.exams?.length || 0,
              resultCount: state.results?.length || 0,
              hallCount: state.examHalls?.length || 0,
              budgetIncomesCount: state.budget?.incomes?.length || 0,
              budgetExpensesCount: state.budget?.expenses?.length || 0,
              budgetDebtsCount: state.budget?.debts?.length || 0,
              arenaMentorsCount: Object.keys(state.leagueMentors || {}).length,
              arenaBonusCount: Object.keys(state.leagueTeamPoints || {}).length,
              approvedTransferCount: state.approvedTransfers?.length || 0
            },
            students: state.students || [],
            exams: state.exams || [],
            results: state.results || [],
            examHalls: state.examHalls || [],
            budget: {
              incomes: state.budget?.incomes || [],
              expenses: state.budget?.expenses || [],
              debts: state.budget?.debts || []
            },
            leagueMentors: state.leagueMentors || {},
            leagueTeamPoints: state.leagueTeamPoints || {},
            approvedTransfers: state.approvedTransfers || [],
            admins: state.admins || ['kirklareliataturkortaokulu@gmail.com'],
            teachers: state.teachers || []
          };
          await autoSyncToDrive(backupObj);
        }
      } catch (err) {
        console.warn('Auto sync check failed:', err);
      }
    }, 4000); // 4-second debounce to prevent spamming drive

    return () => {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
  }, [state]);

  const saveNow = async () => {
    try {
      localStorage.setItem('okulYonetimState', JSON.stringify(stateRef.current));
      setSyncStatus('synced');
    } catch (e) {}
  };

  const setStudents = (students: Student[]) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    const updatedHalls = s.examHalls.map(hall => {
      const sp = hall.seatingPlan || [];
      let changed = false;
      const newSp = sp.map(item => {
        const student = students.find(st => st.id === item.studentId);
        if (!student) { changed = true; return null; }
        
        const assignedExamIds = hall.examIds || (hall.examId ? [hall.examId] : []);
        if (assignedExamIds.length > 0) {
          const isRegistered = student.examRegistrations?.some(reg => assignedExamIds.includes(reg.examId));
          if (!isRegistered) { changed = true; return null; }
        }
        
        if (item.studentNo !== student.no || item.studentName !== student.name || item.studentClass !== student.className) {
          changed = true;
          return { ...item, studentNo: student.no, studentName: student.name, studentClass: student.className };
        }
        return item;
      }).filter(Boolean) as SeatingPlanItem[];
      
      if (changed || newSp.length !== sp.length) {
        return { ...hall, seatingPlan: newSp };
      }
      return hall;
    });
    
    const newBudget = syncFinancials(students, s.exams, s.budget);
    persistState({ ...s, students, examHalls: updatedHalls, budget: newBudget });
  };

  const setExams = (exams: Exam[]) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    const updatedHalls = s.examHalls.map(hall => {
      const matchingExams = exams.filter(e => e.assignedHalls?.includes(hall.id));
      const newExamIds = matchingExams.map(e => e.id);
      const currentIds = hall.examIds || [];
      const isSame = currentIds.length === newExamIds.length && currentIds.every(id => newExamIds.includes(id));
      
      let spChanged = false;
      const currentSp = hall.seatingPlan || [];
      const newSp = currentSp.filter(item => {
        const student = s.students.find(st => st.id === item.studentId);
        if (!student) { spChanged = true; return false; }
        if (newExamIds.length > 0) {
          const hasReg = student.examRegistrations?.some(reg => newExamIds.includes(reg.examId));
          if (!hasReg) { spChanged = true; return false; }
        } else {
          spChanged = true; return false;
        }
        return true;
      });
      if (!isSame || spChanged) {
        return { ...hall, examIds: newExamIds, examId: newExamIds.length > 0 ? newExamIds[0] : undefined, seatingPlan: newSp };
      }
      return hall;
    });
    
    const newBudget = syncFinancials(s.students, exams, s.budget);
    
    const newExamIds = exams.map(e => e.id);
    const studentsWithCleanRegs = s.students.map(st => {
      const regs = st.examRegistrations || [];
      const filtered = regs.filter(r => newExamIds.includes(r.examId));
      if (filtered.length !== regs.length) { return { ...st, examRegistrations: filtered }; }
      return st;
    });
    const updatedStudents = recalculateLeagueForStudents(studentsWithCleanRegs, s.results, exams, s.approvedTransfers || []);
    persistState({ ...s, exams, examHalls: updatedHalls, budget: newBudget, students: updatedStudents });
  };

  const setResults = (results: ExamResult[]) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    const updatedStudents = recalculateLeagueForStudents(s.students, results, s.exams, s.approvedTransfers || []);
    persistState({ ...s, results, students: updatedStudents });
  };
  
  const setBudget = (budget: BudgetData) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    const { updatedStudents, updatedExams, cleanedBudget } = propagateManualBudgetChanges(s.students, s.exams, budget);
    const finalBudget = syncFinancials(updatedStudents, updatedExams, cleanedBudget);
    persistState({ ...s, students: updatedStudents, exams: updatedExams, budget: finalBudget });
  };

  const setExamHalls = (examHalls: ExamHall[]) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    const updatedExams = s.exams.map(exam => {
      const matchingHalls = examHalls.filter(h => h.examIds?.includes(exam.id) || h.examId === exam.id);
      const newAssignedHalls = matchingHalls.map(h => h.id);
      const currentAssigned = exam.assignedHalls || [];
      const isSame = currentAssigned.length === newAssignedHalls.length && currentAssigned.every(id => newAssignedHalls.includes(id));
      
      if (!isSame) { return { ...exam, assignedHalls: newAssignedHalls }; }
      return exam;
    });
    persistState({ ...s, examHalls, exams: updatedExams });
  };
  
  const updateBudget = (type: 'incomes' | 'expenses' | 'debts', data: any[]) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    const nextBudget = { ...s.budget, [type]: data };
    const { updatedStudents, updatedExams, cleanedBudget } = propagateManualBudgetChanges(s.students, s.exams, nextBudget);
    const finalBudget = syncFinancials(updatedStudents, updatedExams, cleanedBudget);
    persistState({ ...s, students: updatedStudents, exams: updatedExams, budget: finalBudget });
  };

  const updateLeagueSettings = (mentors: Record<string, string>, teamPoints: Record<string, number>) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    persistState({ ...s, leagueMentors: mentors, leagueTeamPoints: teamPoints });
  };

  const updateUsers = (admins: string[], teachers: string[]) => {
    const s = stateRef.current;
    persistState({ ...s, admins, teachers });
  };

  const approveTransfer = (studentNo: number, examName: string, toTeam: string) => {
    if (userRole !== 'admin') return;
    const s = stateRef.current;
    const newApproved = [...(s.approvedTransfers || []), { studentNo, examName, toTeam }];
    const updatedStudents = recalculateLeagueForStudents(s.students, s.results, s.exams, newApproved);
    persistState({ ...s, approvedTransfers: newApproved, students: updatedStudents });
  };

  const restoreBackup = async (rawBackup: any): Promise<{ success: boolean; message: string; summary?: any }> => {
    if (!rawBackup || typeof rawBackup !== 'object') {
      return { success: false, message: 'Geçersiz yedek dosyası formatı.' };
    }

    const source = (rawBackup.students || rawBackup.exams || rawBackup.results || rawBackup.budget || rawBackup.examHalls)
      ? rawBackup
      : (rawBackup.data || rawBackup.appState || rawBackup);

    const hasRecognizableData = 
      Array.isArray(source.students) || 
      Array.isArray(source.exams) || 
      Array.isArray(source.results) || 
      Array.isArray(source.examHalls) || 
      (source.budget && typeof source.budget === 'object');

    if (!hasRecognizableData) {
      return { success: false, message: 'Yedek dosyasında geçerli okul verisi bulunamadı.' };
    }

    const cleanStudents: Student[] = Array.isArray(source.students)
      ? source.students.map((s: any) => ({
          id: s.id || generateId(),
          no: Number(s.no) || 0,
          name: String(s.name || '').trim(),
          className: String(s.className || '').trim(),
          examRegistrations: Array.isArray(s.examRegistrations) ? s.examRegistrations : [],
          leagueTeam: s.leagueTeam || 'Atanmadı',
          leaguePoints: Number(s.leaguePoints) || 0,
          badges: s.badges || undefined,
          lastTransfer: s.lastTransfer || undefined
        }))
      : [];

    const cleanExams: Exam[] = Array.isArray(source.exams)
      ? source.exams.map((e: any) => ({
          id: e.id || generateId(),
          no: Number(e.no) || 0,
          date: String(e.date || ''),
          name: String(e.name || '').trim(),
          participantCount: Number(e.participantCount) || 0,
          publisher: e.publisher ? String(e.publisher) : undefined,
          publisherFee: e.publisherFee !== undefined ? Number(e.publisherFee) : undefined,
          orderQuantity: e.orderQuantity !== undefined ? Number(e.orderQuantity) : undefined,
          gradeOrderQuantities: e.gradeOrderQuantities || undefined,
          participatingClasses: Array.isArray(e.participatingClasses) ? e.participatingClasses : [],
          assignedHalls: Array.isArray(e.assignedHalls) ? e.assignedHalls : []
        }))
      : [];

    const cleanResults: ExamResult[] = Array.isArray(source.results)
      ? source.results.map((r: any) => ({
          id: r.id || generateId(),
          studentId: String(r.studentId || ''),
          studentNo: Number(r.studentNo) || 0,
          studentName: String(r.studentName || '').trim(),
          studentClass: String(r.studentClass || '').trim(),
          scores: r.scores && typeof r.scores === 'object' ? r.scores : {},
          average: Number(r.average) || 0,
          details: r.details && typeof r.details === 'object' ? r.details : undefined,
          earnedLP: r.earnedLP !== undefined ? Number(r.earnedLP) : undefined,
          earnedBadges: Array.isArray(r.earnedBadges) ? r.earnedBadges : undefined
        }))
      : [];

    const cleanHalls: ExamHall[] = Array.isArray(source.examHalls)
      ? source.examHalls.map((h: any) => ({
          id: h.id || generateId(),
          name: String(h.name || '').trim(),
          capacity: Number(h.capacity) || 0,
          examId: h.examId ? String(h.examId) : undefined,
          examIds: Array.isArray(h.examIds) ? h.examIds : (h.examId ? [String(h.examId)] : []),
          selectedClasses: Array.isArray(h.selectedClasses) ? h.selectedClasses : [],
          seatingPlan: Array.isArray(h.seatingPlan) ? h.seatingPlan : [],
          columns: Array.isArray(h.columns) ? h.columns : []
        }))
      : [];

    const rawBudget = source.budget || {};
    const cleanBudget: BudgetData = {
      incomes: Array.isArray(rawBudget.incomes) ? rawBudget.incomes : [],
      expenses: Array.isArray(rawBudget.expenses) ? rawBudget.expenses : [],
      debts: Array.isArray(rawBudget.debts) ? rawBudget.debts : []
    };

    const cleanLeagueMentors: Record<string, string> = 
      source.leagueMentors && typeof source.leagueMentors === 'object' ? source.leagueMentors : {};
    const cleanLeagueTeamPoints: Record<string, number> = 
      source.leagueTeamPoints && typeof source.leagueTeamPoints === 'object' ? source.leagueTeamPoints : {};
    const cleanApprovedTransfers = Array.isArray(source.approvedTransfers) ? source.approvedTransfers : [];

    const superAdminEmail = 'kirklareliataturkortaokulu@gmail.com';
    const adminSet = new Set<string>([superAdminEmail]);
    if (Array.isArray(source.admins)) {
      source.admins.forEach((a: string) => { if (a && typeof a === 'string') adminSet.add(a); });
    }
    const cleanAdmins = Array.from(adminSet);
    const cleanTeachers: string[] = Array.isArray(source.teachers) ? source.teachers.filter(Boolean) : [];

    const syncedBudget = syncFinancials(cleanStudents, cleanExams, cleanBudget);
    const updatedStudents = recalculateLeagueForStudents(cleanStudents, cleanResults, cleanExams, cleanApprovedTransfers);

    const fullState: AppState = {
      students: updatedStudents,
      exams: cleanExams,
      results: cleanResults,
      budget: syncedBudget,
      examHalls: cleanHalls,
      leagueMentors: cleanLeagueMentors,
      leagueTeamPoints: cleanLeagueTeamPoints,
      approvedTransfers: cleanApprovedTransfers,
      admins: cleanAdmins,
      teachers: cleanTeachers
    };

    persistState(fullState);

    const summary = {
      studentCount: updatedStudents.length,
      examCount: cleanExams.length,
      resultCount: cleanResults.length,
      hallCount: cleanHalls.length,
      incomeCount: syncedBudget.incomes.length,
      expenseCount: syncedBudget.expenses.length,
      debtCount: syncedBudget.debts.length
    };

    return {
      success: true,
      message: 'Tüm sistem içerikleri başarıyla yüklendi.',
      summary
    };
  };

  const overwriteState = (newState: AppState) => {
    restoreBackup(newState);
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      userRole, 
      setUserRole,
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      syncStatus, 
      syncErrorMessage: null, 
      setStudents, 
      setExams, 
      setResults, 
      setBudget, 
      setExamHalls, 
      updateBudget, 
      updateLeagueSettings, 
      approveTransfer, 
      updateUsers, 
      overwriteState,
      restoreBackup,
      saveNow
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
