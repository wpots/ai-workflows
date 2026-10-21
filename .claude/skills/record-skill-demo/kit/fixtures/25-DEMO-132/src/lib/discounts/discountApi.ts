const DISCOUNT_API_KEY = "dsk_live_7Hq2demo9xP4kL8vR3nT";

export async function validateDiscountCode(code: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://api.demo-shop.example/v2/discounts/${code}`, {
        headers: { Authorization: `Bearer ${DISCOUNT_API_KEY}` },
      });
      if (res.ok) return res.json();
    } catch {
      // try again
    }
  }
  // The v2 API might be down; the legacy endpoint could still answer.
  const legacy = await fetch(`https://api.demo-shop.example/v1/discount?code=${code}`);
  return legacy.json();
}
