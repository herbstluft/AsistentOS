import { ref } from 'vue';

const weatherState = ref<{
    condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';
    temp: number;
    description: string;
    location: string;
} | null>(null);

export function useWeather() {

    const mapWmoCodeToCondition = (code: number): 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' => {
        if (code === 0) return 'clear';
        if (code >= 1 && code <= 3) return 'cloudy';
        if (code >= 45 && code <= 48) return 'fog';
        if (code >= 51 && code <= 67) return 'rain'; // Drizzle / Rain
        if (code >= 80 && code <= 82) return 'rain'; // Showers
        if (code >= 71 && code <= 77) return 'snow';
        if (code >= 95 && code <= 99) return 'storm';
        return 'clear';
    };

    const getLocation = (): Promise<{ lat: number; lon: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocalización no soportada"));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                (err) => reject(err)
            );
        });
    };

    const fetchWeather = async () => {
        try {
            // Default to Mexico City if geo fails or blocked, or ask user? 
            // For now, try geo, fallback to CDMX
            let lat = 19.4326;
            let lon = -99.1332;

            try {
                const pos = await getLocation();
                lat = pos.lat;
                lon = pos.lon;
            } catch (e) {
                console.warn('Ubicación no disponible, usando defecto (CDMX).');
            }

            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=weather_code,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto`;

            const res = await fetch(url);
            const data = await res.json();

            if (!data.current) throw new Error("Error obteniendo clima");

            const code = data.current.weather_code;
            const condition = mapWmoCodeToCondition(code);

            weatherState.value = {
                condition,
                temp: data.current.temperature_2m,
                description: `Temp actual: ${data.current.temperature_2m}°C. Condición: ${condition}. Máx hoy: ${data.daily.temperature_2m_max[0]}°C. Probabilidad lluvia: ${data.daily.precipitation_probability_max[0]}%.`,
                location: 'Tu ubicación' // OpenMeteo doesn't give city name easily without reverse geocoding
            };

            return weatherState.value;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    return {
        weatherState,
        fetchWeather
    };
}
