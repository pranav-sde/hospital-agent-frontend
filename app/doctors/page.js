'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Check, 
  AlertCircle, 
  Clock, 
  Phone, 
  Mail, 
  BookOpen,
  UserCheck,
  Lock
} from 'lucide-react';
import styles from './doctors.module.css';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [breakStart, setBreakStart] = useState('13:00');
  const [breakEnd, setBreakEnd] = useState('14:00');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(15);
  const [workingDays, setWorkingDays] = useState(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loadDoctors = async () => {
    try {
      const data = await apiRequest('/api/doctors');
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError('Could not fetch doctor records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setName('');
    setSpecialization('');
    setPhone('');
    setEmail('');
    setOpenTime('09:00');
    setCloseTime('18:00');
    setBreakStart('13:00');
    setBreakEnd('14:00');
    setSlotDurationMinutes(15);
    setWorkingDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
    setUsername('');
    setPassword('');
  };

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

    // Phone validation: exactly 10 digits
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must contain exactly 10 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        specialization,
        phone: cleanPhone,
        email,
        openTime,
        closeTime,
        breakStart: breakStart || null,
        breakEnd: breakEnd || null,
        slotDurationMinutes: parseInt(slotDurationMinutes),
        workingDays,
        username,
        password
      };

      if (editId) {
        await apiRequest(`/api/doctors/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccess('Doctor configuration updated successfully.');
      } else {
        await apiRequest('/api/doctors', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess('Doctor profile created successfully.');
      }

      resetForm();
      loadDoctors();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'An error occurred while saving the profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (doc) => {
    setEditId(doc.id);
    setName(doc.name || '');
    setSpecialization(doc.specialization || '');
    setPhone(doc.phone || '');
    setEmail(doc.email || '');
    setOpenTime(doc.openTime?.substring(0, 5) || '09:00');
    setCloseTime(doc.closeTime?.substring(0, 5) || '18:00');
    setBreakStart(doc.breakStart?.substring(0, 5) || '');
    setBreakEnd(doc.breakEnd?.substring(0, 5) || '');
    setSlotDurationMinutes(doc.slotDurationMinutes || 15);
    setWorkingDays(doc.workingDays || []);
    setUsername('');
    setPassword('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this doctor profile? This will hide them from active booking options.')) return;

    try {
      await apiRequest(`/api/doctors/${id}`, {
        method: 'DELETE'
      });
      setSuccess('Doctor profile deactivated successfully.');
      loadDoctors();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to deactivate doctor profile.');
    }
  };

  const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Manage Doctors</h1>
          <p>Register practitioners and configure their custom working schedules</p>
        </div>
      </header>

      {/* Status Alerts */}
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

      <div className={styles.grid}>
        {/* Doctors list */}
        <div className={`${styles.listCard} glass`}>
          <div className={styles.cardHeader}>
            <Users className={styles.cardIcon} />
            <h3>Active Practitioners ({doctors.length})</h3>
          </div>

          {loading ? (
            <div className={styles.loadingWrapper}>
              <div className="spinner" style={{ width: 30, height: 30 }} />
              <p>Fetching active doctor directory...</p>
            </div>
          ) : doctors.length > 0 ? (
            <div className={styles.doctorsList}>
              {doctors.map((doc) => (
                <div key={doc.id} className={styles.doctorCard}>
                  <div className={styles.doctorInfo}>
                    <h4>{doc.name}</h4>
                    <div className={styles.specialty}>{doc.specialization}</div>
                    
                    <div className={styles.details}>
                      <div className={styles.detailItem}>
                        <Phone className={styles.detailIcon} />
                        <span>{doc.phone}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <Mail className={styles.detailIcon} />
                        <span>{doc.email || 'No email provided'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <Clock className={styles.detailIcon} />
                        <span>
                          {doc.openTime?.substring(0, 5)} - {doc.closeTime?.substring(0, 5)}
                          {doc.breakStart && ` (Break: ${doc.breakStart?.substring(0, 5)} - ${doc.breakEnd?.substring(0, 5)})`}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <BookOpen className={styles.detailIcon} />
                        <span>Slot: {doc.slotDurationMinutes} mins</span>
                      </div>
                    </div>

                    <div className={styles.scheduleInfo}>
                      <div className={styles.daysSelector}>
                        {weekDays.map(day => {
                          const isWorking = doc.workingDays?.includes(day);
                          return (
                            <span 
                              key={day} 
                              className={`${styles.dayBadge} ${isWorking ? styles.dayChecked : ''}`}
                              style={{ cursor: 'default' }}
                            >
                              {day.substring(0, 3)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(doc)} title="Edit Configuration">
                      <Edit2 style={{ width: 14, height: 14 }} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc.id)} title="Deactivate Profile">
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noDataState}>
              <Users className={styles.noDataIcon} />
              <p>No active doctor profiles registered. Please add one on the right panel.</p>
            </div>
          )}
        </div>

        {/* Doctor Form */}
        <div className={`${styles.formCard} glass`}>
          <div className={styles.cardHeader}>
            {editId ? <UserCheck className={styles.cardIcon} /> : <UserPlus className={styles.cardIcon} />}
            <h3>{editId ? 'Modify Practitioner' : 'Add Practitioner'}</h3>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Doctor Full Name</label>
              <div className={styles.inputWrapper}>
                <Users className={styles.fieldIcon} />
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Jane Smith" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Speciality</label>
              <div className={styles.inputWrapper}>
                <BookOpen className={styles.fieldIcon} />
                <input 
                  type="text" 
                  placeholder="e.g. Endocrinologist" 
                  value={specialization} 
                  onChange={(e) => setSpecialization(e.target.value)} 
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Phone Number (10 digits)</label>
              <div className={styles.inputWrapper}>
                <Phone className={styles.fieldIcon} />
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210" 
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
                  placeholder="e.g. drsmith@clinic.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Login Username</label>
                <div className={styles.inputWrapper}>
                  <UserPlus className={styles.fieldIcon} />
                  <input 
                    type="text" 
                    placeholder="e.g. drsmith" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required={!editId}
                    disabled={submitting || !!editId}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Login Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.fieldIcon} />
                  <input 
                    type="password" 
                    placeholder={editId ? "Leave blank to keep unchanged" : "••••••••"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required={!editId}
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
                <Clock className={styles.fieldIcon} />
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

            <div className={styles.row} style={{ marginTop: '1rem' }}>
              <button 
                type="submit" 
                className="primary-button" 
                style={{ flex: 2, height: '3.25rem' }} 
                disabled={submitting || workingDays.length === 0}
              >
                {submitting ? 'Syncing...' : editId ? 'Save Configuration' : 'Add Practitioner'}
              </button>
              {editId && (
                <button 
                  type="button" 
                  className="cyber-button" 
                  style={{ flex: 1, height: '3.25rem', backgroundColor: 'transparent', color: '#fff' }} 
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
