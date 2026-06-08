import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserSessions, stopSession, pauseSession, resumeSession } from '../../../services/sessionService';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import playIcon from '../../../assets/icons/play.png';
import pauseIcon from '../../../assets/icons/pause.svg';
import stopIcon from '../../../assets/icons/stop.png';
import fileIcon from '../../../assets/icons/folder.png';
import forceStopIcon from '../../../assets/icons/forceStop.png';
import { sessionStatus } from '../../../locales/fa';
import NoItem from '../../../components/common/NoItem';
import { Link } from 'react-router-dom';
import apiClient from '../../../services/apiClient';

export default function UserSessions() {
  const queryClient = useQueryClient();
  const [actingSessionId, setActingSessionId] = useState(null);   // track which session is being acted upon

  const { data, isLoading } = useQuery({
    queryKey: ['userSessions'],
    queryFn: () => getUserSessions({ limit: 50 }),
    refetchInterval: 10000,
  });

  const stopMutation = useMutation({
    mutationFn: stopSession,
    onMutate: (variables) => setActingSessionId(variables),   // <-- show spinner immediately
    onSuccess: () => queryClient.invalidateQueries(['userSessions']),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'خطا');
      setActingSessionId(null);
    },
    onSettled: () => setActingSessionId(null),   // <-- hide spinner when done (status will update on refetch)
  });

  const pauseMutation = useMutation({
    mutationFn: pauseSession,
    onMutate: (variables) => setActingSessionId(variables),
    onSuccess: () => queryClient.invalidateQueries(['userSessions']),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'خطا');
      setActingSessionId(null);
    },
    onSettled: () => setActingSessionId(null),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeSession,
    onMutate: (variables) => setActingSessionId(variables),
    onSuccess: () => queryClient.invalidateQueries(['userSessions']),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'خطا');
      setActingSessionId(null);
    },
    onSettled: () => setActingSessionId(null),
  });

  const forceStopMutation = useMutation({
    mutationFn: (sessionId) => apiClient.post(`/sessions/${sessionId}/force-stop`),
    onSuccess: () => {
      queryClient.invalidateQueries(['userSessions']);
      toast.success('نشست به‌اجبار متوقف شد');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const openSession = (sessionId) => {
    window.open(`/session/${sessionId}/`, '_blank');
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <h1>نشست‌ها</h1>
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
          data?.data?.data?.map((s) => {
            const isActing = actingSessionId === s._id;
            const imageUrl =
              s.workspaceId?.imageId?.iconUrl || '/assets/images/default-workspace.png';

            return (
              <motion.div
                key={s._id}
                variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
              >
                <Card className={styles.card}>
                  <div className={styles.sessionInfo}>
                    <img
                      src={imageUrl}
                      alt=""
                      className={styles.sessionImage}
                      onError={(e) => {
                        e.target.src = '/assets/images/default-workspace.png';
                      }}
                    />
                    <div>
                      <h3>{s.workspaceId?.name || 'بدون نام'}</h3>
                      <p className={styles.status}>
                        {/* {s.status === 'starting' && <span className={styles.spinner} />} */}
                        وضعیت: {sessionStatus[s.status] || s.status}
                      </p>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    {isActing ? (
                      <Loader theme='bars' />
                    ) : (
                      <>
                        {s.status === 'running' && (
                          <>
                            <div className={styles.buttonImg} onClick={() => openSession(s._id)}>
                              <img className="icon" src={playIcon} alt="اجرای نشست" title="باز کردن نشست" />
                            </div>
                            {/* <div className={styles.buttonImg} onClick={() => navigate(`/user/sessions/${s._id}/files`)}> */}
                            {/* <Link className={styles.buttonImg} onClick={() => window.open(`/user/sessions/${s._id}/files`)}> */}
                            <Link className={styles.buttonImg} to={`/user/sessions/${s._id}/files`}>
                              <img className='icon' src={fileIcon} alt="فایل‌ها" title="مدیریت فایل‌ها" />
                            </Link>

                            <div className={styles.buttonImg} onClick={() => pauseMutation.mutate(s._id)}>
                              <img className="icon" src={pauseIcon} alt="توقف موقت نشست" title="توقف موقت نشست" />
                            </div>
                            <div className={styles.buttonImg} onClick={() => stopMutation.mutate(s._id)}>
                              <img className="icon" src={stopIcon} alt="توقف کامل نشست" title="توقف کامل نشست" />
                            </div>
                            {s.status !== 'stopped' && s.status !== 'failed' && (
                              <div className={styles.buttonImg} onClick={() => {
                                if (confirm('آیا از توقف اجباری این نشست اطمینان دارید؟')) {
                                  forceStopMutation.mutate(s._id);
                                }
                              }}>
                                <img className="icon" src={forceStopIcon} alt="توقف اجباری" title="توقف اجباری نشست" />
                              </div>
                            )}
                          </>
                        )}
                        {s.status === 'paused' && (
                          <div className={styles.buttonImg} onClick={() => resumeMutation.mutate(s._id)}>
                            <img className="icon" src={playIcon} alt="ادامه نشست" title="ادامه نشست" />
                          </div>
                        )}
                        {s.status === 'starting' && (
                          <span className={styles.starting}>در حال راه‌اندازی...</span>
                        )}
                        {s.status === 'stopped' && (
                          <span className={styles.stopped}>پایان‌یافته</span>
                        )}
                        {s.status === 'failed' && (
                          <span className={styles.failed}>خطا در راه‌اندازی</span>
                        )}
                      </>
                    )}
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