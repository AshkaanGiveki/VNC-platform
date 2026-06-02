import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startSession } from '../../../services/sessionService';
import { getMyWorkspaces } from '../../../services/workspaceService';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';


export default function UserWorkspaces() {
    const { user } = useSelector((state) => state.auth);
    const orgId = user?.organizationId;
    const queryClient = useQueryClient();
    const [startingWorkspace, setStartingWorkspace] = useState(null); // workspaceId currently starting
    const [progress, setProgress] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['myWorkspaces', orgId],
        queryFn: () => getMyWorkspaces(orgId),
        enabled: !!orgId,
    });

    const startMutation = useMutation({
        mutationFn: startSession,
        onSuccess: (data) => {
            // data contains the session ID, but we can just invalidate queries
            toast.success('نشست شروع شد');
            queryClient.invalidateQueries(['userSessions']);
            setStartingWorkspace(null);
            setProgress(0);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'خطا');
            setStartingWorkspace(null);
            setProgress(0);
        },
    });

    // Listen to session progress events when a workspace is starting
    useEffect(() => {
        if (!startingWorkspace || !startMutation.data) return;
        const sessionId = startMutation.data?.data?.sessionId; // depends on backend response
        if (!sessionId) return;

        const eventSource = new EventSource(
            `/api/v1/sessions/${sessionId}/events`
        );
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setProgress(data.progress || 0);
            if (data.status === 'running' || data.status === 'error') {
                eventSource.close();
            }
        };
        eventSource.onerror = () => {
            eventSource.close();
        };
        return () => eventSource.close();
    }, [startingWorkspace, startMutation.data]);

    if (isLoading) return <Loader />;

    return (
        <div>
            <h1>فضاهای کاری من</h1>
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
                    data?.data?.data?.map((ws) => {
                        console.log(ws);
                        const isStarting = startingWorkspace === ws._id;
                        const imageUrl =
                            ws.imageId?.iconUrl || '/assets/images/default-workspace.png';

                        return (
                            <motion.div
                                key={ws._id}
                                variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                            >
                                <Card className={styles.card}>
                                    <div className={styles.workspaceInfo}>
                                        <img
                                            src={imageUrl}
                                            alt={ws.name}
                                            className={styles.workspaceImage}
                                            onError={(e) => {
                                                e.target.src = '/assets/images/default-workspace.png';
                                            }}
                                        />
                                        <div>
                                            <h3>{ws.name}</h3>
                                            <p>{ws.imageId?.name || 'بدون تصویر'}</p>
                                        </div>
                                    </div>
                                    <div className={styles.action}>
                                        {isStarting ? (
                                            <Loader theme='honeycomb' />
                                        ) : (
                                            <button
                                                className={styles.startButton}
                                                onClick={() => {
                                                    setStartingWorkspace(ws._id);
                                                    startMutation.mutate(ws._id);
                                                }}
                                                disabled={startMutation.isLoading}
                                            >
                                                شروع نشست
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
            </motion.div>
        </div>
    );
}