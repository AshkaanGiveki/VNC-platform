export function toJalali(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fa-IR');
}