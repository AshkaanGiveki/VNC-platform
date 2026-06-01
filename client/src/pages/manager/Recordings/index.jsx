import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecordings, deleteRecording } from '../../../services/recordingService';
import { getUserSessions } from '../../../services/sessionService'; // to list active sessions for recording
import apiClient from '../../../services/apiClient';
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

    const { data: sessions } = useQuery({
        queryKey: ['orgSessions', orgId],
        queryFn: () => getUserSessions({ status: 'running', limit: 50 }),
        enabled: !!orgId,
    });

    const startRecordingMutation = useMutation({
        mutationFn: (sessionId) => apiClient.post(`/organizations/${orgId}/sessions/${sessionId}/recording/start`),
        onSuccess: () => { queryClient.invalidateQueries(['recordings']); toast.success('ضبط شروع شد'); },
        onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
    });

    const stopRecordingMutation = useMutation({
        mutationFn: (sessionId) => apiClient.post(`/organizations/${orgId}/sessions/${sessionId}/recording/stop`),
        onSuccess: () => { queryClient.invalidateQueries(['recordings']); toast.success('ضبط متوقف شد'); },
        onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
    });

    if (isLoading) return <Loader />;

    return (
        <div>
            <h1>ضبط‌ها</h1>
            <div className={styles.section}>
                <h2>نشست‌های فعال</h2>
                <div className={styles.list}>
                    {sessions?.data?.data?.map((s) => (
                        <Card key={s._id} className={styles.sessionCard}>
                            <div>
                                <h4>{s.workspaceId?.name || 'بدون نام'}</h4>
                                <p>{s.userId?.firstName} {s.userId?.lastName}</p>
                            </div>
                            <div className={styles.actions}>
                                {!s.recordingId ? (
                                    <Button size="sm" onClick={() => startRecordingMutation.mutate(s._id)}>شروع ضبط</Button>
                                ) : (
                                    <Button size="sm" variant="secondary" onClick={() => stopRecordingMutation.mutate(s._id)}>توقف ضبط</Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <h2>ضبط‌های ذخیره شده</h2>
            <div className={styles.list}>
                {recordings?.data?.data?.length === 0 ?
                    <div className={styles.noItem}>
                        <NoItem />
                    </div> :
                    recordings?.data?.data?.map((r) => (
                        <Card key={r._id} className={styles.recordingCard}>
                            <div>
                                <p>کاربر: {r.userId?.firstName} {r.userId?.lastName}</p>
                                <p>وضعیت: {r.status}</p>
                                <p>مدت: {Math.round(r.duration / 60)} دقیقه</p>
                                <span className={styles.date}>{toJalali(r.createdAt)}</span>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => deleteRecording(r._id).then(() => queryClient.invalidateQueries(['recordings']))}>حذف</Button>
                        </Card>
                    ))}
            </div>
        </div>
    );
}