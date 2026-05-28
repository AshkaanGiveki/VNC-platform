import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessionFiles, uploadFile, downloadFile, deleteFile } from '../../../services/fileService';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';

export default function UserFiles() {
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sessionFiles', sessionId],
    queryFn: () => getSessionFiles(sessionId),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData) => uploadFile(sessionId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessionFiles', sessionId]);
      toast.success('فایل آپلود شد');
      setFile(null);
    },
    onError: (err) => toast.error('خطا در آپلود'),
  });

  const handleUpload = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    uploadMutation.mutate(fd);
  };

  const handleDownload = async (fileId) => {
    try {
      const res = await downloadFile(sessionId, fileId);
      window.open(res.data.url, '_blank'); // or handle redirect
    } catch (err) {
      toast.error('خطا در دانلود');
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <h1>فایل‌های نشست</h1>
      <div className={styles.upload}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <Button onClick={handleUpload} loading={uploadMutation.isLoading}>آپلود</Button>
      </div>
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className={styles.list}>
        {data?.data?.data?.map((f) => (
          <motion.div key={f._id} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
            <Card className={styles.fileCard}>
              <div>
                <h4>{f.fileName}</h4>
                <p>{Math.round(f.fileSize / 1024)} KB</p>
              </div>
              <div className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => handleDownload(f._id)}>دانلود</Button>
                <Button size="sm" variant="secondary" onClick={() => deleteFile(sessionId, f._id).then(() => queryClient.invalidateQueries(['sessionFiles', sessionId]))}>حذف</Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}