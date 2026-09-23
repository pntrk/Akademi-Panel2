/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { StudentsView } from './views/StudentsView';
import { ExamsView } from './views/ExamsView';
import { ResultsView } from './views/ResultsView';
import { BudgetView } from './views/BudgetView';
import { HallsView } from './views/HallsView';
import { LeagueView } from './views/LeagueView';
import { auth, loginWithGoogle, logout, firebaseConfig } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, Lock, Copy, Check, ExternalLink, ShieldCheck, Sparkles, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAppContext } from './context/AppContext';

export const createSyntheticUser = (email: string, displayName?: string): User => {
  const uid = 'preview_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
  return {
    uid,
    email,
    displayName: displayName || (email.includes('@') ? email.split('@')[0] : 'Kullanıcı'),
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [
      {
        providerId: 'google.com',
        uid,
        displayName: displayName || email.split('@')[0],
        email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    refreshToken: 'preview-token',
    tenantId: null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
    delete: async () => {},
    getIdToken: async () => 'preview-id-token',
    getIdTokenResult: async () => ({
      token: 'preview-id-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'google.com',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({ uid, email, displayName }),
  } as unknown as User;
};

function AppContent({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { userRole, checkAndRefreshRole } = useAppContext();
  const [activeTab, setActiveTab] = useState<'students' | 'exams' | 'results' | 'league' | 'budget' | 'halls'>(
    userRole === 'admin' ? 'students' : 'results'
  );
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-refresh role every 4 seconds if in guest mode
  useEffect(() => {
    if (userRole === 'guest') {
      const interval = setInterval(() => {
        checkAndRefreshRole().catch(() => {});
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [userRole, checkAndRefreshRole]);

  // Enforce role restrictions: If teacher tries to view unauthorized tabs, redirect to 'results'
  useEffect(() => {
    if (userRole === 'teacher' && !['results', 'league'].includes(activeTab)) {
      setActiveTab('results');
    }
  }, [userRole, activeTab]);

  if (userRole === 'guest') {
    const handleCheckStatus = async () => {
      setIsCheckingRole(true);
      setStatusMessage(null);
      try {
        const newRole = await checkAndRefreshRole();
        if (newRole === 'guest') {
          setStatusMessage('Yönetici tarafından henüz yetki tanımlanmadı. Lütfen yöneticinizin onaylamasını bekleyiniz.');
        }
      } catch (e) {
        setStatusMessage('Yetki kontrolü sırasında bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
      } finally {
        setTimeout(() => setIsCheckingRole(false), 600);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] p-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-[#e6e2d3] animate-fade-in relative overflow-hidden">
          {/* Top Decorative Amber Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-[#B08D57] to-amber-500"></div>

          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-600 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Yönetici Onayı Bekleniyor
          </span>

          <h1 className="text-2xl font-serif font-bold text-[#5a5a40] mb-2">Erişim İsteğiniz Alındı</h1>
          
          <div className="my-5 p-4 bg-[#fcfbf7] rounded-2xl border border-[#e6e2d3] text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8e8d82] mb-1">Giriş Yapılan Hesap</p>
            <p className="text-sm font-bold text-[#5a5a40] truncate">{user.displayName || 'Kullanıcı'}</p>
            <p className="text-xs font-medium text-[#8e8d82] truncate font-mono">{user.email}</p>
          </div>

          <p className="text-[#8e8d82] text-xs leading-relaxed mb-4">
            E-posta adresiniz sisteme başarıyla kaydedildi. Okul yöneticiniz <strong className="text-[#5a5a40]">Kullanıcı Yetki Yönetimi</strong> panelinden hesabınıza <strong className="text-blue-700">Öğretmen</strong> veya <strong className="text-emerald-700">İdareci</strong> yetkisi tanımladığında, bu sayfa otomatik olarak açılacaktır.
          </p>

          {statusMessage && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-medium animate-fade-in">
              {statusMessage}
            </div>
          )}

          <div className="space-y-2.5">
            <button
              onClick={handleCheckStatus}
              disabled={isCheckingRole}
              className="w-full bg-[#B08D57] hover:bg-[#c4a46e] active:scale-[0.99] text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isCheckingRole ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Yetki Durumu Kontrol Ediliyor...
                </>
              ) : (
                'Onay Durumunu Yenile'
              )}
            </button>

            <button
              onClick={onLogout}
              className="w-full bg-transparent hover:bg-gray-100 text-[#8e8d82] hover:text-[#5a5a40] py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Farklı Bir Hesapla Giriş Yap / Çıkış
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab as (tab: string) => void} onLogout={onLogout} currentUser={user}>
      {activeTab === 'students' && userRole === 'admin' && <StudentsView />}
      {activeTab === 'exams' && userRole === 'admin' && <ExamsView />}
      {activeTab === 'results' && <ResultsView />}
      {activeTab === 'league' && <LeagueView />}
      {activeTab === 'budget' && userRole === 'admin' && <BudgetView />}
      {activeTab === 'halls' && userRole === 'admin' && <HallsView />}
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('akademi_preview_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setUser(createSyntheticUser(parsed.email, parsed.displayName));
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCopyDomain = async (domainToCopy: string) => {
    try {
      await navigator.clipboard.writeText(domainToCopy);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    setUnauthorizedDomain(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn("Login attempt result:", err);
      if (err?.code === 'auth/unauthorized-domain') {
        const hostname = window.location.hostname;
        setUnauthorizedDomain(hostname);
        setLoginError(`Bu alan adı (${hostname}) Firebase projesinin yetkilendirilmiş alan adları listesinde bulunamadı.`);
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setLoginError('Giriş penceresi kapatıldı. Lütfen tekrar deneyiniz.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setLoginError(err?.message || 'Google ile giriş yapılamadı.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePreviewLogin = (email: string, displayName: string) => {
    const syntheticUser = createSyntheticUser(email, displayName);
    try {
      sessionStorage.setItem('akademi_preview_user', JSON.stringify({ email, displayName }));
    } catch (e) {}
    setUser(syntheticUser);
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('akademi_preview_user');
    } catch (e) {}
    setUser(null);
    await logout().catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#B08D57] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    const currentHostname = window.location.hostname;
    const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] p-4 font-sans">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-lg w-full text-center border border-[#e6e2d3] relative overflow-hidden">
          {/* Top Decorative Amber Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-[#B08D57] to-amber-500"></div>

          <div className="mb-4">
            <h1 className="text-3xl font-serif font-bold text-[#5a5a40] tracking-tight italic">AkademiPanel</h1>
            <p className="text-[#8e8d82] text-xs font-semibold mt-1">Ölçme ve Değerlendirme Yönetim Sistemi</p>
          </div>

          {/* Unauthorized Domain Diagnostic Guide */}
          {unauthorizedDomain && (
            <div className="mb-6 p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl text-left animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Yetkisiz Alan Adı (auth/unauthorized-domain)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                Firebase güvenlik kuralı nedeniyle uygulamanın çalıştığı bu önizleme adresi Firebase Authentication ayarlarında izinli alan adlarına eklenmelidir:
              </p>

              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-amber-200 mb-3 shadow-inner">
                <span className="font-mono text-[11px] text-gray-800 truncate select-all px-1">
                  {unauthorizedDomain}
                </span>
                <button
                  onClick={() => handleCopyDomain(unauthorizedDomain)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B08D57] hover:bg-[#9a7b4a] active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Kopyalandı!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Kopyala
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-amber-900/90 mb-3">
                <p className="font-semibold text-amber-950">Nasıl Çözülür? (3 Adım):</p>
                <div className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Aşağıdaki butondan Firebase Console'u yeni sekmede açın.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <span><strong>Authorized domains</strong> listesinde <strong>Add domain</strong>'e tıklayıp kopyaladığınız adresi yapıştırın.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <span>Bu sayfaya dönüp <strong>Google ile Giriş Yap</strong> butonuna tekrar tıklayın.</span>
                </div>
              </div>

              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm mb-4"
              >
                <ExternalLink className="w-4 h-4" />
                Firebase Console &gt; Authorized Domains Aç
              </a>

              {/* Instant Bypass in Diagnostic Card */}
              <div className="pt-3 border-t border-amber-200/80">
                <p className="text-[11px] font-bold text-[#5a5a40] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Veya Alan Adını Ekleyene Kadar Hemen İnceleyin:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePreviewLogin('kirklareliataturkortaokulu@gmail.com', 'Kırklareli Atatürk Ortaokulu (Yönetici)')}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#B08D57] hover:bg-[#9a7b4a] active:scale-[0.98] text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Yönetici Olarak Aç
                  </button>
                  <button
                    onClick={() => handlePreviewLogin('ogretmen@ataturkortaokulu.meb.k12.tr', 'Öğretmen Hesabı')}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 active:scale-[0.98] text-white py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    👨‍🏫 Öğretmen Olarak Aç
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Login Error Box (if not unauthorized domain) */}
          {loginError && !unauthorizedDomain && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 text-left leading-relaxed animate-fade-in">
              <span className="font-bold block mb-1">⚠️ Giriş Hatası:</span>
              <span>{loginError}</span>
            </div>
          )}

          {/* Main Google Login Action */}
          <div className="space-y-3 mb-5">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2.5 bg-[#B08D57] hover:bg-[#c4a46e] active:scale-[0.98] text-white py-3.5 px-4 rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-5 h-5" />
              {isLoggingIn ? 'Google Girişi Açılıyor...' : 'Google ile Giriş Yap'}
            </button>
            <p className="text-[11px] text-[#8e8d82]">
              Verileriniz bulutta güvenle saklanır ve cihazlar arasında senkronize edilir.
            </p>
          </div>

          {/* Quick Preview / Developer Access Accordion */}
          <div className="pt-4 border-t border-[#e6e2d3]">
            <button
              onClick={() => setShowDemoOptions(!showDemoOptions)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#8e8d82] hover:text-[#5a5a40] py-1 px-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#B08D57]" />
                Önizleme / Demo Modu ile Hızlı Giriş
              </span>
              {showDemoOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoOptions && (
              <div className="mt-3 p-3.5 bg-[#fcfbf7] border border-[#e6e2d3] rounded-2xl space-y-2.5 animate-fade-in text-left">
                <p className="text-[11px] text-[#8e8d82] leading-relaxed">
                  Geliştirme ve inceleme ortamında Google yetkilendirmesi beklemeden tüm modülleri doğrudan deneyimleyebilirsiniz:
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handlePreviewLogin('kirklareliataturkortaokulu@gmail.com', 'Kırklareli Atatürk Ortaokulu (Yönetici)')}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Süper Yönetici Olarak Başlat (Tüm Modüller Açık)
                  </button>
                  <button
                    onClick={() => handlePreviewLogin('ogretmen@ataturkortaokulu.meb.k12.tr', 'Öğretmen Hesabı')}
                    className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    👨‍🏫 Öğretmen Olarak Başlat (Sonuçlar ve Arena)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppProvider user={user}>
      <AppContent user={user} onLogout={handleLogout} />
    </AppProvider>
  );
}
