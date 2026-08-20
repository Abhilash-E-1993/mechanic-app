import L from "leaflet";
import { useEffect, useRef } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import {
  calculateDistanceKm,
  estimateEtaMinutesFromLocation,
} from "../utils/etaService";

const mechanicIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "mechanic-marker",
});

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
      map.setView(validPoints[0], 14);
      return;
    }

    map.fitBounds(L.latLngBounds(validPoints), {
      padding: [50, 50],
      maxZoom: 15,
    });
  }, [points, map]);

  return null;
};

/* ---------- COMPONENT ---------- */

const LocationMap = ({
  customerLocation,
  mechanicLocation,
  requestStatus,
  completionOTP,
  heading = "Route Overview",
}) => {
  const customerPosition = [
    Number(customerLocation.lat),
    Number(customerLocation.lng),
  ];

  const mechanicPosition =
    mechanicLocation?.lat && mechanicLocation?.lng
      ? [Number(mechanicLocation.lat), Number(mechanicLocation.lng)]
      : null;

  if (
    Number.isNaN(customerPosition[0]) ||
    Number.isNaN(customerPosition[1])
  ) {
    return null;
  }

  const distanceKm = mechanicPosition
    ? calculateDistanceKm(customerLocation, mechanicLocation)
    : null;

  const etaMinutes = mechanicPosition
    ? estimateEtaMinutesFromLocation(customerLocation, mechanicLocation)
    : null;

  const mechanicBaseLabel =
    mechanicLocation?.addressLine1 && mechanicLocation?.addressLine2
      ? `${mechanicLocation.addressLine1}, ${mechanicLocation.addressLine2}`
      : mechanicLocation?.addressLine1 ||
        mechanicLocation?.addressLine2 ||
        "Mechanic garage";

  const statusLabel =
    requestStatus === "Completed"
      ? "Completed"
      : completionOTP
        ? "At your location"
        : requestStatus === "Accepted"
          ? "On the way"
          : "Assigned";

  return (
    <div className="card overflow-hidden">
      <div className="tracking-map-header">
        <div>
          <p className="tracking-map-title">{heading}</p>
          <p className="tracking-map-subtitle">
            Fixed garage location with real route distance and ETA.
          </p>
        </div>

        <div className="tracking-header-badges">
          <span className="badge badge-warning">{statusLabel}</span>
          {etaMinutes != null && (
            <span className="tracking-chip">ETA ~{etaMinutes} min</span>
          )}
        </div>
      </div>

      <MapContainer
        center={customerPosition}
        zoom={14}
        scrollWheelZoom={false}
        className="h-72 w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url={tileUrl}
        />

        {/* CUSTOMER MARKER */}
        <Marker position={customerPosition} icon={customerIcon}>
          <Popup>Customer location</Popup>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            Customer
          </Tooltip>
        </Marker>

        {customerLocation.accuracy && (
          <Circle
            center={customerPosition}
            radius={customerLocation.accuracy}
            pathOptions={{ color: "#F59E0B", fillOpacity: 0.15 }}
          />
        )}

        {/* ROUTE LINE */}
        {mechanicPosition && (
          <Polyline
            positions={[mechanicPosition, customerPosition]}
            pathOptions={{
              color: "#f59e0b",
              weight: 4,
              opacity: 0.85,
              dashArray: "8 8",
            }}
          />
        )}

        {/* MECHANIC MARKER */}
        {mechanicPosition && (
          <Marker position={mechanicPosition} icon={mechanicIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-medium">Mechanic garage</p>
                <p>{mechanicBaseLabel}</p>
                {etaMinutes != null && <p>ETA ~{etaMinutes} min</p>}
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              Mechanic
            </Tooltip>
          </Marker>
        )}

        <FitBounds points={[customerPosition, mechanicPosition]} />
      </MapContainer>

      {/* INFO PANEL */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Mechanic base</span>
          <span>{mechanicPosition ? mechanicBaseLabel : "—"}</span>
        </div>

        {distanceKm != null && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted">Distance</span>
            <span>{distanceKm.toFixed(2)} km</span>
          </div>
        )}

        {etaMinutes != null && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted">Estimated arrival</span>
            <span>~{etaMinutes} min</span>
          </div>
        )}

        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted">Customer GPS accuracy</span>
          <span>
            {customerLocation.accuracy
              ? `${Math.round(customerLocation.accuracy)} m`
              : "unknown"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;

