import OpenAI from 'openai';

// External API options for authentic Megatron voice
export interface VoiceTransformationOptions {
  // ElevenLabs API for high-quality voice cloning
  elevenLabsApiKey?: string;
  // Play.ht API for voice synthesis
  playHtApiKey?: string;
  // Azure Speech Service for voice customization
  azureSpeechKey?: string;
  // OpenAI for text transformation
  openaiApiKey?: string;
}

export class VoiceTransformationService {
  private openai: OpenAI | null = null;

  constructor(options: VoiceTransformationOptions) {
    if (options.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: options.openaiApiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  // Transform text to Megatron's speech pattern
  async transformToMegatronSpeak(text: string): Promise<string> {
    if (!this.openai) {
      return this.getFallbackMegatronText(text);
    }

    try {
      console.log('Transforming text to authentic Megatron-speak using OpenAI...');

      const prompt = `Transform the following text to sound exactly like Megatron from Transformers would say it. Use Megatron's distinctive speech patterns:

CHARACTERISTICS:
- Formal, commanding, and authoritative tone
- Robotic and mechanical terminology
- Threatening and superior attitude
- Use of "I am Megatron", "Decepticons", "conquest", "superiority"
- Words like "inferior", "superior", "conquest", "destruction", "obey"
- Analyze locations as potential strategic assets
- End with conquest or superiority phrases

SPEECH PATTERNS:
- "I am Megatron, leader of the Decepticons"
- "This location serves the cause of conquest"
- "The inferior Autobots would find this place useful"
- "This strategic position will serve our purposes"
- "The conquest of this area is inevitable"

Original text: "${text}"

Transform this to authentic Megatron-speak while keeping all the factual information intact:`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      });

      const megatronText = completion.choices[0]?.message?.content?.trim();
      
      if (megatronText) {
        console.log('Successfully transformed to Megatron-speak:', megatronText);
        return megatronText;
      } else {
        return this.getFallbackMegatronText(text);
      }

    } catch (error) {
      console.error('Error transforming text to Megatron-speak:', error);
      return this.getFallbackMegatronText(text);
    }
  }

  private getFallbackMegatronText(text: string): string {
    // Fallback transformation without API
    const megatronPhrases = [
      "I am Megatron, leader of the Decepticons.",
      "This location serves the cause of conquest.",
      "The inferior Autobots would find this place useful.",
      "This strategic position will serve our purposes.",
      "The conquest of this area is inevitable."
    ];

    const randomPhrase = megatronPhrases[Math.floor(Math.random() * megatronPhrases.length)];
    return `${text}. ${randomPhrase}`;
  }

  // Get voice configuration for Megatron
  getMegatronVoiceConfig() {
    return {
      rate: 0.7,
      pitch: 0.4,
      volume: 1.0,
      preferredNames: ['Microsoft David', 'Google US English Male', 'Daniel', 'Alex'],
      icon: '🤖',
      description: 'Megatron'
    };
  }

  // External API recommendations for authentic Megatron voice
  getExternalVoiceAPIs(): string[] {
    return [
      "ElevenLabs API - Voice cloning for authentic Megatron voice",
      "Play.ht API - High-quality voice synthesis",
      "Azure Speech Service - Custom voice training",
      "Amazon Polly - Neural voice synthesis",
      "Google Cloud Text-to-Speech - Advanced voice customization"
    ];
  }

  // Instructions for setting up external voice APIs
  getSetupInstructions(): string {
    return `
EXTERNAL VOICE API SETUP FOR AUTHENTIC MEGATRON VOICE:

1. ElevenLabs API (Recommended):
   - Sign up at https://elevenlabs.io
   - Get API key from dashboard
   - Use voice cloning to create Megatron voice
   - Cost: $5-22/month for voice cloning

2. Play.ht API:
   - Sign up at https://play.ht
   - Get API key from account settings
   - Use voice synthesis with custom voices
   - Cost: $14-39/month

3. Azure Speech Service:
   - Azure account required
   - Custom voice training for Megatron
   - Requires voice samples for training
   - Cost: Pay-per-use

4. Amazon Polly:
   - AWS account required
   - Neural TTS with custom voices
   - Cost: Pay-per-character

5. Google Cloud Text-to-Speech:
   - Google Cloud account required
   - Custom voice training available
   - Cost: Pay-per-character

IMPLEMENTATION:
- Add API keys to environment variables
- Create voice transformation endpoints
- Integrate with existing text-to-speech system
- Cache transformed audio for performance
    `;
  }
}

// Factory function to create voice transformation service
export const createVoiceTransformationService = (): VoiceTransformationService => {
  const options: VoiceTransformationOptions = {
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    // Add other API keys as needed
    // elevenLabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
    // playHtApiKey: import.meta.env.VITE_PLAYHT_API_KEY,
    // azureSpeechKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
  };

  return new VoiceTransformationService(options);
}; 