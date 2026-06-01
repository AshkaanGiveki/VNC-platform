import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser } from '../../../services/userService';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import { cn } from '../../../utils/cn';

export default function ManagerUsers() {
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organizationId;
  const actorRole = user?.role;                   // 'manager' or 'org_admin'
  const canChangeRoles = actorRole === 'manager'; // only manager can change roles
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', orgId, page],
    queryFn: () => getUsers(orgId, { page, limit: 10 }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createUser(orgId, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('کاربر ایجاد شد'); closeModal(); },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(orgId, id, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('به‌روزرسانی شد'); closeModal(); },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(orgId, id),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('حذف شد'); },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm({ email: '', password: '', firstName: '', lastName: '', role: 'user', isActive: true });
  };

  const handleEdit = (u) => {
    // Admin cannot edit admins or managers
    if (!canChangeRoles && u.role !== 'user') {
      toast.error('شما فقط می‌توانید کاربران عادی را ویرایش کنید');
      return;
    }
    setEditingUser(u);
    setForm({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('نام و نام خانوادگی الزامی است');
      return;
    }
    if (editingUser) {
      const data = { firstName: form.firstName, lastName: form.lastName, isActive: form.isActive };
      if (canChangeRoles) data.role = form.role;
      updateMutation.mutate({ id: editingUser._id, data });
    } else {
      if (!form.email || !form.password) {
        toast.error('ایمیل و رمز عبور الزامی است');
        return;
      }
      const data = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: canChangeRoles ? form.role : 'user', // admin always creates 'user'
      };
      createMutation.mutate(data);
    }
  };

  const toggleBlock = (u) => {
    // Admin cannot block admins
    if (!canChangeRoles && u.role !== 'user') {
      toast.error('شما نمی‌توانید این کاربر را مسدود کنید');
      return;
    }
    updateUser(orgId, u._id, { isActive: !u.isActive })
      .then(() => { queryClient.invalidateQueries(['users']); toast.success(u.isActive ? 'کاربر مسدود شد' : 'کاریر رفع مسدودیت شد'); });
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className={styles.header}>
        <h1>کاربران سازمان</h1>
        <Button onClick={() => setModalOpen(true)}>افزودن کاربر</Button>
      </div>

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className={styles.list}>
        {data?.data?.data?.map((u) => (
          <motion.div key={u._id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
            <Card className={styles.userCard}>
              <div className={styles.info}>
                <h3>{u.firstName} {u.lastName}</h3>
                <p className={styles.email}>{u.email}</p>
                <span className={styles.role}>{u.role === 'org_admin' ? 'ادمین' : u.role === 'manager' ? 'مدیر' : 'کاربر'}</span>

              </div>
              <div className={styles.left}>
                <span className={cn(u.isActive ? styles.active : styles.blocked, styles.status)}>
                  {u.isActive ? 'فعال' : 'مسدود'}
                </span>

                <div className={styles.actions}>

                  <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>ویرایش</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleBlock(u)}>
                    {u.isActive ? 'مسدود' : 'رفع مسدودیت'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(u._id); }}>حذف</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {data?.data?.meta && <Pagination page={page} totalPages={data.data.meta.totalPages} onPageChange={setPage} />}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingUser ? 'ویرایش کاربر' : 'کاربر جدید'}>
        <div className={styles.form}>
          {!editingUser && (
            <>
              <FormField label="ایمیل" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <FormField label="رمز عبور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </>
          )}
          <FormField label="نام" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <FormField label="نام خانوادگی" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />

          {canChangeRoles && (
            <FormField
              label="نقش"
              as="select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { label: 'ادمین', value: 'org_admin' },
                { label: 'کاربر', value: 'user' },
              ]}
            />
          )}

          {editingUser && (
            <FormField
              label="وضعیت"
              as="select"
              value={form.isActive ? 'active' : 'blocked'}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
              options={[
                { label: 'فعال', value: 'active' },
                { label: 'مسدود', value: 'blocked' },
              ]}
            />
          )}

          <div className={styles.modalActions}>
            <Button onClick={handleSave} loading={createMutation.isLoading || updateMutation.isLoading}>ذخیره</Button>
            <Button variant="secondary" onClick={closeModal}>انصراف</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}