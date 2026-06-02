import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/authService';

// Map role to dashboard path
const roleDashboard = {
  superadmin: '/admin',
  org_admin: '/manager',
  manager: '/manager',
  user: '/user',
};

export function useAuth() {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    const { data } = await loginApi(credentials);
    const payload = data.data;
    dispatch(setCredentials(payload));

    // Fetch CSRF token
    const { getCsrfToken } = await import('../services/authService');
    const csrfRes = await getCsrfToken();
    dispatch(setCsrfToken(csrfRes.data.token));
    document.cookie = `csrf-token=${csrfRes.data.token}; path=/; SameSite=Strict`;

    const dashboardPath = roleDashboard[payload.user.role] || '/user';
    navigate(dashboardPath);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return { ...auth, handleLogin, handleLogout };
}