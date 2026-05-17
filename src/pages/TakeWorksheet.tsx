import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useUserStore } from '../lib/store';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function TakeWorksheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [worksheet, setWorksheet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const fetchWorksheet = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'worksheets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWorksheet({ id: docSnap.id, ...data });
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `worksheets/${id}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorksheet();
  }, [id]);

  useEffect(() => {
    let interval: any;
    if (isStarted && !isSubmitted && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            clearInterval(interval);
            handleSubmit();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isSubmitted, timeRemaining]);

  const handleStart = () => {
    if (!studentName.trim() || !studentGroup.trim()) {
      alert("Iltimos, ism va guruhingizni kiriting.");
      return;
    }
    if (worksheet?.duration) {
      setTimeRemaining(worksheet.duration * 60);
    }
    setIsStarted(true);
  };

  const handleFinish = () => {
    navigate('/worksheets');
  };

  const handleSubmit = async () => {
    let correct = 0;
    worksheet.questions.forEach((q: any, index: number) => {
      const userAnswer = answers[index];
      if (!userAnswer) return;

      if (q.type === 'mcq' || q.type === 'true_false') {
        if (userAnswer === q.correctAnswer) correct++;
      } else if (q.type === 'fill_in_blanks' || q.type === 'short_answer') {
        if (!userAnswer) return;
        const acceptableAnswers = q.correctAnswer.split(',').map((a: string) => a.trim().toLowerCase());
        if (acceptableAnswers.includes(userAnswer.trim().toLowerCase())) correct++;
      } else if (q.type === 'matching') {
        let allPairsCorrect = true;
        q.pairs.forEach((pair: any, pIdx: number) => {
          if (answers[`${index}-${pIdx}`] !== pair.right) {
            allPairsCorrect = false;
          }
        });
        if (allPairsCorrect) correct++;
      }
    });

    setScore(correct);
    setIsSubmitted(true);

    if (user && id) {
      const pct = Math.round((correct / worksheet.questions.length) * 100);
      try {
        await setDoc(doc(db, 'progress', `${user.id}_ws_${id}`), {
          userId: user.id,
          itemId: id,
          itemType: 'worksheet',
          status: 'completed',
          score: pct,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Grant XP for the worksheet based on score percentage
        await setDoc(doc(db, 'users', user.id), {
          xp: increment(pct)
        }, { merge: true });

      } catch (error) {
        console.error('Failed to save record:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Topshiriq topilmadi</h2>
        <Button onClick={() => navigate('/worksheets')}>Orqaga qaytish</Button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 relative">
      <Button variant="ghost" onClick={() => navigate('/worksheets')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Topshiriqlarga qaytish
      </Button>
      
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">{worksheet.title}</h1>
          <p className="text-muted-foreground">{worksheet.description}</p>
        </div>
        {isStarted && timeRemaining !== null && !isSubmitted && (
          <div className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-xl shadow-lg border border-primary/20 sticky top-4">
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {!isStarted ? (
        <Card className="max-w-md mx-auto mt-12 bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Ma'lumotlaringizni kiriting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ism va Familiya</Label>
              <Input 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)} 
                placeholder="Masalan: Aliyev Vali" 
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Guruh</Label>
              <Input 
                value={studentGroup} 
                onChange={(e) => setStudentGroup(e.target.value)} 
                placeholder="Masalan: 204-guruh" 
                className="bg-background"
              />
            </div>
            <div className="pt-4">
              <Button onClick={handleStart} className="w-full text-lg h-12">Boshlash</Button>
            </div>
          </CardContent>
        </Card>
      ) : !isSubmitted ? (
        <div className="space-y-6">
          {worksheet.questions && worksheet.questions.map((q: any, index: number) => (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  <span className="text-muted-foreground mr-2">{index + 1}.</span> 
                  {q.questionText}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {q.type === 'mcq' && (
                  <RadioGroup value={answers[index] || ''} onValueChange={(val) => setAnswers({ ...answers, [index]: val })}>
                    <div className="space-y-2">
                      {q.options.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => setAnswers({ ...answers, [index]: opt })}>
                          <RadioGroupItem value={opt} id={`q${index}-opt${optIdx}`} />
                          <Label htmlFor={`q${index}-opt${optIdx}`} className="cursor-pointer flex-1">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {q.type === 'true_false' && (
                  <RadioGroup value={answers[index] || ''} onValueChange={(val) => setAnswers({ ...answers, [index]: val })}>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="True" id={`q${index}-true`} />
                        <Label htmlFor={`q${index}-true`}>True</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="False" id={`q${index}-false`} />
                        <Label htmlFor={`q${index}-false`}>False</Label>
                      </div>
                    </div>
                  </RadioGroup>
                )}

                {(q.type === 'short_answer' || q.type === 'fill_in_blanks') && (
                  <Input 
                    value={answers[index] || ''} 
                    onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })} 
                    placeholder="Javobingizni bu yerga yozing..."
                    className="bg-background"
                  />
                )}
                
                {q.type === 'matching' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">Chap ustundagi so'zlar uchun o'ng ustundan mosini tanlang:</p>
                    {q.pairs.map((pair: any, pairIdx: number) => (
                      <div key={pairIdx} className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-1/2 p-3 bg-muted rounded-md text-sm font-medium border border-border">
                          {pair.left}
                        </div>
                        <div className="w-full sm:w-1/2">
                          <select 
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={answers[`${index}-${pairIdx}`] || ''}
                            onChange={(e) => setAnswers({ ...answers, [`${index}-${pairIdx}`]: e.target.value })}
                          >
                            <option value="">Tanlang...</option>
                            {/* Randomize order of right pairs simply by mapping all available right values */}
                            {q.pairs.map((p: any, pIdx: number) => (
                              <option key={pIdx} value={p.right}>{p.right}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-12" onClick={handleSubmit}>
            Javoblarni yuborish
          </Button>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Natijalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="text-5xl font-bold text-primary mb-2">
                {score} / {worksheet.questions.length}
              </div>
              {(() => {
                const percentage = Math.round((score / worksheet.questions.length) * 100);
                let message = "";
                let colorClass = "";
                if (percentage < 60) {
                  message = "Qoniqarsiz - Qayta urinib ko'ring";
                  colorClass = "text-red-500 font-bold text-xl mb-2";
                } else if (percentage < 70) {
                  message = "Qoniqarli";
                  colorClass = "text-amber-500 font-bold text-xl mb-2";
                } else if (percentage < 90) {
                  message = "Yaxshi";
                  colorClass = "text-green-500 font-bold text-xl mb-2";
                } else {
                  message = "Barakalla!";
                  colorClass = "text-primary font-bold text-xl mb-2";
                }
                return (
                  <>
                    <p className={colorClass}>{message}</p>
                    <p className="text-muted-foreground">Siz {percentage}% to'g'ri topdingiz. (+{percentage} XP)</p>
                  </>
                );
              })()}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Javoblarni ko'rib chiqish</h3>
              {worksheet.questions.map((q: any, index: number) => {
                const userAnswer = answers[index] || "Javob yo'q";
                let isCorrect = false;
                
                if (q.type === 'mcq' || q.type === 'true_false') {
                  isCorrect = userAnswer === q.correctAnswer;
                } else if (q.type === 'fill_in_blanks' || q.type === 'short_answer') {
                  const acceptableAnswers = q.correctAnswer.split(',').map((a: string) => a.trim().toLowerCase());
                  isCorrect = acceptableAnswers.includes(userAnswer.trim().toLowerCase());
                } else if (q.type === 'matching') {
                  let allPairsCorrect = true;
                  q.pairs.forEach((pair: any, pIdx: number) => {
                    if (answers[`${index}-${pIdx}`] !== pair.right) {
                      allPairsCorrect = false;
                    }
                  });
                  isCorrect = allPairsCorrect;
                }

                if (q.type === 'matching') {
                  return (
                    <div key={index} className="bg-muted/30 p-4 rounded-lg border border-border">
                      <p className="font-medium mb-2">{index + 1}. {q.questionText}</p>
                      <div className="space-y-2 mt-2">
                         {q.pairs.map((pair: any, pIdx: number) => {
                            const uAns = answers[`${index}-${pIdx}`] || "Javob yo'q";
                            const pCorrect = uAns === pair.right;
                            return (
                               <div key={pIdx} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm border-t border-border/50 pt-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-muted-foreground w-12 shrink-0">{pair.left}:</span>
                                    <span className={`font-medium flex items-center gap-1 ${pCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                      {uAns}
                                      {pCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-muted-foreground w-16 shrink-0">To'g'ri:</span>
                                    <span className="font-medium text-primary">{pair.right}</span>
                                  </div>
                               </div>
                            )
                         })}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className="bg-muted/30 p-4 rounded-lg border border-border">
                    <p className="font-medium mb-2">{index + 1}. {q.questionText}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground w-12 shrink-0">Sizning:</span>
                        <span className={`font-medium flex items-center gap-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                          {userAnswer}
                          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">To'g'ri:</span>
                        <span className="font-medium text-primary">{q.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="w-full" onClick={handleFinish}>Topshiriqlarga qaytish</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
