async function readApiResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: response.ok ? 'The server returned an invalid response. Please try again.' : 'The server could not process this request. Please try again.' };
  }
}
