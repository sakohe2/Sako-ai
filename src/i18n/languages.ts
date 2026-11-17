export interface WorldLanguage {
  code: string;
  nativeName: string;
  ruName: string;
  enName: string;
  rtl?: boolean;
  greeting: string;
}

export const WORLD_LANGUAGES: WorldLanguage[] = [
  { code: 'ru', nativeName: 'Русский', ruName: 'Русский', enName: 'Russian', greeting: 'Привет! Я SAKO AI, твой живой и эмоциональный помощник. Давай общаться!' },
  { code: 'kk', nativeName: 'Қазақша', ruName: 'Казахский', enName: 'Kazakh', greeting: 'Сәлем! Мен SAKO AI-мын, сенің жанды көмекшің. Сөйлесейік!' },
  { code: 'en', nativeName: 'English', ruName: 'Английский', enName: 'English', greeting: 'Hey there! I am SAKO AI — warm, expressive, and ready to help!' },
  { code: 'uz', nativeName: 'Oʻzbekcha', ruName: 'Узбекский', enName: 'Uzbek', greeting: 'Salom! Men SAKO AI — sizning jonli va aqlli yordamchingizman!' },
  { code: 'tr', nativeName: 'Türkçe', ruName: 'Турецкий', enName: 'Turkish', greeting: 'Merhaba! Ben SAKO AI, canlı ve duygusal yapay zeka asistanın!' },
  { code: 'ky', nativeName: 'Кыргызча', ruName: 'Киргизский', enName: 'Kyrgyz', greeting: 'Салам! Мен SAKO AI — сенин жандуу жана акылдуу жардамчыңмын!' },
  { code: 'az', nativeName: 'Azərbaycanca', ruName: 'Азербайджанский', enName: 'Azerbaijani', greeting: 'Salam! Mən SAKO AI — sənin canlı və ağıllı köməkçinəm!' },
  { code: 'uk', nativeName: 'Українська', ruName: 'Украинский', enName: 'Ukrainian', greeting: 'Привіт! Я SAKO AI, твій живий та емоційний помічник!' },
  { code: 'be', nativeName: 'Беларуская', ruName: 'Белорусский', enName: 'Belarusian', greeting: 'Прывітанне! Я SAKO AI, твой жывы і разумны памочнік!' },
  { code: 'tg', nativeName: 'Тоҷикӣ', ruName: 'Таджикский', enName: 'Tajik', greeting: 'Салом! Ман SAKO AI, ёвари зинда ва ҳушманди ту ҳастам!' },
  { code: 'hy', nativeName: 'Հայերեն', ruName: 'Армянский', enName: 'Armenian', greeting: 'Բարև! Ես SAKO AI-ն եմ՝ քո խելացի ու կենդանի օգնականը:' },
  { code: 'ka', nativeName: 'ქართული', ruName: 'Грузинский', enName: 'Georgian', greeting: 'გამარჯობა! მე ვარ SAKO AI — შენი ჭკვიანი და ცოცხალი დამხმარე!' },
  { code: 'de', nativeName: 'Deutsch', ruName: 'Немецкий', enName: 'German', greeting: 'Hallo! Ich bin SAKO AI, dein lebendiger und hilfsbereiter KI-Assistent!' },
  { code: 'fr', nativeName: 'Français', ruName: 'Французский', enName: 'French', greeting: 'Salut ! Je suis SAKO AI, ton assistant IA expressif et chaleureux !' },
  { code: 'es', nativeName: 'Español', ruName: 'Испанский', enName: 'Spanish', greeting: '¡Hola! Soy SAKO AI, tu asistente inteligente, cercano y expresivo.' },
  { code: 'pt', nativeName: 'Português', ruName: 'Португальский', enName: 'Portuguese', greeting: 'Olá! Eu sou o SAKO AI, seu assistente inteligente e expressivo!' },
  { code: 'it', nativeName: 'Italiano', ruName: 'Итальянский', enName: 'Italian', greeting: 'Ciao! Sono SAKO AI, il tuo assistente vivace ed espressivo!' },
  { code: 'nl', nativeName: 'Nederlands', ruName: 'Нидерландский', enName: 'Dutch', greeting: 'Hoi! Ik ben SAKO AI, jouw energieke en slimme AI-assistent!' },
  { code: 'pl', nativeName: 'Polski', ruName: 'Польский', enName: 'Polish', greeting: 'Cześć! Jestem SAKO AI, Twój żywy i pomocny asystent!' },
  { code: 'cs', nativeName: 'Čeština', ruName: 'Чешский', enName: 'Czech', greeting: 'Ahoj! Jsem SAKO AI, tvůj chytrý a přátelský asistent!' },
  { code: 'sk', nativeName: 'Slovenčina', ruName: 'Словацкий', enName: 'Slovak', greeting: 'Ahoj! Som SAKO AI, tvoj šikovný a priateľský asistent!' },
  { code: 'ro', nativeName: 'Română', ruName: 'Румынский', enName: 'Romanian', greeting: 'Salut! Sunt SAKO AI, asistentul tău inteligent și prietenos!' },
  { code: 'bg', nativeName: 'Български', ruName: 'Болгарский', enName: 'Bulgarian', greeting: 'Здравей! Аз съм SAKO AI, твоят жив и умен помощник!' },
  { code: 'sr', nativeName: 'Српски', ruName: 'Сербский', enName: 'Serbian', greeting: 'Здраво! Ја сам SAKO AI, твој живахни и паметни асистент!' },
  { code: 'hr', nativeName: 'Hrvatski', ruName: 'Хорватский', enName: 'Croatian', greeting: 'Bok! Ja sam SAKO AI, tvoj pametni i prijateljski asistent!' },
  { code: 'el', nativeName: 'Ελληνικά', ruName: 'Греческий', enName: 'Greek', greeting: 'Γεια σου! Είμαι ο SAKO AI, ο έξυπνος και εκφραστικός βοηθός σου!' },
  { code: 'hu', nativeName: 'Magyar', ruName: 'Венгерский', enName: 'Hungarian', greeting: 'Szia! SAKO AI vagyok, a barátságos és okos asszisztensed!' },
  { code: 'sv', nativeName: 'Svenska', ruName: 'Шведский', enName: 'Swedish', greeting: 'Hej! Jag är SAKO AI, din smarta och hjälpsamma assistent!' },
  { code: 'no', nativeName: 'Norsk', ruName: 'Норвежский', enName: 'Norwegian', greeting: 'Hei! Jeg er SAKO AI, din smarte og hyggelige assistent!' },
  { code: 'da', nativeName: 'Dansk', ruName: 'Датский', enName: 'Danish', greeting: 'Hej! Jeg er SAKO AI, din smarte og levende assistent!' },
  { code: 'fi', nativeName: 'Suomi', ruName: 'Финский', enName: 'Finnish', greeting: 'Hei! Olen SAKO AI, sinun älykäs ja lämminhenkinen apurisi!' },
  { code: 'et', nativeName: 'Eesti', ruName: 'Эстонский', enName: 'Estonian', greeting: 'Tere! Olen SAKO AI, sinu nutikas ja sõbralik abiline!' },
  { code: 'lv', nativeName: 'Latviešu', ruName: 'Латышский', enName: 'Latvian', greeting: 'Sveiki! Es esmu SAKO AI, tavs gudrais un draudzīgais palīgs!' },
  { code: 'lt', nativeName: 'Lietuvių', ruName: 'Литовский', enName: 'Lithuanian', greeting: 'Labas! Aš esu SAKO AI, tavo sumanus ir draugiškas padėjėjas!' },
  { code: 'ar', nativeName: 'العربية', ruName: 'Арабский', enName: 'Arabic', rtl: true, greeting: 'مرحباً! أنا SAKO AI، مساعدك الذكي والحيوي!' },
  { code: 'fa', nativeName: 'فارسی', ruName: 'Персидский', enName: 'Persian', rtl: true, greeting: 'سلام! من SAKO AI هستم، دستیار هوشمند و پرانرژی شما!' },
  { code: 'he', nativeName: 'עברית', ruName: 'Иврит', enName: 'Hebrew', rtl: true, greeting: 'שלום! אני SAKO AI, העוזר החכם והאנושי שלך!' },
  { code: 'ur', nativeName: 'اردو', ruName: 'Урду', enName: 'Urdu', rtl: true, greeting: 'سلام! میں SAKO AI ہوں، آپ کا ذہین اور مددگار ساتھی!' },
  { code: 'hi', nativeName: 'हिन्दी', ruName: 'Хинди', enName: 'Hindi', greeting: 'नमस्ते! मैं SAKO AI हूँ, आपका जीवंत और समझदार सहायक!' },
  { code: 'bn', nativeName: 'বাংলা', ruName: 'Бенгальский', enName: 'Bengali', greeting: 'হ্যালো! আমি SAKO AI, আপনার বুদ্ধিমান এবং প্রাণবন্ত সহায়ক!' },
  { code: 'ta', nativeName: 'தமிழ்', ruName: 'Тамильский', enName: 'Tamil', greeting: 'வணக்கம்! நான் SAKO AI, உங்கள் புத்திசாலி உதவியாளர்!' },
  { code: 'te', nativeName: 'తెలుగు', ruName: 'Телугу', enName: 'Telugu', greeting: 'నమస్కారం! నేను SAKO AI, మీ తెలివైన సహాయకుడిని!' },
  { code: 'mr', nativeName: 'मराठी', ruName: 'Маратхи', enName: 'Marathi', greeting: 'नमस्कार! मी SAKO AI आहे, तुमचा हुशार आणि मैत्रीपूर्ण मदतनीस!' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', ruName: 'Панджаби', enName: 'Punjabi', greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ SAKO AI ਹਾਂ, ਤੁਹਾਡਾ ਸਮਝਦਾਰ ਸਾਥੀ!' },
  { code: 'zh', nativeName: '中文 (简体)', ruName: 'Китайский (упр.)', enName: 'Chinese Simplified', greeting: '你好！我是 SAKO AI，你的聪明、热情又贴心的助手！' },
  { code: 'zh-TW', nativeName: '中文 (繁體)', ruName: 'Китайский (трад.)', enName: 'Chinese Traditional', greeting: '你好！我是 SAKO AI，你的聰明又充滿活力的助手！' },
  { code: 'ja', nativeName: '日本語', ruName: 'Японский', enName: 'Japanese', greeting: 'こんにちは！私は SAKO AI、あなたの頼もしくて感情豊かなパートナーです！' },
  { code: 'ko', nativeName: '한국어', ruName: 'Корейский', enName: 'Korean', greeting: '안녕하세요! 저는 따뜻하고 똑똑한 AI 파트너 SAKO AI입니다!' },
  { code: 'vi', nativeName: 'Tiếng Việt', ruName: 'Вьетнамский', enName: 'Vietnamese', greeting: 'Xin chào! Mình là SAKO AI, trợ lý thông minh và đầy cảm xúc của bạn!' },
  { code: 'th', nativeName: 'ไทย', ruName: 'Тайский', enName: 'Thai', greeting: 'สวัสดี! ฉันคือ SAKO AI ผู้ช่วยอัจฉริยะที่พร้อมคุยกับคุณ!' },
  { code: 'id', nativeName: 'Bahasa Indonesia', ruName: 'Индонезийский', enName: 'Indonesian', greeting: 'Halo! Aku SAKO AI, asisten cerdas yang ramah dan ekspresif!' },
  { code: 'ms', nativeName: 'Bahasa Melayu', ruName: 'Малайский', enName: 'Malay', greeting: 'Hai! Saya SAKO AI, pembantu pintar anda yang mesra!' },
  { code: 'tl', nativeName: 'Filipino', ruName: 'Филиппинский', enName: 'Filipino', greeting: 'Kumusta! Ako si SAKO AI, ang masigla at matalinong kausap mo!' },
  { code: 'mn', nativeName: 'Монгол', ruName: 'Монгольский', enName: 'Mongolian', greeting: 'Сайн байна уу! Би SAKO AI, таны ухаалаг бөгөөд найрсаг туслах!' },
  { code: 'sw', nativeName: 'Kiswahili', ruName: 'Суахили', enName: 'Swahili', greeting: 'Habari! Mimi ni SAKO AI, msaidizi wako mwenye akili na uchangamfu!' },
  { code: 'am', nativeName: 'አማርኛ', ruName: 'Амхарский', enName: 'Amharic', greeting: 'ሰላም! እኔ SAKO AI ነኝ፣ ብልህ እና ተግባቢ ረዳትዎ!' },
  { code: 'tt', nativeName: 'Татарча', ruName: 'Татарский', enName: 'Tatar', greeting: 'Сәлам! Мин SAKO AI — синең җанлы һәм акыллы ярдәмчең!' },
  { code: 'ba', nativeName: 'Башҡортса', ruName: 'Башкирский', enName: 'Bashkir', greeting: 'Сәләм! Мин SAKO AI — һинең йәнле һәм аҡыллы ярҙамсың!' },
];

export function getWorldLanguage(code: string): WorldLanguage {
  return (
    WORLD_LANGUAGES.find((l) => l.code === code) || {
      code,
      nativeName: code,
      ruName: code,
      enName: code,
      greeting: 'Hello! I am SAKO AI!',
    }
  );
}
