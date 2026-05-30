import { motion, AnimatePresence } from 'framer-motion';
import styles from './index.module.scss';
import noData from '../../../assets/images/no-data.png'

export default function NoItem({ image = noData, text = "موردی یافت نشد" }) {
  return (
    <motion.div className={styles.noItemContainer}>
        <img className={styles.img} src={image} alt="موردی یافت نشد" />
        <div className={styles.text}>{text}</div>
    </motion.div>
  )
}