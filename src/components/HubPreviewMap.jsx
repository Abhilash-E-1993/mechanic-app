import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const hubIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  className: "mechanic-marker",
});

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const HubPreviewMap = ({ hub }) => {
  if (!hub) return null;

  const position = [hub.lat, hub.lng];

  return (
    <div className="hub-map-preview">
      <MapContainer
        key={hub.id}
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        className="h-48 w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url={tileUrl}
        />
        <Marker position={position} icon={hubIcon} />
      </MapContainer>

      <p className="hub-map-caption">
        Your garage will be pinned at {hub.name}, {hub.area}. Customers near
        this point will see you in their nearby list.
      </p>
    </div>
  );
};

export default HubPreviewMap;
