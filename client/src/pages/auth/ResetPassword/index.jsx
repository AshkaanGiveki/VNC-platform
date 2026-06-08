import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';
import { resetPassword } from '../../../services/authService';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import styles from './index.module.scss';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('رمز عبور با موفقیت تغییر کرد');
      navigate('/login');
    } catch (err) {
      toast.error('خطا در تغییر رمز عبور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>تغییر رمز عبور</title></Helmet>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className={styles.title}>تعیین رمز جدید</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField
            label="رمز عبور جدید"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" loading={loading} className={styles.submitBtn}>
            ذخیره رمز
          </Button>
        </form>
      </motion.div>
    </>
  );
}