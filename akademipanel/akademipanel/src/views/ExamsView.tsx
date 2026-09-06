import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Exam } from '../types';
import { exportToExcel, importFromExcel, generateId, normalizeForSearch } from '../lib/utils';
import { 
  Upload, Download, Plus, Trash2, X, Calendar, DollarSign, Building, 
  Users, CheckSquare, Square, ExternalLink, Award, FileText, 
  MapPin, HelpCircle, Activity, TrendingUp, Sparkles, BookOpen, AlertCircle, Settings,
  Search, Filter, ChevronDown, Package, Layers, DoorOpen, Printer, Edit3
} from 'lucide-react';

const COLOR_OPTIONS = [
  { label: 'Varsayılan (Gri)', value: 'bg-gray-100' },
  { label: 'Sarı', value: 'bg-yellow-100' },
  { label: 'Turuncu', value: 'bg-orange-100' },
  { label: 'Kırmızı', value: 'bg-red-100' },
  { label: 'Pembe', value: 'bg-rose-100' },
  { label: 'Mor', value: 'bg-purple-100' },
  { label: 'Mavi', value: 'bg-blue-100' },
  { label: 'Camgöbeği', value: 'bg-cyan-100' },
  { label: 'Turkuaz', value: 'bg-teal-100' },
  { label: 'Zümrüt', value: 'bg-emerald-100' },
  { label: 'Yeşil', value: 'bg-green-100' },
  { label: 'Açık Yeşil', value: 'bg-lime-100' },
];

