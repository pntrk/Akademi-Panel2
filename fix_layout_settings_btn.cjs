const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

// Insert the desktop button before Dark Mode
const desktopSearch = '<button \n            onClick={() => setIsDarkMode(!isDarkMode)} \n            className="flex items-center justify-center w-full bg-white/5 hover:bg-white/10 text-white text-[0.75rem] py-2.5 px-3 rounded border border-white/10 hover:border-white/20 transition-all cursor-pointer gap-2 mt-1"\n          >';

const desktopReplace = '{userRole === \'admin\' && (\n            <button \n              onClick={() => setIsSettingsOpen(true)} \n              className="flex items-center justify-center w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[0.75rem] font-bold py-2.5 px-3 rounded border border-emerald-500/20 transition-all cursor-pointer gap-2 mt-2"\n            >\n              <Shield className="w-3.5 h-3.5" /> Kullanıcı Yetkileri\n            </button>\n          )}\n          <button \n            onClick={() => setIsDarkMode(!isDarkMode)} \n            className="flex items-center justify-center w-full bg-white/5 hover:bg-white/10 text-white text-[0.75rem] py-2.5 px-3 rounded border border-white/10 hover:border-white/20 transition-all cursor-pointer gap-2 mt-1"\n          >';

code = code.replace(desktopSearch, desktopReplace);

// Insert the mobile button before Dark Mode
const mobileSearch = '<button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center w-full bg-white/5 hover:bg-white/10 text-white text-sm font-semibold py-3.5 px-4 rounded-xl border border-white/10 transition-all gap-2">';

const mobileReplace = '{userRole === \'admin\' && (\n              <button onClick={() => { setIsSettingsOpen(true); closeMobileMenu(); }} className="flex items-center justify-center w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold py-3.5 px-4 rounded-xl border border-emerald-500/20 transition-all gap-2 mt-2">\n                <Shield className="w-4 h-4" /> Kullanıcı Yetkileri\n              </button>\n            )}\n            <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center w-full bg-white/5 hover:bg-white/10 text-white text-sm font-semibold py-3.5 px-4 rounded-xl border border-white/10 transition-all gap-2">';

code = code.replace(mobileSearch, mobileReplace);

fs.writeFileSync('src/components/Layout.tsx', code);
