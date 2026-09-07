import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ExamResult } from '../types';
import { exportToExcel, importFromExcel, generateId, calculateAtaLigPoints, determineLeagueTeam, parseDate, normalizeForSearch } from '../lib/utils';
import { Upload, Download, Trash2, Plus, BarChart3, ListFilter, CheckCircle2, XCircle, AlertCircle, Search, HelpCircle, X, Printer, FileText, ChevronDown, Award, TrendingUp, UserCheck, Layers, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentProgressCharts } from '../components/StudentProgressCharts';

export const ResultsView = () => {
  const { state, setResults, setStudents, userRole } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseTurkishFloat = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().trim().replace(/\s/g, '');
    if (!str) return 0;
    if (str.includes(',') && !str.includes('.')) {
      return parseFloat(str.replace(',', '.')) || 0;
    }
    if (str.includes('.') && str.includes(',')) {
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(str) || 0;
  };

  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [detailDisplayMode, setDetailDisplayMode] = useState<'all' | 'net' | 'dyb'>('all');
  const [classNameFilter, setClassNameFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  
  // Bulk Delete State
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  
  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [targetExamIdForImport, setTargetExamIdForImport] = useState<string>('');

  // Student Profile Modal State
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string | null>(null);
  const [expandedExamName, setExpandedExamName] = useState<string | null>(null);

  useEffect(() => {
    setExpandedExamName(null);
  }, [selectedStudentProfileId]);

  const getGradeLevel = (cls: string) => {
    const match = cls.trim().match(/^(\d+)/);
    return match ? match[1] : null;
  };

  const examKeys = useMemo(() => {
    const keys = new Set<string>();
    state.results.forEach(r => {
      Object.keys(r.scores).forEach(k => keys.add(k));
    });
    return Array.from(keys).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });
  }, [state.results]);

  useEffect(() => {
    if (examKeys.length > 0 && !selectedExam) {
      setSelectedExam(examKeys[0]);
    }
  }, [examKeys, selectedExam]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    state.results.forEach(r => {
      const matchedStudent = state.students.find(s => s.no === r.studentNo);
      const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;
      if (displayClass) classes.add(displayClass.trim());
    });
    return Array.from(classes).sort();
  }, [state.results, state.students]);

  const availableGradeLevels = useMemo(() => {
    const levels = new Set<string>();
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

  const filteredUniqueClasses = useMemo(() => {
    return uniqueClasses.filter(cls => {
      if (selectedGrade === 'all') return true;
      const lvl = getGradeLevel(cls);
      if (selectedGrade === 'Diğer') return !lvl;
      return lvl === selectedGrade;
    });
  }, [uniqueClasses, selectedGrade]);

  useEffect(() => {
    setClassNameFilter('all');
  }, [selectedGrade]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setIsImportModalOpen(true);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmImport = () => {
    if (!importFile || !targetExamIdForImport) return;
    
    const file = importFile;
    const targetExam = state.exams.find(e => e.id === targetExamIdForImport);
    const forcedExamName = targetExam ? targetExam.name : null;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // Detect Kurum Net Listesi format (checking first few rows for ATATÜRK or Öğr.No)
      const isKurumFormat = jsonData.length > 5 && jsonData.some((row, i) => i < 12 && row && row.some(c => typeof c === 'string' && (c.includes("Öğr.No") || c.includes("Kurum Net Listesi") || c.includes("Kurum Ortalaması"))));
      
      if (isKurumFormat) {
        let lessonRowIdx = -1;
        for (let i = 0; i < Math.min(jsonData.length, 12); i++) {
          const row = jsonData[i] || [];
          if (row.some(c => typeof c === 'string' && (c.toLowerCase().includes('türkçe') || c.toLowerCase().includes('matematik') || c.toLowerCase().includes('fen')))) {
            lessonRowIdx = i;
            break;
          }
        }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(jsonData.length, 12); i++) {
          const row = jsonData[i] || [];
          if (row.some(c => typeof c === 'string' && (c.toLowerCase().includes('öğr.no') || c.toLowerCase().includes('ad, soyad') || c.toLowerCase().includes('adı soyadı')))) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          for (let i = 0; i < Math.min(jsonData.length, 12); i++) {
            const row = jsonData[i] || [];
            const dCount = row.filter(c => typeof c === 'string' && (c === 'D' || c === 'Y' || c === 'N')).length;
            if (dCount >= 3) {
              headerRowIdx = i;
              break;
            }
          }
        }

        if (headerRowIdx === -1) {
          alert("Excel formatı çözülemedi (Başlık satırı olan Öğr.No veya D/Y/N bulunamadı).");
          setIsImportModalOpen(false);
          setImportFile(null);
          return;
        }

        // Determine Exam Name
        let examName = forcedExamName || file.name.replace(/\.[^/.]+$/, ""); // fallback to filename or forced


          // Build lesson column map
          const lessonsMap: Record<string, { dCol: number; yCol: number; nCol: number }> = {};
          const headerRow = jsonData[headerRowIdx] || [];
          
          let lessonNames: (string | null)[] = [];
          let currentLesson: string | null = null;
          const lessonRow = lessonRowIdx !== -1 ? (jsonData[lessonRowIdx] || []) : [];
          
          for (let c = 0; c < headerRow.length; c++) {
            const val = lessonRow[c];
            if (val && typeof val === 'string' && val.trim() !== '') {
              const trimmed = val.trim();
              if (!trimmed.includes('Sınıf') && !trimmed.includes('Süreç') && !trimmed.includes('Atatürk') && !trimmed.includes('ORTAOKULU') && !trimmed.includes('Öğrenci')) {
                currentLesson = trimmed;
              } else {
                currentLesson = null;
              }
            }
            lessonNames.push(currentLesson);
          }

          for (let col = 0; col < headerRow.length; col++) {
            const lessonName = lessonNames[col];
            if (lessonName && headerRow[col] === 'D' && headerRow[col+1] === 'Y' && headerRow[col+2] === 'N') {
              lessonsMap[lessonName] = {
                dCol: col,
                yCol: col + 1,
                nCol: col + 2
              };
              col += 2; // Skip Y and N
            }
          }

          // If no lessons matched but we have D, Y, N headers, let's auto-generate lesson names
          if (Object.keys(lessonsMap).length === 0) {
            let lastFoundLesson = "Genel";
            for (let col = 0; col < headerRow.length; col++) {
              if (headerRow[col] === 'D' && headerRow[col+1] === 'Y' && headerRow[col+2] === 'N') {
                lessonsMap[lastFoundLesson] = {
                  dCol: col,
                  yCol: col + 1,
                  nCol: col + 2
                };
                col += 2;
              }
            }
          }

          // Find Puan column index
          let puanCol = -1;
          puanCol = headerRow.findIndex(c => typeof c === 'string' && c.toLowerCase().includes('puan'));
          if (puanCol === -1) {
            for (let i = Math.max(0, headerRowIdx - 2); i <= Math.min(jsonData.length - 1, headerRowIdx + 2); i++) {
              const row = jsonData[i] || [];
              const idx = row.findIndex(c => typeof c === 'string' && c.toLowerCase().includes('puan'));
              if (idx !== -1) {
                puanCol = idx;
                break;
              }
            }
          }

          if (puanCol === -1) {
            const nColumns = Object.values(lessonsMap).map(m => m.nCol);
            if (nColumns.length > 0) {
              puanCol = Math.max(...nColumns) + 1;
            }
          }

          // Identify student basic info columns
          let noCol = 0;
          let nameCol = 1;
          let classCol = 2;
          for (let c = 0; c < headerRow.length; c++) {
            const h = (headerRow[c] || '').toString().toLowerCase().trim();
            if (h === 'no' || h.includes('öğr.no') || h.includes('öğrenci no') || h.includes('numara')) {
               noCol = c;
            } else if (h.includes('adı') || h.includes('soyad') || h === 'isim') {
               nameCol = c;
            } else if (h.includes('sınıf') || h.includes('şube')) {
               classCol = c;
            }
          }

          // Scan student rows to find maximum questions for each lesson
          const lessonQuestionCounts: Record<string, number> = {};
          Object.keys(lessonsMap).forEach(lessonName => {
            let maxQuestions = 0;
            const { dCol, yCol } = lessonsMap[lessonName];
            
            for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;
              
              const sNo = parseInt(row[noCol]);
              if (isNaN(sNo) || sNo === 0) continue;
              
              const d = parseInt(row[dCol]) || 0;
              const y = parseInt(row[yCol]) || 0;
              if (d + y > maxQuestions) {
                maxQuestions = d + y;
              }
            }
            
            if (maxQuestions === 0) {
              lessonQuestionCounts[lessonName] = 10;
            } else if (maxQuestions <= 10) {
              lessonQuestionCounts[lessonName] = 10;
            } else if (maxQuestions <= 15) {
              lessonQuestionCounts[lessonName] = 15;
            } else if (maxQuestions <= 20) {
              lessonQuestionCounts[lessonName] = 20;
            } else {
              lessonQuestionCounts[lessonName] = Math.ceil(maxQuestions / 5) * 5;
            }
          });

          // Now parse each student row
          let newResults = [...state.results];
          let updatedStudents = [...state.students];

          for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            const studentNoStr = row[noCol];
            let studentNo = parseInt(studentNoStr);
            
            const studentName = (row[nameCol] || '').toString().trim();
            const studentClass = (row[classCol] || '').toString().trim();
            const score = parseTurkishFloat(row[puanCol]);
            
            let existingSystemStudent = updatedStudents.find(s => s.no === studentNo && studentNo !== 0);
            const studentIndex = updatedStudents.findIndex(s => s.no === studentNo && studentNo !== 0);

            if (isNaN(studentNo) || studentNo === 0) continue;
            
            // Parse lesson details
            const lessonsDetails: Record<string, any> = {};
            Object.keys(lessonsMap).forEach(lessonName => {
              const { dCol, yCol, nCol } = lessonsMap[lessonName];
              const d = parseInt(row[dCol]) || 0;
              const y = parseInt(row[yCol]) || 0;
              const n = parseTurkishFloat(row[nCol]);
              const qCount = lessonQuestionCounts[lessonName] || 10;
              const b = Math.max(0, qCount - (d + y));
              
              lessonsDetails[lessonName] = {
                D: d,
                Y: y,
                B: b,
                N: n,
                totalQuestions: qCount
              };
            });

            const examDetail = {
              puan: score,
              lessons: lessonsDetails
            };

            const nameToUse = existingSystemStudent ? existingSystemStudent.name : studentName;
            const classToUse = existingSystemStudent ? existingSystemStudent.className : studentClass;

            const existingResultIndex = newResults.findIndex(r => r.studentNo === studentNo);
            
            // ATA-LIG Calculation
            let currentAverage = 0;
            let historyExams: any[] = [];
            if (existingResultIndex !== -1) {
                currentAverage = newResults[existingResultIndex].average || 0;
                historyExams = state.exams
                  .filter(e => newResults[existingResultIndex].scores[e.name])
                  .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
                  .map(e => ({
                      score: newResults[existingResultIndex].scores[e.name],
                      details: newResults[existingResultIndex].details?.[e.name]?.lessons
                  }));
            }
            
            let currentTeam = 'Taktik Avcıları';
            const studentIndexForTeam = updatedStudents.findIndex(s => s.no === studentNo && studentNo !== 0);
            if (studentIndexForTeam !== -1) {
               currentTeam = updatedStudents[studentIndexForTeam].leagueTeam || determineLeagueTeam(currentAverage);
            } else {
               currentTeam = determineLeagueTeam(currentAverage);
            }
            if (currentTeam === 'Atanmadı') currentTeam = 'Taktik Avcıları';
            const { earnedLP, earnedBadges, badgeCounts } = calculateAtaLigPoints(score, currentAverage, lessonsDetails, historyExams, currentTeam);

            let newAverage = score;
            if (existingResultIndex !== -1) {
              const r = newResults[existingResultIndex];
              const newScores = { ...r.scores, [examName]: score };
              const values = Object.values(newScores) as number[];
              const validValues = values.filter(v => v > 0);
              newAverage = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
              
              const newDetails = { ...r.details, [examName]: examDetail };
              
              newResults[existingResultIndex] = {
                ...r,
                studentName: nameToUse,
                studentClass: classToUse,
                scores: newScores,
                average: newAverage,
                details: newDetails,
                earnedLP: (r.earnedLP || 0) + earnedLP,
                earnedBadges: [...(r.earnedBadges || []), ...earnedBadges]
              };
            } else {
              newResults.push({
                id: generateId(),
                studentId: existingSystemStudent?.id || generateId(),
                studentNo: studentNo,
                studentName: nameToUse,
                studentClass: classToUse,
                scores: { [examName]: score },
                average: newAverage,
                details: { [examName]: examDetail },
                earnedLP,
                earnedBadges
              });
            }

            // Update student for ATA-LIG
            if (studentIndex !== -1) {
                const s = updatedStudents[studentIndex];
                const newLP = (s.leaguePoints || 0) + earnedLP;
                const newLeagueTeam = determineLeagueTeam(newAverage);
                
                let updatedLastTransfer = s.lastTransfer;
                if (s.leagueTeam && s.leagueTeam !== 'Atanmadı' && s.leagueTeam !== newLeagueTeam) {
                   updatedLastTransfer = `${s.leagueTeam} ➔ ${newLeagueTeam}`;
                }
                
                updatedStudents[studentIndex] = {
                    ...s,
                    leaguePoints: newLP,
                    leagueTeam: newLeagueTeam,
                    lastTransfer: updatedLastTransfer,
                    badges: {
                        kalkan: (s.badges?.kalkan || 0) + badgeCounts.kalkan,
                        ivme: (s.badges?.ivme || 0) + badgeCounts.ivme,
                        zirve: (s.badges?.zirve || 0) + badgeCounts.zirve,
                        tamIsabet: (s.badges?.tamIsabet || 0) + badgeCounts.tamIsabet,
                        kirmiziKart: (s.badges?.kirmiziKart || 0) + badgeCounts.kirmiziKart,
                        zirveBekcisi: (s.badges?.zirveBekcisi || 0) + (badgeCounts.zirveBekcisi || 0),
                        ivmeSampiyonu: (s.badges?.ivmeSampiyonu || 0) + (badgeCounts.ivmeSampiyonu || 0),
                        barajYikici: (s.badges?.barajYikici || 0) + (badgeCounts.barajYikici || 0),
                        stratejiMuhendisi: (s.badges?.stratejiMuhendisi || 0) + (badgeCounts.stratejiMuhendisi || 0),
                        istikrarElcisi: (s.badges?.istikrarElcisi || 0) + (badgeCounts.istikrarElcisi || 0)
                    }
                };
            }
          }

          setResults(newResults);
          setSelectedExam(examName);
          alert(`Sınav başarıyla aktarıldı!\nSınav Adı: ${examName}\nDersler: ${Object.keys(lessonsMap).join(', ')}`);
        } else {
          // Standard generic import
          importFromExcel(file, (data) => {
            const newResults: ExamResult[] = data.map((row: any) => {
              const scores: Record<string, number> = {};
              let total = 0;
              let count = 0;
              
              Object.keys(row).forEach(key => {
                if (key.toUpperCase().startsWith('DENEME') || key.toUpperCase().startsWith('SINAV')) {
                  const rawVal = row[key];
                  if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                      const score = parseTurkishFloat(rawVal);
                      if (score > 0) {
                          scores[key.toUpperCase()] = score;
                          total += score;
                          count++;
                      }
                  }
                }
              });

              let studentNo = parseInt(row['NO'] || row['no'] || '0');
              const studentName = row['ADI SOYADI'] || row['Adı Soyadı'] || '';
              const studentClass = row['SIN'] || row['SINIFI'] || row['Sınıfı'] || '';

              let existingSystemStudent = state.students.find(s => s.no === studentNo && studentNo !== 0);

              return {
                id: generateId(),
                studentId: existingSystemStudent?.id || generateId(), 
                studentNo,
                studentName: existingSystemStudent?.name || studentName,
                studentClass: existingSystemStudent?.className || studentClass,
                scores: forcedExamName ? { [forcedExamName]: count > 0 ? total/count : 0 } : scores,
                average: (Object.values(scores).filter((v: any) => v > 0).length > 0) ? (Object.values(scores).filter((v: any) => v > 0).reduce((a: any, b: any) => a + b, 0) / Object.values(scores).filter((v: any) => v > 0).length) : (count > 0 ? total/count : 0)
              };
            });
            setResults([...state.results, ...newResults]);
            alert("Sınav sonuçları standart şablonla aktarıldı.");
          });
        }
      };
      reader.readAsBinaryString(file);
      setIsImportModalOpen(false);
      setImportFile(null);
  };


  const renderBadges = (badges?: any, team?: string) => {
    if (!badges) return <span className="text-gray-400 text-xs italic">-</span>;
    const parts = [];
    if (badges.kalkan > 0) parts.push(<span key="kalkan" className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="Kalkan Puanı">🛡️ {badges.kalkan}</span>);
    
    if (badges.zirve > 0) {
      parts.push(<span key="zirve" className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="Zirve Koruma">👑 {badges.zirve}</span>);
    }
    
    if (badges.ivme > 0) parts.push(<span key="ivme" className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="İvme Puanı">🚀 {badges.ivme}</span>);
    if (badges.tamIsabet > 0) parts.push(<span key="tamIsabet" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="Tam İsabet">🎯 {badges.tamIsabet}</span>);
    
    if (badges.kirmiziKart > 0) {
      parts.push(<span key="kirmiziKart" className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="Kırmızı Kart">🟥 {badges.kirmiziKart}</span>);
    }

    if (badges.zirveBekcisi > 0) parts.push(<span key="zb" className="bg-fuchsia-100 text-fuchsia-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="Zirve Bekçisi">🏰 {badges.zirveBekcisi}</span>);
    if (badges.ivmeSampiyonu > 0) parts.push(<span key="is" className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="İvme Şampiyonu">⚡ {badges.ivmeSampiyonu}</span>);
    if (badges.barajYikici > 0) parts.push(<span key="by" className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="Baraj Yıkıcı">🔨 {badges.barajYikici}</span>);
    if (badges.stratejiMuhendisi > 0) parts.push(<span key="sm" className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="Strateji Mühendisi">🧠 {badges.stratejiMuhendisi}</span>);
    if (badges.istikrarElcisi > 0) parts.push(<span key="ie" className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1" title="İstikrar Elçisi">🕊️ {badges.istikrarElcisi}</span>);
    
    return parts.length > 0 ? <div className="flex flex-wrap items-center gap-y-1">{parts}</div> : <span className="text-gray-400 text-xs italic">-</span>;
  };

  const handleExport = () => {
    if (activeTab === 'detailed' && selectedExam) {
      const dataToExport = state.results
        .filter(r => r.scores[selectedExam] !== undefined)
        .map(r => {
          const matchedStudent = state.students.find(s => s.no === r.studentNo);
          const displayName = matchedStudent ? matchedStudent.name : r.studentName;
          const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;
          const row: any = {
            'Öğrenci No': r.studentNo,
            'Adı Soyadı': displayName,
            'Sınıfı': displayClass,
          };
          const examDetail = r.details?.[selectedExam];
          if (examDetail && examDetail.lessons) {
            Object.entries(examDetail.lessons).forEach(([lessonName, detail]: [string, any]) => {
              row[`${lessonName} D`] = detail.D;
              row[`${lessonName} Y`] = detail.Y;
              row[`${lessonName} B`] = detail.B;
              row[`${lessonName} Net`] = parseFloat(detail.N.toFixed(2));
            });
          }
          row['Puan'] = r.scores[selectedExam] || 0;
          return row;
        });
      exportToExcel(dataToExport, `${selectedExam}_detayli_ders_analizi`);
    } else {
      const dataToExport = state.results.map(r => {
        const matchedStudent = state.students.find(s => s.no === r.studentNo);
        const displayName = matchedStudent ? matchedStudent.name : r.studentName;
        const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;
        const row: any = {
          'NO': r.studentNo,
          'ADI SOYADI': displayName,
          'SINIFI': displayClass,
        };
        examKeys.forEach(k => {
          row[k] = r.scores[k] || 0;
        });
        const valid = Object.values(r.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const avg = valid.length > 0 ? valid.reduce((sum, val) => sum + val, 0) / valid.length : 0;
        row['ORTALAMA'] = avg.toFixed(2);
        return row;
      });
      exportToExcel(dataToExport, 'sinav_sonuclari_ozet');
    }
  };

  const removeResult = (id: string) => {
    setResults(state.results.filter(r => r.id !== id));
  };
  
  const handleBulkDelete = () => {
    setResults(state.results.filter(r => !selectedResultIds.includes(r.id)));
    setSelectedResultIds([]);
  };

  const addEmptyResult = () => {
     setResults([...state.results, {
        id: generateId(),
        studentId: '',
        studentNo: 0,
        studentName: '',
        studentClass: '',
        scores: {},
        average: 0
     }]);
  };
  
  const updateResultScore = (id: string, examKey: string, scoreStr: string) => {
      setResults(state.results.map(r => {
          if (r.id === id) {
              const newScores = { ...r.scores };
              if (scoreStr.trim() === '') {
                  delete newScores[examKey];
              } else {
                  newScores[examKey] = parseFloat(scoreStr.replace(',', '.')) || 0;
              }
              const values = Object.values(newScores) as number[];
              const validValues = values.filter(v => v > 0);
              const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
              return { ...r, scores: newScores, average: avg };
          }
          return r;
      }));
  };

  const updateResultField = (id: string, field: 'studentNo' | 'studentName' | 'studentClass', val: string | number) => {
      setResults(state.results.map(r => {
        if (r.id === id) {
          const updatedR = { ...r, [field]: val };
          if (field === 'studentNo') {
            const matchedStudent = state.students.find(s => s.no === val);
            if (matchedStudent) {
              updatedR.studentId = matchedStudent.id;
            }
          }
          return updatedR;
        }
        return r;
      }));
  };

  // Extract dynamically parsed available lessons for the selected exam
  const availableLessonsForExam = useMemo(() => {
    if (!selectedExam) return [];
    for (const r of state.results) {
      if (r.details && r.details[selectedExam] && r.details[selectedExam].lessons) {
        return Object.keys(r.details[selectedExam].lessons);
      }
    }
    return [];
  }, [state.results, selectedExam]);

  // Filter and compute statistics dynamically based on current selected exam
  const stats = useMemo(() => {
    if (!selectedExam) return null;
    
    const examResults = state.results.filter(r => {
      if (r.scores[selectedExam] === undefined) return false;
      const matchedStudent = state.students.find(s => s.no === r.studentNo);
      const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;
      
      // Filter by Grade Level
      if (selectedGrade !== 'all') {
        const lvl = displayClass ? getGradeLevel(displayClass) : null;
        if (selectedGrade === 'Diğer') {
          if (lvl) return false;
        } else if (lvl !== selectedGrade) {
          return false;
        }
      }
      
      // Filter by sub-class
      if (classNameFilter !== 'all') {
        if (displayClass?.trim() !== classNameFilter.trim()) return false;
      }
      
      return true;
    });
    if (examResults.length === 0) return null;
    
    const scores = examResults.map(r => r.scores[selectedExam]);
    const highestScore = Math.max(...scores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const lessonTotals: Record<string, { d: number; y: number; b: number; n: number; count: number; q: number }> = {};
    
    examResults.forEach(r => {
      const examDetail = r.details?.[selectedExam];
      if (examDetail && examDetail.lessons) {
        Object.entries(examDetail.lessons).forEach(([lessonName, d]: [string, any]) => {
          if (!lessonTotals[lessonName]) {
            lessonTotals[lessonName] = { d: 0, y: 0, b: 0, n: 0, count: 0, q: d.totalQuestions || 10 };
          }
          lessonTotals[lessonName].d += d.D;
          lessonTotals[lessonName].y += d.Y;
          lessonTotals[lessonName].b += d.B;
          lessonTotals[lessonName].n += d.N;
          lessonTotals[lessonName].count += 1;
        });
      }
    });

    const lessonStats = Object.entries(lessonTotals).map(([name, sum]) => ({
      name,
      avgD: sum.d / sum.count,
      avgY: sum.y / sum.count,
      avgB: sum.b / sum.count,
      avgN: sum.n / sum.count,
      totalQ: sum.q
    }));

    const classTotals: Record<string, { totalPuan: number; count: number }> = {};
    examResults.forEach(r => {
      const cls = r.studentClass ? r.studentClass.trim() : 'Sınıfsız';
      if (!classTotals[cls]) {
        classTotals[cls] = { totalPuan: 0, count: 0 };
      }
      classTotals[cls].totalPuan += r.scores[selectedExam];
      classTotals[cls].count += 1;
    });

    const classStats = Object.entries(classTotals).map(([name, sum]) => ({
      name,
      avgPuan: sum.totalPuan / sum.count,
      count: sum.count
    })).sort((a, b) => b.avgPuan - a.avgPuan);

    return {
      count: examResults.length,
      highestScore,
      averageScore,
      lessonStats,
      classStats
    };
  }, [state.results, state.students, selectedExam, selectedGrade, classNameFilter]);

  // List of students filtered by search query and class name
  const filteredResults = useMemo(() => {
    return state.results.filter(r => {
      const matchedStudent = state.students.find(s => s.no === r.studentNo);
      const displayName = matchedStudent ? matchedStudent.name : r.studentName;
      const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;

      const matchesSearch = searchQuery === '' || 
        normalizeForSearch(displayName).includes(normalizeForSearch(searchQuery)) || 
        r.studentNo.toString().includes(searchQuery);
      
      // Filter by Grade Level
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
        const lvl = displayClass ? getGradeLevel(displayClass) : null;
        if (selectedGrade === 'Diğer') {
          matchesGrade = !lvl;
        } else {
          matchesGrade = lvl === selectedGrade;
        }
      }

      const matchesClass = classNameFilter === 'all' || displayClass?.trim() === classNameFilter.trim();
      
      return matchesSearch && matchesGrade && matchesClass;
    }).reverse().sort((a, b) => {
        const aIsNew = a.studentNo === 0 && (!a.studentName || a.studentName.trim() === '');
        const bIsNew = b.studentNo === 0 && (!b.studentName || b.studentName.trim() === '');
        if (aIsNew && !bIsNew) return -1;
        if (bIsNew && !aIsNew) return 1;

        const aValid = Object.values(a.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const bValid = Object.values(b.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
        const aAvg = aValid.length > 0 ? aValid.reduce((sum, val) => sum + val, 0) / aValid.length : 0;
        const bAvg = bValid.length > 0 ? bValid.reduce((sum, val) => sum + val, 0) / bValid.length : 0;
        
        if (bAvg !== aAvg) return bAvg - aAvg;
        return 0;
    });
  }, [state.results, state.students, searchQuery, selectedGrade, classNameFilter]);

  const renderLessonCell = (lessonDetail: any) => {
    if (!lessonDetail) return <span className="text-[#8e8d82] italic text-xs">-</span>;
    const { D, Y, B, N } = lessonDetail;
    
    if (detailDisplayMode === 'net') {
      return (
        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50 text-xs">
          {N.toFixed(2).replace('.', ',')} N
        </span>
      );
    }
    
    if (detailDisplayMode === 'dyb') {
      return (
        <div className="flex justify-center items-center space-x-1 text-xs font-semibold">
          <span className="text-emerald-600 bg-emerald-50 px-1 rounded" title="Doğru">{D}</span>
          <span className="text-rose-500 bg-rose-50 px-1 rounded" title="Yanlış">{Y}</span>
          <span className="text-amber-500 bg-amber-50 px-1 rounded" title="Boş">{B}</span>
        </div>
      );
    }

    // Default 'all' format
    return (
      <div className="flex flex-col items-center justify-center py-1 px-1.5 bg-[#fcfbf7] rounded border border-[#e6e2d3]/60">
        <div className="flex items-center space-x-1 text-[10px] text-gray-500 font-semibold leading-none mb-0.5">
          <span className="text-emerald-600" title="Doğru">{D}D</span>
          <span>•</span>
          <span className="text-rose-500" title="Yanlış">{Y}Y</span>
          <span>•</span>
          <span className="text-amber-500" title="Boş">{B}B</span>
        </div>
        <div className="text-xs font-extrabold text-[#5a5a40] border-t border-[#e6e2d3]/40 pt-0.5 w-full text-center">
          {N.toFixed(2).replace('.', ',')} N
        </div>
      </div>
    );
  };

  const summaryStats = useMemo(() => {
    const totalCount = filteredResults.length;
    const allAverages = filteredResults.map(r => r.average).filter(avg => typeof avg === 'number' && avg > 0);
    const overallAvg = allAverages.length > 0 ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length : 0;
    const maxAvg = allAverages.length > 0 ? Math.max(...allAverages) : 0;
    return {
      totalCount,
      overallAvg,
      maxAvg,
      examCount: examKeys.length
    };
  }, [filteredResults, examKeys]);

  return (
    <div className="space-y-2.5 sm:space-y-6 md:space-y-8 flex flex-col h-full relative font-sans text-brand-ink">
      {/* Header and Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center sm:hidden shrink-0 font-bold">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h2 className="text-lg sm:text-3xl md:text-4xl font-serif text-[#5a5a40] font-bold tracking-tight leading-tight">Sınav Sonuçları</h2>
            </div>
            <span className="sm:hidden text-[11px] font-medium text-brand-ink/50 bg-[#f5f4f0] px-2 py-0.5 rounded-full border border-brand-border/60">
              {summaryStats.totalCount} Öğrenci
            </span>
          </div>
          <p className="hidden sm:block text-brand-ink/60 text-xs sm:text-sm mt-0.5">Öğrenci ders netleri, yanlış-doğru-boş takibi ve karne analizi</p>
        </div>
        
        {/* Action Buttons: Touch-Friendly 2x2 Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto py-0.5">
          {selectedResultIds.length > 0 && userRole === 'admin' && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-rose-600 text-white rounded-xl text-[11px] sm:text-xs font-bold shadow-xs hover:bg-rose-700 active:scale-95 transition-all min-w-0 w-full sm:w-auto"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">Sil ({selectedResultIds.length})</span>
            </button>
          )}

          {userRole === 'admin' && (
            <>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-white border border-brand-border text-[11px] sm:text-xs font-bold text-brand-ink rounded-xl transition-all hover:bg-[#FAF9F6] active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
                title="Excel/XML Kurum Net Listesi Yükle"
              >
                <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-ink/70 shrink-0" />
                <span className="truncate">Net Listesi Yükle</span>
              </button>

              <button 
                onClick={handleExport} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-white border border-brand-border text-[11px] sm:text-xs font-bold text-brand-ink rounded-xl transition-all hover:bg-[#FAF9F6] active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
                title="Excel'e Aktar"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-ink/70 shrink-0" />
                <span className="truncate">Excel Aktar</span>
              </button>

              <button 
                onClick={addEmptyResult} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-[#151618] border border-[#151618] text-white text-[11px] sm:text-xs font-bold rounded-xl transition-all hover:bg-black active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">+ Manuel Ekle</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Summary Stats - Compact 2x2 on Mobile, 4 Cols on Desktop */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
        {/* Stat 1: Sonuç Kaydı */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-brand-accent/50">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Kayıtlı Sonuç</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-brand-ink leading-none">{summaryStats.totalCount}</span>
            <span className="text-[10px] sm:text-xs text-brand-ink/50 font-medium">öğrenci</span>
          </div>
        </div>

        {/* Stat 2: Sınav Sayısı */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-brand-accent/50">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Sınav Havuzu</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-brand-ink leading-none">{summaryStats.examCount}</span>
            <span className="text-[10px] sm:text-xs text-brand-ink/50 font-medium">deneme</span>
          </div>
        </div>

        {/* Stat 3: Genel Puan Ortalaması */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-amber-300">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Puan Ortalaması</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-emerald-700 leading-none">
              {summaryStats.overallAvg.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-600/70 font-medium">puan</span>
          </div>
        </div>

        {/* Stat 4: Zirve Puan */}
        <div className="bg-white p-2.5 sm:p-4 md:p-5 border border-brand-border/70 rounded-xl sm:rounded-2xl shadow-xs sm:shadow-sm flex flex-col justify-between transition-all hover:border-emerald-300">
          <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">En Yüksek Ort.</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-amber-700 leading-none">
              {summaryStats.maxAvg.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] sm:text-xs text-amber-600/70 font-medium">puan</span>
          </div>
        </div>
      </section>

      {/* View Mode Tabs & Level Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-border/70 pb-2">
        <div className="flex items-center gap-1 bg-[#f0ede6] p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all text-center truncate ${
              activeTab === 'summary'
                ? 'bg-white text-[#5a5a40] shadow-xs'
                : 'text-brand-ink/60 hover:text-brand-ink'
            }`}
          >
            Genel Özet Tablosu
          </button>
          <button
            onClick={() => {
              setActiveTab('detailed');
              if (examKeys.length > 0 && !selectedExam) {
                setSelectedExam(examKeys[0]);
              }
            }}
            className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 truncate ${
              activeTab === 'detailed'
                ? 'bg-white text-[#5a5a40] shadow-xs'
                : 'text-brand-ink/60 hover:text-brand-ink'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Ders Bazlı Analiz</span>
          </button>
        </div>

        {/* Grade Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-1">
          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedGrade === 'all'
                ? 'bg-[#151618] text-white shadow-xs'
                : 'bg-white text-brand-ink/70 border border-brand-border hover:bg-gray-50'
            }`}
          >
            Tümü ({state.results.length})
          </button>
          {availableGradeLevels.map(lvl => {
            const count = state.results.filter(r => {
              const matchedStudent = state.students.find(s => s.no === r.studentNo);
              const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;
              if (lvl === 'Diğer') {
                return displayClass && !getGradeLevel(displayClass);
              }
              return displayClass && getGradeLevel(displayClass) === lvl;
            }).length;

            return (
              <button
                key={lvl}
                onClick={() => setSelectedGrade(lvl)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedGrade === lvl
                    ? 'bg-[#151618] text-white shadow-xs'
                    : 'bg-white text-brand-ink/70 border border-brand-border hover:bg-gray-50'
                }`}
              >
                {lvl === 'Diğer' ? 'Diğer' : `${lvl}. Sınıf`} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Notice */}
      {state.results.length > 0 && !state.results.some(r => r.details) && activeTab === 'detailed' && (
        <div className="flex items-start p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs sm:text-sm">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Detaylı ders verisi bulunamadı</p>
            <p className="mt-0.5 text-amber-700">
              Bu özellikten yararlanmak için Excel/XML dosyanızı <strong>Toplu Net Listesi Yükle</strong> butonu ile Kurum Net Listesi formatında tekrar yükleyin.
            </p>
          </div>
        </div>
      )}

      {/* View Content */}
      {activeTab === 'summary' ? (
        /* Summary Scores View */
        <div className="bg-white rounded-2xl border border-brand-border/70 shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px]">
          {/* Controls Bar */}
          <div className="p-3 sm:p-4 border-b border-brand-border/60 flex flex-col sm:flex-row justify-between gap-2.5 bg-[#FAF9F6]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40 h-4 w-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Öğrenci adı veya okul no ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-brand-border/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-brand-ink placeholder-brand-ink/40 font-medium focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-ink/40 hover:text-brand-ink p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={classNameFilter}
                  onChange={(e) => setClassNameFilter(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-2 bg-white border border-brand-border/80 rounded-xl text-xs text-brand-ink font-semibold focus:outline-none focus:border-brand-accent min-w-[130px] shadow-xs cursor-pointer"
                >
                  <option value="all">Tüm Şubeler</option>
                  {filteredUniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-brand-ink/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {(searchQuery || classNameFilter !== 'all' || selectedGrade !== 'all') && (
                <button 
                  onClick={() => { setSearchQuery(''); setClassNameFilter('all'); setSelectedGrade('all'); }}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold shrink-0 transition-colors shadow-xs active:scale-95"
                >
                  <X className="w-3 h-3" />
                  <span>Temizle</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-auto flex-1 w-full hidden md:block">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-xs text-[#8e8d82] uppercase border-b border-[#f5f5f0]">
                  {userRole === 'admin' && (
                    <th className="py-3 font-bold pl-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedResultIds.length === filteredResults.length && filteredResults.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResultIds(filteredResults.map(r => r.id));
                          } else {
                            setSelectedResultIds([]);
                          }
                        }}
                        className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40]"
                      />
                    </th>
                  )}
                  <th className="py-3 font-bold w-20">NO</th>
                  <th className="py-3 font-bold min-w-[200px]">ADI SOYADI</th>
                  <th className="py-3 font-bold w-24">SINIFI</th>
                  {examKeys.map(key => (
                    <th key={key} className="py-3 font-bold text-center text-[#5a5a40] whitespace-nowrap px-2">{key}</th>
                  ))}
                  <th className="py-3 font-bold text-center">ORTALAMA</th>
                  <th className="py-3 font-bold text-left min-w-[200px]">ROZETLER</th>
                  {userRole === 'admin' && <th className="py-3 font-bold w-16 text-center">Sil</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredResults.map((result) => {
                  const matchedStudent = state.students.find(s => s.no === result.studentNo);
                  const isMatched = !!matchedStudent;
                  const displayName = isMatched ? matchedStudent.name : result.studentName;
                  const displayClass = isMatched ? matchedStudent.className : result.studentClass;
                  return (
                    <tr key={result.id} className={`border-b ${!isMatched ? 'border-red-200 bg-red-50/40 hover:bg-red-50/70' : 'border-[#f5f5f0] hover:bg-[#fcfbf7]'}`}>
                      {userRole === 'admin' && (
                        <td className="py-2 pl-4">
                          <input
                            type="checkbox"
                            checked={selectedResultIds.includes(result.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedResultIds([...selectedResultIds, result.id]);
                              } else {
                                setSelectedResultIds(selectedResultIds.filter(id => id !== result.id));
                              }
                            }}
                            className={`rounded border-[#e6e2d3] focus:ring-[#5a5a40] ${!isMatched ? 'text-red-600' : 'text-[#5a5a40]'}`}
                          />
                        </td>
                      )}
                      <td className="py-2">
                        {userRole === 'admin' ? (
                          <input
                            type="number"
                            value={result.studentNo || ''}
                            onChange={(e) => updateResultField(result.id, 'studentNo', parseInt(e.target.value)||0)}
                            className={`w-full bg-transparent border-none focus:ring-0 font-bold ${!isMatched ? 'text-red-600 outline outline-1 outline-red-300 rounded' : 'text-[#5a5a40]'}`}
                            title={!isMatched ? "Eşleşmeyen Öğrenci No! Düzeltmek için tıklayın." : ""}
                          />
                        ) : (
                          <span className={`font-bold ${!isMatched ? 'text-red-600' : 'text-[#5a5a40]'}`}>
                            {result.studentNo || '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentProfileId(result.id)}
                            className="p-1 hover:bg-[#e6e2d3]/50 rounded text-amber-700 hover:text-amber-900 transition-colors shrink-0 cursor-pointer"
                            title="Öğrenci Profili ve Gelişim Raporunu Görmek İçin Tıklayın"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {isMatched || userRole !== 'admin' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentProfileId(result.id)}
                              className="text-left w-full hover:text-amber-700 hover:underline transition-colors focus:outline-none font-semibold text-[#5a5a40] cursor-pointer"
                              title="Öğrenci Profili ve Gelişim Raporunu Görmek İçin Tıklayın"
                            >
                              {displayName || '(İsimsiz)'}
                            </button>
                          ) : (
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => updateResultField(result.id, 'studentName', e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 font-medium text-red-600 outline outline-1 outline-red-300 rounded px-1"
                              title="Eşleşmeyen Kayıt (Düzenlenebilir / Rapor Almak İçin Soldaki Simgelere Tıklayın)"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        {userRole === 'admin' && !isMatched ? (
                          <input
                            type="text"
                            value={displayClass}
                            onChange={(e) => updateResultField(result.id, 'studentClass', e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-red-600 outline outline-1 outline-red-300 rounded"
                            title="Eşleşmeyen Kayıt (Düzenlenebilir)"
                          />
                        ) : (
                          <span className="text-[#5a5a40] font-medium">{displayClass || '-'}</span>
                        )}
                      </td>
                    {examKeys.map(key => (
                      <td key={key} className="py-2 text-center">
                         {userRole === 'admin' ? (
                           <input
                             type="number"
                             step="0.01"
                             value={result.scores[key] !== undefined ? result.scores[key] : ''}
                             onChange={(e) => updateResultScore(result.id, key, e.target.value)}
                             className="w-16 text-center mx-auto bg-[#d4d19d]/20 rounded-md border-none focus:ring-0 text-[#5a5a40] p-1 font-semibold"
                           />
                         ) : (
                           <span className="inline-block w-16 text-center font-semibold text-[#5a5a40]">
                             {result.scores[key] !== undefined ? result.scores[key] : '-'}
                           </span>
                         )}
                      </td>
                    ))}
                    <td className="py-2 text-center font-bold text-[#5a5a40]">
                      {(() => {
                        const valid = Object.values(result.scores || {}).filter(v => typeof v === 'number' && v > 0) as number[];
                        const avg = valid.length > 0 ? valid.reduce((sum, val) => sum + val, 0) / valid.length : 0;
                        return avg.toFixed(2).replace('.', ',');
                      })()}
                    </td>
                    <td className="py-2 px-2">
                      {renderBadges(matchedStudent?.badges, matchedStudent?.leagueTeam)}
                    </td>
                    {userRole === 'admin' && (
                      <td className="py-2 text-center">
                        <button onClick={() => removeResult(result.id)} className="text-[#8e8d82] hover:text-red-500 transition-colors p-1 cursor-pointer">
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      </td>
                    )}
                  </tr>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={(userRole === 'admin' ? 6 : 4) + examKeys.length} className="py-12 text-center text-[#8e8d82]">
                      {userRole === 'admin' 
                        ? 'Kayıtlı sınav sonucu bulunmuyor. Kurum Net Listesi (Excel/XML) formatında dosya yükleyebilirsiniz.' 
                        : 'Kayıtlı sınav sonucu bulunmuyor. İdareci tarafından sınav sonuçları yüklendiğinde burada görüntülenecektir.'}
                    </td>
                  </tr>
                )}
              </tbody>
            
            </table>
          </div>
          {/* Mobile Modern Cards View */}
          <div className="md:hidden flex-1 overflow-auto w-full p-3 flex flex-col gap-2.5 bg-[#F9F8F5]">
            <div className="flex items-center justify-between px-1 py-0.5 text-xs text-brand-ink/60 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-brand-ink">{filteredResults.length}</span>
                <span>öğrenci sonucu</span>
              </div>
              <span className="text-[11px] text-brand-ink/50">Profil için isme dokunun</span>
            </div>

            {filteredResults.map((result) => {
              const matchedStudent = state.students.find(s => s.no === result.studentNo);
              const isMatched = !!matchedStudent;
              const displayName = isMatched ? matchedStudent.name : result.studentName;
              const displayClass = isMatched ? matchedStudent.className : result.studentClass;
              const scoreEntries = Object.entries(result.scores || {});

              return (
                <div 
                  key={result.id} 
                  className={`bg-white rounded-2xl p-3.5 border shadow-sm flex flex-col gap-2.5 transition-all ${!isMatched ? 'border-amber-300/80 bg-amber-50/20' : 'border-brand-border/80'}`}
                >
                  {/* Card Top: Selection Checkbox + Student No + Class Badge + Actions */}
                  <div className="flex items-center justify-between gap-2 border-b border-brand-border/40 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {userRole === 'admin' && (
                        <input
                          type="checkbox"
                          checked={selectedResultIds.includes(result.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResultIds([...selectedResultIds, result.id]);
                            } else {
                              setSelectedResultIds(selectedResultIds.filter(id => id !== result.id));
                            }
                          }}
                          className="rounded border-brand-border text-[#5a5a40] focus:ring-[#5a5a40] shrink-0"
                        />
                      )}

                      <div className="bg-amber-100/90 text-amber-950 border border-amber-200/80 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold shrink-0 flex items-center gap-1 shadow-2xs">
                        <span className="text-[10px] text-amber-800/70 font-sans uppercase">No:</span>
                        <span>{result.studentNo || '-'}</span>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-bold truncate">
                        {displayClass || 'Sınıf Yok'}
                      </div>
                      {!isMatched && <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">Eşleşmedi</span>}
                    </div>

                    {userRole === 'admin' && (
                      <button 
                        onClick={() => removeResult(result.id)}
                        className="w-8 h-8 rounded-xl bg-gray-50 border border-brand-border/70 flex items-center justify-center text-brand-ink/40 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 shrink-0 cursor-pointer"
                        title="Sonucu Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card Student Name Section (Super legible, high hierarchy) */}
                  <div className="py-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentProfileId(result.id)}
                      className="font-serif font-bold text-base text-brand-ink hover:text-brand-accent text-left block w-full leading-snug break-words cursor-pointer"
                    >
                      {displayName || '(İsimsiz)'}
                    </button>
                  </div>

                  {/* Exam Scores Grid - Compact Pill Chips */}
                  {scoreEntries.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5">
                      {scoreEntries.map(([key, score]) => (
                        <div key={key} className="bg-[#FAF9F6] p-2 rounded-xl border border-brand-border/60 flex items-center justify-between gap-1">
                          <span className="text-[11px] text-brand-ink/60 font-semibold truncate" title={key}>{key}</span>
                          <span className="text-xs font-mono font-bold text-[#5a5a40] shrink-0">{(score as number).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card Bottom: Average Score + Badges */}
                  <div className="flex items-center justify-between border-t border-brand-border/50 pt-2.5 mt-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-semibold text-brand-ink/50 uppercase">Ortalama:</span>
                      <span className="font-serif text-base font-bold text-emerald-800">
                        {result.average.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 max-w-[60%] overflow-x-auto no-scrollbar">
                      {renderBadges(matchedStudent?.badges || result.badges, matchedStudent?.leagueTeam)}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredResults.length === 0 && (
              <div className="text-center py-8 text-brand-ink/50 italic bg-white rounded-2xl border border-brand-border/60 p-4">
                Sonuç bulunamadı.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Detailed Lesson Breakdown & Stats View */
        <div className="flex flex-col gap-4 sm:gap-6 flex-1">
          {/* selectors bar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-brand-border/70 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3">
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 w-full min-w-0">
                <span className="text-xs font-bold text-brand-ink/60 whitespace-nowrap shrink-0">Sınav:</span>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="bg-[#FAF9F6] border border-brand-border rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-brand-ink font-bold focus:outline-none focus:border-brand-accent w-full min-w-0 sm:max-w-[200px] truncate"
                >
                  {examKeys.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 w-full min-w-0">
                <span className="text-xs font-bold text-brand-ink/60 whitespace-nowrap shrink-0">Şube:</span>
                <select
                  value={classNameFilter}
                  onChange={(e) => setClassNameFilter(e.target.value)}
                  className="bg-[#FAF9F6] border border-brand-border rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-brand-ink font-semibold focus:outline-none focus:border-brand-accent w-full min-w-0 truncate"
                >
                  <option value="all">Tüm Şubeler</option>
                  {filteredUniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-brand-ink/60 whitespace-nowrap">Gösterim:</span>
              <div className="inline-flex bg-[#FAF9F6] p-1 rounded-xl border border-brand-border">
                <button
                  onClick={() => setDetailDisplayMode('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    detailDisplayMode === 'all'
                      ? 'bg-[#151618] text-white'
                      : 'text-brand-ink/60 hover:text-brand-ink'
                  }`}
                >
                  D/Y/B/Net
                </button>
                <button
                  onClick={() => setDetailDisplayMode('net')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    detailDisplayMode === 'net'
                      ? 'bg-[#151618] text-white'
                      : 'text-brand-ink/60 hover:text-brand-ink'
                  }`}
                >
                  Netler
                </button>
                <button
                  onClick={() => setDetailDisplayMode('dyb')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    detailDisplayMode === 'dyb'
                      ? 'bg-[#151618] text-white'
                      : 'text-brand-ink/60 hover:text-brand-ink'
                  }`}
                >
                  D/Y/B
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Core numbers */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-border/70 flex flex-col justify-between gap-3">
                <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Sınav Genel Özeti</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-brand-border/50">
                    <span className="text-[10px] font-bold text-brand-ink/50 block">Katılımcı</span>
                    <span className="text-xl font-serif font-bold text-brand-ink">{stats.count} Öğrenci</span>
                  </div>
                  <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-brand-border/50">
                    <span className="text-[10px] font-bold text-brand-ink/50 block">Puan Ort.</span>
                    <span className="text-xl font-serif font-bold text-emerald-700">{stats.averageScore.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-brand-border/50 col-span-2">
                    <span className="text-[10px] font-bold text-brand-ink/50 block">Sınav Birincisi Puanı</span>
                    <span className="text-xl font-serif font-bold text-amber-700">{stats.highestScore.toFixed(2).replace('.', ',')} / 500</span>
                  </div>
                </div>
              </div>

              {/* Lesson Net Averages */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-border/70 flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Ders Ortalamaları</h4>
                <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
                  {stats.lessonStats.map((lesson) => {
                    const percentage = (lesson.avgN / lesson.totalQ) * 100;
                    return (
                      <div key={lesson.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-brand-ink">{lesson.name}</span>
                          <span className="font-semibold text-brand-ink/60 text-[11px]">
                            <strong className="text-emerald-700">{lesson.avgN.toFixed(2).replace('.', ',')} N</strong> ({lesson.avgD.toFixed(1)}D-{lesson.avgY.toFixed(1)}Y)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full rounded-full transition-all" 
                            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Class Success List */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-border/70 flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Sınıf Sıralaması</h4>
                <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
                  {stats.classStats.map((cls, idx) => (
                    <div key={cls.name} className="flex justify-between items-center p-2 bg-[#FAF9F6] rounded-xl border border-brand-border/40 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200/50 text-[11px] font-bold text-brand-ink">{idx + 1}</span>
                        <span className="font-bold text-brand-ink">{cls.name}</span>
                        <span className="text-[10px] text-brand-ink/50">({cls.count} Öğr.)</span>
                      </div>
                      <span className="font-bold text-emerald-800">{cls.avgPuan.toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed results table */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#e6e2d3] flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-serif text-[#5a5a40] font-bold">Öğrenci Karneleri</h3>
              <div className="flex items-center bg-[#fcfbf7] border border-[#e6e2d3] rounded-full px-3 py-1 focus-within:ring-1 focus-within:ring-[#5a5a40] max-w-xs">
                <Search className="h-3.5 w-3.5 text-[#8e8d82] mr-1.5" />
                <input
                  type="text"
                  placeholder="Detaylı tabloda ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-xs text-[#5a5a40] w-full"
                />
              </div>
            </div>

            <div className="overflow-auto flex-1 w-full hidden md:block">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="text-xs text-[#8e8d82] uppercase border-b border-[#f5f5f0]">
                    <th className="py-3 font-bold pl-4 w-16">NO</th>
                    <th className="py-3 font-bold min-w-[150px]">ADI SOYADI</th>
                    <th className="py-3 font-bold w-16">SINIFI</th>
                    {availableLessonsForExam.map(lesson => (
                      <th key={lesson} className="py-3 font-bold text-center text-[#5a5a40] whitespace-nowrap px-2">{lesson}</th>
                    ))}
                    <th className="py-3 font-bold text-center text-[#5a5a40] whitespace-nowrap px-4 w-24">SINAV PUANI</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredResults
                    .filter(r => r.scores[selectedExam] !== undefined)
                    .map((result) => {
                      const examDetail = result.details?.[selectedExam];
                      const matchedStudent = state.students.find(s => s.no === result.studentNo);
                      const displayName = matchedStudent ? matchedStudent.name : result.studentName;
                      const displayClass = matchedStudent ? matchedStudent.className : result.studentClass;
                      return (
                        <tr key={result.id} className="border-b border-[#f5f5f0] hover:bg-[#fcfbf7]">
                          <td className="py-2 pl-4 font-semibold text-[#8e8d82]">
                            {result.studentNo}
                          </td>
                          <td className="py-2 font-bold text-[#5a5a40]" data-label="ADI SOYADI">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentProfileId(result.id)}
                              className="text-left w-full hover:text-amber-700 hover:underline transition-colors focus:outline-none"
                              title="Öğrenci Profili ve Gelişim Raporunu Görmek İçin Tıklayın"
                            >
                              {displayName}
                            </button>
                          </td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 bg-[#f5f5f0] rounded text-xs font-semibold text-[#8e8d82]">
                              {displayClass}
                            </span>
                          </td>
                          {availableLessonsForExam.map(lesson => (
                            <td key={lesson} className="py-2 text-center">
                              {renderLessonCell(examDetail?.lessons?.[lesson])}
                            </td>
                          ))}
                          <td className="py-2 text-center font-extrabold text-[#5a5a40]">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-100 text-xs">
                              {result.scores[selectedExam]?.toFixed(2).replace('.', ',')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {filteredResults.filter(r => r.scores[selectedExam] !== undefined).length === 0 && (
                    <tr>
                      <td colSpan={4 + availableLessonsForExam.length} className="py-12 text-center text-[#8e8d82]">
                        Bu filtreye uygun detaylı sınav sonucu bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              
              </table>
            </div>
            <div className="md:hidden flex-1 overflow-auto w-full p-4 flex flex-col gap-4 bg-brand-bg/10">
                {filteredResults
                  .filter(r => r.scores[selectedExam] !== undefined)
                  .map((result) => {
                    const examDetail = result.details?.[selectedExam];
                    const matchedStudent = state.students.find(s => s.no === result.studentNo);
                    const displayName = matchedStudent ? matchedStudent.name : result.studentName;
                    const displayClass = matchedStudent ? matchedStudent.className : result.studentClass;
                    return (
                      <div key={result.id} className="bg-white rounded-xl shadow-sm border border-[#e6e2d3] p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start border-b border-[#e6e2d3]/50 pb-3">
                          <span className="font-mono font-semibold text-[#8e8d82] text-sm">#{result.studentNo}</span>
                          <div className="text-sm text-[#8e8d82]">Sınıf: <span className="font-semibold text-[#5a5a40]">{displayClass}</span></div>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentProfileId(result.id)}
                            className="font-bold text-lg hover:text-amber-700 hover:underline text-left text-[#5a5a40]"
                          >
                            {displayName}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {availableLessonsForExam.map(lesson => {
                            let nVal = 0;
                            if (examDetail && examDetail.lessons) {
                              if (Array.isArray(examDetail.lessons)) {
                                const l = examDetail.lessons.find((x: any) => (x.name || x.lessonName) === lesson);
                                if (l) {
                                  nVal = typeof l === 'number' ? l : (l.N ?? l.n ?? l.net ?? (parseFloat(l.N || l.n || l.net || '0') || 0));
                                }
                              } else {
                                const l = examDetail.lessons[lesson];
                                if (l) {
                                  nVal = l.N ?? l.n ?? l.net ?? (parseFloat(l.N || l.n || l.net || '0') || 0);
                                }
                              }
                            }
                            return (
                              <div key={lesson} className="flex justify-between items-center bg-[#fcfbf7] p-2 rounded border border-[#e6e2d3]/50">
                                <span className="text-[10px] text-[#8e8d82] font-semibold truncate max-w-[60px]" title={lesson}>{lesson}</span>
                                <span className="text-xs font-bold text-[#5a5a40]">{nVal.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-[#e6e2d3]/50 pt-3 mt-1">
                          <span className="text-[#8e8d82] uppercase text-xs font-bold">SINAV PUANI</span>
                          <span className="text-lg font-bold text-[#5a5a40]">{(result.scores[selectedExam] || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                {filteredResults.filter(r => r.scores[selectedExam] !== undefined).length === 0 && (
                  <div className="text-center py-8 text-[#8e8d82] italic">Bu sınav için sonuç bulunamadı.</div>
                )}
              </div>
            </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-slide-up max-h-[90vh]">
            <div className="p-6 bg-[#fcfbf7] border-b border-[#e6e2d3]">
              <h3 className="text-xl font-serif text-[#5a5a40] font-bold">Sonuç Dosyasını Eşleştir</h3>
              <p className="text-xs text-[#8e8d82] mt-1">Yüklediğiniz "{importFile?.name}" dosyası hangi deneme sınavına ait?</p>
            </div>
            
            <div className="p-6 space-y-4">
              <label className="block text-sm font-bold text-[#5a5a40] mb-2">Deneme Sınavı Seçin</label>
              <select 
                value={targetExamIdForImport} 
                onChange={(e) => setTargetExamIdForImport(e.target.value)}
                className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-4 py-3 text-sm font-semibold text-[#5a5a40] focus:ring-2 focus:ring-[#d4d19d] outline-none"
              >
                <option value="" disabled>Lütfen bir sınav seçin...</option>
                {state.exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name} ({ex.date})</option>
                ))}
              </select>
              
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start text-indigo-800 text-sm">
                <HelpCircle className="h-5 w-5 mr-2 shrink-0 opacity-70" />
                <p>Eğer "Kurum Net Listesi" yüklüyorsanız, dosyadaki puan ve netler doğrudan bu seçtiğiniz sınavın altına aktarılır.</p>
              </div>
            </div>
            
            <div className="p-4 bg-[#fcfbf7] border-t border-[#e6e2d3] flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setTargetExamIdForImport('');
                }}
                className="px-5 py-2 rounded-full text-sm font-bold text-[#8e8d82] hover:text-[#5a5a40] hover:bg-[#f5f5f0] transition-all"
              >
                İptal
              </button>
              <button
                onClick={confirmImport}
                disabled={!targetExamIdForImport}
                className="px-6 py-2 rounded-full text-sm font-bold text-white bg-[#5a5a40] hover:bg-[#43423b] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                İçe Aktar
              </button>
            </div>
        </div>
          </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudentProfileId && (() => {
        const result = state.results.find(r => r.id === selectedStudentProfileId);
        if (!result) return null;
        
        const matchedStudent = state.students.find(s => s.no === result.studentNo);
        const displayName = matchedStudent ? matchedStudent.name : (result.studentName || 'İsimsiz Öğrenci');
        const displayClass = matchedStudent ? matchedStudent.className : (result.studentClass || 'Sınıf Belirtilmemiş');
        
        const CORE_LESSONS = ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "Din Kültürü", "İngilizce"];
        
        const getDisplayLessonName = (name: string): string => {
          if (!name || name.trim() === '') return '';
          const normalized = name.toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
          if (normalized.includes('toplam') || normalized.includes('genel') || normalized.includes('puan') || normalized.includes('sinif') || normalized.includes('okul') || normalized.includes('sira')) return '';
          return name.trim();
        };

        const getNet = (l: any) => {
          if (l === null || l === undefined) return 0;
          if (typeof l === 'number') return l;
          if (typeof l.N === 'number') return l.N;
          if (typeof l.n === 'number') return l.n;
          if (typeof l.net === 'number') return l.net;
          return parseFloat(l.N || l.n || l.net || '0') || 0;
        };
        
        // Calculate radar chart data (average nets per core lesson across all exams)
        const lessonStats: Record<string, { totalNet: number, count: number }> = {};
        const examList: { examName: string, puan: number, netTotal: number }[] = [];
        
        Object.entries(result.details || {}).forEach(([examName, detail]: [string, any]) => {
           let totalNetForExam = 0;
           const processedLessons = new Set<string>();
           if (detail && detail.lessons) {
             if (Array.isArray(detail.lessons)) {
               detail.lessons.forEach((l: any) => {
                 const lessonName = l.name || l.lessonName || '';
                 if (lessonName) {
                   const stdName = getDisplayLessonName(lessonName);
                   const netVal = getNet(l);
                   if (stdName && !processedLessons.has(stdName)) {
                     processedLessons.add(stdName);
                     totalNetForExam += netVal;
                     if (!lessonStats[stdName]) lessonStats[stdName] = { totalNet: 0, count: 0 };
                     lessonStats[stdName].totalNet += netVal;
                     lessonStats[stdName].count += 1;
                   }
                 }
               });
             } else {
               Object.entries(detail.lessons).forEach(([lessonName, l]: [string, any]) => {
                  const stdName = getDisplayLessonName(lessonName);
                  const netVal = getNet(l);
                  if (stdName && !processedLessons.has(stdName)) {
                    processedLessons.add(stdName);
                    totalNetForExam += netVal;
                    if (!lessonStats[stdName]) lessonStats[stdName] = { totalNet: 0, count: 0 };
                    lessonStats[stdName].totalNet += netVal;
                    lessonStats[stdName].count += 1;
                  }
               });
             }
           }
           examList.push({ examName, puan: detail.puan || result.scores[examName] || 0, netTotal: totalNetForExam });
        });
        
        // If details is empty, fallback to basic scores
        if (examList.length === 0) {
           Object.entries(result.scores || {}).forEach(([examName, score]) => {
              examList.push({ examName, puan: score as number, netTotal: 0 });
           });
        }
        
         

         const handlePrintInNewWindow = () => {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
              alert("Rapor pencerelendirilemedi! Lütfen tarayıcınızın pop-up engelleyicisini kaldırıp tekrar deneyin.");
              return;
            }

            const examCount = examList.length;
            
            // Dynamically calculate printing sizes based on exam count to guarantee exactly 1 A4 page fit
            let pTitleSize = "text-xl";
            let pSubTextSize = "text-[10px]";
            let pHeaderGap = "pb-3 mb-3";
            let pExamGridClass = "grid grid-cols-2 gap-3";
            let pExamCardPadding = "p-3";
            let pTableTextSize = "text-[9px]";
            let pTableTdPadding = "py-0.75";
            let pCoachingBoxHeight = "h-16";
            let pSignatureSpacing = "mt-4";
            
            if (examCount <= 2) {
              pTitleSize = "text-2xl";
              pSubTextSize = "text-xs";
              pHeaderGap = "pb-4 mb-4";
              pExamGridClass = "grid grid-cols-1 gap-4 max-w-2xl mx-auto";
              pExamCardPadding = "p-4";
              pTableTextSize = "text-[11px]";
              pTableTdPadding = "py-1.5";
              pCoachingBoxHeight = "h-32";
              pSignatureSpacing = "mt-6";
            } else if (examCount <= 4) {
              pTitleSize = "text-2xl";
              pSubTextSize = "text-xs";
              pHeaderGap = "pb-3 mb-3";
              pExamGridClass = "grid grid-cols-2 gap-4";
              pExamCardPadding = "p-3.5";
              pTableTextSize = "text-[10.5px]";
              pTableTdPadding = "py-1";
              pCoachingBoxHeight = "h-24";
              pSignatureSpacing = "mt-5";
            } else if (examCount <= 6) {
              pTitleSize = "text-xl";
              pSubTextSize = "text-[10px]";
              pHeaderGap = "pb-2.5 mb-2.5";
              pExamGridClass = "grid grid-cols-2 gap-3";
              pExamCardPadding = "p-3";
              pTableTextSize = "text-[9.5px]";
              pTableTdPadding = "py-0.75";
              pCoachingBoxHeight = "h-18";
              pSignatureSpacing = "mt-4";
            } else if (examCount <= 8) {
              pTitleSize = "text-lg";
              pSubTextSize = "text-[10px]";
              pHeaderGap = "pb-2 mb-2";
              pExamGridClass = "grid grid-cols-2 gap-2.5";
              pExamCardPadding = "p-2.5";
              pTableTextSize = "text-[9px]";
              pTableTdPadding = "py-0.5";
              pCoachingBoxHeight = "h-12";
              pSignatureSpacing = "mt-3";
            } else {
              pTitleSize = "text-base";
              pSubTextSize = "text-[9px]";
              pHeaderGap = "pb-1.5 mb-1.5";
              pExamGridClass = "grid grid-cols-3 gap-2";
              pExamCardPadding = "p-2";
              pTableTextSize = "text-[8px]";
              pTableTdPadding = "py-0.5";
              pCoachingBoxHeight = "h-10";
              pSignatureSpacing = "mt-2";
            }

            const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Gelisim_Raporu_${displayName.replace(/\\s+/g, '_')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      background-color: white;
      color: #3f3f2d;
    }
    .font-serif {
      font-family: 'Playfair Display', serif;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .print-page-container {
        height: 275mm;
        max-height: 275mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
        overflow: hidden;
      }
      .no-print {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 10mm 12mm 10mm 12mm;
      }
    }
  </style>
</head>
<body class="p-4 max-w-5xl mx-auto">
  <div class="print-page-container">
    <div class="flex justify-between items-center border-b border-[#e6e2d3] ${pHeaderGap}">
      <div>
        <h1 class="${pTitleSize} font-serif text-[#5a5a40] font-bold">${displayName}</h1>
        <p class="${pSubTextSize} text-[#8e8d82] font-semibold mt-1">Sınıf: ${displayClass} &nbsp;•&nbsp; Numara: ${result.studentNo || 'Belirtilmemiş'}</p>
        <span class="inline-block mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
          ★ ÖĞRENCİ KOÇLUK VE AKADEMİK GELİŞİM RAPORU
        </span>
      </div>
      <div class="text-right text-xs">
        <p class="text-[#8e8d82] font-semibold">Rapor Tarihi</p>
        <p class="text-sm font-bold text-[#5a5a40]">${new Date().toLocaleDateString('tr-TR')}</p>
      </div>
    </div>

    <div class="w-full flex-1 flex flex-col justify-between overflow-hidden">
      <div class="flex-1 overflow-hidden flex flex-col justify-start">
        <h3 class="text-xs font-bold text-[#5a5a40] uppercase tracking-wider mb-2 flex items-center border-b border-[#e6e2d3] pb-1">
          Sınav Başarı Geçmişi
        </h3>
        <div class="${pExamGridClass}">
          ${examList.map(ex => {
            const examDetail = result.details?.[ex.examName];
            const lessonsArray = examDetail && examDetail.lessons 
              ? (Array.isArray(examDetail.lessons) 
                  ? examDetail.lessons 
                  : Object.entries(examDetail.lessons).map(([name, data]: [string, any]) => ({
                      name,
                      D: data.D ?? 0,
                      Y: data.Y ?? 0,
                      B: data.B ?? 0,
                      N: data.N ?? data.n ?? data.net ?? 0
                    })))
              : [];
            
            return `
              <div class="border border-[#e6e2d3] ${pExamCardPadding} rounded-2xl bg-[#fcfbf7] shadow-sm">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-[#5a5a40] text-xs">${ex.examName}</span>
                  <div class="flex gap-2.5 text-[10px] font-semibold">
                    <span>Puan: <strong class="text-amber-700">${ex.puan.toFixed(2).replace('.', ',')}</strong></span>
                    <span>Net: <strong class="text-emerald-700">${(ex.netTotal || 0).toFixed(2).replace('.', ',')}</strong></span>
                  </div>
                </div>
                ${lessonsArray.length > 0 ? `
                  <table class="w-full text-left ${pTableTextSize}">
                    <thead>
                      <tr class="border-b border-[#e6e2d3] text-[#8e8d82] font-bold">
                        <th class="pb-0.5 text-[#5a5a40]">Ders</th>
                        <th class="pb-0.5 text-center w-8 text-emerald-600">D</th>
                        <th class="pb-0.5 text-center w-8 text-red-500">Y</th>
                        <th class="pb-0.5 text-center w-8 text-amber-500">B</th>
                        <th class="pb-0.5 text-center w-10 text-blue-600">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(() => {
                        const printedLessons = new Set<string>();
                        return lessonsArray.map(l => {
                          const stdName = getDisplayLessonName(l.name || l.lessonName || '');
                          if (!stdName) return '';
                          if (printedLessons.has(stdName)) return '';
                          printedLessons.add(stdName);
                          const nVal = getNet(l);
                          return `
                            <tr class="border-b border-[#e6e2d3]/40 text-[#5a5a40]">
                              <td class="${pTableTdPadding} font-semibold">${stdName}</td>
                              <td class="${pTableTdPadding} text-center font-bold text-emerald-600">${l.D ?? 0}</td>
                              <td class="${pTableTdPadding} text-center font-bold text-red-500">${l.Y ?? 0}</td>
                              <td class="${pTableTdPadding} text-center font-bold text-amber-500">${l.B ?? 0}</td>
                              <td class="${pTableTdPadding} text-center font-bold text-blue-600">${nVal.toFixed(2).replace('.', ',')}</td>
                            </tr>
                          `;
                        }).join('');
                      })()}
                    </tbody>
                  </table>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="border-t border-[#e6e2d3] pt-4 ${pSignatureSpacing}">
      <h4 class="text-xs font-bold text-[#5a5a40] mb-1.5">Koçluk Değerlendirme ve Görüşme Notları:</h4>
      <div class="border border-dashed border-[#e6e2d3] rounded-2xl ${pCoachingBoxHeight} mb-4"></div>
      <div class="grid grid-cols-2 gap-8 text-center text-[10px]">
        <div>
          <p class="font-semibold text-[#8e8d82]">Öğrenci Velisi</p>
          <p class="mt-4 font-bold text-[#5a5a40]">İmza</p>
        </div>
        <div>
          <p class="font-semibold text-[#8e8d82]">Sınıf Rehber Öğretmeni / Eğitim Koçu</p>
          <p class="mt-4 font-bold text-[#5a5a40]">İmza</p>
        </div>
      </div>
    </div>
  </div>

  <div class="no-print fixed bottom-6 right-6">
    <button onclick="window.print()" class="px-6 py-3 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg cursor-pointer">
      Yazdır / PDF Kaydet
    </button>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 600);
    };
  </script>
</body>
</html>
`;

           printWindow.document.write(htmlContent);
           printWindow.document.close();
         };
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 transition-opacity animate-fade-in" onClick={() => setSelectedStudentProfileId(null)}>
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                .coaching-print-area, .coaching-print-area * {
                  visibility: visible !important;
                }
                .coaching-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  color: #3f3f2d !important;
                  padding: 20px !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />

            <div 
              className="bg-[#fcfbf7] rounded-t-[28px] sm:rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full max-w-5xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-slide-up sm:animate-none coaching-print-area pb-safe sm:pb-0"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Header */}
              <div className="p-4 sm:p-6 bg-white border-b border-[#e6e2d3] flex justify-between items-center shrink-0 rounded-t-[28px] sm:rounded-t-[32px]">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl no-print">
                    {displayName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#5a5a40] font-bold">{displayName}</h2>
                    <p className="text-xs sm:text-sm text-[#8e8d82] font-semibold mt-0.5">{displayClass} • No: {result.studentNo}</p>
                    <span className="hidden print:inline-block mt-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                      ★ ÖĞRENCİ KOÇLUK VE AKADEMİK GELİŞİM RAPORU
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 no-print">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={handlePrintInNewWindow}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Rapor Al / Yazdır</span>
                      <span className="sm:hidden">Rapor</span>
                    </button>
                    <button 
                      onClick={() => setSelectedStudentProfileId(null)}
                      className="p-2 text-[#8e8d82] hover:bg-[#f5f5f0] hover:text-[#5a5a40] rounded-full transition-colors active:scale-95"
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                  <span className="hidden sm:inline text-[10px] text-[#8e8d82] font-semibold text-right max-w-[280px] leading-tight">
                    💡 Yazdır düğmesi tepki vermezse lütfen uygulamayı sağ üstten <strong>Yeni Sekmede Aç</strong> butonuyla açıp deneyin.
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 max-w-4xl mx-auto w-full">
                
                {/* Exams List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#5a5a40] uppercase tracking-wider mb-4 flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                    Sınav Geçmişi
                  </h3>
                  <p className="text-xs text-[#8e8d82] -mt-2 mb-2 font-medium no-print">
                    Detaylı ders analizi, doğru/yanlış sayılarını görmek için sınav ismine tıklayın.
                  </p>
                  
                  {examList.length > 0 ? (
                    <div className="space-y-3">
                      {examList.map((ex, idx) => {
                        const isExpanded = expandedExamName === ex.examName;
                        return (
                          <div 
                            key={idx} 
                            className={`bg-white p-4 rounded-2xl border transition-all ${isExpanded ? 'border-amber-400 shadow-md ring-1 ring-amber-300' : 'border-[#e6e2d3] hover:border-[#d4d19d] shadow-sm'} cursor-pointer`}
                            onClick={() => setExpandedExamName(isExpanded ? null : ex.examName)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-bold text-[#5a5a40] text-sm flex items-center">
                                  <FileText className="w-4 h-4 mr-1.5 text-amber-600 shrink-0" />
                                  {ex.examName}
                                </h4>
                                <p className="text-xs text-[#8e8d82] mt-1 font-semibold">
                                  Toplam Net: <span className="text-[#5a5a40] font-bold">{(ex.netTotal || 0).toFixed(2).replace('.', ',')}</span>
                                </p>
                              </div>
                              <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 text-center ml-4 shrink-0">
                                <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Puan</span>
                                <span className="block font-bold text-emerald-700 text-lg leading-none mt-1">{ex.puan.toFixed(2).replace('.', ',')}</span>
                              </div>
                            </div>

                            {/* Sub-table: lesson-by-lesson detailed D/Y/B/N metrics */}
                            {(isExpanded || window.matchMedia('print').matches) && (
                              <div className="mt-4 border-t border-[#e6e2d3]/60 pt-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-[#fcfbf7] border-b border-[#e6e2d3] text-[#8e8d82] font-bold">
                                    <tr>
                                      <th className="py-1 px-1">Ders Adı</th>
                                      <th className="py-1 px-1 text-center w-8 text-emerald-600">D</th>
                                      <th className="py-1 px-1 text-center w-8 text-red-500">Y</th>
                                      <th className="py-1 px-1 text-center w-8 text-amber-500">B</th>
                                      <th className="py-1 px-1 text-center w-10 text-blue-600">Net</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                       const examDetail = result.details?.[ex.examName];
                                       if (!examDetail || !examDetail.lessons) {
                                         return (
                                           <tr>
                                             <td colSpan={5} className="py-3 text-center text-[#8e8d82] italic">Ayrıntılı ders analiz verisi mevcut değil.</td>
                                           </tr>
                                         );
                                       }
                                       
                                       const lessonsArray = Array.isArray(examDetail.lessons) 
                                         ? examDetail.lessons 
                                         : Object.entries(examDetail.lessons).map(([name, data]: [string, any]) => ({
                                             name,
                                             D: data.D ?? 0,
                                             Y: data.Y ?? 0,
                                             B: data.B ?? 0,
                                             N: data.N ?? data.n ?? data.net ?? 0,
                                             totalQuestions: data.totalQuestions ?? 0
                                           }));
                                           
                                       const renderedLessons = new Set<string>();
                                       return lessonsArray.map((l: any, lIdx: number) => {
                                          const stdName = getDisplayLessonName(l.name || l.lessonName || '');
                                          if (!stdName) return null; // Filter out summary columns
                                          if (renderedLessons.has(stdName)) return null; // Prevent duplicates
                                          renderedLessons.add(stdName);
                                          
                                          const dVal = l.D ?? 0;
                                          const yVal = l.Y ?? 0;
                                          const bVal = l.B ?? 0;
                                          const nVal = getNet(l);
                                          return (
                                            <tr key={lIdx} className="border-b border-[#e6e2d3]/30 hover:bg-[#fcfbf7]/40 text-[#5a5a40]">
                                              <td className="py-1.5 px-1 font-semibold">{stdName}</td>
                                              <td className="py-1.5 px-1 text-center font-bold text-emerald-600">{dVal}</td>
                                              <td className="py-1.5 px-1 text-center font-bold text-red-500">{yVal}</td>
                                              <td className="py-1.5 px-1 text-center font-bold text-amber-500">{bVal}</td>
                                              <td className="py-1.5 px-1 text-center font-bold text-blue-600">{nVal.toFixed(2).replace('.', ',')}</td>
                                            </tr>
                                          );
                                       }).filter(Boolean);
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-2xl border border-[#e6e2d3] text-center">
                      <p className="text-sm text-[#8e8d82] font-semibold">Henüz sınav kaydı bulunmuyor.</p>
                    </div>
                  )}
                </div>
                
                {/* D3 Interactive Charts */}
                {examList.length > 0 && (
                  <StudentProgressCharts examList={examList} resultDetails={result.details} />
                )}
                
              </div>
          </div>
            </div>
        );
      })()}
    </div>
  );
};
