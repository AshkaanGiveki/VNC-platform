import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../../services/userService';
import { getWorkspaces } from '../../../services/workspaceService';
import { getOrgSessions } from '../../../services/sessionService';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

const COLORS = ['#4e8cff', '#27ae60', '#f39c12', '#e74c3c'];

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

  const totalUsers = users?.data?.meta?.total || 0;
  const totalWorkspaces = workspaces?.data?.meta?.total || 0;
  const activeSessions = sessions?.data?.data?.filter(s => s.status === 'running').length || 0;
  const pausedSessions = sessions?.data?.data?.filter(s => s.status === 'paused').length || 0;
  const stoppedSessions = sessions?.data?.data?.filter(s => s.status === 'stopped').length || 0;

  // User role distribution (for pie chart)
  const roleDistribution = [
    { name: 'کاربر', value: users?.data?.data?.filter(u => u.role === 'user').length || 0 },
    { name: 'ادمین', value: users?.data?.data?.filter(u => u.role === 'org_admin').length || 0 },
  ];

  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
    const radius = outerRadius * 1.6;          // place text well outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="var(--text-primary)"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={styles.dashboard}>
      <h1 className={styles.title}>داشبورد سازمان</h1>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <h3>کاربران</h3>
          <p className={styles.statValue}>{totalUsers}</p>
          <small>فعال: {users?.data?.data?.filter(u => u.isActive).length}</small>
        </Card>
        <Card className={styles.statCard}>
          <h3>فضاهای کاری</h3>
          <p className={styles.statValue}>{totalWorkspaces}</p>
          <small>فعال: {workspaces?.data?.data?.filter(w => w.isActive).length}</small>
        </Card>
        <Card className={styles.statCard}>
          <h3>نشست‌های جاری</h3>
          <p className={styles.statValue}>{activeSessions}</p>
          <small>متوقف: {stoppedSessions} | مکث: {pausedSessions}</small>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <h3>وضعیت نشست‌ها</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart margin={{ top: 10, right: 0, left: 0, bottom: 30 }} data={[
              { name: 'فعال', value: activeSessions },
              { name: 'مکث', value: pausedSessions },
              { name: 'متوقف', value: stoppedSessions },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} tickMargin={20} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className={styles.chartCard}>
          <h3>نقش کاربران</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
              <Pie
                data={roleDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={0}
                label={renderCustomizedLabel}
                labelLine={false}
                isAnimationActive={false}
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </motion.div>
  );
}