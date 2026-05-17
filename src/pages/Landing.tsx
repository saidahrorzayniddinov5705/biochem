import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Book, ArrowRight, Dna, Activity, Stethoscope } from 'lucide-react';
import { Button, buttonVariants } from '../components/ui/button';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { Globe } from 'lucide-react';

export default function Landing() {
  const { language, setLanguage } = useSettingsStore();
  const t = (key: string) => getTranslation(language as any, 'landing', key);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <main className="pb-24 pt-16 px-6 relative overflow-x-hidden">
        {/* Background effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{t('heroTitle')}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            >
              {t('heroDesc')}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-4 pt-4"
            >
              <Link to="/login">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12 text-base font-semibold">
                  {t('startLearning')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: t('feature1Title'),
                description: t('feature1Desc'),
                icon: BrainCircuit,
                color: "text-primary",
                bg: "bg-primary/10"
              },
              {
                title: t('feature2Title'),
                description: t('feature2Desc'),
                icon: Stethoscope,
                color: "text-primary",
                bg: "bg-primary/10"
              },
              {
                title: t('feature3Title'),
                description: t('feature3Desc'),
                icon: Activity,
                color: "text-purple-400",
                bg: "bg-purple-400/10"
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
