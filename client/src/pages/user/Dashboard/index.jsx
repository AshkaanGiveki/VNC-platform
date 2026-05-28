import { useQuery } from '@tanstack/react-query';
import { getUserSessions } from '../../../services/sessionService';
import { getNotifications } from '../../../services/notificationService';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styles from './index.module.scss';
import { toJalali } from '../../../utils/formatDate';

export default function UserDashboard() {
  const { user } = useSelector((state) => state.auth);
  const { data: sessions, isLoading: sessLoading } = useQuery({
    queryKey: ['userSessions'],
    queryFn: () => getUserSessions({ status: 'running' }),
  });
  const { data: notifications, isLoading: notifLoading } = useQuery({
    queryKey: ['userNotifications'],
    queryFn: () => getNotifications({ unreadOnly: true, limit: 5 }),
  });

  if (sessLoading || notifLoading) return <Loader fullScreen />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.dashboard}>
      <h1>سلام، {user?.firstName}</h1>
      <div className={styles.grid}>
        <Card>
          <h3>نشست‌های فعال</h3>
          <p className={styles.count}>{sessions?.data?.data?.length || 0}</p>
          <Link to="/user/sessions">مشاهده همه</Link>
        </Card>
        <Card>
          <h3>اعلان‌های خوانده نشده</h3>
          <p className={styles.count}>{notifications?.data?.data?.length || 0}</p>
          <Link to="/user/notifications">مشاهده همه</Link>
        </Card>
      </div>
    </motion.div>
  );
}