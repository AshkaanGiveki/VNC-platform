import NotificationsPage from '../../shared/NotificationsPage';
import { getOrgNotifications } from '../../../services/notificationService';

export default function ManagerNotifications() {
  return <NotificationsPage fetchFn={getOrgNotifications} />;
}