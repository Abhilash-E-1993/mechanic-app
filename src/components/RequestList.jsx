const statusStyles = {
  Pending: 'bg-amber-100 text-amber-700',
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Completed: 'bg-blue-100 text-blue-700',
};

const RequestList = ({ requests, forMechanic = false, onAction }) => {
  if (!requests.length) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">No requests found.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">Service: {request.serviceType}</p>
              <p className="text-sm text-slate-600">Area: {request.area}</p>
              <p className="text-sm text-slate-600">
                {forMechanic ? `Customer: ${request.customerName}` : `Mechanic: ${request.mechanicName}`}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
              {request.status}
            </span>
          </div>

          {forMechanic && request.status === 'Pending' && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onAction(request.id, 'Accepted')}
                className="rounded bg-green-600 px-3 py-1 text-sm text-white"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onAction(request.id, 'Rejected')}
                className="rounded bg-rose-600 px-3 py-1 text-sm text-white"
              >
                Reject
              </button>
            </div>
          )}

          {forMechanic && request.status === 'Accepted' && (
            <button
              type="button"
              onClick={() => onAction(request.id, 'Completed')}
              className="mt-3 rounded bg-blue-600 px-3 py-1 text-sm text-white"
            >
              Mark Completed
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default RequestList;
