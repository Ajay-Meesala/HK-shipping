import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker assets path issues in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface MapMarker {
  city: string;
  position: [number, number];
  count: number;
  color?: string;
}

export interface MapPolyline {
  positions: [number, number][];
  color?: string;
}

interface LiveMapProps {
  markers: MapMarker[];
  polylines?: MapPolyline[];
  center?: [number, number];
  zoom?: number;
  mapView?: 'standard' | 'satellite';
}

// Function to create standard truck-based Leaflet DivIcon
const createTruckIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-5.14a1 1 0 0 0-.293-.707l-3.86-3.86a1 1 0 0 0-.707-.293h-2.14"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="17" cy="18" r="2"/>
        </svg>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function LiveMap({
  markers,
  polylines = [],
  center = [22.5937, 78.9629], // Center of India
  zoom = 5,
  mapView = 'standard'
}: LiveMapProps) {
  // Map standard vs satellite tiles
  const standardTiles = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const standardAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const satelliteTiles = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const satelliteAttribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

  const activeTiles = mapView === 'satellite' ? satelliteTiles : standardTiles;
  const activeAttribution = mapView === 'satellite' ? satelliteAttribution : standardAttribution;

  // We want to force map redraw/refresh when TileLayer source changes
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={mapView} // Force rebuild of layer on map view toggle
          attribution={activeAttribution}
          url={activeTiles}
        />

        {markers.map((m) => (
          <Marker 
            key={m.city} 
            position={m.position} 
            icon={createTruckIcon(m.color || 'var(--color-primary)')}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', color: '#1E293B' }}>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>{m.city} Hub</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Active Vehicles: {m.count}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {polylines.map((p, idx) => (
          <Polyline 
            key={idx} 
            positions={p.positions} 
            color={p.color || '#3B82F6'} 
            weight={3}
            opacity={0.8}
          />
        ))}
      </MapContainer>
    </div>
  );
}
