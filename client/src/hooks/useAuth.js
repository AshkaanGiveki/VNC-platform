import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/authService';

export function useAuth() {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    const { data } = await loginApi(credentials);
    dispatch(setCredentials(data));
    if (data.user.role === 'superadmin') navigate('/admin');
    else if (data.user.role === 'org_admin') navigate('/manager');
    else navigate('/user');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return { ...auth, handleLogin, handleLogout };
}