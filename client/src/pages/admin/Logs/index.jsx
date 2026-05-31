import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLogs } from '../../../services/logService';
import Card from '../../../components/common/Card';
import Pagination from '../../../components/common/Pagination';
import Loader from '../../../components/common/Loader';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';
import { motion } from 'framer-motion';
import styles from './index.module.scss';
import { toJalali } from '../../../utils/formatDate';
import NoItem from '../../../components/common/NoItem';

// Map English actions to Persian
const actionMap = {
  'user.created': 'ایجاد کاربر',
  'user.updated': 'ویرایش کاربر',
  'user.deleted': 'حذف کاربر',
  'workspace.created': 'ایجاد فضای کاری',
  'session.started': 'شروع نشست',
  'session.stopped': 'توقف نشست',
  'file.uploaded': 'آپلود فایل',
  'policyTemplate.created': 'ایجاد قانون',
  'organization.created': 'ایجاد سازمان',
};

function translateAction(action) {
  return actionMap[action] || action;
}

export default function Logs() {
  const [filters, setFilters] = useState({ page: 1, action: '', resource: '' });
  const { data, isLoading } = useQuery({
    queryKey: ['logs', filters],
    queryFn: () => getLogs(filters),
  });

  return (
    <div>
      <h1 className={styles.pageTitle}>گزارشات سیستم</h1>
      <Card className={styles.filters}>
        <FormField
          placeholder="عملیات (مثلاً session.started)"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
        />
        <FormField
          placeholder="منبع (مثلاً session)"
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value, page: 1 })}
        />
        <Button variant="secondary" onClick={() => setFilters({ ...filters, page: 1 })}>فیلتر</Button>
      </Card>

      {isLoading ? <Loader /> : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>عملیات</th>
                <th>منبع</th>
                <th>کاربر</th>
                <th>سازمان</th>
                <th>زمان</th>
                <th>جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.data?.length === 0 ?
                <div className={styles.noItem}>
                  <NoItem />
                </div> :
                data?.data?.data?.map((log) => (
                  <motion.tr key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    <td>{translateAction(log.action)}</td>
                    <td>{log.resource}</td>
                    <td>
                      {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : '—'}
                      <br />
                      <small className={styles.userId}>{log.userId?._id || '—'}</small>
                    </td>
                    <td>{log.organizationId?.name || '—'}</td>
                    <td>{toJalali(log.timestamp)}</td>
                    <td className={styles.details}>{log.details ? JSON.stringify(log.details) : '—'}</td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.data?.meta && (
        <Pagination page={filters.page} totalPages={data.data.meta.totalPages} onPageChange={(p) => setFilters({ ...filters, page: p })} />
      )}
    </div>
  );
}