import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function AuthLayout() {
  return (
    <div className={styles.authContainer}>
      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}