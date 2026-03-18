import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Info, MapPin, Plane, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ──────────────────────────────────────────────
// Zonas predefinidas de Colombia con regulaciones
// ──────────────────────────────────────────────
const AIRSPACE_ZONES = [
  {
    id: 'bog_eldorado',
    name: 'Aeropuerto El Dorado - Bogotá',
    lat: 4.7016, lng: -74.1469,
    radius: 8000,
    type: 'airport',
    color: '#ef4444',
    regulation: 'PROHIBIDO',
    details: 'Zona de exclusión total. Radio de 8 km alrededor del Aeropuerto El Dorado. Prohibido volar RPAS sin autorización especial de la UAEAC y la aerolínea.',
    authority: 'UAEAC',
    maxAlt: 0,
  },
  {
    id: 'med_rionegro',
    name: 'Aeropuerto José María Córdova - Medellín',
    lat: 6.1645, lng: -75.4232,
    radius: 8000,
    type: 'airport',
    color: '#ef4444',
    regulation: 'PROHIBIDO',
    details: 'Zona de exclusión total aeropuerto internacional. Radio de 8 km. Se requiere autorización UAEAC previa para cualquier operación RPAS.',
    authority: 'UAEAC',
    maxAlt: 0,
  },
  {
    id: 'cali_palmaseca',
    name: 'Aeropuerto Alfonso Bonilla - Cali',
    lat: 3.5432, lng: -76.3816,
    radius: 8000,
    type: 'airport',
    color: '#ef4444',
    regulation: 'PROHIBIDO',
    details: 'Zona de exclusión total. Radio de 8 km alrededor del Aeropuerto Internacional Alfonso Bonilla Aragón.',
    authority: 'UAEAC',
    maxAlt: 0,
  },
  {
    id: 'bog_centro',
    name: 'Centro Histórico Bogotá (La Candelaria)',
    lat: 4.5981, lng: -74.0761,
    radius: 2000,
    type: 'restricted',
    color: '#f97316',
    regulation: 'RESTRINGIDO',
    details: 'Zona urbana densa y patrimonial. Requiere autorización especial del Ministerio de Cultura y UAEAC. Altura máxima: 30 m. Obligatorio seguro RC. Solo operaciones diurnas.',
    authority: 'UAEAC / Min. Cultura',
    maxAlt: 30,
  },
  {
    id: 'cartagena_hist',
    name: 'Centro Histórico Cartagena',
    lat: 10.4236, lng: -75.5480,
    radius: 2500,
    type: 'restricted',
    color: '#f97316',
    regulation: 'RESTRINGIDO',
    details: 'Patrimonio de la Humanidad UNESCO. Restricciones especiales de vuelo. Altura máxima: 30 m. Requiere permiso Alcaldía, Min. Cultura y UAEAC.',
    authority: 'UAEAC / UNESCO',
    maxAlt: 30,
  },
  {
    id: 'sierra_nevada',
    name: 'Parque Tairona / Sierra Nevada',
    lat: 11.3232, lng: -73.9175,
    radius: 12000,
    type: 'protected',
    color: '#22c55e',
    regulation: 'ÁREA PROTEGIDA',
    details: 'Parque Nacional Natural. Requiere autorización de Parques Nacionales Naturales de Colombia. Prohibido volar sobre comunidades indígenas. Máx. 120 m AGL.',
    authority: 'Parques Nacionales / UAEAC',
    maxAlt: 120,
  },
  {
    id: 'amazonia',
    name: 'Zona Amazónica - Leticia',
    lat: -4.1491, lng: -69.9432,
    radius: 15000,
    type: 'protected',
    color: '#22c55e',
    regulation: 'ÁREA PROTEGIDA',
    details: 'Reserva de la biosfera. Operaciones restringidas. Requiere coordinación con autoridades ambientales locales (CORPOAMAZONIA) y UAEAC.',
    authority: 'CORPOAMAZONIA / UAEAC',
    maxAlt: 120,
  },
  {
    id: 'bog_free',
    name: 'Zona Rural - Sabana de Bogotá',
    lat: 4.8500, lng: -74.0500,
    radius: 10000,
    type: 'free',
    color: '#3b82f6',
    regulation: 'VUELO LIBRE',
    details: 'Espacio aéreo no controlado, área rural. Permitido vuelo RPAS hasta 120 m AGL sin autorización previa, en condiciones VMC diurnas. Mantener visual con la aeronave (VLOS). Seguro RC obligatorio.',
    authority: 'RAC 100 Colombia',
    maxAlt: 120,
  },
];

const ZONE_ICONS = {
  airport: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  restricted: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle },
  protected: { bg: 'bg-green-100', text: 'text-green-700', icon: Info },
  free: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
};

