const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// 1. Import useRef
code = code.replace(
  "import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';",
  "import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';"
);

// 2. Add stateRef in AppProvider
code = code.replace(
  "const [state, setState] = useState<AppState>(defaultState);",
  "const [state, setState] = useState<AppState>(defaultState);\n  const stateRef = useRef<AppState>(state);"
);

// 3. Update stateRef on initialization if needed, but setState and updateFirebase will do it.
code = code.replace(
  "setState(safeData);",
  "setState(safeData);\n        stateRef.current = safeData;"
);
code = code.replace(
  "setState(parsed);",
  "setState(parsed);\n            stateRef.current = parsed;"
);

// 4. Update stateRef inside updateFirebase synchronously
code = code.replace(
  "const updateFirebase = async (newState: AppState) => {",
  "const updateFirebase = async (newState: AppState) => {\n    stateRef.current = newState;"
);

// 5. Replace ALL `const s = state;` with `const s = stateRef.current;` inside the updater methods!
code = code.replace(/const s = state;/g, "const s = stateRef.current;");

fs.writeFileSync('src/context/AppContext.tsx', code);
