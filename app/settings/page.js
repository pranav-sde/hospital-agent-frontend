'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Lock, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { changePassword } = useAuth();
  
  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UX States
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Account Settings</h1>
        <p>Manage administrative credentials and security settings</p>
      </header>

      <div className={styles.singleCardGrid}>
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
