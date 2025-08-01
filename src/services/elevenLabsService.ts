// ElevenLabs API integration for authentic Megatron voice
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

export interface ElevenLabsResponse {
  audio: string; // Base64 encoded audio
  audio_length: number;
  characters: number;
  extra: any;
  has_more_data: boolean;
  model_id: string;
  request_id: string;
  voice_id: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Get available voices from ElevenLabs
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  // Generate speech using a specific voice
  async generateSpeech(text: string, voiceId: string, modelId: string = 'eleven_monolingual_v1', voiceSettings?: { stability: number; similarity_boost: number; speed: number }): Promise<ElevenLabsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: voiceSettings || {
            stability: 0.95,
            similarity_boost: 0.98,
            speed: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error: ${response.status} ${response.statusText}`);
      }

      // ElevenLabs returns audio data directly, not JSON
      const audioBlob = await response.blob();
      
      // Convert blob to base64 more efficiently
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:audio/mpeg;base64,")
          const base64Audio = result.split(',')[1];
          resolve(base64Audio);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      return {
        audio: base64Audio,
        audio_length: 0, // We don't have this info from the response
        characters: text.length,
        extra: {},
        has_more_data: false,
        model_id: modelId,
        request_id: '',
        voice_id: voiceId
      };
    } catch (error) {
      console.error('Error generating speech with ElevenLabs:', error);
      throw error;
    }
  }

  // Create a Megatron voice using voice cloning
  async createMegatronVoice(): Promise<string | null> {
    try {
      // This would require voice samples of Megatron to clone
      // For now, we'll use a deep male voice that sounds similar
      const voices = await this.getVoices();
      
      // Find a deep male voice that could work for Megatron
      const megatronVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('deep') ||
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('robot') ||
        voice.name.toLowerCase().includes('mechanical')
      );

      return megatronVoice?.voice_id || null;
    } catch (error) {
      console.error('Error creating Megatron voice:', error);
      return null;
    }
  }

  // Get Megatron voice ID from environment or find suitable voice
  async getMegatronVoice(): Promise<string | null> {
    try {
      // Check if specific Megatron voice ID is provided
      const megatronVoiceId = import.meta.env.VITE_MEGATRON_VOICE_ID;
      if (megatronVoiceId) {
        return megatronVoiceId;
      }

      // Find a suitable voice for Megatron (deep, robotic)
      const voices = await this.getVoices();
      
      const megatronVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('deep') ||
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('robot') ||
        voice.name.toLowerCase().includes('mechanical') ||
        voice.name.toLowerCase().includes('bass') ||
        voice.name.toLowerCase().includes('low')
      );

      return megatronVoice?.voice_id || null;
    } catch (error) {
      console.error('Error getting Megatron voice:', error);
      return null;
    }
  }

  // Get Freeman voice ID from environment or find suitable voice
  async getFreemanVoice(): Promise<string | null> {
    try {
      // Check if specific Freeman voice ID is provided
      const freemanVoiceId = import.meta.env.VITE_FREEMAN_VOICE_ID;
      if (freemanVoiceId) {
        return freemanVoiceId;
      }

      // Find a suitable voice for Freeman (deep, authoritative)
      const voices = await this.getVoices();
      
      const freemanVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('deep') ||
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('authoritative') ||
        voice.name.toLowerCase().includes('commanding') ||
        voice.name.toLowerCase().includes('bass') ||
        voice.name.toLowerCase().includes('low')
      );

      return freemanVoice?.voice_id || null;
    } catch (error) {
      console.error('Error getting Freeman voice:', error);
      return null;
    }
  }

  // Play audio from base64 string
  playAudio(base64Audio: string): void {
    try {
      const audioBlob = this.base64ToBlob(base64Audio, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } catch (error) {
      console.error('Error playing ElevenLabs audio:', error);
    }
  }

  // Convert base64 to blob
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // Get recommended voices for Megatron
  getRecommendedMegatronVoices(): string[] {
    return [
      'pNInz6obpgDQGcFmaJgB', // Adam (deep male)
      'VR6AewLTigWG4xSOukaG', // Arnold (deep, commanding)
      'EXAVITQu4vr4xnSDxMaL', // Bella (can be modified for deep voice)
      '21m00Tcm4TlvDq8ikWAM', // Rachel (can be modified)
      'AZnzlk1XvdvUeBnXmlld', // Domi (can be modified)
    ];
  }

  // Instructions for setting up Megatron voice
  getMegatronVoiceSetupInstructions(): string {
    return `
ELEVENLABS MEGATRON VOICE SETUP:

1. Create ElevenLabs Account:
   - Go to https://elevenlabs.io
   - Sign up for an account
   - Get your API key from the dashboard

2. Voice Cloning (Recommended):
   - Collect Megatron voice samples (3-5 minutes)
   - Use ElevenLabs voice cloning feature
   - Upload samples and train the voice
   - Get the voice_id for the cloned voice

3. Alternative: Use Existing Deep Voice:
   - Browse available voices in ElevenLabs
   - Look for deep, male, robotic voices
   - Test different voices for best Megatron sound

4. Environment Variables:
   - Add VITE_ELEVENLABS_API_KEY to your .env file
   - Add VITE_MEGATRON_VOICE_ID (optional, for cloned voice)

5. Voice Settings for Megatron:
   - Stability: 0.5 (for consistent voice)
   - Similarity Boost: 0.75 (for voice accuracy)
   - Model: eleven_monolingual_v1 (for English)

6. Cost Information:
   - Free tier: 10,000 characters/month
   - Paid plans: $5-22/month for more characters
   - Voice cloning: Included in paid plans

7. API Integration:
   - The service will automatically use ElevenLabs
   - Falls back to browser TTS if API fails
   - Caches audio for better performance
    `;
  }
}

// Factory function to create ElevenLabs service
export const createElevenLabsService = (): ElevenLabsService | null => {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const enableElevenLabs = import.meta.env.VITE_ENABLE_ELEVENLABS === 'true';
  
  if (!enableElevenLabs) {
    console.log('ElevenLabs is disabled. Set VITE_ENABLE_ELEVENLABS=true to enable');
    return null;
  }
  
  if (!apiKey) {
    console.warn('ElevenLabs API key not found. Add VITE_ELEVENLABS_API_KEY to your .env file');
    return null;
  }

  return new ElevenLabsService(apiKey);
}; 