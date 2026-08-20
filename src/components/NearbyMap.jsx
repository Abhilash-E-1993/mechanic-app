import L from "leaflet";
import { useEffect, useRef } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

const customerIcon = L.divIcon({
  className: "location-pin-shell",
  html: '<span class="location-pin customer-pin"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/* ---------- MAP AUTO FIT ---------- */

const FitBounds = ({ points }) => {
  const map = useMap();
  const lastKeyRef = useRef("");

  useEffect(() => {
    const validPoints = points.filter(Boolean);
    if (!validPoints.length) return;

    const key = JSON.stringify(validPoints);
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    if (validPoints.length === 1) {
      map.setView(validPoints[0], 13);
      return;
    }

    map.fitBounds(L.latLngBounds(validPoints), {
      padding: [50, 50],
      maxZoom: 14,
    });
  }, [points, map]);

  return null;
};

/* ---------- COMPONENT ---------- */

const NearbyMap = ({ customerLocation, mechanics = [] }) => {
  if (!customerLocation?.lat || !customerLocation?.lng) {
    return null;
  }

  const customerPosition = [
    Number(customerLocation.lat),
    Number(customerLocation.lng),
  ];

  const mechanicPoints = mechanics
    .map((mechanic) => {
      const lat = mechanic.mechanicBaseLocation?.lat ?? mechanic.latitude;
      const lng = mechanic.mechanicBaseLocation?.lng ?? mechanic.longitude;

      if (lat == null || lng == null) return null;

      return {
        mechanic,
        position: [Number(lat), Number(lng)],
      };
    })
    .filter(Boolean);

  return (
    <div className="card overflow-hidden !p-0">
      <MapContainer
        center={customerPosition}
        zoom={13}
        scrollWheelZoom={false}
        className="h-80 w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url={tileUrl}
        />

        {/* CUSTOMER POSITION */}
        <Marker position={customerPosition} icon={customerIcon}>
          <Popup>You are here</Popup>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            You
          </Tooltip>
        </Marker>

        {customerLocation.accuracy && (
          <Circle
            center={customerPosition}
            radius={customerLocation.accuracy}
            pathOptions={{ color: "#F59E0B", fillOpacity: 0.12 }}
          />
        )}

        {/* NEARBY MECHANICS */}
        {mechanicPoints.map(({ mechanic, position }) => (
          <CircleMarker
            key={mechanic.id}
            center={position}
            radius={9}
            pathOptions={{
              color: "#f59e0b",
              fillColor: "#F2A33A",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-medium">
                  {mechanic.garageName || mechanic.name}
                </p>
                <p>{mechanic.hubName || mechanic.serviceArea}</p>
                {mechanic.distanceKm != null && (
                  <p>
                    {mechanic.distanceKm.toFixed(1)} km
                    {mechanic.estimatedEtaMinutes != null
                      ? ` | ~${mechanic.estimatedEtaMinutes} min away`
                      : ""}
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <FitBounds
          points={[
            customerPosition,
            ...mechanicPoints.map((point) => point.position),
          ]}
        />
      </MapContainer>
    </div>
  );
};

export default NearbyMap;
