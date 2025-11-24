'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { MapPin, Loader2, Search } from 'lucide-react';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '8px',
};

const libraries: ("places" | "geometry")[] = ["places"];

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

export default function LocationPicker({ latitude, longitude, address, onLocationChange }: LocationPickerProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [inputValue, setInputValue] = useState(address || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'es',
    region: 'AR',
  });

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('⚠️ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada');
    } else {
      console.log('✅ Google Maps API Key configurada');
    }
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      const pos = { lat: latitude, lng: longitude };
      setCenter(pos);
      setMarkerPosition(pos);
    } else {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPos = { lat, lng };
          setCenter(newPos);
          setMarkerPosition(newPos);
          setIsLoadingLocation(false);
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          const fallback = { lat: -34.6037, lng: -58.3816 };
          setCenter(fallback);
          setIsLoadingLocation(false);
        }
      );
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const address = data.results[0].formatted_address;
        setInputValue(address);
        onLocationChange(lat, lng, address);
      } else {
        onLocationChange(lat, lng, '');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      onLocationChange(lat, lng, '');
    }
  };

  // Buscar sugerencias usando Places API Autocomplete Service (no deprecado)
  const searchPlaces = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    setIsLoadingSuggestions(true);

    try {
      // Use the client-side AutocompleteService (no CORS issues)
      if (isLoaded && window.google) {
        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'ar' },
            types: ['address'],
          },
          (predictions, status) => {
            setIsLoadingSuggestions(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(
                predictions.map((p) => ({
                  description: p.description,
                  place_id: p.place_id,
                }))
              );
              setShowSuggestions(true);
              console.log('✅ Sugerencias cargadas:', predictions.length);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setIsLoadingSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Debounce the search
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get place details using Place Details API
    if (isLoaded && window.google) {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['geometry', 'formatted_address'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const newPos = { lat, lng };
            setCenter(newPos);
            setMarkerPosition(newPos);
            const formattedAddress = place.formatted_address || suggestion.description;
            setInputValue(formattedAddress);
            onLocationChange(lat, lng, formattedAddress);
            console.log('✅ Lugar seleccionado:', formattedAddress);
          }
        }
      );
    }
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, []);

  if (loadError) {
    console.error('❌ Error al cargar Google Maps:', loadError);
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">
          Error al cargar Google Maps
        </p>
        <p className="text-xs text-red-500 dark:text-red-400">
          {loadError.message || 'Verifica que Places API esté habilitada y configurada correctamente'}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
        <Loader2 className="w-6 h-6 mx-auto mb-1 text-primary animate-spin" />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Cargando Google Maps...
        </p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
        <Loader2 className="w-6 h-6 mx-auto mb-1 text-primary animate-spin" />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Obteniendo ubicación...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative z-[10000]">
        <label className="block text-xs font-medium mb-1">Buscar dirección</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoadingSuggestions ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            className="input-field text-sm pl-10 relative z-[10000] w-full"
            placeholder="Ej: Av. Corrientes 1234, CABA"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[10001]">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-gray-100">{suggestion.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium">Mapa</label>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {isLoadingLocation ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <MapPin className="w-3 h-3" />
            )}
            Mi ubicación
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={16}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
          }}
        >
          {markerPosition && <Marker position={markerPosition} />}
        </GoogleMap>

        <p className="text-xs text-gray-500 mt-1">
          Busca una dirección o haz clic en el mapa
        </p>
      </div>
    </div>
  );
}
