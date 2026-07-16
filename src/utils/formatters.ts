export function formatDate(value: string | null) {
  if (!value) return "-";
  const [, month, day] = value.slice(0, 10).split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function formatDateTime(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");
  return `${year}. ${Number(month)}. ${Number(day)}. ${time.slice(0, 5)}`;
}
