import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { useUserStore } from './lib/store';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from './lib/firestore-errors';

function AppWrapper() {
  const { setUser, setIsLoading } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let opType = OperationType.GET;
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          const today = new Date();
          const currentDayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            let updates: any = {};
            let shouldUpdate = false;

            const isAdmin = user.email === 'saidahrorzayniddinov@gmail.com' || user.email === 'izbosarovislomjon@gmail.com';
            
            // Upgrade to admin unconditionally for the owner
            if (isAdmin && data.role !== 'admin') {
              updates.role = 'admin';
              data.role = 'admin';
              shouldUpdate = true;
            }
            
            // Handle Streak
            let streakCount = data.streakCount || 0;
            let xpToAdd = 0;
            
            if (data.lastStreakDateStr !== currentDayStr) {
               if (data.lastStreakDateStr) {
                   const parts = data.lastStreakDateStr.split('-');
                   const lastDayDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                   const currentDayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                   const diffTime = currentDayDate.getTime() - lastDayDate.getTime();
                   const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
                   
                   if (diffDays === 1) {
                       streakCount += 1;
                       if (streakCount > 7) streakCount = 1;
                   } else if (diffDays > 1) {
                       streakCount = 1; // sequence broken
                   }
               } else {
                   streakCount = 1;
               }
               
               xpToAdd = streakCount * 10;
               updates.streakCount = streakCount;
               updates.lastStreakDateStr = currentDayStr;
               updates.xp = increment(xpToAdd);
               data.streakCount = streakCount;
               data.lastStreakDateStr = currentDayStr;
               data.xp = (data.xp || 0) + xpToAdd;
               shouldUpdate = true;
            }
            
            // Dynamically calculate level: max 10, every 1000 xp
            const calculatedLevel = Math.min(10, Math.floor((data.xp || 0) / 1000) + 1);
            if (data.level !== calculatedLevel) {
               updates.level = calculatedLevel;
               data.level = calculatedLevel;
               shouldUpdate = true;
            }

            if (shouldUpdate) {
               opType = OperationType.UPDATE;
               await setDoc(userDocRef, updates, { merge: true });
            }
            
            setUser({ id: user.uid, ...data }, user);
          } else {
            // Create user doc
            opType = OperationType.CREATE;
            const newUser = {
              email: user.email || '',
              displayName: user.displayName || 'Student',
              role: (user.email === 'saidahrorzayniddinov@gmail.com' || user.email === 'izbosarovislomjon@gmail.com') ? 'admin' : 'student',
              xp: 10,
              level: 1,
              streakCount: 1,
              lastStreakDateStr: currentDayStr,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userDocRef, newUser);
            setUser({ id: user.uid, ...newUser, createdAt: new Date() }, user);
          }
        } catch (error) {
           handleFirestoreError(error, opType, `users/${user.uid}`);
        }
      } else {
        setUser(null, null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading]);

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
);
