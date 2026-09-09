import React from 'react';

/**
 * Amazon Shipping-Style Progress Stepper Component
 * 
 * Stages:
 * 1. Booked (Appointment Token Generated)
 * 2. Desk Arrived (Facility Reception Desk Checked-In)
 * 3. Visited Doctor (Entered OPD Consultation Desk)
 * 4. Prescription Attached (Doctor Completed Diagnosis & Prescribed Medicines)
 * 5. Pharmacy Completed (Medicines Dispensed / Care Completed)
 */
export default function AppointmentTrackerStepper({ appointment }) {
  if (!appointment) return null;

  // Determine stage flags based on database fields
  const isBooked = true; // Always booked if record exists
  const isArrived = !!appointment.arrived_at;
  const isVisitedDoctor = !!appointment.seen_at || isArrived && appointment.status === 'completed';
  const isPrescriptionAttached = !!(appointment.prescription && appointment.prescription.trim().length > 0);
  const isCompleted = appointment.status === 'completed' || isPrescriptionAttached;

  let currentStageIndex = 0;
  if (isCompleted) currentStageIndex = 4;
  else if (isPrescriptionAttached) currentStageIndex = 3;
  else if (isVisitedDoctor) currentStageIndex = 2;
  else if (isArrived) currentStageIndex = 1;
  else if (isBooked) currentStageIndex = 0;

  const steps = [
    { label: 'Token Booked', subtitle: appointment.time || 'Scheduled' },
    { label: 'Desk Arrived', subtitle: isArrived ? appointment.arrived_at.split('T')[1]?.slice(0,5) || 'Checked-In' : 'Pending Check-In' },
    { label: 'Visited Doctor', subtitle: isVisitedDoctor ? 'In Consultation' : 'Waiting Room' },
    { label: 'e-Prescription', subtitle: isPrescriptionAttached ? 'Attached' : 'Pending Prescribe' },
    { label: 'Care Completed', subtitle: isCompleted ? 'Fulfilled' : 'In Progress' },
  ];

  // Calculate active line width percentage: 0%, 25%, 50%, 75%, 100%
  const progressPercent = (currentStageIndex / (steps.length - 1)) * 100;

  return (
    <div style={{ backgroundColor: '#FAFBFD', padding: '16px 12px', borderRadius: '8px', border: '1px solid var(--gov-border)', margin: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--gov-blue-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          OPD Care Journey Progress Tracker (Token #{appointment.token_number || 'N/A'})
        </div>
        <span className={`gov-badge ${isCompleted ? 'gov-badge-fresh' : isArrived ? 'gov-badge-aging' : 'gov-badge-stale'}`}>
          Status: {appointment.status?.toUpperCase() || 'BOOKED'}
        </span>
      </div>

      <div className="stepper-wrapper">
        <div className="stepper-progress-line" />
        <div className="stepper-progress-active-line" style={{ width: `${progressPercent}%` }} />

        {steps.map((step, index) => {
          const isDone = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;

          return (
            <div key={index} className={`stepper-step ${isDone ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
              <div className="stepper-circle">
                {isDone && index < currentStageIndex ? '✓' : index + 1}
              </div>
              <div>
                <div className="stepper-title" style={{ color: isDone ? 'var(--gov-blue-primary)' : 'var(--gov-text-muted)' }}>
                  {step.label}
                </div>
                <div className="stepper-subtitle">{step.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
