const MechanicCard = ({ mechanic, onRequest }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-800">{mechanic.name}</h3>
    <p className="text-sm text-slate-500">Garage: {mechanic.garageName}</p>
    <p className="text-sm text-slate-500">Experience: {mechanic.experienceYears} years</p>
    <p className="mt-2 text-sm text-slate-700">Services: {mechanic.services?.join(', ')}</p>
    <p className="mt-1 text-sm font-medium text-green-600">Status: {mechanic.availabilityStatus}</p>

    <button
      type="button"
      onClick={() => onRequest(mechanic)}
      className="mt-4 w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Request Help
    </button>
  </div>
);

export default MechanicCard;
