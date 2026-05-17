import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, where, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
// @ts-ignore
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log('Seeding custom HTML worksheets...');

  // Get topic 1
  const topicsSnap = await getDocs(query(collection(db, 'topics')));
  let topic1Id = '';
  // find first topic
  topicsSnap.forEach(t => {
    if (t.data().order === 1) topic1Id = t.id;
  });

  if (!topic1Id) {
     topic1Id = 'topic1_placeholder';
  }

  // 1-mavzu worksheet
  const html1Path = path.join(process.cwd(), 'public', '1-mavzu-worksheet.html');
  if (fs.existsSync(html1Path)) {
    const html1 = fs.readFileSync(html1Path, 'utf8');
    
    // Check if exists
    const q1 = query(collection(db, 'worksheets'), where('title', '==', 'DNK tuzilishi. Replikatsiya. Reparatsiya.'));
    const s1 = await getDocs(q1);
    
    if (s1.empty) {
      await addDoc(collection(db, 'worksheets'), {
        topicId: topic1Id,
        title: 'DNK tuzilishi. Replikatsiya. Reparatsiya.',
        description: '1-mavzu uchun maxsus worksheet.',
        isCustomHtml: true,
        customHtml: html1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Added 1-mavzu worksheet.');
    } else {
      await updateDoc(s1.docs[0].ref, { customHtml: html1 });
      console.log('Updated 1-mavzu worksheet.');
    }
  }

  console.log('Done!');
  process.exit();
}

seed().catch(console.error);
