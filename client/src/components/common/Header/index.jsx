// import { useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { useAuth } from '../../../hooks/useAuth';
// import { ROUTES } from '../../../config/routes';
// import styles from './index.module.scss';
// import notificationIcon from '../../../assets/icons/notification.png';
// import profileIcon from '../../../assets/icons/user.png';
// import logoutIcon from '../../../assets/icons/logout.png';

// export default function Header() {
//   const { user, handleLogout } = useAuth();
//   const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
//   const navigate = useNavigate();

//   return (
//     <motion.header
//       className={styles.header}
//       initial={{ y: -20, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//     >
//       <div className={styles.right}>
//         <h2 className={styles.greeting}>سلام، {user?.firstName || 'کاربر'}</h2>
//       </div>
//       <div className={styles.left}>
//         <img src={notificationIcon} onClick={() => navigate(ROUTES.USER_NOTIFICATIONS)} className={`icon ${styles.notifIcon}`} alt='اعلان‌ها' />
//         <img src={profileIcon} onClick={() => navigate(ROUTES.PROFILE)} className={`icon ${styles.profileIcon}`} alt='اطلاعات حساب کاربری' />
//         <img src={logoutIcon} onClick={handleLogout} className={`icon ${styles.logoutIcon}`} alt='خروج' />
//       </div>
//     </motion.header>
//   );
// }

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../../services/notificationService';
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

  // Fetch unread count only (limit 1, use meta.total)
  const { data: notifData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => getNotifications({ unreadOnly: true, limit: 1 }),
    refetchInterval: 10000, // optional: poll every 10s
  });
  const unreadCount = notifData?.data?.meta?.total || 0;

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
        <div className={styles.notifWrapper} onClick={() => navigate(ROUTES.USER_NOTIFICATIONS)}>
          <img src={notificationIcon} className={`icon ${styles.notifIcon}`} alt="اعلان‌ها" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                className={styles.badge}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <img src={profileIcon} onClick={() => navigate(ROUTES.PROFILE)} className={`icon ${styles.profileIcon}`} alt="اطلاعات حساب کاربری" />
        <img src={logoutIcon} onClick={handleLogout} className={`icon ${styles.logoutIcon}`} alt="خروج" />
      </div>
    </motion.header>
  );
}