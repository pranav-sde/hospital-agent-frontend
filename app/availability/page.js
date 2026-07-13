'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarClock,
  Check,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  UserCheck
} from 'lucide-react';
import styles from '../doctors/doctors.module.css';

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Editable fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(15);
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [workingDays, setWorkingDays] = useState([]);

  const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const loadProfile = async () => {
    try {
      const doc = await apiRequest('/api/doctors/me');
      setDoctorName(doc.name || '');
      setSpecialization(doc.specialization || '');
      setPhone(doc.phone || '');
      setEmail(doc.email || '');
      setOpenTime(doc.openTime?.substring(0, 5) || '09:00');
      setCloseTime(doc.closeTime?.substring(0, 5) || '18:00');
      setBreakStart(doc.breakStart?.substring(0, 5) || '');
      setBreakEnd(doc.breakEnd?.substring(0, 5) || '');
      setSlotDurationMinutes(doc.slotDurationMinutes || 15);
      setGoogleCalendarId(doc.googleCalendarId || '');
      setWorkingDays(doc.workingDays || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Could not load your profile. Please try again or contact the administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleDayToggle = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must contain exactly 10 digits.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/api/doctors/me', {
        method: 'PUT',
        body: JSON.stringify({
          phone: cleanPhone,
          email,
          openTime,
          closeTime,
          breakStart: breakStart || null,
          breakEnd: breakEnd || null,
          slotDurationMinutes: parseInt(slotDurationMinutes),
          googleCalendarId: googleCalendarId.trim(),
          workingDays
        })
      });
      setSuccess('Your availability has been updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'An error occurred while saving your availability.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>My Availability</h1>
          <p>Manage your working schedule, breaks, and appointment settings</p>
        </div>
      </header>

      {success && (
        <div className={styles.successAlert}>
          <Check style={{ width: 18, height: 18 }} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className={styles.errorAlert}>
          <AlertCircle style={{ width: 18, height: 18 }} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrapper}>
          <div className="spinner" style={{ width: 30, height: 30 }} />
          <p>Loading your profile...</p>
        </div>
      ) : (
        <div className={`${styles.formCard} glass`} style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className={styles.cardHeader}>
            <UserCheck className={styles.cardIcon} />
            <h3>{doctorName}{specialization ? ` — ${specialization}` : ''}</h3>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Phone Number (10 digits)</label>
                <div className={styles.inputWrapper}>
                  <Phone className={styles.fieldIcon} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.fieldIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Open Time</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.fieldIcon} />
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Close Time</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.fieldIcon} />
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Break Start</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.fieldIcon} />
                  <input
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Break End</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.fieldIcon} />
                  <input
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Appointment Duration</label>
              <div className={styles.inputWrapper}>
                <BookOpen className={styles.fieldIcon} />
                <select
                  value={slotDurationMinutes}
                  onChange={(e) => setSlotDurationMinutes(e.target.value)}
                  disabled={submitting}
                  style={{ paddingLeft: '3rem' }}
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Google Calendar ID (optional)</label>
              <div className={styles.inputWrapper}>
                <Calendar className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="e.g. doctor@gmail.com or ...@group.calendar.google.com"
                  value={googleCalendarId}
                  onChange={(e) => setGoogleCalendarId(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <small style={{ opacity: 0.7, fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Appointments sync to this calendar. Share it with calendar-bot@titan-458108.iam.gserviceaccount.com (Make changes to events).
              </small>
            </div>

            <div className={styles.inputGroup}>
              <label>Working Days</label>
              <div className={styles.daysSelector}>
                {weekDays.map(day => {
                  const isChecked = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`${styles.dayBadge} ${isChecked ? styles.dayChecked : ''}`}
                      onClick={() => handleDayToggle(day)}
                      disabled={submitting}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="primary-button"
              style={{ height: '3.25rem', marginTop: '1rem' }}
              disabled={submitting || workingDays.length === 0}
            >
              {submitting ? 'Saving...' : 'Save Availability'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
