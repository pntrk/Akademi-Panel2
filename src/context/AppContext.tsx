import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Student, Exam, ExamResult, BudgetData, ExamHall, SeatingPlanItem } from '../types';
import { generateId, recalculateLeagueForStudents } from '../lib/utils';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, disableNetwork, enableNetwork } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface AppState {
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

interface AppContextType {
  state: AppState;
  userRole: 'admin' | 'teacher' | 'guest';
  syncStatus: 'synced' | 'saving' | 'quota_exceeded' | 'offline' | 'error';
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
  admins: ['kirklareliataturkortaokulu@gmail.com', 'bahadirkumcu@gmail.com'],
  teachers: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Financial Sync Engine ---
const syncFinancials = (students: Student[], exams: Exam[], budget: BudgetData): BudgetData => {
  // Same logic as before
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
      return {
        students: parsed.students || [],
        exams: parsed.exams || [],
        results: parsed.results || [],
        budget: parsed.budget || { incomes: [], expenses: [], debts: [] },
        examHalls: parsed.examHalls || [],
        leagueMentors: parsed.leagueMentors || {},
        leagueTeamPoints: parsed.leagueTeamPoints || {},
        approvedTransfers: parsed.approvedTransfers || [],
        admins: parsed.admins || ['kirklareliataturkortaokulu@gmail.com', 'bahadirkumcu@gmail.com'],
        teachers: parsed.teachers || []
      };
    }
  } catch (e) {
    console.error('Error loading initial local state:', e);
  }
  return defaultState;
};

const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

const checkIsQuotaExceededToday = () => {
  try {
    const saved = localStorage.getItem('firestore_quota_exceeded_date');
    return saved === getTodayDateStr();
  } catch (e) {
    return false;
  }
};

const markQuotaExceededToday = () => {
  try {
    localStorage.setItem('firestore_quota_exceeded_date', getTodayDateStr());
  } catch (e) {}
};

const clearQuotaExceeded = () => {
  try {
    localStorage.removeItem('firestore_quota_exceeded_date');
  } catch (e) {}
};

