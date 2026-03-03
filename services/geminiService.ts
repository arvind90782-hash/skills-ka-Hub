
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GeneratedContent } from '../types';

const getAiClient = () => {
    // The key might be provided under multiple environment variable names
    // depending on what the developer set in their .env file. Vite will replace
    // `process.env.*` at build time using the values defined in vite.config.ts.
    const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY ||
      // runtime fallback in case any code is executed where import.meta is available
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY);
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set. Add your Gemini key to .env");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
}

const quizSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['quiz'] }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ['type', 'question', 'options', 'correctAnswerIndex', 'explanation']
};
const aiChallengeSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['aiChallenge'] }, challenge: { type: Type.STRING }, toolId: { type: Type.STRING, enum: ['image-analyzer', 'video-analyzer', 'image-animator', 'image-generator'] } }, required: ['type', 'challenge', 'toolId']
};
const pollSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['poll'] }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['type', 'question', 'options']
};
const qAndASchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['qAndA'] }, question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ['type', 'question', 'answer']
};
const expertSaysSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['expertSays'] }, quote: { type: Type.STRING }, expertName: { type: Type.STRING } }, required: ['type', 'quote', 'expertName']
};
const mythBusterSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['mythBuster'] }, myth: { type: Type.STRING }, reality: { type: Type.STRING } }, required: ['type', 'myth', 'reality']
};
const doAndDontSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['doAndDont'] }, dos: { type: Type.ARRAY, items: { type: Type.STRING } }, donts: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['type', 'dos', 'donts']
};
const shockingFactSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['shockingFact'] }, fact: { type: Type.STRING } }, required: ['type', 'fact']
};
const ideaCornerSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['ideaCorner'] }, prompt: { type: Type.STRING } }, required: ['type', 'prompt']
};
const flashcardSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['flashcard'] }, front: { type: Type.STRING }, back: { type: Type.STRING } }, required: ['type', 'front', 'back']
};
const basicTextBlockSchema = {
    type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['heading', 'paragraph', 'tip', 'template', 'benefits', 'infographic', 'funFact'] }, text: { type: Type.STRING } }, required: ['type', 'text']
};

const contentSchema = {
  oneOf: [ basicTextBlockSchema, quizSchema, aiChallengeSchema, pollSchema, qAndASchema, expertSaysSchema, mythBusterSchema, doAndDontSchema, shockingFactSchema, ideaCornerSchema, flashcardSchema ],
};

const subPageSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the sub-page." },
    imageSuggestion: { type: Type.STRING, description: "A descriptive suggestion for a relevant image or illustration (e.g., 'A student looking confused at code')." },
    content: { type: Type.ARRAY, items: contentSchema, description: "An array of various content blocks that make up the page." },
    motionStoryboard: { type: Type.STRING, description: "A short, creative idea for a motion graphic or animation to be used on this page (e.g., 'A lightbulb icon appears and glows when a tip is shown')." },
  },
  required: ['title', 'imageSuggestion', 'content', 'motionStoryboard']
};

const moduleSchema = {
  type: Type.OBJECT,
  properties: {
    skillName: { type: Type.STRING, description: "The name of the skill being taught." },
    subPages: { type: Type.ARRAY, items: subPageSchema, description: "An array of 10 sub-pages for the learning module." },
  },
  required: ['skillName', 'subPages']
};

