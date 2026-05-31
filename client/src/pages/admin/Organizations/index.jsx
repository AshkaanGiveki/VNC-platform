import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganizations, deleteOrganization } from '../../../services/orgService';
import apiClient from '../../../services/apiClient';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function Organizations() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // orgId to delete
  const [form, setForm] = useState({
    name: '',
    domain: '',
    manager: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['organizations', page],
    queryFn: () => getOrganizations({ page, limit: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/organizations/with-manager', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast.success('سازمان و مدیر ایجاد شدند');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast.success('سازمان حذف شد');
      setConfirmDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const closeModal = () => {
    setModalOpen(false);
    setForm({
      name: '',
      domain: '',
      manager: { email: '', password: '', firstName: '', lastName: '' },
    });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.manager.email || !form.manager.password || !form.manager.firstName || !form.manager.lastName) {
      toast.error('اطلاعات کامل نیست');
      return;
    }
    createMutation.mutate(form);
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className={styles.header}>
        <h1>مدیریت سازمان‌ها</h1>
        <Button onClick={() => setModalOpen(true)}>افزودن سازمان</Button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className={styles.list}>
        {data?.data?.data?.length === 0 ?
                  <div className={styles.noItem}>
                    <NoItem />
                  </div> :
                  data?.data?.data?.map((org) => (
          <motion.div key={org._id} variants={itemVariants}>
            <Card className={styles.orgCard}>
              <div>
                <h3>{org.name}</h3>
                <p className={styles.domain}>{org.domain || 'بدون دامنه'}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(org._id)}
              >
                حذف
              </Button>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {data?.data?.meta && (
        <Pagination page={page} totalPages={data.data.meta.totalPages} onPageChange={setPage} />
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="سازمان جدید">
        <div className={styles.form}>
          <h3>اطلاعات سازمان</h3>
          <FormField label="نام سازمان" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormField label="دامنه" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <h3>اطلاعات مدیر</h3>
          <FormField label="نام" value={form.manager.firstName} onChange={(e) => setForm({ ...form, manager: { ...form.manager, firstName: e.target.value } })} required />
          <FormField label="نام خانوادگی" value={form.manager.lastName} onChange={(e) => setForm({ ...form, manager: { ...form.manager, lastName: e.target.value } })} required />
          <FormField label="ایمیل" value={form.manager.email} onChange={(e) => setForm({ ...form, manager: { ...form.manager, email: e.target.value } })} required />
          <FormField label="رمز عبور" type="password" value={form.manager.password} onChange={(e) => setForm({ ...form, manager: { ...form.manager, password: e.target.value } })} required />
          <div className={styles.modalActions}>
            <Button onClick={handleSave} loading={createMutation.isLoading}>ایجاد</Button>
            <Button variant="secondary" onClick={closeModal}>انصراف</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="تأیید حذف سازمان">
        <p>آیا از حذف کامل سازمان و تمام کاربران آن اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
        <div className={styles.modalActions}>
          <Button onClick={() => deleteMutation.mutate(confirmDelete)} loading={deleteMutation.isLoading} variant="danger">حذف</Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>انصراف</Button>
        </div>
      </Modal>
    </div>
  );
}