export const AppProvider = ({ children, user }: { children: ReactNode, user: User }) => {
  const isInitialQuotaExceeded = checkIsQuotaExceededToday();
  const [state, setState] = useState<AppState>(loadInitialState);
  const stateRef = useRef<AppState>(state);
  const lastSavedPayloadRef = useRef<string>('');
  const debounceTimerRef = useRef<any>(null);
  const isQuotaExceededRef = useRef(isInitialQuotaExceeded);
  const hasSentGuestRequestRef = useRef(false);

  // If quota was already exceeded today, disable Firestore background network stream to prevent retry loops
  useEffect(() => {
    if (isInitialQuotaExceeded) {
      disableNetwork(db).catch(() => {});
    }
  }, []);

  const initialRole = (() => {
    const email = user?.email || '';
    if (email === 'kirklareliataturkortaokulu@gmail.com' || email === 'bahadirkumcu@gmail.com') return 'admin';
    if (state.admins?.includes(email)) return 'admin';
    if (state.teachers?.includes(email)) return 'teacher';
    return 'guest';
  })();

  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'guest'>(initialRole);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'quota_exceeded' | 'offline' | 'error'>(
    isInitialQuotaExceeded ? 'quota_exceeded' : 'synced'
  );
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(
    isInitialQuotaExceeded ? 'Firestore günlük ücretsiz yazma kotası doldu. Verileriniz bu cihazda kesintisiz ve güvenle saklanmaktadır.' : null
  );

  // Firestore Real-time Listener with Quota & Offline Handling
  useEffect(() => {
    const docRef = doc(db, 'schools', 'main');
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppState;
        
        const safeData: AppState = {
          students: data.students || [],
          exams: data.exams || [],
          results: data.results || [],
          budget: data.budget || { incomes: [], expenses: [], debts: [] },
          examHalls: data.examHalls || [],
          leagueMentors: data.leagueMentors || {},
          leagueTeamPoints: data.leagueTeamPoints || {},
          approvedTransfers: data.approvedTransfers || [],
          admins: data.admins || ['kirklareliataturkortaokulu@gmail.com', 'bahadirkumcu@gmail.com'],
          teachers: data.teachers || []
        };
        
        safeData.budget = syncFinancials(safeData.students, safeData.exams, safeData.budget);
        
        setState(safeData);
        stateRef.current = safeData;
        
        // Cache to localStorage
        try {
          localStorage.setItem('okulYonetimState', JSON.stringify(safeData));
          lastSavedPayloadRef.current = JSON.stringify(safeData);
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
        
        const userEmail = user.email || '';
        if (userEmail === 'kirklareliataturkortaokulu@gmail.com' || userEmail === 'bahadirkumcu@gmail.com' || safeData.admins.includes(userEmail)) {
          setUserRole('admin');
        } else if (safeData.teachers.includes(userEmail)) {
          setUserRole('teacher');
        } else {
          setUserRole('guest');
          if (userEmail && !hasSentGuestRequestRef.current && !isQuotaExceededRef.current) {
            hasSentGuestRequestRef.current = true;
            setDoc(doc(db, 'access_requests', userEmail), {
              email: userEmail,
              name: user.displayName || userEmail.split('@')[0],
              timestamp: new Date().toISOString()
            }).catch(() => {});
          }
        }
        if (!isQuotaExceededRef.current) {
          setSyncStatus('synced');
          setSyncErrorMessage(null);
        }
      } else {
        // Doc doesn't exist yet, if user is super admin initialize it (only if quota not exceeded)
        const userEmail = user.email || '';
        if (userEmail === 'kirklareliataturkortaokulu@gmail.com' || userEmail === 'bahadirkumcu@gmail.com') {
          setUserRole('admin');
          if (!isQuotaExceededRef.current) {
            setDoc(docRef, stateRef.current).catch((err) => {
              if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
                markQuotaExceededToday();
                isQuotaExceededRef.current = true;
                setSyncStatus('quota_exceeded');
                disableNetwork(db).catch(() => {});
              }
            });
          }
        }
      }
      setLoading(false);
    }, (error: any) => {
      const isQuota = error?.code === 'resource-exhausted' || error?.message?.includes('Quota') || error?.message?.includes('quota');
      if (isQuota) {
        markQuotaExceededToday();
        isQuotaExceededRef.current = true;
        setSyncStatus('quota_exceeded');
        setSyncErrorMessage('Firestore günlük ücretsiz yazma kotası doldu. Verileriniz bu cihazda kesintisiz ve güvenle saklanmaktadır.');
        disableNetwork(db).catch(() => {});
      } else {
        setSyncStatus('offline');
        setSyncErrorMessage('Bulut bağlantısı çevrimdışı. Verileriniz yerel hafızada korunmaktadır.');
      }

      const userEmail = user.email || '';
      if (userEmail === 'kirklareliataturkortaokulu@gmail.com' || userEmail === 'bahadirkumcu@gmail.com' || stateRef.current.admins?.includes(userEmail)) {
        setUserRole('admin');
      } else if (stateRef.current.teachers?.includes(userEmail)) {
        setUserRole('teacher');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, user.email]);

  // Performs actual Firestore write with error protection and status tracking
  const executeFirestoreWrite = async (newState: AppState, forceRetry = false) => {
    if (userRole !== 'admin') return;

    // If quota was already exceeded, skip background auto-writes to prevent retry storm unless manually forced
    if (isQuotaExceededRef.current && !forceRetry) {
      setSyncStatus('quota_exceeded');
      return;
    }

    try {
      if (forceRetry) {
        clearQuotaExceeded();
        isQuotaExceededRef.current = false;
        await enableNetwork(db).catch(() => {});
      }

      const cleanState = JSON.parse(JSON.stringify(newState));
      const payloadString = JSON.stringify(cleanState);

      // Skip redundant writes
      if (payloadString === lastSavedPayloadRef.current && !forceRetry) {
        setSyncStatus('synced');
        return;
      }

      setSyncStatus('saving');
      await setDoc(doc(db, 'schools', 'main'), cleanState);
      
      lastSavedPayloadRef.current = payloadString;
      clearQuotaExceeded();
      isQuotaExceededRef.current = false;
      setSyncStatus('synced');
      setSyncErrorMessage(null);
    } catch (error: any) {
      const isQuota = error?.code === 'resource-exhausted' || error?.message?.includes('Quota') || error?.message?.includes('quota');
      
      if (isQuota) {
        markQuotaExceededToday();
        isQuotaExceededRef.current = true;
        setSyncStatus('quota_exceeded');
        setSyncErrorMessage('Firestore günlük ücretsiz yazma kotası doldu. Verileriniz bu cihazda kesintisiz olarak korunmaktadır.');
        disableNetwork(db).catch(() => {});
      } else {
        setSyncStatus('error');
        setSyncErrorMessage(error?.message || 'Buluta kaydedilemedi. Verileriniz yerel olarak güvendedir.');
      }
    }
  };

  const updateFirebase = (newState: AppState) => {
    stateRef.current = newState;
    setState(newState);

    // 1. Instant local persistence so data is never lost regardless of network/quota
    try {
      localStorage.setItem('okulYonetimState', JSON.stringify(newState));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 2. If quota is known to be exceeded, don't spam background writes
    if (isQuotaExceededRef.current) {
      setSyncStatus('quota_exceeded');
      return;
    }

    // 3. Debounce cloud writes (2500ms) to prevent hitting Firestore write quota limits
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeFirestoreWrite(newState);
    }, 2500);
  };

  const saveNow = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Always persist to localStorage
    try {
      localStorage.setItem('okulYonetimState', JSON.stringify(stateRef.current));
    } catch (e) {}

    await executeFirestoreWrite(stateRef.current, true);
  };

  const setStudents = (students: Student[]) => { if (userRole !== 'admin') return; _setStudents(students); };
  const _setStudents = (students: Student[]) => {
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
    updateFirebase({ ...s, students, examHalls: updatedHalls, budget: newBudget });
  };

  const setExams = (exams: Exam[]) => { if (userRole !== 'admin') return; _setExams(exams); };
  const _setExams = (exams: Exam[]) => {
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
    
    // Clean up student registrations for exams that no longer exist
    const newExamIds = exams.map(e => e.id);
    const studentsWithCleanRegs = s.students.map(st => {
      const regs = st.examRegistrations || [];
      const filtered = regs.filter(r => newExamIds.includes(r.examId));
      if (filtered.length !== regs.length) { return { ...st, examRegistrations: filtered }; }
      return st;
    });
    const updatedStudents = recalculateLeagueForStudents(studentsWithCleanRegs, s.results, exams, s.approvedTransfers || []);
    updateFirebase({ ...s, exams, examHalls: updatedHalls, budget: newBudget, students: updatedStudents });
  };

  const setResults = (results: ExamResult[]) => { if (userRole !== 'admin') return; _setResults(results); };
  const _setResults = (results: ExamResult[]) => {
    const s = stateRef.current;
    const updatedStudents = recalculateLeagueForStudents(s.students, results, s.exams, s.approvedTransfers || []);
    updateFirebase({ ...s, results, students: updatedStudents });
  };
  
  const setBudget = (budget: BudgetData) => { if (userRole !== 'admin') return; _setBudget(budget); };
  const _setBudget = (budget: BudgetData) => {
    const s = stateRef.current;
    const { updatedStudents, updatedExams, cleanedBudget } = propagateManualBudgetChanges(s.students, s.exams, budget);
    const finalBudget = syncFinancials(updatedStudents, updatedExams, cleanedBudget);
    updateFirebase({ ...s, students: updatedStudents, exams: updatedExams, budget: finalBudget });
  };

  const setExamHalls = (examHalls: ExamHall[]) => { if (userRole !== 'admin') return; _setExamHalls(examHalls); };
  const _setExamHalls = (examHalls: ExamHall[]) => {
    const s = stateRef.current;
    const updatedExams = s.exams.map(exam => {
      const matchingHalls = examHalls.filter(h => h.examIds?.includes(exam.id) || h.examId === exam.id);
      const newAssignedHalls = matchingHalls.map(h => h.id);
      const currentAssigned = exam.assignedHalls || [];
      const isSame = currentAssigned.length === newAssignedHalls.length && currentAssigned.every(id => newAssignedHalls.includes(id));
      
      if (!isSame) { return { ...exam, assignedHalls: newAssignedHalls }; }
      return exam;
    });
    updateFirebase({ ...s, examHalls, exams: updatedExams });
  };
  
  const updateBudget = (type: 'incomes' | 'expenses' | 'debts', data: any[]) => { if (userRole !== 'admin') return; _updateBudget(type, data); };
  const _updateBudget = (type: 'incomes' | 'expenses' | 'debts', data: any[]) => {
    const s = stateRef.current;
    const nextBudget = { ...s.budget, [type]: data };
    const { updatedStudents, updatedExams, cleanedBudget } = propagateManualBudgetChanges(s.students, s.exams, nextBudget);
    const finalBudget = syncFinancials(updatedStudents, updatedExams, cleanedBudget);
    updateFirebase({ ...s, students: updatedStudents, exams: updatedExams, budget: finalBudget });
  };

  const updateLeagueSettings = (mentors: Record<string, string>, teamPoints: Record<string, number>) => { if (userRole !== 'admin') return; _updateLeagueSettings(mentors, teamPoints); };
  const _updateLeagueSettings = (mentors: Record<string, string>, teamPoints: Record<string, number>) => {
    const s = stateRef.current;
    updateFirebase({ ...s, leagueMentors: mentors, leagueTeamPoints: teamPoints });
  };

  const updateUsers = (admins: string[], teachers: string[]) => {
    const s = stateRef.current;
    updateFirebase({ ...s, admins, teachers });
  };

  const approveTransfer = (studentNo: number, examName: string, toTeam: string) => { if (userRole !== 'admin') return; _approveTransfer(studentNo, examName, toTeam); };
  const _approveTransfer = (studentNo: number, examName: string, toTeam: string) => {
    const s = stateRef.current;
    const newApproved = [...(s.approvedTransfers || []), { studentNo, examName, toTeam }];
    const updatedStudents = recalculateLeagueForStudents(s.students, s.results, s.exams, newApproved);
    updateFirebase({ ...s, approvedTransfers: newApproved, students: updatedStudents });
  };

  const restoreBackup = async (rawBackup: any): Promise<{ success: boolean; message: string; summary?: any }> => {
    if (userRole !== 'admin') {
      return { success: false, message: 'Yedek yükleme işlemi yalnızca yetkili yöneticiler tarafından gerçekleştirilebilir.' };
    }

    if (!rawBackup || typeof rawBackup !== 'object') {
      return { success: false, message: 'Geçersiz yedek dosyası formatı.' };
    }

    // Support nested payload if wrapped under .data or .appState
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
      return { success: false, message: 'Yedek dosyasında geçerli okul verisi (öğrenci, sınav, salon veya bütçe) bulunamadı.' };
    }

    // 1. Sanitize students
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

    // 2. Sanitize exams
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

    // 3. Sanitize results
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

    // 4. Sanitize halls
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

    // 5. Sanitize budget
    const rawBudget = source.budget || {};
    const cleanBudget: BudgetData = {
      incomes: Array.isArray(rawBudget.incomes) ? rawBudget.incomes : [],
      expenses: Array.isArray(rawBudget.expenses) ? rawBudget.expenses : [],
      debts: Array.isArray(rawBudget.debts) ? rawBudget.debts : []
    };

    // 6. Sanitize arena
    const cleanLeagueMentors: Record<string, string> = 
      source.leagueMentors && typeof source.leagueMentors === 'object' ? source.leagueMentors : {};
    const cleanLeagueTeamPoints: Record<string, number> = 
      source.leagueTeamPoints && typeof source.leagueTeamPoints === 'object' ? source.leagueTeamPoints : {};
    const cleanApprovedTransfers = Array.isArray(source.approvedTransfers) ? source.approvedTransfers : [];

    // 7. Sanitize admins & teachers (preserving super admin)
    const superAdminEmails = ['kirklareliataturkortaokulu@gmail.com', 'bahadirkumcu@gmail.com'];
    const adminSet = new Set<string>(superAdminEmails);
    if (Array.isArray(source.admins)) {
      source.admins.forEach((a: string) => { if (a && typeof a === 'string') adminSet.add(a); });
    }
    const cleanAdmins = Array.from(adminSet);
    const cleanTeachers: string[] = Array.isArray(source.teachers) ? source.teachers.filter(Boolean) : [];

    // 8. Cross-module calculations
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

    // 9. Update state and local storage immediately
    stateRef.current = fullState;
    setState(fullState);
    try {
      localStorage.setItem('okulYonetimState', JSON.stringify(fullState));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 10. Force write to Firebase immediately
    await executeFirestoreWrite(fullState, true);

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
      message: 'Tüm sistem içerikleri başarıyla yüklendi ve buluta aktarıldı.',
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
      syncStatus, 
      syncErrorMessage, 
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
