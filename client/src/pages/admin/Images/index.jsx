import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getImages, createImage, updateImage } from '../../../services/imageService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Modal from '../../../components/common/Modal';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function Images() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingImg, setEditingImg] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'custom',
    dockerImage: '',
    version: 'latest',
    iconUrl: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: getImages,
  });

  const createMutation = useMutation({
    mutationFn: createImage,
    onSuccess: () => {
      queryClient.invalidateQueries(['images']);
      toast.success('تصویر اضافه شد');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateImage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['images']);
      toast.success('تصویر به‌روزرسانی شد');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }) => updateImage(id, { isEnabled: !isEnabled }),
    onSuccess: () => queryClient.invalidateQueries(['images']),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingImg(null);
    setForm({ name: '', type: 'custom', dockerImage: '', version: 'latest', iconUrl: '' });
  };

  const handleEdit = (img) => {
    setEditingImg(img);
    setForm({
      name: img.name,
      type: img.type,
      dockerImage: img.dockerImage,
      version: img.version,
      iconUrl: img.iconUrl || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.dockerImage.trim()) {
      toast.error('نام و آدرس تصویر الزامی هستند');
      return;
    }
    if (editingImg) {
      updateMutation.mutate({ id: editingImg._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <Loader fullScreen />;

  return (
    <div>
      <div className={styles.header}>
        <h1>مدیریت تصاویر</h1>
        <Button onClick={() => setModalOpen(true)}>افزودن تصویر</Button>
      </div>

      <motion.div className={styles.grid} variants={containerVariants} initial="hidden" animate="show">
        {data?.data?.data?.length === 0 ?
                  <div className={styles.noItem}>
                    <NoItem />
                  </div> :
                  data?.data?.data?.map((img) => (
          <motion.div key={img._id} variants={itemVariants}>
            <Card className={styles.imageCard}>
              <div className={styles.top}>
                {img.iconUrl ? (
                  <img src={img.iconUrl} alt={img.name} className={styles.imagePreview} />
                ) : (
                  <div className={styles.defaultImage}>🖼️</div>
                )}
                <div className={styles.info}>
                  <h3>{img.name}</h3>
                  <p className={styles.meta}>
                    {img.type} | v{img.version}
                  </p>
                  <p className={styles.dockerRef}>{img.dockerImage}</p>
                </div>
              </div>
              <div className={styles.actions}>
                <span className={`${styles.statusBadge} ${img.isEnabled ? styles.active : styles.inactive}`}>
                  {img.isEnabled ? 'فعال' : 'غیرفعال'}
                </span>
                <div className={styles.btnGroup}>
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(img)}>
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleMutation.mutate({ id: img._id, isEnabled: img.isEnabled })}
                  >
                    {img.isEnabled ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingImg ? 'ویرایش تصویر' : 'افزودن تصویر'}>
        <div className={styles.form}>
          <FormField label="نام تصویر" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormField
            label="نوع"
            as="select"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={['ubuntu', 'chrome', 'firefox', 'onlyoffice', 'custom']}
          />
          <FormField label="آدرس Docker" value={form.dockerImage} onChange={(e) => setForm({ ...form, dockerImage: e.target.value })} required />
          <FormField label="نسخه" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <FormField label="آدرس تصویر (URL)" value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://example.com/icon.png" />
          <div className={styles.modalActions}>
            <Button onClick={handleSave} loading={createMutation.isLoading || updateMutation.isLoading}>ذخیره</Button>
            <Button variant="secondary" onClick={closeModal}>انصراف</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}