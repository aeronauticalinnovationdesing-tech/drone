import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Info, MapPin, Plane, Trash2, CheckCircle, XCircle, Clock, ExternalLink, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ────────────────────────────────────────────────────────────────────
// ZONAS REALES RAC 100 / AIP Colombia - extraídas del Visor UAEAC
// Códigos ICAO reales visibles en https://aerocivil.maps.arcgis.com
// ────────────────────────────────────────────────────────────────────
const AIRSPACE_ZONES = [
  // ── AEROPUERTOS INTERNACIONALES ──
  {
    id: 'SKBO', name: 'SKBO – Aeropuerto El Dorado (Bogotá)',
    lat: 4.7016, lng: -74.1469, radius: 9000,
    type: 'airport', color: '#dc2626',
    regulation: 'ZNVD – PROHIBIDO',
    details: 'Zona de No Vuelo Dron (ZNVD). Radio de protección 9 km. Completamente prohibido operar RPAS sin autorización expresa de la UAEAC. Espacio aéreo controlado CTR Bogotá.',
    authority: 'UAEAC / ATC Bogotá', maxAlt: 0, code: 'SKBO',
  },
  {
    id: 'SKBO_6', name: 'SKBO – Área 6 km El Dorado',
    lat: 4.7016, lng: -74.1469, radius: 6000,
    type: 'airport_inner', color: '#991b1b',
    regulation: 'ZNVD – NÚCLEO CRÍTICO',
    details: 'Núcleo interior 6 km. Prohibición absoluta sin excepciones. Cualquier operación RPAS es ilegal sin permiso UAEAC previo.',
    authority: 'UAEAC', maxAlt: 0, code: 'SKBO',
  },
  {
    id: 'SKGY', name: 'SKGY – Aeropuerto Guaymaral (Bogotá)',
    lat: 4.8147, lng: -74.0641, radius: 3000,
    type: 'airport', color: '#dc2626',
    regulation: 'ZNVD – PROHIBIDO',
    details: 'Aeropuerto de aviación general Guaymaral. ZNVD radio 3 km. Prohibido operar RPAS sin coordinación con la torre de control y autorización UAEAC.',
    authority: 'UAEAC / Torre Guaymaral', maxAlt: 0, code: 'SKGY',
  },
  {
    id: 'SKMD', name: 'SKMD – Aeropuerto Olaya Herrera (Medellín)',
    lat: 6.2199, lng: -75.5906, radius: 6000,
    type: 'airport', color: '#dc2626',
    regulation: 'ZNVD – PROHIBIDO',
    details: 'ZNVD Aeropuerto Olaya Herrera. Radio 6 km. Zona urbana densa. Prohibición total de RPAS sin autorización UAEAC.',
    authority: 'UAEAC / ATC Medellín', maxAlt: 0, code: 'SKMD',
  },
  {
    id: 'SKCL', name: 'SKCL – Aeropuerto Alfonso Bonilla (Cali)',
    lat: 3.5432, lng: -76.3816, radius: 9000,
    type: 'airport', color: '#dc2626',
    regulation: 'ZNVD – PROHIBIDO',
    details: 'ZNVD Aeropuerto Internacional Alfonso Bonilla Aragón. Radio 9 km. Espacio aéreo controlado TMA/CTR Cali.',
    authority: 'UAEAC / ATC Cali', maxAlt: 0, code: 'SKCL',
  },
  {
    id: 'SKRG', name: 'SKRG – Aeropuerto José María Córdova (Rionegro)',
    lat: 6.1645, lng: -75.4232, radius: 9000,
    type: 'airport', color: '#dc2626',
    regulation: 'ZNVD – PROHIBIDO',
    details: 'ZNVD Aeropuerto Internacional José María Córdova. Radio 9 km. Espacio aéreo controlado TMA/CTR Rionegro.',
    authority: 'UAEAC / ATC Rionegro', maxAlt: 0, code: 'SKRG',
  },
  {
    id: 'SKBQ', name: 'SKBQ – Aeropuerto Ernesto Cortissoz (Barranquilla)',
    lat: 10.8896, lng: -74.7808, radius: 9000,
    type: 'airport', color: '#dc2626',
    regulation: 'ZNVD – PROHIBIDO',
    details: 'ZNVD Aeropuerto Internacional Ernesto Cortissoz. Radio 9 km.',
    authority: 'UAEAC / ATC Barranquilla', maxAlt: 0, code: 'SKBQ',
  },
  {
    id: 'SKCG', name: 'SKCG – Aeropuerto Rafael Núñez (Cartagena)',
    lat: 10.4424, lng: -75.5130, radius: 9000,
    type: 'airport', color: '#dc2626',
    regulation: 'ZNVD – PROHIBIDO',
    details: 'ZNVD Aeropuerto Internacional Rafael Núñez. Radio 9 km. Zona patrimonial y costera.',
    authority: 'UAEAC / ATC Cartagena', maxAlt: 0, code: 'SKCG',
  },

  // ── HELIPUERTOS BOGOTÁ (visibles en imagen como círculos negros pequeños) ──
  {
    id: 'HELI_CLIN', name: 'Helipuerto Clínica Norte – Bogotá',
    lat: 4.7360, lng: -74.0520, radius: 3000,
    type: 'heliport', color: '#7c3aed',
    regulation: 'ZNVD HELIPUERTO – 3 km',
    details: 'Área de protección helipuerto Bogotá. Radio 3 km. Prohibido RPAS sin coordinación operador helipuerto y UAEAC.',
    authority: 'UAEAC / Operador Helipuerto', maxAlt: 0, code: 'Helipuerto Bogotá',
  },
  {
    id: 'HELI_POL', name: 'Helipuertos Zona Policial – Bogotá Sur',
    lat: 4.6097, lng: -74.1042, radius: 3000,
    type: 'heliport', color: '#7c3aed',
    regulation: 'ZNVD HELIPUERTO – 3 km',
    details: 'Zona de helipuertos institucionales y policiales sur de Bogotá. Radio 3 km. Restricción permanente.',
    authority: 'UAEAC / Policía Nacional', maxAlt: 0, code: 'Helipuerto Sur Bogotá',
  },

  // ── ÁREAS AIP (zonas SKE, SKD visibles en imagen – azules/verdes) ──
  {
    id: 'SKE25', name: 'SKE25 – Área AIP Nemocón / Suesca',
    lat: 5.0530, lng: -73.8990, radius: 18000,
    type: 'aip', color: '#2563eb',
    regulation: 'ÁREA AIP RESTRINGIDA',
    details: 'Área de espacio aéreo especial SKE25. Zona de entrenamiento militar y maniobras. Requiere coordinación con UAEAC y Fuerza Aérea Colombiana antes de operar RPAS. Verificar NOTAM activos.',
    authority: 'FAC / UAEAC', maxAlt: 60, code: 'SKE25',
  },
  {
    id: 'SKE24', name: 'SKE24 – Área AIP Gachancipá / Tocancipá',
    lat: 4.9790, lng: -73.9540, radius: 14000,
    type: 'aip', color: '#2563eb',
    regulation: 'ÁREA AIP RESTRINGIDA',
    details: 'Área especial SKE24 AIP. Zona con actividades de aviación especial. Prohibido RPAS sin autorización coordinada con la Fuerza Aérea Colombiana y UAEAC.',
    authority: 'FAC / UAEAC', maxAlt: 60, code: 'SKE24',
  },
  {
    id: 'SKE46', name: 'SKE46 – Área AIP Zipaquirá',
    lat: 5.0220, lng: -74.0130, radius: 10000,
    type: 'aip', color: '#2563eb',
    regulation: 'ÁREA AIP RESTRINGIDA',
    details: 'Área especial SKE46 AIP Zipaquirá. Actividades militares y entrenamiento. Consultar NOTAM y coordinar con FAC antes de cualquier operación RPAS.',
    authority: 'FAC / UAEAC', maxAlt: 60, code: 'SKE46',
  },
  {
    id: 'SKE23', name: 'SKE23 – Área AIP Guasca / La Calera',
    lat: 4.8630, lng: -73.8790, radius: 16000,
    type: 'aip', color: '#1d4ed8',
    regulation: 'ÁREA AIP RESTRINGIDA',
    details: 'Área especial SKE23. Zona de vuelos militares y entrenamiento aeronáutico. Restricción permanente para RPAS. Requiere coordinación FAC.',
    authority: 'FAC / UAEAC', maxAlt: 60, code: 'SKE23',
  },
  {
    id: 'SKE16', name: 'SKE16 – Área AIP Ubaque / Choachí',
    lat: 4.7070, lng: -73.9230, radius: 20000,
    type: 'aip', color: '#059669',
    regulation: 'ÁREA AIP – COORDINAR',
    details: 'Área especial SKE16 (zona verde en visor UAEAC). Espacio aéreo con actividades especiales. Coordinar con UAEAC antes de operar RPAS en esta zona.',
    authority: 'FAC / UAEAC', maxAlt: 120, code: 'SKE16',
  },
  {
    id: 'SKE15', name: 'SKE15 – Área AIP Sur Bogotá / Soacha',
    lat: 4.5830, lng: -74.1550, radius: 15000,
    type: 'aip', color: '#059669',
    regulation: 'ÁREA AIP – COORDINAR',
    details: 'Área especial SKE15. Incluye zonas periurbanas sur de Bogotá. Requiere coordinación con UAEAC para vuelos RPAS.',
    authority: 'FAC / UAEAC', maxAlt: 120, code: 'SKE15',
  },
  {
    id: 'SKD35', name: 'SKD35 – Zona Peligrosa Gachancipá',
    lat: 4.9910, lng: -73.9780, radius: 5000,
    type: 'danger', color: '#d97706',
    regulation: 'ZONA PELIGROSA',
    details: 'Zona peligrosa SKD35 (amarilla en visor). Actividades peligrosas para la aviación. RPAS deben evitar esta zona o solicitar autorización expresa a la UAEAC.',
    authority: 'UAEAC / FAC', maxAlt: 0, code: 'SKD35',
  },
  {
    id: 'SKP35', name: 'SKP35 – Zona Prohibida Cajicá',
    lat: 4.9190, lng: -74.0260, radius: 4000,
    type: 'prohibited', color: '#be123c',
    regulation: 'ZONA PROHIBIDA',
    details: 'Zona prohibida SKP35 sobre Cajicá. Vuelo RPAS completamente prohibido en todo momento sin ninguna excepción posible.',
    authority: 'FAC / UAEAC', maxAlt: 0, code: 'SKP35',
  },
  {
    id: 'SKR40', name: 'SKR40 – Zona Restringida Sur Bogotá',
    lat: 4.5680, lng: -74.1230, radius: 6000,
    type: 'restricted', color: '#ea580c',
    regulation: 'ZONA RESTRINGIDA',
    details: 'Zona restringida SKR40. Operaciones de seguridad y defensa. Requiere autorización especial UAEAC y coordinación con entidades de seguridad del Estado.',
    authority: 'FAC / UAEAC / Seguridad Estado', maxAlt: 30, code: 'SKR40',
  },
  {
    id: 'SKR47', name: 'SKR47 – Zona Restringida Rafael Uribe',
    lat: 4.5400, lng: -74.1050, radius: 4000,
    type: 'restricted', color: '#ea580c',
    regulation: 'ZONA RESTRINGIDA',
    details: 'Zona restringida SKR47 sobre Rafael Uribe Uribe. Coordinar con UAEAC y entidades gubernamentales para cualquier operación RPAS.',
    authority: 'FAC / UAEAC', maxAlt: 30, code: 'SKR47',
  },

  // ── INFRAESTRUCTURA CRÍTICA ──
  {
    id: 'CASA_NARINO', name: 'Casa de Nariño – Zona de Seguridad',
    lat: 4.5969, lng: -74.0752, radius: 2500,
    type: 'prohibited', color: '#be123c',
    regulation: 'ZONA PROHIBIDA – SEGURIDAD ESTADO',
    details: 'Zona de seguridad presidencial. Prohibición absoluta de RPAS en todo momento. Cualquier violación constituye delito grave.',
    authority: 'Presidencia / FAC / UAEAC', maxAlt: 0, code: 'Zona Pres.',
  },
];

