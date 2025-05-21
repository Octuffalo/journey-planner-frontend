import React from 'react';

function TrainCard({ train, onViewDetails }) {
  return (
    <li className="border-b py-3 text-sm">
      <div className="flex justify-between items-center">
        <div>
          <strong>{train.origin} → {train.destination}</strong><br />
          Departs: {train.scheduledDeparture} | Platform: {train.platform}
        </div>
        <button
          onClick={() =>
            onViewDetails(train.serviceID, {
              origin: train.origin,
              scheduledDeparture: train.scheduledDeparture,
              estimatedDeparture: train.estimatedDeparture,
              platform: train.platform,
            })
          }
          className="text-indigo-600 hover:underline text-xs"
        >
          View Route
        </button>
      </div>
    </li>
  );
}

export default TrainCard;