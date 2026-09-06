const lessons = [
  "Türkçe",
  "T.C. İnkılap Tarihi ve Atatürkçülük",
  "Din Kültürü ve Ahlak Bilgisi",
  "Yabancı Dil",
  "Matematik",
  "Fen Bilimleri"
];

const getStandardCoreLesson = (name) => {
  const normalized = name
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/\u0307/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
  if (normalized.includes('turkce') || normalized.startsWith('tur')) return 'Türkçe';
  if (normalized.includes('matematik') || normalized.startsWith('mat')) return 'Matematik';
  if (normalized.includes('fen') || normalized.includes('fiz') || normalized.includes('kim') || normalized.includes('biy')) return 'Fen Bilimleri';
  if (normalized.includes('inkilap') || normalized.includes('t.c') || normalized.includes('sosyal') || normalized.includes('tarih')) return 'İnkılap Tarihi';
  if (normalized.includes('din') || normalized.includes('ahlak') || normalized.includes('d.k')) return 'Din Kültürü';
  if (normalized.includes('ingilizce') || normalized.startsWith('ing') || normalized.includes('yabanci') || normalized.includes('english')) return 'İngilizce';
  if (!name || name.trim() === '' || normalized.includes('toplam') || normalized.includes('genel') || normalized.includes('puan') || normalized.includes('sinif') || normalized.includes('okul') || normalized.includes('sira')) return '';
  return name.trim();
};

lessons.forEach(l => console.log(l, "->", getStandardCoreLesson(l)));
