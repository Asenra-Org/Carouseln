import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Read .env file manually
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const firebaseConfig = {
  apiKey: env.PUBLIC_FIREBASE_API_KEY,
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.PUBLIC_FIREBASE_APP_ID,
};

console.log("Initializing Firebase with config:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "PRESENT" : "MISSING",
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runTest() {
  console.log("Attempting to write a test document to 'projects' collection...");
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      name: "Test Brand",
      createdAt: new Date(),
      test: true
    });
    console.log("Success! Document written with ID:", docRef.id);
  } catch (err) {
    console.error("Write failed with error:", err.code, "-", err.message);
  }

  console.log("\nAttempting to read 'projects' collection...");
  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    console.log(`Success! Found ${querySnapshot.size} documents.`);
  } catch (err) {
    console.error("Read failed with error:", err.code, "-", err.message);
  }
}

runTest();
