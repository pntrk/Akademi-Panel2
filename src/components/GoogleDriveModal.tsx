import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Calendar, 
  FileText, 
  HardDrive, 
  ShieldCheck, 
  Loader2, 
  Smartphone, 
  Laptop, 
  Share2, 
  Copy, 
  ExternalLink, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { 
  getAccessToken,
  saveBackupToDrive, 
  listDriveBackups, 
  getDriveBackupContent, 
  deleteDriveBackup,
  getDeviceType,
  getAutoSyncEnabled,
  setAutoSyncEnabled,
  getLastSyncTime,
  setStoredAccessToken,
  clearStoredAccessToken,
  fetchGoogleUserInfo,
  googleSignOut
} from '../lib/googleDrive';
import { DriveBackupFile, FullBackupData } from '../types';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const { state, restoreBackup } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'drive' | 'share' | 'guide'>('drive');
  const [user, setUser] = useState<{ email: string; name: string; picture: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const [driveFiles, setDriveFiles] = useState<DriveBackupFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [activeFileActionId, setActiveFileActionId] = useState<string | null>(null);
  
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<DriveBackupFile | null>(null);
  const [restoreConfirmFile, setRestoreConfirmFile] = useState<DriveBackupFile | null>(null);

  const device = getDeviceType();

  const handleGoogleLoginSuccess = async (tokenResponse: any) => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const accessToken = tokenResponse.access_token;
      setStoredAccessToken(accessToken);
      
      const userInfo = await fetchGoogleUserInfo(accessToken);
      if (userInfo) {
        setUser(userInfo);
        setIsAuthenticated(true);
        setFeedback({ type: 'success', message: `Google hesabı (${userInfo.email}) ile başarıyla bağlandı.` });
        await loadFiles();
      } else {
        throw new Error("Kullanıcı bilgileri alınamadı.");
      }
    } catch (err: any) {
      console.error('Sign in process error:', err);
      setFeedback({ type: 'error', message: 'Giriş yapılamadı: ' + (err.message || 'Bilinmeyen hata') });
    } finally {
      setIsSigningIn(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: (error) => {
      console.error('Google Sign In Error:', error);
      setFeedback({ type: 'error', message: 'Giriş yapılamadı.' });
    },
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
  });

  // Initialize Auth state listener
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingAuth(true);

    // Initial check for in-memory / stored token
    getAccessToken().then(async token => {
      if (token) {
        const userInfo = await fetchGoogleUserInfo(token);
        if (userInfo) {
          setUser(userInfo);
          setIsAuthenticated(true);
          loadFiles();
        } else {
          clearStoredAccessToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

  }, [isOpen]);

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listDriveBackups();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Drive files load error:', err);
      // Only set error if not auth-related error
      if (!err.message?.includes('bağlantısı')) {
        setFeedback({ type: 'error', message: 'Drive dosyaları listelenirken hata: ' + (err.message || 'Bilinmeyen hata') });
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'akademi-panel2-nop7.vercel.app';

  const handleSignIn = () => {
    setFeedback(null);
    login();
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setIsAuthenticated(false);
      setDriveFiles([]);
      setFeedback({ type: 'info', message: 'Google oturumu kapatıldı.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Çıkış yapılırken hata: ' + err.message });
    }
  };

  const createBackupObject = (): FullBackupData => {
    return {
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
  };

  const handleSaveToDrive = async () => {
    setIsSavingToDrive(true);
    setFeedback(null);
    try {
      const backupData = createBackupObject();
      const now = new Date();
      const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
      const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
      const deviceTag = device === 'Telefon' ? 'Telefon' : device === 'Tablet' ? 'Tablet' : 'PC';
      const filename = `AkademiPanel_Yedek_${dateStr}_${timeStr}_(${deviceTag}).json`;

      const savedFile = await saveBackupToDrive(backupData, filename);
      setFeedback({ 
        type: 'success', 
        message: `Yedek (${deviceTag}) Google Drive'a başarıyla yüklendi! (${savedFile.name})` 
      });
      await loadFiles();
    } catch (err: any) {
      console.error('Save to Drive error:', err);
      setFeedback({ type: 'error', message: 'Google Drive yedekleme başarısız: ' + (err.message || 'Bilinmeyen hata') });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleExecuteRestore = async (file: DriveBackupFile) => {
    setActiveFileActionId(file.id);
    setRestoreConfirmFile(null);
    setFeedback(null);
    try {
      const content = await getDriveBackupContent(file.id);
      const res = await restoreBackup(content);
      if (res.success && res.summary) {
        setFeedback({ 
          type: 'success', 
          message: `Google Drive yedeği başarıyla geri yüklendi! (${res.summary.studentCount} Öğrenci, ${res.summary.examCount} Sınav, ${res.summary.resultCount} Sonuç)` 
        });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Yedek dosyası verisi doğrulanamadı.' });
      }
    } catch (err: any) {
      console.error('Restore from Drive error:', err);
      setFeedback({ type: 'error', message: 'Drive yedeği geri yüklenemedi: ' + (err.message || 'Bilinmeyen hata') });
    } finally {
      setActiveFileActionId(null);
    }
  };

  const handleExecuteDelete = async (file: DriveBackupFile) => {
    setActiveFileActionId(file.id);
    setDeleteConfirmFile(null);
    setFeedback(null);
    try {
      await deleteDriveBackup(file.id);
      setFeedback({ type: 'success', message: `"${file.name}" dosyası Google Drive'dan silindi.` });
      setDriveFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err: any) {
      console.error('Delete from Drive error:', err);
      setFeedback({ type: 'error', message: 'Drive dosyası silinemedi: ' + (err.message || 'Bilinmeyen hata') });
    } finally {
      setActiveFileActionId(null);
    }
  };

  const handleShareDirectly = async () => {
    const backupData = createBackupObject();
    const stateStr = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AkademiPanel_Tam_Yedek_${dateStr}.json`;
    const blob = new Blob([stateStr], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Akademi Panel Sistem Yedeği',
          text: `Akademi Panel Tam Sistem Yedeği (${state.students?.length || 0} Öğrenci, ${state.exams?.length || 0} Sınav)`
        });
        setFeedback({ type: 'success', message: 'Yedek dosyası başarıyla paylaşıldı!' });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          downloadFileFallback(blob, filename);
        }
      }
    } else {
      downloadFileFallback(blob, filename);
    }
  };

  const downloadFileFallback = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', message: 'Yedek JSON dosyası cihaza indirildi.' });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div 
        className="bg-white rounded-t-[28px] sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto border border-[#e6e2d3] flex flex-col animate-slide-up sm:animate-none pb-safe sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e6e2d3] bg-[#fcfbf7] rounded-t-[28px] sm:rounded-t-2xl sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#2d2d2a] flex items-center gap-2">
                  Bulut & Cihazlar Arası Yedekleme
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d82]">
                  {device === 'Telefon' ? (
                    <span className="flex items-center gap-1 text-blue-700 bg-blue-50 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                      <Smartphone className="w-3 h-3" /> Mobil Cihaz (Telefon)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-700 bg-slate-100 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                      <Laptop className="w-3 h-3" /> Masaüstü (Bilgisayar)
                    </span>
                  )}
                  <span>• Okul Veri Senkronizasyonu</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-[#8e8d82] hover:bg-[#e6e2d3] rounded-full transition-colors active:scale-95 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'drive' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Drive</span>
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'share' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Hızlı Aktarım (WhatsApp / JSON)</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'guide' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Kullanım Rehberi</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          
          {/* Feedback Alert */}
          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex flex-col gap-2 transition-all animate-fade-in border ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              feedback.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <div className="flex items-start gap-2.5">
                {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                {feedback.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                <span className="flex-1">{feedback.message}</span>
                <button onClick={() => setFeedback(null)} className="text-current opacity-60 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Re-auth Button if permission/scope error */}
              {feedback.type === 'error' && feedback.message?.includes('yetki') && (
                <div className="mt-1 pt-2 border-t border-red-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSignIn()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Drive İzinlerini Onayla & Tekrar Giriş Yap</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Destructive Confirm Dialog (Delete) */}
          {deleteConfirmFile && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <h4 className="font-bold text-sm">Yedeği Google Drive'dan Sil</h4>
              </div>
              <p className="text-xs text-red-800">
                <strong>"{deleteConfirmFile.name}"</strong> dosyasını Google Drive hesabınızdan kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmFile(null)}
                  className="px-3 py-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteDelete(deleteConfirmFile)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          )}

          {/* Confirm Dialog (Restore) */}
          {restoreConfirmFile && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <h4 className="font-bold text-sm">Drive Yedeğini Bu Cihaza Yükle</h4>
              </div>
              <p className="text-xs text-amber-800">
                <strong>"{restoreConfirmFile.name}"</strong> yedeğindeki veriler bu cihazdaki mevcut öğrenci, sınav, sonuç ve bütçe kayıtlarının yerine yüklenecektir. Devam etmek istiyor musunuz?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRestoreConfirmFile(null)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteRestore(restoreConfirmFile)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Yedeği Yükle
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {/* Authentication State Card */}
              {isLoadingAuth ? (
                <div className="p-6 rounded-2xl bg-gray-50 border border-[#e6e2d3] flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Google bağlantı durumu kontrol ediliyor...</span>
                </div>
              ) : !isAuthenticated ? (
                <div className="p-6 rounded-2xl bg-[#F8F7F4] border border-[#e6e2d3] flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <HardDrive className="w-7 h-7" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="font-bold text-base text-[#2d2d2a] mb-1">Google Hesabınızı Bağlayın</h3>
                    <p className="text-xs text-[#6e6e66] leading-relaxed">
                      Okul bilgisayarınızda sınav verilerini girdiğinizde <strong>"Google Drive'a Yedekle"</strong> butonuna basın; ardından evde veya telefonunuzda açtığınızda tek tıkla en son yedeği yükleyin.
                    </p>
                  </div>

                  {/* Official Standard Sign in with Google Button */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center max-w-md">
                    <button 
                      type="button"
                      onClick={() => handleSignIn()}
                      disabled={isSigningIn}
                      className="w-full sm:flex-1 flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl border border-gray-300 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSigningIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Bağlanıyor...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          </svg>
                          <span>Google ile Giriş Yap</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Yalnızca bu uygulama tarafından oluşturulan yedek dosyalarına erişilir.</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {user?.picture ? (
                        <img src={user.picture} alt={user.name || 'Google'} className="w-10 h-10 rounded-full border border-blue-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                          {(user?.name || user?.email || 'G').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-gray-900">{user?.name || 'Google Hesabı'}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">Bağlı</span>
                        </div>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={handleSaveToDrive}
                        disabled={isSavingToDrive}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingToDrive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CloudUpload className="w-4 h-4" />
                        )}
                        <span>{device === 'Telefon' ? "Telefondan Drive'a Yedekle" : "PC'den Drive'a Yedekle"}</span>
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Google Oturumunu Kapat"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Automatic Cloud Sync Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-emerald-950">Otomatik Arka Plan Senkronizasyonu</span>
                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">Önerilen</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Öğrenci veya sınav kaydı yaptığınızda Drive'a otomatik olarak sessizce yedeklenir.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
                      <input 
                        type="checkbox" 
                        checked={getAutoSyncEnabled()} 
                        onChange={(e) => {
                          setAutoSyncEnabled(e.target.checked);
                          setFeedback({
                            type: 'success',
                            message: e.target.checked 
                              ? 'Otomatik Drive senkronizasyonu açıldı! Yapılan değişiklikler Google Drive\'a arka planda kaydedilecek.' 
                              : 'Otomatik senkronizasyon kapatıldı. Manuel yedekleme yapabilirsiniz.'
                          });
                        }} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs font-bold text-emerald-900">
                        {getAutoSyncEnabled() ? 'Açık' : 'Kapalı'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Drive Backups List */}
              {isAuthenticated && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-sm text-[#2d2d2a]">Drive'daki Bulut Yedekleriniz</h3>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                        {driveFiles.length}
                      </span>
                    </div>

                    <button
                      onClick={loadFiles}
                      disabled={isLoadingFiles}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium p-1 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Listeyi Yenile"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                      <span>Yenile</span>
                    </button>
                  </div>

                  {isLoadingFiles ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Google Drive yedekleri taranıyor...</p>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                      <Cloud className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-xs font-medium text-gray-600">Henüz Google Drive'da kayıtlı bir sistem yedeği bulunamadı.</p>
                      <p className="text-[11px] text-gray-400">Yukarıdaki butona tıklayarak ilk yedeğinizi buluta kaydedebilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {driveFiles.map((file) => {
                        const isProcessing = activeFileActionId === file.id;
                        const isPC = file.name.includes('(PC)') || file.name.includes('PC');
                        const isPhone = file.name.includes('(Telefon)') || file.name.includes('Telefon');

                        return (
                          <div 
                            key={file.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white hover:bg-[#F8F7F4] border border-[#e6e2d3] rounded-xl gap-2 transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                {isPhone ? <Smartphone className="w-4 h-4 text-purple-600" /> : <Laptop className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-gray-900 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                  {isPhone && (
                                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                                      📱 Telefon
                                    </span>
                                  )}
                                  {isPC && (
                                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                      💻 PC
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(file.modifiedTime || file.createdTime)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => setRestoreConfirmFile(file)}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                                title="Bu yedeği mevcut cihaza yükle"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CloudDownload className="w-3.5 h-3.5" />
                                )}
                                <span>Bu Cihaza Yükle</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirmFile(file)}
                                disabled={isProcessing}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Google Drive'dan Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUICK SHARE (WHATSAPP / DIRECT JSON) */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Share2 className="w-4 h-4" />
                  <span>Cihazlar Arası Doğrudan Dosya Aktarımı</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Google hesabı olmadan da bilgisayar ve telefonunuz arasında yedek dosyasını WhatsApp, AirDrop, E-posta veya Bluetooth üzerinden aktarabilirsiniz.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleShareDirectly}
                    className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Yedeği Paylaş / İndir (JSON)</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-gray-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center">
                    <CloudUpload className="w-4 h-4 text-emerald-600" />
                    <span>Dosyadan Geri Yükle</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            try {
                              const content = JSON.parse(ev.target?.result as string);
                              const res = await restoreBackup(content);
                              if (res.success && res.summary) {
                                setFeedback({ 
                                  type: 'success', 
                                  message: `Yedek yüklendi! (${res.summary.studentCount} Öğrenci, ${res.summary.examCount} Sınav)` 
                                });
                              } else {
                                setFeedback({ type: 'error', message: res.message || 'Hata' });
                              }
                            } catch {
                              setFeedback({ type: 'error', message: 'Geçersiz JSON dosyası' });
                            }
                          };
                          reader.readAsText(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Current Data Summary Card */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 mb-2">Mevcut Cihazdaki Veri Özeti:</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg font-bold text-blue-600">{state.students?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Öğrenci</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg font-bold text-indigo-600">{state.exams?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Deneme Sınavı</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg font-bold text-emerald-600">{state.results?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Sınav Sonucu</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUIDE & VERCEL INSTRUCTIONS */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-gray-700">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Telefon ve Bilgisayarı Nasıl Eşitlersiniz?</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700 leading-relaxed">
                  <li><strong>Okul Bilgisayarında:</strong> Sınavları veya öğrencileri girdikten sonra <em>Google Drive Yedek</em> butonuna basıp <strong>"PC'den Drive'a Yedekle"</strong> butonuna tıklayın.</li>
                  <li><strong>Telefonunuzda:</strong> <code>{currentHost}</code> adresini açın, aynı Google hesabınızla giriş yapın.</li>
                  <li><strong>Listeden Yükleyin:</strong> Listede beliren en son <em>(PC)</em> yedeğinin yanındaki <strong>"Bu Cihaza Yükle"</strong> butonuna dokunun. Tüm veriler telefonunuza aktarılır!</li>
                  <li><strong>Telefonda Değişiklik Yaparsanız:</strong> Tekrar <strong>"Telefondan Drive'a Yedekle"</strong> butonuna basıp bilgisayarınızdan aynı şekilde yükleyebilirsiniz.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#e6e2d3] bg-[#fcfbf7] rounded-b-[28px] sm:rounded-b-2xl flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Akademi Panel Bulut Senkronizasyonu v2.0</span>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
