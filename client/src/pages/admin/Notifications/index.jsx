import NotificationsPage from '../../shared/NotificationsPage';
import { getAdminNotifications } from '../../../services/notificationService';

export default function AdminNotifications() {
  return <NotificationsPage fetchFn={getAdminNotifications} />;
}