const ZONE_ICONS = {
  airport: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  airport_inner: { bg: 'bg-red-200', text: 'text-red-900', icon: XCircle },
  heliport: { bg: 'bg-purple-100', text: 'text-purple-800', icon: AlertTriangle },
  aip: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Info },
  danger: { bg: 'bg-amber-100', text: 'text-amber-800', icon: AlertTriangle },
  prohibited: { bg: 'bg-rose-100', text: 'text-rose-900', icon: XCircle },
  restricted: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle },
  protected: { bg: 'bg-green-100', text: 'text-green-700', icon: Info },
  free: { bg: 'bg-sky-100', text: 'text-sky-700', icon: CheckCircle },
};

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

function getZonesAtPoint(lat, lng) {
  return AIRSPACE_ZONES.filter(zone => {
    const d = L.latLng(lat, lng).distanceTo(L.latLng(zone.lat, zone.lng));
    return d <= zone.radius;
  });
}

export default function AirspaceMap() {
  const [selectedZones, setSelectedZones] = useState([]);
  const [clickPos, setClickPos] = useState(null);
  const [planningMode, setPlanningMode] = useState(false);
  const [flightWaypoints, setFlightWaypoints] = useState([]);
  const [flightName, setFlightName] = useState('');
  const [savedFlights, setSavedFlights] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vexny_flights') || '[]'); } catch { return []; }
  });
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'official' | 'flights'

  const handleMapClick = (latlng) => {
    if (planningMode) { setFlightWaypoints(prev => [...prev, latlng]); return; }
    setClickPos(latlng);
    setSelectedZones(getZonesAtPoint(latlng.lat, latlng.lng));
    setAiAnalysis('');
  };

  const handleGetAIAnalysis = async () => {
    if (!clickPos) return;
    setLoadingAI(true);
    const zonesDesc = selectedZones.length > 0
      ? selectedZones.map(z => `[${z.code}] ${z.name} — ${z.regulation}: ${z.details}`).join('\n')
      : 'Sin zona específica identificada. Aplican normas generales RAC 100.';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un experto en aviación civil y regulación RPAS/UAS en Colombia (RAC 100, AIP Colombia, UAEAC).
El piloto de dron quiere operar en: Lat ${clickPos.lat.toFixed(5)}, Lng ${clickPos.lng.toFixed(5)}.

Zonas AIP/ZNVD detectadas:
${zonesDesc}

Genera un análisis operacional concreto con estos 4 puntos (texto plano, sin markdown):
1. VEREDICTO: ¿Puede volar? (Sí / No / Solo con autorización)
2. REQUISITOS RAC 100: qué artículos aplican y qué se necesita
3. DOCUMENTACIÓN: lista los documentos/permisos necesarios
4. RECOMENDACIÓN DE SEGURIDAD: consejos prácticos para esta zona

Sé directo y práctico. Máximo 200 palabras.`,
    });
    setAiAnalysis(result);
    setLoadingAI(false);
  };

  const saveFlightPlan = () => {
    if (flightWaypoints.length < 2) return;
    const plan = {
      id: Date.now(),
      name: flightName || `Vuelo ${savedFlights.length + 1}`,
      waypoints: flightWaypoints,
      date: new Date().toLocaleDateString('es-CO'),
      distance: calcDistance(flightWaypoints),
    };
    const updated = [...savedFlights, plan];
    setSavedFlights(updated);
    localStorage.setItem('vexny_flights', JSON.stringify(updated));
    setFlightWaypoints([]);
    setFlightName('');
    setPlanningMode(false);
  };

  const deleteFlightPlan = (id) => {
    const updated = savedFlights.filter(f => f.id !== id);
    setSavedFlights(updated);
    localStorage.setItem('vexny_flights', JSON.stringify(updated));
  };

  const calcDistance = (wps) => {
    let total = 0;
    for (let i = 1; i < wps.length; i++) total += L.latLng(wps[i - 1]).distanceTo(L.latLng(wps[i]));
    return (total / 1000).toFixed(2);
  };

  const tabs = [
    { id: 'map', label: 'Mapa RAC 100', icon: MapPin },
    { id: 'official', label: 'Visor Oficial UAEAC', icon: Layers },
    { id: 'flights', label: `Mis Vuelos (${savedFlights.length})`, icon: Plane },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" /> Mapa de Espacio Aéreo UAS
          </h1>
          <p className="text-sm text-muted-foreground">Colombia · RAC 100 · Zonas AIP/ZNVD oficiales UAEAC</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <Button
              key={t.id}
              variant={activeTab === t.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(t.id)}
              className="gap-1.5"
            >
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open('https://aerocivil.maps.arcgis.com/apps/instant/media/index.html?appid=b4be4d501c8d4bcabd0c35297521c16e', '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir en UAEAC
          </Button>
        </div>
      </div>

      {/* ── TAB: MAPA PROPIO ── */}
      {activeTab === 'map' && (
        <div className="flex flex-col lg:flex-row gap-4 px-6 pb-6 flex-1">
          <div className="flex-1 min-h-[500px] rounded-2xl overflow-hidden border border-border shadow relative">
            {/* Toolbar planificación */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
              {!planningMode ? (
                <Button size="sm" className="shadow-lg" onClick={() => { setPlanningMode(true); setFlightWaypoints([]); }}>
                  <Plane className="w-4 h-4" /> Planear vuelo
                </Button>
              ) : (
                <div className="flex gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-lg items-center flex-wrap justify-center">
                  <span className="text-xs font-medium text-primary">📍 {flightWaypoints.length} pts</span>
                  <Input className="h-7 text-xs w-28" placeholder="Nombre vuelo" value={flightName} onChange={e => setFlightName(e.target.value)} />
                  <Button size="sm" disabled={flightWaypoints.length < 2} onClick={saveFlightPlan}>
                    <CheckCircle className="w-3 h-3" /> Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setPlanningMode(false); setFlightWaypoints([]); }}>
                    <XCircle className="w-3 h-3" /> Cancelar
                  </Button>
                </div>
              )}
            </div>
            {planningMode && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-primary/90 text-white text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none">
                Haz clic para agregar puntos de ruta
              </div>
            )}

            <MapContainer center={[4.7377, -74.3578]} zoom={9} style={{ height: '100%', width: '100%', minHeight: '500px' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Zonas AIP/ZNVD */}
              {AIRSPACE_ZONES.map(zone => (
                <Circle key={zone.id} center={[zone.lat, zone.lng]} radius={zone.radius}
                  pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.20, weight: zone.type === 'airport_inner' ? 3 : 1.5 }}>
                  <Popup>
                    <div className="text-sm font-bold">[{zone.code}] {zone.name}</div>
                    <div className="text-xs font-semibold mt-1" style={{ color: zone.color }}>{zone.regulation}</div>
                    <div className="text-xs mt-1 max-w-[240px]">{zone.details}</div>
                    <div className="text-xs text-gray-500 mt-1">Autoridad: {zone.authority}</div>
                  </Popup>
                </Circle>
              ))}

              {/* Marker del click */}
              {clickPos && !planningMode && (
                <Marker position={[clickPos.lat, clickPos.lng]}>
                  <Popup><span className="text-xs">📍 {clickPos.lat.toFixed(5)}, {clickPos.lng.toFixed(5)}</span></Popup>
                </Marker>
              )}

              {/* Waypoints en planificación */}
              {flightWaypoints.map((wp, i) => (
                <Marker key={i} position={[wp.lat, wp.lng]}>
                  <Popup><span className="text-xs font-medium">Punto {i + 1}</span></Popup>
                </Marker>
              ))}
              {flightWaypoints.length >= 2 && (
                <Polyline positions={flightWaypoints.map(wp => [wp.lat, wp.lng])}
                  pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '8 4' }} />
              )}

              {/* Vuelos guardados */}
              {savedFlights.map(flight => flight.waypoints.length >= 2 && (
                <Polyline key={flight.id} positions={flight.waypoints.map(wp => [wp.lat, wp.lng])}
                  pathOptions={{ color: '#6366f1', weight: 2.5, dashArray: '6 3' }}>
                  <Popup><span className="text-xs font-medium">✈ {flight.name}</span></Popup>
                </Polyline>
              ))}
            </MapContainer>
          </div>

          {/* Panel lateral */}
          <div className="w-full lg:w-80 flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
            {/* Leyenda */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Leyenda Oficial RAC 100</h3>
              <div className="space-y-1.5">
                {[
                  { color: 'bg-red-600', label: 'ZNVD – Aeropuertos (PROHIBIDO)' },
                  { color: 'bg-rose-700', label: 'Zona Prohibida (SKP)' },
                  { color: 'bg-orange-500', label: 'Zona Restringida (SKR)' },
                  { color: 'bg-amber-500', label: 'Zona Peligrosa (SKD)' },
                  { color: 'bg-blue-600', label: 'Área AIP (SKE) – FAC' },
                  { color: 'bg-purple-600', label: 'ZNVD Helipuertos – 3 km' },
                  { color: 'bg-emerald-600', label: 'Área AIP coordinar' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-sm ${item.color} opacity-80 flex-shrink-0`} />
                    {item.label}
                  </div>
                ))}
              </div>
              <a
                href="https://aerocivil.maps.arcgis.com/apps/instant/media/index.html?appid=b4be4d501c8d4bcabd0c35297521c16e"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Ver Visor Oficial UAEAC completo
              </a>
            </Card>

            {/* Resultado click */}
            {clickPos && !planningMode && (
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Punto consultado</h3>
                  <span className="text-xs text-muted-foreground font-mono">{clickPos.lat.toFixed(4)}, {clickPos.lng.toFixed(4)}</span>
                </div>

                {selectedZones.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">Sin restricción específica detectada</span>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1">
                      <p className="font-semibold text-foreground mb-1">Aplican normas generales RAC 100:</p>
                      <p>🔹 Altura máxima: 120 m AGL</p>
                      <p>🔹 Solo vuelo diurno VLOS</p>
                      <p>🔹 Seguro RC obligatorio (mín. $500M COP)</p>
                      <p>🔹 No volar sobre personas ni aglomeraciones</p>
                      <p>🔹 Distancia mínima 9 km de aeropuertos</p>
                      <p>🔹 Verificar NOTAM activos en UAEAC</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedZones.map(zone => {
                      const style = ZONE_ICONS[zone.type] || ZONE_ICONS.restricted;
                      const Icon = style.icon;
                      return (
                        <div key={zone.id} className={`rounded-lg p-3 border ${style.bg}`}>
                          <div className={`flex items-center gap-2 font-bold text-xs ${style.text} mb-1`}>
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-mono">[{zone.code}]</span> {zone.name}
                          </div>
                          <Badge className={`text-xs mb-2 ${style.bg} ${style.text} border border-current/30`}>{zone.regulation}</Badge>
                          <p className="text-xs text-foreground/80 leading-relaxed">{zone.details}</p>
                          <p className="text-xs text-muted-foreground mt-1.5">⚖️ {zone.authority}{zone.maxAlt > 0 ? ` · Máx ${zone.maxAlt} m AGL` : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleGetAIAnalysis} disabled={loadingAI}>
                  {loadingAI ? <Clock className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                  {loadingAI ? 'Analizando RAC 100 con IA...' : 'Consultar IA – Análisis RAC 100'}
                </Button>

                {aiAnalysis && (
                  <div className="bg-muted rounded-lg p-3 text-xs whitespace-pre-wrap leading-relaxed border border-primary/20">
                    <p className="font-semibold text-primary mb-2">🤖 Análisis VEXNY IA:</p>
                    {aiAnalysis}
                  </div>
                )}
              </Card>
            )}

            {!clickPos && !planningMode && (
              <Card className="p-5 flex flex-col items-center justify-center gap-2 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Haz clic en el mapa para consultar la regulación RAC 100 de esa zona.</p>
                <p className="text-xs text-muted-foreground">Las zonas coloreadas son oficiales según el AIP Colombia y el Visor UAEAC.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: VISOR OFICIAL UAEAC (iframe) ── */}
      {activeTab === 'official' && (
        <div className="px-6 pb-6 flex-1 flex flex-col gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Visor oficial de la UAEAC (Aerocivil).</strong> Muestra las Zonas de No Vuelo Dron (ZNVD), áreas AIP, aeropuertos, helipuertos y toda la infraestructura aeronáutica oficial de Colombia en tiempo real. Usa este visor para verificar zonas antes de cada vuelo.
            </p>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg" style={{ minHeight: '70vh' }}>
            <iframe
              src="https://aerocivil.maps.arcgis.com/apps/instant/media/index.html?appid=b4be4d501c8d4bcabd0c35297521c16e&center=-74.3578;4.7377&level=10"
              title="Visor Geográfico UAS – UAEAC Aerocivil Colombia"
              className="w-full h-full"
              style={{ minHeight: '70vh', border: 'none' }}
              allowFullScreen
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Fuente oficial: <a href="https://www.aerocivil.gov.co" target="_blank" rel="noreferrer" className="text-primary hover:underline">UAEAC – Aeronáutica Civil de Colombia</a>
          </p>
        </div>
      )}

      {/* ── TAB: MIS VUELOS ── */}
      {activeTab === 'flights' && (
        <div className="px-6 pb-6 flex-1">
          {savedFlights.length === 0 ? (
            <Card className="p-8 flex flex-col items-center gap-3 text-center">
              <Plane className="w-12 h-12 text-muted-foreground/30" />
              <h3 className="font-semibold">No hay vuelos planificados</h3>
              <p className="text-sm text-muted-foreground">Ve al "Mapa RAC 100" y usa "Planear vuelo" para trazar tu ruta.</p>
              <Button size="sm" onClick={() => setActiveTab('map')}>Ir al mapa</Button>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedFlights.map(flight => (
                <Card key={flight.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{flight.name}</h3>
                      <p className="text-xs text-muted-foreground">{flight.date}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteFlightPlan(flight.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {flight.waypoints.length} puntos de ruta</div>
                    <div className="flex items-center gap-1"><Plane className="w-3 h-3" /> Distancia: ~{flight.distance} km</div>
                  </div>
                  <div className="text-xs space-y-0.5 mt-1">
                    {flight.waypoints.map((wp, i) => (
                      <div key={i} className="bg-muted rounded px-2 py-0.5 flex justify-between font-mono">
                        <span className="text-muted-foreground">P{i + 1}</span>
                        <span>{wp.lat?.toFixed(4)}, {wp.lng?.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-1" onClick={() => setActiveTab('map')}>
                    Ver en mapa
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}