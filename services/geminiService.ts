import { GoogleGenAI } from "@google/genai";
import { 
    STORY_MODEL, 
    IMAGE_MODEL, 
    SYSTEM_INSTRUCTION, 
    SYSTEM_INSTRUCTION_HU,
    RESPONSE_SCHEMA,
    COMBAT_SYSTEM_INSTRUCTION,
    COMBAT_SYSTEM_INSTRUCTION_HU,
    COMBAT_RESPONSE_SCHEMA,
} from '../constants';
import type { PlayerStats, GeminiStoryResponse, Enemy, GeminiCombatResponse } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper to safely parse JSON
const safeJsonParse = <T,>(jsonString: string): T | null => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    console.log("Invalid JSON string:", jsonString);
    return null;
  }
};

const generateStory = async (context: string, playerStats: PlayerStats, action: string, language: 'en' | 'hu'): Promise<GeminiStoryResponse | null> => {
  const prompt = language === 'hu' ? `
    Előző történeti kontextus: "${context}"
    Jelenlegi játékos statisztikák: ${JSON.stringify(playerStats)}
    Játékos cselekedete: "${action}"

    Generáld a történet következő fordulatát. Ha a helyzet harcot követel, mutass be egy ellenfelet.
  ` : `
    Previous story context: "${context}"
    Current Player Stats: ${JSON.stringify(playerStats)}
    Player Action: "${action}"

    Generate the next turn of the story. If the situation calls for a fight, introduce an enemy.
  `;

  const systemInstruction = language === 'hu' ? SYSTEM_INSTRUCTION_HU : SYSTEM_INSTRUCTION;

  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.9,
      },
    });

    const storyData = safeJsonParse<GeminiStoryResponse>(response.text);
    return storyData;

  } catch (error) {
    console.error("Error generating story:", error);
    return null;
  }
};

const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const fetchNextStep = async (
  context: string,
  playerStats: PlayerStats,
  action: string,
  language: 'en' | 'hu'
): Promise<{ storyData: GeminiStoryResponse; imageData: string } | null> => {
  
  const storyData = await generateStory(context, playerStats, action, language);

  if (!storyData) {
    return null;
  }

  const imageData = await generateImage(storyData.imagePrompt);

  if (!imageData) {
    return null;
  }

  return { storyData, imageData };
};


export const fetchCombatTurn = async (
    playerStats: PlayerStats,
    enemy: Enemy,
    action: string,
    language: 'en' | 'hu'
): Promise<GeminiCombatResponse | null> => {
    const prompt = language === 'hu' ? `
      Játékos statisztikák: ${JSON.stringify(playerStats)}
      Ellenfél: ${JSON.stringify(enemy)}
      Játékos harci cselekedete: "${action}"

      Számítsd ki ennek a harci körnek a kimenetelét.
    ` : `
      Player Stats: ${JSON.stringify(playerStats)}
      Enemy: ${JSON.stringify(enemy)}
      Player's Combat Action: "${action}"

      Calculate the outcome of this combat turn.
    `;
    
    const systemInstruction = language === 'hu' ? COMBAT_SYSTEM_INSTRUCTION_HU : COMBAT_SYSTEM_INSTRUCTION;

    try {
        const response = await ai.models.generateContent({
            model: STORY_MODEL,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: COMBAT_RESPONSE_SCHEMA,
                temperature: 0.8,
            },
        });

        const combatData = safeJsonParse<GeminiCombatResponse>(response.text);
        return combatData;

    } catch (error)
        {
        console.error("Error generating combat turn:", error);
        return null;
    }
};