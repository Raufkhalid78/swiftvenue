"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Loader2, Sun, ThermometerSun, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  icon: React.ReactNode;
}

export function EventWeather({ lat, lng, date }: { lat: number, lng: number, date: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Only attempt forecast if date is within next 14 days
        const eventDate = new Date(date);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0 || diffDays > 14) {
          setLoading(false);
          return; // Skip weather if it's in the past or too far in the future
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        if (!res.ok) throw new Error("Weather API failed");
        
        const data = await res.json();
        const dateString = eventDate.toISOString().split('T')[0];
        
        // Find index of the date
        const index = data.daily.time.indexOf(dateString);
        if (index === -1) {
          setLoading(false);
          return;
        }

        const maxTemp = data.daily.temperature_2m_max[index];
        const minTemp = data.daily.temperature_2m_min[index];
        const code = data.daily.weathercode[index];
        const temp = Math.round((maxTemp + minTemp) / 2);

        // Map WMO weather codes to icons and conditions
        let condition = "Clear";
        let icon = <Sun className="w-5 h-5 text-amber-500" />;

        if (code === 0) {
          condition = "Clear sky";
          icon = <Sun className="w-5 h-5 text-amber-500" />;
        } else if (code >= 1 && code <= 3) {
          condition = "Partly cloudy";
          icon = <Cloud className="w-5 h-5 text-slate-400" />;
        } else if (code >= 45 && code <= 48) {
          condition = "Fog";
          icon = <CloudFog className="w-5 h-5 text-slate-400" />;
        } else if (code >= 51 && code <= 57) {
          condition = "Drizzle";
          icon = <CloudDrizzle className="w-5 h-5 text-blue-400" />;
        } else if (code >= 61 && code <= 67) {
          condition = "Rain";
          icon = <CloudRain className="w-5 h-5 text-blue-500" />;
        } else if (code >= 71 && code <= 77) {
          condition = "Snow";
          icon = <CloudSnow className="w-5 h-5 text-sky-200" />;
        } else if (code >= 80 && code <= 82) {
          condition = "Rain showers";
          icon = <CloudRain className="w-5 h-5 text-blue-500" />;
        } else if (code >= 95 && code <= 99) {
          condition = "Thunderstorm";
          icon = <CloudLightning className="w-5 h-5 text-purple-500" />;
        }

        setWeather({ temp, condition, icon });
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (lat && lng && date) {
      fetchWeather();
    } else {
      setLoading(false);
    }
  }, [lat, lng, date]);

  if (loading) return null;
  if (error || !weather) return null;

  return (
    <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl p-3 shadow-sm mt-4 backdrop-blur-sm">
      <div className="bg-background rounded-full p-2 border border-border shadow-sm">
        {weather.icon}
      </div>
      <div>
        <p className="text-sm font-semibold flex items-center gap-1">
          <ThermometerSun className="w-3.5 h-3.5 text-muted-foreground" /> {weather.temp}°C
        </p>
        <p className="text-xs text-muted-foreground">{weather.condition} forecast</p>
      </div>
    </div>
  );
}
