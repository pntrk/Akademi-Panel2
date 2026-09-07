const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

// Add imports
if (!content.includes("import { auth } from '../lib/firebase'")) {
  content = content.replace(
    "import { SettingsModal } from \"./SettingsModal\";",
    "import { SettingsModal } from \"./SettingsModal\";\nimport { auth } from '../lib/firebase';\nimport { onAuthStateChanged, User } from 'firebase/auth';"
  );
}

// Add state to Layout component
if (!content.includes('const [currentUser, setCurrentUser]')) {
  content = content.replace(
    "const [isDarkMode, setIsDarkMode] = useState(() => {",
    `const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  const getRoleLabel = () => {
    if (currentUser?.email === 'kirklareliataturkortaokulu@gmail.com') return 'Süper Yönetici';
    if (userRole === 'admin') return 'Yönetici';
    return 'Öğretmen';
  };
  
  const [isDarkMode, setIsDarkMode] = useState(() => {`
  );
}

// Add user info to mobile menu (below "Seçenekler" header)
const mobileHeaderTarget = `<div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-serif text-2xl font-bold">Seçenekler</h3>
              <button onClick={closeMobileMenu} className="text-white/60 hover:text-white p-2 bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>`;
const mobileHeaderReplacement = `<div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-serif text-2xl font-bold">Seçenekler</h3>
              <button onClick={closeMobileMenu} className="text-white/60 hover:text-white p-2 bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* User Info Mobile */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="bg-brand-accent text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                  {getRoleLabel()}
                </div>
              </div>
              <div className="text-white/80 text-xs truncate mt-1">
                {currentUser?.email || 'Bilinmeyen Kullanıcı'}
              </div>
            </div>`;
            
if (content.includes(mobileHeaderTarget) && !content.includes('User Info Mobile')) {
  content = content.replace(mobileHeaderTarget, mobileHeaderReplacement);
}

// Add user info to desktop sidebar footer (at the bottom)
const desktopFooterTarget = `{onLogout && (
            <button 
              onClick={onLogout} 
              className="flex items-center justify-center w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[0.75rem] py-2.5 px-3 rounded border border-red-500/20 transition-all cursor-pointer gap-2 mt-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
            </button>
          )}`;
          
const desktopFooterReplacement = `
          {/* User Info Desktop */}
          <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded flex flex-col gap-1">
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">{getRoleLabel()}</span>
            <span className="text-[11px] text-white/70 truncate" title={currentUser?.email || ''}>{currentUser?.email || 'Bilinmeyen Kullanıcı'}</span>
          </div>
          
          {onLogout && (
            <button 
              onClick={onLogout} 
              className="flex items-center justify-center w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[0.75rem] py-2.5 px-3 rounded border border-red-500/20 transition-all cursor-pointer gap-2 mt-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
            </button>
          )}`;

if (content.includes(desktopFooterTarget) && !content.includes('User Info Desktop')) {
  content = content.replace(desktopFooterTarget, desktopFooterReplacement);
}

fs.writeFileSync('src/components/Layout.tsx', content);

