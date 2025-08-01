import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { calculateDistance } from '../utils/mapBounds';
import { getLocationDetails } from '../services/openaiService';
import OpenAI from 'openai';
import type { HistoricalSpot } from '../types/HistoricalSpot';

interface HistoricalSpotMarkerProps {
  spot: HistoricalSpot;
  userLatitude: number;
  userLongitude: number;
}

// Create custom + icon for historical spots
const createPlusIcon = (category: string) => {
  const categoryColors: { [key: string]: string } = {
    'Architecture': '#e74c3c',
    'Military': '#34495e',
    'Religious': '#9b59b6',
    'Cultural': '#f39c12',
    'Industrial': '#7f8c8d',
    'Historical': '#3498db'
  };

  const color = categoryColors[category] || categoryColors['Historical'];

  return divIcon({
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <span style="
          color: white;
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
        ">+</span>
      </div>
    `,
    className: 'historical-spot-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const HistoricalSpotMarker: React.FC<HistoricalSpotMarkerProps> = ({ spot, userLatitude, userLongitude }) => {
  // Calculate real-time distance from user's GPS location to this historical spot
  const distanceFromUser = calculateDistance(userLatitude, userLongitude, spot.latitude, spot.longitude);
  
  // State for location details lazy loading
  const [funFact, setFunFact] = useState<string | null>(null);
  const [historicalSignificance, setHistoricalSignificance] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('morgan-freeman');
  
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const handlePopupOpen = async () => {
    // Only fetch details if we don't have them yet
    if (!funFact && !historicalSignificance && !loadingDetails) {
      setLoadingDetails(true);
      console.log(`Loading location details for ${spot.name}...`);
      
      try {
        const details = await getLocationDetails(
          spot.name, 
          spot.latitude, 
          spot.longitude, 
          spot.category
        );
        setFunFact(details.funFact);
        setHistoricalSignificance(details.historicalSignificance);
      } catch (error) {
        console.error('Failed to load location details:', error);
        setFunFact('This location has its own unique history and stories worth discovering.');
        setHistoricalSignificance('This location holds important historical value.');
      } finally {
        setLoadingDetails(false);
      }
    }
    
    // Load voices for text-to-speech (needed for voice selection)
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          console.log('Available voices for Morgan Freeman-style narration:', 
            voices.filter(v => v.lang.includes('en')).map(v => v.name));
        }
      };
      
      // Load voices immediately if available, or wait for them to load
      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  };

  const getVoiceConfig = (voiceType: string) => {
    const configs: Record<string, {
      rate: number;
      pitch: number;
      volume: number;
      preferredNames: string[];
      icon: string;
      description: string;
    }> = {
      'morgan-freeman': {
        rate: 0.75,
        pitch: 0.7,
        volume: 0.9,
        preferredNames: ['Microsoft David', 'Google US English Male', 'Alex', 'Daniel'],
        icon: '🎭',
        description: 'Morgan Freeman'
      },
      'darth-vader': {
        rate: 0.6,
        pitch: 0.3,
        volume: 1.0,
        preferredNames: ['Microsoft David', 'Google US English Male', 'Daniel'],
        icon: '⚫',
        description: 'Darth Vader'
      },
      'pinky-pie': {
        rate: 1.4,
        pitch: 1.8,
        volume: 0.8,
        preferredNames: ['Microsoft Zira', 'Google US English Female', 'Samantha', 'Victoria'],
        icon: '🦄',
        description: 'Pinky Pie'
      },
      'yoda': {
        rate: 0.55,
        pitch: 1.6,
        volume: 0.9,
        preferredNames: ['Fred', 'Whisper', 'Microsoft David', 'Alex', 'Bruce', 'Ralph'],
        icon: '🐸',
        description: 'Yoda'
      }
    };
    
    return configs[voiceType] || configs['morgan-freeman'];
  };

  const transformTextForCharacter = async (text: string, voiceType: string): Promise<string> => {
    switch (voiceType) {
      case 'darth-vader':
        return `${text}... The dark side of history is strong with this one.`;
      case 'pinky-pie':
        return `Oh my gosh, oh my gosh! ${text} Isn't history just super duper amazing?!`;
      case 'yoda':
        return await transformToYodaSpeak(text);
      default:
        return text;
    }
  };

  const transformToYodaSpeak = async (text: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        // Fallback to simple transformation if no API key
        return `${text}. Strong with the Force, this place is, hmm.`;
      }

      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      console.log('Transforming text to Yoda-speak using OpenAI...');

      const prompt = `Transform the following text to sound exactly like Yoda from Star Wars would say it. Use Yoda's distinctive speech patterns:

- Reverse word order (Object-Subject-Verb instead of Subject-Verb-Object)
- Use "mmm" and "hmm" occasionally
- Add wisdom-like phrasing
- Keep the same meaning but change the sentence structure
- Make it sound mystical and wise
- End with a typical Yoda phrase

Original text: "${text}"

Transform this to Yoda-speak while keeping all the factual information intact:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      });

      const yodaText = completion.choices[0]?.message?.content?.trim();
      
      if (yodaText) {
        console.log('Successfully transformed to Yoda-speak:', yodaText);
        return yodaText;
      } else {
        // Fallback if OpenAI doesn't respond
        return `${text}. Strong with the Force, this place is, hmm.`;
      }

    } catch (error) {
      console.error('Error transforming text to Yoda-speak:', error);
      // Fallback to simple transformation
      const sentences = text.split('. ');
      const yodaText = sentences.map(sentence => {
        const words = sentence.trim().split(' ');
        if (words.length > 3) {
          // Simple word rearrangement for fallback
          const verb = words.find(w => w.includes('is') || w.includes('was') || w.includes('are'));
          if (verb) {
            const verbIndex = words.indexOf(verb);
            words.splice(verbIndex, 1);
            words.push(verb);
          }
        }
        return words.join(' ');
      }).join('. ');
      return `${yodaText}. Strong with the Force, this place is, hmm.`;
    }
  };

  const handleTextToSpeech = async (text: string, type: 'funFact' | 'significance') => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const voiceConfig = getVoiceConfig(selectedVoice);
    
    // Show loading state for Yoda transformation
    if (selectedVoice === 'yoda') {
      console.log('Transforming text to authentic Yoda-speak...');
    }
    
    const transformedText = await transformTextForCharacter(text, selectedVoice);
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(transformedText);
    
    // Find the best voice for selected character
    const voices = window.speechSynthesis.getVoices();
    
    let bestVoice = voices.find(voice => 
      voiceConfig.preferredNames.some((name: string) => voice.name.includes(name))
    );
    
         // Fallback logic based on character
     if (!bestVoice) {
       if (selectedVoice === 'pinky-pie') {
         bestVoice = voices.find(voice => 
           voice.lang.includes('en') && 
           (voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('samantha'))
         );
       } else if (selectedVoice === 'yoda') {
         // Look for voices that might sound more hoarse/distinctive for Yoda
         bestVoice = voices.find(voice => 
           voice.lang.includes('en') && 
           (voice.name.toLowerCase().includes('fred') || 
            voice.name.toLowerCase().includes('whisper') ||
            voice.name.toLowerCase().includes('bruce') ||
            voice.name.toLowerCase().includes('ralph') ||
            voice.name.toLowerCase().includes('novelty'))
         ) || voices.find(voice => 
           voice.lang.includes('en') && 
           voice.name.toLowerCase().includes('male')
         );
       } else {
         bestVoice = voices.find(voice => 
           voice.lang.includes('en') && 
           (voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('david'))
         );
       }
     }
    
    // Final fallback
    if (!bestVoice) {
      bestVoice = voices.find(voice => voice.lang.includes('en'));
    }
    
    if (bestVoice) {
      utterance.voice = bestVoice;
      console.log(`Using voice: ${bestVoice.name} for ${voiceConfig.description} narration`);
    }
    
    // Apply character-specific speech settings
    utterance.rate = voiceConfig.rate;
    utterance.pitch = voiceConfig.pitch;
    utterance.volume = voiceConfig.volume;
    
    // Special adjustments for Yoda to make voice more hoarse and distinctive
    if (selectedVoice === 'yoda') {
      // Additional hoarse effect - slightly reduce volume and increase pitch variation
      utterance.volume = Math.min(utterance.volume * 0.95, 1.0);
      console.log(`Yoda voice configured: Rate=${utterance.rate}, Pitch=${utterance.pitch}, Volume=${utterance.volume} for hoarse, high-pitched delivery`);
    }
    
    // Add event listeners
    utterance.onstart = () => {
      console.log(`${voiceConfig.description} narration started for ${type}: "${spot.name}"`);
    };
    
    utterance.onend = () => {
      console.log(`${voiceConfig.description} narration completed for ${spot.name}`);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
    };

    // Speak the text with character-specific delivery
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={createPlusIcon(spot.category)}
      eventHandlers={{
        click: handlePopupOpen
      }}
    >
      <Popup
        maxWidth={350}
        className="historical-spot-popup"
      >
        <div className="historical-spot-content">
          <div className="spot-header">
            <h3 className="spot-name">{spot.name}</h3>
            <div className="spot-badges">
              <span className="category-badge" style={{
                backgroundColor: getCategoryColor(spot.category),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {spot.category}
              </span>
              <span className="period-badge">
                {spot.period}
              </span>
            </div>
          </div>
          
          <div className="spot-body">
            <p className="spot-description">{spot.description}</p>
            
            <div className="spot-details">
              <div className="detail-item">
                <strong>Distance from Your Location:</strong>
                <span className="distance">{formatDistance(distanceFromUser)} away</span>
              </div>
              
              <div className="detail-item">
                <strong>Voice Narrator:</strong>
                <select 
                  className="voice-selector"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  <option value="morgan-freeman">🎭 Morgan Freeman</option>
                  <option value="darth-vader">⚫ Darth Vader</option>
                  <option value="pinky-pie">🦄 Pinky Pie</option>
                  <option value="yoda">🐸 Yoda</option>
                </select>
              </div>
              
              <div className="detail-item">
                <div className="detail-header">
                  <strong>Fun Fact:</strong>
                  {funFact && !loadingDetails && (
                    <button 
                      className={`speech-button ${selectedVoice}-voice`}
                      onClick={() => handleTextToSpeech(funFact, 'funFact')}
                      title={`Listen to fun fact (${getVoiceConfig(selectedVoice).description} narration)${selectedVoice === 'yoda' ? ' - AI-powered Yoda-speak' : ''}`}
                    >
                      {getVoiceConfig(selectedVoice).icon}🔊
                    </button>
                  )}
                </div>
                <div className="fun-fact">
                  {loadingDetails ? (
                    <span className="loading-fact">
                      <span className="fact-spinner"></span>
                      Getting interesting facts...
                    </span>
                  ) : funFact ? (
                    <span className="fact-text">{funFact}</span>
                  ) : (
                    <span className="fact-placeholder">Click to load fascinating details!</span>
                  )}
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-header">
                  <strong>Historical Significance:</strong>
                  {historicalSignificance && !loadingDetails && (
                    <button 
                      className={`speech-button ${selectedVoice}-voice`}
                      onClick={() => handleTextToSpeech(historicalSignificance, 'significance')}
                      title={`Listen to historical significance (${getVoiceConfig(selectedVoice).description} narration)${selectedVoice === 'yoda' ? ' - AI-powered Yoda-speak' : ''}`}
                    >
                      {getVoiceConfig(selectedVoice).icon}🔊
                    </button>
                  )}
                </div>
                <div className="historical-significance">
                  {loadingDetails ? (
                    <span className="loading-fact">
                      <span className="fact-spinner"></span>
                      Loading historical context...
                    </span>
                  ) : historicalSignificance ? (
                    <span className="significance-text">{historicalSignificance}</span>
                  ) : (
                    <span className="fact-placeholder">Click to discover historical importance!</span>
                  )}
                </div>
              </div>
              
              <div className="detail-item coordinates">
                <strong>Coordinates:</strong>
                <span>{spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const getCategoryColor = (category: string): string => {
  const categoryColors: { [key: string]: string } = {
    'Architecture': '#e74c3c',
    'Military': '#34495e',
    'Religious': '#9b59b6',
    'Cultural': '#f39c12',
    'Industrial': '#7f8c8d',
    'Historical': '#3498db'
  };
  return categoryColors[category] || categoryColors['Historical'];
};

export default HistoricalSpotMarker; 