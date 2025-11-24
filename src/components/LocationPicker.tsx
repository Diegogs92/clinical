'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

// Centro por defecto: Buenos Aires
const defaultCenter = {
  lat: -34.6037,
  lng: -58.3816,
};

export default function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const [center, setCenter] = useState(() => {
    if (latitude && longitude) {
      return { lat: latitude, lng: longitude };
    }
    return defaultCenter;
  });

  const [markerPosition, setMarkerPosition] = useState(() => {
    if (latitude && longitude) {
      return { lat: latitude, lng: longitude };
    }
    return null;
  });

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationChange(lat, lng);
    }
  }, [onLocationChange]);

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPos = { lat, lng };
          setCenter(newPos);
          setMarkerPosition(newPos);
          onLocationChange(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No se pudo obtener la ubicación actual');
        }
      );
    } else {
      alert('Geolocalización no disponible en este navegador');
    }
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Google Maps API key no configurada
        </p>
        <p className="text-xs text-gray-500">
          Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu archivo .env.local
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Ubicación en el mapa</label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" />
          Usar mi ubicación
        </button>
      </div>

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {markerPosition && <Marker position={markerPosition} />}
        </GoogleMap>
      </LoadScript>

      <p className="text-xs text-gray-500">
        Haz clic en el mapa para colocar un pin en la ubicación del consultorio
      </p>

      {markerPosition && (
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <strong>Coordenadas:</strong> {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
