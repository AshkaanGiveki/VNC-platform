import { cn } from '../../../utils/cn';
import styles from './index.module.scss';

export default function FormField({
  label,
  error,
  type = 'text',
  className,
  as,
  options,
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
        <select {...inputProps}>
          <option value="">-- انتخاب کنید --</option>
          {options?.map((opt) => {
            // If option is a string, use it as both value and label
            if (typeof opt === 'string') {
              return (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              );
            }
            // If option is an object with label/value
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
      ) : (
        <input type={type} {...inputProps} />
      )}

      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}