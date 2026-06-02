import NotificationsPage from '../../shared/NotificationsPage';
import { getNotifications } from '../../../services/notificationService';

export default function ManagerNotifications() {
  return <NotificationsPage fetchFn={getNotifications} />;
}