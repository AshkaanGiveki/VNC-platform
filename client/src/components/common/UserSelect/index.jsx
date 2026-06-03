import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../../services/userService';
import apiClient from '../../../services/apiClient';
import { useSelector } from 'react-redux';
import { cn } from '../../../utils/cn';
import styles from './index.module.scss';
import crossIcon from '../../../assets/icons/cancel.png';
import Modal from '../Modal';

export default function UserSelect({
  orgId,
  role,
  includeOrg,
  value = [],
  onChange,
  placeholder = 'جستجوی کاربر...',
  multiple = false,
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const [showAllOpen, setShowAllOpen] = useState(false); 
  const inputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const isSuperadmin = user?.role === 'superadmin';

  useEffect(() => { setSelected(value); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['userSearch', isSuperadmin ? 'all' : orgId, role, debouncedSearch],
    queryFn: async () => {
      const params = { search: debouncedSearch, limit: 10 };
      if (role) params.role = role;
      if (isSuperadmin) {
        return apiClient.get('/users/all', { params });
      }
      return getUsers(orgId, params);
    },
    enabled: debouncedSearch.length >= 3 && (!!orgId || isSuperadmin),
  });

  const users = usersData?.data?.data || [];

  const addUser = (u) => {
    if (multiple) {
      const newSelected = [...selected, u];
      setSelected(newSelected);
      onChange(newSelected);                    // full objects for notifications
    } else {
      setSelected([u]);
      onChange(u._id);                          // just the ID string for assignment
    }
    setSearch('');
    setDebouncedSearch('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeUser = (userId) => {
    const newSelected = selected.filter((x) => x._id !== userId);
    setSelected(newSelected);
    if (multiple) {
      onChange(newSelected);
    } else {
      onChange(newSelected.length > 0 ? newSelected[0]._id : '');
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && users.length > 0) {
      e.preventDefault();
      addUser(users[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setIsOpen(val.length >= 3);
  };

  const displayedUsers = selected.length > 6 ? selected.slice(0, 6) : selected;

  return (
    <div className={styles.container}>
      <div className={styles.selectedList}>
        {displayedUsers.map((u) => (
          <div key={u._id} className={styles.assignedItem}>
            <span className={styles.name}>
              {u.firstName} {u.lastName}
              {includeOrg && u.organizationId?.name && (
                <span className={styles.orgName}>({u.organizationId.name})</span>
              )}
            </span>
            <div className={styles.unassign} onClick={() => removeUser(u._id)}>
              <img src={crossIcon} alt="حذف" title="حذف" />
            </div>
          </div>
        ))}
        {selected.length > 6 && (
          <div
            className={styles.showAllButton}
            onClick={() => setShowAllOpen(true)}
          >
            مشاهده تمامی افراد انتخاب شده ({selected.length})
          </div>
        )}
      </div>

      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={() => { if (search.length >= 3) setIsOpen(true); }}
          onKeyDown={handleInputKeyDown}
        />
        {isOpen && debouncedSearch.length >= 3 && (
          <div className={styles.dropdown}>
            {isLoading && <div className={styles.loading}>در حال جستجو...</div>}
            {!isLoading && users.length === 0 && (
              <div className={styles.noResult}>کاربری یافت نشد</div>
            )}
            {users.map((u) => (
              <div
                key={u._id}
                className={cn(
                  styles.option,
                  selected.find((s) => s._id === u._id) && styles.selected,
                )}
                onClick={() => addUser(u)}
              >
                <div className={styles.userOption}>
                  <span>
                    {u.firstName} {u.lastName}
                  </span>
                  {includeOrg && u.organizationId?.name && (
                    <small className={styles.orgLabel}>{u.organizationId.name}</small>
                  )}
                </div>
                <small className={styles.email}>{u.email}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showAllOpen}
        onClose={() => setShowAllOpen(false)}
        title="افراد انتخاب شده"
      >
        <div className={styles.modalList}>
          {selected.map(u => (
            <div key={u._id} className={styles.assignedItem}>
              <span className={styles.name}>
                {u.firstName} {u.lastName}
                {includeOrg && u.organizationId?.name && (
                  <span className={styles.orgName}>({u.organizationId.name})</span>
                )}
              </span>
              <div className={styles.unassign} onClick={() => removeUser(u._id)}>
                <img src={crossIcon} alt="حذف" title="حذف" />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}