'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { 
  Users, 
  Calendar,
  CalendarCheck, 
  CalendarClock, 
  CalendarX, 
  Plus, 
  Search, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import styles from './page.module.css';

export default function DashboardHome() {
  const dateInputRef = useRef(null);
  const [stats, setStats] = useState({
    todayCount: 0,
    upcomingCount: 0,
    cancelledCount: 0,
    uniquePatients: 0,
    trend: []
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const statsData = await apiRequest('/api/appointments/stats');
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
    
    // Set initial date to today's date in Asia/Kolkata timezone
    const tzDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setSelectedDate(tzDate);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    
    async function fetchSchedule() {
      setScheduleLoading(true);
      try {
        const scheduleData = await apiRequest(`/api/appointments?date=${selectedDate}`);
        setTodaySchedule(scheduleData);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setScheduleLoading(false);
      }
    }

    fetchSchedule();
  }, [selectedDate]);

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED': return styles.statusScheduled;
      case 'RESCHEDULED': return styles.statusRescheduled;
      case 'CANCELLED': return styles.statusCancelled;
      default: return '';
    }
  };

  const filteredSchedule = todaySchedule.filter(app => 
    app.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.phoneNumber?.includes(searchQuery)
  );

  const formatChartDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p>Loading overview analytics...</p>
      </div>
    );
  }

  const statCards = [
    { title: "Today's Appointments", value: stats.todayCount, icon: CalendarCheck, color: '#6366f1', glow: 'rgba(99, 102, 241, 0.15)' },
    { title: "Unique Patients", value: stats.uniquePatients, icon: Users, color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)' },
    { title: "Upcoming (7 Days)", value: stats.upcomingCount, icon: CalendarClock, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.15)' },
    { title: "Total Cancelled", value: stats.cancelledCount, icon: CalendarX, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)' },
  ];

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>Clinic Overview</h1>
          <p>Real-time telemetry and booking operations</p>
        </div>
        <div className={styles.actions}>
          <Link href="/book" className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus style={{ width: 18, height: 18 }} />
            <span>Book Appointment</span>
          </Link>
        </div>
      </header>

      {/* Stats Cards Row */}
      <section className={styles.statsGrid}>
        {statCards.map((card, idx) => (
          <div 
            key={idx} 
            className={`${styles.statCard} glass`}
            style={{ '--card-glow': card.glow, '--card-accent': card.color }}
          >
            <div className={styles.statInfo}>
              <span className={styles.statTitle}>{card.title}</span>
              <span className={styles.statValue}>{card.value}</span>
            </div>
            <div className={styles.statIconWrapper} style={{ backgroundColor: `rgba(${card.color === '#6366f1' ? '99, 102, 241' : card.color === '#10b981' ? '16, 185, 129' : card.color === '#3b82f6' ? '59, 130, 246' : '239, 68, 68'}, 0.1)` }}>
              <card.icon className={styles.statIcon} style={{ color: card.color }} />
            </div>
          </div>
        ))}
      </section>

      {/* Analytics & Today's Schedule Row */}
      <div className={styles.dataGrid}>
        {/* Trend Chart Card */}
        <div className={`${styles.chartCard} glass`}>
          <div className={styles.cardHeader}>
            <Activity className={styles.cardIcon} />
            <h3>Appointment Trend</h3>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatChartDate} 
                  stroke="var(--text-muted)" 
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 26, 0.9)', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className={`${styles.scheduleCard} glass`}>
          <div className={styles.scheduleHeader}>
            <div className={styles.scheduleTitleGroup}>
              <h3>
                {selectedDate === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) 
                  ? "Today's Schedule" 
                  : `Schedule for ${selectedDate}`}
              </h3>
              {selectedDate !== new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) && (
                <button 
                  onClick={() => setSelectedDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))}
                  className={styles.resetTodayBtn}
                >
                  Back to Today
                </button>
              )}
            </div>
            
            <div className={styles.scheduleControls}>
              <div className={styles.dateSelectorWrapper}>
                <Calendar className={styles.calendarIcon} onClick={() => dateInputRef.current?.showPicker()} style={{ cursor: 'pointer' }} />
                <input 
                  ref={dateInputRef}
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search schedule..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.scheduleList}>
            {scheduleLoading ? (
              <div className={styles.noData} style={{ padding: '3rem 1rem' }}>
                <div className="spinner" style={{ width: 30, height: 30 }} />
                <p>Loading schedule...</p>
              </div>
            ) : filteredSchedule.length > 0 ? (
              filteredSchedule.map((app) => (
                <div key={app.id} className={styles.scheduleRow}>
                  <div className={styles.patientMain}>
                    <span className={styles.patientName}>{app.patientName}</span>
                    <span className={styles.patientPhone}>{app.phoneNumber}</span>
                  </div>
                  <div className={styles.timeBadge}>
                    <span>{app.time}</span>
                  </div>
                  <div className={`${styles.statusBadge} ${getStatusClass(app.status)}`}>
                    {app.status}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noData}>
                <p>
                  {searchQuery 
                    ? 'No matching appointments found' 
                    : selectedDate === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
                      ? "No appointments scheduled for today"
                      : `No appointments scheduled for ${selectedDate}`
                  }
                </p>
                {!searchQuery && (
                  <Link href="/book" className={styles.bookPrompt}>
                    <span>Book first patient</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
