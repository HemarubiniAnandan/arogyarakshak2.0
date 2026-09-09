import React from 'react';

export default function SimulatedBadge({ adapterName }) {
  return (
    <span className="gov-badge gov-badge-simulated" title="Simulated government API response for hackathon demo">
      Simulated — {adapterName}
    </span>
  );
}
