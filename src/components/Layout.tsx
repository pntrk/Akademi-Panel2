import React, { useState, useEffect } from 'react';
import { Users, Calendar, BarChart2, DollarSign, LayoutTemplate, Save, DownloadCloud, UploadCloud, Trophy, Sun, Moon, X, Settings, LogOut, Shield, Download, Globe, HardDriveDownload } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { SettingsModal } from './SettingsModal';
import { FirebaseStatusModal } from './FirebaseStatusModal';
import { VercelModal } from './VercelModal';
import { PWAInstallModal } from './PWAInstallModal';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { FullBackupData } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'students', label: 'Öğrenci Kayıtları', shortLabel: 'Öğrenciler', icon: Users, colorClass: 'text-blue-400', hoverColorClass: 'group-hover:text-blue-400', activeClass: 'bg-blue-500/15 border-blue-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'exams', label: 'Deneme Sınavları', shortLabel: 'Sınavlar', icon: Calendar, colorClass: 'text-indigo-400', hoverColorClass: 'group-hover:text-indigo-400', activeClass: 'bg-indigo-500/15 border-indigo-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'results', label: 'Sınav Sonuçları', shortLabel: 'Sonuçlar', icon: BarChart2, colorClass: 'text-emerald-400', hoverColorClass: 'group-hover:text-emerald-400', activeClass: 'bg-emerald-500/15 border-emerald-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'league', label: 'Akademi Arena', shortLabel: 'Arena', icon: Trophy, colorClass: 'text-amber-400', hoverColorClass: 'group-hover:text-amber-400', activeClass: 'bg-amber-500/15 border-amber-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'halls', label: 'Sınav Salonları', shortLabel: 'Salonlar', icon: LayoutTemplate, colorClass: 'text-pink-400', hoverColorClass: 'group-hover:text-pink-400', activeClass: 'bg-pink-500/15 border-pink-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
  { id: 'budget', label: 'Bütçe Takibi', shortLabel: 'Bütçe', icon: DollarSign, colorClass: 'text-cyan-400', hoverColorClass: 'group-hover:text-cyan-400', activeClass: 'bg-cyan-500/15 border-cyan-400 border-l-2 pl-3.5 text-white font-semibold shadow-sm' },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const { userRole, state, restoreBackup, syncStatus, syncErrorMessage, saveNow } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirebaseStatusOpen, setIsFirebaseStatusOpen] = useState(false);
  const [isVercelOpen, setIsVercelOpen] = useState(false);
  const [isPWAOpen, setIsPWAOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  const getRoleLabel = () => {
    if (currentUser?.email === 'kirklareliataturkortaokulu@gmail.com' || currentUser?.email === 'bahadirkumcu@gmail.com') return 'Süper Yönetici';
    if (userRole === 'admin') return 'Yönetici';
    return 'Öğretmen';
  };
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('akademiDarkMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('akademiDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  const handleBackup = () => {
    if (userRole !== 'admin') return;
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
      admins: state.admins || ['kirklareliataturkortaokulu@gmail.com', 'bahadirkumcu@gmail.com'],
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
    if (userRole !== 'admin') return;
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
    // Reset input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleManualSave = async () => {
    if (userRole !== 'admin') return;
    try {
      await saveNow();
      setSaveFeedback("✓ Veriler buluta kaydedildi");
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('permission-denied') || msg.includes('Güvenlik')) {
        setSaveFeedback("⚠️ Bulut kural engeli!");
      } else {
        setSaveFeedback("✓ Yerel hafızaya kaydedildi");
      }
      setTimeout(() => setSaveFeedback(null), 4000);
    }
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
                  {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base leading-tight">Hesap ve Seçenekler</h3>
                  <p className="text-[11px] text-white/50 truncate max-w-[200px]">{currentUser?.email || 'Giriş Yapılmadı'}</p>
                </div>
              </div>
              <button 
                onClick={closeMobileMenu} 
                className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Role & Status Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs text-white/80 font-medium">Yetki Düzeyi</span>
              </div>
              <span className="bg-brand-accent/20 border border-brand-accent/40 text-brand-accent font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                {getRoleLabel()}
              </span>
            </div>
            
            {/* Management Actions */}
            {userRole === 'admin' && (
              <input type="file" accept=".json" className="hidden" id="restore-input-mobile" onChange={handleRestore} />
            )}
            
            <div className="space-y-3">
              {/* Firebase Live Cloud Sync Status Badge - Admin Only */}
              {userRole === 'admin' && (
                <div 
                  onClick={() => setIsFirebaseStatusOpen(true)}
                  className={cn(
                    "rounded-2xl p-3 flex items-center justify-between border transition-all cursor-pointer hover:opacity-90 active:scale-[0.99]",
                    syncStatus === 'synced' && "bg-emerald-950/40 border-emerald-500/30",
                    syncStatus === 'saving' && "bg-sky-950/40 border-sky-500/30",
                    syncStatus === 'quota_exceeded' && "bg-amber-950/40 border-amber-500/30",
                    (syncStatus === 'offline' || syncStatus === 'error') && "bg-rose-950/40 border-rose-500/30"
                  )}
                  title="Firebase ve Senkronizasyon Durumunu İncele"
                >
                  <div className="flex items-center gap-2 min-w-0 mr-2">
                    {syncStatus === 'synced' && (
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                    {syncStatus === 'saving' && (
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-sky-400 border-t-transparent shrink-0"></span>
                    )}
                    {syncStatus === 'quota_exceeded' && (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shrink-0"></span>
                    )}
                    {(syncStatus === 'offline' || syncStatus === 'error') && (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-400 shrink-0"></span>
                    )}
                    <div className="min-w-0">
                      <p className={cn(
                        "text-xs font-bold truncate",
                        syncStatus === 'synced' && "text-emerald-300",
                        syncStatus === 'saving' && "text-sky-300",
                        syncStatus === 'quota_exceeded' && "text-amber-300",
                        (syncStatus === 'offline' || syncStatus === 'error') && "text-rose-300"
                      )}>
                        {syncStatus === 'synced' && "Canlı Bulut Senkronizasyonu"}
                        {syncStatus === 'saving' && "Buluta Kaydediliyor..."}
                        {syncStatus === 'quota_exceeded' && "Yerel Koruma (Bulut Kotası)"}
                        {syncStatus === 'offline' && "Çevrimdışı / Yerel Koruma"}
                        {syncStatus === 'error' && "Yerel Hafıza Koruması"}
                      </p>
                      <p className="text-[10px] text-white/60 truncate">
                        {saveFeedback || (syncStatus === 'quota_exceeded' ? "Veriler cihazınızda güvende" : "Tüm veriler anlık güvende")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSave();
                    }}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold border border-white/20 transition-colors cursor-pointer shrink-0"
                    title="Manuel Kaydet"
                  >
                    Şimdi Kaydet
                  </button>
                </div>
              )}

              {/* Yerel Çevrimdışı İndirme / Yükleme - Admin Only */}
              {userRole === 'admin' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-white/80">Tam Sistem Yedeği</p>
                    <span className="text-[9px] text-white/50">6 Modül Kapsamlı</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleBackup} 
                      className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium p-2.5 rounded-xl border border-white/10 transition-all active:scale-[0.99] text-center cursor-pointer"
                      title="Tüm Sistem Yedeğini İndir (Öğrenciler, Sınavlar, Sonuçlar, Arena, Salonlar, Bütçe)"
                    >
                      <DownloadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">Yedek İndir</span>
                    </button>

                    <button 
                      onClick={() => document.getElementById('restore-input-mobile')?.click()} 
                      className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium p-2.5 rounded-xl border border-white/10 transition-all active:scale-[0.99] text-center cursor-pointer"
                      title="Tam Sistem Yedeği Yükle (JSON formatındaki tüm okul verilerini geri yükler)"
                    >
                      <UploadCloud className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">Yedek Yükle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { setIsPWAOpen(true); closeMobileMenu(); }} 
                  className="flex items-center justify-center p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 active:scale-[0.98] border border-sky-500/30 text-sky-300 transition-all gap-2 text-center cursor-pointer font-bold text-xs"
                >
                  <HardDriveDownload className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Cihaza Yükle (PWA)</span>
                </button>

                <button 
                  onClick={() => { setIsVercelOpen(true); closeMobileMenu(); }} 
                  className="flex items-center justify-center p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 text-white transition-all gap-2 text-center cursor-pointer font-bold text-xs"
                >
                  <svg className="w-3.5 h-3.5 text-white fill-current shrink-0" viewBox="0 0 76 65">
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                  </svg>
                  <span>Vercel Canlı Link</span>
                </button>

                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="flex items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white transition-all gap-2 text-center cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-indigo-300 shrink-0" />}
                  <span className="text-xs font-semibold">{isDarkMode ? 'Aydınlık Tema' : 'Karanlık Tema'}</span>
                </button>

                {userRole === 'admin' && (
                  <button 
                    onClick={() => { setIsSettingsOpen(true); closeMobileMenu(); }} 
                    className="flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/20 transition-all active:scale-[0.99] gap-2 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Kullanıcı Yönetimi</span>
                  </button>
                )}
              </div>
            </div>

            {onLogout && (
              <button 
                onClick={onLogout} 
                className="flex items-center justify-center w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold py-3 px-4 rounded-2xl border border-red-500/20 transition-all gap-2 mt-1 active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4" /> Güvenli Çıkış Yap
              </button>
            )}
            
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
        
        {/* Sidebar Footer - Optimized and Restructured */}
        <div className="sidebar-footer mt-auto flex flex-col gap-2.5 w-full pt-4 border-t border-white/10">
          {userRole === 'admin' && (
            <input type="file" accept=".json" className="hidden" id="restore-input" onChange={handleRestore} />
          )}
          
          {/* Firebase Live Cloud Sync Indicator - Admin Only */}
          {userRole === 'admin' && (
            <div 
              onClick={() => setIsFirebaseStatusOpen(true)}
              className={cn(
                "flex items-center justify-between px-3 py-2 border rounded-xl text-[0.72rem] font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-[0.99]",
                syncStatus === 'synced' && "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
                syncStatus === 'saving' && "bg-sky-950/40 border-sky-500/30 text-sky-300",
                syncStatus === 'quota_exceeded' && "bg-amber-950/40 border-amber-500/30 text-amber-300",
                (syncStatus === 'offline' || syncStatus === 'error') && "bg-rose-950/40 border-rose-500/30 text-rose-300"
              )}
              title="Firebase ve Senkronizasyon Durumunu İncele"
            >
              <span className="flex items-center gap-2 truncate mr-1">
                {syncStatus === 'synced' && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                {syncStatus === 'saving' && (
                  <span className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-sky-400 border-t-transparent shrink-0"></span>
                )}
                {syncStatus === 'quota_exceeded' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shrink-0"></span>
                )}
                {(syncStatus === 'offline' || syncStatus === 'error') && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400 shrink-0"></span>
                )}
                <span className="truncate">
                  {syncStatus === 'synced' && "Bulut Senkronize"}
                  {syncStatus === 'saving' && "Kaydediliyor..."}
                  {syncStatus === 'quota_exceeded' && "Yerel Koruma"}
                  {syncStatus === 'offline' && "Çevrimdışı Mod"}
                  {syncStatus === 'error' && "Yerel Koruma"}
                </span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualSave();
                }}
                className="text-[0.65rem] text-white/80 hover:text-white hover:underline cursor-pointer font-bold shrink-0 ml-1"
                title="Manuel Kaydet"
              >
                Kaydet
              </button>
            </div>
          )}

          {/* JSON Backup & Restore Pair Buttons - Admin Only */}
          {userRole === 'admin' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] text-white/50 font-medium">Tam Sistem Yedeği</span>
                <span className="text-[9px] text-emerald-400/80 font-mono">6 Modül</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleBackup} 
                  className="flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white/80 hover:text-white text-[0.72rem] font-medium py-2 px-2.5 rounded-xl border border-white/10 transition-all cursor-pointer gap-1.5 truncate"
                  title="Tüm Sistem Yedeğini İndir (Öğrenciler, Sınavlar, Sonuçlar, Akademi Arena, Salonlar, Bütçe)"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Yedek İndir</span>
                </button>
                <button 
                  onClick={() => document.getElementById('restore-input')?.click()} 
                  className="flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white/80 hover:text-white text-[0.72rem] font-medium py-2 px-2.5 rounded-xl border border-white/10 transition-all cursor-pointer gap-1.5 truncate"
                  title="Tam Sistem Yedeği Yükle (Öğrenci, sınav, sonuç, arena, salon ve bütçe verilerini geri yükler)"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Yedek Yükle</span>
                </button>
              </div>
            </div>
          )}
          
          {/* PWA Install & Vercel Live Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setIsPWAOpen(true)} 
              className="flex items-center justify-center bg-sky-500/10 hover:bg-sky-500/20 active:scale-[0.98] text-sky-300 text-[0.72rem] font-bold py-2 px-2 rounded-xl border border-sky-500/20 transition-all cursor-pointer gap-1.5 truncate"
              title="Masaüstü veya Mobil Cihazınıza Yükleyin (PWA)"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Cihaza Yükle</span>
            </button>

            <button 
              onClick={() => setIsVercelOpen(true)} 
              className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white text-[0.72rem] font-bold py-2 px-2 rounded-xl border border-slate-700 transition-all cursor-pointer gap-1.5 truncate"
              title="Vercel Canlı Yayın Bağlantısını Aç"
            >
              <svg className="w-3 h-3 text-white fill-current shrink-0" viewBox="0 0 76 65">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
              <span className="truncate">Vercel Link</span>
            </button>
          </div>

          {/* Admin User Management Button */}
          {userRole === 'admin' && (
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="flex items-center justify-center w-full bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[0.75rem] font-bold py-2.5 px-3 rounded-xl border border-emerald-500/20 transition-all cursor-pointer gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kullanıcı & Yetki Yönetimi</span>
            </button>
          )}

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
              <span className="text-[11px] text-white/70 truncate" title={currentUser?.email || ''}>{currentUser?.email || 'Kullanıcı'}</span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout} 
                className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all cursor-pointer shrink-0"
                title="Çıkış Yap"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="pt-1 text-center">
            <p className="text-[9px] text-white/30 tracking-wider">
              Powered by Kumcu
            </p>
          </div>
        </div>
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <FirebaseStatusModal isOpen={isFirebaseStatusOpen} onClose={() => setIsFirebaseStatusOpen(false)} />
      <VercelModal isOpen={isVercelOpen} onClose={() => setIsVercelOpen(false)} />
      <PWAInstallModal isOpen={isPWAOpen} onClose={() => setIsPWAOpen(false)} />
      
      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col overflow-auto bg-brand-bg transition-all duration-300 w-full pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0", isDarkMode ? "dark-mode-main" : "")}>
        
        {/* Mobile Header - Modern Elevated Glassmorphism */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2 bg-[#151618]/95 backdrop-blur-xl text-white border-b border-white/10 shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-accent to-[#e2c18d] flex items-center justify-center shadow-xs">
              <span className="font-serif italic font-bold text-white text-sm">A</span>
            </div>
            <div>
              <h1 className="font-serif text-sm italic font-bold tracking-tight text-white leading-none">AkademiPanel</h1>
              {(() => {
                const current = navItems.find(i => i.id === activeTab);
                return current ? (
                  <span className={cn("text-[9px] font-semibold tracking-wide flex items-center gap-1 mt-0.5", current.colorClass)}>
                    {current.label}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsPWAOpen(true)} 
              aria-label="Cihaza Yükle"
              title="Masaüstü/Mobil Cihaza Yükle"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 text-sky-400 border border-sky-500/20 transition-all cursor-pointer"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsVercelOpen(true)} 
              aria-label="Vercel Canlı Link"
              title="Vercel Canlı Yayın Linki"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 transition-all cursor-pointer"
            >
              <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 76 65">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              aria-label="Temayı Değiştir"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 border border-white/10 transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              aria-label="Seçenekler"
              className="flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white border border-white/10 transition-all"
            >
              <div className="w-4.5 h-4.5 rounded-full bg-brand-accent/30 text-brand-accent flex items-center justify-center text-[9px] font-bold">
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <Settings className="w-3 h-3" />}
              </div>
              <Settings className="w-3 h-3 text-white/70" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-2.5 sm:p-5 md:p-10 w-full max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Modern Floating Curved Glass Bar */}
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


