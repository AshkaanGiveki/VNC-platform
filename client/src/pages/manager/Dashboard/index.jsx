import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../../services/userService';
import { getWorkspaces } from '../../../services/workspaceService';
import { getOrgSessions } from '../../../services/sessionService';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Chart from '../../../components/common/Chart';
import Loader from '../../../components/common/Loader';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function ManagerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organizationId;

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', orgId],
    queryFn: () => getUsers(orgId, { limit: 100 }),
    enabled: !!orgId,
  });

  const { data: workspaces, isLoading: loadingWs } = useQuery({
    queryKey: ['workspaces', orgId],
    queryFn: () => getWorkspaces(orgId, { limit: 100 }),
    enabled: !!orgId,
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['orgSessions', orgId],
    queryFn: () => getOrgSessions(orgId, { limit: 100 }),
    enabled: !!orgId,
  });

  if (loadingUsers || loadingWs || loadingSessions) return <Loader fullScreen />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.dashboard}
    >
      <h1>داشبورد مدیر</h1>
      <div className={styles.stats}>
        <Card><h3>کاربران</h3><p>{users?.data?.meta?.total || 0}</p></Card>
        <Card><h3>فضاهای کاری</h3><p>{workspaces?.data?.meta?.total || 0}</p></Card>
        <Card><h3>نشست‌های فعال</h3><p>{sessions?.data?.data?.filter(s => s.status === 'running').length || 0}</p></Card>
      </div>
      <Chart title="وضعیت نشست‌ها">
        <BarChart data={[{ name: 'فعال', count: sessions?.data?.data?.filter(s => s.status === 'running').length || 0 }, { name: 'متوقف', count: sessions?.data?.data?.filter(s => s.status === 'stopped').length || 0 }]}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="var(--accent)" />
        </BarChart>
      </Chart>
    </motion.div>
  );
}