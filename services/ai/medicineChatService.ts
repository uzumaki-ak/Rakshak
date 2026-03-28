import { Medicine } from '@/types/medicine';
import * as Speech from 'expo-speech';

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
    if (!this.geminiApiKey) console.warn('⚠️ MedicineChatService: Gemini API key missing.');
  }

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
    medicine: Medicine,
    question: string,
    chatHistory: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>
  ): Promise<{ answer: string; canSpeak: boolean }> {
    if (!this.geminiApiKey) {
      return { answer: "Assistant is offline. Please configure API keys.", canSpeak: false };
    }

    try {
      const systemContext = this.buildSystemPrompt(medicine);
      
      const contents = [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: "Understood. I am your Rakshak Health Assistant. I will provide accurate, helpful, and safe information about this medicine while always including the required medical disclaimer." }] },
        ...chatHistory,
        { role: 'user', parts: [{ text: question }] }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
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
      console.error('AI Chat Error:', error);
      return { answer: "Something went wrong with our AI servers. Please try again later.", canSpeak: false };
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

  private buildSystemPrompt(medicine: Medicine): string {
    const isToday = new Date().toISOString().split('T')[0];
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