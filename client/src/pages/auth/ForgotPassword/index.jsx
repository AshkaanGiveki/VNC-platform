import { useState } from 'react';
import { motion } from 'framer-motion';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';
import { forgotPassword } from '../../../services/authService';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import styles from './index.module.scss';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('ایمیل بازیابی ارسال شد (در صورت وجود)');
    } catch (err) {
      toast.error('خطا در ارسال ایمیل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>بازیابی رمز عبور | VWP</title></Helmet>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className={styles.title}>فراموشی رمز عبور</h1>
        <p className={styles.desc}>ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField
            label="ایمیل"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className={styles.submitBtn}>
            ارسال لینک
          </Button>
        </form>
      </motion.div>
    </>
  );
}