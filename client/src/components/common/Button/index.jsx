import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import styles from './index.module.scss';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        loading && styles.loading,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </motion.button>
  );
}