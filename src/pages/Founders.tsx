import { motion } from 'motion/react';
import { Mail, Github, Linkedin, Microscope, User, Info, Send } from 'lucide-react';
import { useSettingsStore } from '../lib/settingsStore';
import { getTranslation } from '../lib/i18n';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';

export default function Founders() {
  const { language } = useSettingsStore();

  const founders = [
    {
      name: 'Esonova Gulnoza',
      role: {
        uz: 'Loyiha muallifi',
        ru: 'Автор проекта',
        en: 'Project Creator'
      },
      image: '/teacher.jpg', // Rasmni public faylga teacher.jpg nomi bilan yuklang
      bio: {
        uz: 'Toshkent davlat tibbiyot universiteti Tibbiy va biologik kimyo kafedrasi assistenti.',
        ru: 'Ассистент кафедры медицинской и биологической химии Ташкентского государственного медицинского университета.',
        en: 'Assistant teacher at the Medical and Biological Biochemistry Department of Tashkent State Medical University.'
      },
      icon: Microscope,
    },
    {
      name: 'Islomjon Izbasarov',
      role: {
        uz: 'Loyiha muallifi',
        ru: 'Автор проекта',
        en: 'Project Creator'
      },
      image: '/student.jpg', // Rasmni public faylga student.jpg nomi bilan yuklang
      bio: {
        uz: 'Full-stack dasturchi. Toshkent davlat tibbiyot universiteti talabasi.',
        ru: 'Full-stack разработчик. Студент Ташкентского государственного медицинского университета.',
        en: 'Full stack developer. Student at Tashkent State Medical University.'
      },
      icon: User,
      email: 'izbosarovislomjon@gmail.com',
      linkedin: 'https://www.linkedin.com/in/islomjon-izbasarov',
      github: 'https://github.com/izbasarovislomjon',
      telegram: 'https://t.me/iizbasarov_106'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 pb-24">
      <div className="text-center mb-16 space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
        >
          {language === 'uz' ? 'Loyihamiz Asoschilari' : language === 'ru' ? 'Создатели проекта' : 'Our Founders'}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          {language === 'uz' ? "BioChem platformasi ortidagi ijodkorlar va akademik ustozlar bilan tanishing. Ilmiy yondashuv va innovatsion ta'lim dizaynini uyg'unlashtirgan holda, jamoamiz talabalar uchun biokimyo fanini o'rganishni yanada interaktiv, qulay va qiziqarli qilishga harakat qiladi." 
           : language === 'ru' ? "Познакомьтесь с создателями и академическими наставниками платформы BioChem. Сочетая научное руководство с инновационным образовательным дизайном, наша команда стремится сделать изучение биохимии более интерактивным, доступным и увлекательным для студентов."
           : "Meet the creator and academic mentor behind the BioChem platform. Combining scientific guidance with innovative educational design, our team is dedicated to making biochemistry learning more interactive, accessible, and engaging for students."}
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-stretch">
        {founders.map((founder, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="flex flex-col h-full"
          >
            <Card className="flex-1 bg-card border-border overflow-hidden group hover:border-primary/50 transition-colors">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="h-64 md:h-[350px] relative bg-muted overflow-hidden flex-shrink-0">
                  <img 
                    src={founder.image} 
                    alt={founder.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-center"
                  />
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-foreground">{founder.name}</h2>
                    <p className="text-primary font-medium mt-1">
                      {founder.role[language as 'uz'|'ru'|'en'] || founder.role['en']}
                    </p>
                  </div>
                  <div className="flex-1 text-muted-foreground leading-relaxed">
                    {founder.bio[language as 'uz'|'ru'|'en'] || founder.bio['en']}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border flex justify-center gap-4">
                    {founder.email && (
                      <a href={`mailto:${founder.email}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors text-muted-foreground">
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                    {founder.linkedin && (
                      <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors text-muted-foreground">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {founder.github && (
                      <a href={founder.github} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors text-muted-foreground">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {(founder as any).telegram && (
                      <a href={(founder as any).telegram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors text-muted-foreground">
                        <Send className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 text-center text-sm text-muted-foreground opacity-70"
      >
        <p>BioChem Edu &copy; 2026. Made with passion for science and technology.</p>
      </motion.div>
    </div>
  );
}
