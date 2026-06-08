import { createBrowserRouter, redirect } from 'react-router-dom';
import store from './redux/store';
import { restoreSession, logout } from './redux/slices/authSlice';
import { ROUTES } from './config/routes';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import { lazy, Suspense } from 'react';
import Loader from './components/common/Loader';
import apiClient from './services/apiClient';

const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Organizations = lazy(() => import('./pages/admin/Organizations'));
const Images = lazy(() => import('./pages/admin/Images'));
const Logs = lazy(() => import('./pages/admin/Logs'));
const ManagerDashboard = lazy(() => import('./pages/manager/Dashboard'));
const Users = lazy(() => import('./pages/manager/Users'));
const Workspaces = lazy(() => import('./pages/manager/Workspaces'));
const Policies = lazy(() => import('./pages/manager/Policies'));
const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const UserWorkspaces = lazy(() => import('./pages/user/Workspaces'));
const Sessions = lazy(() => import('./pages/user/Sessions'));
const Files = lazy(() => import('./pages/user/Files'));
const Recordings = lazy(() => import('./pages/user/Recordings'));
const Notifications = lazy(() => import('./pages/user/Notifications'));
const Profile = lazy(() => import('./pages/shared/Profile'));
const NotFound = lazy(() => import('./pages/shared/NotFound'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const ManagerNotifications = lazy(() => import('./pages/manager/Notifications'));
const ManagerSessions = lazy(() => import('./pages/manager/Sessions'));
const SendNotification = lazy(() => import('./pages/shared/SendNotification'));
const ManagerRecordings = lazy(() => import('./pages/manager/Recordings'));

async function ensureUser() {
  const { auth } = store.getState();
  if (auth.isAuthenticated && !auth.user) {
    try {
      const { data } = await apiClient.get('/auth/me');
      store.dispatch(restoreSession(data.data.user));
      return store.getState().auth;
    } catch (err) {
      store.dispatch(logout());
      throw redirect(ROUTES.LOGIN);
    }
  }
  return auth;
}

async function requireAuth(roles) {
  const auth = await ensureUser();
  if (!auth.isAuthenticated) return redirect(ROUTES.LOGIN);
  if (roles) {
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!roleList.includes(auth.user?.role)) return redirect(ROUTES.NOT_FOUND);
  }
  return null;
}

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loader fullScreen />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <SuspenseWrapper><Login /></SuspenseWrapper> },
      { path: '/forgot-password', element: <SuspenseWrapper><ForgotPassword /></SuspenseWrapper> },
      { path: '/reset-password/:token', element: <SuspenseWrapper><ResetPassword /></SuspenseWrapper> },
    ],
  },
  {
    element: <DashboardLayout />,
    loader: () => requireAuth('superadmin'),
    children: [
      { path: '/admin', element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
      { path: '/admin/organizations', element: <SuspenseWrapper><Organizations /></SuspenseWrapper> },
      { path: '/admin/images', element: <SuspenseWrapper><Images /></SuspenseWrapper> },
      { path: '/admin/logs', element: <SuspenseWrapper><Logs /></SuspenseWrapper> },
      { path: '/admin/sendnotifications', element: <SuspenseWrapper><SendNotification /></SuspenseWrapper> },
      { path: '/admin/notifications', element: <SuspenseWrapper><AdminNotifications /></SuspenseWrapper> },
    ],
  },
  {
    element: <DashboardLayout />,
    loader: () => requireAuth(['org_admin', 'manager']),   // ← FIXED
    children: [
      { path: '/manager', element: <SuspenseWrapper><ManagerDashboard /></SuspenseWrapper> },
      { path: '/manager/users', element: <SuspenseWrapper><Users /></SuspenseWrapper> },
      { path: '/manager/workspaces', element: <SuspenseWrapper><Workspaces /></SuspenseWrapper> },
      { path: '/manager/policies', element: <SuspenseWrapper><Policies /></SuspenseWrapper> },
      { path: '/manager/notifications', element: <SuspenseWrapper><ManagerNotifications /></SuspenseWrapper> },
      { path: '/manager/sendnotifications', element: <SuspenseWrapper><SendNotification /></SuspenseWrapper> },
      { path: '/manager/recordings', element: <SuspenseWrapper><ManagerRecordings /></SuspenseWrapper> },
      { path: '/manager/sessions', element: <SuspenseWrapper><ManagerSessions /></SuspenseWrapper> },
      ],
  },
  {
    element: <DashboardLayout />,
    loader: () => requireAuth('user'),
    children: [
      { path: '/user', element: <SuspenseWrapper><UserDashboard /></SuspenseWrapper> },
      { path: '/user/workspaces', element: <SuspenseWrapper><UserWorkspaces /></SuspenseWrapper> },
      { path: '/user/sessions', element: <SuspenseWrapper><Sessions /></SuspenseWrapper> },
      { path: '/user/sessions/:sessionId/files', element: <SuspenseWrapper><Files /></SuspenseWrapper> },
      { path: '/user/recordings', element: <SuspenseWrapper><Recordings /></SuspenseWrapper> },
      { path: '/user/notifications', element: <SuspenseWrapper><Notifications /></SuspenseWrapper> },
    ],
  },
  {
    element: <DashboardLayout />,
    loader: () => requireAuth(),
    children: [
      { path: '/profile', element: <SuspenseWrapper><Profile /></SuspenseWrapper> },
    ],
  },

  {
  path: '/',
  loader: () => {
    const { auth } = store.getState();
    if (auth.isAuthenticated) {
      const role = auth.user?.role;
      if (role === 'superadmin') return redirect('/admin');
      if (role === 'manager' || role === 'org_admin') return redirect('/manager');
      return redirect('/user');
    }
    return redirect('/login');
  },
  element: null, // loader handles everything
},
  { path: '*', element: <NotFound /> },
]);