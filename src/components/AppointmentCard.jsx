import { useAppContext } from '../context/AppContext';

const AppointmentCard = ({ appointment, viewMode }) => {
  const { getUserById, getDoctorById, updateAppointmentStatus } = useAppContext();

  const doctor = getUserById(appointment.doctorId);
  const doctorProfile = getDoctorById(appointment.doctorId);
  const patient = getUserById(appointment.patientId);

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Requested: 'badge-warning',
      Accepted: 'badge-success',
      Completed: 'badge-success',
      Rejected: 'badge-danger',
    };
    return statusMap[status] || 'badge-info';
  };

  return (
    <div className="card">
      <div className="card-header">📅 Appointment #{appointment.id}</div>
      <div className="card-body">
        {viewMode === 'patient' ? (
          <>
            <div style={{ marginBottom: '10px' }}>
              <strong>Doctor:</strong> {doctor?.name}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Specialization:</strong> {doctorProfile?.specialization || 'General Physician'}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '10px' }}>
              <strong>Patient:</strong> {patient?.name}
            </div>
          </>
        )}

        <div style={{ marginBottom: '10px' }}>
          <strong>Date:</strong> {appointment.date}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong>
          <span className={`badge ${getStatusBadgeClass(appointment.status)}`} style={{ marginLeft: '10px' }}>
            {appointment.status}
          </span>
        </div>

        {appointment.symptoms && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Symptoms:</strong>
            <p style={{ marginTop: '5px', color: '#6b7280', fontSize: '14px' }}>
              {appointment.symptoms}
            </p>
          </div>
        )}

        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Booked: {new Date(appointment.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
