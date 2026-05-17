import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function updateDocs() {
  const html1 = fs.readFileSync(path.join(process.cwd(), 'public', '1-mavzu-worksheet.html'), 'utf8');
  const html2 = fs.readFileSync(path.join(process.cwd(), 'public', '2-mavzu-worksheet.html'), 'utf8');

  const snap = await getDocs(collection(db, 'worksheets'));
  
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.title.includes('1-mavzu')) {
      console.log('Updating 1-mavzu html...');
      await updateDoc(docSnap.ref, { customHtml: html1 });
    } else if (data.title.includes('2-mavzu')) {
      console.log('Updating 2-mavzu html...');
      await updateDoc(docSnap.ref, { customHtml: html2 });
    }
  }

  console.log('Done!');
}

updateDocs();
