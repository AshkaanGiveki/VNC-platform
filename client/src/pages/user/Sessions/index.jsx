// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { getUserSessions, stopSession, pauseSession, resumeSession } from '../../../services/sessionService';
// import Card from '../../../components/common/Card';
// import Button from '../../../components/common/Button';
// import Loader from '../../../components/common/Loader';
// import toast from 'react-hot-toast';
// import { motion } from 'framer-motion';
// import { SESSION_PROXY_URL } from '../../../config/api';
// import styles from './index.module.scss';
// import playIcon from '../../../assets/icons/play.png';
// import pauseIcon from '../../../assets/icons/pause.svg';
// import stopIcon from '../../../assets/icons/stop.png';
// import { sessionStatus } from '../../../locales/fa';

// export default function UserSessions() {
//   const queryClient = useQueryClient();
//   const { data, isLoading } = useQuery({
//     queryKey: ['userSessions'],
//     queryFn: () => getUserSessions({ limit: 50 }),
//   });

//   const stopMutation = useMutation({
//     mutationFn: stopSession,
//     onSuccess: () => queryClient.invalidateQueries(['userSessions']),
//   });
//   const pauseMutation = useMutation({
//     mutationFn: pauseSession,
//     onSuccess: () => queryClient.invalidateQueries(['userSessions']),
//   });
//   const resumeMutation = useMutation({
//     mutationFn: resumeSession,
//     onSuccess: () => queryClient.invalidateQueries(['userSessions']),
//   });

// const openSession = (sessionId) => {
//   window.open(`/session/${sessionId}/`, '_blank');
// };

//   if (isLoading) return <Loader />;

//   return (
//     <div>
//       <h1>نشست‌ها</h1>
//       <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className={styles.list}>
//         {data?.data?.data?.map((s) => (
//           <motion.div key={s._id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
//             <Card className={styles.card}>
//               <div>
//                 <h3>{s.workspaceId?.name || 'بدون نام'}</h3>
//                 <p className={styles.status}>وضعیت: {sessionStatus[s.status] || s.status}</p>
//               </div>
//               <div className={styles.actions}>
//                 {s.status === 'running' && (
//                   <>
//                     <div className={styles.buttonImg} onClick={() => openSession(s._id)}>
//                       <img src={playIcon} alt='اجرای نشست' title='باز کردن نشست' />
//                     </div>
//                     <div className={styles.buttonImg} onClick={() => pauseMutation.mutate(s._id)}>
//                       <img src={pauseIcon} alt='توقف موقت نشست' title='توقف موقت نشست' className={styles.pauseIcon} />
//                     </div>
//                     <div className={styles.buttonImg} onClick={() => stopMutation.mutate(s._id)}>
//                       <img src={stopIcon} alt='توقف کامل نشست' title='توقف کامل نشست' className={styles.stopIcon} />
//                     </div>
//                   </>
//                 )}
//                 {s.status === 'paused' && (
//                   <div className={styles.buttonImg} onClick={() => resumeMutation.mutate(s._id)}>
//                     <img src={playIcon} alt='ادامه نشست' title='ادامه نشست' />
//                   </div>
//                 )}
//                 {s.status === 'stopped' && <span className={styles.stopped}>پایان‌یافته</span>}
//               </div>
//             </Card>
//           </motion.div>
//         ))}
//       </motion.div>
//     </div>
//   );
// }

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
import { sessionStatus } from '../../../locales/fa';
import NoItem from '../../../components/common/NoItem';

export default function UserSessions() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['userSessions'],
    queryFn: () => getUserSessions({ limit: 50 }),
  });

  const stopMutation = useMutation({
    mutationFn: stopSession,
    onSuccess: () => queryClient.invalidateQueries(['userSessions']),
  });
  const pauseMutation = useMutation({
    mutationFn: pauseSession,
    onSuccess: () => queryClient.invalidateQueries(['userSessions']),
  });
  const resumeMutation = useMutation({
    mutationFn: resumeSession,
    onSuccess: () => queryClient.invalidateQueries(['userSessions']),
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
        {data?.data?.data?.length === 0 ?
          <div className={styles.noItem}>
            <NoItem />
          </div> :
          data?.data?.data?.map((s) => {
            const isStopping = stopMutation.isLoading && stopMutation.variables === s._id;
            const isPausing = pauseMutation.isLoading && pauseMutation.variables === s._id;
            const isResuming = resumeMutation.isLoading && resumeMutation.variables === s._id;

            const imageUrl = s.workspaceId?.imageId?.iconUrl || '/assets/images/default-workspace.png';

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
                        {s.status === 'starting' && <span className={styles.spinner} />}
                        وضعیت: {sessionStatus[s.status] || s.status}
                      </p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {s.status === 'running' && (
                      <>
                        <div className={styles.buttonImg} onClick={() => openSession(s._id)}>
                          <img className='icon' src={playIcon} alt="اجرای نشست" title="باز کردن نشست" />
                        </div>
                        <div className={styles.buttonImg} onClick={() => pauseMutation.mutate(s._id)}>
                          <img className='icon' src={pauseIcon} alt="توقف موقت نشست" title="توقف موقت نشست" />
                        </div>
                        <div className={styles.buttonImg} onClick={() => stopMutation.mutate(s._id)}>
                          <img className='icon' src={stopIcon} alt="توقف کامل نشست" title="توقف کامل نشست" />
                        </div>
                      </>
                    )}
                    {s.status === 'paused' && (
                      <div className={styles.buttonImg} onClick={() => resumeMutation.mutate(s._id)}>
                        <img className='icon' src={playIcon} alt="ادامه نشست" title="ادامه نشست" />
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
                  </div>
                </Card>
              </motion.div>
            );
          })}
      </motion.div>
    </div>
  );
}