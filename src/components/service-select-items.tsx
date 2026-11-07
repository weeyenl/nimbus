import React from "react";
import { SelectGroup, SelectItem, SelectLabel } from "@/components/ui/select";
import { MockService } from "@/lib/mock-data";

/** Service options grouped by category, for use inside <SelectContent>. */
export function ServiceSelectItems({ services }: { services: MockService[] }) {
  const categories = Array.from(new Set(services.map((s) => s.category || "Other")));
  return (
    <>
      {categories.map((cat) => (
        <SelectGroup key={cat}>
          <SelectLabel>{cat}</SelectLabel>
          {services
            .filter((s) => (s.category || "Other") === cat)
            .map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.duration} mins · from ${s.basePrice})
              </SelectItem>
            ))}
        </SelectGroup>
      ))}
    </>
  );
}
