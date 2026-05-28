import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import styles from './index.module.scss';

export default function Card({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(styles.card, className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}