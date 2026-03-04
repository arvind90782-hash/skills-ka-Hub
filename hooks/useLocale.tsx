import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CardItem } from '../types';
import { logUsageEvent } from '../services/analyticsService';

export interface LanguageOption {
  code: string;
  label: string;
}

type SupportedUiLanguage = 'en' | 'hi' | 'hinglish';
type TranslationMap = Record<string, string>;

const STORAGE_KEY = 'app_language';

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'hinglish', label: 'Hinglish' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bangla' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
];

const translations: Record<SupportedUiLanguage, TranslationMap> = {
  hinglish: {
    'header.brand': 'Skills Ka Adda',
    'header.journey': 'Aapka Freelance Safar',
    'header.admin': 'Admin',
    'header.logout': 'Logout',
    'header.userFallback': 'No user',
    'header.toggleTheme': 'Theme toggle karo',
    'header.language': 'Language',

    'home.badge': 'Next-Gen Learning Hub',
    'home.title': 'Skills Ka Adda',
    'home.subtitle': 'Aapka freelance safar yahan se shuru hota hai. AI tools aur modern skills seekho, ultra-fast tarike se.',
    'home.learningPaths': 'Learning Paths',
    'home.freelanceSkills': 'Freelance Skills',
    'home.aiPowerups': 'AI Powerups',
    'home.smartTools': 'Smart AI Tools',

    'common.backTools': 'Sabhi Tools',
    'common.backSkills': 'Sabhi Skills',
    'common.generate': 'Generate Karein',
    'common.analyze': 'Analyze Karein',
    'common.analyzing': 'Analysis ho raha hai...',
    'common.retry': 'Phir Try Karein',
    'common.results': 'Natija',
    'common.askQuestion': 'Aapka Sawal',
    'common.page': 'Page',
    'common.of': 'of',
    'common.story': 'Story',

    'auth.membersOnly': 'Members Only',
    'auth.required': 'Website access ke liye login/signup compulsory hai.',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.loginTitle': 'Login Karo',
    'auth.signupTitle': 'Account Banao',
    'auth.preferredLang': 'Preferred language',
    'auth.setupMissing': 'Auth Setup Missing',
    'auth.setupMissingDesc': 'Firebase keys configure nahi hain. `.env` me auth values add karo, tabhi login/signup chalega.',
    'auth.errorRequired': 'Email aur password dono required hain.',
    'auth.errorPasswordMin': 'Password minimum 6 characters ka hona chahiye.',
    'auth.errorFailed': 'Authentication fail ho gaya.',
    'auth.passwordPlaceholder': 'Minimum 6 characters',
    'auth.wait': 'Please wait...',
    'auth.or': 'ya',
    'auth.forgotPassword': 'Forgot password?',
    'auth.google': 'Google se continue karo',
    'auth.resetNeedEmail': 'Reset link bhejne ke liye pehle email daalo.',
    'auth.resetSent': 'Password reset email bhej diya. Inbox check karo.',

    'error.title': 'Arre! Kuch gadbad ho gayi.',

    'admin.title': 'Admin Control Panel',

    'card.start': 'Start Learning',
    'copy.title': 'Clipboard par copy karein',

    'tool.imageAnalyzer.title': 'Chitra Reporter',
    'tool.imageAnalyzer.subtitle': 'Photo upload karo aur AI se uske raaz jaano.',
    'tool.imageAnalyzer.errorMissing': 'Pehle ek photo upload karein aur sawal likhein.',
    'tool.imageAnalyzer.ask': 'Jaise: Is design ko aur behtar kaise banayein?',
    'tool.imageAnalyzer.step1': 'Step 1: Photo Chunein',
    'tool.imageAnalyzer.step2': 'Step 2: Aapka Sawal',
    'tool.imageAnalyzer.resultLabel': 'Result: AI Ka Natija',
    'tool.imageAnalyzer.loadingHint': 'AI aapki photo ko samajh raha hai...',
    'tool.imageAnalyzer.resultHint': 'Result yahan dikhega',
    'tool.imageAnalyzer.insight': 'AI Insight',
    'tool.imageAnalyzer.upload': 'Upload Photo',

    'tool.videoAnalyzer.title': 'Video Ka Jasoos',
    'tool.videoAnalyzer.subtitle': 'Video upload karo aur uske deep insights pao.',
    'tool.videoAnalyzer.upload': 'Video Upload Karein',
    'tool.videoAnalyzer.ask': 'Jaise: Is video mein main points kya hain?',
    'tool.videoAnalyzer.resultTitle': 'Analysis Ka Natija',
    'tool.videoAnalyzer.loading': 'AI aapke video ko frame by frame dekh raha hai...',
    'tool.videoAnalyzer.errorMissing': 'Pehle ek video upload karein aur sawal likhein.',

    'tool.imageAnimator.title': 'Photo Ko Jivdan Do',
    'tool.imageAnimator.subtitle': 'Apni photo ko AI se video me badlo.',
    'tool.imageAnimator.apiTitle': 'API Key Zaroori Hai',
    'tool.imageAnimator.apiDesc':
      'Veo video generation ke liye ek paid Google Cloud project ki API key chahiye. Neeche button par click karke key chunein.',
    'tool.imageAnimator.selectKey': 'API Key Chunein',
    'tool.imageAnimator.learnBilling': 'Billing ke baare mein aur jaanein',
    'tool.imageAnimator.upload': 'Shuruaati Photo',
    'tool.imageAnimator.prompt': 'Animation Kaisa Ho? (Prompt)',
    'tool.imageAnimator.promptHint': 'Jaise: Ek astronaut chaand par dance kar raha hai',
    'tool.imageAnimator.aspect': 'Video Ka Size (Aspect Ratio)',
    'tool.imageAnimator.landscape': 'Landscape (16:9)',
    'tool.imageAnimator.portrait': 'Portrait (9:16)',
    'tool.imageAnimator.resultTitle': 'Aapki Animated Video',
    'tool.imageAnimator.loading': 'Video ban rahi hai...',
    'tool.imageAnimator.loadingDefault': 'AI jaadugar apna kaam kar raha hai...',
    'tool.imageAnimator.errorMissing': 'Pehle ek photo upload karein aur prompt likhein.',
    'tool.imageAnimator.errorKey': 'Aapki API key kaam nahi kar rahi. Please ek doosri key chunein.',

    'tool.imageGenerator.title': 'Chitra-AI',
    'tool.imageGenerator.subtitle': 'Apne shabdon se shaandaar tasveerein banao.',
    'tool.imageGenerator.apiTitle': 'API Key Zaroori Hai',
    'tool.imageGenerator.apiDesc':
      'High-quality image generation ke liye ek paid Google Cloud project ki API key chahiye. Neeche button par click karke key chunein.',
    'tool.imageGenerator.selectKey': 'API Key Chunein',
    'tool.imageGenerator.learnBilling': 'Billing ke baare mein aur jaanein',
    'tool.imageGenerator.prompt': 'Aapko Kaisi Image Chahiye?',
    'tool.imageGenerator.promptHint': 'Jaise: A futuristic city in India with flying cars, photorealistic style',
    'tool.imageGenerator.quality': 'Image Quality',
    'tool.imageGenerator.resultTitle': 'Aapki AI Image',
    'tool.imageGenerator.loading': 'Image ban rahi hai...',
    'tool.imageGenerator.errorMissing': 'Pehle ek prompt likhein.',
    'tool.imageGenerator.errorKey': 'Aapki API key kaam nahi kar rahi. Please ek doosri key chunein.',

    'tool.rocketWriter.title': 'Rocket Writer',
    'tool.rocketWriter.subtitle': 'Turant jawab, bina intezaar kiye.',
    'tool.rocketWriter.prompt': 'Aapko kya likhwana hai?',
    'tool.rocketWriter.promptHint': 'Jaise: 5 creative taglines for a coffee shop',
    'tool.rocketWriter.loading': 'Likha jaa raha hai...',
    'tool.rocketWriter.error': 'Rocket Writer mein kuch gadbad ho gayi.',

    'tool.qna.title': 'AI Dost',
    'tool.qna.subtitle': 'Google Search Powered Assistant',
    'tool.qna.welcome':
      'Namaste! Main hoon AI Dost, ab Google Search ki shakti ke saath. Aapka koi bhi sawal ho, yahan pooch sakte hain.',
    'tool.qna.input': 'Apna sawal yahan type karein...',
    'tool.qna.disclaimer': 'AI Dost can make mistakes. Check important info.',
    'tool.qna.startError': 'Chat shuru karne me issue aa gaya. API key/billing ek baar check karo.',
    'tool.qna.replyError': 'Sorry, abhi AI response nahi de pa raha. Thodi der baad try karein.',

    'category.skillNotFound': 'Skill nahi mili!',
    'category.backHome': 'Home par wapas jaayein',
    'category.generating': 'Aapka {skill} course ban raha hai...',
    'category.empty': 'Iss skill ke liye koi stable content nahi mila.',
    'category.expertTip': 'Expert Salah',
    'category.template': 'Template',
    'category.reward': 'Aapka Inaam',
    'category.didYouKnow': 'Kya Aap Jaante Hain?',
    'category.infographic': 'Infographic Note',

    'quiz.title': 'Chalo, Dimaag Lagayein!',
    'quiz.correct': 'Bilkul Sahi!',
    'quiz.wrong': 'Thoda Galat Ho Gaya',
    'poll.title': 'Aapki Kya Raay Hai?',
    'poll.thanks': 'Shukriya! Aapka vote count ho gaya hai.',
    'challenge.title': 'AI Challenge Time!',
    'challenge.tryNow': 'Try {tool} Now',
    'expert.title': 'Guru Gyan',
    'myth.title': 'Myth Busted!',
    'myth.label': 'Myth',
    'reality.label': 'Reality',
    'do.title': "Kya Karein (Do's)",
    'dont.title': "Kya Na Karein (Don'ts)",
    'shock.title': 'Shocking Fact!',
    'idea.title': 'Idea Corner',
    'flash.title': 'Quick Flashcard',
    'flash.flip': 'Tap to Flip',
    'flash.flipBack': 'Tap to Flip Back',

    'loading.msg1': 'Kuch creative ideas taiyaar ho rahe hain...',
    'loading.msg2': 'AI guru se salah li jaa rahi hai...',
    'loading.msg3': 'Aapka learning path ban raha hai...',
    'loading.msg4': 'Bas ek pal, kuch badhiya aane wala hai!',

    'footer.text': 'Made by Editor Nishant',
  },
  en: {
    'header.brand': 'Skills Hub',
    'header.journey': 'Your Freelance Journey',
    'header.admin': 'Admin',
    'header.logout': 'Logout',
    'header.userFallback': 'No user',
    'header.toggleTheme': 'Toggle theme',
    'header.language': 'Language',

    'home.badge': 'Next-Gen Learning Hub',
    'home.title': 'Skills Hub',
    'home.subtitle': 'Start your freelance journey with modern skills and AI tools.',
    'home.learningPaths': 'Learning Paths',
    'home.freelanceSkills': 'Freelance Skills',
    'home.aiPowerups': 'AI Powerups',
    'home.smartTools': 'Smart AI Tools',

    'common.backTools': 'Back to Tools',
    'common.backSkills': 'Back to Skills',
    'common.generate': 'Generate',
    'common.analyze': 'Analyze',
    'common.analyzing': 'Analyzing...',
    'common.retry': 'Try Again',
    'common.results': 'Result',
    'common.askQuestion': 'Your Question',
    'common.page': 'Page',
    'common.of': 'of',
    'common.story': 'Story',

    'auth.membersOnly': 'Members Only',
    'auth.required': 'Login or sign up is required before using this website.',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.loginTitle': 'Log In',
    'auth.signupTitle': 'Create Account',
    'auth.preferredLang': 'Preferred language',
    'auth.setupMissing': 'Auth Setup Missing',
    'auth.setupMissingDesc': 'Firebase keys are missing. Add auth values in `.env` to enable login/signup.',
    'auth.errorRequired': 'Email and password are both required.',
    'auth.errorPasswordMin': 'Password must be at least 6 characters.',
    'auth.errorFailed': 'Authentication failed.',
    'auth.passwordPlaceholder': 'Minimum 6 characters',
    'auth.wait': 'Please wait...',
    'auth.or': 'or',
    'auth.forgotPassword': 'Forgot password?',
    'auth.google': 'Continue with Google',
    'auth.resetNeedEmail': 'Enter your email first to get reset link.',
    'auth.resetSent': 'Password reset email sent. Check your inbox.',

    'error.title': 'Something went wrong.',

    'admin.title': 'Admin Control Panel',

    'card.start': 'Start Learning',
    'copy.title': 'Copy to clipboard',

    'tool.imageAnalyzer.title': 'Image Reporter',
    'tool.imageAnalyzer.subtitle': 'Upload a photo and uncover AI insights.',
    'tool.imageAnalyzer.errorMissing': 'Please upload a photo and write your question first.',
    'tool.imageAnalyzer.ask': 'Example: How can this design be improved?',
    'tool.imageAnalyzer.step1': 'Step 1: Choose Photo',
    'tool.imageAnalyzer.step2': 'Step 2: Your Question',
    'tool.imageAnalyzer.resultLabel': 'Result: AI Insight',
    'tool.imageAnalyzer.loadingHint': 'AI is understanding your photo...',
    'tool.imageAnalyzer.resultHint': 'Result will appear here',
    'tool.imageAnalyzer.insight': 'AI Insight',
    'tool.imageAnalyzer.upload': 'Upload Photo',

    'tool.videoAnalyzer.title': 'Video Detective',
    'tool.videoAnalyzer.subtitle': 'Upload a video and get deep analysis.',
    'tool.videoAnalyzer.upload': 'Upload Video',
    'tool.videoAnalyzer.ask': 'Example: What are the main points in this video?',
    'tool.videoAnalyzer.resultTitle': 'Analysis Result',
    'tool.videoAnalyzer.loading': 'AI is reviewing your video frame by frame...',
    'tool.videoAnalyzer.errorMissing': 'Please upload a video and write your question first.',

    'tool.imageAnimator.title': 'Animate Your Photo',
    'tool.imageAnimator.subtitle': 'Turn your photo into a video with AI.',
    'tool.imageAnimator.apiTitle': 'API Key Required',
    'tool.imageAnimator.apiDesc':
      'Veo video generation needs an API key from a paid Google Cloud project. Select your key below.',
    'tool.imageAnimator.selectKey': 'Select API Key',
    'tool.imageAnimator.learnBilling': 'Learn more about billing',
    'tool.imageAnimator.upload': 'Starter Photo',
    'tool.imageAnimator.prompt': 'How should it animate? (Prompt)',
    'tool.imageAnimator.promptHint': 'Example: An astronaut dancing on the moon',
    'tool.imageAnimator.aspect': 'Video Size (Aspect Ratio)',
    'tool.imageAnimator.landscape': 'Landscape (16:9)',
    'tool.imageAnimator.portrait': 'Portrait (9:16)',
    'tool.imageAnimator.resultTitle': 'Your Animated Video',
    'tool.imageAnimator.loading': 'Generating video...',
    'tool.imageAnimator.loadingDefault': 'AI is generating your animation...',
    'tool.imageAnimator.errorMissing': 'Please upload a photo and add a prompt first.',
    'tool.imageAnimator.errorKey': 'Your API key is not working. Please select another key.',

    'tool.imageGenerator.title': 'Image AI',
    'tool.imageGenerator.subtitle': 'Create stunning visuals from text prompts.',
    'tool.imageGenerator.apiTitle': 'API Key Required',
    'tool.imageGenerator.apiDesc':
      'High-quality image generation needs an API key from a paid Google Cloud project. Select your key below.',
    'tool.imageGenerator.selectKey': 'Select API Key',
    'tool.imageGenerator.learnBilling': 'Learn more about billing',
    'tool.imageGenerator.prompt': 'What image do you want?',
    'tool.imageGenerator.promptHint': 'Example: A futuristic city in India with flying cars, photorealistic style',
    'tool.imageGenerator.quality': 'Image Quality',
    'tool.imageGenerator.resultTitle': 'Your AI Image',
    'tool.imageGenerator.loading': 'Generating image...',
    'tool.imageGenerator.errorMissing': 'Please enter a prompt first.',
    'tool.imageGenerator.errorKey': 'Your API key is not working. Please select another key.',

    'tool.rocketWriter.title': 'Rocket Writer',
    'tool.rocketWriter.subtitle': 'Instant text generation without delays.',
    'tool.rocketWriter.prompt': 'What should I write?',
    'tool.rocketWriter.promptHint': 'Example: 5 creative taglines for a coffee shop',
    'tool.rocketWriter.loading': 'Generating...',
    'tool.rocketWriter.error': 'Something went wrong in Rocket Writer.',

    'tool.qna.title': 'AI Buddy',
    'tool.qna.subtitle': 'Google Search Powered Assistant',
    'tool.qna.welcome': 'Hi! I am AI Buddy, now powered by Google Search. Ask me anything here.',
    'tool.qna.input': 'Type your question here...',
    'tool.qna.disclaimer': 'AI Buddy can make mistakes. Check important info.',
    'tool.qna.startError': 'Unable to start chat. Please check API key/billing.',
    'tool.qna.replyError': 'Sorry, AI cannot respond right now. Please try again.',

    'category.skillNotFound': 'Skill not found!',
    'category.backHome': 'Back to Home',
    'category.generating': 'Generating your {skill} course...',
    'category.empty': 'No stable content available for this skill yet.',
    'category.expertTip': 'Expert Tip',
    'category.template': 'Template',
    'category.reward': 'Your Reward',
    'category.didYouKnow': 'Did You Know?',
    'category.infographic': 'Infographic Note',

    'quiz.title': 'Quick Brain Check!',
    'quiz.correct': 'Correct!',
    'quiz.wrong': 'Not quite right',
    'poll.title': 'What do you think?',
    'poll.thanks': 'Thanks! Your vote has been counted.',
    'challenge.title': 'AI Challenge Time!',
    'challenge.tryNow': 'Try {tool} Now',
    'expert.title': 'Expert Insight',
    'myth.title': 'Myth Busted!',
    'myth.label': 'Myth',
    'reality.label': 'Reality',
    'do.title': "Do's",
    'dont.title': "Don'ts",
    'shock.title': 'Shocking Fact!',
    'idea.title': 'Idea Corner',
    'flash.title': 'Quick Flashcard',
    'flash.flip': 'Tap to Flip',
    'flash.flipBack': 'Tap to Flip Back',

    'loading.msg1': 'Preparing creative ideas...',
    'loading.msg2': 'Consulting the AI expert...',
    'loading.msg3': 'Building your learning path...',
    'loading.msg4': 'One moment, something awesome is coming!',

    'footer.text': 'Made by Editor Nishant',
  },
  hi: {
    'header.brand': 'स्किल्स हब',
    'header.journey': 'आपका फ्रीलांस सफर',
    'header.admin': 'एडमिन',
    'header.logout': 'लॉगआउट',
    'header.userFallback': 'कोई यूज़र नहीं',
    'header.toggleTheme': 'थीम बदलें',
    'header.language': 'भाषा',

    'home.badge': 'नेक्स्ट-जेन लर्निंग हब',
    'home.title': 'स्किल्स हब',
    'home.subtitle': 'AI टूल्स और मॉडर्न स्किल्स के साथ अपना फ्रीलांस सफर शुरू करें।',
    'home.learningPaths': 'लर्निंग पाथ्स',
    'home.freelanceSkills': 'फ्रीलांस स्किल्स',
    'home.aiPowerups': 'AI पावरअप्स',
    'home.smartTools': 'स्मार्ट AI टूल्स',

    'common.backTools': 'सभी टूल्स',
    'common.backSkills': 'सभी स्किल्स',
    'common.generate': 'जनरेट करें',
    'common.analyze': 'विश्लेषण करें',
    'common.analyzing': 'विश्लेषण चल रहा है...',
    'common.retry': 'फिर कोशिश करें',
    'common.results': 'परिणाम',
    'common.askQuestion': 'आपका सवाल',
    'common.page': 'पेज',
    'common.of': 'में से',
    'common.story': 'स्टोरी',

    'auth.membersOnly': 'सिर्फ सदस्यों के लिए',
    'auth.required': 'वेबसाइट इस्तेमाल करने से पहले लॉगिन/साइनअप जरूरी है।',
    'auth.login': 'लॉगिन',
    'auth.signup': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.loginTitle': 'लॉगिन करें',
    'auth.signupTitle': 'अकाउंट बनाएं',
    'auth.preferredLang': 'पसंदीदा भाषा',
    'auth.setupMissing': 'ऑथ सेटअप नहीं मिला',
    'auth.setupMissingDesc': 'Firebase keys missing हैं। `.env` में auth values जोड़ें, तभी login/signup चलेगा।',
    'auth.errorRequired': 'ईमेल और पासवर्ड दोनों जरूरी हैं।',
    'auth.errorPasswordMin': 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
    'auth.errorFailed': 'ऑथेंटिकेशन फेल हो गया।',
    'auth.passwordPlaceholder': 'कम से कम 6 अक्षर',
    'auth.wait': 'कृपया प्रतीक्षा करें...',

    'error.title': 'कुछ गलत हो गया।',

    'admin.title': 'एडमिन कंट्रोल पैनल',

    'card.start': 'सीखना शुरू करें',
    'copy.title': 'क्लिपबोर्ड में कॉपी करें',

    'tool.imageAnalyzer.title': 'चित्र रिपोर्टर',
    'tool.imageAnalyzer.subtitle': 'फोटो अपलोड करें और AI से जानकारी पाएं।',
    'tool.imageAnalyzer.errorMissing': 'पहले एक फोटो अपलोड करें और सवाल लिखें।',
    'tool.imageAnalyzer.ask': 'जैसे: इस डिज़ाइन को और बेहतर कैसे बनाएं?',
    'tool.imageAnalyzer.step1': 'स्टेप 1: फोटो चुनें',
    'tool.imageAnalyzer.step2': 'स्टेप 2: आपका सवाल',
    'tool.imageAnalyzer.resultLabel': 'रिज़ल्ट: AI का जवाब',
    'tool.imageAnalyzer.loadingHint': 'AI आपकी फोटो को समझ रहा है...',
    'tool.imageAnalyzer.resultHint': 'रिज़ल्ट यहाँ दिखेगा',
    'tool.imageAnalyzer.insight': 'AI इनसाइट',
    'tool.imageAnalyzer.upload': 'फोटो अपलोड करें',

    'tool.videoAnalyzer.title': 'वीडियो जासूस',
    'tool.videoAnalyzer.subtitle': 'वीडियो अपलोड करें और गहरा विश्लेषण पाएं।',
    'tool.videoAnalyzer.upload': 'वीडियो अपलोड करें',
    'tool.videoAnalyzer.ask': 'जैसे: इस वीडियो के मुख्य बिंदु क्या हैं?',
    'tool.videoAnalyzer.resultTitle': 'विश्लेषण का परिणाम',
    'tool.videoAnalyzer.loading': 'AI आपके वीडियो को फ्रेम बाय फ्रेम देख रहा है...',
    'tool.videoAnalyzer.errorMissing': 'पहले एक वीडियो अपलोड करें और सवाल लिखें।',

    'tool.imageAnimator.title': 'फोटो को जीवंत बनाएं',
    'tool.imageAnimator.subtitle': 'AI की मदद से फोटो को वीडियो में बदलें।',
    'tool.imageAnimator.apiTitle': 'API Key जरूरी है',
    'tool.imageAnimator.apiDesc': 'Veo वीडियो जनरेशन के लिए paid Google Cloud API key चाहिए। नीचे key चुनें।',
    'tool.imageAnimator.selectKey': 'API Key चुनें',
    'tool.imageAnimator.learnBilling': 'Billing के बारे में और जानें',
    'tool.imageAnimator.upload': 'शुरुआती फोटो',
    'tool.imageAnimator.prompt': 'एनीमेशन कैसा हो? (Prompt)',
    'tool.imageAnimator.promptHint': 'जैसे: एक astronaut चांद पर dance कर रहा है',
    'tool.imageAnimator.aspect': 'वीडियो साइज (Aspect Ratio)',
    'tool.imageAnimator.landscape': 'लैंडस्केप (16:9)',
    'tool.imageAnimator.portrait': 'पोर्ट्रेट (9:16)',
    'tool.imageAnimator.resultTitle': 'आपकी Animated वीडियो',
    'tool.imageAnimator.loading': 'वीडियो बन रही है...',
    'tool.imageAnimator.loadingDefault': 'AI आपका एनीमेशन बना रहा है...',
    'tool.imageAnimator.errorMissing': 'पहले फोटो अपलोड करें और prompt लिखें।',
    'tool.imageAnimator.errorKey': 'आपकी API key काम नहीं कर रही। कृपया दूसरी key चुनें।',

    'tool.imageGenerator.title': 'चित्र-AI',
    'tool.imageGenerator.subtitle': 'अपने शब्दों से शानदार तस्वीरें बनाएं।',
    'tool.imageGenerator.apiTitle': 'API Key जरूरी है',
    'tool.imageGenerator.apiDesc': 'High-quality image generation के लिए paid Google Cloud API key चाहिए। नीचे key चुनें।',
    'tool.imageGenerator.selectKey': 'API Key चुनें',
    'tool.imageGenerator.learnBilling': 'Billing के बारे में और जानें',
    'tool.imageGenerator.prompt': 'आपको कैसी image चाहिए?',
    'tool.imageGenerator.promptHint': 'जैसे: उड़ती कारों वाला futuristic भारतीय शहर, photorealistic style',
    'tool.imageGenerator.quality': 'Image Quality',
    'tool.imageGenerator.resultTitle': 'आपकी AI इमेज',
    'tool.imageGenerator.loading': 'इमेज बन रही है...',
    'tool.imageGenerator.errorMissing': 'पहले एक prompt लिखें।',
    'tool.imageGenerator.errorKey': 'आपकी API key काम नहीं कर रही। कृपया दूसरी key चुनें।',

    'tool.rocketWriter.title': 'रॉकेट राइटर',
    'tool.rocketWriter.subtitle': 'बिना इंतजार तेज़ जवाब।',
    'tool.rocketWriter.prompt': 'आप क्या लिखवाना चाहते हैं?',
    'tool.rocketWriter.promptHint': 'जैसे: coffee shop के लिए 5 creative taglines',
    'tool.rocketWriter.loading': 'लिखा जा रहा है...',
    'tool.rocketWriter.error': 'Rocket Writer में कुछ गड़बड़ हो गई।',

    'tool.qna.title': 'AI दोस्त',
    'tool.qna.subtitle': 'Google Search Powered Assistant',
    'tool.qna.welcome': 'नमस्ते! मैं AI दोस्त हूँ, अब Google Search की शक्ति के साथ। आपका कोई भी सवाल हो, यहाँ पूछ सकते हैं।',
    'tool.qna.input': 'अपना सवाल यहाँ टाइप करें...',
    'tool.qna.disclaimer': 'AI दोस्त गलती कर सकता है। जरूरी जानकारी जांच लें।',
    'tool.qna.startError': 'चैट शुरू करने में दिक्कत आई। API key/billing चेक करें।',
    'tool.qna.replyError': 'माफ कीजिए, अभी AI जवाब नहीं दे पा रहा। थोड़ी देर बाद फिर कोशिश करें।',

    'category.skillNotFound': 'स्किल नहीं मिली!',
    'category.backHome': 'होम पर वापस जाएं',
    'category.generating': '{skill} कोर्स तैयार हो रहा है...',
    'category.empty': 'इस स्किल के लिए stable content नहीं मिला।',
    'category.expertTip': 'एक्सपर्ट सलाह',
    'category.template': 'टेम्पलेट',
    'category.reward': 'आपका इनाम',
    'category.didYouKnow': 'क्या आप जानते हैं?',
    'category.infographic': 'इन्फोग्राफिक नोट',

    'quiz.title': 'चलो दिमाग लगाएं!',
    'quiz.correct': 'बिलकुल सही!',
    'quiz.wrong': 'थोड़ा गलत हो गया',
    'poll.title': 'आपकी क्या राय है?',
    'poll.thanks': 'शुक्रिया! आपका वोट दर्ज हो गया है।',
    'challenge.title': 'AI Challenge Time!',
    'challenge.tryNow': '{tool} अभी ट्राय करें',
    'expert.title': 'गुरु ज्ञान',
    'myth.title': 'मिथक टूटा!',
    'myth.label': 'मिथक',
    'reality.label': 'सच्चाई',
    'do.title': 'क्या करें',
    'dont.title': 'क्या न करें',
    'shock.title': 'चौंकाने वाला तथ्य!',
    'idea.title': 'आइडिया कॉर्नर',
    'flash.title': 'क्विक फ्लैशकार्ड',
    'flash.flip': 'पलटने के लिए टैप करें',
    'flash.flipBack': 'वापस पलटने के लिए टैप करें',

    'loading.msg1': 'क्रिएटिव आइडियाज तैयार हो रहे हैं...',
    'loading.msg2': 'AI एक्सपर्ट से सलाह ली जा रही है...',
    'loading.msg3': 'आपका learning path बन रहा है...',
    'loading.msg4': 'बस एक पल, कुछ बढ़िया आने वाला है!',

    'footer.text': 'Made by Editor Nishant',
  },
};

