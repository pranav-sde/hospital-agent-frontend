'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  FileText, 
  Search, 
  AlertCircle, 
  Clock, 
  Calendar,
  Users,
  Mic
} from 'lucide-react';
import styles from './recordings.module.css';

export default function RecordingsPage() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Audio Playback
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // 1. Fetch active doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await apiRequest('/api/doctors');
        setDoctors(data);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  // 2. Fetch recordings
  const fetchRecordings = async () => {
    setLoading(true);
    try {
      let query = `?page=${page}&size=20`;
      
      // If doctor role, restrict to their doctorId
      if (user?.role === 'DOCTOR') {
        query += `&doctorId=${user.doctorId}`;
      } else if (doctorFilter) {
        query += `&doctorId=${doctorFilter}`;
      }

      const res = await apiRequest(`/api/recordings${query}`);
      setRecordings(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [page, doctorFilter, user]);

  // Apply local phone filter since backend pagination is fast
  const filteredRecordings = recordings.filter(rec => {
    if (!search) return true;
    return rec.phoneNumber?.includes(search) || rec.patientName?.toLowerCase().includes(search.toLowerCase());
  });

  const handlePlayPause = (rec) => {
    if (!rec.recordingUrl) {
      alert('No audio URL associated with this call.');
      return;
    }

    if (currentPlayingId === rec.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => console.error(err));
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(rec.recordingUrl);
      audioRef.current = audio;
      setCurrentPlayingId(rec.id);
      setIsPlaying(true);
      
      audio.play().catch(err => {
        console.error('Audio play failed:', err);
        alert('Could not stream recording from remote host.');
        setIsPlaying(false);
      });

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const getDoctorName = (id) => {
    if (!id) return 'Default Doctor';
    const doc = doctors.find(d => d.id === id);
    return doc ? doc.name : 'Practitioner';
  };

  const formatDuration = (secs) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Call Recordings</h1>
        <p>Review voice agent audio logs, transcript dialogues, and automated clinical summaries</p>
      </header>

      {/* Filter card */}
      <section className={`${styles.filterCard} glass`}>
        <div className={styles.filterGroup}>
          <div className={styles.searchWrapper}>
            <Search className={styles.filterIcon} />
            <input 
              type="text" 
              placeholder="Search patient name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isAdmin && (
            <div className={styles.selectWrapper}>
              <Users className={styles.filterIcon} />
              <select value={doctorFilter} onChange={(e) => { setDoctorFilter(e.target.value); setPage(0); }}>
                <option value="">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {(search || (isAdmin && doctorFilter)) && (
            <button 
              className={styles.clearBtn}
              onClick={() => {
                setSearch('');
                setDoctorFilter('');
                setPage(0);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Table grid */}
      <section className={`${styles.tableCard} glass`}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className="spinner" style={{ width: 30, height: 30 }} />
            <p>Retrieving call ledger records...</p>
          </div>
        ) : filteredRecordings.length > 0 ? (
          <>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Contact Phone</th>
                    {isAdmin && <th>Assigned Doctor</th>}
                    <th>Call Timestamp</th>
                    <th>Duration</th>
                    <th>Audio Link</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecordings.map((rec) => {
                    const isCurrentPlaying = currentPlayingId === rec.id && isPlaying;
                    return (
                      <tr key={rec.id} className={styles.tableRow}>
                        <td className={styles.patientCell}>{rec.patientName || 'Anonymous Call'}</td>
                        <td className={styles.phoneCell}>{rec.phoneNumber || 'N/A'}</td>
                        {isAdmin && (
                          <td>
                            <span className={styles.doctorBadge}>
                              {getDoctorName(rec.doctorId)}
                            </span>
                          </td>
                        )}
                        <td>{formatDate(rec.callDate)}</td>
                        <td className={styles.duration}>{formatDuration(rec.durationSeconds)}</td>
                        <td className={styles.audioCol}>
                          <div className={styles.miniPlayer}>
                            <button 
                              className={styles.playPauseBtn} 
                              onClick={() => handlePlayPause(rec)}
                              title={isCurrentPlaying ? 'Pause Stream' : 'Play Audio'}
                            >
                              {isCurrentPlaying ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14, marginLeft: 2 }} />}
                            </button>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {isCurrentPlaying ? 'Streaming...' : 'Audio Stream'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={rec.status === 'COMPLETED' ? styles.statusCompleted : styles.statusFailed}>
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/recordings/${rec.id}`}>
                            <button className={styles.viewBtn}>
                              <FileText style={{ width: 14, height: 14 }} />
                              <span>Dialogue Details</span>
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                Showing page {page + 1} of {totalPages || 1} ({totalElements} calls total)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={styles.pageBtn} 
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <button 
                  className={styles.pageBtn} 
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.noDataState}>
            <Mic className={styles.noDataIcon} />
            <p>No call logs found matching current configuration.</p>
          </div>
        )}
      </section>
    </div>
  );
}
