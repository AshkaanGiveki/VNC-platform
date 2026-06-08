import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganizations, updateOrganization, deleteOrganization } from '../../../services/orgService';
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
  const [editingOrg, setEditingOrg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    isActive: true,
    settings: {
      recordingEnabled: true,
    },
    manager: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      isActive: true,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['organizations', page],
    queryFn: () => getOrganizations({ page, limit: 10 }),
  });

  const toggleOrgStatus = async (org) => {
    const newStatus = !org.isActive;
    queryClient.setQueryData(['organizations', page], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          data: old.data.data.map((o) =>
            o._id === org._id ? { ...o, isActive: newStatus } : o
          ),
        },
      };
    });
    try {
      await updateOrganization(org._id, { isActive: newStatus });
      toast.success(newStatus ? 'سازمان فعال شد' : 'سازمان غیرفعال شد');
      queryClient.invalidateQueries(['organizations', page]);
    } catch (err) {
      queryClient.invalidateQueries(['organizations', page]);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateOrganization(id, data),
    onSuccess: () => queryClient.invalidateQueries(['organizations']),
  });

  const updateManagerMutation = useMutation({
    mutationFn: ({ orgId, data }) => apiClient.put(`/organizations/${orgId}/manager`, data),
    onSuccess: () => queryClient.invalidateQueries(['organizations']),
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
    setEditingOrg(null);
    setForm({
      name: '',
      domain: '',
      isActive: true,
      settings: { recordingEnabled: true },
      manager: { email: '', password: '', firstName: '', lastName: '', isActive: true },
    });
  };

  const handleEdit = async (org) => {
    setEditingOrg(org);
    let managerData = { email: '', firstName: '', lastName: '', isActive: true };
    try {
      const res = await apiClient.get(`/organizations/${org._id}/manager`);
      const mgr = res.data.data.manager;
      if (mgr) {
        managerData = {
          email: mgr.email || '',
          firstName: mgr.firstName || '',
          lastName: mgr.lastName || '',
          isActive: mgr.isActive,
        };
      }
    } catch (err) {
      // Manager may not exist; leave defaults
    }
    setForm({
      name: org.name,
      domain: org.domain || '',
      isActive: org.isActive,
      settings: {
        recordingEnabled: org.settings?.recordingEnabled ?? true,
      },
      manager: managerData,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('نام سازمان الزامی است');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editingOrg._id,
        data: {
          name: form.name,
          domain: form.domain,
          isActive: form.isActive,
          settings: form.settings,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در به‌روزرسانی سازمان');
      return;
    }

    const { manager } = form;
    const hasChanges =
      manager.email !== (editingOrg?.manager?.email || '') ||
      manager.firstName !== (editingOrg?.manager?.firstName || '') ||
      manager.lastName !== (editingOrg?.manager?.lastName || '') ||
      manager.isActive !== (editingOrg?.manager?.isActive ?? true);

    if (hasChanges) {
      const managerData = {};
      if (manager.email) managerData.email = manager.email;
      if (manager.firstName) managerData.firstName = manager.firstName;
      if (manager.lastName) managerData.lastName = manager.lastName;
      if (typeof manager.isActive === 'boolean') managerData.isActive = manager.isActive;

      try {
        await updateManagerMutation.mutateAsync({ orgId: editingOrg._id, data: managerData });
      } catch (err) {
        toast.error(err.response?.data?.message || 'خطا در به‌روزرسانی مدیر');
        return;
      }
    }

    toast.success('تغییرات ذخیره شد');
    closeModal();
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className={styles.header}>
        <h1>مدیریت سازمان‌ها</h1>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className={styles.list}>
        {data?.data?.data?.map((org) => (
          <motion.div key={org._id} variants={itemVariants}>
            <Card className={styles.orgCard}>
              <div>
                <h3>
                  {org.name}{' '}
                  <span className={org.isActive ? styles.active : styles.inactive}>
                    {org.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </h3>
                <p className={styles.domain}>{org.domain || 'بدون دامنه'}</p>
              </div>
              <div className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => handleEdit(org)}>
                  ویرایش
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleOrgStatus(org)}>
                  {org.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(org._id)}>
                  حذف
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {data?.data?.meta && (
        <Pagination page={page} totalPages={data.data.meta.totalPages} onPageChange={setPage} />
      )}

      {/* Edit Organization Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="ویرایش سازمان">
        <div className={styles.form}>
          <h3>اطلاعات سازمان</h3>
          <FormField label="نام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormField label="دامنه" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <FormField
            label="وضعیت"
            as="select"
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
            options={[
              { label: 'فعال', value: 'active' },
              { label: 'غیرفعال', value: 'inactive' },
            ]}
          />
          <FormField
            label="ضبط جلسات"
            as="select"
            value={form.settings.recordingEnabled ? 'enabled' : 'disabled'}
            onChange={(e) =>
              setForm({
                ...form,
                settings: { ...form.settings, recordingEnabled: e.target.value === 'enabled' },
              })
            }
            options={[
              { label: 'فعال', value: 'enabled' },
              { label: 'غیرفعال', value: 'disabled' },
            ]}
          />
          <hr />
          <h3>اطلاعات مدیر</h3>
          <FormField label="نام" value={form.manager.firstName} onChange={(e) => setForm({ ...form, manager: { ...form.manager, firstName: e.target.value } })} />
          <FormField label="نام خانوادگی" value={form.manager.lastName} onChange={(e) => setForm({ ...form, manager: { ...form.manager, lastName: e.target.value } })} />
          <FormField label="ایمیل" value={form.manager.email} onChange={(e) => setForm({ ...form, manager: { ...form.manager, email: e.target.value } })} />
          <FormField label="رمز عبور جدید" type="password" value={form.manager.password} onChange={(e) => setForm({ ...form, manager: { ...form.manager, password: e.target.value } })} />
          <FormField
            label="وضعیت مدیر"
            as="select"
            value={form.manager.isActive ? 'active' : 'blocked'}
            onChange={(e) => setForm({ ...form, manager: { ...form.manager, isActive: e.target.value === 'active' } })}
            options={[
              { label: 'فعال', value: 'active' },
              { label: 'مسدود', value: 'blocked' },
            ]}
          />
          <div className={styles.modalActions}>
            <Button onClick={handleSave} loading={updateMutation.isLoading || updateManagerMutation.isLoading}>
              ذخیره
            </Button>
            <Button variant="secondary" onClick={closeModal}>
              انصراف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="تأیید حذف">
        <p>آیا از حذف کامل سازمان و تمام کاربران آن اطمینان دارید؟</p>
        <div className={styles.modalActions}>
          <Button onClick={() => deleteMutation.mutate(confirmDelete)} loading={deleteMutation.isLoading}>
            حذف
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            انصراف
          </Button>
        </div>
      </Modal>
    </div>
  );
}