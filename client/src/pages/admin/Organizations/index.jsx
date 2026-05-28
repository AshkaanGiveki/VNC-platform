import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../../../services/orgService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../../services/apiClient';
import styles from './index.module.scss';

export default function Organizations() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [form, setForm] = useState({ name: '', domain: '' });
    const [createAdmin, setCreateAdmin] = useState(false);
    const [adminForm, setAdminForm] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });

    const { data, isLoading } = useQuery({
        queryKey: ['organizations', page],
        queryFn: () => getOrganizations({ page, limit: 10 }),
    });

    const createMutation = useMutation({
        mutationFn: createOrganization,
        onSuccess: () => { queryClient.invalidateQueries(['organizations']); toast.success('سازمان ایجاد شد'); setModalOpen(false); },
        onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateOrganization(id, data),
        onSuccess: () => { queryClient.invalidateQueries(['organizations']); toast.success('به‌روزرسانی شد'); setModalOpen(false); },
        onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOrganization,
        onSuccess: () => { queryClient.invalidateQueries(['organizations']); toast.success('حذف شد'); },
        onError: (err) => toast.error('خطا در حذف'),
    });

    const handleEdit = (org) => {
        setEditingOrg(org);
        setForm({ name: org.name, domain: org.domain || '' });
        setModalOpen(true);
    };

    const handleSave = () => {
        if (createAdmin) {
            apiClient.post('/organizations/with-admin', {
                organization: form,
                admin: adminForm,
            }).then(() => {
                queryClient.invalidateQueries(['organizations']);
                toast.success('سازمان و ادمین ایجاد شدند');
                setModalOpen(false);
            }).catch(err => toast.error(err.response?.data?.message || 'خطا'));
        } else {
            if (editingOrg) {
                updateMutation.mutate({ id: editingOrg._id, data: form });
            } else {
                createMutation.mutate(form);
            }
        }
    };

    const listVariants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } },
    };

    return (
        <div>
            <div className={styles.header}>
                <h1>مدیریت سازمان‌ها</h1>
                <Button onClick={() => { setEditingOrg(null); setForm({ name: '', domain: '' }); setModalOpen(true); }}>
                    افزودن سازمان
                </Button>
            </div>

            {isLoading ? <Loader /> : (
                <motion.div variants={listVariants} initial="hidden" animate="show" className={styles.list}>
                    {data?.data?.data?.map((org) => (
                        <motion.div key={org._id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                            <Card className={styles.orgCard}>
                                <div>
                                    <h3>{org.name}</h3>
                                    <p className={styles.domain}>{org.domain || 'بدون دامنه'}</p>
                                </div>
                                <div className={styles.actions}>
                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(org)}>ویرایش</Button>
                                    <Button variant="secondary" size="sm" onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(org._id); }}>حذف</Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {data?.data?.meta && (
                <Pagination page={page} totalPages={data.data.meta.totalPages} onPageChange={setPage} />
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingOrg ? 'ویرایش سازمان' : 'سازمان جدید'}>
                <div className={styles.form}>
                    <FormField label="نام سازمان" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <FormField label="دامنه" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
                    <div className={styles.checkbox}>
                        <label>
                            <input
                                type="checkbox"
                                checked={createAdmin}
                                onChange={(e) => setCreateAdmin(e.target.checked)}
                            />
                            ایجاد ادمین برای این سازمان
                        </label>
                    </div>
                    {createAdmin && (
                        <div className={styles.adminFields}>
                            <FormField label="ایمیل ادمین" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} required />
                            <FormField label="رمز عبور" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} required />
                            <FormField label="نام" value={adminForm.firstName} onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })} required />
                            <FormField label="نام خانوادگی" value={adminForm.lastName} onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })} required />
                        </div>
                    )}
                    <div className={styles.modalActions}>
                        <Button onClick={handleSave} loading={createMutation.isLoading || updateMutation.isLoading}>ذخیره</Button>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>انصراف</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}