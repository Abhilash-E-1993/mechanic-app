const FALLBACK_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  accuracy: null,
  isFallback: true,
};

const GEOLOCATION_ERRORS = {
  1: 'Location permission denied. Please allow location access or select a hub.',
  2: 'Unable to determine your precise location. Please select a hub.',
  3: 'Location request timed out. Please retry or select a hub.',
};

const TARGET_ACCURACY_METERS = 80;
const HIGH_ACCURACY_TIMEOUT_MS = 4500;
const CACHED_LOCATION_MAX_AGE_MS = 1000 * 60 * 5;

// In-memory cache for reverse geocoding to prevent excessive API calls
const geocodeCache = new Map();

/**
 * Format latitude and longitude into human-readable coordinates
 */
export const formatCoordinates = (lat, lng) => {
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return 'Coordinates unavailable';
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const latDir = latNum >= 0 ? 'N' : 'S';
  const lngDir = lngNum >= 0 ? 'E' : 'W';
  return `${Math.abs(latNum).toFixed(5)}° ${latDir}, ${Math.abs(lngNum).toFixed(5)}° ${lngDir}`;
};

/**
 * Reverse geocode GPS coordinates to a real-world pinpoint address using OpenStreetMap Nominatim
 */
export const reverseGeocode = async (lat, lng) => {
  if (lat == null || lng == null) return null;

  const cacheKey = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.address) {
      throw new Error('No address found');
    }

    const addr = data.address;
    const road = addr.road || addr.pedestrian || addr.street || '';
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.city_district || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || '';
    const state = addr.state || '';

    const parts = [road, neighbourhood, city].filter(Boolean);
    const shortAddress = parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(0, 3).join(',') || formatCoordinates(lat, lng));
    const fullAddress = data.display_name || shortAddress;

    const result = {
      shortAddress,
      fullAddress,
      road,
      neighbourhood,
      city,
      state,
      postcode: addr.postcode || '',
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    // Fallback gracefully to formatted coordinates
    const fallbackResult = {
      shortAddress: formatCoordinates(lat, lng),
      fullAddress: `Pinpoint Location: ${formatCoordinates(lat, lng)}`,
      road: '',
      neighbourhood: '',
      city: '',
      state: '',
      postcode: '',
    };
    geocodeCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
};

const getSingleLocationAttempt = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          isFallback: false,
        });
      },
      reject,
      options,
    );
  });

export const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    console.warn('GPS unsupported. Using fallback coordinates.');
    return FALLBACK_LOCATION;
  }

  try {
    const cachedLocation = await getSingleLocationAttempt({
      enableHighAccuracy: false,
      timeout: 2500,
      maximumAge: CACHED_LOCATION_MAX_AGE_MS,
    });

    if (
      (cachedLocation.accuracy ?? Number.POSITIVE_INFINITY) <=
      TARGET_ACCURACY_METERS
    ) {
      return cachedLocation;
    }

    try {
      const highAccuracyLocation = await getSingleLocationAttempt({
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 0,
      });

      return highAccuracyLocation;
    } catch {
      return cachedLocation;
    }
  } catch (cachedError) {
    try {
      return await getSingleLocationAttempt({
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 0,
      });
    } catch (highAccuracyError) {
      const finalError = highAccuracyError || cachedError;
      console.warn(
        GEOLOCATION_ERRORS[finalError?.code] ||
          'Geolocation failed. Using fallback coordinates.'
      );
      return FALLBACK_LOCATION;
    }
  }
};

export { FALLBACK_LOCATION };