const itemLocales: Record<string, Partial<Record<SupportedUiLanguage, { name: string; description: string }>>> = {
  'graphic-design': {
    hinglish: { name: 'Graphic Design', description: 'Shaandaar visuals aur illustrations banana seekho.' },
    en: { name: 'Graphic Design', description: 'Learn to create stunning visuals and illustrations.' },
    hi: { name: 'ग्राफिक डिजाइन', description: 'शानदार विजुअल्स और इलस्ट्रेशन बनाना सीखें।' },
  },
  'video-editing': {
    hinglish: { name: 'Video Editing', description: 'Video ke zariye story bolne ki kala master karo.' },
    en: { name: 'Video Editing', description: 'Master storytelling through editing.' },
    hi: { name: 'वीडियो एडिटिंग', description: 'एडिटिंग के जरिए कहानी कहने की कला सीखें।' },
  },
  'content-writing': {
    hinglish: { name: 'Content Writing', description: 'Powerful copy aur stories likhna seekho.' },
    en: { name: 'Content Writing', description: 'Write powerful copy and stories.' },
    hi: { name: 'कंटेंट राइटिंग', description: 'असरदार कॉपी और कहानियां लिखना सीखें।' },
  },
  programming: {
    hinglish: { name: 'Programming', description: 'Websites, apps aur software banana seekho.' },
    en: { name: 'Programming', description: 'Build websites, apps, and software solutions.' },
    hi: { name: 'प्रोग्रामिंग', description: 'वेबसाइट, ऐप और सॉफ्टवेयर बनाना सीखें।' },
  },
  'digital-marketing': {
    hinglish: { name: 'Digital Marketing', description: 'Brands aur audience ko online grow karo.' },
    en: { name: 'Digital Marketing', description: 'Grow brands and audiences online.' },
    hi: { name: 'डिजिटल मार्केटिंग', description: 'ब्रांड और ऑडियंस को ऑनलाइन बढ़ाएं।' },
  },
  animation: {
    hinglish: { name: 'Animation', description: 'Motion se ideas ko zinda karo.' },
    en: { name: 'Animation', description: 'Bring ideas to life with motion.' },
    hi: { name: 'एनीमेशन', description: 'मोशन के जरिए आइडिया को जीवंत बनाएं।' },
  },
  'qna-bot': {
    hinglish: { name: 'AI Dost', description: 'Search-backed AI se fresh answers lo.' },
    en: { name: 'AI Buddy', description: 'Get updated answers with search-backed AI.' },
    hi: { name: 'AI दोस्त', description: 'सर्च-पावर्ड AI से अपडेटेड जवाब पाएं।' },
  },
  'image-generator': {
    hinglish: { name: 'Chitra-AI', description: 'Text prompts ko high-quality images me badlo.' },
    en: { name: 'Image AI', description: 'Turn your ideas into high-quality images.' },
    hi: { name: 'चित्र-AI', description: 'अपने आइडियाज़ को हाई-क्वालिटी इमेज में बदलें।' },
  },
  'rocket-writer': {
    hinglish: { name: 'Rocket Writer', description: 'Lightning speed me ideas aur copy generate karo.' },
    en: { name: 'Rocket Writer', description: 'Generate ideas and copy at lightning speed.' },
    hi: { name: 'रॉकेट राइटर', description: 'तेज़ गति से कंटेंट और आइडिया जनरेट करें।' },
  },
  'image-analyzer': {
    hinglish: { name: 'Chitra Reporter', description: 'Photo upload karo aur kuch bhi pucho.' },
    en: { name: 'Image Reporter', description: 'Upload photos and ask anything about them.' },
    hi: { name: 'चित्र रिपोर्टर', description: 'फोटो अपलोड करें और उससे जुड़ा कुछ भी पूछें।' },
  },
  'video-analyzer': {
    hinglish: { name: 'Video Ka Jasoos', description: 'Video upload karo aur deep insights pao.' },
    en: { name: 'Video Detective', description: 'Upload videos and extract useful insights.' },
    hi: { name: 'वीडियो जासूस', description: 'वीडियो अपलोड करें और अंदर की जानकारी पाएं।' },
  },
  'image-animator': {
    hinglish: { name: 'Photo Ko Jivdan Do', description: 'Ek photo ko AI se video me badlo.' },
    en: { name: 'Animate Photo', description: 'Convert a single photo into a video with AI.' },
    hi: { name: 'फोटो को जीवंत बनाएं', description: 'एक फोटो को AI की मदद से वीडियो में बदलें।' },
  },
};

