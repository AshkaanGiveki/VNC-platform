import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../../../services/apiClient';
import Button from '../../../components/common/Button';
import FormField from '../../../components/common/FormField';
import Card from '../../../components/common/Card';
import UserSelect from '../../../components/common/UserSelect';
import toast from 'react-hot-toast';
import styles from './index.module.scss';
import { notificationCategories } from '../../../locales/fa';

export default function SendNotification() {
    const { user } = useSelector((state) => state.auth);
    const orgId = user?.organizationId;
    const isSuperadmin = user?.role === 'superadmin';
    const isManager = user?.role === 'manager';

    const [form, setForm] = useState({
        scope: isSuperadmin ? 'platform' : 'organization',
        title: '',
        body: '',
        category: 'info',
    });

    const [selectedUsers, setSelectedUsers] = useState([]);   // full user objects

    const mutation = useMutation({
        mutationFn: (data) => apiClient.post('/notifications', data),
        onSuccess: () => {
            toast.success('اعلان ارسال شد');
            setSelectedUsers([]);
        },
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

        if (form.scope === 'organization') {
            payload.organizationId = orgId;
        } else if (form.scope === 'user' || form.scope === 'admins') {
            payload.recipientIds = selectedUsers.map(u => u._id);
            if (form.scope === 'admins' && orgId) {
                payload.organizationId = orgId;
            }
        }

        mutation.mutate(payload);
    };

    // Determine role filter and placeholder for UserSelect
    let userRoleFilter = [];
    let userPlaceholder = 'جستجوی کاربر...';

    if (form.scope === 'admins') {
        if (isSuperadmin) {
            userRoleFilter = ['manager', 'org_admin'];   // both managers and admins
            userPlaceholder = 'جستجوی مدیر / ادمین...';
        } else if (isManager) {
            userRoleFilter = 'org_admin';                // only admins
            userPlaceholder = 'جستجوی ادمین...';
        }
    } else if (form.scope === 'user') {
        userRoleFilter = 'user';
        userPlaceholder = 'جستجوی کاربر...';
    }

    // Scope options
    const scopeOptions = [];
    if (isSuperadmin) {
        scopeOptions.push(
            { label: 'کل پلتفرم', value: 'platform' },
            { label: 'کاربران خاص', value: 'user' },
            { label: 'مدیران', value: 'admins' },        // label clarified
        );
    } else if (isManager) {
        scopeOptions.push(
            { label: 'کل سازمان', value: 'organization' },
            { label: 'ادمین‌ها', value: 'admins' },
            { label: 'کاربران خاص', value: 'user' },
        );
    } else {
        scopeOptions.push(
            { label: 'کل سازمان', value: 'organization' },
            { label: 'کاربران خاص', value: 'user' },
        );
    }

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
                        onChange={(e) => {
                            setForm({ ...form, scope: e.target.value });
                            setSelectedUsers([]);
                        }}
                        options={scopeOptions}
                    />
                    {(form.scope === 'user' || form.scope === 'admins') && (
                        <UserSelect
                            orgId={isSuperadmin ? null : orgId}
                            roles={userRoleFilter}
                            includeOrg={isSuperadmin}
                            value={selectedUsers}
                            onChange={setSelectedUsers}
                            placeholder={userPlaceholder}
                        />
                    )}
                    <Button type="submit" loading={mutation.isLoading}>ارسال</Button>
                </form>
            </Card>
        </div>
    );
}