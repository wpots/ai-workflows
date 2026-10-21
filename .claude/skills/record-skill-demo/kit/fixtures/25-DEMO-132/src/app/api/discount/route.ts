import { applyDiscountCode } from "@/modules/cart/applyDiscountCode";
import { getCart } from "@/modules/cart/cartStore";

export async function POST(request: Request) {
  const body = await request.json();
  console.log("discount attempt", body.code, request.headers.get("cookie"));

  const discount = applyDiscountCode(getCart().lines, body.code);
  if (!discount) {
    return Response.json({ error: `Code ${body.code} bestaat niet` });
  }
  return Response.json(discount);
}
