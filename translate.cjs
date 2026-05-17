const fs = require('fs');

function updateI18n() {
  let content = fs.readFileSync('src/lib/i18n.ts', 'utf-8');
  
  // English
  if (!content.includes('dashboard: {')) {
    content = content.replace("en: {", "en: {\n    dashboard: {\n      welcomeBack: 'Welcome back,',\n      student: 'Student',\n      subtitle: 'Continue your journey in medical biochemistry.',\n      level: 'Level',\n      xp: 'XP',\n      streak: 'Streak',\n      days: 'Days',\n      currentModule: 'Current Module',\n      continueLearning: 'Continue Learning',\n      recommendedTopics: 'Recommended Topics',\n      startLearning: 'Start learning',\n      aiAnalysis: 'AI Performance Analysis',\n      basedOnRecent: 'Based on your recent worksheets',\n      reviewWeak: 'Review weak areas with AI Tutor',\n    },");
  }
  // Uzbek
  if (!content.includes("dashboard: {\n      welcomeBack: 'Xush kelibsiz,'")) {
    content = content.replace("uz: {", "uz: {\n    dashboard: {\n      welcomeBack: 'Xush kelibsiz,',\n      student: 'Talaba',\n      subtitle: 'Tibbiy biokimyo bo\\'yicha bilim o\\'rganishda davom eting.',\n      level: 'Daraja',\n      xp: 'XP',\n      streak: 'Ketma-ketlik',\n      days: 'Kun',\n      currentModule: 'Joriy modul',\n      continueLearning: 'O\\'qishni davom ettirish',\n      recommendedTopics: 'Tavsiya etilgan mavzular',\n      startLearning: 'O\\'rganishni boshlash',\n      aiAnalysis: 'AI Natijalar Tahlili',\n      basedOnRecent: 'So\\'nggi topshiriqlar asosida',\n      reviewWeak: 'AI Tyutor bilan takrorlash',\n    },");
  }
  // Russian
  if (!content.includes("dashboard: {\n      welcomeBack: 'С возвращением,'")) {
    content = content.replace("ru: {", "ru: {\n    dashboard: {\n      welcomeBack: 'С возвращением,',\n      student: 'Студент',\n      subtitle: 'Продолжайте изучение в области медицинской биохимии.',\n      level: 'Уровень',\n      xp: 'XP',\n      streak: 'Серия',\n      days: 'Дней',\n      currentModule: 'Текущий модуль',\n      continueLearning: 'Продолжить обучение',\n      recommendedTopics: 'Рекомендуемые темы',\n      startLearning: 'Начать изучение',\n      aiAnalysis: 'ИИ Анализ успеваемости',\n      basedOnRecent: 'На основе последних заданий',\n      reviewWeak: 'Повторить темы с ИИ Тьютором',\n    },");
  }

  // AITutor
  if(!content.includes('aiTutor: {')){
    content = content.replace("en: {", "en: {\n    aiTutor: {\n      title: 'AI Tutor',\n      subtitle: 'Your personal medical biochemistry assistant',\n      hint1: 'Tell me about enzyme kinetics',\n      hint2: 'Explain DNA replication',\n      hint3: 'What is glycolysis?',\n      startNew: 'Start a new conversation',\n      placeholder: 'Type your question...',\n    },");
    content = content.replace("uz: {", "uz: {\n    aiTutor: {\n      title: 'AI Tyutor',\n      subtitle: 'Yordamchi tibbiy biokimyo tyutori',\n      hint1: 'Enzim kinetikasini tushuntirib bering',\n      hint2: 'DNK replikatsiyasini tushuntirib bering',\n      hint3: 'Glikoliz nima?',\n      startNew: 'Yangi suhbat boshlash',\n      placeholder: 'Savolingizni yozing...',\n    },");
    content = content.replace("ru: {", "ru: {\n    aiTutor: {\n      title: 'ИИ Тьютор',\n      subtitle: 'Ваш личный ассистент по медицинской биохимии',\n      hint1: 'Расскажите о кинетике ферментов',\n      hint2: 'Объясните репликацию ДНК',\n      hint3: 'Что такое гликолиз?',\n      startNew: 'Начать новый диалог',\n      placeholder: 'Введите свой вопрос...',\n    },");
  }

  // Worksheets
  if(!content.includes('worksheets: {')){
    content = content.replace("en: {", "en: {\n    worksheets: {\n      title: 'Worksheets & Quizzes',\n      subtitle: 'Test your knowledge with adaptive assessments.',\n      noWorksheets: 'No worksheets available',\n      checkBack: 'Check back later for new exercises.',\n      questions: 'Questions',\n      review: 'Review Answers',\n      start: 'Start Worksheet',\n    },");
    content = content.replace("uz: {", "uz: {\n    worksheets: {\n      title: 'Mashqlar va Testlar',\n      subtitle: 'O\\'z bilimlaringizni moslashuvchan testlar bilan tekshiring.',\n      noWorksheets: 'Mashqlar hozircha mavjud emas',\n      checkBack: 'Yangi mashqlar tez orada qo\\'shiladi.',\n      questions: 'Savollar',\n      review: 'Javoblarni ko\\'rish',\n      start: 'Mashqni boshlash',\n    },");
    content = content.replace("ru: {", "ru: {\n    worksheets: {\n      title: 'Рабочие листы и Тесты',\n      subtitle: 'Проверьте свои знания с помощью тестов.',\n      noWorksheets: 'Нет доступных рабочих листов',\n      checkBack: 'Загляните позже для новых заданий.',\n      questions: 'Вопросы',\n      review: 'Просмотр ответов',\n      start: 'Начать',\n    },");
  }

  // Library
  if(!content.includes('libraryPage: {')){
    content = content.replace("en: {", "en: {\n    libraryPage: {\n      title: 'Digital Library',\n      subtitle: 'Access books, papers, and research materials.',\n      books: 'Books',\n      papers: 'Research Papers',\n      clinical: 'Clinical Guidelines',\n      read: 'Read',\n    },");
    content = content.replace("uz: {", "uz: {\n    libraryPage: {\n      title: 'Elektron Kutubxona',\n      subtitle: 'Kitoblar, maqolalar va tadqiqot materiallari.',\n      books: 'Kitoblar',\n      papers: 'Ilmiy maqolalar',\n      clinical: 'Klinik qo\\'llanmalar',\n      read: 'O\\'qish',\n    },");
    content = content.replace("ru: {", "ru: {\n    libraryPage: {\n      title: 'Электронная Библиотека',\n      subtitle: 'Доступ к книгам, статьям и материалам.',\n      books: 'Книги',\n      papers: 'Научные статьи',\n      clinical: 'Клинические руководства',\n      read: 'Читать',\n    },");
  }
  
  // Lab
  if(!content.includes('labPage: {')){
    content = content.replace("en: {", "en: {\n    labPage: {\n      title: 'Virtual Lab Simulations',\n      subtitle: 'Practice biochemical techniques in a safe, simulated environment.',\n      start: 'Start Simulation',\n      difficulty: 'Difficulty',\n    },");
    content = content.replace("uz: {", "uz: {\n    labPage: {\n      title: 'Virtual Lab Simulyatsiyalari',\n      subtitle: 'Xavfsiz va simulyatsiya qilingan muhitda biokimyoviy tajribalarni o\\'tkazing.',\n      start: 'Simulyatsiyani boshlash',\n      difficulty: 'Qiyinchilik',\n    },");
    content = content.replace("ru: {", "ru: {\n    labPage: {\n      title: 'Виртуальные Лаб Симуляции',\n      subtitle: 'Практикуйте техники в безопасной среде.',\n      start: 'Начать симуляцию',\n      difficulty: 'Сложность',\n    },");
  }

  fs.writeFileSync('src/lib/i18n.ts', content);
}

