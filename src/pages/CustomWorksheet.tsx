import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomWorksheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreData, setScoreData] = useState<{pct: number, total: number} | null>(null);

  useEffect(() => {
    const fetchWorksheet = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'worksheets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWorksheet(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorksheet();
  }, [id]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'WORKSHEET_COMPLETED') {
        setScoreData({ pct: event.data.scorePct, total: event.data.scoreTotal });
        
        try {
          const user = auth.currentUser;
          if (user && id) {
            const pct = event.data.scorePct;
            await setDoc(doc(db, 'progress', `${user.uid}_ws_${id}`), {
              userId: user.uid,
              itemId: id,
              itemType: 'worksheet',
              status: 'completed',
              score: pct,
              updatedAt: serverTimestamp()
            }, { merge: true });

            await setDoc(doc(db, 'users', user.uid), {
              xp: increment(pct)
            }, { merge: true });

            let message = "";
            if (pct < 60) message = "Qoniqarsiz - Qayta urinib ko'ring";
            else if (pct < 70) message = "Qoniqarli";
            else if (pct < 90) message = "Yaxshi";
            else message = "Barakalla!";

            toast.success(`${message} ${pct}% natija ko'rsatdingiz! (+${pct} XP)`);
          }
        } catch (error) {
          console.error('Failed to save progress:', error);
          toast.error("Natijani saqlashda xatolik yuz berdi.");
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!worksheet || !worksheet.isCustomHtml) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Worksheet not found or not an HTML worksheet</h2>
        <Button className="mt-4" onClick={() => navigate('/worksheets')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-4 p-4 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">{worksheet.title}</h1>
        {scoreData && (
          <div className="ml-auto px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold shadow-sm flex items-center border border-green-200">
            Natija: {scoreData.pct}% ({scoreData.total} ball)
          </div>
        )}
      </div>
      <div className="flex-1 w-full bg-muted/20">
        <iframe 
          srcDoc={worksheet.customHtml} 
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
          title={worksheet.title}
        />
      </div>
    </div>
  );
}