export const generateSkillContent = async (skillName: string): Promise<GeneratedContent | null> => {
  const cacheKey = `skill-content-${skillName}`;

  try {
    const cachedContent = sessionStorage.getItem(cacheKey);
    if (cachedContent) {
      console.log(`Loading "${skillName}" content from cache.`);
      return JSON.parse(cachedContent);
    }
  } catch (error) {
    console.warn("Could not access session storage for caching.", error);
  }
  
  console.log(`Generating new content for "${skillName}" from API.`);
  try {
    const ai = getAiClient();
    const prompt = `
      Ek freelance skill "${skillName}" ke liye ek અત્યંત engaging (extremely engaging) learning module generate karo, jo Hinglish (Hindi + English) mein ho.
      Ye module Indian students ke liye super fun, visual, aur relatable hona chahiye. Plain text se bacho.
      Total 10 detailed sub-pages generate karo.

      Har page ko in sabhi interactive elements se bhar do. Har page par kam se kam 5-6 alag-alag block types istemaal karo. Bohot variety chahiye:
      - 'heading', 'paragraph', 'tip', 'template', 'benefits', 'infographic', 'funFact'
      - 'quiz': Interesting sawal, 4 options, sahi jawab, aur explanation.
      - 'aiChallenge': Creative task jo user ko app ke AI tools ('image-analyzer', 'video-analyzer', 'image-animator', 'image-generator') use karne ke liye challenge kare.
      - 'poll': Ek interesting question jiske multiple options ho.
      - 'qAndA': Common student doubts ko solve karo.
      - 'expertSays': Ek virtual expert ka quote.
      - 'mythBuster': Skill se jude myths ko bust karo.
      - 'doAndDont': Quick tips in a list format.
      - 'shockingFact': Ek dum unexpected fact.
      - 'ideaCorner': User ko kuch naya sochne ke liye inspire karo.
      - 'flashcard': Ek quick question (front) aur uska answer (back) jo user flip karke dekh sake. Fast learning ke liye best hai.

      Content ko friendly, encouraging, aur bohot hi zyada interesting banao. Har page ek naya adventure lagna chahiye.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: moduleSchema,
      },
    });

    const jsonString = response.text;
    if (!jsonString) { throw new Error("API returned no text."); }

    const parsedJson = JSON.parse(jsonString);
    
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(parsedJson));
    } catch (error) {
        console.warn("Could not save content to session storage.", error);
    }

    return parsedJson as GeneratedContent;

  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();
    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [textPart, imagePart] } });
    return response.text ?? "Kuch samajh nahi aaya, phir se try karein.";
};

export const analyzeVideo = async (prompt: string, videoBase64: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();
    const videoPart = { inlineData: { data: videoBase64, mimeType } };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [textPart, videoPart] } });
    return response.text ?? "Video ajeeb thi, kuch samajh nahi aaya.";
};

export const animateImage = async (prompt: string, imageBase64: string, mimeType: string, aspectRatio: '16:9' | '9:16', onProgress: (message: string) => void): Promise<string> => {
    const ai = getAiClient();
    onProgress("Video banana shuru ho raha hai...");
    let operation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, image: { imageBytes: imageBase64, mimeType }, config: { numberOfVideos: 1, resolution: '720p', aspectRatio } });
    onProgress("Processing jaari hai... ismein kuch minute lag sakte hain.");
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const pollAi = getAiClient();
      operation = await pollAi.operations.getVideosOperation({ operation });
      const progress = (operation.metadata as any)?.progressPercentage ?? 0;
      onProgress(`Video ${Math.round(Number(progress))}% ban chuki hai...`);
    }
    onProgress("Video taiyaar hai!");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) { throw new Error("Video generate ho gayi, par link nahi mila."); }
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const generateImage = async (prompt: string, imageSize: '1K' | '2K' | '4K'): Promise<{ imageUrl: string; altText: string }> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: { imageSize, aspectRatio: "1:1" },
            tools: [{ googleSearch: {} } as any],
        },
    });

    let imageUrl = '';
    let altText = 'Generated image';

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                imageUrl = `data:image/png;base64,${base64EncodeString}`;
            } else if (part.text) {
                altText = part.text;
            }
        }
    }
    
    if (!imageUrl) {
        throw new Error("Image generate nahi ho paayi. Kuch aur try karein.");
    }
    
    return { imageUrl, altText };
};

export const generateFastText = (prompt: string) => {
    const ai = getAiClient();
    return ai.models.generateContentStream({
        model: 'gemini-2.5-flash-lite-latest',
        contents: prompt,
    });
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Please read this clearly: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio generate nahi ho paaya.");
    }
    return base64Audio;
};
