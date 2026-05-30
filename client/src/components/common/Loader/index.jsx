import styles from './index.module.scss';

export default function Loader({ fullScreen = false, theme = "primary" }) {
  return (
    <div className={fullScreen ? styles.fullscreen : styles.inline}>
      {theme === "primary" ? <div className={styles.spinner} /> :
        theme === "honeycomb" ?
          <div class={styles.honeycomb}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div> :
          <span class={styles.loader}>Loading...</span>
      }
    </div>
  );
}