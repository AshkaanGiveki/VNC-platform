import { Toaster, toast } from 'react-hot-toast';
import { useTheme } from '../../../hooks/useTheme';

export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  loading: (msg) => toast.loading(msg),
  dismiss: toast.dismiss,
};

export default function NotificationToast() {
  // The Toaster is already rendered in App.jsx; this component can be used to re-export notify.
  return null;
}