export async function onRequest(context) {
  const debugResponse = {
    status: "ok",
    message: "The get-uv function was called successfully!"
  };

  return new Response(JSON.stringify(debugResponse), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  try {
    // Get lat and lon from the request URL
    const { searchParams } = new URL(context.request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return new Response('Latitude and longitude are required', { status: 400 });
    }

    // Get the secret API key from Cloudflare's environment variables
    const apiKey = context.env.WEATHERBIT_API_KEY;

    // Check if the API key was found.
    if (!apiKey) {
      // This is a critical server error, return a specific message
      return new Response('Server configuration error: API key not found.', { status: 500 });
    }

    // Construct the API URL
    const apiUrl = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${apiKey}`;

    // Fetch data from the Weatherbit API
    const apiResponse = await fetch(apiUrl);

    // Return the response from the Weatherbit API directly to the client
    return new Response(apiResponse.body, {
      headers: { 'Content-Type': 'application/json' },
      status: apiResponse.status,
    });

  } catch (error) {
    // If any other error happens, return its message
    return new Response(error.message, { status: 500 });
  }
}