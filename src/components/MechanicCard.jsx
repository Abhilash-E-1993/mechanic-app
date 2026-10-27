const MechanicCard = ({
  mechanic,
  onRequest,
  requestDisabled = false,
  requestLabel = "Request Help",
}) => {
  return (
    <div className="card flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold">
          {mechanic.name}
        </h3>

        <p className="text-muted text-sm mt-1">
          {mechanic.garageName}
        </p>

        <p className="text-muted text-sm mt-3">
          {mechanic.serviceArea}, {mechanic.city}
          {mechanic.distanceKm != null
            ? ` · ${mechanic.distanceKm.toFixed(1)} km away`
            : ""}
        </p>

        <p className="text-muted text-sm mt-1">
          {mechanic.experienceYears} yrs experience
          {mechanic.estimatedEtaMinutes != null
            ? ` · ~${mechanic.estimatedEtaMinutes} min away`
            : ""}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {mechanic.services?.map((service) => (
            <span
              key={service}
              className="badge"
            >
              {service}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <span
            className={
              mechanic.availabilityStatus === "busy"
                ? "badge badge-warning"
                : "badge badge-success"
            }
          >
            {mechanic.availabilityStatus || "available"}
          </span>

          {mechanic.rank === 1 && (
            <span className="badge badge-warning ml-2">
              Closest Match
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRequest(mechanic)}
        disabled={requestDisabled}
        className={`btn-primary w-full mt-6 ${
          requestDisabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {requestLabel}
      </button>
    </div>
  );
};

export default MechanicCard;
