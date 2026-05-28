import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startSession } from '../../../services/sessionService';
import { getMyWorkspaces } from '../../../services/workspaceService';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function UserWorkspaces() {
    const { user } = useSelector((state) => state.auth);
    const orgId = user?.organizationId;
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['myWorkspaces', orgId],
        queryFn: () => getMyWorkspaces(orgId),
        enabled: !!orgId,
    });

    const startMutation = useMutation({
        mutationFn: startSession,
        onSuccess: () => {
            toast.success('نشست شروع شد');
            queryClient.invalidateQueries(['userSessions']);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
    });

    if (isLoading) return <Loader />;

    return (
        <div>
            <h1>فضاهای کاری من</h1>
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className={styles.list}>
                {data?.data?.data?.map((ws) => (
                    <motion.div key={ws._id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                        <Card className={styles.card}>
                            <div>
                                <h3>{ws.name}</h3>
                                <p>{ws.imageId?.name || 'بدون تصویر'}</p>
                            </div>
                            <Button onClick={() => startMutation.mutate(ws._id)}>شروع نشست</Button>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}