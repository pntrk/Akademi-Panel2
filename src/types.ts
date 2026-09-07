export interface Student {
  id: string;
  no: number;
  name: string;
  className: string;
  examRegistrations?: { examId: string; fee: number; isPaid?: boolean; dateRegistered?: string }[];
  leagueTeam?: 'Kutup Yıldızları' | 'Sıçrama Ustaları' | 'Taktik Avcıları' | 'Atanmadı';
  leaguePoints?: number;
  badges?: { 
    kalkan: number; ivme: number; zirve: number; tamIsabet: number; kirmiziKart: number; 
    zirveBekcisi: number; ivmeSampiyonu: number; barajYikici: number; stratejiMuhendisi: number; istikrarElcisi: number;
    lgsFatihi: number; takimRuhu: number; ankaKusu: number; sozelSovalyesi: number; sayisalKalesi: number; matematikUyanisi: number; dengeCambazi: number; keskinNisanci: number; temelAtici: number;
    uyuyanDev: number; sabirTasi: number; yinYang: number; filozof: number; newton: number; pisagor: number;
  };
  lastTransfer?: string;
}

export interface Exam {
  id: string;
  no: number;
  date: string;
  name: string;
  participantCount: number;
  publisher?: string;
  publisherFee?: number;
  orderQuantity?: number; // Order quantity for publisher fee
  gradeOrderQuantities?: Record<string, number>; // Order quantity mapped by grade level, e.g. {"8": 50, "Diğer": 10}
  participatingClasses?: string[]; // e.g. ["8-A", "8-B"]
  assignedHalls?: string[]; // array of ExamHall IDs
}

export interface LessonDetail {
  D: number;
  Y: number;
  B: number;
  N: number;
  totalQuestions: number;
}

export interface ExamDetail {
  puan: number;
  lessons: Record<string, LessonDetail>;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentNo: number;
  studentName: string;
  studentClass: string;
  scores: Record<string, number>; // examId -> score
  average: number;
  details?: Record<string, ExamDetail>; // examName -> ExamDetail
  earnedLP?: number;
  earnedBadges?: string[];
}

export interface BudgetIncome {
  id: string;
  name: string;
  amount: number;
  studentId?: string;
  examId?: string;
}

export interface BudgetExpense {
  id: string;
  no: number;
  name: string;
  amount: number;
  examId?: string;
}

export interface BudgetDebt {
  id: string;
  name: string;
  amount: number;
}

export interface BudgetData {
  incomes: BudgetIncome[];
  expenses: BudgetExpense[];
  debts: BudgetDebt[];
}

export interface SeatingPlanItem {
  deskNumber: number;
  studentId: string;
  studentNo: number;
  studentName: string;
  studentClass: string;
}

export interface ExamHall {
  id: string;
  name: string;
  capacity?: number;
  examId?: string; // Kept for backwards compatibility
  examIds?: string[]; // Allow multiple exams
  selectedClasses?: string[];
  seatingPlan?: SeatingPlanItem[];
  columns?: {
    id: string;
    deskCount: number;
    seatsPerDesk: number;
    name: string;
  }[];
}

export interface FullBackupSummary {
  studentCount: number;
  examCount: number;
  resultCount: number;
  hallCount: number;
  budgetIncomesCount: number;
  budgetExpensesCount: number;
  budgetDebtsCount: number;
  arenaMentorsCount?: number;
  arenaBonusCount?: number;
  approvedTransferCount?: number;
}

export interface FullBackupData {
  appName: string;
  version: string;
  backupDate: string;
  school?: string;
  modules?: string[];
  summary?: FullBackupSummary;
  students: Student[];
  exams: Exam[];
  results: ExamResult[];
  examHalls: ExamHall[];
  budget: BudgetData;
  leagueMentors?: Record<string, string>;
  leagueTeamPoints?: Record<string, number>;
  approvedTransfers?: { studentNo: number; examName: string; toTeam: string }[];
  admins?: string[];
  teachers?: string[];
}
