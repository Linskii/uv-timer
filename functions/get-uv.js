export async function onRequest(context) {
  // Get lat and lon from the request URL
  const { searchParams } = new URL(context.request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return new Response('Latitude and longitude are required', { status: 400 });
  }

  // Get the secret API key from Cloudflare's environment variables
  const apiKey = context.env.WEATHERBIT_API_KEY;

  // Construct the API URL
  const apiUrl = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${apiKey}`;

  // Fetch data from the Weatherbit API
  const apiResponse = await fetch(apiUrl);

  // Return the response from the Weatherbit API directly to the client
  return new Response(apiResponse.body, {
    headers: { 'Content-Type': 'application/json' },
    status: apiResponse.status,
  });
}