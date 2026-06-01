import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../../../services/apiClient';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Card from '../../../components/common/Card';
import toast from 'react-hot-toast';
import styles from './index.module.scss';
import { notificationCategories } from '../../../locales/fa';

export default function ManagerSendNotification() {
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organizationId;
  const isManager = user?.role === 'manager';

  const [form, setForm] = useState({
    scope: 'organization',
    title: '',
    body: '',
    category: 'info',
    recipientIds: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/notifications', data),
    onSuccess: () => toast.success('اعلان ارسال شد'),
    onError: (err) => toast.error(err.response?.data?.message || 'خطا'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      scope: form.scope,
      title: form.title,
      body: form.body,
      category: form.category,
      organizationId: orgId,
    };
    if (form.scope === 'user' || form.scope === 'admins') {
      payload.recipientIds = form.recipientIds.split(',').map(s => s.trim()).filter(Boolean);
    }
    mutation.mutate(payload);
  };

  // Build scope options based on role
  const scopeOptions = isManager
    ? [
      { label: 'کل سازمان', value: 'organization' },
      { label: 'ادمین‌ها', value: 'admins' },
      { label: 'کاربران خاص', value: 'user' },
    ]
    : [
      { label: 'کل سازمان', value: 'organization' },
      { label: 'کاربران خاص', value: 'user' },
    ];

  return (
    <div>
      <h1>ارسال اعلان</h1>
      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField label="عنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <FormField label="متن" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <FormField
            label="دسته‌بندی"
            as="select"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={Object.entries(notificationCategories).map(([key, value]) => ({
              label: value,
              value: key
            }))}
          />
          <FormField
            label="گستره"
            as="select"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            options={scopeOptions}
          />
          {(form.scope === 'user' || form.scope === 'admins') && (
            <FormField
              label="شناسه کاربران (با کاما جدا کنید)"
              value={form.recipientIds}
              onChange={(e) => setForm({ ...form, recipientIds: e.target.value })}
              required
            />
          )}
          <Button type="submit" loading={mutation.isLoading}>ارسال</Button>
        </form>
      </Card>
    </div>
  );
}