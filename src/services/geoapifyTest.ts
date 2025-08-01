// Simple test function to debug Geoapify API issues
export const testGeoapifyAPI = async (lat: number, lng: number) => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  
  if (!apiKey) {
    console.error('No Geoapify API key found');
    return;
  }
  
  console.log(`Testing Geoapify API with key: ${apiKey.substring(0, 8)}...`);
  
  // Simple test call - just search for places near a location
  const url = `https://api.geoapify.com/v2/places?categories=tourism&filter=circle:${lng},${lat},1000&limit=5&apiKey=${apiKey}`;
  
  console.log('Test URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Response data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}; 