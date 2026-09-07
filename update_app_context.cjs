const fs = require('fs');

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// Update AppState interface
code = code.replace(
  'approvedTransfers?: { studentNo: number; examName: string; toTeam: string }[];',
  'approvedTransfers?: { studentNo: number; examName: string; toTeam: string }[];\n  admins?: string[];\n  teachers?: string[];'
);

// Update AppContextType
code = code.replace(
  '  state: AppState;',
  '  state: AppState;\n  userRole: \'admin\' | \'teacher\' | \'guest\';\n  updateUsers: (admins: string[], teachers: string[]) => void;'
);

// Update defaultState
code = code.replace(
  '  approvedTransfers: []\n};',
  '  approvedTransfers: [],\n  admins: [\'kirklareliataturkortaokulu@gmail.com\'],\n  teachers: []\n};'
);

// Update safeData definition
code = code.replace(
  '          approvedTransfers: data.approvedTransfers || []\n        };',
  '          approvedTransfers: data.approvedTransfers || [],\n          admins: data.admins || [\'kirklareliataturkortaokulu@gmail.com\'],\n          teachers: data.teachers || []\n        };'
);

// Update docRef and add userRole state
code = code.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\n  const [userRole, setUserRole] = useState<\'admin\' | \'teacher\' | \'guest\'>(\'guest\');'
);

code = code.replace(
  'const docRef = doc(db, \'users\', user.uid);',
  'const docRef = doc(db, \'schools\', \'main\');'
);

// Inside onSnapshot: Determine role
code = code.replace(
  '        setState(safeData);\n      } else {',
  `        setState(safeData);\n        \n        const userEmail = user.email || '';\n        if (userEmail === 'kirklareliataturkortaokulu@gmail.com' || safeData.admins.includes(userEmail)) {\n          setUserRole('admin');\n        } else if (safeData.teachers.includes(userEmail)) {\n          setUserRole('teacher');\n        } else {\n          setUserRole('guest');\n        }\n      } else {`
);

// Also set role when creating from localStorage (first login)
code = code.replace(
  '          try {\n            const parsed = JSON.parse(saved);',
  `          try {\n            const parsed = JSON.parse(saved);\n            const userEmail = user.email || '';\n            if (userEmail === 'kirklareliataturkortaokulu@gmail.com') {\n              setUserRole('admin');\n            } else {\n              setUserRole('guest');\n            }`
);

// Fix parse missing fields
code = code.replace(
  '            if (!parsed.leagueTeamPoints) parsed.leagueTeamPoints = {};',
  '            if (!parsed.leagueTeamPoints) parsed.leagueTeamPoints = {};\n            if (!parsed.admins) parsed.admins = [\'kirklareliataturkortaokulu@gmail.com\'];\n            if (!parsed.teachers) parsed.teachers = [];'
);

// Handle onSnapshot permission error
code = code.replace(
  '      console.error("Firebase sync error:", error);\n      setLoading(false);\n    });',
  '      console.error("Firebase sync error:", error);\n      setUserRole(\'guest\');\n      setLoading(false);\n    });'
);

// Update setDoc path inside AppProvider
code = code.replace(
  '      await setDoc(doc(db, \'users\', user.uid), newState);',
  '      if (userRole !== \'admin\') return; // Only admins can write in shared school db\n      await setDoc(doc(db, \'schools\', \'main\'), newState);'
);

// Provide updateUsers
code = code.replace(
  '  const approveTransfer = (studentNo: number, examName: string, toTeam: string) => {',
  `  const updateUsers = (admins: string[], teachers: string[]) => {\n    const s = state;\n    updateFirebase({ ...s, admins, teachers });\n  };\n\n  const approveTransfer = (studentNo: number, examName: string, toTeam: string) => {`
);

code = code.replace(
  'value={{ state, setStudents, setExams, setResults, setBudget, setExamHalls, updateBudget, updateLeagueSettings, approveTransfer }}',
  'value={{ state, userRole, setStudents, setExams, setResults, setBudget, setExamHalls, updateBudget, updateLeagueSettings, approveTransfer, updateUsers }}'
);

// Protect other write functions
const writeFns = ['setStudents', 'setExams', 'setResults', 'setBudget', 'setExamHalls', 'updateBudget', 'updateLeagueSettings', 'approveTransfer'];
for (const fn of writeFns) {
  code = code.replace(
    `const ${fn} = `,
    `const ${fn} = (...args: any[]) => { if (userRole !== 'admin') return; _${fn}(...args); };\n  const _${fn} = `
  );
}

fs.writeFileSync('src/context/AppContext.tsx', code);
