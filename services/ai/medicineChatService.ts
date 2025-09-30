import { Medicine } from '@/types/medicine';
import * as Speech from 'expo-speech';

/**
 * Medicine Chatbot Service
 * Multilingual AI assistant for medicine questions with TTS support
 */
export class MedicineChatService {
  private static instance: MedicineChatService;
  private euriApiKey: string;
  private apiBaseUrl: string = 'https://api.euron.one/api/v1/euri/chat/completions';

  private constructor() {
    this.euriApiKey = process.env.EXPO_PUBLIC_EURI_API_KEY || '';
  }

  public static getInstance(): MedicineChatService {
    if (!MedicineChatService.instance) {
      MedicineChatService.instance = new MedicineChatService();
    }
    return MedicineChatService.instance;
  }

  /**
   * Ask question about a specific medicine
   */
  async askAboutMedicine(
    medicine: Medicine,
    question: string,
    chatHistory: Array<{ role: string; content: string }>
  ): Promise<{
    answer: string;
    language: string;
    canSpeak: boolean;
  }> {
    try {
      if (!this.euriApiKey) {
        return {
          answer: 'API key not configured. Please add EXPO_PUBLIC_EURI_API_KEY to your .env file.',
          language: 'en',
          canSpeak: false,
        };
      }

      // Detect question language
      const detectedLanguage = this.detectLanguage(question);

      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(medicine, detectedLanguage);

      // Build conversation history for Euron API
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...chatHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: question
        }
      ];

      console.log('🤖 Asking Euron AI about medicine:', medicine.name);

      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.euriApiKey}`
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-4.1-nano', // Using the model from your example
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Euron API error:', errorText);
        throw new Error(`Euron API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI');
      }

      const answer = data.choices[0].message.content;

      console.log('✅ Got answer from Euron AI');

      return {
        answer: answer.trim(),
        language: detectedLanguage,
        canSpeak: true,
      };

    } catch (error) {
      console.error('❌ Medicine chat error:', error);
      return {
        answer: 'Sorry, I could not process your question. Please try again.',
        language: 'en',
        canSpeak: false,
      };
    }
  }

  /**
   * Speak the answer using Text-to-Speech
   */
  async speakAnswer(text: string, language: string): Promise<void> {
    try {
      // Stop any ongoing speech
      await Speech.stop();

      // Get voice for language
      const voices = await Speech.getAvailableVoicesAsync();
      const languageVoice = voices.find(v => 
        v.language.startsWith(this.getLanguageCode(language))
      );

      await Speech.speak(text, {
        language: this.getLanguageCode(language),
        voice: languageVoice?.identifier,
        pitch: 1.0,
        rate: 0.9,
      });

      console.log('🔊 Speaking answer');

    } catch (error) {
      console.error('❌ TTS error:', error);
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    await Speech.stop();
  }

  /**
   * Detect language from question
   */
  private detectLanguage(text: string): string {
    // Hindi detection
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(text)) return 'hindi';

    // Japanese detection
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;
    if (japanesePattern.test(text)) return 'japanese';

    // Chinese detection
    const chinesePattern = /[\u4E00-\u9FFF]/;
    if (chinesePattern.test(text)) return 'chinese';

    // Arabic detection
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) return 'arabic';

    // Default to English
    return 'english';
  }

  /**
   * Get language code for TTS
   */
  private getLanguageCode(language: string): string {
    const codes: Record<string, string> = {
      'english': 'en-US',
      'hindi': 'hi-IN',
      'japanese': 'ja-JP',
      'chinese': 'zh-CN',
      'arabic': 'ar-SA',
      'spanish': 'es-ES',
      'french': 'fr-FR',
      'german': 'de-DE',
    };

    return codes[language] || 'en-US';
  }

  /**
   * Build system prompt for medicine chat
   */
  private buildSystemPrompt(medicine: Medicine, language: string): string {
    const languageInstructions: Record<string, string> = {
      'hindi': 'You must respond in Hindi (Devanagari script). Always answer in Hindi language.',
      'japanese': 'You must respond in Japanese. Always answer in Japanese language.',
      'chinese': 'You must respond in Simplified Chinese. Always answer in Chinese language.',
      'arabic': 'You must respond in Arabic. Always answer in Arabic language.',
      'english': 'You must respond in English.',
    };

    const langInstruction = languageInstructions[language] || languageInstructions['english'];

    return `You are a helpful medicine information assistant. ${langInstruction}

Medicine Details:
- Name: ${medicine.name}
- Generic Name: ${medicine.generic_name || 'Not specified'}
- Strength: ${medicine.strength || 'Not specified'}
- Expiry Date: ${medicine.expiry_date || 'Not specified'}
- Manufacturer: ${medicine.manufacturer || 'Not specified'}
- Dosage Instructions: ${medicine.dosage_instructions || 'Not specified'}
- Notes: ${medicine.notes || 'None'}

You can answer questions about:
1. What this medicine is used for
2. How to take it properly
3. Side effects and precautions
4. Whether it's expired (check against current date: ${new Date().toISOString().split('T')[0]})
5. Drug interactions
6. Storage instructions
7. General medical advice

IMPORTANT DISCLAIMERS:
- Always include: "⚠️ This is general information. Consult your doctor for medical advice."
- If the medicine is expired, warn the user NOT to take it
- For serious questions, suggest consulting a healthcare professional
- Do NOT provide dosage advice beyond what's already specified

${langInstruction} Answer naturally and helpfully.`;
  }

  /**
   * Check if medicine is expired
   */
  isMedicineExpired(expiryDate: string | undefined): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  /**
   * Generate quick suggestions for common questions
   */
  getQuickQuestions(medicine: Medicine, language: string): string[] {
    const questions: Record<string, string[]> = {
      'english': [
        'What is this medicine used for?',
        'How should I take this?',
        'What are the side effects?',
        'Is it expired?',
        'Can I take it with other medicines?',
      ],
      'hindi': [
        'यह दवा किसलिए है?',
        'इसे कैसे लें?',
        'साइड इफेक्ट क्या हैं?',
        'क्या यह expired है?',
        'क्या अन्य दवाओं के साथ ले सकते हैं?',
      ],
      'japanese': [
        'この薬は何に使用されますか？',
        'どのように服用すべきですか？',
        '副作用は何ですか？',
        '期限切れですか？',
        '他の薬と一緒に飲めますか？',
      ],
    };

    return questions[language] || questions['english'];
  }
}