import React, { useState, useEffect } from 'react';
import { Users, Calendar, BarChart2, DollarSign, LayoutTemplate, Save, DownloadCloud, UploadCloud, Trophy, Sun, Moon, X, Settings, Shield, CheckCircle2, Cloud } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { GoogleDriveModal } from './GoogleDriveModal';
import { FullBackupData } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'students', label: 'Öğrenci Kayıtları', shortLabel: 'Öğrenciler', icon: Users, colorClass: 'text-blue-400', hoverColorClass: 'group-hover:text-blue-400', activeClass: 'bg-blue-500/15 border-blue-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'exams', label: 'Deneme Sınavları', shortLabel: 'Sınavlar', icon: Calendar, colorClass: 'text-indigo-400', hoverColorClass: 'group-hover:text-indigo-400', activeClass: 'bg-indigo-500/15 border-indigo-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'results', label: 'Sınav Sonuçları', shortLabel: 'Sonuçlar', icon: BarChart2, colorClass: 'text-emerald-400', hoverColorClass: 'group-hover:text-emerald-400', activeClass: 'bg-emerald-500/15 border-emerald-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'league', label: 'Akademi Arena', shortLabel: 'Arena', icon: Trophy, colorClass: 'text-amber-400', hoverColorClass: 'group-hover:text-amber-400', activeClass: 'bg-amber-500/15 border-amber-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'halls', label: 'Sınav Salonları', shortLabel: 'Salonlar', icon: LayoutTemplate, colorClass: 'text-pink-400', hoverColorClass: 'group-hover:text-pink-400', activeClass: 'bg-pink-500/15 border-pink-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'budget', label: 'Bütçe Takibi', shortLabel: 'Bütçe', icon: DollarSign, colorClass: 'text-cyan-400', hoverColorClass: 'group-hover:text-cyan-400', activeClass: 'bg-cyan-500/15 border-cyan-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { userRole, setUserRole, currentUser, state, restoreBackup, syncStatus, saveNow } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const getRoleLabel = () => {
    return userRole === 'admin' ? 'Yönetici' : 'Öğretmen';
  };
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('akademiDarkMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('akademiDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  const handleBackup = () => {
    const backupData: FullBackupData = {
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

    const stateStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([stateStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `AkademiPanel_Tam_Yedek_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaveFeedback("Tüm sistem yedeği indirildi (JSON)");
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          const parsed = JSON.parse(content);
          const res = await restoreBackup(parsed);
          if (res.success && res.summary) {
            setSaveFeedback(
              `Tüm içerikler başarıyla yüklendi! (${res.summary.studentCount} Öğrenci, ${res.summary.examCount} Sınav, ${res.summary.resultCount} Sonuç, ${res.summary.hallCount} Salon)`
            );
            setTimeout(() => setSaveFeedback(null), 5000);
          } else {
            alert(res.message || "Yedek dosyası içeriği doğrulanamadı.");
          }
        } catch (error) {
          alert("Geçersiz veya bozuk JSON yedek dosyası!");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleManualSave = async () => {
    await saveNow();
    setSaveFeedback("Tüm veriler yerel hafızaya kaydedildi.");
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen w-full bg-brand-bg text-brand-ink overflow-hidden font-sans relative">
      
      {/* Mobile Settings Action Sheet / Bottom Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md md:hidden transition-all" onClick={closeMobileMenu}>
          <div 
            className="w-full bg-[#18191c] border-t border-white/10 rounded-t-[32px] p-6 pb-safe flex flex-col gap-4 animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-1"></div>

            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-accent to-[#8d6f3e] flex items-center justify-center text-white shadow-sm font-bold text-sm">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base leading-tight">AkademiPanel</h3>
                  <p className="text-[11px] text-white/50 truncate max-w-[200px]">{currentUser?.email}</p>
                </div>
              </div>
              <button 
                onClick={closeMobileMenu} 
                className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Role Switcher */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs text-white/80 font-medium">Yetki Düzeyi</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setUserRole('admin')}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer",
                    userRole === 'admin'
                      ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  Yönetici
                </button>
                <button
                  onClick={() => setUserRole('teacher')}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer",
                    userRole === 'teacher'
                      ? "bg-blue-500/20 border-blue-400/40 text-blue-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  Öğretmen
                </button>
              </div>
            </div>
            
            {/* Management Actions */}
            <input type="file" accept=".json" className="hidden" id="restore-input-mobile" onChange={handleRestore} />
            
            <div className="space-y-3">
              {/* Local Storage Status Badge */}
              <div className="rounded-2xl p-3 flex items-center justify-between border bg-emerald-950/40 border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-emerald-300">
                      {syncStatus === 'saving' ? "Kaydediliyor..." : "Yerel Hafızada Güvende"}
                    </p>
                    <p className="text-[10px] text-white/60 truncate">
                      {saveFeedback || "Tüm veriler cihazınızda otomatik saklanır"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleManualSave}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold border border-white/20 transition-colors cursor-pointer shrink-0"
                  title="Manuel Kaydet"
                >
                  Kaydet
                </button>
              </div>

              {/* Google Drive Bulut Senkronizasyonu */}
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <p className="text-[11px] font-bold text-white">Google Drive Bulut</p>
                  </div>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                    Senkronize
                  </span>
                </div>
                <button
                  onClick={() => { setIsDriveModalOpen(true); closeMobileMenu(); }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Google Drive'a Yedekle / Yükle</span>
                </button>
              </div>

              {/* Yerel Çevrimdışı İndirme / Yükleme */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-white/80">Tam Sistem Yedeği</p>
                  <span className="text-[9px] text-white/50">6 Modül Kapsamlı</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleBackup} 
                    className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium p-2.5 rounded-xl border border-white/10 transition-all active:scale-[0.99] text-center cursor-pointer"
                    title="Tüm Sistem Yedeğini İndir"
                  >
                    <DownloadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Yedek İndir</span>
                  </button>

                  <button 
                    onClick={() => document.getElementById('restore-input-mobile')?.click()} 
                    className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium p-2.5 rounded-xl border border-white/10 transition-all active:scale-[0.99] text-center cursor-pointer"
                    title="Tam Sistem Yedeği Yükle (JSON)"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">Yedek Yükle</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="flex items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white transition-all gap-2 text-center cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-indigo-300 shrink-0" />}
                  <span className="text-xs font-semibold">{isDarkMode ? 'Aydınlık Tema' : 'Karanlık Tema'}</span>
                </button>

                <button 
                  onClick={() => { setIsSettingsOpen(true); closeMobileMenu(); }} 
                  className="flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-all active:scale-[0.99] gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kullanıcı Yönetimi</span>
                </button>
              </div>
            </div>
            
            <div className="text-center pt-2">
              <span className="text-[10px] text-white/30 tracking-wider">AkademiPanel • Sınav & Ölçme Değerlendirme</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className={cn(
        "hidden md:flex fixed inset-y-0 left-0 z-50 w-[280px] bg-brand-sidebar-bg text-white flex-col p-6 justify-between border-r border-white/5 overflow-y-auto relative translate-x-0 shrink-0"
      )}>
        <div className="flex flex-col flex-grow">
          <div className="brand mb-6 flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h1 className="font-serif text-[1.75rem] italic font-semibold tracking-tight text-white mb-0.5">AkademiPanel</h1>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 font-medium">Ölçme ve Değerlendirme</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-grow space-y-1.5 mt-2">
            {navItems.filter(item => userRole === 'admin' || ['results', 'league'].includes(item.id)).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    closeMobileMenu();
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl text-left text-[0.875rem] font-medium transition-all cursor-pointer group",
                    isActive 
                      ? item.activeClass 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "w-[19px] h-[19px] transition-transform duration-200 group-hover:scale-110", 
                    isActive ? item.colorClass : cn("text-white/60", item.hoverColorClass)
                  )} />
                  <span className={cn("transition-colors", isActive ? "text-white font-semibold" : "group-hover:text-white")}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="sidebar-footer mt-auto flex flex-col gap-2.5 w-full pt-4 border-t border-white/10">
          <input type="file" accept=".json" className="hidden" id="restore-input" onChange={handleRestore} />
          
          {/* Storage Indicator */}
          <div className="flex items-center justify-between px-3 py-2 border rounded-xl text-[0.72rem] font-semibold transition-all bg-emerald-950/40 border-emerald-500/30 text-emerald-300">
            <span className="flex items-center gap-2 truncate mr-1">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate">
                {syncStatus === 'saving' ? "Kaydediliyor..." : "Yerel Hafıza Güvende"}
              </span>
            </span>
            <button
              onClick={handleManualSave}
              className="text-[0.65rem] text-white/80 hover:text-white hover:underline cursor-pointer font-bold shrink-0 ml-1"
              title="Manuel Kaydet"
            >
              Kaydet
            </button>
          </div>

          {/* Google Drive Cloud Sync Button Desktop */}
          <button 
            onClick={() => setIsDriveModalOpen(true)} 
            className="flex items-center justify-between w-full bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-900/60 hover:to-indigo-900/60 active:scale-[0.98] text-white text-[0.75rem] font-bold py-2 px-3 rounded-xl border border-blue-400/30 shadow-xs transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-2 truncate">
              <Cloud className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Google Drive Yedek</span>
            </span>
            <span className="text-[9px] bg-blue-400/20 text-blue-300 font-semibold px-1.5 py-0.5 rounded-full border border-blue-400/30">
              Bulut
            </span>
          </button>

          {/* JSON Backup & Restore Pair Buttons */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] text-white/50 font-medium">Yerel JSON Yedeği</span>
              <span className="text-[9px] text-emerald-400/80 font-mono">6 Modül</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleBackup} 
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white/80 hover:text-white text-[0.72rem] font-medium py-2 px-2.5 rounded-xl border border-white/10 transition-all cursor-pointer gap-1.5 truncate"
                title="Tüm Sistem Yedeğini İndir"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Yedek İndir</span>
              </button>
              <button 
                onClick={() => document.getElementById('restore-input')?.click()} 
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white/80 hover:text-white text-[0.72rem] font-medium py-2 px-2.5 rounded-xl border border-white/10 transition-all cursor-pointer gap-1.5 truncate"
                title="Tam Sistem Yedeği Yükle (JSON)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Yedek Yükle</span>
              </button>
            </div>
          </div>
          
          {/* Admin User Management Button */}
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="flex items-center justify-center w-full bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[0.75rem] font-bold py-2.5 px-3 rounded-xl border border-emerald-500/20 transition-all cursor-pointer gap-2"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kullanıcı & Yetki Yönetimi</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="flex items-center justify-center w-full bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white text-[0.75rem] font-medium py-2 px-3 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer gap-2"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />} 
            <span>{isDarkMode ? 'Aydınlık Tema' : 'Karanlık Tema'}</span>
          </button>
          
          {/* User Info & Role Badge Desktop */}
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">{getRoleLabel()}</span>
              <span className="text-[11px] text-white/70 truncate" title={currentUser?.email || ''}>{currentUser?.name || 'Kullanıcı'}</span>
            </div>
            <button
              onClick={() => setUserRole(userRole === 'admin' ? 'teacher' : 'admin')}
              className="text-[10px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-white/80 font-medium transition-colors cursor-pointer"
              title="Rolü Değiştir"
            >
              Değiştir
            </button>
          </div>
          
          <div className="pt-1 text-center">
            <p className="text-[9px] text-white/30 tracking-wider">
              Powered by Kumcu
            </p>
          </div>
        </div>
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <GoogleDriveModal isOpen={isDriveModalOpen} onClose={() => setIsDriveModalOpen(false)} />
      
      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col overflow-auto bg-brand-bg transition-all duration-300 w-full pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0", isDarkMode ? "dark-mode-main" : "")}>
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#151618]/95 backdrop-blur-xl text-white border-b border-white/10 shrink-0 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent to-[#e2c18d] flex items-center justify-center shadow-sm">
              <span className="font-serif italic font-bold text-white text-base">A</span>
            </div>
            <div>
              <h1 className="font-serif text-base italic font-bold tracking-tight text-white leading-none">AkademiPanel</h1>
              {(() => {
                const current = navItems.find(i => i.id === activeTab);
                return current ? (
                  <span className={cn("text-[10px] font-semibold tracking-wide flex items-center gap-1 mt-0.5", current.colorClass)}>
                    {current.label}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsDriveModalOpen(true)} 
              aria-label="Google Drive Bulut Yedekleme"
              title="Bulut Yedekleme & Cihaz Eşitleme"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-400 border border-blue-400/30 transition-all cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-blue-400" />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              aria-label="Temayı Değiştir"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 border border-white/10 transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              aria-label="Seçenekler"
              className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white border border-white/10 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-brand-accent/30 text-brand-accent flex items-center justify-center text-[10px] font-bold">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <Settings className="w-3.5 h-3.5" />}
              </div>
              <Settings className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-10 w-full max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#151618]/95 backdrop-blur-2xl border-t border-white/10 z-40 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.filter(item => userRole === 'admin' || ['results', 'league'].includes(item.id)).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 group",
                  isActive ? "text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                {/* Active Glow Pill */}
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200",
                  isActive ? "bg-white/10 shadow-inner" : "bg-transparent"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive ? cn(item.colorClass, "scale-110") : "text-white/40 group-hover:text-white/70"
                  )} />
                  {isActive && (
                    <span className="absolute -top-1 w-2 h-0.5 rounded-full bg-brand-accent shadow-[0_0_8px_#B08D57]" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold tracking-tight transition-colors duration-200 mt-0.5 leading-none",
                  isActive ? "text-white font-bold" : "text-white/40"
                )}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
