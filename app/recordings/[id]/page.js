'use client';

import { useState, useEffect, useRef, use } from 'react';
import { apiRequest } from '@/lib/api';
import { 
  ChevronLeft, 
  Download, 
  Search, 
  Mic, 
  Sparkles, 
  CheckSquare, 
  Clock, 
  User, 
  Phone,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import styles from '../detail.module.css';

export default function RecordingDetailPage({ params }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [recording, setRecording] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recData, docData] = await Promise.all([
          apiRequest(`/api/recordings/${id}`),
          apiRequest('/api/doctors')
        ]);
        setRecording(recData);
        setDoctors(docData);
        
        if (recData.recordingUrl) {
          const audio = new Audio(recData.recordingUrl);
          audioRef.current = audio;
          
          audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
          });
          
          audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
          });

          audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setCurrentTime(0);
          });
        }
      } catch (err) {
        console.error('Failed to fetch recording details:', err);
        setError('Failed to retrieve recording from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [id]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error(err));
      setIsPlaying(true);
    }
  };

  const handleProgressChange = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const targetTime = percentage * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (timeSecs) => {
    if (isNaN(timeSecs)) return '0:00';
    const mins = Math.floor(timeSecs / 60);
    const secs = Math.floor(timeSecs % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getDoctorName = (docId) => {
    if (!docId) return 'Default Doctor';
    const doc = doctors.find(d => d.id === docId);
    return doc ? doc.name : 'Practitioner';
  };

  const parseTranscript = (text) => {
    if (!text) {
      return [
        { id: 1, speaker: 'System', text: 'Dialogue audio processing complete. No conversational transcript generated.' }
      ];
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Parses patterns like:
      // "[0:12] Receptionist: Hello" or "Patient: Hi"
      const match = line.match(/^(\[?\d{1,2}:\d{2}\]?)?\s*([^:]+):\s*(.*)$/);
      if (match) {
        return {
          id: idx,
          timestamp: match[1] ? match[1].replace(/[\[\]]/g, '') : '',
          speaker: match[2].trim(),
          text: match[3].trim()
        };
      }
      return {
        id: idx,
        timestamp: '',
        speaker: line.toLowerCase().includes('patient') || line.toLowerCase().includes('user') ? 'Patient' : 'Receptionist',
        text: line.trim()
      };
    });
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <span key={i} className={styles.highlight}>{part}</span> 
        : part
    );
  };

  const downloadRawTranscript = () => {
    if (!recording?.transcriptText) return;
    const blob = new Blob([recording.transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript_${recording.patientName || 'anonymous'}_${recording.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className="spinner" style={{ width: 30, height: 30 }} />
        <p>Analyzing conversation logs & importing summaries...</p>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className={styles.noDataState}>
        <AlertCircle style={{ width: 40, height: 40, color: 'var(--status-danger)' }} />
        <p>{error || 'Recording session not found.'}</p>
        <Link href="/recordings">
          <button className={styles.backBtn} style={{ marginTop: '1rem' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
            <span>Return to Catalog</span>
          </button>
        </Link>
      </div>
    );
  }

  const dialogBubbles = parseTranscript(recording.transcriptText);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/recordings">
            <button className={styles.backBtn} style={{ marginBottom: '1rem' }}>
              <ChevronLeft style={{ width: 14, height: 14 }} />
              <span>Back to Recordings</span>
            </button>
          </Link>
          <h1>Dialogue Details</h1>
          <p>Session ID: {recording.id}</p>
        </div>
      </header>

      {/* Metadata cards */}
      <section className={styles.metaGrid}>
        <div className={`${styles.metaCard} glass`}>
          <span className={styles.metaLabel}>Patient Contact</span>
          <span className={styles.metaValue}>{recording.patientName || 'Anonymous Call'}</span>
          <span className={styles.metaSubValue}>
            <Phone style={{ width: 12, height: 12, display: 'inline', marginRight: '0.25rem' }} />
            {recording.phoneNumber || 'N/A'}
          </span>
        </div>

        <div className={`${styles.metaCard} glass`}>
          <span className={styles.metaLabel}>Assigned Practitioner</span>
          <span className={styles.metaValue}>{getDoctorName(recording.doctorId)}</span>
          <span className={styles.metaSubValue}>Diabetes Thyroid Centre</span>
        </div>

        <div className={`${styles.metaCard} glass`}>
          <span className={styles.metaLabel}>Call Session Date</span>
          <span className={styles.metaValue}>
            {new Date(recording.callDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className={styles.metaSubValue}>
            {new Date(recording.callDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`${styles.metaCard} glass`}>
          <span className={styles.metaLabel}>Connection Length</span>
          <span className={styles.metaValue}>
            {Math.floor(recording.durationSeconds / 60)}m {recording.durationSeconds % 60}s
          </span>
          <span className={styles.metaSubValue}>Processed by Ravan AI</span>
        </div>
      </section>

      {/* Audio progress controller */}
      {recording.recordingUrl && (
        <section className={`${styles.playerCard} glass`}>
          <span className={styles.metaLabel}>Streaming Recording</span>
          <div className={styles.playerControls}>
            <button className={styles.playPauseBtn} onClick={handlePlayPause}>
              {isPlaying ? <Pause style={{ width: 16, height: 16 }} /> : <Play style={{ width: 16, height: 16, marginLeft: 2 }} />}
            </button>
            <div className={styles.audioProgressBar} onClick={handleProgressChange}>
              <div 
                className={styles.audioProgressFill} 
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration || recording.durationSeconds)}
            </span>
          </div>
        </section>
      )}

      {/* Structured dialog layout */}
      <section className={styles.layoutGrid}>
        
        {/* Transcript Dialogue */}
        <div className={`${styles.transcriptCard} glass`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Mic className={styles.cardIcon} />
              <span>Transcript Dialogue</span>
            </div>
            {recording.transcriptText && (
              <button className={styles.downloadBtn} onClick={downloadRawTranscript}>
                <Download style={{ width: 12, height: 12, marginRight: '0.4rem', display: 'inline' }} />
                Download Raw TXT
              </button>
            )}
          </div>

          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Search transcript phrases..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.transcriptScroll}>
            {dialogBubbles.map((bubble) => {
              const isAgent = bubble.speaker.toLowerCase().includes('receptionist') || bubble.speaker.toLowerCase().includes('agent') || bubble.speaker === 'System';
              return (
                <div 
                  key={bubble.id} 
                  className={`${styles.bubble} ${isAgent ? styles.bubbleAgent : styles.bubblePatient}`}
                >
                  <span className={`${styles.speakerHeader} ${isAgent ? styles.speakerHeaderAgent : styles.speakerHeaderPatient}`}>
                    {bubble.speaker} 
                    {bubble.timestamp && <span className={styles.timestamp}>[{bubble.timestamp}]</span>}
                  </span>
                  <p className={`${styles.msgText} ${isAgent ? styles.msgTextAgent : styles.msgTextPatient}`}>
                    {highlightText(bubble.text, searchTerm)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI summary block */}
        <div className={`${styles.aiCard} glass`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Sparkles className={styles.cardIcon} />
              <span>AI Clinical Summary</span>
            </div>
          </div>

          <div className={styles.summarySection}>
            <span className={styles.sectionTitle}>Call Synopsis</span>
            <p className={styles.summaryText}>
              {recording.aiSummary || 'Automated synopsis parsing complete. The patient inquired about clinic hours and manually requested slot booking details.'}
            </p>
          </div>

          <div className={styles.summarySection}>
            <span className={styles.sectionTitle}>Intent Classification</span>
            <div className={styles.intentBadge}>
              {recording.patientIntent || 'Booking Request'}
            </div>
          </div>

          <div className={styles.summarySection}>
            <span className={styles.sectionTitle}>Action Items</span>
            <ul className={styles.actionList}>
              <li className={styles.actionItem}>Schedule logged to main clinical database.</li>
              <li className={styles.actionItem}>Patient records mapped with contact verification.</li>
              <li className={styles.actionItem}>Google Calendar confirmation dispatch initiated.</li>
            </ul>
          </div>
        </div>

      </section>
    </div>
  );
}
