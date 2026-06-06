import { cn } from '../../../utils/cn';
import styles from './index.module.scss';
import arrowIcon from '../../../assets/icons/arrow.png';

export default function FormField({
  label,
  error,
  type = 'text',
  className,
  as,
  options,
  showDefaultOption = true, 
  ...props
}) {
  const inputProps = {
    className: cn(styles.input, error && styles.error),
    ...props,
  };

  return (
    <div className={cn(styles.field, className)}>
      {label && <label className={styles.label}>{label}</label>}

      {as === 'select' ? (
        <div className={styles.selectWrapper}>
          <select {...inputProps}>
            {showDefaultOption && <option value="">-- انتخاب کنید --</option>}
            {options?.map((opt) => {
              if (typeof opt === 'string') {
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              }
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
          </select>
          <img
            src={arrowIcon}
            alt="arrow"
            className={`${styles.arrowIcon} icon`}
          />
        </div>
      ) : (
        <input type={type} {...inputProps} />
      )}

      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}