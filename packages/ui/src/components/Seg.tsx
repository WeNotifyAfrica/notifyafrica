import type { ReactNode } from "react";

export interface SegOption {
  value: string;
  label: ReactNode;
}

export function Seg({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="seg">
      {options.map((opt) => (
        <label className="seg-opt" key={opt.value}>
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
