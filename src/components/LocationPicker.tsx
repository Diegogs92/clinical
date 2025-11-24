'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';

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

const libraries: ("places")[] = ["places"];

export default function LocationPicker({ latitude, longitude, address, onLocationChange }: LocationPickerProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

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
        onLocationChange(lat, lng, address);
      } else {
        onLocationChange(lat, lng, '');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      onLocationChange(lat, lng, '');
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

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPos = { lat, lng };
        setCenter(newPos);
        setMarkerPosition(newPos);
        const address = place.formatted_address || '';
        onLocationChange(lat, lng, address);
      }
    }
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
        <MapPin className="w-6 h-6 mx-auto mb-1 text-gray-400" />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Google Maps API key no configurada
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
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium mb-1">Buscar dirección</label>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              defaultValue={address}
              className="input-field text-sm"
              placeholder="Buscar dirección..."
            />
          </Autocomplete>
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
    </LoadScript>
  );
}
