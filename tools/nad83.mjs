// NAD83(2011) / UTM zone 10N (EPSG:6339; the ART geodatabase's "NAD_1983_UTM_Zone_10N") to the
// explorer grid's WGS 84 / UTM zone 10N (EPSG:32610, data/terrain/dem.json), horizontal only.
//   node tools/nad83.mjs            prints the shift at the grid's center and corners
// Steps: inverse UTM on the GRS 80 ellipsoid -> geocentric X, Y, Z (ellipsoidal height 0 m; the
// height changes the horizontal result by micrometers) -> the 14-parameter Helmert transformation
// between ITRF2008 and NAD83(2011), inverted, at epoch EPOCH -> geodetic on WGS 84 -> forward UTM.
// WGS 84 (G1762) is aligned with ITRF2008 at the centimeter level (NGA), so ITRF2008 stands for it.
// Parameters (ITRF2008 -> NAD83(2011), reference epoch 1997.0, coordinate-frame rotation convention):
// Pearson, C. and Snay, R. (2013), "Introducing HTDP 3.1 to transform coordinates across time and
// spatial reference frames", GPS Solutions 17:1-15, the transformation NGS's HTDP and NCAT use.
// Site velocity is not applied: NAD83(2011) coordinates are epoch 2010.00, and the ground's own
// motion relative to the North American plate (a few centimeters a year in the Bay Area) moves a
// point by tenths of a meter over the years in question, well under the grid's 4 m cell.
import { fileURLToPath } from 'url';

export const EPOCH = 2017.0; // the ART maps' publication year (assumption; 2010.0 gives a shift within 0.2 m of it)
export const HELMERT = {
  source: 'Pearson and Snay (2013), GPS Solutions 17:1-15: ITRF2008 to NAD83(2011), epoch 1997.0',
  t0: 1997.0,
  T: [0.99343, -1.90331, -0.52655], dT: [0.00079, -0.00060, -0.00134],          // m, m/yr
  R: [25.91467, 9.42645, 11.59935], dR: [0.06667, -0.75744, -0.05133],          // mas, mas/yr
  S: 1.71504, dS: -0.10201,                                                      // ppb, ppb/yr
};

const GRS80 = { a: 6378137.0, f: 1 / 298.257222101 }, WGS84 = { a: 6378137.0, f: 1 / 298.257223563 };
const k0 = 0.9996, lon0 = -123 * Math.PI / 180, FE = 500000;

function tm(E) {
  const { a, f } = E, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const M = (phi) => a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * phi
    - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi)
    + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * phi)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * phi));
  return {
    a, e2,
    fwd(lam, phi) { // radians -> UTM meters (Snyder 1987)
      const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2), T = Math.tan(phi) ** 2, C = ep2 * Math.cos(phi) ** 2, A = Math.cos(phi) * (lam - lon0);
      return [FE + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120),
        k0 * (M(phi) + N * Math.tan(phi) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720))];
    },
    inv(x, y) { // UTM meters -> radians [lam, phi]
      const mu = y / k0 / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256)), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
      const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu);
      const N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) ** 2), T1 = Math.tan(p1) ** 2, C1 = ep2 * Math.cos(p1) ** 2, R1 = a * (1 - e2) / (1 - e2 * Math.sin(p1) ** 2) ** 1.5, D = (x - FE) / (N1 * k0);
      const phi = p1 - (N1 * Math.tan(p1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
      return [lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / Math.cos(p1), phi];
    },
    toXYZ(lam, phi, h = 0) { const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2); return [(N + h) * Math.cos(phi) * Math.cos(lam), (N + h) * Math.cos(phi) * Math.sin(lam), (N * (1 - e2) + h) * Math.sin(phi)]; },
    fromXYZ([X, Y, Z]) { // Bowring iteration
      const p = Math.hypot(X, Y); let phi = Math.atan2(Z, p * (1 - e2));
      for (let k = 0; k < 6; k++) { const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2); const h = p / Math.cos(phi) - N; phi = Math.atan2(Z, p * (1 - e2 * N / (N + h))); }
      return [Math.atan2(Y, X), phi];
    },
  };
}
const G = tm(GRS80), Wg = tm(WGS84);

// The Helmert at epoch t, as the matrix and translation taking ITRF2008 to NAD83(2011):
// X_N = T + (1 + s) * Rm * X_I, Rm = [[1, rz, -ry], [-rz, 1, rx], [ry, -rx, 1]] (small angles).
function helmertAt(t) {
  const H = HELMERT, dt = t - H.t0, mas = Math.PI / 180 / 3600e3;
  const T = H.T.map((v, k) => v + H.dT[k] * dt), [rx, ry, rz] = H.R.map((v, k) => (v + H.dR[k] * dt) * mas), s = (H.S + H.dS * dt) * 1e-9;
  const m = [[1, rz, -ry], [-rz, 1, rx], [ry, -rx, 1]].map(r => r.map(v => v * (1 + s)));
  // inverse of the 3 x 3 matrix
  const [[a, b, c], [d, e, f], [g, h, i]] = m, det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const inv = [[e * i - f * h, c * h - b * i, b * f - c * e], [f * g - d * i, a * i - c * g, c * d - a * f], [d * h - e * g, b * g - a * h, a * e - b * d]].map(r => r.map(v => v / det));
  return { T, inv };
}

// Returns f(x, y) -> [x, y]: NAD83(2011) UTM 10N meters to WGS 84 UTM 10N meters.
export function nad83ToWgs84(epoch = EPOCH) {
  const { T, inv } = helmertAt(epoch);
  return (x, y) => {
    const [lam, phi] = G.inv(x, y), XN = G.toXYZ(lam, phi), d = [XN[0] - T[0], XN[1] - T[1], XN[2] - T[2]];
    const XI = inv.map(r => r[0] * d[0] + r[1] * d[1] + r[2] * d[2]);
    const [l2, p2] = Wg.fromXYZ(XI);
    return Wg.fwd(l2, p2);
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fs = await import('fs');
  const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
  const pts = [['center', (dem.xmin + dem.xmax) / 2, (dem.ymin + dem.ymax) / 2], ['northwest', dem.xmin, dem.ymax], ['southeast', dem.xmax, dem.ymin]];
  for (const ep of [2010.0, EPOCH]) {
    const f = nad83ToWgs84(ep);
    for (const [n, x, y] of pts) { const [u, v] = f(x, y); console.log(`epoch ${ep.toFixed(1)} ${n.padEnd(9)} dE ${(u - x).toFixed(3)} m, dN ${(v - y).toFixed(3)} m, ${Math.hypot(u - x, v - y).toFixed(3)} m`); }
  }
}
