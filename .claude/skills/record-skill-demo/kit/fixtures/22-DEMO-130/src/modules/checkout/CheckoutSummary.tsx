import type { CartLine } from "@/modules/cart/types";
import { formatPrice } from "@/utils/formatPrice";

import { calculateTotals } from "./calculateTotals";

interface CheckoutSummaryProps {
  lines: CartLine[];
  shippingInCents: number;
}

export function CheckoutSummary({ lines, shippingInCents }: CheckoutSummaryProps) {
  const totals = calculateTotals(lines, shippingInCents);
  return (
    <table className="w-full">
      <caption className="sr-only">Overzicht van je bestelling</caption>
      <thead>
        <tr>
          <th scope="col">Product</th>
          <th scope="col">Aantal</th>
          <th scope="col">Prijs</th>
          <th scope="col">Btw</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.productId}>
            <td>{line.name}</td>
            <td>{line.quantity}</td>
            <td>{formatPrice(line.priceInCents * line.quantity)}</td>
            <td>{line.vatRate * 100}%</td>
          </tr>
        ))}
        <tr>
          <td colSpan={2}>Bezorgkosten</td>
          <td colSpan={2}>{formatPrice(shippingInCents)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colSpan={2}>Totaal excl. btw</th>
          <td colSpan={2}>{formatPrice(totals.excludingVat)}</td>
        </tr>
        <tr>
          <th scope="row" colSpan={2}>Btw</th>
          <td colSpan={2}>{formatPrice(totals.vat)}</td>
        </tr>
        <tr>
          <th scope="row" colSpan={2}>Totaal</th>
          <td colSpan={2}>{formatPrice(totals.includingVat)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
