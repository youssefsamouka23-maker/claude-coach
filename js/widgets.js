// js/widgets.js
// Small SVG widgets: recovery ring, sleep breakdown bar, strain gauge.

function recoveryColor(score) {
  if (score == null) return "#3a3a42";
  if (score >= 67) return "#18cc7a";
  if (score >= 34) return "#f2c14e";
  return "#ff5d54";
}

export function recoveryRingSVG(score, size = 168) {
  const r = size / 2 - 13;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - pct / 100);
  const color = recoveryColor(score);
  return `
  <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#24242b" stroke-width="13"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="13"
      stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
      transform="rotate(-90 ${c} ${c})" style="transition: stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1);"/>
    <text x="${c}" y="${c - 2}" text-anchor="middle" font-size="38" font-weight="700" fill="#f5f5f7">${score != null ? Math.ceil(score) : "--"}</text>
    <text x="${c}" y="${c + 24}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#6e6e78" letter-spacing="1.5">RECOVERY</text>
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

  let color = "#4aa8f5";
  if (strain >= 14) color = "#f2c14e";
  if (strain >= 18) color = "#ff5d54";

  return `
  <svg viewBox="0 0 ${size} ${size / 1.7}" width="${size}" height="${size / 1.7}">
    <path d="M ${c - r} ${c} A ${r} ${r} 0 0 1 ${bgX2} ${bgY2}" fill="none" stroke="#24242b" stroke-width="13" stroke-linecap="round"/>
    ${
      pct > 0
        ? `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round"/>`
        : ""
    }
    <text x="${c}" y="${c - 6}" text-anchor="middle" font-size="29" font-weight="700" fill="#f5f5f7">${strain != null ? strain.toFixed(1) : "--"}</text>
    <text x="${c}" y="${c + 13}" text-anchor="middle" font-size="11" font-weight="600" fill="#6e6e78" letter-spacing="1.5">STRAIN</text>
  </svg>`;
}

export function sleepBreakdownHTML(sleep) {
  if (!sleep) {
    return `<div class="empty-state" style="padding:var(--sp-4) 0;"><div class="empty-title">No sleep data yet</div><div class="empty-sub">Sync from WHOOP to see last night's breakdown.</div></div>`;
  }
  const segments = [
    { label: "Light", hrs: sleep.light_hrs, color: "#4aa8f5" },
    { label: "Deep", hrs: sleep.deep_hrs, color: "#2e5fb8" },
    { label: "REM", hrs: sleep.rem_hrs, color: "#9b7bf0" },
    { label: "Awake", hrs: sleep.awake_hrs, color: "#4a4a52" },
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
      <span>${sleep.performance_pct != null ? Math.ceil(sleep.performance_pct) : "--"}% performance</span>
      <span>${total.toFixed(1)}h total</span>
      <span>${sleep.efficiency_pct != null ? Math.ceil(sleep.efficiency_pct) : "--"}% efficiency</span>
    </div>`;
}