function updateDashboard() {
  let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

  // Insert useSettingsStore and getTranslation
  if (!content.includes('useSettingsStore')) {
    content = content.replace("import { useUserStore } from '../lib/store';", "import { useUserStore } from '../lib/store';\nimport { useSettingsStore } from '../lib/settingsStore';\nimport { getTranslation } from '../lib/i18n';");
  }

  if (!content.includes('const { language } = useSettingsStore()')) {
    content = content.replace('const { user } = useUserStore();', 'const { user } = useUserStore();\n  const { language } = useSettingsStore();\n  const t = (section, key) => getTranslation(language as any, section as any, key);');
  }

  content = content.replace(/Welcome back, \{user\?.displayName\?.split\(' '\)\[0\] \|\| 'Student'\} 👋/, "{t('dashboard', 'welcomeBack')} {user?.displayName?.split(' ')[0] || t('dashboard', 'student')} 👋");
  content = content.replace(/Continue your journey in medical biochemistry\./, "{t('dashboard', 'subtitle')}");
  content = content.replace(/Level \{user\?.level \|\| 1\}/, "{t('dashboard', 'level')} {user?.level || 1}");
  content = content.replace(/\{user\?.xp \|\| 0\} XP/, "{user?.xp || 0} {t('dashboard', 'xp')}");
  content = content.replace(/>Streak</, ">{t('dashboard', 'streak')}<");
  content = content.replace(/>\{stats\.streak\} Days</, ">{stats.streak} {t('dashboard', 'days')}<");
  content = content.replace(/>\s*Current Module\s*</, ">{t('dashboard', 'currentModule')}<");
  content = content.replace(/>Continue Learning\s*\n\s*<ChevronRight/, ">{t('dashboard', 'continueLearning')}\n<ChevronRight");
  content = content.replace(/>\s*Recommended Topics\s*</, ">{t('dashboard', 'recommendedTopics')}<");
  content = content.replace(/>\s*Start learning\s*<ChevronRight/, ">{t('dashboard', 'startLearning')} <ChevronRight");
  content = content.replace(/>AI Performance Analysis</, ">{t('dashboard', 'aiAnalysis')}<");
  content = content.replace(/>Based on your recent worksheets</, ">{t('dashboard', 'basedOnRecent')}<");
  content = content.replace(/>Review weak areas with AI Tutor</, ">{t('dashboard', 'reviewWeak')}<");

  fs.writeFileSync('src/pages/Dashboard.tsx', content);
}

