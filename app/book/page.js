'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Calendar, User, Phone, Clock, Check, AlertCircle } from 'lucide-react';
import styles from './book.module.css';

export default function BookAppointmentPage() {
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [checking, setChecking] = useState(false);
  const [slotStatus, setSlotStatus] = useState({ checked: false, available: false, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check availability when date or time changes
  useEffect(() => {
    if (!date || !time) {
      setSlotStatus({ checked: false, available: false, message: '' });
      return;
    }

    const checkSlot = async () => {
      setChecking(true);
      try {
        const res = await apiRequest(`/api/appointments/check-availability?date=${date}&time=${time}`);
        setSlotStatus({
          checked: true,
          available: res.available,
          message: res.message
        });
      } catch (err) {
        setSlotStatus({
          checked: true,
          available: false,
          message: 'Error verifying slot availability.'
        });
      } finally {
        setChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkSlot, 500);
    return () => clearTimeout(debounceTimer);
  }, [date, time]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!patientName || !phoneNumber || !date || !time) {
      setError('Please fill in all the details.');
      return;
    }

    if (!slotStatus.available) {
      setError('Cannot book: Selected slot is unavailable.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/api/appointments/book', {
        method: 'POST',
        body: JSON.stringify({ patientName, phoneNumber, date, time })
      });
      setSuccess(true);
      // Reset form
      setPatientName('');
      setPhoneNumber('');
      setDate('');
      setTime('');
      setSlotStatus({ checked: false, available: false, message: '' });
    } catch (err) {
      setError(err.message || 'An error occurred during booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Book Appointment</h1>
        <p>Manually allocate time slots for walk-in patients</p>
      </header>

      <div className={styles.grid}>
        <div className={`${styles.formCard} glass`}>
          {success && (
            <div className={styles.successAlert}>
              <Check className={styles.alertIcon} />
              <div>
                <h4>Booking Verified</h4>
                <p>Appointment has been logged to calendar and patient record created.</p>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle className={styles.alertIcon} />
              <div>
                <h4>Operation Failed</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Patient Full Name</label>
              <div className={styles.inputWrapper}>
                <User className={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="e.g. John Smith" 
                  value={patientName} 
                  onChange={(e) => setPatientName(e.target.value)}
                  required 
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Contact Phone Number</label>
              <div className={styles.inputWrapper}>
                <Phone className={styles.inputIcon} />
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required 
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Appointment Date</label>
                <div className={styles.inputWrapper}>
                  <Calendar className={styles.inputIcon} />
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required 
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Time Slot</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.inputIcon} />
                  <select 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    required 
                    disabled={submitting}
                  >
                    <option value="">Select slot</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="18:30">06:30 PM</option>
                    <option value="19:00">07:00 PM</option>
                    <option value="19:30">07:30 PM</option>
                    <option value="20:00">08:00 PM</option>
                    <option value="20:30">08:30 PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Availability check display */}
            {(date && time) && (
              <div className={`${styles.slotCheck} ${slotStatus.available ? styles.slotAvailable : styles.slotUnavailable}`}>
                {checking ? (
                  <span className={styles.checkingText}>
                    <div className={styles.tinySpinner} />
                    Checking slot availability...
                  </span>
                ) : (
                  <span className={styles.statusText}>
                    {slotStatus.available ? (
                      <Check className={styles.statusIndicator} />
                    ) : (
                      <AlertCircle className={styles.statusIndicator} />
                    )}
                    {slotStatus.message}
                  </span>
                )}
              </div>
            )}

            <button 
              type="submit" 
              className="primary-button" 
              style={{ width: '100%', height: '3rem', marginTop: '1rem' }} 
              disabled={submitting || checking || (date && time && !slotStatus.available)}
            >
              {submitting ? 'Writing to Ledger...' : 'Schedule Appointment'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className={`${styles.infoCard} glass`}>
          <h3>Schedule Policies</h3>
          <ul>
            <li>
              <strong>Operating Hours:</strong> Clinic is configured to accept slots between 6:00 PM and 8:30 PM only.
            </li>
            <li>
              <strong>Slot Length:</strong> Standard appointment time blocks are 30 minutes in duration.
            </li>
            <li>
              <strong>Closed Days:</strong> Sunday clinic services are closed. No bookings will be written to database.
            </li>
            <li>
              <strong>Verification:</strong> High-priority notifications are automatically dispatched if any reschedule matches conflicting client slots.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
