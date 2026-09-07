import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function check() {
  try {
    await setDoc(doc(db, "access_requests", "test@gmail.com"), {
      email: "test@gmail.com",
      name: "Test User",
      timestamp: new Date().toISOString()
    });
    console.log("Inserted!");
  } catch(e) {
    console.error("Error:", e);
  }
}
check();
