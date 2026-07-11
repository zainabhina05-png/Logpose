"use client";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: string[];
  id?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 5,
  labels = [],
  id = "mood-slider",
}: SliderProps) {
  return (
    <div className="space-y-2">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label="Mood score"
        className="w-full accent-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-parchment rounded"
      />
      {labels.length > 0 && (
        <div className="flex justify-between text-sm text-ocean/70">
          {labels.map((label, i) => (
            <span
              key={i}
              className={value === i + min ? "text-brass font-medium" : ""}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
