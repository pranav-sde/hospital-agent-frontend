'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedOrbs from '@/components/AnimatedOrbs';
import { 
  Activity, 
  Lock, 
  User, 
  Building, 
  MapPin, 
  DollarSign, 
  Clock, 
  Check, 
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import styles from './onboard.module.css';

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [address, setAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [closedDays, setClosedDays] = useState(['SUNDAY']);

  useEffect(() => {
    // Check if database is already onboarded
    async function checkOnboardStatus() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/onboard-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.onboarded) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Failed to verify onboard status:', err);
      } finally {
        setLoading(false);
      }
    }
    checkOnboardStatus();
  }, [router]);

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all account fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    } else if (step === 2) {
      if (!clinicName || !doctorName || !address || !consultationFee) {
        setError('Please fill in all clinic details.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(step - 1);
  };

  const handleDayToggle = (day) => {
    if (closedDays.includes(day)) {
      setClosedDays(closedDays.filter(d => d !== day));
    } else {
      setClosedDays([...closedDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        email,
        password,
        clinicName,
        doctorName,
        address,
        consultationFee: parseFloat(consultationFee),
        openTime,
        closeTime,
        closedDays
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/login?onboarded=true');
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete onboarding setup.');
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p>Analyzing database cluster status...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <AnimatedOrbs />

      <div className={styles.container}>
        <div className={`${styles.card} glass animate-slide-up`}>
          <div className={styles.header}>
            <div className={styles.logoCircle}>
              <Activity className={styles.logo} />
            </div>
            <h1>Initialize Core Stack</h1>
            <p>System Setup Wizard</p>

            {/* Step Indicators */}
            <div className={styles.stepsBar}>
              <div className={`${styles.stepIndicator} ${step >= 1 ? styles.stepActive : ''}`}>
                <span>01</span>
                <p>Account</p>
              </div>
              <div className={styles.connector} />
              <div className={`${styles.stepIndicator} ${step >= 2 ? styles.stepActive : ''}`}>
                <span>02</span>
                <p>Clinic</p>
              </div>
              <div className={styles.connector} />
              <div className={`${styles.stepIndicator} ${step >= 3 ? styles.stepActive : ''}`}>
                <span>03</span>
                <p>Schedule</p>
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle style={{ width: 18, height: 18 }} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.content}>
            {/* Step 1: Account setup */}
            {step === 1 && (
              <div className={styles.stepForm}>
                <div className={styles.inputGroup}>
                  <label>Administrator Email</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.fieldIcon} />
                    <input 
                      type="email" 
                      placeholder="e.g. admin@clinic.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Secure Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.fieldIcon} />
                    <input 
                      type="password" 
                      placeholder="At least 6 characters" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Confirm Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.fieldIcon} />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="button" onClick={handleNext} className="cyber-button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', height: '3.25rem' }}>
                  <span>Configure Clinic Profile</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )}

            {/* Step 2: Clinic Settings */}
            {step === 2 && (
              <div className={styles.stepForm}>
                <div className={styles.inputGroup}>
                  <label>Clinic Name</label>
                  <div className={styles.inputWrapper}>
                    <Building className={styles.fieldIcon} />
                    <input 
                      type="text" 
                      placeholder="e.g. Diabetes & Endocrine Centre" 
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Practitioner Full Name</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.fieldIcon} />
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. John Smith" 
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Clinic Address</label>
                  <div className={styles.inputWrapper}>
                    <MapPin className={styles.fieldIcon} />
                    <input 
                      type="text" 
                      placeholder="e.g. 123 Metro Ave, New Delhi" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Consultation Fee (INR)</label>
                  <div className={styles.inputWrapper}>
                    <DollarSign className={styles.fieldIcon} />
                    <input 
                      type="number" 
                      placeholder="e.g. 900" 
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.navRow}>
                  <button type="button" onClick={handlePrev} className={styles.backBtn}>
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                    <span>Back</span>
                  </button>
                  <button type="button" onClick={handleNext} className="cyber-button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem' }}>
                    <span>Set Hours</span>
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Operating Schedule */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className={styles.stepForm}>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>Open Time</label>
                    <div className={styles.inputWrapper}>
                      <Clock className={styles.fieldIcon} />
                      <input 
                        type="time" 
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
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
                      />
                    </div>
                  </div>
                </div>

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
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.navRow} style={{ marginTop: '1rem' }}>
                  <button type="button" onClick={handlePrev} className={styles.backBtn}>
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                    <span>Back</span>
                  </button>
                  <button type="submit" className="cyber-button" style={{ flex: 1, height: '3.25rem' }} disabled={submitting}>
                    {submitting ? 'Writing Stack Config...' : 'Complete Initialization'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
