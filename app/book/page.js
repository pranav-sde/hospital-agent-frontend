'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Calendar, User, Phone, Clock, Check, AlertCircle, Users } from 'lucide-react';
import styles from './book.module.css';

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const dateInputRef = useRef(null);
  
  // Doctors & Selection
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Slots
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form states
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [checking, setChecking] = useState(false);
  const [slotStatus, setSlotStatus] = useState({ checked: false, available: false, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // 1. Fetch active doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await apiRequest('/api/doctors');
        setDoctors(data);
        
        // If logged in as DOCTOR, preselect their doctorId and lock it
        if (user?.role === 'DOCTOR' && user?.doctorId) {
          setSelectedDoctorId(user.doctorId);
        } else if (data.length > 0) {
          setSelectedDoctorId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
        setError('Could not load the active doctor directory.');
      }
    };
    fetchDoctors();
  }, [user]);

  // 2. Dynamically load slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !date) {
      setSlots([]);
      setTime('');
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await apiRequest(`/api/doctors/${selectedDoctorId}/slots?date=${date}`);
        setSlots(data);
        setTime(''); // Reset time selection on date/doctor change
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setError('Could not retrieve available time slots for the selected date.');
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [selectedDoctorId, date]);

  // 3. Verify availability (final check) when time changes
  useEffect(() => {
    if (!selectedDoctorId || !date || !time) {
      setSlotStatus({ checked: false, available: false, message: '' });
      return;
    }

    const checkSlot = async () => {
      setChecking(true);
      try {
        const res = await apiRequest(`/api/appointments/check-availability?date=${date}&time=${time}&doctorId=${selectedDoctorId}`);
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

    const debounceTimer = setTimeout(checkSlot, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedDoctorId, date, time]);

  // Phone number validation: strip non-digits, validate length
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(digits);

    if (digits.length === 0) {
      setPhoneError('');
    } else if (digits.length < 10) {
      setPhoneError(`Phone number must be exactly 10 digits (${digits.length}/10).`);
    } else if (!/^[6-9]/.test(digits)) {
      setPhoneError('Phone number must start with 6, 7, 8, or 9.');
    } else {
      setPhoneError('');
    }
  };

  const isPhoneValid = phoneNumber.length === 10 && /^[6-9]\d{9}$/.test(phoneNumber);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!patientName || !phoneNumber || !date || !time || !selectedDoctorId) {
      setError('Please fill in all the details.');
      return;
    }

    if (!isPhoneValid) {
      setError('Phone number must contain exactly 10 digits.');
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
        body: JSON.stringify({ 
          patientName, 
          phoneNumber, 
          date, 
          time, 
          doctorId: selectedDoctorId 
        })
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

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${minute} ${ampm}`;
  };

  const activeDoctorName = doctors.find(d => d.id === selectedDoctorId)?.name || 'the clinic';

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
            {/* Doctor Selection */}
            <div className={styles.inputGroup}>
              <label>Select Practitioner</label>
              <div className={styles.inputWrapper}>
                <Users className={styles.inputIcon} />
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  required
                  disabled={submitting || user?.role === 'DOCTOR'}
                  style={{ paddingLeft: '3rem' }}
                >
                  {doctors.length === 0 ? (
                    <option value="">No active doctors found</option>
                  ) : (
                    doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

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
                  onChange={handlePhoneChange}
                  maxLength={10}
                  required 
                  disabled={submitting}
                  className={phoneError ? styles.inputError : ''}
                />
              </div>
              {phoneError && (
                <span className={styles.fieldError}>{phoneError}</span>
              )}
              {isPhoneValid && (
                <span className={styles.fieldValid}>
                  <Check style={{ width: 14, height: 14 }} /> Valid phone number
                </span>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Appointment Date</label>
                <div className={styles.inputWrapper}>
                  <Calendar className={styles.inputIcon} onClick={() => dateInputRef.current?.showPicker()} style={{ cursor: 'pointer' }} />
                  <input 
                    ref={dateInputRef}
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
                    disabled={submitting || loadingSlots || !date}
                  >
                    <option value="">{loadingSlots ? 'Loading slots...' : !date ? 'Choose date first' : 'Select slot'}</option>
                    {slots.map((s) => (
                      <option 
                        key={s.time} 
                        value={s.time}
                        disabled={!s.available}
                      >
                        {formatTime12h(s.time)} {!s.available ? '(Booked)' : ''}
                      </option>
                    ))}
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
              disabled={submitting || checking || loadingSlots || !isPhoneValid || (date && time && !slotStatus.available)}
            >
              {submitting ? 'Writing to Ledger...' : 'Schedule Appointment'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className={`${styles.infoCard} glass`}>
          <h3>Practitioner Schedule Policies</h3>
          <ul>
            <li>
              <strong>Assigned Doctor:</strong> Bookings are scheduled directly to <strong>{activeDoctorName}</strong>.
            </li>
            <li>
              <strong>Dynamic Slot Allocations:</strong> Time slots are dynamically generated based on the doctor's specific operating hours and custom session times.
            </li>
            <li>
              <strong>Conflict Prevention:</strong> Real-time locking protects against concurrent double-booking of identical slots.
            </li>
            <li>
              <strong>Reschedule Integrity:</strong> Past time blocks are locked and cannot be selected.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
