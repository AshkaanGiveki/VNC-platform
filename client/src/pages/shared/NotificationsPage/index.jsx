import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
    markAsRead,
    markAllAsRead,
} from '../../../services/notificationService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { toJalali } from '../../../utils/formatDate';
import styles from './index.module.scss';
import { notificationCategories } from '../../../locales/fa';
import NoItem from '../../../components/common/NoItem';

export default function NotificationsPage({ fetchFn }) {
    const queryClient = useQueryClient();
    const { user } = useSelector((state) => state.auth);
    const currentUserId = user?.userId;

    const [readIds, setReadIds] = useState(new Set());
    const initialFetchDone = useRef(false);

    // Unique key per user: prevents cross‑account data leakage
    const queryKey = ['notifications', 'list', fetchFn.name, currentUserId];

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: () => fetchFn({ limit: 50 }),
        staleTime: 0,               // always refetch when the page is visited
        enabled: !!currentUserId,    // wait until we know who the user is
    });

    useEffect(() => {
        if (data?.data?.data) {
            if (!initialFetchDone.current) {
                initialFetchDone.current = true;
                return;
            }
            setReadIds((prev) => {
                const next = new Set(prev);
                data.data.data.forEach((n) => {
                    if (n.isRead && next.has(n._id)) {
                        next.delete(n._id);
                    }
                });
                return next;
            });
        }
    }, [data]);

    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onMutate: (id) => {
            setReadIds((prev) => new Set(prev).add(id));
        },
        onError: (err, id) => {
            setReadIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            toast.error('خطا در علامت‌گذاری به عنوان خوانده شده');
        },
        onSettled: () => {
            queryClient.invalidateQueries(queryKey);
            queryClient.invalidateQueries(['headerUnreadCount', currentUserId]);
            queryClient.invalidateQueries(['unreadNotificationsCount', currentUserId]);
        },
    });

    const handleMarkAll = async () => {
        const allIds = data?.data?.data?.map((n) => n._id) || [];
        setReadIds((prev) => new Set([...prev, ...allIds]));

        try {
            await markAllAsRead();
        } catch {
            toast.error('خطا در علامت‌گذاری همه');
        }
        queryClient.invalidateQueries(queryKey);
        queryClient.invalidateQueries(['headerUnreadCount', currentUserId]);
        queryClient.invalidateQueries(['unreadNotificationsCount', currentUserId]);
    };

    const isUnread = useCallback(
        (notification) => {
            if (readIds.has(notification._id)) return false;
            return !notification.isRead;
        },
        [readIds],
    );

    if (isLoading) return <Loader />;

    return (
        <div>
            <div className={styles.header}>
                <h1>اعلان‌ها</h1>
                <Button variant="secondary" onClick={handleMarkAll}>
                    خواندن همه
                </Button>
            </div>
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className={styles.list}
            >
                {data?.data?.data?.length === 0 ? (
                    <div className={styles.noItem}>
                        <NoItem />
                    </div>
                ) : (
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
                                    onClick={() => {
                                        if (unread) {
                                            markReadMutation.mutate(n._id);
                                        }
                                    }}
                                >
                                    <div>
                                        <span className={styles.topPart}>
                                            <h4>{n.title}</h4>
                                            <div className={styles.indicator}></div>
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
                    })
                )}
            </motion.div>
        </div>
    );
}