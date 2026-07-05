'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AnimatedOrbs from '@/components/AnimatedOrbs';
import { Activity, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
    }
  };



  return (
    <div className={styles.wrapper}>
      <AnimatedOrbs />
      
      <div className={styles.container}>
        <div className={`${styles.card} glass animate-slide-up`}>
          <div className={styles.header}>
            <div className={styles.logoCircle}>
              <Activity className={styles.logo} />
            </div>
            <h1>Diabetes Thyroid Centre</h1>
            <p>Admin Portal Access</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <div className={styles.inputWrapper}>
                <User className={styles.inputIcon} />
                <input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
                </button>
              </div>
            </div>

            <button type="submit" className="primary-button" style={{ width: '100%', marginTop: '1rem', height: '3rem' }} disabled={submitting}>
              {submitting ? (
                <div className={styles.spinner} />
              ) : (
                'Access Dashboard'
              )}
            </button>


          </form>

          <div className={styles.signupLink}>
            Are you a practitioner?{' '}
            <Link href="/signup" className={styles.linkText}>
              Register Doctor Account
            </Link>
          </div>

          <div className={styles.terminalLog}>
            <div className={styles.terminalDot} />
            <span className={styles.terminalText}>
              {submitting 
                ? 'INITIALIZING HANDSHAKE... VALIDATING CRYPTOGRAPHIC KEY'
                : password 
                  ? 'CREDENTIAL ENTRY DETECTED. ENCRYPTING STACK...'
                  : username 
                    ? `IDENTIFYING HOST: ${username.toUpperCase()}`
                    : 'CONSOLE IDLE. AWAITING OPERATOR INPUT...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
