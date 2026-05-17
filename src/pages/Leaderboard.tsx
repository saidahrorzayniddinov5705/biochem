import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { BookOpen, Trophy, Medal, Crown } from 'lucide-react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        setIsLoading(true);
        // Order users by xp descending
        const q = query(
          collection(db, 'users'),
          orderBy('xp', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setLeaders(usersData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
       <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Leaderboard</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Eng yuqori natija ko'rsatgan talabalar reytingi</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center p-12 bg-card border border-border rounded-xl shadow-sm">
           <Trophy className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
           <p className="text-lg text-muted-foreground">Hozircha reyting mavjud emas</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-muted-foreground border-b border-border bg-muted/30 text-sm tracking-wider uppercase">
            <div className="col-span-2 md:col-span-1 text-center">#</div>
            <div className="col-span-6 md:col-span-5">Talaba</div>
            <div className="col-span-4 md:col-span-6 text-right">Reyting ball (XP)</div>
          </div>
          <div className="divide-y divide-border">
            {leaders.map((leader, index) => (
              <div key={leader.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  {index === 0 ? (
                    <Crown className="w-6 h-6 text-yellow-500" />
                  ) : index === 1 ? (
                    <Medal className="w-6 h-6 text-gray-400" />
                  ) : index === 2 ? (
                    <Medal className="w-6 h-6 text-amber-600" />
                  ) : (
                    <span className="font-bold text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <div className="col-span-6 md:col-span-5">
                  <div className="font-semibold text-foreground truncate">{leader.displayName || 'Noma\'lum student'}</div>
                  <div className="text-xs text-muted-foreground truncate opacity-80">{leader.email}</div>
                </div>
                <div className="col-span-4 md:col-span-6 text-right">
                  <div className="inline-flex p-2 bg-primary/10 text-primary rounded-lg font-bold">
                    {leader.xp || 0} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
