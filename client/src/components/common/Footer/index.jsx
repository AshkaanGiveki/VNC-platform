import styles from './index.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} Virtual Workspace Platform. تمامی حقوق محفوظ است.</p>
    </footer>
  );
}