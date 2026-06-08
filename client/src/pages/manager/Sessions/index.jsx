import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrgSessions, stopSession, pauseSession, resumeSession } from '../../../services/sessionService';
import apiClient from '../../../services/apiClient';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';
import { sessionStatus } from '../../../locales/fa';

export default function ManagerSessions() {
    const { user } = useSelector((state) => state.auth);
    const orgId = user?.organizationId;
    const queryClient = useQueryClient();

    // Fetch only running & paused sessions
    const { data: sessions, isLoading } = useQuery({
        queryKey: ['orgSessions', orgId, 'running,paused'],
        queryFn: () => getOrgSessions(orgId, { status: 'running,paused', limit: 100 }),
        enabled: !!orgId,
    });

    const stopMutation = useMutation({
        mutationFn: stopSession,
        onSuccess: () => queryClient.invalidateQueries(['orgSessions']),
    });
    const pauseMutation = useMutation({
        mutationFn: pauseSession,
        onSuccess: () => queryClient.invalidateQueries(['orgSessions']),
    });
    const resumeMutation = useMutation({
        mutationFn: resumeSession,
        onSuccess: () => queryClient.invalidateQueries(['orgSessions']),
    });

    const startRecordingMutation = useMutation({
        mutationFn: (sessionId) =>
            apiClient.post(`/organizations/${orgId}/sessions/${sessionId}/recording/start`),
        onSuccess: () => {
            queryClient.invalidateQueries(['orgSessions']);
            toast.success('ضبط شروع شد');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
    });

    const stopRecordingMutation = useMutation({
        mutationFn: (sessionId) =>
            apiClient.post(`/organizations/${orgId}/sessions/${sessionId}/recording/stop`),
        onSuccess: () => {
            queryClient.invalidateQueries(['orgSessions']);
            toast.success('ضبط متوقف شد');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
    });

    if (isLoading) return <Loader />;

    const activeSessions = sessions?.data?.data || [];

    return (
        <div>
            <h1>نشست‌های فعال</h1>
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className={styles.list}
            >
                {activeSessions.length === 0 ? (
                    <div className={styles.noItem}>
                        <NoItem />
                    </div>
                ) : (
                    activeSessions.map((s) => (
                        <motion.div
                            key={s._id}
                            variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                        >
                            <Card className={styles.sessionCard}>
                                <div className={styles.info}>
                                    <h4>{s.workspaceId?.name || 'بدون نام'}</h4>
                                    <p className={styles.user}>
                                        کاربر: {s.userId?.firstName} {s.userId?.lastName}
                                    </p>
                                    <p className={styles.status}>
                                        وضعیت: {sessionStatus[s.status] || s.status}
                                    </p>
                                </div>
                                <div className={styles.actions}>
                                    {s.status === 'running' && (
                                        <>
                                            {!s.recordingId ? (
                                                <Button size="sm" onClick={() => startRecordingMutation.mutate(s._id)}>
                                                    شروع ضبط
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="secondary" onClick={() => stopRecordingMutation.mutate(s._id)}>
                                                    توقف ضبط
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {s.status === 'paused' && (
                                        <Button size="sm" variant="secondary" onClick={() => resumeMutation.mutate(s._id)}>
                                            ادامه
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </div>
    );
}