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
  Loader2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken,
  saveBackupToDrive, 
  listDriveBackups, 
  getDriveBackupContent, 
  deleteDriveBackup 
} from '../lib/googleDrive';
import { DriveBackupFile, FullBackupData } from '../types';
import { User } from 'firebase/auth';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const { state, restoreBackup } = useAppContext();
  
  const [user, setUser] = useState<User | null>(null);
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

  // Initialize Auth state listener
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingAuth(true);
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        loadFiles();
      },
      () => {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setDriveFiles([]);
      }
    );

    // Initial check for in-memory token
    getAccessToken().then(token => {
      if (token) {
        setIsAuthenticated(true);
        loadFiles();
      }
      setIsLoadingAuth(false);
    });

    return () => {
      unsubscribe();
    };
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

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setIsAuthenticated(true);
        setFeedback({ type: 'success', message: `Google hesabı (${result.user.email}) ile başarıyla bağlandı.` });
        await loadFiles();
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setFeedback({ type: 'info', message: 'Giriş penceresi kapatıldı.' });
      } else if (err.code === 'auth/unauthorized-domain') {
        setFeedback({ 
          type: 'error', 
          message: 'Bu alan adı Google OAuth izin listesinde henüz onaylı değil. Lütfen Vercel veya özel alan adınızı Google Cloud konsoluna ekleyin.' 
        });
      } else {
        setFeedback({ type: 'error', message: 'Giriş yapılamadı: ' + (err.message || 'Bilinmeyen hata') });
      }
    } finally {
      setIsSigningIn(false);
    }
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

  const handleSaveToDrive = async () => {
    setIsSavingToDrive(true);
    setFeedback(null);
    try {
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

      const now = new Date();
      const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
      const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
      const filename = `AkademiPanel_Yedek_${dateStr}_${timeStr}.json`;

      const savedFile = await saveBackupToDrive(backupData, filename);
      setFeedback({ 
        type: 'success', 
        message: `Yedek Google Drive'a başarıyla yüklendi! (${savedFile.name})` 
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
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e6e2d3] bg-[#fcfbf7] rounded-t-[28px] sm:rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#2d2d2a] flex items-center gap-2">
                Google Drive Senkronizasyonu
              </h2>
              <p className="text-xs text-[#8e8d82]">Tüm okul verilerini Google Drive üzerinde güvenle saklayın</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#8e8d82] hover:bg-[#e6e2d3] rounded-full transition-colors active:scale-95 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          
          {/* Feedback Alert */}
          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5 transition-all animate-fade-in border ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              feedback.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {feedback.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <span className="flex-1">{feedback.message}</span>
              <button onClick={() => setFeedback(null)} className="text-current opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
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
                <h4 className="font-bold text-sm">Drive Yedeğini Geri Yükle</h4>
              </div>
              <p className="text-xs text-amber-800">
                <strong>"{restoreConfirmFile.name}"</strong> yedeğindeki veriler mevcut sistemdeki tüm öğrenci, sınav, sonuç ve bütçe kayıtlarının yerine yüklenecektir. Devam etmek istiyor musunuz?
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
                  Sistem yedeklerinizi kendi Google Drive alanınıza tek tıkla yükleyebilir, istediğiniz cihazdan tek tıkla geri yükleyebilirsiniz.
                </p>
              </div>

              {/* Official Standard Sign in with Google Button */}
              <button 
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl border border-gray-300 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Bağlanıyor...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Google ile Giriş Yap</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Yalnızca bu uygulama tarafından oluşturulan yedek dosyalarına erişilir.</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Google'} className="w-10 h-10 rounded-full border border-blue-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                    {(user?.displayName || user?.email || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-gray-900">{user?.displayName || 'Google Kullanıcısı'}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">Bağlı</span>
                  </div>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSaveToDrive}
                  disabled={isSavingToDrive}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingToDrive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}
                  <span>Google Drive'a Yedekle</span>
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
          )}

          {/* Drive Backups List */}
          {isAuthenticated && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-[#2d2d2a]">Google Drive'daki Yedek Dosyalarınız</h3>
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
                  <p className="text-[11px] text-gray-400">Yukarıdaki <strong>"Google Drive'a Yedekle"</strong> butonuna tıklayarak ilk yedeğinizi buluta kaydedebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {driveFiles.map((file) => {
                    const isProcessing = activeFileActionId === file.id;
                    return (
                      <div 
                        key={file.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white hover:bg-[#F8F7F4] border border-[#e6e2d3] rounded-xl gap-2 transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
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
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Bu yedeği sisteme yükle"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CloudDownload className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>Geri Yükle</span>
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

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#e6e2d3] bg-[#fcfbf7] rounded-b-[28px] sm:rounded-b-2xl flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Google Drive API v3 • Güvenli Bulut Yedekleme</span>
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
