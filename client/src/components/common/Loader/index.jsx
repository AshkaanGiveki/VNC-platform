import styles from './index.module.scss';

export default function Loader({ fullScreen = false }) {
  return (
    <div className={fullScreen ? styles.fullscreen : styles.inline}>
      <div className={styles.spinner} />
    </div>
  );
}