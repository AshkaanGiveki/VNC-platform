import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../config/routes';
import styles from './index.module.scss';
import notificationIcon from '../../../assets/icons/notification.png';
import profileIcon from '../../../assets/icons/user.png';
import logoutIcon from '../../../assets/icons/logout.png';

export default function Header() {
  const { user, handleLogout } = useAuth();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const navigate = useNavigate();

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={styles.right}>
        <h2 className={styles.greeting}>سلام، {user?.firstName || 'کاربر'}</h2>
      </div>
      <div className={styles.left}>
        <img src={notificationIcon} onClick={() => navigate(ROUTES.USER_NOTIFICATIONS)} className={styles.notifIcon} alt='اعلان‌ها' />
        <img src={profileIcon} onClick={() => navigate(ROUTES.PROFILE)} className={styles.profileIcon} alt='اطلاعات حساب کاربری' />
        <img src={logoutIcon} onClick={handleLogout} className={styles.logoutIcon} alt='خروج' />
      </div>
    </motion.header>
  );
}