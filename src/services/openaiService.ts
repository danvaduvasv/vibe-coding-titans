import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

interface LocationDetails {
  funFact: string;
  historicalSignificance: string;
}

export const getLocationDetails = async (
  locationName: string,
  latitude: number,
  longitude: number,
  category: string
): Promise<LocationDetails> => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return {
        funFact: 'OpenAI API key not configured for location details.',
        historicalSignificance: 'API configuration needed to load historical significance.'
      };
    }

    console.log(`Getting location details for: ${locationName}`);

    const prompt = `Provide information about "${locationName}" located at coordinates ${latitude}, ${longitude}. This is a ${category.toLowerCase()} location.

I need exactly 2 pieces of information in JSON format:

1. "funFact": A fascinating, lesser-known fun fact (200 characters max)
2. "historicalSignificance": Why this location is historically important (200 characters max)

Requirements for both:
- Exactly 200 characters or less each
- Engaging and informative
- Focus on history, architecture, culture, or interesting stories
- Don't mention coordinates in the response
- Start directly with the content, no introductory phrases

Return ONLY valid JSON in this exact format:
{
  "funFact": "Your fascinating fun fact here...",
  "historicalSignificance": "Why this location matters historically..."
}

Example:
{
  "funFact": "The cathedral's bell tower leans 4 degrees due to soft soil. Legend says it was built crooked to confuse invading armies.",
  "historicalSignificance": "Built in 1247, this cathedral served as a refuge during medieval wars and housed royal coronations for over 300 years."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200 // Increased tokens for both fields
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      return {
        funFact: 'An interesting location with its own unique history and stories.',
        historicalSignificance: 'This location holds important historical value worth exploring.'
      };
    }

    try {
      // Parse JSON response
      const parsedResponse = JSON.parse(response);
      
      let funFact = parsedResponse.funFact || 'This location has fascinating stories to discover.';
      let historicalSignificance = parsedResponse.historicalSignificance || 'This location holds significant historical importance.';
      
      // Ensure character limits
      if (funFact.length > 200) {
        funFact = funFact.substring(0, 197) + '...';
      }
      if (historicalSignificance.length > 200) {
        historicalSignificance = historicalSignificance.substring(0, 197) + '...';
      }

      console.log(`Location details retrieved for ${locationName}:`, { funFact, historicalSignificance });
      
      return {
        funFact,
        historicalSignificance
      };

    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON response:', response);
      
      // Fallback: try to extract information from non-JSON response
      const lines = response.split('\n').filter(line => line.trim());
      return {
        funFact: lines[0]?.substring(0, 200) || 'This location has fascinating stories to discover.',
        historicalSignificance: lines[1]?.substring(0, 200) || 'This location holds significant historical importance.'
      };
    }

  } catch (error) {
    console.error('Error getting location details from OpenAI:', error);
    return {
      funFact: 'This location has many interesting stories worth exploring.',
      historicalSignificance: 'This location holds important historical significance.'
    };
  }
};

 