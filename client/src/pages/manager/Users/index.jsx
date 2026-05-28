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
import { motion, AnimatePresence } from 'framer-motion';
import styles from './index.module.scss';

export default function ManagerUsers() {
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organizationId;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'user' });

  const { data, isLoading } = useQuery({
    queryKey: ['users', orgId, page],
    queryFn: () => getUsers(orgId, { page, limit: 10 }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createUser(orgId, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('کاربر ایجاد شد'); setModalOpen(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(orgId, id, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('به‌روزرسانی شد'); setModalOpen(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(orgId, id),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('حذف شد'); },
  });

  const handleEdit = (u) => {
    setEditingUser(u);
    setForm({ email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser._id, data: { firstName: form.firstName, lastName: form.lastName, role: form.role } });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1>کاربران سازمان</h1>
        <Button onClick={() => { setEditingUser(null); setForm({ email: '', password: '', firstName: '', lastName: '', role: 'user' }); setModalOpen(true); }}>افزودن کاربر</Button>
      </div>

      {isLoading ? <Loader /> : (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className={styles.list}>
          {data?.data?.data?.map((u) => (
            <motion.div key={u._id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
              <Card className={styles.userCard}>
                <div>
                  <h3>{u.firstName} {u.lastName}</h3>
                  <p>{u.email} - {u.role}</p>
                </div>
                <div className={styles.actions}>
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>ویرایش</Button>
                  <Button size="sm" variant="secondary" onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(u._id); }}>حذف</Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {data?.data?.meta && <Pagination page={page} totalPages={data.data.meta.totalPages} onPageChange={setPage} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'ویرایش کاربر' : 'کاربر جدید'}>
        <div className={styles.form}>
          <FormField label="ایمیل" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required disabled={!!editingUser} />
          {!editingUser && <FormField label="رمز عبور" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />}
          <FormField label="نام" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required />
          <FormField label="نام خانوادگی" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} required />
          <FormField label="نقش" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} required as="select" options={['user', 'manager']} />
          <div className={styles.modalActions}>
            <Button onClick={handleSave} loading={createMutation.isLoading || updateMutation.isLoading}>ذخیره</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>انصراف</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}