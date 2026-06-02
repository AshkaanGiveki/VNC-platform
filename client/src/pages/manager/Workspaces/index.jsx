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
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';
import apiClient from '../../../services/apiClient';
import UserSelect from '../../../components/common/UserSelect';
import crossIcon from '../../../assets/icons/cancel.png'

// Stagger animation variants
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

  // Pagination & modals
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');

  // Form state for create/edit
  const [editingWs, setEditingWs] = useState(null);
  const [form, setForm] = useState({
    name: '',
    imageId: '',
    resources: { cpu: 1, memory: 1024, disk: 10 },
  });

  // --- Data Fetching ---
  const { data: workspacesData, isLoading } = useQuery({
    queryKey: ['workspaces', orgId, page],
    queryFn: () => getWorkspaces(orgId, { page, limit: 10 }),
    enabled: !!orgId,
  });


  const { data: imagesData } = useQuery({
    queryKey: ['images'],
    queryFn: () => getImages(),
  });

  // Fetch only users with role 'user' for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users', orgId, 'user'],
    queryFn: () => getUsers(orgId, { role: 'user', limit: 100 }),
    enabled: !!orgId,
  });

  // Fetch assignments for the selected workspace (used in assign modal)
  const { data: assignmentsData } = useQuery({
    queryKey: ['workspaceAssignments', selectedWorkspaceId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/organizations/${orgId}/workspaces/${selectedWorkspaceId}/assignments`
      );
      return res.data.data;  // the array of assignments
    },
    enabled: !!selectedWorkspaceId && assignModalOpen,
  });

  // --- Mutations ---
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
      queryClient.invalidateQueries(['workspaces']);
      queryClient.invalidateQueries(['workspaceAssignments', selectedWorkspaceId]);
      toast.success('کاربر به فضای کاری اختصاص یافت');
      setAssignUserId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ workspaceId, userId }) => revokeWorkspace(orgId, workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      queryClient.invalidateQueries(['workspaceAssignments', selectedWorkspaceId]);
      toast.success('فضای کار از حساب کاربر حذف شد');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  // --- Handlers ---
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
    if (editingWs) {
      updateMutation.mutate({ id: editingWs._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openAssignModal = (workspaceId) => {
    setSelectedWorkspaceId(workspaceId);
    setAssignUserId('');
    setAssignModalOpen(true);
  };

  const handleAssign = () => {
    if (!assignUserId) {
      toast.error('یک کاربر انتخاب کنید');
      return;
    }
    assignMutation.mutate({ workspaceId: selectedWorkspaceId, userId: assignUserId });
  };

  // --- Render ---
  if (isLoading) return <Loader fullScreen />;

  const workspaces = workspacesData?.data?.data || [];
  const images = imagesData?.data?.data || [];
  const users = usersData?.data?.data || [];
  const assignments = assignmentsData?.data || []; // from our custom endpoint

  return (
    <div>
      <div className={styles.header}>
        <h1>فضاهای کاری</h1>
        <Button onClick={openCreateModal}>افزودن فضای کاری</Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={styles.list}
      >
        {workspaces.length === 0 ? (
          <div className={styles.noItem}>
            <NoItem />
          </div>
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
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(ws)}>
                    ویرایش
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openAssignModal(ws._id)}>
                    تخصیص کاربر
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (confirm('آیا از حذف این فضای کاری اطمینان دارید؟')) {
                        deleteMutation.mutate(ws._id);
                      }
                    }}
                  >
                    حذف
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {workspacesData?.data?.meta && (
        <Pagination
          page={page}
          totalPages={workspacesData.data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWs ? 'ویرایش فضای کاری' : 'فضای کاری جدید'}
      >
        <div className={styles.form}>
          <FormField
            label="نام"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <FormField
            label="تصویر"
            as="select"
            value={form.imageId}
            onChange={(e) => setForm({ ...form, imageId: e.target.value })}
            options={images.map((img) => ({ label: img.name, value: img._id }))}
            required
          />
          <div className={styles.resourcesGrid}>
            <FormField
              label="CPU"
              type="number"
              value={form.resources.cpu}
              onChange={(e) =>
                setForm({
                  ...form,
                  resources: { ...form.resources, cpu: Number(e.target.value) },
                })
              }
              min={0.1}
              step={0.1}
            />
            <FormField
              label="RAM (MB)"
              type="number"
              value={form.resources.memory}
              onChange={(e) =>
                setForm({
                  ...form,
                  resources: { ...form.resources, memory: Number(e.target.value) },
                })
              }
              min={128}
            />
            <FormField
              label="Disk (GB)"
              type="number"
              value={form.resources.disk}
              onChange={(e) =>
                setForm({
                  ...form,
                  resources: { ...form.resources, disk: Number(e.target.value) },
                })
              }
              min={1}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              onClick={handleSave}
              loading={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingWs ? 'به‌روزرسانی' : 'ایجاد'}
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign User Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="مدیریت کاربران فضای کاری"
      >
        <div className={styles.form}>
          <h4 className={styles.subTitle}>کاربران اختصاص‌یافته</h4>
          {!assignmentsData || assignmentsData.length === 0 ? (
            <p className={styles.noUsers}>هیچ کاربری اختصاص نیافته است.</p>
          ) : (
            <div className={styles.assignedList}>
              {assignmentsData.map((assignment) => (
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
            </div>
          )}

          <h4 className={styles.subTitle}>افزودن کاربر جدید</h4>
          <UserSelect
            orgId={orgId}
            value={[]}
            onChange={(userIds) => {
              userIds.forEach((userId) => {
                assignMutation.mutate({ workspaceId: selectedWorkspaceId, userId });
              });
            }}
            placeholder="نام کاربر را جستجو کنید (حداقل ۳ حرف)"
          />

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
              بستن
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}