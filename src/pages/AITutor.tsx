import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { BrainCircuit, Send, Sparkles, BookHeart, Syringe, Pill, Lightbulb, HeartPulse, RefreshCcw } from 'lucide-react';
import { askTutor } from '../services/geminiService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'tutor';
  content: string;
}

export default function AITutor() {
  const { language } = useSettingsStore();
  const t = (section: any, key: string) => getTranslation(language as any, section, key);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await askTutor(userMessage);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', content: response }]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect to Tutor.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestAction = (actionText: string) => {
      handleSend(actionText);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-center px-6 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold">BioChem Tutor</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" viewportRef={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
            
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20">
                        <BrainCircuit className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How can I help you learn today?</h2>
                        <p className="text-muted-foreground text-lg max-w-lg mx-auto">I'm your personal AI biochemistry tutor. Ask me to explain concepts, generate clinical cases, or test your knowledge.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                        <button onClick={() => suggestAction("Explain the Krebs cycle as if I were a 5 year old.")} className="p-4 rounded-2xl border border-border bg-card hover:bg-muted transition-colors text-left group">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Lightbulb className="w-5 h-5" /></div>
                                <span className="font-semibold">Explain Simply</span>
                            </div>
                            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Krebs cycle for a 5 year old</p>
                        </button>
                        <button onClick={() => suggestAction("Provide a complex clinical case related to Diabetic Ketoacidosis.")} className="p-4 rounded-2xl border border-border bg-card hover:bg-muted transition-colors text-left group">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500"><HeartPulse className="w-5 h-5" /></div>
                                <span className="font-semibold">Clinical Case</span>
                            </div>
                            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Diabetic Ketoacidosis presentation</p>
                        </button>
                        <button onClick={() => suggestAction("Test my knowledge on lipid metabolism with 3 hard MCQs.")} className="p-4 rounded-2xl border border-border bg-card hover:bg-muted transition-colors text-left group">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><BookHeart className="w-5 h-5" /></div>
                                <span className="font-semibold">Test Knowledge</span>
                            </div>
                            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Lipid metabolism MCQs</p>
                        </button>
                        <button onClick={() => suggestAction("Create a memorable mnemonic for remembering essential amino acids.")} className="p-4 rounded-2xl border border-border bg-card hover:bg-muted transition-colors text-left group">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Pill className="w-5 h-5" /></div>
                                <span className="font-semibold">Memorization</span>
                            </div>
                            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Essential amino acids mnemonic</p>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-3xl px-5 py-4 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md shadow-sm'
                            : 'bg-muted/50 text-foreground rounded-bl-md border border-border/50'
                        }`}
                      >
                        {msg.role === 'tutor' ? (
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-primary">
                              <BrainCircuit className="w-4 h-4" />
                            </div>
                            <div className="prose prose-sm md:prose-base prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm md:text-base">{msg.content}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted/50 border border-border/50 rounded-3xl rounded-bl-md p-5 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-border text-primary">
                            <BrainCircuit className="w-4 h-4" />
                        </div>
                        <div className="flex gap-1.5 h-6 items-center">
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto relative relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-end gap-2 bg-card border border-border shadow-xl shadow-black/5 rounded-3xl p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a biochemistry topic..."
                className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-4 py-3 min-h-[48px] text-base resize-none"
                disabled={isLoading}
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary hover:bg-primary/90 shrink-0 mb-0.5 mr-0.5 transition-transform active:scale-95"
                size="icon"
              >
                <Send className="w-5 h-5 ml-1" />
              </Button>
            </form>
            <div className="text-[11px] text-center text-muted-foreground mt-3 flex items-center justify-center gap-1.5 font-medium tracking-wide">
               <Sparkles className="w-3 h-3 text-primary/70" /> BioChem Tutor can make mistakes. Always verify medical information.
            </div>
        </div>
      </div>
    </div>
  );
}
