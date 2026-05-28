import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../../redux/slices/authSlice';
import { updateUser as updateUserApi } from '../../../services/userService';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateUserApi(user.organizationId, user.userId, {
        firstName: form.firstName,
        lastName: form.lastName,
      });
      dispatch(updateUser(res.data.data));
      toast.success('پروفایل به‌روزرسانی شد');
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.container}>
      <h1>پروفایل</h1>
      <Card className={styles.formCard}>
        <FormField label="ایمیل" value={form.email} disabled />
        <FormField
          label="نام"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <FormField
          label="نام خانوادگی"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <Button onClick={handleSave} loading={loading}>ذخیره تغییرات</Button>
      </Card>
    </motion.div>
  );
}