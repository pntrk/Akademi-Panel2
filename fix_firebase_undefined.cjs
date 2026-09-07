const fs = require('fs');

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  '      await setDoc(doc(db, \'schools\', \'main\'), newState);',
  '      // Clean undefined fields recursively to prevent Firestore errors\n      const cleanState = JSON.parse(JSON.stringify(newState));\n      await setDoc(doc(db, \'schools\', \'main\'), cleanState);'
);

fs.writeFileSync('src/context/AppContext.tsx', code);
