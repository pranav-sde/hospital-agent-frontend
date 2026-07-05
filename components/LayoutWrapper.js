'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import styles from './LayoutWrapper.module.css';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isLoginPage = pathname === '/login' || pathname === '/signup';

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // If login page or not authenticated, render without sidebar
  if (isLoginPage || !user) {
    return <main className={styles.fullWidth}>{children}</main>;
  }

  // Admin-only route guard
  const isAdminOnlyPage = pathname === '/doctors';
  if (isAdminOnlyPage && user.role !== 'ADMIN') {
    return (
      <div className={styles.layoutContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.deniedContainer}>
            <div className={`${styles.deniedCard} glass`}>
              <h2 className="text-red-500">Access Denied</h2>
              <p>You do not have administrative privileges to access this console.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