function updateAITutor() {
  let content = fs.readFileSync('src/pages/AITutor.tsx', 'utf-8');
  if (!content.includes('useSettingsStore')) {
    content = content.replace("import { useUserStore } from '../lib/store';", "import { useUserStore } from '../lib/store';\nimport { useSettingsStore } from '../lib/settingsStore';\nimport { getTranslation } from '../lib/i18n';");
    content = content.replace('const { user } = useUserStore();', 'const { user } = useUserStore();\n  const { language } = useSettingsStore();\n  const t = (section, key) => getTranslation(language as any, section as any, key);');
  }

  content = content.replace(/>AI Tutor</, ">{t('aiTutor', 'title')}<");
  content = content.replace(/>Your personal medical biochemistry assistant</, ">{t('aiTutor', 'subtitle')}<");
  content = content.replace(/'Tell me about enzyme kinetics'/, "t('aiTutor', 'hint1')");
  content = content.replace(/'Explain DNA replication'/, "t('aiTutor', 'hint2')");
  content = content.replace(/'What is glycolysis\?'/, "t('aiTutor', 'hint3')");
  content = content.replace(/>Start a new conversation</, ">{t('aiTutor', 'startNew')}<");
  content = content.replace(/placeholder="Type your question..."/, 'placeholder={t("aiTutor", "placeholder")}');
  
  fs.writeFileSync('src/pages/AITutor.tsx', content);
}

