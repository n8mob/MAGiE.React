
const shortOptions: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
};

export function shortDate(date: Date): string {
  return date.toLocaleDateString(navigator.language, shortOptions);
}
