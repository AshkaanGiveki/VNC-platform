import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  assignWorkspace,
  revokeWorkspace,
} from '../../../services/workspaceService';
import { getImages } from '../../../services/imageService';
import { getUsers } from '../../../services/userService';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import Loader from '../../../components/common/Loader';
import UserSelect from '../../../components/common/UserSelect';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';
import apiClient from '../../../services/apiClient';
import crossIcon from '../../../assets/icons/cancel.png';
import { getTemplates } from '../../../services/policyService';


const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function ManagerWorkspaces() {
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organizationId;
  const queryClient = useQueryClient();
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [editingWs, setEditingWs] = useState(null);
  const [form, setForm] = useState({
    name: '',
    imageId: '',
    policyId: '',                // ← new
    resources: { cpu: 1, memory: 1024, disk: 10 },
  });

  // ----- data fetching -----
  const { data: workspacesData, isLoading } = useQuery({
    queryKey: ['workspaces', orgId, page],
    queryFn: () => getWorkspaces(orgId, { page, limit: 10 }),
    enabled: !!orgId,
  });

  const { data: imagesData } = useQuery({
    queryKey: ['images'],
    queryFn: () => getImages(),
  });

  const { data: policiesData } = useQuery({
    queryKey: ['policies', orgId],
    queryFn: () => getTemplates(orgId),   // import from policyService
    enabled: !!orgId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', orgId, 'user'],
    queryFn: () => getUsers(orgId, { role: 'user', limit: 100 }),
    enabled: !!orgId,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['workspaceAssignments', selectedWorkspaceId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/organizations/${orgId}/workspaces/${selectedWorkspaceId}/assignments`
      );
      return res.data.data;
    },
    enabled: !!selectedWorkspaceId && assignModalOpen,
  });

  // ----- mutations -----
  const createMutation = useMutation({
    mutationFn: (data) => createWorkspace(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('فضای کاری ایجاد شد');
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateWorkspace(orgId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('فضای کاری به‌روزرسانی شد');
      setModalOpen(false);
      setEditingWs(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteWorkspace(orgId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('حذف شد');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ workspaceId, userId }) => assignWorkspace(orgId, workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceAssignments']);
      toast.success('کاربر اختصاص یافت');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ workspaceId, userId }) => revokeWorkspace(orgId, workspaceId, userId),
    onSuccess: () => queryClient.invalidateQueries(['workspaceAssignments']),
  });

  // ----- handlers -----
  const openCreateModal = () => {
    setEditingWs(null);
    setForm({ name: '', imageId: '', resources: { cpu: 1, memory: 1024, disk: 10 } });
    setModalOpen(true);
  };

  const openEditModal = (ws) => {
    setEditingWs(ws);
    setForm({
      name: ws.name,
      imageId: ws.imageId?._id || ws.imageId,
      resources: { ...ws.resources },
    });
    setModalOpen(true);
  };

  const handleSave = () => {
  if (!form.name.trim() || !form.imageId) {
    toast.error('نام و تصویر الزامی هستند');
    return;
  }
  const data = {
    name: form.name,
    imageId: form.imageId,
    policyId: form.policyId || undefined,   // send undefined if empty (use org default)
    resources: form.resources,
  };
  if (editingWs) {
    updateMutation.mutate({ id: editingWs._id, data });
  } else {
    createMutation.mutate(data);
  }
};

  const openAssignModal = (workspaceId) => {
    setSelectedWorkspaceId(workspaceId);
    setAssignModalOpen(true);
  };

  const validAssignments = (assignmentsData || []).filter((a) => a.userId);

  const assignAllUsers = async () => {
    const allUsers = usersData?.data?.data || [];
    const assignedIds = validAssignments.map((a) => a.userId?._id);
    const unassigned = allUsers.filter((u) => !assignedIds.includes(u._id));
    if (unassigned.length === 0) {
      toast.error('همه کاربران قبلاً اختصاص یافته‌اند');
      return;
    }
    let count = 0;
    for (const u of unassigned) {
      try {
        await assignMutation.mutateAsync({ workspaceId: selectedWorkspaceId, userId: u._id });
        count++;
      } catch (err) {
        toast.error(`خطا برای کاربر ${u.firstName} ${u.lastName}`);
      }
    }
    if (count > 0) {
      toast.success(`${count} کاربر اختصاص یافت`);
    }
  };

  // ----- render -----
  if (isLoading) return <Loader fullScreen />;

  const workspaces = workspacesData?.data?.data || [];
  const images = imagesData?.data?.data || [];

  const displayedUsers = validAssignments.length > 6 ? validAssignments.slice(0, 6) : validAssignments;

  return (
    <div>
      <div className={styles.header}>
        <h1>فضاهای کاری</h1>
        <Button onClick={openCreateModal}>افزودن فضای کاری</Button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className={styles.list}>
        {workspaces.length === 0 ? (
          <div className={styles.noItem}><NoItem /></div>
        ) : (
          workspaces.map((ws) => (
            <motion.div key={ws._id} variants={itemVariants}>
              <Card className={styles.card}>
                <div className={styles.info}>
                  <h3>{ws.name}</h3>
                  <p className={styles.sub}>
                    {ws.imageId?.name || 'بدون تصویر'} | CPU: {ws.resources.cpu} | RAM:{' '}
                    {ws.resources.memory}MB | Disk: {ws.resources.disk}GB
                  </p>
                </div>
                <div className={styles.actions}>
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(ws)}>ویرایش</Button>
                  <Button size="sm" variant="secondary" onClick={() => openAssignModal(ws._id)}>تخصیص کاربر</Button>
                  <Button size="sm" variant="secondary" onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(ws._id); }}>حذف</Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {workspacesData?.data?.meta && (
        <Pagination page={page} totalPages={workspacesData.data.meta.totalPages} onPageChange={setPage} />
      )}

      {/* create / edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingWs ? 'ویرایش فضای کاری' : 'فضای کاری جدید'}>
        <div className={styles.form}>
          <FormField label="نام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormField
            label="تصویر"
            as="select"
            value={form.imageId}
            onChange={(e) => setForm({ ...form, imageId: e.target.value })}
            options={images.map((img) => ({ label: img.name, value: img._id }))}
            required
          />
          <FormField
            label="قانون (Policy)"
            as="select"
            value={form.policyId}
            onChange={(e) => setForm({ ...form, policyId: e.target.value })}
            options={[
              { label: 'پیش‌فرض سازمان', value: '' },
              ...(policiesData?.data?.data || []).map(p => ({
                label: p.name + (p.isDefault ? ' (پیش‌فرض)' : ''),
                value: p._id,
              })),
            ]}
          />
          <div className={styles.resourcesGrid}>
            <FormField label="CPU" type="number" value={form.resources.cpu} onChange={(e) => setForm({ ...form, resources: { ...form.resources, cpu: Number(e.target.value) } })} min={0.1} step={0.1} />
            <FormField label="RAM (MB)" type="number" value={form.resources.memory} onChange={(e) => setForm({ ...form, resources: { ...form.resources, memory: Number(e.target.value) } })} min={128} />
            <FormField label="Disk (GB)" type="number" value={form.resources.disk} onChange={(e) => setForm({ ...form, resources: { ...form.resources, disk: Number(e.target.value) } })} min={1} />
          </div>

          <div className={styles.modalActions}>
            <Button onClick={handleSave} loading={createMutation.isLoading || updateMutation.isLoading}>{editingWs ? 'به‌روزرسانی' : 'ایجاد'}</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>انصراف</Button>
          </div>
        </div>
      </Modal>

      {/* assign modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="مدیریت کاربران فضای کاری">
        <div className={styles.form}>
          <h4 className={styles.subTitle}>کاربران اختصاص‌یافته</h4>
          {validAssignments.length === 0 ? (
            <p className={styles.noUsers}>هیچ کاربری اختصاص نیافته است.</p>
          ) : (
            <div className={styles.assignedList}>
              {displayedUsers.map((assignment) => (
                <div key={assignment._id} className={styles.assignedItem}>
                  <span className={styles.name}>
                    {assignment.userId?.firstName} {assignment.userId?.lastName}
                  </span>
                  <div className={styles.unassign} onClick={() =>
                    revokeMutation.mutate({
                      workspaceId: selectedWorkspaceId,
                      userId: assignment.userId._id,
                    })
                  }>
                    <img src={crossIcon} alt="حذف" title="حذف" />
                  </div>
                </div>
              ))}
              {validAssignments.length > 6 && (
                <div
                  className={styles.showAllButton}
                  onClick={() => setShowAllOpen(true)}
                >
                  مشاهده تمامی افراد انتخاب شده ({validAssignments.length})
                </div>
              )}
            </div>
          )}

          <h4 className={styles.subTitle}>افزودن کاربر</h4>
          <UserSelect
            orgId={orgId}
            role="user"
            value={[]}
            onChange={(userId) => {
              if (userId) assignMutation.mutate({ workspaceId: selectedWorkspaceId, userId });
            }}
            placeholder="نام کاربر را جستجو کنید (حداقل ۳ حرف)"
            multiple={false}
          />

          <Button variant="secondary" onClick={assignAllUsers} loading={assignMutation.isLoading}>
            اختصاص به همه کاربران
          </Button>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>بستن</Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showAllOpen}
        onClose={() => setShowAllOpen(false)}
        title="افراد انتخاب شده"
      >
        <div className={styles.modalList}>
          {validAssignments.map(u => (
            <div key={u._id} className={styles.assignedItem}>
              <span className={styles.name}>
                {u.userId?.firstName} {u.userId?.lastName}
              </span>
              <div className={styles.unassign} onClick={() =>
                revokeMutation.mutate({
                  workspaceId: selectedWorkspaceId,
                  userId: u.userId._id,
                })
              }>
                <img src={crossIcon} alt="حذف" title="حذف" />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}