function updateWorksheets() {
  let content = fs.readFileSync('src/pages/Worksheets.tsx', 'utf-8');
  if (!content.includes('useSettingsStore')) {
    content = content.replace("import { useNavigate }", "import { useNavigate }\nimport { useSettingsStore } from '../lib/settingsStore';\nimport { getTranslation } from '../lib/i18n';");
    content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { language } = useSettingsStore();\n  const t = (section, key) => getTranslation(language as any, section as any, key);');
  }

  content = content.replace(/>Worksheets & Quizzes</, ">{t('worksheets', 'title')}<");
  content = content.replace(/>Test your knowledge with adaptive assessments\.</, ">{t('worksheets', 'subtitle')}<");
  content = content.replace(/>No worksheets available</, ">{t('worksheets', 'noWorksheets')}<");
  content = content.replace(/>Check back later for new exercises\.</, ">{t('worksheets', 'checkBack')}<");
  content = content.replace(/> \{ws\.questions\?\.length \|\| 0\} Questions/, "> {ws.questions?.length || 0} {t('worksheets', 'questions')}");
  content = content.replace(/\{ws\.status === 'completed' \? 'Review Answers' : 'Start Worksheet'\}/, "{ws.status === 'completed' ? t('worksheets', 'review') : t('worksheets', 'start')}");

  fs.writeFileSync('src/pages/Worksheets.tsx', content);
}

function updateLibrary() {
  let content = fs.readFileSync('src/pages/Library.tsx', 'utf-8');
  if (!content.includes('useSettingsStore')) {
    content = content.replace("import { FileText,", "import { useSettingsStore } from '../lib/settingsStore';\nimport { getTranslation } from '../lib/i18n';\nimport { FileText,");
    content = content.replace('const [searchQuery, setSearchQuery]', 'const { language } = useSettingsStore();\n  const t = (section, key) => getTranslation(language as any, section as any, key);\n  const [searchQuery, setSearchQuery]');
  }

  content = content.replace(/>Digital Library</, ">{t('libraryPage', 'title')}<");
  content = content.replace(/>Access books, papers, and research materials\.</, ">{t('libraryPage', 'subtitle')}<");
  content = content.replace(/>Books</, ">{t('libraryPage', 'books')}<");
  content = content.replace(/>Research Papers</g, ">{t('libraryPage', 'papers')}<");
  content = content.replace(/>Clinical Guidelines</g, ">{t('libraryPage', 'clinical')}<");
  content = content.replace(/>Read</g, ">{t('libraryPage', 'read')}<");

  fs.writeFileSync('src/pages/Library.tsx', content);
}

function updateLab() {
  let content = fs.readFileSync('src/pages/LabSimulations.tsx', 'utf-8');
  if (!content.includes('useSettingsStore')) {
    content = content.replace("import { Beaker,", "import { useSettingsStore } from '../lib/settingsStore';\nimport { getTranslation } from '../lib/i18n';\nimport { Beaker,");
    content = content.replace('export default function LabSimulations', 'export default function LabSimulations() {\n  const { language } = useSettingsStore();\n  const t = (section, key) => getTranslation(language as any, section as any, key);\nreturn (');
    // Remove the old 'return (' and function def
    content = content.replace('export default function LabSimulations() {\n  const { language }', 'export default function LabSimulations() {\n  const { language }'); 
  }
  
  // I need to be more careful with regex replacing whole functions.
  // Actually let's just do it directly.
  fs.writeFileSync('src/pages/LabSimulations.tsx', content);
}

const fixLabFn = () => {
  let content = fs.readFileSync('src/pages/LabSimulations.tsx', 'utf-8');
  if(!content.includes('useSettingsStore')){
     content = content.replace('export default function LabSimulations() {', 'export default function LabSimulations() {\n  const { language } = useSettingsStore();\n  const t = (section, key) => getTranslation(language as any, section as any, key);');
  }
  content = content.replace(/>Virtual Lab Simulations</, ">{t('labPage', 'title')}<");
  content = content.replace(/>Practice biochemical techniques in a safe, simulated environment\.</, ">{t('labPage', 'subtitle')}<");
  content = content.replace(/>Start Simulation</g, ">{t('labPage', 'start')}<");
  content = content.replace(/>Difficulty</g, ">{t('labPage', 'difficulty')}<");
  fs.writeFileSync('src/pages/LabSimulations.tsx', content);
}

updateI18n();
updateDashboard();
updateAITutor();
updateWorksheets();
updateLibrary();
fixLabFn();

console.log('updated fully translated');
