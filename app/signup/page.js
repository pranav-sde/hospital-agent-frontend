'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedOrbs from '@/components/AnimatedOrbs';
import { 
  Activity, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  BookOpen, 
  Clock, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import styles from './signup.module.css';

export default function SignupPage() {
  const router = useRouter();

  // Account details
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Doctor profile details
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(15);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!username || !password || !name || !specialization || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must contain exactly 10 digits.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        username,
        password,
        name,
        specialization,
        phone: cleanPhone,
        email: email || username, // fallback to username if not specified
        openTime: `${openTime}:00`,
        closeTime: `${closeTime}:00`,
        slotDurationMinutes: parseInt(slotDurationMinutes),
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/signup-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess('Account registered successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete registration.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup.');
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
            <h1>Register Doctor Portal</h1>
            <p>Create Practitioner Account</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle style={{ width: 16, height: 16 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.successAlert}>
              <Check style={{ width: 16, height: 16 }} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* SECTION 1: Credentials */}
            <div className={styles.sectionTitle}>Login Credentials</div>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label htmlFor="username">Login Username (Email)</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} />
                  <input
                    id="username"
                    type="email"
                    placeholder="doctor@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Login Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className={styles.passwordInput}
                    required
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
            </div>

            {/* SECTION 2: Profile Details */}
            <div className={styles.sectionTitle}>Practitioner Details</div>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label htmlFor="name">Practitioner Full Name</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} />
                  <input
                    id="name"
                    type="text"
                    placeholder="Dr. Ajay Kumar Ajmani"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="specialization">Medical Specialty</label>
                <div className={styles.inputWrapper}>
                  <BookOpen className={styles.inputIcon} />
                  <input
                    id="specialization"
                    type="text"
                    placeholder="Endocrinology"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="phone">Contact Number (10 Digits)</label>
                <div className={styles.inputWrapper}>
                  <Phone className={styles.inputIcon} />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="9013935854"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email">Public Contact Email (Optional)</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    placeholder="ajay@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Clinic Schedule */}
            <div className={styles.sectionTitle}>Working Schedule</div>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label htmlFor="openTime">Consultation Start Time</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.inputIcon} />
                  <input
                    id="openTime"
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="closeTime">Consultation End Time</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.inputIcon} />
                  <input
                    id="closeTime"
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className={`${styles.inputGroup} ${styles.inputGroupFull}`}>
                <label htmlFor="slotDuration">Appointment Slot Duration (Minutes)</label>
                <div className={styles.inputWrapper}>
                  <Clock className={styles.inputIcon} />
                  <select
                    id="slotDuration"
                    value={slotDurationMinutes}
                    onChange={(e) => setSlotDurationMinutes(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes (Default)</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="primary-button" style={{ width: '100%', marginTop: '1rem', height: '3rem' }} disabled={submitting}>
              {submitting ? (
                <div className={styles.spinner} />
              ) : (
                'Register & Setup Account'
              )}
            </button>
          </form>

          <div className={styles.signupLink}>
            Already registered?{' '}
            <Link href="/login" className={styles.linkText}>
              Log in here
            </Link>
          </div>

          <div className={styles.terminalLog}>
            <div className={styles.terminalDot} />
            <span className={styles.terminalText}>
              {submitting 
                ? 'COMPILING PROFILE DATA... INITIALIZING DIRECTORY SEEDING...'
                : name
                  ? `PREPARING RECORDS FOR ${name.toUpperCase()}`
                  : 'SIGNUP CONSOLE STANDBY. AWAITING OPERATOR INPUT...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
