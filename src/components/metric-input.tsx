"use client";

interface MetricInputProps {
  label: string;
  unit: string;
  description: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

export function MetricInput({ label, unit, description, value, onChange }: MetricInputProps) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{unit}</span>
      </div>
      <p className="text-xs text-slate-400 mb-3">{description}</p>
      <input
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
        className="input"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}
