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
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, Lock } from 'lucide-react';
import { useAppContext } from './context/AppContext';

function AppContent({ user }: { user: User }) {
  const { userRole, retrySync } = useAppContext();
  const [activeTab, setActiveTab] = useState<'students' | 'exams' | 'results' | 'league' | 'budget' | 'halls'>(
    userRole === 'admin' ? 'students' : 'results'
  );
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  // Enforce role restrictions: If teacher tries to view unauthorized tabs, redirect to 'results'
  useEffect(() => {
    if (userRole === 'teacher' && !['results', 'league'].includes(activeTab)) {
      setActiveTab('results');
    }
  }, [userRole, activeTab]);

  if (userRole === 'guest') {
    const handleCheckStatus = async () => {
      setIsCheckingRole(true);
      try {
        await retrySync();
      } catch (e) {}
      setTimeout(() => setIsCheckingRole(false), 1000);
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

          <p className="text-[#8e8d82] text-xs leading-relaxed mb-6">
            E-posta adresiniz sisteme başarıyla kaydedildi. Okul yöneticiniz <strong className="text-[#5a5a40]">Kullanıcı Yetki Yönetimi</strong> panelinden hesabınıza <strong className="text-blue-700">Öğretmen</strong> veya <strong className="text-emerald-700">İdareci</strong> yetkisi tanımladığında, bu sayfa otomatik olarak açılacaktır.
          </p>

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
              onClick={logout}
              className="w-full bg-transparent hover:bg-gray-100 text-[#8e8d82] hover:text-[#5a5a40] py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors"
            >
              Farklı Bir Hesapla Giriş Yap / Çıkış
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab as (tab: string) => void} onLogout={logout}>
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login error details:", err);
      if (err?.code === 'auth/unauthorized-domain') {
        const hostname = window.location.hostname;
        setLoginError(`Yetkisiz Alan Adı (${hostname}): Firebase güvenlik politikası gereği bu alan adını Firebase Console > Authentication > Settings > Authorized domains bölümüne eklemeniz gerekmektedir.`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#B08D57] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] p-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e6e2d3]">
          <h1 className="text-3xl font-serif font-bold text-[#5a5a40] mb-2 italic">AkademiPanel</h1>
          <p className="text-[#8e8d82] mb-6 font-semibold text-sm">Devam etmek için lütfen giriş yapın</p>

          {loginError && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-left leading-relaxed animate-fade-in">
              <span className="font-bold block mb-1">⚠️ Giriş Hatası:</span>
              <span>{loginError}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 bg-[#B08D57] hover:bg-[#c4a46e] active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:opacity-60"
          >
            <LogIn className="w-5 h-5" />
            {isLoggingIn ? 'Giriş Yapılıyor...' : 'Google ile Giriş Yap'}
          </button>
          <p className="mt-6 text-xs text-[#8e8d82]">
            Verileriniz bulutta güvenle saklanır ve cihazlar arasında senkronize edilir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider user={user}>
      <AppContent user={user} />
    </AppProvider>
  );
}
