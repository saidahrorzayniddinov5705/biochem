import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { BookOpen, ChevronRight, Lock, CheckCircle, Clock, PlayCircle, Layers, FileText, BrainCircuit, FileEdit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../lib/store';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { BIOCHEM_TOPICS } from '../lib/mockTopics';

const ParticlesBackground = () => {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        const arr = Array.from({length: 40}).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            duration: Math.random() * 20 + 20,
            delay: Math.random() * -20
        }));
        setParticles(arr);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden dark:bg-[#050B14]">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-cyan-500/30 blur-[2px]"
                    style={{ width: p.size, height: p.size, left: `${p.x}vw`, top: `${p.y}vh` }}
                    animate={{
                        y: [`${p.y}vh`, `${p.y - 30}vh`, `${p.y}vh`],
                        x: [`${p.x}vw`, `${p.x + 10}vw`, `${p.x}vw`],
                        opacity: [0.1, 0.8, 0.1]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: p.delay
                    }}
                />
            ))}
            <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-blue-900/10 to-transparent mix-blend-screen" />
            <div className="absolute bottom-0 right-0 w-[60vw] h-[60vh] bg-gradient-to-tl from-cyan-900/5 to-transparent mix-blend-screen" />
        </div>
    );
};

const ActionButton = ({ icon: Icon, label, disabled = false }: { icon: any, label: string, disabled?: boolean }) => (
    <button 
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 w-[72px] h-[72px] rounded-xl border backdrop-blur-md transition-all group
        ${disabled 
          ? 'bg-muted/30 border-border/30 opacity-50 cursor-not-allowed' 
          : 'bg-background/40 border-border/50 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer'
        }
      `}
    >
       <Icon className={`w-6 h-6 transition-colors ${disabled ? 'text-muted-foreground' : 'text-muted-foreground group-hover:text-cyan-400'}`} />
       <span className={`text-[10px] font-medium transition-colors ${disabled ? 'text-muted-foreground' : 'text-muted-foreground group-hover:text-cyan-400'}`}>{label}</span>
    </button>
);

export default function Modules() {
  const [topics, setTopics] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const { user } = useUserStore();
  const { language } = useSettingsStore();

  const [semester, setSemester] = useState<1 | 2>(2);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'topics'), orderBy('order'));
        const snapshot = await getDocs(q);
        let displayTopics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (displayTopics.length < 15) {
            const needed = 15 - displayTopics.length;
            const extra = BIOCHEM_TOPICS.slice(displayTopics.length, displayTopics.length + needed).map((t, idx) => ({
                ...t,
                order: displayTopics.length + idx + 1
            }));
            displayTopics = [...displayTopics, ...extra];
        }
        
        setTopics(displayTopics);

        if (user) {
            const progQ = query(collection(db, 'progress'), where('userId', '==', user.id), where('itemType', '==', 'topic'));
            const progSnap = await getDocs(progQ);
            const progMap: Record<string, any> = {};
            progSnap.forEach(doc => {
                const pData = doc.data();
                progMap[pData.itemId] = pData;
            });
            setProgressData(progMap);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'topics or progress');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredTopics = topics.filter(t => (t.semester || 2) === semester);

  // Determine active node and expand it initially
  let firstUncompletedIndex = filteredTopics.findIndex(t => progressData[t.id]?.status !== 'completed');
  if (firstUncompletedIndex === -1 && filteredTopics.length > 0) firstUncompletedIndex = filteredTopics.length - 1;
  const activeIndex = Math.max(0, firstUncompletedIndex);

  useEffect(() => {
     if (!isLoading && filteredTopics.length > 0 && expandedTopicId === null) {
         setExpandedTopicId(filteredTopics[activeIndex].id);
     }
  }, [isLoading, filteredTopics, activeIndex, expandedTopicId]);

  const topicsCount = filteredTopics.length || 1;
  const completedCount = Object.values(progressData).filter(p => p.status === 'completed' && filteredTopics.find(t => t.id === p.topicId)).length;
  // Actually we don't have topicId in progressData easily but we can compute completed count simply:
  const filteredCompletedCount = filteredTopics.filter(t => progressData[t.id]?.status === 'completed').length;
  const overallProgress = Math.round((filteredCompletedCount / topicsCount) * 100);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <ParticlesBackground />
      
      {/* Sticky Top Nav for Roadmap */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {getTranslation(language, 'sidebar', 'modules')}
            </h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
              <Layers className="w-4 h-4" /> Biochemical Pathways & Systems
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
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
            {semester === 2 && (
            <div className="text-right">
              <div className="text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Course Progress</div>
              <div className="text-xl font-bold">{overallProgress}% COMPLETED</div>
            </div>
            )}
          </div>
        </div>
        <motion.div 
            className="h-1 bg-gradient-to-r from-cyan-400 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto py-16 px-4 md:px-8">
        {isLoading ? (
          <div className="flex justify-center py-32">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-32">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-40 animate-pulse" />
            <h3 className="text-xl font-medium">{getTranslation(language, 'modulesPage', 'noTopics')}</h3>
          </div>
        ) : (
          <div className="relative">
            {/* The vertical tracking line */}
            <div className="absolute left-[39px] md:left-1/2 top-8 bottom-8 w-1 bg-border/30 md:-translate-x-1/2 rounded-full overflow-hidden hidden sm:block">
               <motion.div 
                   className="absolute top-0 left-0 w-full bg-gradient-to-b from-cyan-400 to-blue-600"
                   initial={{ height: 0 }}
                   animate={{ height: `${activeIndex > 0 ? ((activeIndex + 0.5) / filteredTopics.length) * 100 : 0}%` }}
                   transition={{ duration: 1.5, ease: "easeInOut" }}
               />
            </div>
            
            <div className="space-y-6 md:space-y-16">
              {filteredTopics.map((topic, i) => {
                  const isCurrent = i === activeIndex;
                  const isCompleted = progressData[topic.id]?.status === 'completed';
                  // Allow access to all lessons as per user request
                  const isLocked = false; 
                  const isExpanded = expandedTopicId === topic.id;
                  const isEven = i % 2 === 0;
                  const subtopicsList = topic.subtopics || (topic.description ? [topic.description] : []);

                  const statusIndicator = isCompleted ? 'completed' : isLocked ? 'locked' : isCurrent ? 'current' : 'unlocked';

                  return (
                      <div key={topic.id} className={`relative flex flex-col md:flex-row md:items-start w-full ${isEven ? 'md:flex-row-reverse' : ''}`}>
                           
                           {/* Half spacer for desktop zigzag centering */}
                           <div className="hidden md:block md:w-1/2" />

                           {/* Central Node Circle */}
                           <div className="absolute left-4 md:left-1/2 top-0 mt-6 md:mt-8 -translate-y-1/2 md:-translate-x-1/2 z-20 hidden sm:flex">
                              <motion.div 
                                 className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center relative backdrop-blur-xl border-2 transition-colors duration-500 cursor-pointer
                                    ${statusIndicator === 'completed' ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 
                                      statusIndicator === 'current' ? 'bg-blue-900/60 border-cyan-400 text-white shadow-[0_0_30px_rgba(34,211,238,0.8)]' :
                                      'bg-muted/80 border-muted-foreground/30 text-muted-foreground opacity-60'}
                                 `}
                                 whileHover={{ scale: 1.1 }}
                                 onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                              >
                                 {statusIndicator === 'current' && (
                                    <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping opacity-75" />
                                 )}
                                 {statusIndicator === 'completed' ? <CheckCircle className="w-6 h-6 md:w-8 md:h-8" /> : (
                                    statusIndicator === 'locked' ? <Lock className="w-5 h-5 md:w-6 md:h-6" /> : <PlayCircle className="w-6 h-6 md:w-8 md:h-8 fill-current text-white/20" />
                                 )}
                              </motion.div>
                           </div>

                           {/* Content Box */}
                           <div className={`w-full sm:pl-[88px] md:pl-0 md:w-1/2 ${isEven ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}>
                               <motion.div 
                                   layout
                                   className={`relative
                                      overflow-hidden rounded-3xl border transition-all duration-500 sm:mt-0 
                                      ${isExpanded ? 'bg-card/90 border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.15)] shadow-cyan-900/20 backdrop-blur-xl' : 'bg-card/40 border-border/30 hover:bg-card/70 hover:border-cyan-500/30 cursor-pointer backdrop-blur-lg opacity-80'}
                                      ${isLocked && !isExpanded ? 'opacity-50 grayscale-[50%]' : ''}
                                   `}
                               >
                                  {/* Header that is always visible */}
                                  <div 
                                      className={`p-6 md:p-8 flex flex-col justify-center ${isEven ? 'md:items-end' : 'md:items-start'} cursor-pointer`}
                                      onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                                  >
                                      <div className={`flex items-center gap-3 mb-2 sm:hidden ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                              ${statusIndicator === 'completed' ? 'bg-cyan-500/20 text-cyan-500' : statusIndicator === 'current' ? 'bg-cyan-500 text-black' : 'bg-muted text-muted-foreground'}
                                          `}>
                                              {topic.order || i + 1}
                                          </div>
                                          <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">
                                            Lesson {topic.order || i + 1}
                                          </span>
                                      </div>
                                      <div className="hidden sm:block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">
                                         Lesson {topic.order || i + 1}
                                      </div>
                                      <h3 className="text-2xl font-black bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
                                         {topic.title}
                                      </h3>
                                  </div>

                                  {/* Expanded Area */}
                                  <AnimatePresence>
                                     {isExpanded && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="overflow-hidden"
                                        >
                                           <div className={`px-6 md:px-8 pb-8 space-y-6 flex flex-col ${isEven ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
                                              
                                              {/* Subtopics */}
                                              <div className="space-y-3 p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-md w-full">
                                                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2 justify-start md:justify-start">
                                                      <BookOpen className="w-4 h-4" /> Core Concepts
                                                  </div>
                                                  {subtopicsList.map((sub: string, idx: number) => (
                                                      <div key={idx} className={`flex items-start gap-2 text-sm text-foreground/80`}>
                                                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                                          <span className="flex-1 text-left">{sub}</span>
                                                      </div>
                                                  ))}
                                              </div>

                                              {/* Activities Panel */}
                                              <div className="w-full">
                                                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 text-left">
                                                      Learning Materials
                                                  </div>
                                                  <div className={`flex flex-wrap gap-3 justify-start`}>
                                                      <ActionButton icon={PlayCircle} label="Video" disabled={isLocked} />
                                                      <ActionButton icon={FileText} label="Notes" disabled={isLocked} />
                                                      <ActionButton icon={Layers} label="Flashcards" disabled={isLocked} />
                                                      <ActionButton icon={BrainCircuit} label="Quiz" disabled={isLocked} />
                                                      <ActionButton icon={FileEdit} label="Worksheet" disabled={isLocked} />
                                                  </div>
                                              </div>

                                              {/* Footer Action */}
                                              <div className="pt-4 w-full flex justify-start md:justify-start">
                                                  {isLocked ? (
                                                      <Button variant="outline" className="w-full sm:w-auto bg-muted/50 border-muted-foreground/30 text-muted-foreground cursor-not-allowed">
                                                          <Lock className="w-4 h-4 mr-2" /> {getTranslation(language, 'modulesPage', 'locked')}
                                                      </Button>
                                                  ) : (
                                                      <Link to={`/darslar/${topic.id}`} className="w-full sm:w-auto">
                                                          <Button className={`w-full sm:w-auto font-bold tracking-wide shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all
                                                              ${isCompleted ? 'bg-cyan-900 border-cyan-500 text-cyan-100 hover:bg-cyan-800' : 'bg-cyan-500 hover:bg-cyan-400 text-black'}
                                                          `}>
                                                              {isCompleted ? getTranslation(language, 'modulesPage', 'reviewLesson') : getTranslation(language, 'modulesPage', 'beginLesson')} 
                                                              <ChevronRight className="w-4 h-4 ml-1" />
                                                          </Button>
                                                      </Link>
                                                  )}
                                              </div>

                                           </div>
                                        </motion.div>
                                     )}
                                  </AnimatePresence>
                               </motion.div>
                           </div>
                      </div>
                  );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

