const fs = require('fs');

let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

code = code.replace(
  'import { LogOut } from "lucide-react";',
  'import { LogOut, Shield } from "lucide-react";\nimport { SettingsModal } from "./SettingsModal";'
);

code = code.replace(
  'const { userRole } = useAppContext();',
  'const { userRole } = useAppContext();\n  const [isSettingsOpen, setIsSettingsOpen] = useState(false);'
);

// Add the button for Admin Settings next to Dark Mode button
code = code.replace(
  '<button\n              onClick={() => setIsDarkMode(!isDarkMode)}',
  '{userRole === \'admin\' && (\n              <button\n                onClick={() => setIsSettingsOpen(true)}\n                className="flex items-center justify-center w-full bg-[#fcfbf7] hover:bg-[#e6e2d3] text-[#5a5a40] text-[0.75rem] py-2.5 px-3 rounded border border-[#e6e2d3] transition-all cursor-pointer gap-2 mt-2 font-semibold"\n              >\n                <Shield className="w-3.5 h-3.5" /> Yetkilendirme\n              </button>\n            )}\n            <button\n              onClick={() => setIsDarkMode(!isDarkMode)}'
);

code = code.replace(
  '<button\n              onClick={() => setIsDarkMode(!isDarkMode)}\n              className="flex items-center justify-center w-full bg-[#B08D57]/10 hover:bg-[#B08D57]/20 text-[#B08D57] text-sm font-semibold py-3.5 px-4 rounded-xl border border-[#B08D57]/20 transition-all gap-2 mt-4"\n            >',
  '{userRole === \'admin\' && (\n              <button\n                onClick={() => setIsSettingsOpen(true)}\n                className="flex items-center justify-center w-full bg-[#fcfbf7] hover:bg-[#e6e2d3] text-[#5a5a40] text-sm font-semibold py-3.5 px-4 rounded-xl border border-[#e6e2d3] transition-all gap-2 mt-4"\n              >\n                <Shield className="w-4 h-4" /> Kullanıcı Yetkilendirme\n              </button>\n            )}\n            <button\n              onClick={() => setIsDarkMode(!isDarkMode)}\n              className="flex items-center justify-center w-full bg-[#B08D57]/10 hover:bg-[#B08D57]/20 text-[#B08D57] text-sm font-semibold py-3.5 px-4 rounded-xl border border-[#B08D57]/20 transition-all gap-2 mt-4"\n            >'
);

// Add the modal component at the end of the Layout
code = code.replace(
  '</div>\n      </aside>',
  '</div>\n      </aside>\n      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />'
);

fs.writeFileSync('src/components/Layout.tsx', code);
