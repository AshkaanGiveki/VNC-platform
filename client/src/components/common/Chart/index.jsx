import { ResponsiveContainer } from 'recharts';
import { cn } from '../../../utils/cn';
import styles from './index.module.scss';

export default function Chart({ title, children, className }) {
  return (
    <div className={cn(styles.chartCard, className)}>
      {title && <h4 className={styles.title}>{title}</h4>}
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height={300}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}