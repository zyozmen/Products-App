export const formatCOP = (value) => {
  const rounded = Math.round(Number(value) || 0);
  return '$' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};