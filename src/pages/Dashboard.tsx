import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Trophy, Flame, Target, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useUserStore } from '../lib/store';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export default function Dashboard() {
  const { user } = useUserStore();
  const { language } = useSettingsStore();
  const t = (section: any, key: any) => getTranslation(language as any, section as any, key);
  const [stats, setStats] = useState({
    modulesCompleted: 0,
    totalModules: 15,
    streak: 0,
    studyTime: 0,
  });
  const [currentModule, setCurrentModule] = useState<{title: string, desc: string} | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Find total topics
        let totalTopics = 15;
        const topicsSnap = await getDocs(collection(db, 'topics'));
        if (!topicsSnap.empty && topicsSnap.size > 15) {
            totalTopics = topicsSnap.size;
        }

        let completed = 0;
        let lastTopic: any = null;

        if (user) {
           const progQ = query(collection(db, 'progress'), where('userId', '==', user.id), where('itemType', '==', 'topic'));
           const progSnap = await getDocs(progQ);
           
           progSnap.forEach(doc => {
               if (doc.data().status === 'completed') {
                   completed++;
               }
           });
        }

        setStats(prev => ({
           ...prev,
           totalModules: totalTopics,
           modulesCompleted: completed
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'progress');
      }
    };
    fetchProgress();
  }, [user]);

  const progressPercent = stats.totalModules > 0 ? Math.round((stats.modulesCompleted / stats.totalModules) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{t('dashboard', 'welcomeBack')} {user?.displayName?.split(' ')[0] || t('dashboard', 'student')} 👋</h1>
          <p className="text-muted-foreground">{t('dashboard', 'subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger render={
              <button className="bg-card w-full text-left border border-border rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('dashboard', 'level')} {Math.min(10, Math.floor((user?.xp || 0) / 1000) + 1)}</div>
                  <div className="font-bold text-foreground">{user?.xp || 0} {t('dashboard', 'xp')}</div>
                </div>
              </button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Daraja va XP
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm text-muted-foreground">Joriy Daraja</div>
                    <div className="text-4xl font-bold text-foreground">{Math.min(10, Math.floor((user?.xp || 0) / 1000) + 1)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Umumiy XP</div>
                    <div className="text-2xl font-bold text-primary">{user?.xp || 0}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Keyingi darajagacha</span>
                    <span className="font-medium">
                      {Math.min(10, Math.floor((user?.xp || 0) / 1000) + 1) === 10 ? 'MAX' : `${(user?.xp || 0) % 1000} / 1000 XP`}
                    </span>
                  </div>
                  <Progress value={Math.min(10, Math.floor((user?.xp || 0) / 1000) + 1) === 10 ? 100 : (((user?.xp || 0) % 1000) / 1000) * 100} className="h-3" />
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                  Sizning XP laringiz topshiriqlar, simulyatsiyalar va darslarni muvaffaqiyatli yakunlaganingiz uchun beriladi. Streak orqali har kuni qo'shimcha bonus XP oling!
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={
              <button className="bg-card w-full text-left border border-border rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors">
                <Flame className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('dashboard', 'streak')}</div>
                  <div className="font-bold text-foreground">{user?.streakCount || 0} {t('dashboard', 'days')}</div>
                </div>
              </button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" /> Daily Streak (Ketma-ketlik)
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-foreground mb-2 flex justify-center items-center gap-3">
                    {user?.streakCount || 0} <Flame className="w-10 h-10 text-orange-500" />
                  </div>
                  <p className="text-muted-foreground">Siz {user?.streakCount || 0} kun ketma-ket dars qildingiz!</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-medium px-1">
                    <span>Haftalik progress:</span>
                  </div>
                  <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl border border-border">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                      const currentStreak = user?.streakCount || 0;
                      const isCompleted = day <= currentStreak;
                      const isNext = day === currentStreak + 1;
                      return (
                         <div key={day} className="flex flex-col items-center gap-2 relative">
                           {isCompleted ? (
                             <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm ring-2 ring-orange-500/20">
                               <CheckCircle2 className="w-5 h-5" />
                             </div>
                           ) : isNext ? (
                             <div className="w-8 h-8 rounded-full bg-background border-2 border-orange-500 flex items-center justify-center text-orange-500 shadow-sm">
                               <span className="text-xs font-bold">{day}</span>
                             </div>
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-muted-foreground">
                               <span className="text-xs font-medium">{day}</span>
                             </div>
                           )}
                           <span className={`text-[10px] font-medium ${isCompleted ? 'text-orange-500' : 'text-muted-foreground'}`}>
                             +{day * 10}XP
                           </span>
                         </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                  Platformaga har kuni kirib, faollik ko'rsating va ketma-ketlik seriyasini oshiring. Har kuni faol bo'lsangiz 10, 20, 30... 70 XP gacha qo'shimcha tajriba ballini yig'asiz. Ketma-ketlikni uzib qo'ymang!
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />{t('dashboard', 'courseProgress')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{t('dashboard', 'overallProgress')}</h3>
                  <p className="text-muted-foreground text-sm">{language === 'uz' ? `${stats.totalModules} ${t('dashboard', 'outOfCompleted')} ${stats.modulesCompleted}` : language === 'ru' ? `${stats.modulesCompleted} ${t('dashboard', 'outOfCompleted')} ${stats.totalModules}` : `${stats.modulesCompleted} ${t('dashboard', 'outOfCompleted')} ${stats.totalModules}`}</p>
                </div>
                <div className="w-24 h-24 shrink-0 rounded-full border-4 border-border flex items-center justify-center relative bg-background">
                  <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                    <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-primary transition-all duration-1000" strokeDasharray="289" strokeDashoffset={289 * (1 - (progressPercent / 100))} strokeLinecap="round" />
                  </svg>
                  <span className="text-xl font-bold text-foreground relative z-10">{progressPercent}%</span>
                </div>
              </div>
              
              <Link to="/darslar">
                <button className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                  {t('dashboard', 'continueLearning')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold text-foreground mt-10 mb-4">{t('dashboard', 'recommendedTopics')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Iron Metabolism", type: "Video Lesson", time: "12 min", color: "text-purple-400", bg: "bg-purple-950/30" },
              { title: "Types of Anemia", type: "Clinical Case", time: "20 min", color: "text-primary", bg: "bg-secondary/30" }
            ].map((topic, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border hover:border-border transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`text-xs font-semibold px-2 py-1 rounded-md ${topic.bg} ${topic.color}`}>
                    {topic.type}
                  </div>
                  <span className="text-xs text-muted-foreground">{topic.time}</span>
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">{topic.title}</h4>
                <div className="flex items-center text-sm text-muted-foreground group-hover:text-muted-foreground">{t('dashboard', 'startLearning')} <ChevronRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t('dashboard', 'aiAnalysis')}</CardTitle>
              <CardDescription className="text-muted-foreground">{t('dashboard', 'basedOnRecent')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">{t('dashboard', 'strongArea')}</span>
                  <span className="text-primary">0%</span>
                </div>
                <Progress value={0} className="h-2 bg-muted" indicatorClassName="bg-primary" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">{t('dashboard', 'averageArea')}</span>
                  <span className="text-yellow-400">0%</span>
                </div>
                <Progress value={0} className="h-2 bg-muted" indicatorClassName="bg-yellow-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">{t('dashboard', 'weakArea')}</span>
                  <span className="text-red-400">0%</span>
                </div>
                <Progress value={0} className="h-2 bg-muted" indicatorClassName="bg-red-500" />
              </div>
              
              <div className="pt-4 border-t border-border">
                <Link to="/ai-tutor">
                  <button className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground/90 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    {t('dashboard', 'reviewWeak')}
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
