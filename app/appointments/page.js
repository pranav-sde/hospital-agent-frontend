'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { 
  Search, 
  Calendar, 
  Filter, 
  Trash2, 
  ChevronRight, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import styles from './appointments.module.css';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = `?status=${statusFilter}`;
      if (search) query += `&phone=${search}`;
      if (dateFilter) query += `&date=${dateFilter}`;
      
      const data = await apiRequest(`/api/appointments${query}`);
      setAppointments(data);
      setError('');
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Could not fetch appointments from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly or reload on filter change
    const delayDebounce = setTimeout(() => {
      fetchAppointments();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [statusFilter, dateFilter, search]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    setCancellingId(id);
    try {
      await apiRequest(`/api/appointments/${id}`, {
        method: 'DELETE'
      });
      setSuccessMsg('Appointment cancelled successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      // Refresh list
      fetchAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setError(err.message || 'Failed to cancel appointment');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED': return styles.statusScheduled;
      case 'RESCHEDULED': return styles.statusRescheduled;
      case 'CANCELLED': return styles.statusCancelled;
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Appointments</h1>
          <p>Browse and manage patients calendar records</p>
        </div>
      </header>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className={styles.successAlert}>
          <Check style={{ width: 18, height: 18 }} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className={styles.errorAlert}>
          <AlertCircle style={{ width: 18, height: 18 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Card */}
      <section className={`${styles.filterCard} glass`}>
        <div className={styles.filterGroup}>
          <div className={styles.searchWrapper}>
            <Search className={styles.filterIcon} />
            <input 
              type="text" 
              placeholder="Search phone number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.selectWrapper}>
            <Filter className={styles.filterIcon} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className={styles.dateWrapper}>
            <Calendar className={styles.filterIcon} />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          {(search || statusFilter !== 'ALL' || dateFilter) && (
            <button 
              className={styles.clearBtn} 
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setDateFilter('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Data Table */}
      <section className={`${styles.tableCard} glass`}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className="spinner" style={{ width: 30, height: 30 }} />
            <p>Syncing database records...</p>
          </div>
        ) : appointments.length > 0 ? (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Contact Phone</th>
                  <th>Appt Date</th>
                  <th>Appt Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app.id} className={styles.tableRow}>
                    <td className={styles.patientCell}>{app.patientName}</td>
                    <td className={styles.phoneCell}>{app.phoneNumber}</td>
                    <td>{formatDate(app.date)}</td>
                    <td>
                      <span className={styles.timeLabel}>{app.time}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {app.status !== 'CANCELLED' ? (
                        <button 
                          className={styles.cancelActionBtn}
                          onClick={() => handleCancel(app.id)}
                          disabled={cancellingId === app.id}
                        >
                          <Trash2 className={styles.trashIcon} />
                          <span>{cancellingId === app.id ? 'Revoking...' : 'Cancel'}</span>
                        </button>
                      ) : (
                        <span className={styles.disabledAction}>Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.noDataState}>
            <AlertCircle className={styles.noDataIcon} />
            <p>No appointments found matching search filters</p>
          </div>
        )}
      </section>
    </div>
  );
}
