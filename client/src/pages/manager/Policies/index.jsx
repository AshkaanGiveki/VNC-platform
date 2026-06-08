import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from '../../../services/policyService';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Modal from '../../../components/common/Modal';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';
import crossIcon from '../../../assets/icons/cancel.png';   // reuse your existing icon

const defaultOptions = {
  filePersistence: false,
  clipboard: true,
  audio: true,
  webcam: false,
  microphone: false,
  downloadEnabled: false,
  uploadEnabled: true,
  maxSessionDuration: 0,
  maxConcurrentSessions: 2,
  blockedIps: [],
};

/**
 * Small tag-input for IP addresses.
 * - Type an IP and press `,` or `Enter` to add it.
 * - Click `×` to remove an IP.
 */
const IpTagInput = ({ ips, onChange }) => {
  const [input, setInput] = useState('');

  const addIp = (ip) => {
    const trimmed = ip.trim();
    if (trimmed && !ips.includes(trimmed)) {
      onChange([...ips, trimmed]);
    }
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addIp(input);
    }
  };

  const handleBlur = () => {
    if (input.trim()) addIp(input);
  };

  const removeIp = (ip) => {
    onChange(ips.filter((i) => i !== ip));
  };

  return (
    <div className={styles.ipInputContainer}>
      <div className={styles.ipTags}>
        {ips.map((ip) => (
          <span key={ip} className={styles.ipTag}>
            {ip}
            <button
              type="button"
              className={styles.ipRemoveBtn}
              onClick={() => removeIp(ip)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.ipInput}
          placeholder="IP را وارد کرده و Enter بزنید"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>
      <small className={styles.ipHint}>
        می‌توانید چندین IP را با کاما یا Enter جدا کنید
      </small>
    </div>
  );
};

export default function ManagerPolicies() {
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organizationId;
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form, setForm] = useState({ name: '', options: { ...defaultOptions } });

  const { data, isLoading } = useQuery({
    queryKey: ['policies', orgId],
    queryFn: () => getTemplates(orgId),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createTemplate(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['policies']);
      toast.success('قانون ایجاد شد');
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTemplate(orgId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['policies']);
      toast.success('قانون به‌روزرسانی شد');
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTemplate(orgId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['policies']);
      toast.success('قانون حذف شد');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'خطا در حذف قانون');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id) => setDefaultTemplate(orgId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['policies']);
      toast.success('قانون فعال تغییر کرد');
    },
  });

  const resetForm = () => {
    setForm({ name: '', options: { ...defaultOptions } });
    setEditingPolicy(null);
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setForm({
      name: policy.name,
      options: { ...policy.options },
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('نام قانون الزامی است');
      return;
    }
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className={styles.header}>
        <h1>قوانین سازمان</h1>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
        >
          افزودن قانون
        </Button>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className={styles.list}
      >
        {data?.data?.data?.length === 0 ? (
          <div className={styles.noItem}>
            <NoItem />
          </div>
        ) : (
          data?.data?.data?.map((p) => (
            <motion.div
              key={p._id}
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
            >
              <Card className={styles.card}>
                <div>
                  <h3>
                    {`${p.name} `}
                    {p.isDefault && <span className={styles.default}> فعال</span>}
                  </h3>
                </div>
                <div className={styles.actions}>
                  {!p.isDefault && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDefaultMutation.mutate(p._id)}
                    >
                      فعال‌سازی
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(p)}>
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (confirm('حذف شود؟')) deleteMutation.mutate(p._id);
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPolicy ? 'ویرایش قانون' : 'قانون جدید'}
      >
        <div className={styles.form}>
          <FormField
            label="نام"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.options.filePersistence}
              onChange={(e) =>
                setForm({
                  ...form,
                  options: { ...form.options, filePersistence: e.target.checked },
                })
              }
            />{' '}
            ماندگاری فایل
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.options.clipboard}
              onChange={(e) =>
                setForm({
                  ...form,
                  options: { ...form.options, clipboard: e.target.checked },
                })
              }
            />{' '}
            کلیپ‌بورد
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.options.uploadEnabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  options: { ...form.options, uploadEnabled: e.target.checked },
                })
              }
            />{' '}
            آپلود
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.options.downloadEnabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  options: { ...form.options, downloadEnabled: e.target.checked },
                })
              }
            />{' '}
            دانلود
          </label>
          <FormField
            label="حداکثر زمان نشست (دقیقه)"
            type="number"
            value={form.options.maxSessionDuration}
            onChange={(e) =>
              setForm({
                ...form,
                options: { ...form.options, maxSessionDuration: Number(e.target.value) },
              })
            }
          />
          <FormField
            label="حداکثر نشست همزمان"
            type="number"
            value={form.options.maxConcurrentSessions}
            onChange={(e) =>
              setForm({
                ...form,
                options: { ...form.options, maxConcurrentSessions: Number(e.target.value) },
              })
            }
            min={1}
          />

          {/* IP blocking – tag input */}
          <div className={styles.field}>
            <label className={styles.label}>IP‌های مسدود</label>
            <IpTagInput
              ips={form.options.blockedIps || []}
              onChange={(newIps) =>
                setForm({
                  ...form,
                  options: { ...form.options, blockedIps: newIps },
                })
              }
            />
          </div>

          <div className={styles.modalActions}>
            <Button
              onClick={handleSave}
              loading={createMutation.isLoading || updateMutation.isLoading}
            >
              ذخیره
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}