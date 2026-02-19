export async function getCarbonIntensity(): Promise<number | null> {
  try {
    const url = process.env.NEXT_PUBLIC_CARBON_INTENSITY_API_URL || 'https://api.carbonintensity.org.uk';
    const res = await fetch(`${url}/intensity`);
    if (!res.ok) return null;
    const data = await res.json();
    // API returns { data: [{ intensity: { actual, forecast, index } }] }
    const actual = data?.data?.[0]?.intensity?.actual ?? data?.data?.[0]?.intensity?.forecast;
    return typeof actual === 'number' ? actual : null;
  } catch {
    return null;
  }
}

export function isHighCarbon(currentIntensity: number | null): boolean {
  const threshold = Number(process.env.NEXT_PUBLIC_CARBON_THRESHOLD_GCO2_KWH || 500);
  if (currentIntensity == null) return false;
  return currentIntensity >= threshold;
}