export const ExamsView = () => {
  const { state, setExams, setResults, setExamHalls, updateBudget, setStudents, userRole } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileRef = useRef<HTMLInputElement>(null);

  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Local modal form states
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examNo, setExamNo] = useState<number>(0);
  const [examParticipantCount, setExamParticipantCount] = useState<number>(0);
  const [examPublisher, setExamPublisher] = useState('');
  const [examPublisherFee, setExamPublisherFee] = useState<number>(0);
  const [examOrderQuantity, setExamOrderQuantity] = useState<number>(0);
  const [examGradeOrderQuantities, setExamGradeOrderQuantities] = useState<Record<string, number>>({});
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedHalls, setSelectedHalls] = useState<string[]>([]);

  // Search filter and manual score states in modal
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualStudentScore, setManualStudentScore] = useState('');

  // Sınıf filtresi, arama ve sıralama durumu
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('Tümü');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'no-asc' | 'no-desc' | 'name-asc'>('date-asc');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  
  // Takvim yazdırma başlıkları (elle düzenlenebilir)
  const [printMainTitle, setPrintMainTitle] = useState('KIRKLARELİ ATATÜRK ORTAOKULU');
  const [printSubTitle, setPrintSubTitle] = useState('2025-2026 EĞİTİM ÖĞRETİM YILI DENEME SINAVLARI TAKVİMİ');

  const [printSettings, setPrintSettings] = useState({
    showPublisher: false,
    showParticipants: true,
    showOrderQuantity: false,
    showHalls: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
    pageCount: '1' as '1' | '2' | 'auto',
  });
  
  const [publisherColors, setPublisherColors] = useState<Record<string, string>>({});

  // Sınıf filtresi değiştiğinde alt başlığı da akıllı güncelle
  const handleFilterGradeChange = (newGrade: string) => {
    setFilterGrade(newGrade);
    setPrintSubTitle(
      newGrade !== 'Tümü'
        ? `2025-2026 EĞİTİM ÖĞRETİM YILI DENEME SINAVLARI TAKVİMİ (${newGrade}. SINIFLAR)`
        : '2025-2026 EĞİTİM ÖĞRETİM YILI DENEME SINAVLARI TAKVİMİ'
    );
  };

  // Sync state when modal is opened
  useEffect(() => {
    if (editingExam) {
      setExamName(editingExam.name || '');
      setExamDate(editingExam.date || '');
      setExamNo(editingExam.no || 0);
      setExamParticipantCount(editingExam.participantCount || 0);
      setExamPublisher(editingExam.publisher || '');
      setExamPublisherFee(editingExam.publisherFee || 0);
      setExamOrderQuantity(editingExam.orderQuantity || 0);
      setExamGradeOrderQuantities(editingExam.gradeOrderQuantities || {});
      setSelectedClasses(editingExam.participatingClasses || []);
      setSelectedHalls(editingExam.assignedHalls || []);
      setResultsSearchQuery('');
      setManualStudentId('');
      setManualStudentScore('');
    }
  }, [editingExam]);

  const handleGradeOrderQuantityChange = (lvl: string, val: number) => {
    const updated: Record<string, number> = {
      ...examGradeOrderQuantities,
      [lvl]: val
    };
    setExamGradeOrderQuantities(updated);
    
    // Sum them up to set total order quantity
    const total = Object.values(updated).reduce((sum: number, current: number) => sum + current, 0);
    setExamOrderQuantity(total);
  };

  // Unique classes compiled from students & results
  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    state.students.forEach(s => {
      if (s.className) classes.add(s.className.trim());
    });
    state.results.forEach(r => {
      if (r.studentClass) classes.add(r.studentClass.trim());
    });
    return Array.from(classes).sort();
  }, [state.students, state.results]);

  // Unique grade levels compiled from uniqueClasses
  const availableGradeLevels = useMemo(() => {
    const levels = new Set<string>();
    uniqueClasses.forEach(cls => {
      const match = cls.trim().match(/^(\d+)/);
      if (match) {
        levels.add(match[1]);
      } else {
        levels.add('Diğer');
      }
    });
    return Array.from(levels).sort((a, b) => {
      if (a === 'Diğer') return 1;
      if (b === 'Diğer') return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [uniqueClasses]);

  // Sort and filter exams
  const filteredAndSortedExams = useMemo(() => {
    let result = [...state.exams];
    
    // Arama filtresi
    if (searchQuery.trim()) {
      const q = normalizeForSearch(searchQuery);
      result = result.filter(e => 
        normalizeForSearch(e.name || '').includes(q) || 
        normalizeForSearch(e.publisher || '').includes(q) ||
        (e.date && e.date.includes(searchQuery.trim())) ||
        (e.no && e.no.toString().includes(searchQuery.trim()))
      );
    }

    // Katılan sınıf seviyesine göre filtrele (Deneme sınav kartındaki katılacak sınıf seviyeleri)
    if (filterGrade !== 'Tümü') {
      result = result.filter(e => {
        const grades = e.participatingClasses || [];
        if (grades.length > 0) {
          return grades.includes(filterGrade);
        }
        // Eğer sınav kartında sınıf seçimi yapılmamışsa, sınav adında geçen seviyeyi kontrol et
        if (e.name) {
          const norm = e.name.toLowerCase();
          if (norm.includes(`${filterGrade}. sınıf`) || norm.includes(`${filterGrade}.sınıf`) || norm.includes(`${filterGrade}/`)) {
            return true;
          }
        }
        return false;
      });
    }

    // Tarihe göre sırala
    const parseDate = (dateStr: string) => {
       if (!dateStr) return 0;
       
       const clean = dateStr.trim();
       
       // Handle standard DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
       const delimiterMatch = clean.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
       if (delimiterMatch) {
         const day = parseInt(delimiterMatch[1], 10);
         const month = parseInt(delimiterMatch[2], 10);
         let year = parseInt(delimiterMatch[3], 10);
         if (year < 100) year += 2000;
         if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month - 1, day).getTime();
         }
       }
       
       // Handle TR natural language dates like "6 Mart 2026 Cuma", "15 Ekim 2025"
       const monthsTR: Record<string, number> = {
         'ocak': 0, 'şubat': 1, 'subat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'mayis': 4,
         'haziran': 5, 'temmuz': 6, 'ağustos': 7, 'agustos': 7, 'eylül': 8, 'eylul': 8,
         'ekim': 9, 'kasım': 10, 'kasim': 10, 'aralık': 11, 'aralik': 11
       };
       const cleanStr = clean.toLowerCase().replace(/[^a-z0-9şğüöçı]/g, ' ');
       const tokens = cleanStr.split(/\s+/).filter(Boolean);
       let day = 1;
       let month = 0;
       let year = 0;
       
       tokens.forEach(token => {
         if (/^\d{1,2}$/.test(token) && parseInt(token, 10) <= 31 && day === 1) {
            day = parseInt(token, 10);
         } else if (/^\d{4}$/.test(token)) {
            year = parseInt(token, 10);
         } else if (monthsTR[token] !== undefined) {
            month = monthsTR[token];
         }
       });
       
       if (year > 0) {
         return new Date(year, month, day).getTime();
       }

       const d = new Date(dateStr);
       return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    result.sort((a, b) => {
      if (sortBy === 'date-asc') {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        // Tarihi olanlar en yakın tarihten en uzak tarihe (kronolojik artan)
        if (dateA > 0 && dateB > 0) {
          if (dateA !== dateB) return dateA - dateB;
          return (a.no || 0) - (b.no || 0);
        }
        // Tarihi girilmiş olanlar önce, tarihi henüz girilmemiş olanlar sonda
        if (dateA > 0 && dateB === 0) return -1;
        if (dateB > 0 && dateA === 0) return 1;
        return (a.no || 0) - (b.no || 0);
      }
      
      if (sortBy === 'date-desc') {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        if (dateA > 0 && dateB > 0) {
          if (dateA !== dateB) return dateB - dateA;
          return (b.no || 0) - (a.no || 0);
        }
        if (dateA > 0 && dateB === 0) return -1;
        if (dateB > 0 && dateA === 0) return 1;
        return (b.no || 0) - (a.no || 0);
      }
      
      if (sortBy === 'no-asc') {
        return (a.no || 0) - (b.no || 0);
      }
      
      if (sortBy === 'no-desc') {
        return (b.no || 0) - (a.no || 0);
      }
      
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '', 'tr');
      }

      return 0;
    });

    return result;
  }, [state.exams, filterGrade, searchQuery, sortBy]);

  const uniquePublishers = useMemo(() => {
    const pubs = new Set<string>();
    filteredAndSortedExams.forEach(e => {
      if (e.publisher) pubs.add(e.publisher.trim());
    });
    return Array.from(pubs).sort();
  }, [filteredAndSortedExams]);

  // Dinamik takvim yazdırma ve önizleme ölçü hesaplamaları (otomatik senkronize)
  const examCount = filteredAndSortedExams.length;
  const isLandscape = printSettings.orientation === 'landscape';
  const targetPages = printSettings.pageCount === 'auto' ? 'auto' : parseInt(printSettings.pageCount, 10);

  // A4 kullanılabilir alan hesaplaması (daraltılmış başlık ve sıkı satır aralıkları ile)
  // A4 Portrait yükseklik: 297mm - 10mm kenar boşluğu = 287mm. Başlık: ~8mm. Kullanılabilir tablo: ~274mm
  // A4 Landscape yükseklik: 210mm - 10mm kenar boşluğu = 200mm. Başlık: ~8mm. Kullanılabilir tablo: ~188mm
  const usablePageHeightMm = isLandscape ? 186 : 272;
  const totalTableAreaMm = targetPages === 'auto' 
    ? examCount * (isLandscape ? 8.5 : 10) 
    : usablePageHeightMm * (typeof targetPages === 'number' ? targetPages : 1);

  const optimalRowHeightMm = examCount > 0 
    ? Math.min(isLandscape ? 14 : 18, Math.max(5.5, Math.floor((totalTableAreaMm / Math.max(examCount, 1)) * 10) / 10)) 
    : 10;

  const optimalFontSizePt = examCount <= 12 
    ? (isLandscape ? '10pt' : '10.5pt') 
    : examCount <= 16 
    ? (isLandscape ? '9pt' : '9.5pt') 
    : examCount <= 24 
    ? '8.5pt' 
    : '7.5pt';

  const optimalHeaderFontSizePt = examCount <= 16 ? (isLandscape ? '9.5pt' : '10pt') : '8.5pt';
  const maxPageHeightPx = isLandscape ? 730 : 1060;

  const handlePrint = () => {
    const printContent = document.getElementById('print-area-takvim');
    if (!printContent) {
      window.print();
      return;
    }
    
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Deneme Sınavları Takvimi - Kırklareli Atatürk Ortaokulu</title>
              <style>
                @page {
                  size: A4 ${isLandscape ? 'landscape' : 'portrait'};
                  margin: 5mm 5mm 5mm 5mm;
                }
                * {
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  background-color: #ffffff;
                  color: #000000;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .takvim-page-wrapper {
                  width: 100%;
                  ${targetPages === 1 ? `height: ${isLandscape ? '198mm' : '286mm'}; max-height: ${isLandscape ? '198mm' : '286mm'};` : ''}
                  margin: 0 auto;
                  padding: 0;
                  display: flex;
                  flex-direction: column;
                  justify-content: flex-start;
                  box-sizing: border-box;
                  ${targetPages === 1 ? 'page-break-inside: avoid; break-inside: avoid; overflow: hidden;' : ''}
                }
                .takvim-header {
                  flex-shrink: 0;
                  text-align: center;
                  margin-bottom: 2px;
                  padding-bottom: 2px;
                  border-bottom: 1.5px solid #000000;
                }
                .takvim-title-main {
                  font-size: ${isLandscape ? '12pt' : '13pt'};
                  font-weight: 900;
                  text-transform: uppercase;
                  margin: 0 0 1px 0;
                  line-height: 1.15;
                  letter-spacing: 0.3px;
                  color: #111827;
                }
                .takvim-title-sub {
                  font-size: ${isLandscape ? '9pt' : '9.5pt'};
                  font-weight: 800;
                  text-transform: uppercase;
                  color: #374151;
                  line-height: 1.15;
                  margin: 0;
                }
                .takvim-table-wrapper {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  width: 100%;
                  ${targetPages === 1 ? 'height: 100%; min-height: 0;' : ''}
                }
                table.takvim-table {
                  width: 100%;
                  ${targetPages === 1 ? 'height: 100%; flex: 1;' : ''}
                  border-collapse: collapse;
                  border: 1.5px solid #000000;
                  table-layout: fixed;
                }
                table.takvim-table thead tr {
                  height: 24px;
                }
                table.takvim-table th {
                  border: 1.5px solid #000000;
                  background-color: #e5e7eb !important;
                  font-weight: 800;
                  font-size: ${optimalHeaderFontSizePt};
                  line-height: 1.1;
                  padding: 2px 3px;
                  text-align: center;
                  vertical-align: middle;
                }
                table.takvim-table tbody {
                  ${targetPages === 1 ? 'height: calc(100% - 24px);' : ''}
                }
                table.takvim-table tbody tr {
                  height: ${optimalRowHeightMm}mm;
                  min-height: ${optimalRowHeightMm}mm;
                }
                table.takvim-table td {
                  border: 1.5px solid #000000;
                  padding: 1.5px 4px;
                  text-align: center;
                  vertical-align: middle;
                  font-size: ${optimalFontSizePt};
                  line-height: 1.15;
                }
                td.col-no {
                  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                  font-weight: 900;
                  font-size: ${optimalFontSizePt};
                  width: ${isLandscape ? '40px' : '44px'};
                }
                td.col-date {
                  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                  font-weight: 700;
                  font-size: ${optimalFontSizePt};
                  white-space: nowrap;
                  width: ${isLandscape ? '145px' : '155px'};
                  padding: 1.5px 3px;
                }
                td.col-name {
                  text-align: left;
                  padding-left: 6px;
                  padding-right: 4px;
                  font-weight: 700;
                  font-size: ${optimalFontSizePt};
                  line-height: 1.2;
                  color: #1e1b4b;
                }
                td.col-order {
                  font-weight: 800;
                  font-size: ${optimalFontSizePt};
                  width: ${isLandscape ? '46px' : '50px'};
                }
                td.col-halls {
                  font-size: 8pt;
                  line-height: 1.1;
                  width: ${isLandscape ? '95px' : '105px'};
                }
                td.col-participants {
                  background-color: #dc2626 !important;
                  color: #ffffff !important;
                  font-weight: 900;
                  font-size: ${optimalFontSizePt};
                  width: ${isLandscape ? '55px' : '60px'};
                }
                
                /* Publisher Background Colors */
                .bg-gray-100 { background-color: #f3f4f6 !important; }
                .bg-yellow-100 { background-color: #fef9c3 !important; }
                .bg-orange-100 { background-color: #ffedd5 !important; }
                .bg-red-100 { background-color: #fee2e2 !important; }
                .bg-rose-100 { background-color: #ffe4e6 !important; }
                .bg-purple-100 { background-color: #f3e8ff !important; }
                .bg-blue-100 { background-color: #dbeafe !important; }
                .bg-cyan-100 { background-color: #cffafe !important; }
                .bg-teal-100 { background-color: #ccfbf1 !important; }
                .bg-emerald-100 { background-color: #d1fae5 !important; }
                .bg-green-100 { background-color: #dcfce7 !important; }
                .bg-lime-100 { background-color: #ecfccb !important; }
                .bg-amber-100 { background-color: #fef3c7 !important; }
                .bg-indigo-100 { background-color: #e0e7ff !important; }
                .bg-fuchsia-100 { background-color: #fae8ff !important; }
                
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  ${targetPages === 1 ? `
                  .takvim-page-wrapper {
                    height: ${isLandscape ? '198mm' : '286mm'};
                    max-height: ${isLandscape ? '198mm' : '286mm'};
                  }
                  ` : ''}
                  tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                }
              </style>
            </head>
            <body>
              <div id="takvim-print-wrapper" class="takvim-page-wrapper">
                <div class="takvim-header">
                  <h2 class="takvim-title-main">${printMainTitle || 'KIRKLARELİ ATATÜRK ORTAOKULU'}</h2>
                  <p class="takvim-title-sub">${printSubTitle || '2025-2026 EĞİTİM ÖĞRETİM YILI DENEME SINAVLARI TAKVİMİ'}</p>
                </div>
                <div class="takvim-table-wrapper">
                  ${document.querySelector('#print-area-takvim .takvim-table-wrapper')?.innerHTML || ''}
                </div>
              </div>
              <script>
                function ensureFit() {
                  const wrapper = document.getElementById('takvim-print-wrapper');
                  if (!wrapper) return;
                  const isOnePage = ${targetPages === 1};
                  if (isOnePage) {
                    const maxPageHeight = ${maxPageHeightPx};
                    const currentHeight = wrapper.offsetHeight || wrapper.scrollHeight;
                    if (currentHeight > maxPageHeight) {
                      const ratio = Math.floor((maxPageHeight / currentHeight) * 100) / 100;
                      wrapper.style.transform = 'scale(' + Math.max(0.60, ratio) + ')';
                      wrapper.style.transformOrigin = 'top center';
                    }
                  }
                }
                window.onload = function() {
                  ensureFit();
                  setTimeout(function() {
                    window.print();
                    window.close();
                  }, 250);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (e) {
      alert("Yazdırma işlemi önizlemede engellenmiş olabilir. Lütfen uygulamayı yeni sekmede açarak deneyin.");
    }
  };

  // Query actual results matching this specific exam
  const originalExamName = editingExam ? editingExam.name : '';
  const examResults = useMemo(() => {
    if (!originalExamName) return [];
    return state.results.filter(r => r.scores[originalExamName] !== undefined);
  }, [state.results, originalExamName]);

  // Calculate stats for these results
  const resultStats = useMemo(() => {
    if (examResults.length === 0) return null;
    const scores = examResults.map(r => r.scores[originalExamName]);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / examResults.length;
    return { count: examResults.length, max, min, avg };
  }, [examResults, originalExamName]);

  // Filter exam results list inside modal
  const filteredExamResults = useMemo(() => {
    return examResults.filter(r => {
      const query = normalizeForSearch(resultsSearchQuery);
      return normalizeForSearch(r.studentName).includes(query) || r.studentNo.toString().includes(resultsSearchQuery);
    });
  }, [examResults, resultsSearchQuery]);

  // Eligible students for manual score entry (students in participating classes who don't have a score)
  const eligibleStudentsForManualScore = useMemo(() => {
    if (selectedClasses.length === 0) return [];
    return state.students.filter(s => {
      const studentGrade = s.className ? (s.className.trim().match(/^(\d+)/)?.[1] || 'Diğer') : 'Diğer';
      return selectedClasses.includes(studentGrade) && 
             !examResults.some(r => r.studentNo === s.no);
    }).sort((a, b) => a.no - b.no);
  }, [state.students, selectedClasses, examResults]);

  // Import mock exams list from main dashboard Excel
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFromExcel(file, (data) => {
        const newExams: Exam[] = data.map((row: any) => ({
          id: generateId(),
          no: parseInt(row['ÖLÇME'] || row['ölçme'] || row['No'] || '0'),
          date: row['TARİH'] || row['Tarih'] || row['date'] || '',
          name: row['8. SINIF'] || row['8. Sınıf'] || row['Deneme'] || '',
          participantCount: parseInt(row['KATILAN KİŞİ'] || row['Katılan Kişi'] || '0'),
          publisher: row['Yayıncı'] || row['YAYINCI'] || '',
          publisherFee: parseFloat(row['Ücret'] || row['ÜCRET'] || '0') || 0,
          orderQuantity: parseInt(row['Sipariş'] || row['SİPARİŞ'] || '0') || 0,
          participatingClasses: [],
          assignedHalls: []
        }));
        setExams([...state.exams, ...newExams]);
      });
    }
  };

  // Export mock exams to Excel
  const handleExport = () => {
    const dataToExport = state.exams.map(e => ({
      'ÖLÇME': e.no,
      'TARİH': e.date,
      'SINAV ADI': e.name,
      'YAYINCI': e.publisher || '',
      'YAYINCI ÜCRETİ': e.publisherFee || 0,
      'SİPARİŞ MİKTARI': e.orderQuantity || 0,
      'TOPLAM GİDER': (e.publisherFee || 0) * (e.orderQuantity || 0),
      'KATILAN KİŞİ': e.participantCount,
      'KATILACAK SINIFLAR': (e.participatingClasses || []).map(g => g === 'Diğer' ? 'Diğer Sınıflar' : `${g}. Sınıf`).join(', ')
    }));
    exportToExcel(dataToExport, 'deneme_sinavlari_detayli');
  };

  // Add a brand-new blank exam
  const addEmptyExam = () => {
    const maxNo = state.exams.reduce((max, e) => Math.max(max, e.no || 0), 0);
    const nextNo = maxNo > 0 ? maxNo + 1 : state.exams.length + 1;
    setExams([...state.exams, { 
      id: generateId(), 
      no: nextNo, 
      date: '', 
      name: `Yeni Deneme Sınavı ${nextNo}`, 
      participantCount: 0,
      publisher: '',
      publisherFee: 0,
      orderQuantity: 0,
      participatingClasses: [],
      assignedHalls: []
    }]);
  };

  // Quick edit directly in the table row
  const updateExam = (id: string, field: keyof Exam, value: string | number) => {
    setExams(state.exams.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Remove mock exam
  const removeExam = (id: string) => {
    setExams(state.exams.filter(e => e.id !== id));
  };

  const syncExamNameInResults = (oldName: string, newName: string) => {
    const updatedResults = state.results.map(r => {
      let scoresChanged = false;
      let detailsChanged = false;
      const newScores = { ...r.scores };
      let newDetails = r.details ? { ...r.details } : undefined;

      if (newScores[oldName] !== undefined) {
        newScores[newName] = newScores[oldName];
        delete newScores[oldName];
        scoresChanged = true;
      }

      if (newDetails && newDetails[oldName] !== undefined) {
        newDetails[newName] = newDetails[oldName];
        delete newDetails[oldName];
        detailsChanged = true;
      }

      if (scoresChanged || detailsChanged) {
        const values = Object.values(newScores) as number[];
        const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return {
          ...r,
          scores: newScores,
          details: newDetails,
          average
        };
      }
      return r;
    });
    setResults(updatedResults);
  };

  // Save changes from the details modal
  const handleSaveChanges = () => {
    if (!examName.trim()) {
      alert("Lütfen sınav adı giriniz.");
      return;
    }

    const oldName = editingExam!.name;
    const newName = examName.trim();

    // 1. Update the exam inside state.exams
    const updatedExams = state.exams.map(e => {
      if (e.id === editingExam!.id) {
        return {
          ...e,
          no: examNo,
          date: examDate,
          name: newName,
          participantCount: examParticipantCount || examResults.length,
          publisher: examPublisher.trim(),
          publisherFee: examPublisherFee,
          orderQuantity: examOrderQuantity,
          gradeOrderQuantities: examGradeOrderQuantities,
          participatingClasses: selectedClasses,
          assignedHalls: selectedHalls
        };
      }
      return e;
    });
    setExams(updatedExams);

    // 2. Results key name sync
    if (oldName !== newName) {
      syncExamNameInResults(oldName, newName);
    }

    setEditingExam(null);
    alert(`"${newName}" sınavı detayları başarıyla kaydedildi ve bütçe, sonuçlar, sınıflar ve salonlarla senkronize edildi!`);
  };

  // Inside modal: update a student's score inline
  const handleUpdateScoreInModal = (resultId: string, newScoreStr: string) => {
    const score = parseFloat(newScoreStr) || 0;
    setResults(state.results.map(r => {
      if (r.id === resultId) {
        const newScores = { ...r.scores, [originalExamName]: score };
        const values = Object.values(newScores) as number[];
        const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return { ...r, scores: newScores, average };
      }
      return r;
    }));
  };

  // Inside modal: delete a student's score for this exam
  const handleDeleteScoreInModal = (resultId: string) => {
    setResults(state.results.map(r => {
      if (r.id === resultId) {
        const newScores = { ...r.scores };
        delete newScores[originalExamName];
        
        const newDetails = r.details ? { ...r.details } : undefined;
        if (newDetails) {
          delete newDetails[originalExamName];
        }

        const values = Object.values(newScores) as number[];
        const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return { ...r, scores: newScores, details: newDetails, average };
      }
      return r;
    }));
  };

  // Inside modal: add manual student score
  const handleAddManualScore = () => {
    if (!manualStudentId) {
      alert("Lütfen öğrenci seçiniz.");
      return;
    }
    const scoreVal = parseFloat(manualStudentScore);
    if (isNaN(scoreVal)) {
      alert("Lütfen geçerli bir puan giriniz.");
      return;
    }

    const student = state.students.find(s => s.id === manualStudentId);
    if (!student) return;

    const existingResultIndex = state.results.findIndex(r => r.studentNo === student.no);
    let updatedResults = [...state.results];

    if (existingResultIndex !== -1) {
      const r = updatedResults[existingResultIndex];
      const newScores = { ...r.scores, [originalExamName]: scoreVal };
      const values = Object.values(newScores) as number[];
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

      updatedResults[existingResultIndex] = {
        ...r,
        scores: newScores,
        average
      };
    } else {
      updatedResults.push({
        id: generateId(),
        studentId: student.id,
        studentNo: student.no,
        studentName: student.name,
        studentClass: student.className,
        scores: { [originalExamName]: scoreVal },
        average: scoreVal
      });
    }

    setResults(updatedResults);
    setManualStudentId('');
    setManualStudentScore('');
    alert(`${student.name} için ${scoreVal} puanı sınav sonuçlarına kaydedildi.`);
  };

  // Inside modal: upload Excel scores sheet
  const handleUploadResultsForExam = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingExam) {
      const examNameKey = editingExam.name;
      importFromExcel(file, (data) => {
        let updatedResults = [...state.results];
        let importedCount = 0;

        data.forEach((rawRow: any) => {
          const row: any = {};
          Object.keys(rawRow).forEach(k => {
            row[k.toString().trim().toUpperCase()] = rawRow[k];
          });

          let studentNo = parseInt(row['NO'] || row['ÖĞRENCİ NO'] || row['ÖĞR. NO'] || row['ÖĞR.NO'] || row['NUMARA'] || row['ÖĞRENCİ NUMARASI'] || '0');
          
          const name = (row['ADI SOYADI'] || row['ADI'] || row['SOYADI'] || row['AD SOYAD'] || row['İSİM'] || row['NAME'] || '').toString().trim();
          const className = (row['SINIFI'] || row['SINIF'] || row['ŞUBE'] || row['CLASS'] || '').toString().trim();
          
          let existingSystemStudent = state.students.find(s => s.no === studentNo && studentNo !== 0);
          
          if (!existingSystemStudent && name) {
             existingSystemStudent = state.students.find(s => s.name.toLowerCase() === name.toLowerCase());
             if (existingSystemStudent) {
                 studentNo = existingSystemStudent.no;
             }
          }
          
          if (!studentNo && !name) return;

          // Puan lookup in row keys
          let score = 0;
          const scoreKeys = ['PUAN', 'Puan', 'puan', 'SCORE', 'Score', 'Skor', 'SKOR', examNameKey];
          for (const key of scoreKeys) {
            if (row[key] !== undefined) {
              score = parseFloat(row[key]) || 0;
              break;
            }
          }
          if (score === 0) {
            Object.entries(row).forEach(([k, v]) => {
              if (k.toLowerCase().includes('puan') || k.toLowerCase().includes('score') || k.toLowerCase().includes('net')) {
                score = parseFloat(v as any) || 0;
              }
            });
          }

          const nameToUse = existingSystemStudent ? existingSystemStudent.name : name;
          const classToUse = existingSystemStudent ? existingSystemStudent.className : className;

          const existingResultIndex = updatedResults.findIndex(r => r.studentNo === studentNo);

          if (existingResultIndex !== -1) {
            const r = updatedResults[existingResultIndex];
            const newScores = { ...r.scores, [examNameKey]: score };
            const values = Object.values(newScores) as number[];
            const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

            updatedResults[existingResultIndex] = {
              ...r,
              studentName: nameToUse,
              studentClass: classToUse,
              scores: newScores,
              average
            };
          } else {
            updatedResults.push({
              id: generateId(),
              studentId: existingSystemStudent?.id || generateId(),
              studentNo: studentNo,
              studentName: nameToUse,
              studentClass: classToUse,
              scores: { [examNameKey]: score },
              average: score
            });
          }
          importedCount++;
        });

        setResults(updatedResults);
        alert(`"${examNameKey}" sınavı için ${importedCount} öğrenci sonucu başarıyla güncellendi/eklendi!`);
      });
    }
    if (modalFileRef.current) modalFileRef.current.value = '';
  };

  // Helper info calculations
  const totalStudentsInSelectedClasses = useMemo(() => {
    return state.students.filter(s => {
      const studentGrade = s.className ? (s.className.trim().match(/^(\d+)/)?.[1] || 'Diğer') : 'Diğer';
      return selectedClasses.includes(studentGrade);
    }).length;
  }, [state.students, selectedClasses]);

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return '';
    let dateObj: Date | null = null;
    
    const parts = dateStr.trim().split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
         dateObj = new Date(year, month - 1, day);
      }
    } else {
       const monthsTR: Record<string, number> = {
         'ocak': 0, 'şubat': 1, 'subat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'mayis': 4,
         'haziran': 5, 'temmuz': 6, 'ağustos': 7, 'agustos': 7, 'eylül': 8, 'eylul': 8,
         'ekim': 9, 'kasım': 10, 'kasim': 10, 'aralık': 11, 'aralik': 11
       };
       const cleanStr = dateStr.toLowerCase().replace(/[^a-z0-9şğüöçı]/g, ' ');
       const tokens = cleanStr.split(/\s+/).filter(Boolean);
       let day = 1;
       let month = 0;
       let year = 0;
       
       tokens.forEach(token => {
         if (/^\d{1,2}$/.test(token) && parseInt(token) <= 31) {
            day = parseInt(token);
         } else if (/^\d{4}$/.test(token)) {
            year = parseInt(token);
         } else if (monthsTR[token] !== undefined) {
            month = monthsTR[token];
         }
       });
       
       if (year > 0) {
         dateObj = new Date(year, month, day);
       }
    }
    
    if (dateObj && !isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      });
    }
    return dateStr;
  };

  // Total participants registered across filtered exams
  const totalRegisteredParticipants = useMemo(() => {
    return filteredAndSortedExams.reduce((sum, exam) => {
      const regCount = state.students.filter(s => s.examRegistrations?.some(r => r.examId === exam.id)).length;
      return sum + regCount;
    }, 0);
  }, [filteredAndSortedExams, state.students]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 flex flex-col h-full relative font-sans text-brand-ink">
      {/* Upper header action bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center sm:hidden shrink-0 font-bold">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-ink font-bold tracking-tight leading-tight">Deneme Sınavları</h2>
          </div>
          <p className="text-brand-ink/60 text-xs sm:text-sm mt-0.5">Yıllık sınav takvimi, yayıncı ödemeleri, katılım sınıfları ve salon senkronizasyonu</p>
        </div>
        
        {/* Action Buttons: Touch-Friendly 2x2 Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto py-0.5">
          <button 
            onClick={() => setIsPrintModalOpen(true)} 
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 bg-white border border-brand-border text-[11px] sm:text-xs font-bold text-brand-ink rounded-xl transition-all hover:bg-[#FAF9F6] active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
            title="Sınav Takvimi Raporu Yazdır"
          >
            <Printer className="w-3.5 h-3.5 text-brand-ink/70 shrink-0" />
            <span className="truncate">Yazdır</span>
          </button>
          
          {userRole === 'admin' && (
            <>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 bg-white border border-brand-border text-[11px] sm:text-xs font-bold text-brand-ink rounded-xl transition-all hover:bg-[#FAF9F6] active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
                title="Excel'den İçe Aktar"
              >
                <Upload className="w-3.5 h-3.5 text-brand-ink/70 shrink-0" />
                <span className="truncate">İçe Aktar</span>
              </button>

              <button 
                onClick={handleExport} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 bg-white border border-brand-border text-[11px] sm:text-xs font-bold text-brand-ink rounded-xl transition-all hover:bg-[#FAF9F6] active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
                title="Excel'e Dışa Aktar"
              >
                <Download className="w-3.5 h-3.5 text-brand-ink/70 shrink-0" />
                <span className="truncate">Dışa Aktar</span>
              </button>

              <button 
                onClick={addEmptyExam} 
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 bg-[#151618] border border-[#151618] text-white text-[11px] sm:text-xs font-bold rounded-xl transition-all hover:bg-black active:scale-95 shadow-xs cursor-pointer min-w-0 w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">+ Yeni Sınav</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Summary Stats - Compact 2x2 on Mobile, 4 Cols on Desktop */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {/* Stat 1: Listelenen Sınav */}
        <div className="bg-white p-3 sm:p-4 md:p-5 border border-brand-border/70 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:border-brand-accent/50">
          <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Listelenen Sınav</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-brand-ink leading-none">{filteredAndSortedExams.length}</span>
            <span className="text-[10px] sm:text-xs text-brand-ink/50 font-medium">sınav</span>
          </div>
        </div>

        {/* Stat 2: Toplam Sipariş Adedi */}
        <div className="bg-white p-3 sm:p-4 md:p-5 border border-brand-border/70 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:border-brand-accent/50">
          <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Toplam Sipariş</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-brand-ink leading-none">
              {filteredAndSortedExams.reduce((sum, e) => sum + (e.orderQuantity || 0), 0)}
            </span>
            <span className="text-[10px] sm:text-xs text-brand-ink/50 font-medium">adet</span>
          </div>
        </div>

        {/* Stat 3: Toplam Yayıncı Maliyeti */}
        <div className="bg-white p-3 sm:p-4 md:p-5 border border-brand-border/70 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:border-amber-300">
          <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Yayıncı Maliyeti</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-brand-accent leading-none">
            ₺{filteredAndSortedExams.reduce((sum, e) => sum + ((e.publisherFee || 0) * (e.orderQuantity || 0)), 0).toLocaleString('tr-TR')}
          </span>
        </div>

        {/* Stat 4: Aktif Kayıtlı Katılım */}
        <div className="bg-white p-3 sm:p-4 md:p-5 border border-brand-border/70 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:border-emerald-300">
          <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-brand-ink/60 uppercase tracking-wider truncate">Kayıtlı Katılım</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700 leading-none">{totalRegisteredParticipants}</span>
            <span className="text-[10px] sm:text-xs text-emerald-600/70 font-medium">öğrenci</span>
          </div>
        </div>
      </section>

      {/* Filter Bar - Modern, Ergonomic, Mobile-Optimized */}
      <section className="bg-white p-3 sm:p-4 rounded-2xl border border-brand-border/70 shadow-sm flex flex-col gap-2.5 sm:gap-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40 h-4 w-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Sınav adı, yayıncı veya tarih ile ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F4F0] border border-transparent rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-brand-ink placeholder-brand-ink/40 font-medium focus:bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 focus:outline-none transition-all"
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

          {/* Grade & Sort Filter Dropdowns */}
          <div className="flex flex-wrap gap-2 items-center overflow-x-auto no-scrollbar shrink-0 py-0.5">
            {/* Grade Filter */}
            <div className="relative shrink-0">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 border border-brand-border/80 text-xs bg-white rounded-xl text-brand-ink focus:outline-none focus:border-brand-accent font-semibold min-w-[120px] shadow-sm cursor-pointer"
              >
                <option value="Tümü">Tüm Sınıflar</option>
                {availableGradeLevels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl === 'Diğer' ? 'Diğer Sınıflar' : `${lvl}. Sınıf`}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-brand-ink/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Order Selector */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-2 border border-brand-border/80 text-xs bg-white rounded-xl text-brand-ink focus:outline-none focus:border-brand-accent font-semibold min-w-[170px] shadow-sm cursor-pointer"
                title="Sıralama Seçeneği"
              >
                <option value="date-asc">Tarih: En Yakın → En Uzak</option>
                <option value="date-desc">Tarih: En Uzak → En Yakın</option>
                <option value="no-asc">Ölçme Sıra No: 1 → N</option>
                <option value="no-desc">Ölçme Sıra No: N → 1</option>
                <option value="name-asc">Sınav Adı: A → Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-brand-ink/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(searchQuery || filterGrade !== 'Tümü' || sortBy !== 'date-asc') && (
              <button 
                onClick={() => { setSearchQuery(''); setFilterGrade('Tümü'); setSortBy('date-asc'); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold shrink-0 transition-colors shadow-sm active:scale-95"
              >
                <X className="w-3 h-3" />
                <span>Temizle</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Exams List Container */}
      <div className="bg-white border border-brand-border/70 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px]">
        {/* Desktop Table View */}
        <div className="overflow-auto flex-1 w-full hidden md:block">
          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
              <tr className="bg-[#FAF9F6] border-b-2 border-brand-ink">
                <th width="80" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider text-center sticky top-0 bg-[#FAF9F6]">ÖLÇME</th>
                <th width="150" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">TARİH</th>
                <th className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">SINAV ADI (Detaylar için tıklayın)</th>
                <th width="200" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider sticky top-0 bg-[#FAF9F6]">YAYINCI</th>
                <th width="120" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider text-center sticky top-0 bg-[#FAF9F6]">KATILAN</th>
                <th width="120" className="py-4 px-5 font-mono text-[0.65rem] text-brand-ink/50 uppercase tracking-wider text-center sticky top-0 bg-[#FAF9F6]">İŞLEMLER</th>
              </tr>
            </thead>
            <tbody className="text-[0.85rem]">
              {filteredAndSortedExams.map((exam, index) => {
                const registeredCount = state.students.filter(s => s.examRegistrations?.some(r => r.examId === exam.id)).length;
                
                return (
                  <tr key={exam.id} className="border-b border-brand-border transition-all hover:bg-[#FAF9F6]">
                    <td className="py-4 px-5 text-center" data-label="ÖLÇME">
                      {userRole === 'admin' ? (
                        <input 
                          type="number" 
                          value={exam.no !== undefined && exam.no !== null && exam.no !== 0 ? exam.no : ''} 
                          onChange={(e) => updateExam(exam.id, 'no', parseInt(e.target.value) || 0)} 
                          className="w-14 text-center font-mono font-bold text-brand-accent bg-[#F5F4F0] hover:bg-white focus:bg-white border border-transparent hover:border-brand-border focus:border-brand-accent rounded-lg py-1 px-1 text-sm outline-none transition-all" 
                          placeholder={exam.no ? exam.no.toString() : (index + 1).toString()}
                          title="Sınav Sıra No (Ölçme) - Değiştirmek için tıklayın"
                        />
                      ) : (
                        <span className="font-mono font-bold text-brand-accent text-sm">
                          {exam.no !== undefined && exam.no > 0 ? exam.no : index + 1}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5" data-label="BİLGİ">
                      <input 
                        type="text" 
                        value={exam.date} 
                        onChange={(e) => updateExam(exam.id, 'date', e.target.value)} 
                        className="w-full bg-transparent border-none focus:ring-0 text-brand-ink focus:outline-none p-1 font-mono text-[0.8rem]" 
                        placeholder="GG.AA.YYYY"
                      />
                    </td>
                    <td className="py-4 px-5 font-semibold" data-label="SINAV ADI">
                      <button 
                        onClick={() => setEditingExam(exam)}
                        className="text-left font-serif font-bold text-[1.1rem] text-brand-ink hover:text-brand-accent hover:underline decoration-dotted transition-all outline-none cursor-pointer"
                      >
                        {exam.name || '(İsimsiz Sınav)'}
                      </button>
                    </td>
                    <td className="py-4 px-5" data-label="BİLGİ">
                      <input 
                        type="text" 
                        value={exam.publisher || ''} 
                        onChange={(e) => updateExam(exam.id, 'publisher', e.target.value)} 
                        className="w-full bg-transparent border-none focus:ring-0 text-brand-ink/60 focus:outline-none p-1 text-[0.8rem]" 
                        placeholder="Yayın evi girilmemiş"
                      />
                    </td>

                    <td className="py-4 px-5 text-center" data-label="KATILAN">
                      <span className="inline-block bg-[#F3F2EE] text-brand-ink px-2.5 py-0.5 rounded-none text-[0.75rem] font-bold" title="Kayıtlı Öğrenci Sayısı">
                        {registeredCount} Öğr.
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center" data-label="İŞLEMLER">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => setEditingExam(exam)} 
                          className="w-7 h-7 rounded-full border border-brand-border flex items-center justify-center cursor-pointer transition-all bg-white hover:border-brand-accent hover:text-brand-accent"
                          title="Tüm Bağlantılı Detayları Düzenle"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => removeExam(exam.id)} 
                          className="w-7 h-7 rounded-full border border-brand-border flex items-center justify-center cursor-pointer transition-all bg-white hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                          title="Sınavı Sil"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedExams.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-brand-ink/40 font-medium">
                    {state.exams.length === 0 
                      ? "Kayıtlı sınav bulunmuyor. Yeni sınav ekleyebilir veya Excel'den aktarabilirsiniz."
                      : "Arama kriterine uyan sınav bulunamadı."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Modern Cards View */}
        <div className="md:hidden flex-1 overflow-auto w-full p-3 flex flex-col gap-2.5 bg-[#F9F8F5]">
          {/* Mobile List Quick Control Bar */}
          <div className="flex items-center justify-between px-1 py-1 text-xs text-brand-ink/60 font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-brand-ink">{filteredAndSortedExams.length}</span>
              <span>sınav listelendi</span>
            </div>
            <span className="text-[11px] text-brand-ink/50">Tıklayarak düzenleyin</span>
          </div>

          {filteredAndSortedExams.map((exam, index) => {
            const registeredCount = state.students.filter(s => s.examRegistrations?.some(r => r.examId === exam.id)).length;
            const totalCost = (exam.publisherFee || 0) * (exam.orderQuantity || 0);

            return (
              <div 
                key={exam.id} 
                className="bg-white rounded-2xl p-3.5 border border-brand-border/80 hover:border-brand-border transition-all duration-200 shadow-sm flex flex-col gap-2.5"
              >
                {/* Card Header: Badge + Exam Name + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1 bg-[#151618] text-white px-2.5 py-1 rounded-xl text-xs font-mono font-bold shrink-0 shadow-xs mt-0.5" title="Sınav Sıra No (Ölçme)">
                      <span className="text-amber-400 text-[10px]">ÖLÇME</span>
                      <span>#{exam.no !== undefined && exam.no > 0 ? exam.no : index + 1}</span>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <button 
                        onClick={() => setEditingExam(exam)}
                        className="font-serif font-bold text-base text-brand-ink text-left hover:text-brand-accent transition-all truncate"
                      >
                        {exam.name || '(İsimsiz Sınav)'}
                      </button>
                      <div className="flex items-center gap-1 text-[11px] text-brand-ink/50 font-mono mt-0.5">
                        <Calendar className="w-3 h-3 text-brand-ink/40 shrink-0" />
                        <span>{exam.date || 'Tarih belirtilmedi'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => setEditingExam(exam)}
                      className="w-8 h-8 rounded-xl bg-gray-50 border border-brand-border/70 flex items-center justify-center text-brand-ink/70 hover:text-brand-accent hover:border-brand-accent transition-all active:scale-95"
                      title="Detayları Düzenle"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => removeExam(exam.id)}
                      className="w-8 h-8 rounded-xl bg-gray-50 border border-brand-border/70 flex items-center justify-center text-brand-ink/40 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95"
                      title="Sınavı Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {/* Publisher Badge */}
                  <div className="bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                    <Building className="w-3 h-3 opacity-70 shrink-0" />
                    <span className="truncate max-w-[120px]">{exam.publisher || 'Yayıncı Yok'}</span>
                  </div>

                  {/* Registered Students Badge */}
                  <div className="bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 opacity-70 shrink-0" />
                    <span>{registeredCount} Kayıtlı</span>
                  </div>

                  {/* Order Quantity Badge */}
                  {(exam.orderQuantity || 0) > 0 && (
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                      <Package className="w-3 h-3 opacity-70 shrink-0" />
                      <span>{exam.orderQuantity} Sipariş</span>
                    </div>
                  )}

                  {/* Publisher Cost Badge */}
                  {totalCost > 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3 opacity-70 shrink-0" />
                      <span>₺{totalCost.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                </div>

                {/* Participating classes & Quick edit bar */}
                <div className="flex items-center justify-between pt-1 border-t border-brand-border/40 text-[11px]">
                  <div className="flex items-center gap-1 text-brand-ink/60">
                    <Layers className="w-3 h-3 text-brand-ink/40 shrink-0" />
                    <span className="font-semibold">
                      {exam.participatingClasses && exam.participatingClasses.length > 0 
                        ? exam.participatingClasses.map(c => `${c}. Sınıf`).join(', ')
                        : 'Tüm Sınıflar'}
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingExam(exam)}
                    className="text-brand-accent font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    <span>Yönet & Notlar</span>
                    <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredAndSortedExams.length === 0 && (
            <div className="text-center py-8 text-brand-ink/50 italic bg-white rounded-2xl border border-brand-border/60 p-4">
              Sınav bulunamadı.
            </div>
          )}
        </div>
      </div>

      {/* ============================================== */}
      {/* NEW INTERACTIVE MOCK EXAM DETAILS MODAL         */}
      {/* ============================================== */}
      {editingExam && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity animate-fade-in"
          onClick={() => setEditingExam(null)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-slide-up max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#fcfbf7] border-b border-[#e6e2d3] p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-[#d4d19d]/30 p-2.5 rounded-2xl border border-[#d4d19d]/50">
                  <Award className="h-6 w-6 text-[#5a5a40]" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-[#5a5a40] font-bold">
                    Sınav Entegrasyon & Detay Yönetimi
                  </h3>
                  <p className="text-xs text-[#8e8d82]">
                    Sınav No: #{examNo} • Sınıflar, Salonlar, Bütçe Gideri ve Sınav Sonuçları Senkronu
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingExam(null)}
                className="p-2 text-[#8e8d82] hover:text-[#5a5a40] hover:bg-[#f5f5f0] rounded-full transition-all border border-transparent hover:border-[#e6e2d3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#fcfbf7]/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: GENERAL INFO & BUDGET */}
                <div className="space-y-6">
                  
                  {/* Section 1: Sınav Bilgileri */}
                  <div className="bg-white rounded-[24px] p-5 border border-[#e6e2d3] shadow-sm space-y-4">
                    <div className="flex items-center space-x-2 border-b border-[#f5f5f0] pb-2">
                      <BookOpen className="h-4 w-4 text-[#5a5a40]" />
                      <h4 className="text-sm font-bold text-[#5a5a40] uppercase tracking-wider">Sınav Temel Bilgileri</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#8e8d82] mb-1">Sınav Sıra No (Ölçme)</label>
                        <input 
                          type="number" 
                          value={examNo || ''} 
                          onChange={(e) => setExamNo(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#8e8d82] mb-1">Sınav Adı</label>
                        <input 
                          type="text" 
                          value={examName} 
                          onChange={(e) => setExamName(e.target.value)}
                          className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2 text-sm font-semibold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                          placeholder="Deneme Adı"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#8e8d82] mb-1">Sınav Tarihi</label>
                          <input 
                            type="text" 
                            value={examDate} 
                            onChange={(e) => setExamDate(e.target.value)}
                            className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2 text-sm text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                            placeholder="Örn: 15.10.2026"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#8e8d82] mb-1">Yayıncı Bilgisi</label>
                          <input 
                            type="text" 
                            value={examPublisher} 
                            onChange={(e) => setExamPublisher(e.target.value)}
                            className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2 text-sm text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                            placeholder="Yayın evi/Yazar"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                   {/* Section 2: Bütçe Takibi Entegrasyonu */}
                  <div className="bg-white rounded-[24px] p-5 border border-[#e6e2d3] shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-[#f5f5f0] pb-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-[#5a5a40]" />
                        <h4 className="text-sm font-bold text-[#5a5a40] uppercase tracking-wider">Bütçe Gider Entegrasyonu</h4>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Canlı Bağlantı
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#8e8d82] mb-1">Yayıncıya Ödenen Kişi Başı Ücret</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8d82] text-sm font-bold">₺</span>
                            <input 
                              type="number" 
                              value={examPublisherFee || ''} 
                              onChange={(e) => setExamPublisherFee(parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#8e8d82] mb-1">Sipariş Miktarı (Adet)</label>
                          <input 
                            type="number" 
                            value={examOrderQuantity || ''} 
                            onChange={(e) => setExamOrderQuantity(parseInt(e.target.value) || 0)}
                            className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-3 py-2 text-sm font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40]"
                            placeholder="Adet"
                          />
                        </div>
                      </div>

                      {/* Sınıf Seviyelerine Göre Sipariş Detayı */}
                      <div className="bg-[#fcfbf7] p-3.5 rounded-2xl border border-[#e6e2d3]/60 space-y-2.5">
                        <span className="text-xs font-bold text-[#5a5a40] block">Sınıf Seviyelerine Göre Sipariş Adetleri</span>
                        <div className="grid grid-cols-2 gap-2">
                          {availableGradeLevels.map(lvl => {
                            const qty = examGradeOrderQuantities[lvl] || 0;
                            return (
                              <div key={lvl} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-[#e6e2d3] gap-2">
                                <span className="text-xs font-semibold text-[#5a5a40]">
                                  {lvl === 'Diğer' ? 'Diğer Sınıflar' : `${lvl}. Sınıflar`}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={qty || ''}
                                  onChange={(e) => handleGradeOrderQuantityChange(lvl, parseInt(e.target.value) || 0)}
                                  className="w-16 bg-[#fcfbf7] border border-[#e6e2d3] rounded-lg px-1.5 py-0.5 text-xs font-bold text-[#5a5a40] text-center focus:ring-1 focus:ring-[#5a5a40]"
                                  placeholder="0"
                                />
                              </div>
                            );
                          })}
                          {availableGradeLevels.length === 0 && (
                            <span className="text-[10px] text-[#8e8d82] italic col-span-2">Sistemde henüz sınıf bulunmamaktadır.</span>
                          )}
                        </div>
                      </div>
                      {examPublisherFee > 0 && examOrderQuantity > 0 ? (
                        <div className="bg-[#fcfbf7] p-3 rounded-2xl border border-[#e6e2d3]/60 text-xs text-[#5a5a40] space-y-1.5">
                          <p className="font-semibold flex items-center text-emerald-800">
                            <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0 text-emerald-600" />
                            Otomatik Gider Eşitleme Aktif!
                          </p>
                          <p className="text-gray-500 leading-normal">
                            Sınavı kaydettiğinizde, bütçede harcama sütununa otomatik olarak sipariş miktarı ({examOrderQuantity} adet) ile kişi başı ücret (₺{examPublisherFee}) çarpılarak hesaplanan <strong>"₺{examPublisherFee * examOrderQuantity}"</strong> tutarında <strong>"{examName || 'Sınav'} Yayın Ücreti"</strong> kalemi işlenecektir.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#8e8d82] leading-normal italic">
                          Kişi başı ücret ve sipariş miktarı girildiğinde bütçede harcamalar tablosuna gider olarak işlenecektir. Tutar silindiğinde harcama da silinir.
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: CLASSES & HALLS */}
                <div className="space-y-6">
                  
                  {/* Section 3: Katılacak Sınıflar (Öğrenci Kayıtları Entegrasyonu) */}
                  <div className="bg-white rounded-[24px] p-5 border border-[#e6e2d3] shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#f5f5f0] pb-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-[#5a5a40]" />
                        <h4 className="text-sm font-bold text-[#5a5a40] uppercase tracking-wider">Katılacak Sınıf Seviyeleri</h4>
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                        {totalStudentsInSelectedClasses} Öğrenci Aktif
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-[#8e8d82] leading-normal">
                        Bu deneme sınavına katılacak sınıf seviyelerini seçin. Bu seçimler Öğrenci Kayıtları listesini filtrelemek için kullanılacaktır:
                      </p>
                      
                      <div className="flex flex-wrap gap-2 border border-[#e6e2d3] rounded-2xl p-3 bg-[#fcfbf7] max-h-[200px] overflow-y-auto">
                        {availableGradeLevels.map(lvl => {
                          const isChecked = selectedClasses.includes(lvl);
                          // Calculate student count in this grade level
                          const studentCount = state.students.filter(s => {
                            const match = s.className?.trim().match(/^(\d+)/);
                            const studentLvl = match ? match[1] : 'Diğer';
                            return studentLvl === lvl;
                          }).length;

                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedClasses(selectedClasses.filter(c => c !== lvl));
                                } else {
                                  setSelectedClasses([...selectedClasses, lvl]);
                                }
                              }}
                              className={`p-3 rounded-xl text-xs font-bold border transition-all text-center flex-1 min-w-[120px] flex flex-col justify-center items-center ${
                                isChecked 
                                  ? 'bg-[#5a5a40] text-white border-transparent shadow-sm' 
                                  : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
                              }`}
                            >
                              <span>{lvl === 'Diğer' ? 'Diğer Sınıflar' : `${lvl}. Sınıflar`}</span>
                              <span className={`text-[9px] mt-1 font-normal ${isChecked ? 'text-gray-200' : 'text-[#8e8d82]'}`}>
                                ({studentCount} Öğr.)
                              </span>
                            </button>
                          );
                        })}
                        {availableGradeLevels.length === 0 && (
                          <div className="text-center text-xs text-[#8e8d82] py-4 w-full">
                            Sistemde kayıtlı sınıf bulunmuyor.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Sınav Salonları Entegrasyonu */}
                  <div className="bg-white rounded-[24px] p-5 border border-[#e6e2d3] shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 border-b border-[#f5f5f0] pb-2">
                      <MapPin className="h-4 w-4 text-[#5a5a40]" />
                      <h4 className="text-sm font-bold text-[#5a5a40] uppercase tracking-wider">Atanan Sınav Salonları</h4>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-[#8e8d82]">
                        Bu deneme sınavında kullanılacak sınav salonlarını eşleştirin. Yoklama listeleri ve oturma düzeni buralardan basılabilir:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto border border-[#e6e2d3] rounded-2xl p-3 bg-[#fcfbf7]">
                        {state.examHalls.map(hall => {
                          const isChecked = selectedHalls.includes(hall.id);
                          const studentCount = hall.capacity || 0;
                          return (
                            <label 
                              key={hall.id} 
                              className={`flex items-center space-x-3 p-2 rounded-xl border transition-all cursor-pointer ${
                                isChecked 
                                  ? 'bg-amber-50/50 border-[#d4d19d]/80' 
                                  : 'bg-white border-[#e6e2d3]/60 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedHalls([...selectedHalls, hall.id]);
                                  } else {
                                    setSelectedHalls(selectedHalls.filter(id => id !== hall.id));
                                  }
                                }}
                                className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40] h-4 w-4"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-[#5a5a40] truncate">{hall.name}</div>
                                <div className="text-[9px] text-[#8e8d82] truncate">
                                  {hall.selectedClasses?.join(', ') || 'Sınıf yok'} • Kapasite: {studentCount}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                        {state.examHalls.length === 0 && (
                          <div className="col-span-2 text-center text-xs text-[#8e8d82] py-4">
                            Sistemde kayıtlı sınav salonu bulunmuyor. Salonlar sekmesinden oluşturabilirsiniz.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#fcfbf7] border-t border-[#e6e2d3] p-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => removeExam(editingExam.id)}
                className="flex items-center px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Sınavı Tamamen Sil
              </button>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-5 py-2 text-sm font-bold border border-[#e6e2d3] rounded-full hover:bg-gray-150 text-[#5a5a40] transition-colors bg-white"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="px-6 py-2 text-sm font-bold bg-[#5a5a40] text-white rounded-full hover:bg-[#43423b] transition-colors shadow-sm"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* PRINT MODAL (Sınav Takvimi İlan Raporu)         */}
      {/* ============================================== */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0">
          <div className="bg-white rounded-[32px] border border-[#e6e2d3] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up print:w-full print:max-w-none print:h-auto print:max-h-none print:border-none print:shadow-none print:rounded-none">
            {/* Header (Hidden in Print) */}
            <div className="bg-[#fcfbf7] border-b border-[#e6e2d3] p-5 flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-3">
                <div className="bg-[#d4d19d]/30 p-2.5 rounded-2xl border border-[#d4d19d]/50">
                  <FileText className="h-6 w-6 text-[#5a5a40]" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-[#5a5a40] font-bold">
                    Sınav Takvimi Raporu
                  </h3>
                  <p className="text-xs text-[#8e8d82]">
                    İlan ve duyuru amaçlı sınıf bazlı sınav takvimi (Tablo görünümü)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPrintSettings(!showPrintSettings)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors border ${
                    showPrintSettings 
                      ? 'bg-[#e6e2d3] text-[#5a5a40] border-[#d4d19d]' 
                      : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-[#fcfbf7]'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarlar
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center px-4 py-2 bg-[#5a5a40] text-white rounded-full text-sm font-bold shadow-sm hover:bg-[#43423b] transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Yazdır
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-[#8e8d82] hover:text-[#5a5a40] hover:bg-[#f5f5f0] rounded-full transition-all border border-transparent hover:border-[#e6e2d3]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Print Settings Panel (Hidden in Print) */}
            {showPrintSettings && (
              <div className="bg-[#fcfbf7] border-b border-[#e6e2d3] p-5 print:hidden max-h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* 1. Sınıf Seviyesi Filtresi (Deneme Sınav Kartı Katılacak Sınıflar Bilgisi) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-[#5a5a40] uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#5a5a40]" />
                        Sınıf Seviyesi Filtresi
                      </h4>
                      {filterGrade !== 'Tümü' && (
                        <button
                          type="button"
                          onClick={() => handleFilterGradeChange('Tümü')}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline"
                        >
                          Tümünü Göster
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8e8d82] leading-tight">
                      Sınav kartlarında işaretlenmiş katılacak sınıf seviyelerine göre takvimi filtreleyin:
                    </p>
                    <div className="flex flex-wrap gap-1.5 bg-white p-2.5 rounded-2xl border border-[#e6e2d3]">
                      <button
                        type="button"
                        onClick={() => handleFilterGradeChange('Tümü')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterGrade === 'Tümü'
                            ? 'bg-[#5a5a40] text-white shadow-sm'
                            : 'bg-[#fcfbf7] text-[#5a5a40] hover:bg-[#f0ede4] border border-[#e6e2d3]/80'
                        }`}
                      >
                        <span>Tüm Sınıflar</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          filterGrade === 'Tümü' ? 'bg-white/25 text-white' : 'bg-[#e6e2d3] text-[#5a5a40]'
                        }`}>
                          {state.exams.length}
                        </span>
                      </button>

                      {availableGradeLevels.map(lvl => {
                        const isSelected = filterGrade === lvl;
                        // Count exams that include this grade level
                        const count = state.exams.filter(e => {
                          const grades = e.participatingClasses || [];
                          if (grades.length > 0) return grades.includes(lvl);
                          if (e.name) {
                            const norm = e.name.toLowerCase();
                            return norm.includes(`${lvl}. sınıf`) || norm.includes(`${lvl}.sınıf`) || norm.includes(`${lvl}/`);
                          }
                          return false;
                        }).length;

                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleFilterGradeChange(lvl)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-[#fcfbf7] text-[#5a5a40] hover:bg-[#f0ede4] border border-[#e6e2d3]/80'
                            }`}
                          >
                            <span>{lvl === 'Diğer' ? 'Diğer Sınıflar' : `${lvl}. Sınıf`}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-[#e6e2d3] text-[#5a5a40]'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Başlıkları Özelleştir (Elle Doldurulabilir) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-[#5a5a40] uppercase tracking-wider flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-[#5a5a40]" />
                        Başlıkları Düzenle
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintMainTitle('KIRKLARELİ ATATÜRK ORTAOKULU');
                          setPrintSubTitle(filterGrade !== 'Tümü' 
                            ? `2025-2026 EĞİTİM ÖĞRETİM YILI DENEME SINAVLARI TAKVİMİ (${filterGrade}. SINIFLAR)`
                            : '2025-2026 EĞİTİM ÖĞRETİM YILI DENEME SINAVLARI TAKVİMİ'
                          );
                        }}
                        className="text-[10px] text-[#8e8d82] hover:text-[#5a5a40] font-bold underline"
                        title="Varsayılan başlıklara dön"
                      >
                        Sıfırla
                      </button>
                    </div>
                    <div className="space-y-2 bg-white p-2.5 rounded-2xl border border-[#e6e2d3]">
                      <div>
                        <label className="block text-[10px] font-bold text-[#8e8d82] uppercase mb-1">
                          Ana Başlık (Okul / Kurum Adı)
                        </label>
                        <input
                          type="text"
                          value={printMainTitle}
                          onChange={(e) => setPrintMainTitle(e.target.value)}
                          placeholder="Örn: KIRKLARELİ ATATÜRK ORTAOKULU"
                          className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#8e8d82] uppercase mb-1">
                          Alt Başlık (Dönem &amp; Açıklama)
                        </label>
                        <input
                          type="text"
                          value={printSubTitle}
                          onChange={(e) => setPrintSubTitle(e.target.value)}
                          placeholder="Örn: 2025-2026 EĞİTİM ÖĞRETİM YILI DENEME SINAVLARI TAKVİMİ"
                          className="w-full bg-[#fcfbf7] border border-[#e6e2d3] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Sayfa Yönü ve Sayfa Sayısı */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-black text-[#5a5a40] uppercase tracking-wider mb-2">Sayfa Yönü</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPrintSettings(prev => ({ ...prev, orientation: 'portrait' }))}
                          className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                            printSettings.orientation === 'portrait'
                              ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm'
                              : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-[#f0ede4]'
                          }`}
                        >
                          <span className="w-3 h-4 border-2 border-current rounded-sm inline-block"></span>
                          Dikey
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintSettings(prev => ({ ...prev, orientation: 'landscape' }))}
                          className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                            printSettings.orientation === 'landscape'
                              ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm'
                              : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-[#f0ede4]'
                          }`}
                        >
                          <span className="w-4 h-3 border-2 border-current rounded-sm inline-block"></span>
                          Yatay
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-[#5a5a40] uppercase tracking-wider mb-2">Sayfa Sayısı &amp; Sığdırma</h4>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => setPrintSettings(prev => ({ ...prev, pageCount: '1' }))}
                          className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
                            printSettings.pageCount === '1'
                              ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm'
                              : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-[#f0ede4]'
                          }`}
                        >
                          1 Sayfa
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintSettings(prev => ({ ...prev, pageCount: '2' }))}
                          className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
                            printSettings.pageCount === '2'
                              ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm'
                              : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-[#f0ede4]'
                          }`}
                        >
                          2 Sayfa
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintSettings(prev => ({ ...prev, pageCount: 'auto' }))}
                          className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
                            printSettings.pageCount === 'auto'
                              ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm'
                              : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-[#f0ede4]'
                          }`}
                        >
                          Oto
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. Sütunlar & Yayıncı Renkleri */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-black text-[#5a5a40] uppercase tracking-wider mb-1.5">Görünecek Sütunlar</h4>
                      <div className="grid grid-cols-2 gap-1.5 bg-white p-2 rounded-2xl border border-[#e6e2d3]">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={printSettings.showParticipants}
                            onChange={(e) => setPrintSettings({...printSettings, showParticipants: e.target.checked})}
                            className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40]"
                          />
                          <span className="text-[11px] font-bold text-[#5a5a40]">Katılımcı</span>
                        </label>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={printSettings.showPublisher}
                            onChange={(e) => setPrintSettings({...printSettings, showPublisher: e.target.checked})}
                            className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40]"
                          />
                          <span className="text-[11px] font-bold text-[#5a5a40]">Yayıncı</span>
                        </label>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={printSettings.showOrderQuantity}
                            onChange={(e) => setPrintSettings({...printSettings, showOrderQuantity: e.target.checked})}
                            className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40]"
                          />
                          <span className="text-[11px] font-bold text-[#5a5a40]">Sipariş</span>
                        </label>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={printSettings.showHalls}
                            onChange={(e) => setPrintSettings({...printSettings, showHalls: e.target.checked})}
                            className="rounded border-[#e6e2d3] text-[#5a5a40] focus:ring-[#5a5a40]"
                          />
                          <span className="text-[11px] font-bold text-[#5a5a40]">Salonlar</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-[#5a5a40] uppercase tracking-wider mb-1.5">Yayıncı Renkleri</h4>
                      {uniquePublishers.length === 0 ? (
                        <p className="text-[10px] text-[#8e8d82] italic">Yayıncı bulunmuyor.</p>
                      ) : (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {uniquePublishers.map(pub => {
                            const pubName = pub || 'Bilinmiyor';
                            let currentColor = publisherColors[pubName];
                            if (!currentColor) {
                              const p = pubName.toLowerCase();
                              if (p.includes('işler')) currentColor = 'bg-orange-100';
                              else if (p.includes('çınar')) currentColor = 'bg-green-100';
                              else if (p.includes('arı')) currentColor = 'bg-yellow-100';
                              else if (p.includes('mozaik')) currentColor = 'bg-amber-100';
                              else if (p.includes('okyanus')) currentColor = 'bg-blue-100';
                              else if (p.includes('palme')) currentColor = 'bg-cyan-100';
                              else if (p.includes('ulti')) currentColor = 'bg-purple-100';
                              else if (p.includes('işleyen zeka')) currentColor = 'bg-rose-100';
                              else if (p.includes('sinan kuzucu')) currentColor = 'bg-red-100';
                              else if (p.includes('nartest')) currentColor = 'bg-emerald-100';
                              else if (p.includes('hız')) currentColor = 'bg-fuchsia-100';
                              else if (p.includes('sadık uygun')) currentColor = 'bg-indigo-100';
                              else {
                                let hash = 0;
                                for (let i = 0; i < p.length; i++) hash = p.charCodeAt(i) + ((hash << 5) - hash);
                                const colors = ['bg-amber-100', 'bg-blue-100', 'bg-emerald-100', 'bg-rose-100', 'bg-purple-100', 'bg-cyan-100'];
                                currentColor = colors[Math.abs(hash) % colors.length];
                              }
                            }

                            return (
                              <div key={pub} className="flex items-center space-x-1.5 bg-white p-1 rounded-lg border border-[#e6e2d3]">
                                <div className={`w-3 h-3 rounded-full border border-black/10 shrink-0 ${currentColor}`}></div>
                                <span className="text-[11px] font-bold text-[#5a5a40] flex-1 truncate" title={pubName}>{pubName}</span>
                                <select 
                                  value={currentColor}
                                  onChange={(e) => setPublisherColors(prev => ({ ...prev, [pubName]: e.target.value }))}
                                  className="text-[10px] border-[#e6e2d3] rounded py-0.5 pl-1 pr-4 focus:ring-[#5a5a40] bg-[#fcfbf7] font-semibold text-[#5a5a40]"
                                >
                                  {COLOR_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Print Body */}
            <div id="print-area-takvim" className="flex-1 overflow-y-auto p-3 md:p-4 bg-white print:p-0 print:overflow-visible flex flex-col justify-start max-w-full">
              <div className="takvim-header text-center mb-1.5 pb-1 border-b-[1.5px] border-black group">
                <div className="flex items-center justify-center relative">
                  <input
                    type="text"
                    value={printMainTitle}
                    onChange={(e) => setPrintMainTitle(e.target.value)}
                    placeholder="OKUL / KURUM ADI"
                    className="takvim-title-main text-center text-base md:text-lg font-black uppercase tracking-wide text-gray-900 w-full bg-transparent hover:bg-amber-50/60 focus:bg-amber-50/90 focus:ring-1 focus:ring-amber-400 rounded-lg px-2 py-0.5 outline-none transition-all cursor-text leading-tight"
                    title="Okul adını doğrudan düzenlemek için tıklayın (Elle doldurulabilir)"
                  />
                </div>
                <div className="flex items-center justify-center relative mt-0.5">
                  <input
                    type="text"
                    value={printSubTitle}
                    onChange={(e) => setPrintSubTitle(e.target.value)}
                    placeholder="DENEME SINAVLARI TAKVİMİ BAŞLIĞI"
                    className="takvim-title-sub text-center text-xs md:text-sm font-extrabold text-gray-700 uppercase w-full bg-transparent hover:bg-amber-50/60 focus:bg-amber-50/90 focus:ring-1 focus:ring-amber-400 rounded-lg px-2 py-0.5 outline-none transition-all cursor-text leading-tight"
                    title="Takvim başlığını doğrudan düzenlemek için tıklayın (Elle doldurulabilir)"
                  />
                </div>
              </div>

              <div className="takvim-table-wrapper flex-1 overflow-x-auto">
                <table className="takvim-table w-full border-collapse border-[1.5px] border-black text-center text-xs">
                  <thead>
                    <tr className="h-6">
                      <th className="border-[1.5px] border-black bg-gray-200 py-1 px-1 font-extrabold w-11 text-center text-[11px] leading-none">
                        ÖLÇME
                      </th>
                      <th className="border-[1.5px] border-black bg-gray-200 py-1 px-1.5 font-extrabold w-36 text-center text-[11px] leading-none">
                        TARİH
                      </th>
                      <th className="border-[1.5px] border-black bg-gray-200 py-1 px-2 font-extrabold text-left text-[11px] leading-none">
                        {filterGrade !== 'Tümü' ? `${filterGrade}. SINIF` : 'SINAV ADI'}
                      </th>
                      {printSettings.showOrderQuantity && (
                        <th className="border-[1.5px] border-black bg-gray-200 py-1 px-1 font-extrabold w-14 text-center text-[11px] leading-none">
                          SİPARİŞ
                        </th>
                      )}
                      {printSettings.showHalls && (
                        <th className="border-[1.5px] border-black bg-gray-200 py-1 px-1 font-extrabold w-24 text-center text-[11px] leading-none">
                          SALONLAR
                        </th>
                      )}
                      {printSettings.showParticipants && (
                        <th className="border-[1.5px] border-black bg-gray-200 py-1 px-1 font-extrabold w-16 text-center text-[11px] leading-none">
                          KATILAN KİŞİ
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="font-semibold">
                    {filteredAndSortedExams.map((exam, index) => {
                      const pubName = (exam.publisher || 'Bilinmiyor').trim();
                      
                      let bgColor = publisherColors[pubName];
                      if (!bgColor) {
                        const pub = pubName.toLowerCase();
                        if (pub.includes('işler')) bgColor = 'bg-orange-100';
                        else if (pub.includes('çınar')) bgColor = 'bg-green-100';
                        else if (pub.includes('arı')) bgColor = 'bg-yellow-100';
                        else if (pub.includes('mozaik')) bgColor = 'bg-amber-100';
                        else if (pub.includes('okyanus')) bgColor = 'bg-blue-100';
                        else if (pub.includes('palme')) bgColor = 'bg-cyan-100';
                        else if (pub.includes('ulti')) bgColor = 'bg-purple-100';
                        else if (pub.includes('işleyen zeka')) bgColor = 'bg-rose-100';
                        else if (pub.includes('sinan kuzucu')) bgColor = 'bg-red-100';
                        else if (pub.includes('nartest')) bgColor = 'bg-emerald-100';
                        else if (pub.includes('hız')) bgColor = 'bg-fuchsia-100';
                        else if (pub.includes('sadık uygun')) bgColor = 'bg-indigo-100';
                        else {
                          let hash = 0;
                          for (let i = 0; i < pub.length; i++) hash = pub.charCodeAt(i) + ((hash << 5) - hash);
                          const colors = ['bg-amber-100', 'bg-blue-100', 'bg-emerald-100', 'bg-rose-100', 'bg-purple-100', 'bg-cyan-100'];
                          bgColor = colors[Math.abs(hash) % colors.length];
                        }
                      }
                      
                      const registeredCount = state.students.filter(s => s.examRegistrations?.some(r => r.examId === exam.id)).length;
                      const assignedHallsText = exam.assignedHalls && exam.assignedHalls.length > 0
                        ? exam.assignedHalls.map(hid => state.examHalls.find((h: any) => h.id === hid)?.name).filter(Boolean).join(', ')
                        : 'Atanmadı';

                      return (
                        <tr key={exam.id} className="border-b border-black" style={{ height: `${optimalRowHeightMm}mm` }}>
                          <td className="col-no border-[1.5px] border-black py-0.5 px-1 text-xs font-bold font-mono">
                            {exam.no !== undefined && exam.no > 0 ? exam.no : index + 1}
                          </td>
                          <td className="col-date border-[1.5px] border-black py-0.5 px-1.5 font-mono font-bold text-xs">
                            {formatDateLong(exam.date)}
                          </td>
                          <td className={`col-name border-[1.5px] border-black py-0.5 px-2 text-left font-bold text-indigo-950 ${bgColor} print:exact-colors leading-snug`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            {exam.name} {printSettings.showPublisher && exam.publisher ? `(${exam.publisher})` : ''}
                          </td>
                          {printSettings.showOrderQuantity && (
                            <td className="col-order border-[1.5px] border-black py-0.5 px-1 font-bold text-xs">
                              {exam.orderQuantity || 0}
                            </td>
                          )}
                          {printSettings.showHalls && (
                            <td className="col-halls border-[1.5px] border-black py-0.5 px-1 text-[10px] leading-tight">
                              {assignedHallsText}
                            </td>
                          )}
                          {printSettings.showParticipants && (
                            <td className="col-participants border-[1.5px] border-black py-0.5 px-1 bg-red-600 text-white font-black text-xs print:exact-colors" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                              {registeredCount > 0 ? registeredCount : exam.participantCount || ''}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {filteredAndSortedExams.length === 0 && (
                      <tr>
                        <td colSpan={6} className="border-[1.5px] border-black py-4 text-gray-500 font-semibold text-xs">
                          Bu filtreye uygun sınav bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
