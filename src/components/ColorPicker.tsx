"use client";
import { THEME_COLORS, isHexColor, isTooLight } from "@/lib/options";

// Ready-made colours plus a "custom" colour wheel. Very light colours are refused because the shop name is written in white on top.
export default function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const custom = !THEME_COLORS.includes(value), light = isTooLight(value);
  return (
    <div>
      <div className="swatches" role="group" aria-label="Shop colour">
        {THEME_COLORS.map((c) => <button type="button" key={c} className="sw" style={{ background: c }} aria-label={`Colour ${c}`} aria-pressed={value === c} onClick={() => onChange(c)} />)}
        <label className={`sw swcustom${custom ? " on" : ""}`} style={custom && isHexColor(value) ? { background: value } : undefined} title="Choose your own colour">
          <span aria-hidden="true">🎨</span><span className="sr">Choose your own colour</span>
          <input type="color" value={isHexColor(value) ? value : "#0c6b58"} onChange={(e) => onChange(e.target.value.toLowerCase())} />
        </label>
      </div>
      <p className="hint muted" style={{ marginTop: 8 }}>Tap 🎨 to pick any colour you like. Your shop colour is {value}.</p>
      {light && <p className="bad hint" role="alert">That colour is too light. The white shop name would be hard to read. Pick a darker one.</p>}
    </div>
  );
}
