import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '../../../services/orgService';
import { getImages } from '../../../services/imageService';
import { getUserSessions } from '../../../services/sessionService'; // global sessions? We'll create a summary endpoint, but for now use admin logs? Better: add a backend summary endpoint.
// For now we'll use the aggregated data from organizations and sessions list limited to all.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function AdminDashboard() {
  const { data: orgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });
  const { data: images, isLoading: loadingImages } = useQuery({
    queryKey: ['images'],
    queryFn: () => getImages(),
  });
  // For sessions, we'll query each organization? Not scalable. We'll add a backend summary endpoint later.
  // Placeholder dynamic data: we'll calculate from orgs.

  if (loadingOrgs || loadingImages) return <Loader fullScreen />;

  const orgList = orgs?.data?.data || [];
  const imageList = images?.data?.data || [];
  const totalOrgs = orgList.length;
  const totalImages = imageList.length;
  const enabledImages = imageList.filter(img => img.isEnabled).length;

  // Mock session data – in production you'd fetch a summary
  const sessionData = [
    { name: 'فعال', value: 42 },
    { name: 'متوقف', value: 18 },
  ];
  const COLORS = ['#4e8cff', '#f39c12'];

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
      <h1>داشبورد سوپرادمین</h1>
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <h3>سازمان‌ها</h3>
          <p className={styles.statValue}>{totalOrgs}</p>
        </Card>
        <Card className={styles.statCard}>
          <h3>تصاویر</h3>
          <p className={styles.statValue}>{totalImages}</p>
          <small>{enabledImages} فعال</small>
        </Card>
        <Card className={styles.statCard}>
          <h3>نشست‌های فعال</h3>
          <p className={styles.statValue}>-</p>
          <small>نیاز به endpoint تجمیعی</small>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card>
          <h3>تعداد کاربران بر اساس سازمان</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={orgList.map(o => ({ name: o.name, maxUsers: o.settings?.maxUsers || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickMargin={20} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="maxUsers" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3>وضعیت نشست‌ها (کل پلتفرم)</h3>
          <ResponsiveContainer width="100%" height={250}>
            
            <PieChart margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
              <Pie
                data={sessionData}
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
                {sessionData.map((entry, index) => (
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