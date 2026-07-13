'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  CalendarRange, 
  CalendarPlus, 
  Settings, 
  LogOut, 
  Activity,
  Mic,
  Users,
  CalendarClock
} from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Appointments', icon: CalendarRange, path: '/appointments' },
    { name: 'Book Appointment', icon: CalendarPlus, path: '/book' },
    { name: 'Call Recordings', icon: Mic, path: '/recordings' },
    { name: 'Manage Doctors', icon: Users, path: '/doctors', role: 'ADMIN' },
    { name: 'My Availability', icon: CalendarClock, path: '/availability', role: 'DOCTOR' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.role) return true;
    return item.role === user?.role;
  });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Activity className={styles.brandIcon} />
        <div className={styles.brandText}>
          <h2>DTEC Admin</h2>
          <span className={styles.pulse}>● Live Agent</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <item.icon className={styles.icon} />
              <span>{item.name}</span>
              {isActive && <div className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.username || 'Admin'}</span>
            <span className={styles.userRole}>
              {user?.role === 'DOCTOR' ? 'Practitioner' : 'Administrator'}
            </span>
          </div>
        </div>
        
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut className={styles.logoutIcon} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
