/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { StudentsView } from './views/StudentsView';
import { ExamsView } from './views/ExamsView';
import { ResultsView } from './views/ResultsView';
import { BudgetView } from './views/BudgetView';
import { HallsView } from './views/HallsView';
import { LeagueView } from './views/LeagueView';

function AppContent() {
  const { userRole } = useAppContext();
  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? 'students' : 'results');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
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
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
