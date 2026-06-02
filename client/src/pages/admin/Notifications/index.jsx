import NotificationsPage from '../../shared/NotificationsPage';
import { getNotifications } from '../../../services/notificationService';

export default function AdminNotifications() {
  return <NotificationsPage fetchFn={getNotifications} />;
}