const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'import { LogIn } from \'lucide-react\';',
  'import { LogIn, Lock } from \'lucide-react\';\nimport { useAppContext } from \'./context/AppContext\';'
);

// We need a wrapper inside AppProvider to read userRole, because AppContent is rendered inside AppProvider.
// Wait, AppContent is already inside AppProvider! So we can use useAppContext in AppContent.
code = code.replace(
  'function AppContent() {\n  const [activeTab, setActiveTab] = useState(\'students\');',
  `function AppContent() {\n  const { userRole } = useAppContext();\n  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? 'students' : 'results');\n\n  if (userRole === 'guest') {\n    return (\n      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">\n        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e6e2d3]">\n          <div className="flex justify-center mb-6"><Lock className="w-16 h-16 text-[#B08D57]" /></div>\n          <h1 className="text-2xl font-serif font-bold text-[#5a5a40] mb-2 italic">Yetkisiz Erişim</h1>\n          <p className="text-[#8e8d82] mb-8 font-semibold text-sm">Hesabınız okul ağına tanımlı değil. Lütfen idareye başvurarak öğretmen yetkisi tanımlaması isteyin.</p>\n          <button onClick={logout} className="w-full bg-[#B08D57] hover:bg-[#c4a46e] text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md">Çıkış Yap</button>\n        </div>\n      </div>\n    );\n  }`
);

fs.writeFileSync('src/App.tsx', code);
