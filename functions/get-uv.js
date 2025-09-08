export async function onRequest(context) {
  // --- Daily API Limit Logic ---
  const kv = context.env.API_LIMITER;
  const today = new Date().toISOString().split('T')[0]; // Creates a "YYYY-MM-DD" string
  const key = `requests_${today}`;

  let count = await kv.get(key);

  // If it's a new day, the count will be null. Initialize it to 50.
  if (count === null) {
    count = 50;
  } else {
    count = parseInt(count);
  }

  // Check if the limit has been reached.
  if (count <= 0) {
    const errorResponse = { error: "Daily API limit reached. Please try again tomorrow." };
    return new Response(JSON.stringify(errorResponse), {
      status: 429, // HTTP status for "Too Many Requests"
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Decrement the count and save it back to KV.
  // We set it to expire in 2 days (172800 seconds) to automatically clean up old keys.
  const remainingCalls = count - 1;
  await kv.put(key, remainingCalls.toString(), { expirationTtl: 172800 });
  // --- End of API Limit Logic ---

  // If the limit was not reached, proceed with the original function logic.
  try {
    const { searchParams } = new URL(context.request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return new Response('Latitude and longitude are required', { status: 400 });
    }

    const apiKey = context.env.WEATHERBIT_API_KEY;

    if (!apiKey) {
      return new Response('Server configuration error: API key not found.', { status: 500 });
    }

    const apiUrl = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${apiKey}`;
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      // Forward the error from the weather API if it fails
      return new Response(apiResponse.body, { status: apiResponse.status, headers: apiResponse.headers });
    }

    const weatherData = await apiResponse.json();

    // Combine the weather data and the remaining call count
    const combinedData = {
      weather: weatherData,
      apiCallsRemaining: remainingCalls
    };

    return new Response(JSON.stringify(combinedData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}