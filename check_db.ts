import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function check() {
  try {
    const q = collection(db, "access_requests");
    const snap = await getDocs(q);
    console.log("Access requests count:", snap.size);
    snap.forEach(d => console.log(d.id, d.data()));
  } catch(e) {
    console.error("Error:", e);
  }
}
check();
