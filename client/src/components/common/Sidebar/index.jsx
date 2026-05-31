import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../../redux/slices/uiSlice';
import { logout } from '../../../redux/slices/authSlice';
import useTheme from '../../../hooks/useTheme';
import { ROUTES } from '../../../config/routes';
import { cn } from '../../../utils/cn';
import styles from './index.module.scss';
import { useAuth } from '../../../hooks/useAuth';
import dashboard from '../../../assets/icons/dashboard.png';
import organizations from '../../../assets/icons/organizations.png';
import images from '../../../assets/icons/images.png';
import logs from '../../../assets/icons/logs.png';
import users from '../../../assets/icons/users.svg';
import workspaces from '../../../assets/icons/workspaces.png';
import policies from '../../../assets/icons/policies.png';
import sessions from '../../../assets/icons/sessions.png';
import recordings from '../../../assets/icons/recordings.png';
import notifications from '../../../assets/icons/notification.png';
import themeIcon from '../../../assets/icons/theme.png';
import sendNotif from '../../../assets/icons/sendNotif.png';

const menuItems = {
  superadmin: [
    { path: ROUTES.ADMIN_DASHBOARD, icon: dashboard, label: 'داشبورد' },
    { path: ROUTES.ADMIN_ORGANIZATIONS, icon: organizations, label: 'سازمان‌ها' },
    { path: ROUTES.ADMIN_IMAGES, icon: images, label: 'تصاویر' },
    { path: ROUTES.ADMIN_LOGS, icon: logs, label: 'گزارشات' },
    { path: ROUTES.ADMIN_NOTIFICATIONS, icon: notifications, label: 'اعلان‌ها' },
    { path: ROUTES.ADMIN_SEND_NOTIFICATION, icon: sendNotif, label: 'ارسال اعلان' },
  ],
  org_admin: [
    { path: ROUTES.MANAGER_DASHBOARD, icon: dashboard, label: 'داشبورد' },
    { path: ROUTES.MANAGER_USERS, icon: users, label: 'کاربران' },
    { path: ROUTES.MANAGER_WORKSPACES, icon: workspaces, label: 'فضاهای کاری' },
    { path: ROUTES.MANAGER_POLICIES, icon: policies, label: 'قوانین' },
    { path: ROUTES.MANAGER_NOTIFICATIONS, icon: notifications, label: 'اعلان‌ها' },
  ],
  user: [
    { path: ROUTES.USER_DASHBOARD, icon: dashboard, label: 'داشبورد' },
    { path: ROUTES.USER_WORKSPACES, icon: workspaces, label: 'فضاهای کاری' },
    { path: ROUTES.USER_SESSIONS, icon: sessions, label: 'نشست‌ها' },
    { path: ROUTES.USER_RECORDINGS, icon: recordings, label: 'ضبط‌ها' },
    { path: ROUTES.USER_NOTIFICATIONS, icon: notifications, label: 'اعلان‌ها' },
  ],
   manager: [
    { path: ROUTES.MANAGER_DASHBOARD, icon: dashboard, label: 'داشبورد' },
    // { path: ROUTES.MANAGER_USERS, icon: users, label: 'کاربران' },
    // { path: ROUTES.MANAGER_WORKSPACES, icon: workspaces, label: 'فضاهای کاری' },
    // { path: ROUTES.MANAGER_POLICIES, icon: policies, label: 'قوانین' },
    { path: ROUTES.MANAGER_NOTIFICATIONS, icon: notifications, label: 'اعلان‌ها' },
  ],
};

export default function Sidebar() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const { theme, switchTheme } = useTheme();

  const items = user ? menuItems[user.role] : [];
  const dashboardPath = items.length > 0 ? items[0].path : '';

  return (
    <>
      <motion.aside
        className={cn(styles.sidebar, !sidebarOpen && styles.collapsed)}
        initial={false}
        animate={{ width: sidebarOpen ? 250 : 80 }}
      >
        <div className={styles.logo}>VWP</div>
        <nav className={styles.nav}>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === dashboardPath}
              className={({ isActive }) =>
                cn(styles.link, isActive && styles.active)
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      className={styles.activeIndicator}
                      layoutId="activeSidebarLink"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <img className={`${styles.icon} icon`} src={item.icon} />
                  {sidebarOpen && (
                    <span className={styles.label}>{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className={styles.bottom}>
          <button onClick={switchTheme} className={styles.iconBtn}>
            <img src={themeIcon} alt='theme'  className={`${styles.themeIcon} icon`}/>
          </button>
        </div>
        
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className={styles.mobileNav}>
        {items.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(styles.mobileLink, isActive && styles.active)
            }
          >
            <span>{item.icon}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}