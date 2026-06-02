import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../redux/slices/authSlice';
import { login as loginApi } from '../../../services/authService';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';
import { ROUTES } from '../../../config/routes';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import styles from './index.module.scss';
import { getCsrfToken } from '../../../services/authService';
import { setCsrfToken } from '../../../redux/slices/authSlice';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!captchaVerified) {
            toast.error('لطفاً کپچا را تأیید کنید.');
            return;
        }
        setLoading(true);
        try {

            const res = await loginApi(form);          // full Axios response

            const payload = res.data.data;             // { user, accessToken, refreshToken }
            dispatch(setCredentials(payload));         // only the needed fields
            // const csrfRes = await getCsrfToken();
            // const csrfToken = csrfRes.data.token;
            // dispatch(setCsrfToken(csrfToken));
            // document.cookie = `csrf-token=${csrfToken}; path=/; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''
            //     }`;
            toast.success('ورود موفقیت‌آمیز');
            if (payload.user.role === 'superadmin') navigate('/admin');
            else if (payload.user.role === 'org_admin') navigate('/manager');
            else if (payload.user.role === 'manager') navigate('/manager');
            else navigate('/user');
        } catch (err) {
            if (err.response?.status >= 500) {
                toast.error(err.response?.data?.message || 'خطای سرور');
            } else {
                toast.error('ورود ناموفق');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>ورود | VWP</title></Helmet>
            <motion.div
                className={styles.container}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className={styles.title}>ورود به پلتفرم</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <FormField
                        label="ایمیل"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <FormField
                        label="رمز عبور"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <div className={styles.captcha}>
                        <label className={styles.captchaLabel}>
                            <input
                                type="checkbox"
                                checked={captchaVerified}
                                onChange={(e) => setCaptchaVerified(e.target.checked)}
                            />
                            <span>من ربات نیستم</span>
                        </label>
                    </div>
                    <Button type="submit" loading={loading} className={styles.submitBtn}>
                        ورود
                    </Button>
                    <div className={styles.links}>
                        <Link to={ROUTES.FORGOT_PASSWORD}>فراموشی رمز عبور</Link>
                    </div>
                </form>
                <p className={styles.footerText}>نسخه ۱.۰</p>
            </motion.div>
        </>
    );
}
