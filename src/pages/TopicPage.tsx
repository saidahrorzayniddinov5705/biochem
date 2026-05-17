import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, getDocs, doc, getDoc, setDoc, updateDoc, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PlayCircle, BookOpen, BrainCircuit, FileText, Stethoscope, ChevronRight, Activity, ArrowLeft, CheckCircle, RefreshCcw, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { useUserStore } from '../lib/store';
import { generateFlashcards } from '../services/geminiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { BIOCHEM_TOPICS } from '../lib/mockTopics';

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<any>(null);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [topicProgress, setTopicProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useSettingsStore();
  const { user } = useUserStore();
  
  const [flashcards, setFlashcards] = useState<{front: string, back: string}[]>([]);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handlePracticeFlashcards = async () => {
    setIsFlashcardsOpen(true);
    setFlashcardError(null);
    if (flashcards.length === 0) {
       setIsGeneratingFlashcards(true);
       try {
           const cards = await generateFlashcards(topic.title, 8, language as string);
           setFlashcards(cards);
           setCurrentFlashcardIndex(0);
           setIsFlipped(false);
       } catch (error: any) {
           console.error("Failed to generate flashcards", error);
           setFlashcardError(error.message || "Failed to generate flashcards.");
       } finally {
           setIsGeneratingFlashcards(false);
       }
    }
  };

  const handleNextFlashcard = () => {
      setIsFlipped(false);
      setTimeout(() => {
          if (currentFlashcardIndex < flashcards.length - 1) {
              setCurrentFlashcardIndex(prev => prev + 1);
          } else {
              setCurrentFlashcardIndex(0); // Loop back or show completion
          }
      }, 150);
  };

  useEffect(() => {
    const fetchTopicData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // Fetch current topic
        const topicRef = doc(db, 'topics', id);
        const topicSnap = await getDoc(topicRef);
        if (topicSnap.exists()) {
          setTopic({ id: topicSnap.id, ...topicSnap.data() });
        } else {
          // Check if it's a mock topic
          const mockTopic = BIOCHEM_TOPICS.find(t => t.id === id);
          if (mockTopic) {
             setTopic(mockTopic);
          }
        }

        // Fetch all topics for the left sidebar
        const topicsQ = query(collection(db, 'topics'), orderBy('order', 'asc'));
        const topicsSnap = await getDocs(topicsQ);
        let allTopicsList = topicsSnap.docs.map(t => ({ id: t.id, ...t.data() }));
        if (allTopicsList.length < 15) {
            const needed = 15 - allTopicsList.length;
            const extra = BIOCHEM_TOPICS.slice(allTopicsList.length, allTopicsList.length + needed).map((t, idx) => ({
                ...t,
                order: allTopicsList.length + idx + 1
            }));
            allTopicsList = [...allTopicsList, ...extra];
        }
        setAllTopics(allTopicsList);

        // Fetch contents
        const q = query(collection(db, 'contentItems'), where('topicId', '==', id));
        const contentSnap = await getDocs(q);
        setContents(contentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Handle progress
        if (user) {
          const progQ = query(collection(db, 'progress'), where('userId', '==', user.id), where('itemId', '==', id), where('itemType', '==', 'topic'));
          const progSnap = await getDocs(progQ);
          if (!progSnap.empty) {
            setTopicProgress({ id: progSnap.docs[0].id, ...progSnap.docs[0].data() });
          } else {
            const newProgressRef = doc(collection(db, 'progress'));
            const newProgress = {
                userId: user.id,
                itemId: id,
                itemType: 'topic',
                status: 'started',
                updatedAt: serverTimestamp()
            };
            await setDoc(newProgressRef, newProgress);
            setTopicProgress({ id: newProgressRef.id, ...newProgress, status: 'started' });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `topics/${id}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopicData();
  }, [id, user]);

  const handleMarkCompleted = async () => {
    if (!topicProgress || !user || topicProgress.status === 'completed') return;
    try {
        const progRef = doc(db, 'progress', topicProgress.id);
        await updateDoc(progRef, { status: 'completed', updatedAt: serverTimestamp() });
        setTopicProgress({ ...topicProgress, status: 'completed' });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `progress/${topicProgress.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!topic) {
    return <div className="p-8 text-center text-muted-foreground">{getTranslation(language, 'modulesPage', 'noTopics')}</div>;
  }

  // Filter content by language (all content items should have a 'language' tag)
  const filteredContents = contents.filter(c => !c.language || c.language === language);
  const videos = filteredContents.filter(c => c.type === 'video');
  const notes = filteredContents.filter(c => c.type === 'note');
  const books = filteredContents.filter(c => c.type === 'book');
  
  const progressPercent = topicProgress?.status === 'completed' ? 100 : (topicProgress?.status === 'started' ? 50 : 0);

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* LEFT SIDEBAR: Topic Navigation */}
      <div className="w-72 border-r bg-card flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">{getTranslation(language, 'sidebar', 'modules')}</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {allTopics.map((t, index) => (
            <Link 
              key={t.id} 
              to={`/darslar/${t.id}`}
              className={`block px-3 py-3 rounded-lg mb-1 text-sm transition-colors ${
                t.id === id 
                  ? 'bg-primary/10 text-primary font-semibold border border-primary/20' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-70">{getTranslation(language, 'topic', 'lesson')} {index + 1}</span>
              </div>
              <div className="line-clamp-2 leading-tight">{t.title}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8">
          <Link to="/darslar" className="text-primary hover:underline text-sm font-medium mb-4 flex items-center md:hidden">
            <ArrowLeft className="w-4 h-4 mr-1" /> {getTranslation(language, 'common', 'backToModules')}
          </Link>
          <div className="flex items-start justify-between gap-4">
             <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{topic.title}</h1>
                {topic.subtopics && Array.isArray(topic.subtopics) && topic.subtopics.length > 0 ? (
                   <ul className="space-y-3 mt-4 text-left max-w-3xl">
                     {topic.subtopics.map((part: string, index: number) => (
                        <li key={index} className="flex gap-3 items-start py-2 border-b border-border/50 last:border-0 text-muted-foreground text-base">
                             <span className="flex items-center justify-center bg-primary/20 text-primary w-6 h-6 rounded-full text-xs shrink-0 font-bold mt-0.5">
                                {index + 1}
                             </span>
                            <span className="flex-1 leading-relaxed">{part}</span>
                        </li>
                     ))}
                   </ul>
                ) : topic.description ? (
                  (() => {
                    const parts = topic.description.split(/(?=\b\d+\.)/).filter(Boolean).map((s: string) => s.trim()).filter(Boolean);
                    if (parts.length > 1 && parts.some((p: string) => /^\d+\./.test(p))) {
                      return (
                        <div className="bg-card border shadow-sm rounded-2xl p-6 mt-6 max-w-4xl">
                           <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> {getTranslation(language, 'common', 'lessonPlan') || 'Dars Rejasi'}</h2>
                          <ul className="space-y-3 text-left">
                            {parts.map((part: string, index: number) => (
                               <li key={index} className="flex gap-3 items-start py-2 text-muted-foreground text-sm sm:text-base hover:text-foreground transition-colors">
                                   <span className="flex items-center justify-center bg-primary/10 text-primary border border-primary/20 w-6 h-6 rounded-full text-xs shrink-0 font-bold mt-0.5 shadow-sm">
                                      {index + 1}
                                   </span>
                                   <span className="flex-1 leading-relaxed">{part.replace(/^\d+\.\s*/, '')}</span>
                               </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return <p className="text-muted-foreground max-w-3xl text-lg">{topic.description}</p>;
                  })()
                ) : null}
             </div>
             <div className="hidden lg:flex shrink-0">
               <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl ${progressPercent === 100 ? 'border-primary text-primary bg-primary/10' : 'border-primary/20 text-primary'}`}>
                 {progressPercent}%
               </div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Main Area */}
          <div className="xl:col-span-2 space-y-8">
              {/* Videos Section */}
              <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center justify-between border-b pb-2">
                      <span className="flex items-center gap-2"><PlayCircle className="w-6 h-6 text-primary" /> {getTranslation(language, 'topic', 'videos')}</span>
                  </h2>
                  {videos.length === 0 ? (
                      <div className="p-8 rounded-xl bg-muted border border-border text-center text-muted-foreground text-sm">
                        No videos available for this topic in {language.toUpperCase()}.
                      </div>
                  ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                          {videos.map(video => (
                              <Card key={video.id} className="hover:border-primary cursor-pointer overflow-hidden group" onClick={() => window.open(video.url, '_blank')}>
                                  <div className="h-40 bg-zinc-200 relative flex justify-center items-center group-hover:bg-primary/20 transition-colors">
                                       <PlayCircle className="w-12 h-12 text-zinc-500 group-hover:text-primary transition-colors" />
                                  </div>
                                  <CardContent className="p-4">
                                      <h4 className="font-semibold">{video.title}</h4>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                                  </CardContent>
                              </Card>
                          ))}
                      </div>
                  )}
              </section>

              {/* Books Section */}
              {books.length > 0 && (
              <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center justify-between border-b pb-2">
                      <span className="flex items-center gap-2"><BookOpen className="w-6 h-6 text-secondary-foreground" /> Books & Readings</span>
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                      {books.map(book => (
                          <Card key={book.id} className="hover:border-primary cursor-pointer bg-card" onClick={() => window.open(book.url, '_blank')}>
                              <CardContent className="p-5 flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                      <BookOpen className="w-6 h-6 text-primary" />
                                  </div>
                                  <div>
                                      <h4 className="font-bold line-clamp-2 leading-tight">{book.title}</h4>
                                      <p className="text-xs text-muted-foreground mt-2 font-medium bg-muted inline-flex px-2 py-1 rounded">Open Document</p>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </section>
              )}

              {/* Notes Section */}
              <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center justify-between border-b pb-2">
                      <span className="flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> {getTranslation(language, 'topic', 'notes')}</span>
                  </h2>
                  {notes.length === 0 ? (
                       <div className="p-8 rounded-xl bg-muted border border-border text-center text-muted-foreground text-sm">
                         No notes available for this topic in {language.toUpperCase()}.
                       </div>
                  ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                          {notes.map(note => (
                              <Card key={note.id} className="hover:border-primary cursor-pointer bg-card" onClick={() => window.open(note.url, '_blank')}>
                                  <CardContent className="p-5 flex items-start gap-4">
                                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                          <FileText className="w-6 h-6 text-primary" />
                                      </div>
                                      <div>
                                          <h4 className="font-bold line-clamp-2 leading-tight">{note.title}</h4>
                                          <p className="text-xs text-muted-foreground mt-2 font-medium bg-muted inline-flex px-2 py-1 rounded">Read Note</p>
                                      </div>
                                  </CardContent>
                              </Card>
                          ))}
                      </div>
                  )}
              </section>

              {/* Progress Action */}
              <div className="mt-12 flex justify-center border-t pt-8">
                  <Button 
                    size="lg" 
                    variant={topicProgress?.status === 'completed' ? 'outline' : 'default'}
                    className={`min-w-64 gap-2 ${topicProgress?.status === 'completed' ? 'text-primary border-primary pointer-events-none' : ''}`}
                    onClick={handleMarkCompleted}
                  >
                      {topicProgress?.status === 'completed' ? (
                          <>
                             <CheckCircle className="w-5 h-5 text-primary" /> Topic Completed
                          </>
                      ) : (
                          'Mark Topic as Completed'
                      )}
                  </Button>
              </div>
          </div>

          {/* Right Sidebar: AI Tutor, Flashcards, Worksheets */}
          <div className="space-y-6">
               <Card className="bg-card">
                  <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                          <BrainCircuit className="w-5 h-5 text-primary" /> {getTranslation(language, 'topic', 'aiTutor')}
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 relative">
                      <div className="text-sm text-muted-foreground mb-4">
                        {getTranslation(language, 'topic', 'stuckOn')} \"{topic.title}\"? {getTranslation(language, 'topic', 'askAITutor')}
                      </div>
                      <Link to="/ai-tutor">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{getTranslation(language, 'topic', 'askQuestion')}</Button>
                      </Link>
                  </CardContent>
               </Card>

               <Card className="bg-card">
                  <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-amber-500" /> {getTranslation(language, 'topic', 'flashcards')}
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                       <p className="text-sm text-muted-foreground">{getTranslation(language, 'topic', 'practiceConcepts')}</p>
                       <Button variant="outline" className="w-full" onClick={handlePracticeFlashcards}>{getTranslation(language, 'topic', 'practiceFlashcards')}</Button>
                  </CardContent>
               </Card>

                <Card className="bg-card">
                  <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-rose-500" /> {getTranslation(language, 'topic', 'worksheets')}
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                       <Link to={`/worksheets?topic=${topic.id}`} className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-accent border transition-colors group">
                           <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border">
                                   <Activity className="w-4 h-4 text-foreground" />
                               </div>
                               <span className="font-bold text-sm">{getTranslation(language, 'topic', 'topicQuiz')}</span>
                           </div>
                           <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                       </Link>
                       <Link to={`/lab?topic=${topic.id}`} className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-accent border transition-colors group">
                           <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                   <Stethoscope className="w-4 h-4 text-rose-500" />
                               </div>
                               <span className="font-bold text-sm">{getTranslation(language, 'topic', 'labSimulations')}</span>
                           </div>
                           <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                       </Link>
                  </CardContent>
               </Card>
          </div>
        </div>
      </div>
      
      {/* Flashcards Dialog */}
      <Dialog open={isFlashcardsOpen} onOpenChange={setIsFlashcardsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg overflow-hidden border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                {topic.title} Flashcards
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center justify-center min-h-[300px] perspective-1000 relative">
             {isGeneratingFlashcards ? (
                <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in zoom-in duration-300">
                   <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-md bg-primary/20 animate-pulse"></div>
                      <BrainCircuit className="w-12 h-12 text-primary relative z-10 animate-bounce" />
                   </div>
                   <p className="font-medium">AI is generating study cards...</p>
                </div>
             ) : flashcardError ? (
                 <div className="flex flex-col items-center justify-center p-6 text-center">
                    <X className="w-12 h-12 text-destructive mb-4" />
                    <p className="text-destructive font-medium mb-2">Error Generating Flashcards</p>
                    <p className="text-sm text-muted-foreground">{flashcardError}</p>
                 </div>
             ) : flashcards.length > 0 ? (
                 <div className="w-full flex flex-col items-center">
                    <div className="text-sm font-medium text-muted-foreground mb-4">
                        Card {currentFlashcardIndex + 1} of {flashcards.length}
                    </div>
                    
                    <button 
                        className="w-full max-w-sm aspect-[4/3] relative group"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <motion.div
                           initial={false}
                           animate={{ rotateY: isFlipped ? 180 : 0 }}
                           transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                           className="w-full h-full relative"
                           style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Front */}
                            <Card className="absolute inset-0 w-full h-full border-2 border-primary/20 bg-background flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors shadow-lg" style={{ backfaceVisibility: "hidden" }}>
                                <div className="text-xl md:text-2xl font-bold text-foreground">{flashcards[currentFlashcardIndex].front}</div>
                                <div className="absolute bottom-4 text-xs text-muted-foreground font-medium flex items-center gap-1 opacity-60">
                                   <RefreshCcw className="w-3 h-3" /> Click to flip
                                </div>
                            </Card>
                            
                            {/* Back */}
                            <Card className="absolute inset-0 w-full h-full border-2 border-amber-500/30 bg-amber-500/5 flex flex-col items-center justify-center p-6 text-center shadow-lg" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                                <div className="text-lg md:text-xl font-medium text-foreground">{flashcards[currentFlashcardIndex].back}</div>
                            </Card>
                        </motion.div>
                    </button>
                    
                    <div className="mt-8 flex items-center gap-4">
                        <Button variant="outline" onClick={() => setIsFlashcardsOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={handleNextFlashcard}>
                            Next Card <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                 </div>
             ) : (
                 <div className="text-center text-muted-foreground">
                    <p>Failed to generate flashcards. Please try again.</p>
                 </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
