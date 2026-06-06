import { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUploads,
  uploadFile,
  downloadUploadedFile,
  deleteUploadedFile,
  getDownloads,
  downloadContainerFile,
} from '../../../services/fileService';
import { getSession } from '../../../services/sessionService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import NoItem from '../../../components/common/NoItem';

const getFileIcon = (ext) => {
  const map = {
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    pdf: '📄', doc: '📄', docx: '📄', xls: '📊', xlsx: '📊',
    zip: '📦', tar: '📦', gz: '📦', exe: '⚙️', js: '📜',
    py: '📜', txt: '📝', md: '📝', mp4: '🎬', mp3: '🎵',
  };
  return map[ext] || '📁';
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

export default function UserFiles() {
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch session to get policy
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
  });

  const policy = session?.data?.data?.policySnapshot || {};

  const { data: uploads, isLoading: uploading, refetch: refetchUploads } = useQuery({
    queryKey: ['sessionUploads', sessionId],
    queryFn: () => getUploads(sessionId),
    enabled: activeTab === 'upload',
    staleTime: 0,
  });

  const { data: downloads, isLoading: downloading, refetch: refetchDownloads } = useQuery({
    queryKey: ['sessionDownloads', sessionId],
    queryFn: () => getDownloads(sessionId),
    enabled: activeTab === 'download',
    staleTime: 0,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return uploadFile(sessionId, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessionUploads', sessionId]);
      toast.success('فایل آپلود شد و در پوشه Uploads قرار گرفت');
    },
    onError: () => toast.error('آپلود ناموفق'),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId) => deleteUploadedFile(sessionId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessionUploads', sessionId]);
      toast.success('فایل حذف شد');
    },
    onError: () => toast.error('حذف ناموفق'),
  });

  const handleFileDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  if (uploading || downloading) return <Loader />;

  const uploadedFiles = uploads?.data?.data || [];
  const downloadedFiles = downloads?.data?.data || [];

  return (
    <div>
      <h1 className={styles.pageTitle}>فایل‌های نشست</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          آپلود فایل
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'download' ? styles.active : ''}`}
          onClick={() => setActiveTab('download')}
        >
          دانلود فایل‌های نشست
        </button>
      </div>

      {activeTab === 'upload' && (
        <>
          {policy.uploadEnabled === false ? (
            <div className={styles.disabledMessage}>
              <span className={styles.disabledIcon}>🚫</span>
              <p>آپلود فایل برای این نشست غیرفعال است.</p>
            </div>
          ) : (
            <>
              <Card
                className={`${styles.uploadCard} ${isDragOver ? styles.dragOver : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className={styles.hiddenInput} />
                {uploadMutation.isLoading ? (
                  <Loader />
                ) : (
                  <div className={styles.uploadContent}>
                    <span className={styles.uploadIcon}>📤</span>
                    <p>فایل خود را اینجا رها کنید یا کلیک کنید</p>
                    <small>حداکثر ۵۰ مگابایت</small>
                  </div>
                )}
              </Card>

              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>فایل‌های آپلود شده</h2>
                <button className={styles.refreshBtn} onClick={() => refetchUploads()}>🔄</button>
              </div>

              {uploadedFiles.length === 0 ? (
                <NoItem />
              ) : (
                <div className={styles.fileGrid}>
                  {uploadedFiles.map((f, idx) => {
                    const ext = f.fileName.split('.').pop()?.toLowerCase() || '';
                    const icon = getFileIcon(ext);
                    return (
                      <motion.div
                        key={f._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className={styles.fileCard}
                      >
                        <div className={styles.fileIcon}>{icon}</div>
                        <div className={styles.fileName} title={f.fileName}>{f.fileName}</div>
                        <div className={styles.fileSize}>{formatBytes(f.fileSize)}</div>
                        <div className={styles.fileActions}>
                          {policy.downloadEnabled !== false && (
                            <button
                              className={styles.actionBtn}
                              onClick={() =>
                                downloadUploadedFile(sessionId, f._id).then((res) => {
                                  window.open(res.data.url, '_blank');
                                })
                              }
                            >
                              ⬇️
                            </button>
                          )}
                          <button
                            className={styles.actionBtn}
                            onClick={() => deleteMutation.mutate(f._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'download' && (
        <>
          {policy.downloadEnabled === false ? (
            <div className={styles.disabledMessage}>
              <span className={styles.disabledIcon}>🚫</span>
              <p>دانلود فایل برای این نشست غیرفعال است.</p>
            </div>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <h2>فایل‌های موجود در پوشه Downloads</h2>
                <button className={styles.refreshBtn} onClick={() => refetchDownloads()}>🔄</button>
              </div>
              {downloadedFiles.length === 0 ? (
                <NoItem />
              ) : (
                <div className={styles.fileGrid}>
                  {downloadedFiles.map((file, idx) => {
                    const ext = file.name.split('.').pop()?.toLowerCase() || '';
                    const icon = getFileIcon(ext);
                    return (
                      <motion.div
                        key={file.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className={styles.fileCard}
                      >
                        <div className={styles.fileIcon}>{icon}</div>
                        <div className={styles.fileName} title={file.name}>{file.name}</div>
                        <div className={styles.fileSize}>{formatBytes(file.size)}</div>
                        <button
                          className={styles.downloadBtn}
                          onClick={() => window.open(downloadContainerFile(sessionId, file.name), '_blank')}
                        >
                          ⬇️
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}