// ──────────────────────────────────────────────
// Componente click handler
// ──────────────────────────────────────────────
function MapClickHandler({ onMapClick, planningMode }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

// ──────────────────────────────────────────────
// Detectar zona clickeada
// ──────────────────────────────────────────────
function getZonesAtPoint(lat, lng) {
  return AIRSPACE_ZONES.filter(zone => {
    const d = L.latLng(lat, lng).distanceTo(L.latLng(zone.lat, zone.lng));
    return d <= zone.radius;
  });
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
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
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'flights'

  const handleMapClick = async (latlng) => {
    if (planningMode) {
      setFlightWaypoints(prev => [...prev, latlng]);
      return;
    }
    setClickPos(latlng);
    const zones = getZonesAtPoint(latlng.lat, latlng.lng);
    setSelectedZones(zones);
    setAiAnalysis('');
  };

  const handleGetAIAnalysis = async () => {
    if (!clickPos) return;
    setLoadingAI(true);
    try {
      const zonesDesc = selectedZones.length > 0
        ? selectedZones.map(z => `${z.name} (${z.regulation}): ${z.details}`).join('\n')
        : 'Sin zona regulada identificada. Posiblemente espacio aéreo no controlado.';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un experto en aviación civil y regulación de drones en Colombia (RAC 100, UAEAC).
El piloto de dron quiere volar en: Latitud ${clickPos.lat.toFixed(5)}, Longitud ${clickPos.lng.toFixed(5)}.

Regulaciones detectadas en esa zona:
${zonesDesc}

Proporciona un análisis breve y práctico (máx 4 puntos) con:
1. ¿Se puede volar? (Sí/No/Con autorización)
2. Requisitos específicos del RAC 100 para esa zona
3. Documentación necesaria
4. Recomendación de seguridad

Sé conciso y práctico.`,
      });
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis('No se pudo obtener el análisis. Consulta directamente el RAC 100 en la web de la UAEAC.');
    }
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
    for (let i = 1; i < wps.length; i++) {
      total += L.latLng(wps[i - 1]).distanceTo(L.latLng(wps[i]));
    }
    return (total / 1000).toFixed(2);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Plane className="w-6 h-6 text-primary" /> Mapa de Espacio Aéreo</h1>
          <p className="text-sm text-muted-foreground">Regulaciones Colombia (RAC 100) · Haz clic en el mapa para consultar normas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeTab === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('map')}
          >
            <MapPin className="w-4 h-4" /> Mapa
          </Button>
          <Button
            variant={activeTab === 'flights' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('flights')}
          >
            <Plane className="w-4 h-4" /> Mis Vuelos ({savedFlights.length})
          </Button>
        </div>
      </div>

      {activeTab === 'map' && (
        <div className="flex flex-col lg:flex-row gap-4 px-6 pb-6 flex-1">
          {/* Mapa */}
          <div className="flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-border shadow relative">
            {/* Planning toolbar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
              {!planningMode ? (
                <Button size="sm" className="shadow-lg" onClick={() => { setPlanningMode(true); setFlightWaypoints([]); }}>
                  <Plane className="w-4 h-4" /> Planear vuelo
                </Button>
              ) : (
                <div className="flex gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-lg items-center">
                  <span className="text-xs font-medium text-primary">📍 {flightWaypoints.length} puntos</span>
                  <Input
                    className="h-7 text-xs w-28"
                    placeholder="Nombre del vuelo"
                    value={flightName}
                    onChange={e => setFlightName(e.target.value)}
                  />
                  <Button size="sm" variant="default" disabled={flightWaypoints.length < 2} onClick={saveFlightPlan}>
                    <CheckCircle className="w-3 h-3" /> Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setPlanningMode(false); setFlightWaypoints([]); }}>
                    <XCircle className="w-3 h-3" /> Cancelar
                  </Button>
                </div>
              )}
            </div>

            {planningMode && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-primary/90 text-white text-xs px-4 py-2 rounded-full shadow-lg">
                Haz clic en el mapa para agregar puntos de ruta
              </div>
            )}

            <MapContainer
              center={[4.5709, -74.2973]}
              zoom={6}
              style={{ height: '100%', width: '100%', minHeight: '420px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClickHandler onMapClick={handleMapClick} planningMode={planningMode} />

              {/* Zonas reguladas */}
              {AIRSPACE_ZONES.map(zone => (
                <Circle
                  key={zone.id}
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.18,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-sm font-semibold">{zone.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{zone.regulation}</div>
                    <div className="text-xs mt-1">{zone.details}</div>
                  </Popup>
                </Circle>
              ))}

              {/* Click marker */}
              {clickPos && !planningMode && (
                <Marker position={[clickPos.lat, clickPos.lng]}>
                  <Popup>
                    <span className="text-xs">📍 Lat {clickPos.lat.toFixed(4)}, Lng {clickPos.lng.toFixed(4)}</span>
                  </Popup>
                </Marker>
              )}

              {/* Flight waypoints */}
              {flightWaypoints.map((wp, i) => (
                <Marker key={i} position={[wp.lat, wp.lng]}>
                  <Popup><span className="text-xs">Punto {i + 1}</span></Popup>
                </Marker>
              ))}
              {flightWaypoints.length >= 2 && (
                <Polyline
                  positions={flightWaypoints.map(wp => [wp.lat, wp.lng])}
                  pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '8 4' }}
                />
              )}

              {/* Saved flights */}
              {savedFlights.map(flight => (
                flight.waypoints.length >= 2 && (
                  <Polyline
                    key={flight.id}
                    positions={flight.waypoints.map(wp => [wp.lat, wp.lng])}
                    pathOptions={{ color: '#6366f1', weight: 2.5, dashArray: '6 3' }}
                  >
                    <Popup><span className="text-xs font-medium">{flight.name}</span></Popup>
                  </Polyline>
                )
              ))}
            </MapContainer>
          </div>

          {/* Panel lateral */}
          <div className="w-full lg:w-80 flex flex-col gap-3">
            {/* Leyenda */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">Leyenda de Zonas</h3>
              <div className="space-y-2">
                {[
                  { color: 'bg-red-400', label: 'Aeropuertos — PROHIBIDO' },
                  { color: 'bg-orange-400', label: 'Zonas restringidas' },
                  { color: 'bg-green-400', label: 'Áreas protegidas' },
                  { color: 'bg-blue-400', label: 'Vuelo libre (rural)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-full ${item.color} opacity-80`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </Card>

            {/* Resultado del click */}
            {clickPos && !planningMode && (
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Zona seleccionada</h3>
                  <span className="text-xs text-muted-foreground">
                    {clickPos.lat.toFixed(4)}, {clickPos.lng.toFixed(4)}
                  </span>
                </div>

                {selectedZones.length === 0 ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Sin restricción conocida. Aplican normas generales RAC 100.</span>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted rounded-lg p-2 mt-1">
                      🔹 Altura máx: 120 m AGL<br />
                      🔹 Solo vuelo diurno VLOS<br />
                      🔹 Seguro RC obligatorio<br />
                      🔹 No volar sobre personas
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedZones.map(zone => {
                      const style = ZONE_ICONS[zone.type];
                      const Icon = style.icon;
                      return (
                        <div key={zone.id} className={`rounded-lg p-3 ${style.bg}`}>
                          <div className={`flex items-center gap-2 font-semibold text-sm ${style.text} mb-1`}>
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {zone.name}
                          </div>
                          <Badge className={`text-xs mb-2 ${style.bg} ${style.text} border-0`}>{zone.regulation}</Badge>
                          <p className="text-xs text-foreground/80">{zone.details}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            Autoridad: <strong>{zone.authority}</strong>
                            {zone.maxAlt > 0 && <> · Máx: <strong>{zone.maxAlt} m</strong></>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGetAIAnalysis}
                  disabled={loadingAI}
                >
                  {loadingAI ? <Clock className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                  {loadingAI ? 'Analizando con IA...' : 'Análisis IA del RAC 100'}
                </Button>

                {aiAnalysis && (
                  <div className="bg-muted rounded-lg p-3 text-xs whitespace-pre-wrap leading-relaxed">
                    {aiAnalysis}
                  </div>
                )}
              </Card>
            )}

            {!clickPos && !planningMode && (
              <Card className="p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
                <MapPin className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Haz clic en cualquier punto del mapa para ver las regulaciones de vuelo de esa zona.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tab vuelos guardados */}
      {activeTab === 'flights' && (
        <div className="px-6 pb-6 flex-1">
          {savedFlights.length === 0 ? (
            <Card className="p-8 flex flex-col items-center gap-3 text-center">
              <Plane className="w-12 h-12 text-muted-foreground/30" />
              <h3 className="font-semibold">No hay vuelos planificados</h3>
              <p className="text-sm text-muted-foreground">Ve al mapa y usa "Planear vuelo" para trazar una ruta.</p>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteFlightPlan(flight.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {flight.waypoints.length} puntos de ruta
                    </div>
                    <div className="flex items-center gap-1">
                      <Plane className="w-3 h-3" /> Distancia: ~{flight.distance} km
                    </div>
                  </div>
                  <div className="text-xs space-y-1 mt-1">
                    {flight.waypoints.map((wp, i) => (
                      <div key={i} className="bg-muted rounded px-2 py-0.5 flex justify-between">
                        <span>Punto {i + 1}</span>
                        <span className="text-muted-foreground">{wp.lat?.toFixed(4)}, {wp.lng?.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => { setActiveTab('map'); }}
                  >
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