const fs = require('fs');

let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

// We need to pass userRole or get it from Context. 
// Since Layout receives activeTab, it's easier to just use AppContext.
code = code.replace(
  'import { cn } from \'../lib/utils\';',
  'import { cn } from \'../lib/utils\';\nimport { useAppContext } from \'../context/AppContext\';'
);

code = code.replace(
  'export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {',
  'export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {\n  const { userRole } = useAppContext();'
);

code = code.replace(
  '            {navItems.map((item) => {',
  '            {navItems.filter(item => userRole === \'admin\' || [\'results\', \'league\'].includes(item.id)).map((item) => {'
);

code = code.replace(
  '        {navItems.map((item) => {',
  '        {navItems.filter(item => userRole === \'admin\' || [\'results\', \'league\'].includes(item.id)).map((item) => {'
);

fs.writeFileSync('src/components/Layout.tsx', code);
