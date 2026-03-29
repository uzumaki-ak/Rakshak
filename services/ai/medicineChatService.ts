import { Medicine } from '@/types/medicine';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * MedicineChatService
 * AI Health Assistant for medicine-related queries.
 * Powered by Gemini AI with multilingual support and Text-to-Speech integration.
 */
export class MedicineChatService {
  private static instance: MedicineChatService;
  private geminiApiKey: string;

  private constructor() {
    this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    this.euriApiKey = process.env.EXPO_PUBLIC_EURI_API_KEY || '';
    if (!this.geminiApiKey) console.warn('⚠️ MedicineChatService: Gemini API key missing.');
  }

  private euriApiKey: string;
  private euriUrl: string = 'https://api.euron.one/api/v1/euri/chat/completions';

  public static getInstance(): MedicineChatService {
    if (!MedicineChatService.instance) {
      MedicineChatService.instance = new MedicineChatService();
    }
    return MedicineChatService.instance;
  }

  /**
   * Ask the AI assistant a question regarding a specific medicine.
   */
  async askAboutMedicine(
    medicine: Medicine | null,
    question: string,
    chatHistory: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>,
    customSystemPrompt?: string,
    imageUri?: string
  ): Promise<{ answer: string; canSpeak: boolean }> {
    if (!this.geminiApiKey) {
      return { answer: "Assistant is offline. Please configure API keys.", canSpeak: false };
    }

    try {
      const systemContext = customSystemPrompt || this.buildSystemPrompt(medicine);
      
      const userParts: any[] = [{ text: question }];
      
      if (imageUri) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: "base64" });
        userParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64
          }
        });
      }

      const contents = [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: "Understood. I am your Rakshak Health Assistant. I will provide accurate, helpful, and safe information about this medicine while always including the required medical disclaimer." }] },
        ...chatHistory,
        { role: 'user', parts: userParts }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
          }),
        }
      );

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't formulate a response. Please try again.";

      return { answer, canSpeak: true };
    } catch (error) {
      console.warn('Gemini chat failed, trying Eurian fallback...', error);
      return this.askAboutMedicineEuri(medicine, question, chatHistory, customSystemPrompt);
    }
  }

  private async askAboutMedicineEuri(
    medicine: Medicine | null,
    question: string,
    chatHistory: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>,
    customSystemPrompt?: string,
    imageUri?: string
  ): Promise<{ answer: string; canSpeak: boolean }> {
    if (!this.euriApiKey) {
      return { answer: "Chat services are currently unavailable. Please try again later.", canSpeak: false };
    }

    try {
      const systemContext = customSystemPrompt || this.buildSystemPrompt(medicine);
      
      const messages = [
        { role: 'system', content: systemContext },
        ...chatHistory.map(m => ({ 
          role: m.role === 'model' ? 'assistant' : 'user', 
          content: m.parts[0].text 
        })),
        { role: 'user', content: question + (imageUri ? "\n[Note: User provided an image which is being analyzed by main vision engine]" : "") }
      ];

      const response = await fetch(this.euriUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.euriApiKey}`
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-4.1-nano',
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error(`Euri API Error: ${response.status}`);

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "Eurian couldn't respond. Please try again.";

      return { answer, canSpeak: true };
    } catch (error) {
      console.error('Final AI Redundancy Failure:', error);
      return { answer: "We are experiencing a total system outage. Please check back soon.", canSpeak: false };
    }
  }

  /**
   * Speak the response using device TTS.
   */
  async speakAnswer(text: string, language: string = 'en-US'): Promise<void> {
    try {
      await Speech.stop();
      await Speech.speak(text, { language, rate: 0.95 });
    } catch (error) {
      console.warn('TTS Failed:', error);
    }
  }

  async stopSpeaking(): Promise<void> {
    await Speech.stop();
  }

  private buildSystemPrompt(medicine: Medicine | null): string {
    const isToday = new Date().toISOString().split('T')[0];
    
    if (!medicine) {
      return `
        You are Rakshak AI, a high-end medical assistant.
        The user is asking a general health or medicine-related question.
        
        Guidelines:
        1. Be professional, empathetic, and accurate.
        2. Provide helpful, general medical information based on established healthcare practices.
        3. ALWAYS advise the user to consult a licensed physician for any symptoms or medical decisions.
        4. Always append: "⚠️ Disclaimer: This is AI-generated advice. Consult a licensed physician for medical decisions."
        5. Today is ${isToday}.
      `;
    }

    const status = medicine.expiry_date && new Date(medicine.expiry_date) < new Date() ? 'EXPIRED' : 'VALID';

    return `
      You are Rakshak AI, a high-end medical assistant.
      The user is asking about the following medicine in their inventory:
      - Name: ${medicine.name}
      - Generic: ${medicine.generic_name || 'N/A'}
      - Strength: ${medicine.strength || 'N/A'}
      - Expiry: ${medicine.expiry_date || 'Unknown'} (Currently ${status})
      - Status: ${medicine.status}
      - Notes: ${medicine.notes || 'None'}

      Guidelines:
      1. Be professional, empathetic, and accurate.
      2. If the medicine is ${status === 'EXPIRED' ? 'EXPIRED' : 'N/A'}, emphasize that it should NOT be consumed.
      3. For dosage, always refer back to what is written on the package or what the doctor prescribed.
      4. Always append: "⚠️ Disclaimer: This is AI-generated advice. Consult a licensed physician for medical decisions."
      5. Today is ${isToday}.
    `;
  }

  getQuickQuestions(medicine: Medicine): string[] {
    return [
      `What is ${medicine.name} used for?`,
      `How should I store this?`,
      `Are there any side effects?`,
      `Can I take this with food?`
    ];
  }
}