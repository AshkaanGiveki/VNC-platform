import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../../../services/notificationService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import { motion } from 'framer-motion';
import { toJalali } from '../../../utils/formatDate';
import styles from './index.module.scss';
import { notificationCategories } from '../../../locales/fa';
import NoItem from '../../../components/common/NoItem';

export default function UserNotifications() {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?.userId;

  const { data, isLoading } = useQuery({
    queryKey: ['userNotifications'],
    queryFn: () => getNotifications({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries(['userNotifications']),
  });

  const isUnread = (notification) =>
    !notification.readBy?.some((r) => r.userId === currentUserId);

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className={styles.header}>
        <h1>اعلان‌ها</h1>
        <Button
          variant="secondary"
          onClick={async () => {
            await markAllAsRead();
            queryClient.invalidateQueries(['userNotifications']);
          }}
        >
          خواندن همه
        </Button>
      </div>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className={styles.list}
      >

        {data?.data?.data?.length === 0 ?
          <div className={styles.noItem}>
            <NoItem />
          </div> :
          data?.data?.data?.map((n) => {
            const unread = isUnread(n);
            return (
              <motion.div
                key={n._id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 },
                }}
              >
                <Card
                  className={`${styles.card} ${unread ? styles.unread : styles.read}`}
                  onClick={() => markReadMutation.mutate(n._id)}
                >
                  <div>
                    <span className={styles.topPart}>
                      <h4>{n.title}</h4>
                      {/* Always render the indicator so it can shrink */}
                      <div
                        className={styles.indicator}
                      ></div>
                    </span>
                    <p>{n.body}</p>
                    <span className={styles.date}>{toJalali(n.createdAt)}</span>
                  </div>
                  <div>
                    <div className={`${styles.category} ${styles[n.category] || ''}`}>
                      {notificationCategories[n.category] || n.category}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
      </motion.div>
    </div>
  );
}