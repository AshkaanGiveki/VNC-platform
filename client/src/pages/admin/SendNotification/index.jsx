import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Card from '../../../components/common/Card';
import toast from 'react-hot-toast';
import styles from './index.module.scss';
import { notificationCategories } from '../../../locales/fa';

export default function SendNotification() {
  const [form, setForm] = useState({
    scope: 'platform',
    title: '',
    body: '',
    category: 'info',
    recipientIds: '',
    organizationId: '',
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
    };
    if (form.scope === 'user') {
      payload.recipientIds = form.recipientIds.split(',').map(s => s.trim());
    }
    if (form.scope === 'organization') {
      payload.organizationId = form.organizationId;
    }
    mutation.mutate(payload);
  };

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
            options={[
              { label: 'کل پلتفرم', value: 'platform' },
              { label: 'یک سازمان', value: 'organization' },
              { label: 'کاربر(ان) خاص', value: 'user' },
            ]}
          />
          {form.scope === 'organization' && (
            <FormField
              label="شناسه سازمان"
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              required
            />
          )}
          {form.scope === 'user' && (
            <FormField
              label="شناسه کاربران (با کاما جدا کنید)"
              value={form.recipientIds}
              onChange={(e) => setForm({ ...form, recipientIds: e.target.value })}
              required
            />
          )}
          <Button type="submit" className={styles.button} loading={mutation.isLoading}>ارسال</Button>
        </form>
      </Card>
    </div>
  );
}