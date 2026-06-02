// import { useState, useEffect, useRef } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { getUsers } from '../../../services/userService';
// import apiClient from '../../../services/apiClient';
// import { useSelector } from 'react-redux';
// import { cn } from '../../../utils/cn';
// import styles from './index.module.scss';
// import crossIcon from '../../../assets/icons/cancel.png'

// export default function UserSelect({
//   orgId,
//   roles,                    // ← can be a string or array
//   includeOrg,
//   value = [],
//   onChange,
//   placeholder = 'جستجوی کاربر...',
// }) {
//   const [search, setSearch] = useState('');
//   const [debouncedSearch, setDebouncedSearch] = useState('');
//   const [isOpen, setIsOpen] = useState(false);
//   const [selected, setSelected] = useState(value);
//   const inputRef = useRef(null);
//   const { user } = useSelector((state) => state.auth);
//   const isSuperadmin = user?.role === 'superadmin';

//   // Sync external value changes
//   useEffect(() => { setSelected(value); }, [value]);

//   // Debounce search
//   useEffect(() => {
//     const timer = setTimeout(() => setDebouncedSearch(search), 300);
//     return () => clearTimeout(timer);
//   }, [search]);


//  const { data: usersData, isLoading } = useQuery({
//     queryKey: ['userSearch', isSuperadmin ? 'all' : orgId, roles, debouncedSearch],
//     queryFn: async () => {
//       const params = { search: debouncedSearch, limit: 10 };
//       if (roles) {
//         // Pass roles as comma-separated string for the backend
//         params.role = Array.isArray(roles) ? roles.join(',') : roles;
//       }
//       if (isSuperadmin) {
//         return apiClient.get('/users/all', { params });
//       }
//       return getUsers(orgId, params);
//     },
//     enabled: debouncedSearch.length >= 3 && (!!orgId || isSuperadmin),
//   });


//   const users = usersData?.data?.data || [];

//   const addUser = (u) => {
//     const newSelected = [...selected, u];
//     setSelected(newSelected);
//     onChange(newSelected);                     // ← send full objects
//     setSearch('');
//     setDebouncedSearch('');
//     setIsOpen(false);
//     inputRef.current?.focus();
//   };

//   const removeUser = (userId) => {
//     const newSelected = selected.filter(x => x._id !== userId);
//     setSelected(newSelected);
//     onChange(newSelected);                     // ← send full objects
//   };

//   const handleInputKeyDown = (e) => {
//     if (e.key === 'Enter' && users.length > 0) {
//       e.preventDefault();
//       addUser(users[0]);
//     } else if (e.key === 'Escape') {
//       setIsOpen(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const val = e.target.value;
//     setSearch(val);
//     setIsOpen(val.length >= 3);
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.selectedList}>
//         {selected.map(u => (
//           <div key={u._id} className={styles.assignedItem}>
//             <span key={u._id} className={styles.name}>
//               {u.firstName} {u.lastName}
//               {includeOrg && u.organizationId?.name && (
//                 <span className={styles.orgName}>({u.organizationId.name})</span>
//               )}
//             </span>
//             <div className={styles.unassign} onClick={() => removeUser(u._id)}>
//               <img src={crossIcon} alt="حذف" title="حذف" />
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className={styles.inputWrapper}>
//         <input
//           ref={inputRef}
//           type="text"
//           className={styles.searchInput}
//           placeholder={placeholder}
//           value={search}
//           onChange={handleInputChange}
//           onFocus={() => { if (search.length >= 3) setIsOpen(true); }}
//           onKeyDown={handleInputKeyDown}
//         />
//         {isOpen && debouncedSearch.length >= 3 && (
//           <div className={styles.dropdown}>
//             {isLoading && <div className={styles.loading}>در حال جستجو...</div>}
//             {!isLoading && users.length === 0 && (
//               <div className={styles.noResult}>کاربری یافت نشد</div>
//             )}
//             {users.map(u => (
//               <div
//                 key={u._id}
//                 className={cn(styles.option, selected.find(s => s._id === u._id) && styles.selected)}
//                 onClick={() => addUser(u)}
//               >
//                 <div className={styles.userOption}>
//                   <span>{u.firstName} {u.lastName}</span>
//                   {includeOrg && u.organizationId?.name && (
//                     <small className={styles.orgLabel}>{u.organizationId.name}</small>
//                   )}
//                 </div>
//                 <small className={styles.email}>{u.email}</small>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../../services/userService';
import apiClient from '../../../services/apiClient';
import { useSelector } from 'react-redux';
import { cn } from '../../../utils/cn';
import styles from './index.module.scss';
import crossIcon from '../../../assets/icons/cancel.png';
import moreIcon from '../../../assets/icons/more.png';
import Modal from '../../common/Modal';   // <-- add Modal import

export default function UserSelect({
  orgId,
  roles,
  includeOrg,
  value = [],
  onChange,
  placeholder = 'جستجوی کاربر...',
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const [showAllOpen, setShowAllOpen] = useState(false);   // new state for modal
  const inputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const isSuperadmin = user?.role === 'superadmin';

  // Sync external value changes
  useEffect(() => { setSelected(value); }, [value]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['userSearch', isSuperadmin ? 'all' : orgId, roles, debouncedSearch],
    queryFn: async () => {
      const params = { search: debouncedSearch, limit: 10 };
      if (roles) {
        params.role = Array.isArray(roles) ? roles.join(',') : roles;
      }
      if (isSuperadmin) {
        return apiClient.get('/users/all', { params });
      }
      return getUsers(orgId, params);
    },
    enabled: debouncedSearch.length >= 3 && (!!orgId || isSuperadmin),
  });

  const users = usersData?.data?.data || [];

  const addUser = (u) => {
    const newSelected = [...selected, u];
    setSelected(newSelected);
    onChange(newSelected);
    setSearch('');
    setDebouncedSearch('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeUser = (userId) => {
    const newSelected = selected.filter(x => x._id !== userId);
    setSelected(newSelected);
    onChange(newSelected);
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
  const remainingCount = selected.length - 6;

  return (
    <div className={styles.container}>
      <div className={styles.selectedList}>
        {displayedUsers.map(u => (
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
            <img src={moreIcon} alt="more" title='بیشتر' />
            مشاهده تمامی {selected.length} فرد انتخاب شده
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
            {users.map(u => (
              <div
                key={u._id}
                className={cn(styles.option, selected.find(s => s._id === u._id) && styles.selected)}
                onClick={() => addUser(u)}
              >
                <div className={styles.userOption}>
                  <span>{u.firstName} {u.lastName}</span>
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

      {/* Modal showing all selected users */}
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