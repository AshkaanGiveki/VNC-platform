import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecordings, deleteRecording } from '../../../services/recordingService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { toJalali } from '../../../utils/formatDate';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';

export default function UserRecordings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => getRecordings({ limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecording,
    onSuccess: () => queryClient.invalidateQueries(['recordings']),
  });

  if (isLoading) return <Loader />;

  return (
    <div>
      <h1>ضبط‌ها</h1>
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className={styles.list}>
        {data?.data?.data?.length === 0 ?
          <div className={styles.noItem}>
            <NoItem />
          </div> :
          data?.data?.data?.map((r) => (
            <motion.div key={r._id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
              <Card className={styles.card}>
                <div>
                  <h4>نشست {r.sessionId}</h4>
                  <p>وضعیت: {r.status} | مدت: {Math.round(r.duration / 60)} دقیقه</p>
                  <p className={styles.date}>{toJalali(r.createdAt)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => deleteMutation.mutate(r._id)}>حذف</Button>
              </Card>
            </motion.div>
          ))}
      </motion.div>
    </div>
  );
}