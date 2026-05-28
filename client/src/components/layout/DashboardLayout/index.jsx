import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Sidebar from '../../common/Sidebar';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import styles from './index.module.scss';

export default function DashboardLayout() {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={`${styles.mainArea} ${sidebarOpen ? '' : styles.collapsed}`}>
        <Header />
        <motion.main
          className={styles.content}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
        <Footer />
      </div>
    </div>
  );
}