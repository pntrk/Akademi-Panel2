const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.main = "electron/main.cjs";

pkg.scripts["electron:dev"] = "NODE_ENV=development concurrently -k \"vite --port=3000\" \"wait-on tcp:3000 && electron .\"";
pkg.scripts["electron:build"] = "vite build && electron-builder --win";

pkg.build = {
  "appId": "com.okulyonetim.app",
  "productName": "OkulYonetim",
  "directories": {
    "output": "release/"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": [
          "x64"
        ]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
