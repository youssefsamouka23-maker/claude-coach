// js/widgets.js
// Small SVG widgets: recovery ring, sleep breakdown bar, strain gauge.

function recoveryColor(score) {
  if (score == null) return "#555";
  if (score >= 67) return "#16c172";
  if (score >= 34) return "#f2c14e";
  return "#e3463e";
}

export function recoveryRingSVG(score, size = 160) {
  const r = size / 2 - 12;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - pct / 100);
  const color = recoveryColor(score);
  return `
  <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#26262b" stroke-width="12"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="12"
      stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
      transform="rotate(-90 ${c} ${c})"/>
    <text x="${c}" y="${c - 4}" text-anchor="middle" font-size="34" font-weight="700" fill="#f5f5f7">${score ?? "--"}</text>
    <text x="${c}" y="${c + 22}" text-anchor="middle" font-size="12" fill="#9a9aa2" letter-spacing="1">RECOVERY</text>
  </svg>`;
}

export function strainGaugeSVG(strain, size = 160) {
  // WHOOP strain scale: 0-21
  const max = 21;
  const pct = strain == null ? 0 : Math.max(0, Math.min(max, strain)) / max;
  const r = size / 2 - 14;
  const c = size / 2;
  const startAngle = Math.PI; // 180deg
  const endAngle = Math.PI + Math.PI * pct;
  const x1 = c + r * Math.cos(startAngle);
  const y1 = c + r * Math.sin(startAngle);
  const x2 = c + r * Math.cos(endAngle);
  const y2 = c + r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;
  const bgX2 = c + r * Math.cos(2 * Math.PI);
  const bgY2 = c + r * Math.sin(2 * Math.PI);

  let color = "#2c9bf0";
  if (strain >= 14) color = "#f2841e";
  if (strain >= 18) color = "#e3463e";

  return `
  <svg viewBox="0 0 ${size} ${size / 1.7}" width="${size}" height="${size / 1.7}">
    <path d="M ${c - r} ${c} A ${r} ${r} 0 0 1 ${bgX2} ${bgY2}" fill="none" stroke="#26262b" stroke-width="12" stroke-linecap="round"/>
    ${
      pct > 0
        ? `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"/>`
        : ""
    }
    <text x="${c}" y="${c - 6}" text-anchor="middle" font-size="28" font-weight="700" fill="#f5f5f7">${strain != null ? strain.toFixed(1) : "--"}</text>
    <text x="${c}" y="${c + 14}" text-anchor="middle" font-size="11" fill="#9a9aa2" letter-spacing="1">STRAIN</text>
  </svg>`;
}

export function sleepBreakdownHTML(sleep) {
  if (!sleep) return `<p class="muted">No sleep data yet.</p>`;
  const segments = [
    { label: "Light", hrs: sleep.light_hrs, color: "#4f8cf0" },
    { label: "Deep", hrs: sleep.deep_hrs, color: "#2848a8" },
    { label: "REM", hrs: sleep.rem_hrs, color: "#8e6bf0" },
    { label: "Awake", hrs: sleep.awake_hrs, color: "#5a5a62" },
  ];
  const total = segments.reduce((s, x) => s + (x.hrs || 0), 0) || 1;
  const bar = segments
    .map(
      (s) =>
        `<div style="flex:${s.hrs || 0.001};background:${s.color}" title="${s.label} ${s.hrs}h"></div>`
    )
    .join("");
  const legend = segments
    .map(
      (s) =>
        `<span class="legend-item"><i style="background:${s.color}"></i>${s.label} ${s.hrs?.toFixed(1) ?? 0}h</span>`
    )
    .join("");
  return `
    <div class="sleep-bar">${bar}</div>
    <div class="legend">${legend}</div>
    <div class="sleep-stats">
      <span>${sleep.performance_pct ?? "--"}% performance</span>
      <span>${total.toFixed(1)}h total</span>
      <span>${sleep.efficiency_pct ?? "--"}% efficiency</span>
    </div>`;
}
