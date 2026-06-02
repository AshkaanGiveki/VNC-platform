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

  const { data: recordings, isLoading } = useQuery({
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

  const recordingsList = recordings?.data?.data || [];

  return (
    <div>
      <h1>ضبط‌های ذخیره شده</h1>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className={styles.list}
      >
        {recordingsList.length === 0 ? (
          <div className={styles.noItem}>
            <NoItem />
          </div>
        ) : (
          recordingsList.map((r) => (
            <motion.div
              key={r._id}
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
            >
              <Card className={styles.recordingCard}>
                <div>
                  <p>
                    <strong>کاربر:</strong> {r.userId?.firstName} {r.userId?.lastName}
                  </p>
                  <p><strong>وضعیت:</strong> {r.status}</p>
                  <p><strong>مدت:</strong> {Math.round(r.duration / 60)} دقیقه</p>
                  <span className={styles.date}>{toJalali(r.createdAt)}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => deleteMutation.mutate(r._id)}
                >
                  حذف
                </Button>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}