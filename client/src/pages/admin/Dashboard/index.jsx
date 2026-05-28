import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '../../../services/orgService';
import { getUsers } from '../../../services/userService'; // This will need an orgId? For superadmin, we can't list all users at once without special endpoint. We'll simulate or use logs.
// For now, we'll use static data or mock until backend has aggregate endpoints.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import Chart from '../../../components/common/Chart';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function AdminDashboard() {
  const { data: orgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Simulated data for charts (would come from aggregate endpoints)
  const orgData = orgs?.data?.data?.map(org => ({ name: org.name, users: org.settings.maxUsers })) || [];
  const sessionData = [
    { name: 'فعال', value: 42 },
    { name: 'متوقف', value: 18 },
    { name: 'در انتظار', value: 5 },
  ];
  const COLORS = ['#4e8cff', '#f39c12', '#e74c3c'];

  if (loadingOrgs) return <Loader fullScreen />;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={styles.dashboard}
    >
      <motion.div variants={item}>
        <h1 className={styles.pageTitle}>داشبورد سوپرادمین</h1>
      </motion.div>

      <div className={styles.statsGrid}>
        <motion.div variants={item}>
          <Card className={styles.statCard}>
            <h3>سازمان‌ها</h3>
            <p className={styles.statValue}>{orgs?.data?.meta?.total || 0}</p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className={styles.statCard}>
            <h3>کاربران فعال</h3>
            <p className={styles.statValue}>-</p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className={styles.statCard}>
            <h3>نشست‌های جاری</h3>
            <p className={styles.statValue}>42</p>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className={styles.statCard}>
            <h3>تصاویر</h3>
            <p className={styles.statValue}>-</p>
          </Card>
        </motion.div>
      </div>

      <div className={styles.chartsGrid}>
        <motion.div variants={item} className={styles.chartWrapper}>
          <Chart title="کاربران بر اساس سازمان">
            <BarChart data={orgData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="var(--accent)" />
            </BarChart>
          </Chart>
        </motion.div>

        <motion.div variants={item} className={styles.chartWrapper}>
          <Chart title="وضعیت نشست‌ها">
            <PieChart>
              <Pie data={sessionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {sessionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </Chart>
        </motion.div>
      </div>
    </motion.div>
  );
}