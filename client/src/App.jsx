import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useTheme from './hooks/useTheme';
import { router } from './router';
import './styles/global.scss';

export default function App() {
  const { theme } = useTheme();
  return (
    <div className={`app ${theme}`}>
      <Toaster position="bottom-left" toastOptions={{ className: 'rtl-toast' }} />
      <RouterProvider router={router} />
    </div>
  );
}