interface LocaleContextType {
  language: string;
  languageName: string;
  languages: LanguageOption[];
  setLanguage: (code: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  localizeItem: <T extends CardItem>(item: T) => T;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const getSupportedUiLanguage = (language: string): SupportedUiLanguage => {
  if (language === 'hinglish' || language === 'en' || language === 'hi') {
    return language;
  }
  return 'en';
};

const interpolate = (text: string, vars?: Record<string, string | number>) => {
  if (!vars) {
    return text;
  }
  return Object.entries(vars).reduce((acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)), text);
};

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGE_OPTIONS.some((l) => l.code === saved)) {
      return saved;
    }
    return 'hinglish';
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (code: string) => {
    if (!LANGUAGE_OPTIONS.some((l) => l.code === code)) {
      return;
    }
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
    void logUsageEvent('language_change', { language: code });
  };

  const value = useMemo(() => {
    const uiLanguage = getSupportedUiLanguage(language);
    const map = translations[uiLanguage];

    const t = (key: string, vars?: Record<string, string | number>) => {
      const message = map[key] ?? translations.en[key] ?? key;
      return interpolate(message, vars);
    };

    const localizeItem = <T extends CardItem>(item: T): T => {
      const localized = itemLocales[item.id]?.[uiLanguage] ?? itemLocales[item.id]?.en;
      if (!localized) {
        return item;
      }
      return {
        ...item,
        name: localized.name || item.name,
        description: localized.description || item.description,
      };
    };

    return {
      language,
      languageName: LANGUAGE_OPTIONS.find((l) => l.code === language)?.label ?? 'Hinglish',
      languages: LANGUAGE_OPTIONS,
      setLanguage,
      t,
      localizeItem,
    };
  }, [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return context;
};
