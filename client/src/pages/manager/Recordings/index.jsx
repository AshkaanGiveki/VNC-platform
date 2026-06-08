import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecordings, deleteRecording } from '../../../services/recordingService';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { toJalali } from '../../../utils/formatDate';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';

export default function ManagerRecordings() {
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organizationId;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['recordings', orgId],
    queryFn: () => getRecordings({ organizationId: orgId }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecording,
    onSuccess: () => {
      queryClient.invalidateQueries(['recordings']);
      toast.success('ضبط حذف شد');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  if (isLoading) return <Loader />;

  const recordings = data?.data?.data || [];
  console.log(recordings);

  return (
    <div>
      <h1>ضبط‌های ذخیره شده</h1>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className={styles.list}
      >
        {recordings.length === 0 ? (
          <NoItem />
        ) : (
          recordings.map((r) => (
            <motion.div
              key={r._id}
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
            >
              <Card className={styles.recordingCard}>
                <div className={styles.right}>
                  <p className={styles.userName}>
                    {r.userId?.firstName} {r.userId?.lastName}
                  </p>
                  <p className={styles.size}> {r.size
                    ? r.size < 1048576
                      ? `${Math.round(r.size / 1024)} کیلوبایت`
                      : `${Math.round(r.size / 1048576)} مگابایت`
                    : '—'}
                  </p>
                  <span className={styles.date}>{toJalali(r.createdAt)}</span>
                </div>
                <div className={styles.left}>
                  <p className={styles.status}>{r.status === 'ready' ? 'آماده' : r.status === 'recording' ? 'در حال ضبط' : r.status === 'processing' ? 'در حال پردازش' : 'ناموفق'}</p>
                  <div className={styles.action}>
                    {
                      r.status === 'ready' && r.downloadUrl && (
                        <div className={styles.download} onClick={() => window.open(r.downloadUrl, '_blank')}>
                          دانلود
                        </div>
                      )}
                    <div className={styles.remove} onClick={() => deleteMutation.mutate(r._id)}>
                      حذف
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}