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

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function Images() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'custom',
    dockerImage: '',
    version: 'latest',
  });

  // Fetch images
  const { data, isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: getImages,
  });

  // Toggle enable/disable
  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }) => updateImage(id, { isEnabled: !isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['images']);
      toast.success('وضعیت تصویر تغییر کرد');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  // Create image
  const createMutation = useMutation({
    mutationFn: createImage,
    onSuccess: () => {
      queryClient.invalidateQueries(['images']);
      toast.success('تصویر اضافه شد');
      setModalOpen(false);
      setForm({ name: '', type: 'custom', dockerImage: '', version: 'latest' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const handleCreate = () => {
    if (!form.name.trim() || !form.dockerImage.trim()) {
      toast.error('نام و آدرس تصویر الزامی هستند');
      return;
    }
    createMutation.mutate(form);
  };

  if (isLoading) return <Loader fullScreen />;

  const images = data?.data?.data || [];

  return (
    <div>
      <div className={styles.header}>
        <h1>مدیریت تصاویر</h1>
        <Button onClick={() => setModalOpen(true)}>افزودن تصویر</Button>
      </div>

      <motion.div
        className={styles.grid}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {images.map((img) => (
          <motion.div key={img._id} variants={itemVariants}>
            <Card className={styles.imageCard}>
              <div className={styles.info}>
                <h3>{img.name}</h3>
                <p className={styles.type}>
                  {img.type} | {img.version}
                </p>
                <p className={styles.dockerImage}>{img.dockerImage}</p>
              </div>
              <div className={styles.actions}>
                <span className={img.isEnabled ? styles.active : styles.inactive}>
                  {img.isEnabled ? 'فعال' : 'غیرفعال'}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    toggleMutation.mutate({ id: img._id, isEnabled: img.isEnabled })
                  }
                >
                  {img.isEnabled ? 'غیرفعال کردن' : 'فعال کردن'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="افزودن تصویر جدید"
      >
        <div className={styles.form}>
          <FormField
            label="نام تصویر"
            placeholder="مثال: Ubuntu Focal Desktop"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <FormField
            label="نوع"
            as="select"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={['ubuntu', 'chrome', 'firefox', 'onlyoffice', 'custom']}
          />
          <FormField
            label="آدرس Docker (Docker Image)"
            placeholder="مثال: kasmweb/ubuntu-focal-desktop:1.14.0"
            value={form.dockerImage}
            onChange={(e) => setForm({ ...form, dockerImage: e.target.value })}
            required
          />
          <FormField
            label="نسخه"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            placeholder="latest"
          />
          <div className={styles.modalActions}>
            <Button onClick={handleCreate} loading={createMutation.isLoading}>
              افزودن
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