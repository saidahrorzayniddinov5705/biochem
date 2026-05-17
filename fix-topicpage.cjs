const fs = require('fs');

function updateI18n() {
  let content = fs.readFileSync('src/lib/i18n.ts', 'utf-8');
  
  if (!content.includes('practiceConcepts:')) {
    content = content.replace("overview: 'Overview',", "overview: 'Overview',\n      lesson: 'Lesson',\n      stuckOn: 'Stuck on',\n      askAITutor: 'Ask the AI Tutor.',\n      askQuestion: 'Ask Question',\n      practiceConcepts: 'Practice key concepts with spaced repetition.',\n      practiceFlashcards: 'Practice Flashcards',");

    content = content.replace("overview: 'Umumiy ma\\'lumot',", "overview: 'Umumiy ma\\'lumot',\n      lesson: 'Dars',\n      stuckOn: 'Tushunmadingizmi',\n      askAITutor: 'AI Tyutordan so\\'rang.',\n      askQuestion: 'Savol berish',\n      practiceConcepts: 'Asosiy tushunchalarni takrorlash.',\n      practiceFlashcards: 'Fleshkartalarni mashq qilish',");

    content = content.replace("overview: 'Обзор',", "overview: 'Обзор',\n      lesson: 'Урок',\n      stuckOn: 'Непонятно',\n      askAITutor: 'Спросите ИИ Тьютора.',\n      askQuestion: 'Задать вопрос',\n      practiceConcepts: 'Повторите ключевые концепции.',\n      practiceFlashcards: 'Тренировать флешкарточки',");
  }

  fs.writeFileSync('src/lib/i18n.ts', content);
}

function updateTopicPage() {
  let content = fs.readFileSync('src/pages/TopicPage.tsx', 'utf-8');
  
  content = content.replace(/Lesson \{index \+ 1\}/, "{getTranslation(language, 'topic', 'lesson')} {index + 1}");
  content = content.replace(/Topic not found\./, "{getTranslation(language, 'modulesPage', 'noTopics')}");
  
  content = content.replace(/Stuck on "\{topic\.title\}"\? Ask the AI Tutor\./, "{getTranslation(language, 'topic', 'stuckOn')} \\\"{topic.title}\\\"? {getTranslation(language, 'topic', 'askAITutor')}");
  content = content.replace(/>Ask Question</, ">{getTranslation(language, 'topic', 'askQuestion')}<");
  
  content = content.replace(/Practice key concepts with spaced repetition\./, "{getTranslation(language, 'topic', 'practiceConcepts')}");
  content = content.replace(/>\s*Practice Flashcards\s*</, ">{getTranslation(language, 'topic', 'practiceFlashcards')}<");
  
  fs.writeFileSync('src/pages/TopicPage.tsx', content);
}

function updateModules() {
  let content = fs.readFileSync('src/pages/Modules.tsx', 'utf-8');
  content = content.replace(/Tibbiy biokimyo fanidan ma'ruza va amaliy mashg'ulotlar\./, "{getTranslation(language, 'modulesPage', 'subtitle')}");
  content = content.replace(/>Darslar topilmadi</, ">{getTranslation(language, 'modulesPage', 'noTopics')}<");
  content = content.replace(/>Darslar ro'yxati hali shakllantirilmagan\.</, ">{getTranslation(language, 'modulesPage', 'noTopicsDesc')}<");
  fs.writeFileSync('src/pages/Modules.tsx', content);
}

updateI18n();
updateTopicPage();
updateModules();

console.log('updated topic page');
