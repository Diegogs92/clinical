/**
 * Formatea un número como moneda con punto como separador de miles
 * @param amount - El monto a formatear
 * @returns String formateado con puntos como separador de miles
 * @example formatCurrency(1000) => "1.000"
 * @example formatCurrency(1000000) => "1.000.000"
 */
export function formatCurrency(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
