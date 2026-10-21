"use client";

import { useState } from "react";

export function DiscountCodeForm({ onApplied }: { onApplied: (discount: any) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleApply = async () => {
    const res = await fetch("/api/discount", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    const data: any = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    onApplied(data);
  };

  return (
    <div className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Kortingscode"
        className="rounded border px-3 py-2"
      />
      <div
        onClick={handleApply}
        className="cursor-pointer rounded bg-violet-600 px-4 py-2 text-white"
      >
        Toepassen
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
