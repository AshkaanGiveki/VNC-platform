import { cn } from '../../../utils/cn';
import styles from './index.module.scss';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className={styles.pagination}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={styles.arrow}
      >
        ▶
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(styles.page, p === page && styles.active)}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={styles.arrow}
      >
        ◀
      </button>
    </div>
  );
}