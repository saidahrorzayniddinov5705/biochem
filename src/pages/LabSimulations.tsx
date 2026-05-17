import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Beaker, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';

export default function LabSimulations() {
  const { language } = useSettingsStore();
  const t = (section, key) => getTranslation(language as any, section as any, key);
  const labs = [
    { title: 'Bilirubin Analysis', desc: 'Perform a Van den Bergh reaction test to distinguish direct and indirect bilirubin.', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { title: 'Urine Dipstick', desc: 'React strips with urine to detect ketones, glucose, and proteins.', color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Spectrophotometry', desc: 'Measure absorbance to determine protein concentration using a standard curve.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{t('labPage', 'title')}</h1>
        <p className="text-muted-foreground">{t('labPage', 'subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab, i) => (
          <Card key={i} className="bg-card border-border hover:border-border transition-colors">
            <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${lab.bg} ${lab.color}`}>
                  <Beaker className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{lab.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{lab.desc}</p>
                
                <Button className="w-full bg-muted text-foreground hover:bg-muted/80 border border-border cursor-not-allowed text-muted-foreground" disabled>
                  {language === 'uz' ? 'Tez orada' : language === 'ru' ? 'Скоро' : 'Coming Soon'}
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
