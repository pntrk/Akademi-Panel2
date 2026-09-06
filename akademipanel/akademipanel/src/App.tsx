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

function AppContent() {
  const { userRole } = useAppContext();
  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? 'students' : 'results');

  if (userRole === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e6e2d3]">
          <div className="flex justify-center mb-6"><Lock className="w-16 h-16 text-[#B08D57]" /></div>
          <h1 className="text-2xl font-serif font-bold text-[#5a5a40] mb-2 italic">Yetkisiz Erişim</h1>
          <p className="text-[#8e8d82] mb-8 font-semibold text-sm">Yetkilendirme için yöneticinize başvurunuz</p>
          <button onClick={logout} className="w-full bg-[#B08D57] hover:bg-[#c4a46e] text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md">Çıkış Yap</button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout}>
      {activeTab === 'students' && <StudentsView />}
      {activeTab === 'exams' && <ExamsView />}
      {activeTab === 'results' && <ResultsView />}
      {activeTab === 'league' && <LeagueView />}
      {activeTab === 'budget' && <BudgetView />}
      {activeTab === 'halls' && <HallsView />}
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#B08D57] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e6e2d3]">
          <h1 className="text-3xl font-serif font-bold text-[#5a5a40] mb-2 italic">AkademiPanel</h1>
          <p className="text-[#8e8d82] mb-8 font-semibold text-sm">Devam etmek için lütfen giriş yapın</p>
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-[#B08D57] hover:bg-[#c4a46e] text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md"
          >
            <LogIn className="w-5 h-5" />
            Google ile Giriş Yap
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
      <AppContent />
    </AppProvider>
  );
}
