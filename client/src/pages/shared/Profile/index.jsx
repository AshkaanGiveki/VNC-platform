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
import { changePassword } from '../../../services/authService';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNew: '',
  });

  const handleSaveInfo = async () => {
    try {
      const res = await updateUserApi(user.organizationId, user.userId, {
        firstName: infoForm.firstName,
        lastName: infoForm.lastName,
      });
      dispatch(updateUser(res.data.data));
      toast.success('اطلاعات به‌روزرسانی شد');
      setEditingInfo(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmNew) {
      toast.error('رمز جدید با تکرار آن مطابقت ندارد');
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('رمز عبور تغییر کرد');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNew: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا');
    }
  };

  const canEditInfo = user?.role === 'superadmin'; // only superadmin can edit own info

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.container}>
      <h1>پروفایل</h1>

      <Card className={styles.card}>
        <h2>اطلاعات کاربری</h2>
        {editingInfo ? (
          <div className={styles.form}>
            <FormField label="نام" value={infoForm.firstName} onChange={(e) => setInfoForm({...infoForm, firstName: e.target.value})} />
            <FormField label="نام خانوادگی" value={infoForm.lastName} onChange={(e) => setInfoForm({...infoForm, lastName: e.target.value})} />
            <div className={styles.modalActions}>
              <Button onClick={handleSaveInfo}>ذخیره</Button>
              <Button variant="secondary" onClick={() => setEditingInfo(false)}>انصراف</Button>
            </div>
          </div>
        ) : (
          <div className={styles.infoDisplay}>
            <p><strong>نام:</strong> {user?.firstName}</p>
            <p><strong>نام خانوادگی:</strong> {user?.lastName}</p>
            <p><strong>ایمیل:</strong> {user?.email}</p>
            <p><strong>نقش:</strong> {user?.role}</p>
            {canEditInfo && (
              <Button variant="secondary" onClick={() => setEditingInfo(true)}>ویرایش اطلاعات</Button>
            )}
          </div>
        )}
      </Card>

      <Card className={styles.card}>
        <h2>تغییر رمز عبور</h2>
        <div className={styles.form}>
          <FormField label="رمز فعلی" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
          <FormField label="رمز جدید" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
          <FormField label="تکرار رمز جدید" type="password" value={passwordForm.confirmNew} onChange={(e) => setPasswordForm({...passwordForm, confirmNew: e.target.value})} />
          <Button onClick={handleChangePassword}>تغییر رمز</Button>
        </div>
      </Card>
    </motion.div>
  );
}