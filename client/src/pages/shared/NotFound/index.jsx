import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function NotFound() {
  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className={styles.code}>۴۰۴</h1>
      <p>صفحه‌ای که می‌گردید یافت نشد.</p>
      <Link to="/login" className={styles.link}>بازگشت به صفحه اصلی</Link>
    </motion.div>
  );
}