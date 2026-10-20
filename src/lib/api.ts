export async function readJsonResponse<T>(response: Response, fallback: T): Promise<T> {
  const text = await response.text();

  if (!response.ok || !text) {
    return fallback;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
