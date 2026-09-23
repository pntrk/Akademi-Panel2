import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trophy, TrendingUp, Shield, Crown, ArrowUpRight, ArrowDownRight, Info, X, BookOpen, ChevronDown } from 'lucide-react';
import { determineLeagueTeam, calculateAtaLigPoints, parseDate } from '../lib/utils';
import RulesView from './RulesView';

export const LeagueView = () => {
  const { state, setStudents, updateLeagueSettings, approveTransfer, userRole } = useAppContext();
  const [activeView, setActiveView] = useState<'dashboard' | 'rules'>('dashboard');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showTactics, setShowTactics] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  // Local state for edits
  const [selectedGrade, setSelectedGrade] = useState<string>('8');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  
  // Set default to latest month available if not manually changed
  useEffect(() => {
    if (selectedMonth === 'all' && state.exams.length > 0) {
      const months = new Set<string>();
      state.exams.forEach(e => {
         if(e.date) {
           const dateObj = parseDate(e.date);
           months.add(`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`);
         }
      });
      const sorted = Array.from(months).sort((a,b) => b.localeCompare(a));
      if (sorted.length > 0) {
        setSelectedMonth(sorted[0]);
      }
    }
  }, [state.exams]);
  const [mentors, setMentors] = useState<Record<string, string>>(state.leagueMentors || {});
  const [bonusPoints, setBonusPoints] = useState<Record<string, number>>(state.leagueTeamPoints || {});

  // Sync with context if it changes externally
  useEffect(() => {
    setMentors(state.leagueMentors || {});
    setBonusPoints(state.leagueTeamPoints || {});
  }, [state.leagueMentors, state.leagueTeamPoints]);

  const handleMentorChange = (team: string, name: string) => {
    const newMentors = { ...mentors, [team]: name };
    setMentors(newMentors);
    updateLeagueSettings(newMentors, bonusPoints);
  };

  const handleBonusChange = (team: string, pts: number) => {
    const newBonus = { ...bonusPoints, [team]: pts };
    setBonusPoints(newBonus);
    updateLeagueSettings(mentors, newBonus);
  };

  // Otomatik takım yerleştirme efekti




  const getGradeLevel = (cls: string) => {
    const match = cls?.trim().match(/^(\d+)/);
    return match ? match[1] : null;
  };

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    state.results.forEach(r => {
      const matchedStudent = state.students.find(s => s.no === r.studentNo);
      const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;
      if (displayClass) classes.add(displayClass.trim());
    });
    return Array.from(classes).sort();
  }, [state.results, state.students]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    state.exams.forEach(e => {
       if(e.date) {
         const dateObj = parseDate(e.date);
         months.add(`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`);
       }
    });
    return Array.from(months).sort((a,b) => b.localeCompare(a));
  }, [state.exams]);

  const availableGradeLevels = useMemo(() => {
    const levels = new Set<string>(['5', '6', '7', '8']);
    uniqueClasses.forEach(cls => {
      const lvl = getGradeLevel(cls);
      if (lvl) {
        levels.add(lvl);
      } else if (cls) {
        levels.add('Diğer');
      }
    });
    return Array.from(levels).sort((a, b) => {
      if (a === 'Diğer') return 1;
      if (b === 'Diğer') return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [uniqueClasses]);

  const filteredStudents = useMemo(() => {
    return state.students.filter(s => {
      const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0 && Object.values(r.scores || {}).some(score => (score as number) > 0));
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
        const lvl = getGradeLevel(s.className);
        if (selectedGrade === 'Diğer') {
          matchesGrade = !lvl;
        } else {
          matchesGrade = lvl === selectedGrade;
        }
      }
      return matchesGrade && hasExams;
    }).map(s => {
      let displayPoints = s.leaguePoints || 0;
      let displayBadges = s.badges || {};
      if (selectedMonth !== 'all') {
         const monthlyData = (s as any).monthlyLeagueData;
         if (monthlyData && monthlyData[selectedMonth]) {
           displayPoints = monthlyData[selectedMonth].points || 0;
           displayBadges = monthlyData[selectedMonth].badges || {};
         } else {
           displayPoints = 0;
           displayBadges = {};
         }
      }
      return { ...s, displayPoints, displayBadges };
    }).sort((a, b) => (b.displayPoints || 0) - (a.displayPoints || 0));
  }, [state.students, state.results, selectedGrade, selectedMonth]);

  const kutup = filteredStudents.filter(s => s.leagueTeam === 'Kutup Yıldızları');
  const sicrama = filteredStudents.filter(s => s.leagueTeam === 'Sıçrama Ustaları');
  const taktik = filteredStudents.filter(s => s.leagueTeam === 'Taktik Avcıları');

  const calcAvg = (teamName: string, team: any[]) => {
    const activeMembers = team.filter(s => {
      const p = (s.displayPoints !== undefined ? s.displayPoints : s.leaguePoints) || 0;
      return p !== 0;
    });
    if (activeMembers.length === 0) return (selectedMonth === 'all' ? (bonusPoints[teamName] || 0) : 0);
    const total = activeMembers.reduce((acc, s) => acc + ((s.displayPoints !== undefined ? s.displayPoints : s.leaguePoints) || 0), 0);
    return Math.round(total / activeMembers.length) + (selectedMonth === 'all' ? (bonusPoints[teamName] || 0) : 0);
  };

  const kutupAvg = calcAvg('Kutup Yıldızları', kutup);
  const sicramaAvg = calcAvg('Sıçrama Ustaları', sicrama);
  const taktikAvg = calcAvg('Taktik Avcıları', taktik);

  const championTeam = useMemo(() => {
    const avgs = [
      { name: 'Kutup Yıldızları', avg: kutupAvg },
      { name: 'Sıçrama Ustaları', avg: sicramaAvg },
      { name: 'Taktik Avcıları', avg: taktikAvg }
    ];
    let max = -1;
    let champ = '';
    avgs.forEach(t => {
      if (t.avg > max && t.avg > 0) {
        max = t.avg;
        champ = t.name;
      }
    });
    return champ;
  }, [kutupAvg, sicramaAvg, taktikAvg]);



  const recentTransfers = useMemo(() => {    return filteredStudents.filter(s => s.lastTransfer);
  }, [filteredStudents]);

  const pendingTransfers = useMemo(() => {
    return filteredStudents.filter(s => {
      const pt = (s as any).pendingTransfer;
      if (!pt) return false;
      if (selectedMonth === 'all') return true;
      if (pt.date) {
        const dateObj = parseDate(pt.date);
        const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        return mKey === selectedMonth;
      }
      return false;
    });
  }, [filteredStudents, selectedMonth]);

  const renderBadges = (badges?: any, team?: string) => {
    if (!badges) return <span className="text-brand-ink/30 text-xs italic">-</span>;
    const temel = [];
    const uzmanlik = [];
    const efsanevi = [];

    // Temel
    if (badges.kalkan > 0) temel.push(<span key="kalkan" className="bg-amber-100 text-amber-900 border border-amber-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Kalkan Puanı">🛡️ {badges.kalkan}</span>);
    if (badges.zirve > 0) temel.push(<span key="zirve" className="bg-purple-100 text-purple-900 border border-purple-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Zirve Koruma">👑 {badges.zirve}</span>);
    if (badges.ivme > 0) temel.push(<span key="ivme" className="bg-blue-100 text-blue-900 border border-blue-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="İvme Puanı">🚀 {badges.ivme}</span>);
    if (badges.tamIsabet > 0) temel.push(<span key="tamIsabet" className="bg-emerald-100 text-emerald-900 border border-emerald-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Tam İsabet">🎯 {badges.tamIsabet}</span>);
    if (badges.kirmiziKart > 0) temel.push(<span key="kirmiziKart" className="bg-rose-100 text-rose-900 border border-rose-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Kırmızı Kart">🟥 {badges.kirmiziKart}</span>);

    // Takıma Özel
    if (badges.sozelSovalyesi > 0) efsanevi.push(<span key="ss" className="bg-amber-100 text-amber-900 border border-amber-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Sözel Şövalyesi">📜 {badges.sozelSovalyesi}</span>);
    if (badges.sayisalKalesi > 0) efsanevi.push(<span key="sk" className="bg-amber-100 text-amber-900 border border-amber-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Sayısal Kalesi">🏰 {badges.sayisalKalesi}</span>);
    if (badges.matematikUyanisi > 0) efsanevi.push(<span key="mu" className="bg-blue-100 text-blue-900 border border-blue-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Matematik Uyanışı">💡 {badges.matematikUyanisi}</span>);
    if (badges.dengeCambazi > 0) efsanevi.push(<span key="dc" className="bg-blue-100 text-blue-900 border border-blue-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Denge Cambazı">⚖️ {badges.dengeCambazi}</span>);
    if (badges.keskinNisanci > 0) efsanevi.push(<span key="kn" className="bg-emerald-100 text-emerald-900 border border-emerald-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Keskin Nişancı">🎯 {badges.keskinNisanci}</span>);
    if (badges.temelAtici > 0) efsanevi.push(<span key="ta" className="bg-emerald-100 text-emerald-900 border border-emerald-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1" title="Temel Atıcı">🧱 {badges.temelAtici}</span>);

    // Uzmanlık
    if (badges.zirveBekcisi > 0) uzmanlik.push(<span key="zb" className="bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">🏰 {badges.zirveBekcisi}</span>);
    if (badges.ivmeSampiyonu > 0) uzmanlik.push(<span key="is" className="bg-cyan-100 text-cyan-900 border border-cyan-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">⚡ {badges.ivmeSampiyonu}</span>);
    if (badges.barajYikici > 0) uzmanlik.push(<span key="by" className="bg-orange-100 text-orange-900 border border-orange-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">🔨 {badges.barajYikici}</span>);
    if (badges.stratejiMuhendisi > 0) uzmanlik.push(<span key="sm" className="bg-indigo-100 text-indigo-900 border border-indigo-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">🧠 {badges.stratejiMuhendisi}</span>);
    if (badges.istikrarElcisi > 0) uzmanlik.push(<span key="ie" className="bg-teal-100 text-teal-900 border border-teal-200/60 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">🕊️ {badges.istikrarElcisi}</span>);

    // Efsanevi
    if (badges.lgsFatihi > 0) efsanevi.push(<span key="lf" className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-300">🏆 LGS Fatihi x{badges.lgsFatihi}</span>);

    if (badges.ankaKusu > 0) efsanevi.push(<span key="ak" className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-300">🔥 Anka Kuşu x{badges.ankaKusu}</span>);

    const hasAny = temel.length > 0 || uzmanlik.length > 0 || efsanevi.length > 0;
    if (!hasAny) return <span className="text-brand-ink/30 text-xs italic">-</span>;

    return (
      <div className="flex flex-col gap-1">
        {efsanevi.length > 0 && <div className="flex flex-wrap gap-1 items-center">{efsanevi}</div>}
        {uzmanlik.length > 0 && <div className="flex flex-wrap gap-1 items-center">{uzmanlik}</div>}
        {temel.length > 0 && <div className="flex flex-wrap gap-1 items-center">{temel}</div>}
      </div>
    );
  };

  const getTeamStar = (team: any[]) => {
    if (team.length === 0) return null;
    const sorted = [...team].sort((a, b) => (b.displayPoints || 0) - (a.displayPoints || 0));
    return sorted[0] && (sorted[0].displayPoints || 0) > 0 ? sorted[0].name : null;
  };

  const isUpwardTransfer = (transferStr: string) => {
    if (transferStr.includes('Taktik') && transferStr.includes('Sıçrama')) return transferStr.indexOf('Sıçrama') > transferStr.indexOf('Taktik');
    if (transferStr.includes('Taktik') && transferStr.includes('Kutup')) return transferStr.indexOf('Kutup') > transferStr.indexOf('Taktik');
    if (transferStr.includes('Sıçrama') && transferStr.includes('Kutup')) return transferStr.indexOf('Kutup') > transferStr.indexOf('Sıçrama');
    if (transferStr.includes('Atanmadı')) return true;
    return true;
  };

  return (
    <div className="space-y-4 sm:space-y-6 flex flex-col h-full font-sans text-brand-ink">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 font-bold shadow-2xs">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-brand-ink font-bold tracking-tight">
                Akademi Arena
              </h2>
            </div>
            <span className="sm:hidden text-[11px] font-semibold text-brand-ink/60 bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-brand-border/70 shadow-2xs">
              Lig & Rozetler
            </span>
          </div>
          <p className="hidden sm:block text-brand-ink/60 text-xs sm:text-sm mt-1">
            Takımların başarı grafikleri, lig puanları (LP), rozet kazanımları ve dinamik liderlik tablosu.
          </p>
        </div>

        <button
          onClick={() => setActiveView(activeView === 'dashboard' ? 'rules' : 'dashboard')}
          className="flex items-center justify-center gap-2 bg-[#151618] hover:bg-black text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-2xs text-xs font-bold active:scale-95 cursor-pointer w-full sm:w-auto shrink-0"
        >
          {activeView === 'dashboard' ? (
            <><BookOpen className="w-3.5 h-3.5 text-amber-400" /> <span>Rozet Rehberi & Kurallar</span></>
          ) : (
            <><Trophy className="w-3.5 h-3.5 text-amber-400" /> <span>Liderlik Tablosuna Dön</span></>
          )}
        </button>
      </header>

      {activeView === 'rules' ? (
        <RulesView />
      ) : (
        <>
      {/* Filtreleme Alanı */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-brand-border/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Ay Filtresi */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto relative">
          <span className="text-xs font-bold text-brand-ink/60 min-w-[90px]">Zaman Aralığı:</span>
          <div className="relative w-full sm:w-64">
            <button
              onClick={() => {
                setIsMonthDropdownOpen(!isMonthDropdownOpen);
                setIsGradeDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FAF9F6] border border-brand-border/80 hover:bg-[#F2EFE9] rounded-xl text-xs font-bold text-brand-ink transition-all focus:outline-none focus:border-brand-accent shadow-2xs active:scale-[0.99] cursor-pointer"
            >
              <span className="truncate">
                {selectedMonth === 'all' ? '🏆 Tüm Zamanlar (Toplam Puan)' : (() => {
                  const [year, month] = selectedMonth.split('-');
                  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                  return `${monthNames[parseInt(month) - 1]} ${year}`;
                })()}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-brand-ink/50 transition-transform duration-200 shrink-0 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isMonthDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsMonthDropdownOpen(false)} 
                />
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-brand-border/80 rounded-2xl shadow-xl z-20 py-1.5 overflow-y-auto max-h-60 animate-fade-in">
                  <button
                    onClick={() => {
                      setSelectedMonth('all');
                      setIsMonthDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${
                      selectedMonth === 'all' ? 'text-amber-900 bg-amber-50 font-bold' : 'text-brand-ink'
                    }`}
                  >
                    🏆 Tüm Zamanlar (Toplam Puan)
                  </button>
                  {availableMonths.map(m => {
                    const [year, month] = m.split('-');
                    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                    const monthName = monthNames[parseInt(month) - 1];
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedMonth(m);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${
                          selectedMonth === m ? 'text-amber-900 bg-amber-50 font-bold' : 'text-brand-ink'
                        }`}
                      >
                        📅 {monthName} {year}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sınıf Seviyesi Seçim Alanı */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto relative">
          <div className="flex items-center space-x-1.5 min-w-[90px]">
            <BookOpen className="h-3.5 w-3.5 text-brand-ink/60" />
            <span className="text-xs font-bold text-brand-ink/60">Sınıf Seviyesi:</span>
          </div>
          <div className="relative w-full sm:w-60">
            <button
              onClick={() => {
                setIsGradeDropdownOpen(!isGradeDropdownOpen);
                setIsMonthDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FAF9F6] border border-brand-border/80 hover:bg-[#F2EFE9] rounded-xl text-xs font-bold text-brand-ink transition-all focus:outline-none focus:border-brand-accent shadow-2xs active:scale-[0.99] cursor-pointer"
            >
              <span>
                {selectedGrade === 'all' ? '📚 Tüm Sınıflar' : selectedGrade === 'Diğer' ? '🎒 Diğer Sınıflar' : `🎓 ${selectedGrade}. Sınıflar`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-brand-ink/50 transition-transform duration-200 shrink-0 ${isGradeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isGradeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsGradeDropdownOpen(false)} 
                />
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-brand-border/80 rounded-2xl shadow-xl z-20 py-1.5 overflow-y-auto max-h-60 animate-fade-in">
                  <button
                    onClick={() => {
                      setSelectedGrade('all');
                      setIsGradeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${
                      selectedGrade === 'all' ? 'text-amber-900 bg-amber-50 font-bold' : 'text-brand-ink'
                    }`}
                  >
                    📚 Tüm Sınıflar
                  </button>
                  {availableGradeLevels.map(lvl => {
                    return (
                      <button
                        key={lvl}
                        onClick={() => {
                          setSelectedGrade(lvl);
                          setIsGradeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors ${
                          selectedGrade === lvl ? 'text-amber-900 bg-amber-50 font-bold' : 'text-brand-ink'
                        }`}
                      >
                        {lvl === 'Diğer' ? '🎒 Diğer Sınıflar' : `🎓 ${lvl}. Sınıflar`}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Kutup Yıldızları */}
        <div 
          onClick={() => setSelectedTeam('Kutup Yıldızları')}
          className={`cursor-pointer transition-all hover:shadow-md bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-amber-100/50 border ${
            championTeam === 'Kutup Yıldızları' 
              ? 'border-amber-400 ring-2 ring-amber-400/40' 
              : 'border-amber-200/80 hover:border-amber-300'
          } rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col relative active:scale-[0.99]`}
        >
          {championTeam === 'Kutup Yıldızları' && (
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-white" />
              <span>Haftanın Şampiyonu</span>
            </div>
          )}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-950">Kutup Yıldızları</h3>
              <p className="text-[11px] font-medium text-amber-800/70">400+ Puan Ligi</p>
            </div>
          </div>

          <div className="mb-4 bg-white/70 backdrop-blur-xs rounded-xl p-2.5 border border-amber-200/50 shadow-2xs">
            <p className="text-[10px] text-amber-800/60 uppercase tracking-wider font-bold mb-0.5">⭐ Takım Yıldızı</p>
            <p className="text-xs sm:text-sm font-bold text-amber-950 truncate">{getTeamStar(kutup) || 'Henüz Yok'}</p>
          </div>

          <div className="flex justify-between items-end mt-auto pt-2 border-t border-amber-200/50">
            <div>
              <p className="text-[11px] font-bold text-amber-800/70 uppercase tracking-wider">Ortalama LP</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-700 tabular-nums">{kutupAvg}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-amber-800/70 uppercase tracking-wider">Kadro</p>
              <p className="text-base sm:text-lg font-bold text-amber-900">{kutup.length} Öğrenci</p>
              <span className="text-[10px] font-bold text-amber-700/80 hover:underline inline-block mt-0.5">Üyeleri Gör →</span>
            </div>
          </div>
        </div>

        {/* Sıçrama Ustaları */}
        <div 
          onClick={() => setSelectedTeam('Sıçrama Ustaları')}
          className={`cursor-pointer transition-all hover:shadow-md bg-gradient-to-br from-blue-50/90 via-blue-50/40 to-blue-100/50 border ${
            championTeam === 'Sıçrama Ustaları' 
              ? 'border-blue-400 ring-2 ring-blue-400/40' 
              : 'border-blue-200/80 hover:border-blue-300'
          } rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col relative active:scale-[0.99]`}
        >
          {championTeam === 'Sıçrama Ustaları' && (
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-white" />
              <span>Haftanın Şampiyonu</span>
            </div>
          )}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-950">Sıçrama Ustaları</h3>
              <p className="text-[11px] font-medium text-blue-800/70">300 – 399 Puan Ligi</p>
            </div>
          </div>

          <div className="mb-4 bg-white/70 backdrop-blur-xs rounded-xl p-2.5 border border-blue-200/50 shadow-2xs">
            <p className="text-[10px] text-blue-800/60 uppercase tracking-wider font-bold mb-0.5">⭐ Takım Yıldızı</p>
            <p className="text-xs sm:text-sm font-bold text-blue-950 truncate">{getTeamStar(sicrama) || 'Henüz Yok'}</p>
          </div>

          <div className="flex justify-between items-end mt-auto pt-2 border-t border-blue-200/50">
            <div>
              <p className="text-[11px] font-bold text-blue-800/70 uppercase tracking-wider">Ortalama LP</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-700 tabular-nums">{sicramaAvg}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-blue-800/70 uppercase tracking-wider">Kadro</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{sicrama.length} Öğrenci</p>
              <span className="text-[10px] font-bold text-blue-700/80 hover:underline inline-block mt-0.5">Üyeleri Gör →</span>
            </div>
          </div>
        </div>

        {/* Taktik Avcıları */}
        <div 
          onClick={() => setSelectedTeam('Taktik Avcıları')}
          className={`cursor-pointer transition-all hover:shadow-md bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-emerald-100/50 border ${
            championTeam === 'Taktik Avcıları' 
              ? 'border-emerald-400 ring-2 ring-emerald-400/40' 
              : 'border-emerald-200/80 hover:border-emerald-300'
          } rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col relative active:scale-[0.99]`}
        >
          {championTeam === 'Taktik Avcıları' && (
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-white" />
              <span>Haftanın Şampiyonu</span>
            </div>
          )}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-emerald-950">Taktik Avcıları</h3>
              <p className="text-[11px] font-medium text-emerald-800/70">0 – 299 Puan Ligi</p>
            </div>
          </div>

          <div className="mb-4 bg-white/70 backdrop-blur-xs rounded-xl p-2.5 border border-emerald-200/50 shadow-2xs">
            <p className="text-[10px] text-emerald-800/60 uppercase tracking-wider font-bold mb-0.5">⭐ Takım Yıldızı</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-950 truncate">{getTeamStar(taktik) || 'Henüz Yok'}</p>
          </div>

          <div className="flex justify-between items-end mt-auto pt-2 border-t border-emerald-200/50">
            <div>
              <p className="text-[11px] font-bold text-emerald-800/70 uppercase tracking-wider">Ortalama LP</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tabular-nums">{taktikAvg}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-emerald-800/70 uppercase tracking-wider">Kadro</p>
              <p className="text-base sm:text-lg font-bold text-emerald-900">{taktik.length} Öğrenci</p>
              <span className="text-[10px] font-bold text-emerald-700/80 hover:underline inline-block mt-0.5">Üyeleri Gör →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50/90 to-amber-50/90 border border-orange-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-orange-950 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-200/80 text-orange-800 flex items-center justify-center text-xs">⏳</span>
              <span>Onay Bekleyen Transferler ({pendingTransfers.length})</span>
            </h3>
            <span className="text-[11px] text-orange-800/70 font-medium">Sınav puanı gelişimine göre lig geçişleri</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
            {pendingTransfers.map(s => {
              const pt = (s as any).pendingTransfer;
              const isUp = pt && isUpwardTransfer(`${pt.from} ➔ ${pt.to}`);
              return (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)} 
                  className="cursor-pointer bg-white border border-orange-200/70 rounded-xl px-3.5 py-2.5 flex-shrink-0 flex items-center space-x-3 min-w-[280px] hover:bg-orange-50/40 shadow-2xs transition-all active:scale-[0.99]"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-brand-ink truncate">{s.name}</p>
                    <p className="text-[10px] text-brand-ink/60 font-medium truncate">{pt.from} ➔ {pt.to}</p>
                  </div>
                  {userRole === 'admin' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); approveTransfer(s.no, pt.examName, pt.to); }}
                      className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer shrink-0"
                    >
                      Onayla
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Akademi Arena Sıralaması */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-brand-border/70 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3.5 border-b border-brand-border/60">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-brand-ink">
              Arena Liderlik Sıralaması ({selectedGrade === 'all' ? 'Tüm Sınıflar' : selectedGrade === 'Diğer' ? 'Diğer Sınıflar' : `${selectedGrade}. Sınıflar`})
            </h3>
            <p className="text-xs text-brand-ink/50 mt-0.5">
              {selectedMonth === 'all' ? "Tüm zamanların toplam LP sıralaması" : "Aylık performans LP sıralaması"}
            </p>
          </div>
          <button
            onClick={() => setShowTactics(true)}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            <span>Aylık Takım Taktikleri</span>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-auto w-full">
          <table className="w-full text-left min-w-[640px] border-collapse">
            <thead>
              <tr className="text-[11px] text-brand-ink/50 uppercase tracking-wider border-b border-brand-border/70 font-bold bg-[#FAF9F6]/50">
                <th className="py-3 px-3 w-14 text-center">Sıra</th>
                <th className="py-3 px-3 min-w-[180px]">Öğrenci Adı</th>
                <th className="py-3 px-3 w-40">Takımı</th>
                <th className="py-3 px-3 text-center w-32">
                  {selectedMonth === 'all' ? 'Toplam LP' : 'Aylık LP'}
                </th>
                <th className="py-3 px-3 min-w-[200px]">Kazanılan Rozetler</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-brand-border/40">
              {filteredStudents.map((s, idx) => (
                <tr 
                  key={s.id} 
                  className="hover:bg-[#FAF9F6] cursor-pointer transition-colors group"
                  onClick={() => setSelectedStudent(s)}
                >
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold font-mono ${
                      idx === 0 ? 'bg-amber-400 text-black shadow-2xs font-extrabold' : 
                      idx === 1 ? 'bg-slate-300 text-black shadow-2xs font-extrabold' : 
                      idx === 2 ? 'bg-amber-800 text-white shadow-2xs font-extrabold' : 
                      'bg-[#F2EFE9] text-brand-ink/70'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-brand-ink group-hover:text-amber-900 transition-colors">
                      {s.name}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-block border ${
                      s.leagueTeam === 'Kutup Yıldızları' ? 'bg-amber-50 text-amber-900 border-amber-200/80' : 
                      s.leagueTeam === 'Sıçrama Ustaları' ? 'bg-blue-50 text-blue-900 border-blue-200/80' :
                      s.leagueTeam === 'Taktik Avcıları' ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80' : 
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {s.leagueTeam || 'Atanmadı'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-serif font-bold text-emerald-800 text-base tabular-nums">
                    {(s.displayPoints !== undefined ? s.displayPoints : s.leaguePoints) || 0} LP
                  </td>
                  <td className="py-3 px-3">
                    {renderBadges((s.displayBadges || s.badges), s.leagueTeam)}
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-ink/50 italic bg-[#FAF9F6]/40 rounded-xl">
                    Henüz Akademi Arena puanı olan öğrenci bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Modern Cards View */}
        <div className="md:hidden flex flex-col gap-2.5">
          {filteredStudents.map((s, idx) => {
            const lpPoints = (s.displayPoints !== undefined ? s.displayPoints : s.leaguePoints) || 0;
            return (
              <div 
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className="bg-[#FAF9F6] rounded-2xl p-3 sm:p-3.5 border border-brand-border/70 shadow-2xs flex flex-col gap-2 active:scale-98 transition-all cursor-pointer hover:border-brand-border"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-black shadow-2xs font-extrabold' : 
                      idx === 1 ? 'bg-slate-300 text-black shadow-2xs font-extrabold' : 
                      idx === 2 ? 'bg-amber-800 text-white shadow-2xs font-extrabold' : 
                      'bg-white border border-brand-border/80 text-brand-ink/70'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-brand-ink truncate">{s.name}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 border ${
                    s.leagueTeam === 'Kutup Yıldızları' ? 'bg-amber-50 text-amber-900 border-amber-200/80' : 
                    s.leagueTeam === 'Sıçrama Ustaları' ? 'bg-blue-50 text-blue-900 border-blue-200/80' :
                    s.leagueTeam === 'Taktik Avcıları' ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80' : 
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {s.leagueTeam || 'Atanmadı'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-brand-border/50 pt-2 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-brand-ink/50 font-semibold">Skor:</span>
                    <span className="font-serif font-bold text-sm text-emerald-800 tabular-nums">{lpPoints} LP</span>
                  </div>

                  <div className="flex items-center gap-1 max-w-[60%] overflow-x-auto no-scrollbar">
                    {renderBadges((s.displayBadges || s.badges), s.leagueTeam)}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="text-center py-10 text-brand-ink/50 italic bg-[#FAF9F6] rounded-2xl border border-brand-border/60 p-4">
              Henüz Akademi Arena puanı olan öğrenci bulunmuyor.
            </div>
          )}
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-all" onClick={() => setSelectedTeam(null)}>
          <div 
            className="bg-white w-full max-w-2xl rounded-t-[28px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-slide-up sm:animate-none pb-safe sm:pb-0 border border-brand-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-border/60 bg-[#FAF9F6] rounded-t-[28px] sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-2xs ${
                  selectedTeam === 'Kutup Yıldızları' ? 'bg-amber-500' :
                  selectedTeam === 'Sıçrama Ustaları' ? 'bg-blue-500' : 'bg-emerald-600'
                }`}>
                  {selectedTeam === 'Kutup Yıldızları' ? <Trophy className="w-5 h-5" /> :
                   selectedTeam === 'Sıçrama Ustaları' ? <TrendingUp className="w-5 h-5" /> :
                   <Shield className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-brand-ink">{selectedTeam} Takımı</h3>
                  <p className="text-xs text-brand-ink/50">Takım üyeleri ve mevcut LP durumları</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-2 text-brand-ink/40 hover:text-brand-ink hover:bg-gray-100 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-auto">
              <table className="w-full text-left min-w-full md:min-w-[500px]">
                <thead>
                  <tr className="text-[11px] text-brand-ink/50 uppercase tracking-wider border-b border-brand-border/60 font-bold">
                    <th className="pb-3 font-bold">Öğrenci Adı</th>
                    <th className="pb-3 font-bold text-center">Lig Puanı (LP)</th>
                    <th className="pb-3 font-bold">Rozetler</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-brand-border/40">
                  {filteredStudents
                    .filter(s => s.leagueTeam === selectedTeam)
                    .sort((a, b) => (b.displayPoints || 0) - (a.displayPoints || 0))
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 font-bold text-brand-ink">{s.name}</td>
                        <td className="py-3 text-center font-serif font-bold text-emerald-800 tabular-nums">{(s.displayPoints !== undefined ? s.displayPoints : s.leaguePoints) || 0}</td>
                        <td className="py-3">{renderBadges((s.displayBadges || s.badges), s.leagueTeam)}</td>
                      </tr>
                    ))}
                  {filteredStudents
                    .filter(s => s.leagueTeam === selectedTeam).length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-brand-ink/50 italic bg-[#FAF9F6]/40 rounded-xl">
                        Bu takımda henüz öğrenci bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tactics Modal */}
      {showTactics && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-all" onClick={() => setShowTactics(false)}>
          <div 
            className="bg-white w-full max-w-5xl rounded-t-[28px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-slide-up sm:animate-none pb-safe sm:pb-0 border border-brand-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-border/60 bg-[#FAF9F6] rounded-t-[28px] sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-brand-ink">Aylık Takım Görevleri & Taktikler</h3>
                  <p className="text-xs text-brand-ink/50">Bu tabloyu yazdırarak sınıf panosuna asabilirsiniz.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 sm:px-4 py-2 bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Yazdır</span>
                </button>
                <button
                  onClick={() => setShowTactics(false)}
                  className="p-2 text-brand-ink/40 hover:text-brand-ink hover:bg-gray-100 rounded-full transition-colors active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-auto print:p-0">
              <table className="w-full text-left border-collapse border border-brand-border/80">
                <thead>
                  <tr className="bg-[#FAF9F6] text-[11px] sm:text-xs text-brand-ink font-bold">
                    <th className="p-2.5 border border-brand-border/80">AYLAR</th>
                    <th className="p-2.5 border border-brand-border/80 text-amber-900 bg-amber-50/50">KUTUP YILDIZLARI (A Takımı)</th>
                    <th className="p-2.5 border border-brand-border/80 text-blue-900 bg-blue-50/50">SIÇRAMA USTALARI (B Takımı)</th>
                    <th className="p-2.5 border border-brand-border/80 text-emerald-900 bg-emerald-50/50">TAKTİK AVCILARI (C Takımı)</th>
                    <th className="p-2.5 border border-brand-border/80 bg-purple-50/50 text-purple-950">🏆 ORTAK DYK & TAKIM GÖREVİ</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] sm:text-xs divide-y divide-brand-border/40">
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">EYLÜL (D 1-4)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Sözel Kusursuzluk:</strong> İnkılap, Din ve İngilizce branşlarında takımca hiç fire (yanlış) vermemek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Matematik Uyanışı:</strong> Matematik net ortalamasını takımca eksi (-) ve sıfırlardan kurtarıp kalıcı hale getirmek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Cesur Boşluklar:</strong> Hiçbir derste eksi nete düşmemek. Sadece emin olunanı işaretlemek.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">Tüm takımların DYK'ya minimum %90 devamlılık sağlaması.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">EKİM (D 5-8)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Kronometre Avcısı:</strong> Türkçe'de (zaman artırarak) 18+ net ve "sıfır dikkat hatası" ile denemeleri bitirmek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Baraj Yıkıcı:</strong> Sayısal bölümde zorlanılan Matematikte takım ortalamasını 8+ nete sabitlemek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Kalkanları Açın:</strong> Ay boyunca takımın %80'inin "Kalkan Puanı"nı (Boş &gt; Yanlış) her denemede alması.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">"Hata Avcısı" defterine her öğrencinin en az 15 öğretmen imzası toplatması.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">KASIM (D 9-12)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Sayısal Simetri:</strong> Matematik ve Fen Bilimlerinde takımca 15'er netin altına asla düşmemek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Fen Kalesi:</strong> Sınavın kurtarıcısı Fen Bilimleri net ortalamasını 14+ nete demirlemek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Optik Disiplin:</strong> 4 deneme boyunca hiçbir kaydırma veya yanlış işaretleme hatası yapmamak.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">Soru bankalarından hocaların verdiği DYK ek ödevlerinin %100 teslimi.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">ARALIK (D 13-15)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Sıfır Dikkatsizlik:</strong> "Soru kökünü olumsuz okuma" veya "basit işlem hatası" kaynaklı fireleri sıfırlamak.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Süre Kurtarıcısı:</strong> Türkçeyi hızlı bitirip, sayısal oturumda Matematiğe ekstra süre yaratmak.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Temel Sıçrama:</strong> İlk denemeye (Eylül) göre takımca toplam neti en az +10 net yukarı taşımak.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">Yapılamayan/Biriken tüm deneme sorularının DYK'larda tamamen eritilmesi.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">OCAK (Ara Transfer)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Mentörlük Dayanışması:</strong> B veya C takımından bir arkadaşına DYK'da konu anlatıp akran koçluğu yapmak.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>1. Dönem Onarımı:</strong> İlk 15 denemede tespit edilen zayıf konulardan artık fire vermemek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Üst Lige Göz Kırp:</strong> Toplam neti 45+ üzerine taşıyarak yarıyıl transfer sezonunda 2. Lige çıkmak.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">DYK "Sömestir 1. Dönem Tekrar Kampı" simülasyonlarına %100 katılım.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">ŞUBAT (D 16-19)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Yeni Nesil Ustası:</strong> Sınavın en seçici (mantık/muhakeme) sorularını kayıpsız geçmek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Matematik Eşiği 2:</strong> Matematik ortalamasını 12+ bandına çekerek nitelikli lise potasına girmek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Sözel Savunması:</strong> Sözel bölüm (Türkçe, Din, İnk, İng) netlerini en üst seviyeye çıkarıp garantiye almak.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">DYK branş denemelerinde takım bazlı mini kapışmalar yapılması.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">MART (D 20-23)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Turlama Taktisyeni:</strong> Sınavı erken bitirip en az 10 dakika "şüpheli soruları kontrol" süresi ayırmak.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Zarar Kes (Stop-Loss):</strong> Sayısalda zor soruda inatlaşmayıp anında boş bırakıp 2. tura geçebilmek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Erken Çıkma Yasağı:</strong> Sınav bitene kadar optik başında kalıp son saniyeye kadar odaklanmak.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">Gerçek LGS kurallarıyla (kalem, optik, süre) birebir DYK sınav simülasyonları.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">NİSAN (D 24-27)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Sarsılmaz İstikrar:</strong> Peş peşe yapılan 4 denemede puan dalgalanmasını bitirip 470+ barajında kalmak.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Nitelikli Lise Güvencesi:</strong> Matematikte 13+, Türkçe'de 16+ barajını takım ortalaması yapmak.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Defansif Çözüm:</strong> Bildiklerini koruyup, sadece %100 emin olunan soruları işaretleyerek okulu korumak.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">Haftalık 2 denemenin yapıldığı yoğun Nisan temposuna mental dayanıklılık.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-bold border border-brand-border/80 bg-[#FAF9F6] text-brand-ink">MAYIS (D 28-30)</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Buz Adam / Kadın:</strong> En zor piyasa denemesinde bile panik yapmadan kriz yönetmek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Psikolojik Finiş:</strong> "Matematik yapamıyorum" stresini aşıp özgüvenle 15. deneme zirvesini geçmek.</td>
                    <td className="p-2.5 border border-brand-border/80"><strong>Zirve Özgüveni:</strong> Atmasyonun tamamen bittiği, 30. denemede kişisel net rekorunu kırmak.</td>
                    <td className="p-2.5 border border-brand-border/80 bg-purple-50/30">LGS öncesi son taktiklerin verilip, stres atıcı DYK veda etkinliklerinin yapılması.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Selected Student Details Modal */}
      {selectedStudent && (() => {
        const studentResult = state.results.find(r => r.studentNo === selectedStudent.no && selectedStudent.no !== 0);
        
        const allHistory = state.exams
          .filter(e => studentResult?.scores?.[e.name])
          .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
          .map(e => ({
            score: studentResult!.scores[e.name],
            details: studentResult!.details?.[e.name]?.lessons,
            name: e.name,
            date: e.date
          }));
          
        const rawHistory = allHistory.map((h, i) => {
            const pastExams = allHistory.slice(0, i);
            const prevAverage = pastExams.length > 0 ? (pastExams.reduce((sum, p) => sum + p.score, 0) / pastExams.length) : 0;
            let pastTeam = pastExams.length > 0 ? determineLeagueTeam(prevAverage) : 'Taktik Avcıları';
            if (pastTeam === 'Atanmadı') pastTeam = 'Taktik Avcıları';
            const { earnedLP, badgeCounts } = calculateAtaLigPoints(h.score, prevAverage, h.details, pastExams, pastTeam);
            
            let finalEarnedLP = earnedLP;
            
            // Re-calculate Anka Kusu for this specific exam
            const transfer = selectedStudent.transferHistory?.find((th: any) => th.examName === h.name);
            if (transfer && transfer.from === 'Taktik Avcıları' && (transfer.to === 'Sıçrama Ustaları' || transfer.to === 'Kutup Yıldızları')) {
                finalEarnedLP += 100;
                badgeCounts.ankaKusu = 1;
            }
            
            return {
              examName: h.name,
              date: h.date,
              score: h.score,
              earnedLP: finalEarnedLP,
              badgeCounts
            };
        }).reverse(); // newest first

        const history = rawHistory.filter(h => {
          if (selectedMonth === 'all') return true;
          if (h.date) {
            const dateObj = parseDate(h.date);
            const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            return mKey === selectedMonth;
          }
          return false;
        });

        return (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-all" onClick={() => setSelectedStudent(null)}>
            <div 
              className="bg-white w-full max-w-3xl rounded-t-[28px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-slide-up sm:animate-none pb-safe sm:pb-0 border border-brand-border/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-border/60 bg-[#FAF9F6] rounded-t-[28px] sm:rounded-t-2xl">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-brand-ink">{selectedStudent.name}</h3>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5">
                    {selectedMonth === 'all'
                      ? `Toplam LP: ${selectedStudent.leaguePoints || 0}`
                      : (() => {
                          const [year, month] = selectedMonth.split('-');
                          const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                          return `${monthNames[parseInt(month) - 1]} ${year} LP'si: ${selectedStudent.displayPoints || 0} (Toplam LP: ${selectedStudent.leaguePoints || 0})`;
                        })()
                    }
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 text-brand-ink/40 hover:text-brand-ink hover:bg-gray-100 rounded-full transition-colors active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto">
                {selectedStudent.transferHistory && selectedStudent.transferHistory.length > 0 && (() => {
                  const filteredTransfers = selectedStudent.transferHistory.filter((th: any) => {
                    if (selectedMonth === 'all') return true;
                    if (th.date) {
                      const dateObj = parseDate(th.date);
                      const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                      return mKey === selectedMonth;
                    }
                    return false;
                  });
                  if (filteredTransfers.length === 0) return null;
                  return (
                     <div className="mb-6">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-brand-ink/70 mb-3 border-b border-brand-border/60 pb-2">
                          Transfer Geçmişi
                        </h4>
                        <div className="space-y-2">
                          {filteredTransfers.map((th: any, idx: number) => (
                             <div key={idx} className="bg-[#FAF9F6] border border-brand-border/70 rounded-xl p-3 flex justify-between items-center shadow-2xs">
                                <div>
                                   <p className="text-sm font-bold text-brand-ink">{th.from} ➔ {th.to}</p>
                                   <p className="text-xs text-brand-ink/60 font-medium">{th.examName}</p>
                                </div>
                                <div className="text-xs font-semibold text-brand-ink/60 bg-white px-2.5 py-1 rounded-lg border border-brand-border/60 shadow-2xs">
                                  {parseDate(th.date).toLocaleDateString('tr-TR')}
                                </div>
                             </div>
                          ))}
                        </div>
                     </div>
                  );
                })()}
                
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-ink/70 mb-3 border-b border-brand-border/60 pb-2">
                  LP ve Rozet Kazanım Geçmişi
                </h4>
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((h, i) => (
                      <div key={i} className="bg-white border border-brand-border/70 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h5 className="font-bold text-sm text-brand-ink">{h.examName}</h5>
                            <p className="text-xs font-medium text-brand-ink/60 mt-0.5">
                              {parseDate(h.date).toLocaleDateString('tr-TR')} • Sınav Puanı: <span className="font-bold text-blue-700">{h.score.toFixed(2)}</span>
                            </p>
                          </div>
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono shadow-2xs ${
                            h.earnedLP > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80' : 
                            h.earnedLP < 0 ? 'bg-rose-100 text-rose-800 border border-rose-200/80' : 
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {h.earnedLP > 0 ? '+' : ''}{h.earnedLP} LP
                          </div>
                        </div>
                        <div className="bg-[#FAF9F6] p-3 rounded-xl border border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-brand-ink/50 uppercase tracking-wider shrink-0">
                            Kazanılan Rozetler:
                          </span>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {h.badgeCounts.kalkan > 0 && <span className="bg-amber-100 text-amber-900 border border-amber-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🛡️ Kalkan</span>}
                            {h.badgeCounts.zirve > 0 && <span className="bg-purple-100 text-purple-900 border border-purple-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">👑 Zirve</span>}
                            {h.badgeCounts.ivme > 0 && <span className="bg-blue-100 text-blue-900 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🚀 İvme</span>}
                            {h.badgeCounts.tamIsabet > 0 && <span className="bg-emerald-100 text-emerald-900 border border-emerald-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🎯 Tam İsabet x{h.badgeCounts.tamIsabet}</span>}
                            {h.badgeCounts.kirmiziKart > 0 && <span className="bg-rose-100 text-rose-900 border border-rose-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🟥 Kırmızı Kart</span>}
                            {h.badgeCounts.zirveBekcisi > 0 && <span className="bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🏰 Zirve Bekçisi</span>}
                            {h.badgeCounts.ivmeSampiyonu > 0 && <span className="bg-cyan-100 text-cyan-900 border border-cyan-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">⚡ İvme Şampiyonu</span>}
                            {h.badgeCounts.barajYikici > 0 && <span className="bg-orange-100 text-orange-900 border border-orange-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🔨 Baraj Yıkıcı</span>}
                            {h.badgeCounts.stratejiMuhendisi > 0 && <span className="bg-indigo-100 text-indigo-900 border border-indigo-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🧠 Strateji Mh.</span>}
                            {h.badgeCounts.istikrarElcisi > 0 && <span className="bg-teal-100 text-teal-900 border border-teal-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🕊️ İstikrar Elçisi</span>}
                            {h.badgeCounts.lgsFatihi > 0 && <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-2xs text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-300">🏆 LGS Fatihi</span>}

                            {h.badgeCounts.ankaKusu > 0 && <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-2xs text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-300">🔥 Anka Kuşu</span>}
                            {h.badgeCounts.sozelSovalyesi > 0 && <span className="bg-amber-100 text-amber-900 border border-amber-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">📜 Sözel Şövalyesi</span>}
                            {h.badgeCounts.sayisalKalesi > 0 && <span className="bg-amber-100 text-amber-900 border border-amber-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🏰 Sayısal Kalesi</span>}
                            {h.badgeCounts.matematikUyanisi > 0 && <span className="bg-blue-100 text-blue-900 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">💡 Matematik Uyanışı</span>}
                            {h.badgeCounts.dengeCambazi > 0 && <span className="bg-blue-100 text-blue-900 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">⚖️ Denge Cambazı</span>}
                            {h.badgeCounts.keskinNisanci > 0 && <span className="bg-emerald-100 text-emerald-900 border border-emerald-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🎯 Keskin Nişancı</span>}
                            {h.badgeCounts.temelAtici > 0 && <span className="bg-emerald-100 text-emerald-900 border border-emerald-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">🧱 Temel Atıcı</span>}
                            {(Object.values(h.badgeCounts) as number[]).reduce((a,b) => a+b, 0) === 0 && <span className="text-xs font-semibold text-brand-ink/40 italic">Rozet alınamadı</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-brand-ink/50 italic text-center py-10 bg-[#FAF9F6] rounded-xl border border-brand-border/60">
                    Henüz sınav geçmişi bulunmuyor.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
        </>
      )}
    </div>
  );
};
