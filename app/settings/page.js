'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Building, 
  User, 
  MapPin, 
  DollarSign, 
  Clock, 
  Lock, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { changePassword } = useAuth();
  
  // Clinic Config States
  const [clinicId, setClinicId] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [address, setAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [closedDays, setClosedDays] = useState([]);
  
  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UX States
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [configError, setConfigError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function loadClinicConfig() {
      try {
        const configs = await apiRequest('/api/clinics');
        if (configs && configs.length > 0) {
          const config = configs[0]; // Active config
          setClinicId(config.id);
          setClinicName(config.clinicName || '');
          setDoctorName(config.doctorName || '');
          setAddress(config.address || '');
          setConsultationFee(config.consultationFee || '');
          setOpenTime(config.openTime || '');
          setCloseTime(config.closeTime || '');
          setClosedDays(config.closedDays || []);
        }
      } catch (err) {
        console.error('Failed to load clinic settings:', err);
        setConfigError('Could not fetch clinic configuration.');
      } finally {
        setLoading(false);
      }
    }

    loadClinicConfig();
  }, []);

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setConfigError('');
    setConfigSuccess('');
    setSavingConfig(true);

    if (!clinicId) {
      setConfigError('No clinic config available to update.');
      setSavingConfig(false);
      return;
    }

    try {
      const payload = {
        clinicName,
        doctorName,
        address,
        consultationFee: parseFloat(consultationFee),
        openTime,
        closeTime,
        closedDays,
        availableSlots: [] // Managed dynamically by server
      };

      await apiRequest(`/api/clinics/${clinicId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setConfigSuccess('Clinic settings updated successfully.');
      setTimeout(() => setConfigSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setConfigError(err.message || 'Failed to update clinic configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    const result = await changePassword(oldPassword, newPassword);
    
    if (result.success) {
      setPasswordSuccess('Password updated successfully. Logging out...');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error);
      setUpdatingPassword(false);
    }
  };

  const handleDayToggle = (day) => {
    if (closedDays.includes(day)) {
      setClosedDays(closedDays.filter(d => d !== day));
    } else {
      setClosedDays([...closedDays, day]);
    }
  };

  const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className="spinner" style={{ width: 30, height: 30 }} />
        <p>Syncing security profiles & settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Clinic Settings</h1>
        <p>Manage operating configurations and administrative credentials</p>
      </header>

      <div className={styles.grid}>
        {/* Clinic Config Card */}
        <div className={`${styles.card} glass`}>
          <div className={styles.cardHeader}>
            <Building className={styles.cardIcon} />
            <h3>Clinic Parameters</h3>
          </div>

          {configSuccess && (
            <div className={styles.successAlert}>
              <Check style={{ width: 16, height: 16 }} />
              <span>{configSuccess}</span>
            </div>
          )}

          {configError && (
            <div className={styles.errorAlert}>
              <AlertCircle style={{ width: 16, height: 16 }} />
              <span>{configError}</span>
            </div>
          )}

          <form onSubmit={handleConfigSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Clinic Name</label>
              <div className={styles.inputWrapper}>
                <Building className={styles.fieldIcon} />
                <input 
                  type="text" 
                  value={clinicName} 
                  onChange={(e) => setClinicName(e.target.value)} 
                  required
                  disabled={savingConfig}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Lead Practitioner</label>
              <div className={styles.inputWrapper}>
                <User className={styles.fieldIcon} />
                <input 
                  type="text" 
                  value={doctorName} 
                  onChange={(e) => setDoctorName(e.target.value)} 
                  required
                  disabled={savingConfig}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Clinic Address</label>
              <div className={styles.inputWrapper}>
                <MapPin className={styles.fieldIcon} />
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  required
                  disabled={savingConfig}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Consultation Fee (INR)</label>
                <div className={styles.inputWrapper}>
                  <DollarSign className={styles.fieldIcon} />
                  <input 
                    type="number" 
                    value={consultationFee} 
                    onChange={(e) => setConsultationFee(e.target.value)} 
                    required
                    disabled={savingConfig}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Open Time</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.fieldIcon} />
                  <input 
                    type="time" 
                    value={openTime} 
                    onChange={(e) => setOpenTime(e.target.value)} 
                    required
                    disabled={savingConfig}
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
                    disabled={savingConfig}
                  />
                </div>
              </div>
            </div>

            {/* Closed Days Multi-select */}
            <div className={styles.inputGroup}>
              <label>Weekly Off Days</label>
              <div className={styles.daysSelector}>
                {weekDays.map(day => {
                  const isChecked = closedDays.includes(day);
                  return (
                    <button 
                      key={day}
                      type="button"
                      className={`${styles.dayBadge} ${isChecked ? styles.dayChecked : ''}`}
                      onClick={() => handleDayToggle(day)}
                      disabled={savingConfig}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="primary-button" style={{ height: '3rem', width: '100%', marginTop: '1rem' }} disabled={savingConfig}>
              {savingConfig ? 'Saving Parameter Set...' : 'Update Settings'}
            </button>
          </form>
        </div>

        {/* Security / Password Change Card */}
        <div className={`${styles.card} glass`}>
          <div className={styles.cardHeader}>
            <Lock className={styles.cardIcon} />
            <h3>Administrative Access</h3>
          </div>

          {passwordSuccess && (
            <div className={styles.successAlert}>
              <Check style={{ width: 16, height: 16 }} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className={styles.errorAlert}>
              <AlertCircle style={{ width: 16, height: 16 }} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Current Secure Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.fieldIcon} />
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={updatingPassword}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>New Passphrase</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.fieldIcon} />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  disabled={updatingPassword}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Confirm Passphrase</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.fieldIcon} />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={updatingPassword}
                />
              </div>
            </div>

            <button type="submit" className="primary-button" style={{ height: '3rem', width: '100%', marginTop: '1rem' }} disabled={updatingPassword}>
              {updatingPassword ? 'Re-keying accounts...' : 'Apply Security Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
