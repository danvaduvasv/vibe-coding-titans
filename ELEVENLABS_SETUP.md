# ElevenLabs Megatron Voice Setup

This guide will help you set up authentic Megatron voice using ElevenLabs API.

## 🚀 Quick Setup

### 1. Create ElevenLabs Account
- Go to [https://elevenlabs.io](https://elevenlabs.io)
- Sign up for a free account
- Get your API key from the dashboard

### 2. Add Environment Variables
Add these to your `.env` file:
```bash
VITE_ENABLE_ELEVENLABS=true
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_MEGATRON_VOICE_ID=your_megatron_voice_id_here  # Optional
VITE_FREEMAN_VOICE_ID=your_freeman_voice_id_here  # Optional
```

### 3. Test the Integration
- Start the development server
- Click on a historical spot marker
- Select "🤖 Megatron" or "🎭 Freeman" from the voice dropdown
- Click the 🔊 button to hear authentic voices from ElevenLabs

## 🎯 Voice Options

### Option 1: Use Existing Voices (Recommended for testing)
ElevenLabs has several voices that work well for our characters:

**For Megatron:**
- **Adam** (ID: `pNInz6obpgDQGcFmaJgB`) - Deep, commanding voice
- **Arnold** (ID: `VR6AewLTigWG4xSOukaG`) - Deep, authoritative voice
- **Josh** (ID: `TxGEqnHWrfWFTfGW9XjX`) - Deep male voice

**For Freeman:**
- **Adam** (ID: `pNInz6obpgDQGcFmaJgB`) - Warm, authoritative voice
- **Arnold** (ID: `VR6AewLTigWG4xSOukaG`) - Deep, contemplative voice
- **Josh** (ID: `TxGEqnHWrfWFTfGW9XjX`) - Warm male voice

### Option 2: Clone Authentic Voices (For authentic sound)
**For Megatron:**
1. Collect Megatron voice samples (3-5 minutes of clear speech)
2. Use ElevenLabs voice cloning feature
3. Upload samples and train the voice
4. Get the voice_id for your cloned voice
5. Add the voice_id to `VITE_MEGATRON_VOICE_ID`

**For Freeman:**
1. Collect Morgan Freeman voice samples (3-5 minutes of clear speech)
2. Use ElevenLabs voice cloning feature
3. Upload samples and train the voice
4. Get the voice_id for your cloned voice
5. Add the voice_id to `VITE_FREEMAN_VOICE_ID`

## 💰 Cost Information

- **Free Tier**: 10,000 characters/month
- **Paid Plans**: $5-22/month for more characters
- **Voice Cloning**: Included in paid plans

## 🔧 Technical Details

### API Integration
The app automatically:
- Uses ElevenLabs for Megatron voice when API key is available
- Falls back to browser TTS if ElevenLabs fails
- Caches audio for better performance
- Handles errors gracefully

### Voice Settings
**For Megatron:**
- **Stability**: 0.5 (for consistent voice)
- **Similarity Boost**: 0.75 (for voice accuracy)
- **Model**: eleven_monolingual_v1 (for English)

**For Freeman:**
- **Stability**: 0.6 (for warm, consistent voice)
- **Similarity Boost**: 0.8 (for voice accuracy)
- **Model**: eleven_monolingual_v1 (for English)

### Recommended Voice IDs
```javascript
const megatronVoices = [
  'pNInz6obpgDQGcFmaJgB', // Adam (deep male)
  'VR6AewLTigWG4xSOukaG', // Arnold (deep, commanding)
  'TxGEqnHWrfWFTfGW9XjX', // Josh (deep male)
];

const freemanVoices = [
  'pNInz6obpgDQGcFmaJgB', // Adam (warm, authoritative)
  'VR6AewLTigWG4xSOukaG', // Arnold (deep, contemplative)
  'TxGEqnHWrfWFTfGW9XjX', // Josh (warm male)
];
```

## 🎭 Voice Cloning Instructions

### Step 1: Collect Voice Samples
- Find clear Megatron voice clips from Transformers
- Aim for 3-5 minutes of speech
- Ensure good audio quality
- Include various speech patterns

### Step 2: Prepare Samples
- Convert to MP3 format
- Ensure clear audio (no background noise)
- Split into 30-second segments if needed
- Label files clearly

### Step 3: Clone Voice
1. Go to ElevenLabs dashboard
2. Click "Voice Library"
3. Click "Add Voice"
4. Select "Voice Cloning"
5. Upload your Megatron samples
6. Name it "Megatron"
7. Wait for training to complete
8. Copy the voice_id

### Step 4: Configure App
Add the voice_ids to your `.env` file:
```bash
VITE_MEGATRON_VOICE_ID=your_cloned_megatron_voice_id_here
VITE_FREEMAN_VOICE_ID=your_cloned_freeman_voice_id_here
```

## 🐛 Troubleshooting

### Common Issues

1. **"ElevenLabs API key not found"**
   - Check that `VITE_ELEVENLABS_API_KEY` is set in `.env`
   - Restart the development server

2. **"ElevenLabs TTS error"**
   - Check your API key is valid
   - Verify you have enough characters in your quota
   - Check the voice_id is correct

3. **Audio not playing**
   - Check browser console for errors
   - Ensure browser supports audio playback
   - Try refreshing the page

4. **Voice doesn't sound authentic**
   - Try different voice IDs from the recommended list
   - Consider voice cloning for authentic sound
   - Adjust voice settings in the code
   - Check that `VITE_ENABLE_ELEVENLABS=true` is set

### Debug Information
The app logs detailed information to the browser console:
- API calls and responses
- Voice selection process
- Audio playback status
- Error messages

## 🎯 Advanced Configuration

### Custom Voice Settings
You can modify voice settings in `src/services/elevenLabsService.ts`:

```javascript
voice_settings: {
  stability: 0.5,        // 0-1: Higher = more consistent
  similarity_boost: 0.75, // 0-1: Higher = more similar to original
  style: 0.0,            // 0-1: Higher = more expressive
  use_speaker_boost: true // Enhances voice clarity
}
```

### Multiple Megatron Voices
You can create multiple Megatron voices for different contexts:
- `VITE_MEGATRON_VOICE_ID_COMMANDING` - For authoritative speech
- `VITE_MEGATRON_VOICE_ID_THREATENING` - For threatening speech
- `VITE_MEGATRON_VOICE_ID_ANALYTICAL` - For strategic analysis

## 🚀 Performance Tips

1. **Cache Audio**: The app caches generated audio for better performance
2. **Batch Requests**: Consider batching multiple text-to-speech requests
3. **Voice Preloading**: Preload commonly used voices
4. **Error Handling**: Graceful fallback to browser TTS

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your ElevenLabs API key and quota
3. Test with a simple voice first
4. Contact ElevenLabs support for API issues

---

**Note**: This integration provides the most authentic Megatron voice experience possible with current technology. For the best results, use voice cloning with high-quality Megatron samples. 