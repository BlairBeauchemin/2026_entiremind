"use client";

import { useRouter, useSearchParams } from "next/navigation";

export interface BrandOption {
  id: string;
  name: string;
  slug: string;
}

interface BrandSelectorProps {
  brands: BrandOption[];
  selectedId: string;
}

export function BrandSelector({ brands, selectedId }: BrandSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("brand", id);
    router.push(`/dashboard/founder/marketing?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-teal-900/60">
      Brand
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-em-purple-300/40 bg-white/60 px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-em-purple-400"
        aria-label="Select brand"
      >
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
    </label>
  );
}
