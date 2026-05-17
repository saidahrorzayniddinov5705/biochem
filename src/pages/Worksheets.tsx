import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../lib/store';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';

export default function Worksheets() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { language } = useSettingsStore();
  const t = (section, key) => getTranslation(language as any, section as any, key);
  const [worksheets, setWorksheets] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any>({});
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [semester, setSemester] = useState<1 | 2>(2);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const topicSnap = await getDocs(query(collection(db, 'topics'), orderBy('order')));
        setTopics(topicSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const wsSnap = await getDocs(collection(db, 'worksheets'));
        const wsDocs = wsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        wsDocs.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        setWorksheets(wsDocs);

        if (user) {
          const progQ = query(
            collection(db, 'progress'), 
            where('userId', '==', user.id), 
            where('itemType', '==', 'worksheet')
          );
          const progSnap = await getDocs(progQ);
          const pData: any = {};
          progSnap.docs.forEach(d => {
            const data = d.data();
            pData[data.itemId] = data;
          });
          setProgressData(pData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'worksheets');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTopicTitle = (topicId: string) => {
    return topics.find(t => t.id === topicId)?.title || 'Unknown Topic';
  };

  const filteredWorksheets = worksheets.filter(ws => (ws.semester || 2) === semester);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{t('worksheets', 'title')}</h1>
          <p className="text-muted-foreground">{t('worksheets', 'subtitle')}</p>
        </div>
        <div className="bg-muted p-1 rounded-lg flex gap-1 border border-border">
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${semester === 1 ? 'bg-background shadow-sm text-foreground cursor-default' : 'text-muted-foreground hover:text-foreground cursor-pointer'}`}
            onClick={() => setSemester(1)}
          >
            1-Semester
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${semester === 2 ? 'bg-background shadow-sm text-foreground cursor-default' : 'text-muted-foreground hover:text-foreground cursor-pointer'}`}
            onClick={() => setSemester(2)}
          >
            2-Semester
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorksheets.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center p-12 border border-dashed border-border rounded-xl bg-card">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">{t('worksheets', 'noWorksheets')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('worksheets', 'checkBack')}</p>
            </div>
          ) : (
            filteredWorksheets.map(ws => {
              const status = progressData[ws.id]?.status;
              const pct = progressData[ws.id]?.score || 0;
              return (
              <Card key={ws.id} className="bg-card border-border hover:border-primary/50 transition-all flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="w-5 h-5" />
                    </div>
                    {status === 'completed' && <div className="text-primary flex items-center gap-1 text-sm font-medium"><CheckCircle className="w-4 h-4" /> {pct}%</div>}
                  </div>
                  <CardTitle className="text-lg text-foreground leading-tight">{ws.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{getTopicTitle(ws.topicId)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" /> {ws.questions?.length || 0} {t('worksheets', 'questions')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ws.description}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    className={`w-full ${status === 'completed' ? 'bg-muted text-primary-foreground hover:bg-muted/80' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                    onClick={() => {
                      if (ws.isCustomHtml) {
                        navigate(`/worksheet-render/${ws.id}`);
                      } else {
                        navigate(`/worksheets/${ws.id}`);
                      }
                    }}
                  >
                    {status === 'completed' ? t('worksheets', 'review') : t('worksheets', 'start')}
                  </Button>
                </CardFooter>
              </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
