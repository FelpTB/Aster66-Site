// Gera public/docs/ficha-aster66.pdf — ficha editável (AcroForm) no modelo atual do Notion.
// Uso: npm run ficha
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb, TextAlignment } = require("pdf-lib");

const NIGREDO = rgb(0.03, 0.03, 0.04);
const RUBEDO = rgb(201 / 255, 29 / 255, 46 / 255);
const OURO = rgb(229 / 255, 169 / 255, 60 / 255);
const CINZA = rgb(0.45, 0.45, 0.5);
const CLARO = rgb(0.985, 0.975, 0.955);
const W = 595.28, H = 841.89, M = 28;

(async () => {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Ficha de Personagem — Aster66");
  pdf.setAuthor("Aster66");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const form = pdf.getForm();

  // ---------- helpers ----------
  const text = (pg, s, x, y, o = {}) =>
    pg.drawText(s, { x, y, size: o.size || 8, font: o.bold ? bold : font, color: o.color || NIGREDO });
  const textC = (pg, s, cx, y, o = {}) => {
    const f = o.bold ? bold : font, size = o.size || 8;
    text(pg, s, cx - f.widthOfTextAtSize(s, size) / 2, y, o);
  };
  const box = (pg, x, y, w, h, o = {}) =>
    pg.drawRectangle({ x, y, width: w, height: h, borderColor: o.border || NIGREDO, borderWidth: o.bw ?? 1, color: o.fill });
  const line = (pg, x1, y1, x2, y2, o = {}) =>
    pg.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: o.t || 0.6, color: o.color || NIGREDO, dashArray: o.dash });
  const title = (pg, s, x, y) => {
    text(pg, s, x, y, { bold: true, size: 11 });
    pg.drawRectangle({ x, y: y - 4, width: 18, height: 1.6, color: RUBEDO });
  };
  const field = (pg, name, x, y, w, h, o = {}) => {
    const f = form.createTextField(name);
    if (o.multiline) f.enableMultiline();
    if (o.align === "center") f.setAlignment(TextAlignment.Center);
    f.addToPage(pg, { x, y, width: w, height: h, borderWidth: 0, borderColor: undefined, backgroundColor: undefined, font });
    f.setFontSize(o.size ?? 0);
    return f;
  };
  const check = (pg, name, x, y, s = 11) => {
    box(pg, x, y, s, s, { bw: 0.8 });
    const c = form.createCheckBox(name);
    c.addToPage(pg, { x: x + 1, y: y + 1, width: s - 2, height: s - 2, borderWidth: 0, borderColor: undefined, backgroundColor: undefined });
  };
  const frame = (pg) => {
    box(pg, 14, 14, W - 28, H - 28, { border: OURO, bw: 0.8 });
    box(pg, 18, 18, W - 36, H - 36, { border: OURO, bw: 0.3 });
  };

  // ================= PÁGINA 1 — FRENTE =================
  const p1 = pdf.addPage([W, H]);
  p1.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CLARO });
  frame(p1);
  text(p1, "FICHA DE PERSONAGEM", M + 4, H - 52, { bold: true, size: 16 });
  text(p1, "ASTER", W - M - 74, H - 52, { bold: true, size: 16 });
  text(p1, "66", W - M - 22, H - 52, { bold: true, size: 16, color: RUBEDO });
  line(p1, M, H - 62, W - M, H - 62, { color: OURO, t: 1 });

  // --- ATRIBUTOS (com hexagrama) ---
  const ax = M, ay = 470, aw = 262, ah = 300;
  box(p1, ax, ay, aw, ah);
  title(p1, "ATRIBUTOS", ax + 10, ay + ah - 18);
  const cx = ax + aw / 2, cy = 664, R = 62;
  p1.drawCircle({ x: cx, y: cy, size: R + 6, borderColor: NIGREDO, borderWidth: 0.8 });
  const ang = [90, 30, -30, -90, -150, 150]; // Corpo, Destreza, Mente, Conhecimento, Alma, Foco
  const nomes = ["Corpo", "Destreza", "Mente", "Conhecimento", "Alma", "Foco"];
  const pts = ang.map((a) => [cx + R * Math.cos((a * Math.PI) / 180), cy + R * Math.sin((a * Math.PI) / 180)]);
  [[0, 2, 4], [1, 3, 5]].forEach((tri) =>
    tri.forEach((i, k) => {
      const j = tri[(k + 1) % 3];
      line(p1, pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: OURO, t: 1 });
    })
  );
  pts.forEach(([x, y], i) => {
    p1.drawCircle({ x, y, size: 15, color: rgb(1, 1, 1), borderColor: NIGREDO, borderWidth: 1.2 });
    field(p1, "attr_" + nomes[i].toLowerCase(), x - 12, y - 8, 24, 16, { align: "center", size: 11 });
    const lbl = nomes[i];
    if (i === 0) textC(p1, lbl, x, y + 19, { bold: true });
    else if (i === 3) textC(p1, lbl, x, y - 24, { bold: true });
    else if (i < 3) text(p1, lbl, x + 18, y + (i === 1 ? 8 : -14), { bold: true });
    else text(p1, lbl, x - 18 - bold.widthOfTextAtSize(lbl, 8), y + (i === 5 ? 8 : -14), { bold: true });
  });

  // Vida / Energia
  const vx = ax + 10, vy = ay + 10, vw = aw - 20, vh = 84;
  box(p1, vx, vy, vw, vh, { bw: 0.8 });
  line(p1, vx + vw / 2, vy + 8, vx + vw / 2, vy + vh - 8);
  [["VIDA", "vida", RUBEDO], ["ENERGIA", "energia", OURO]].forEach(([lab, key, col], k) => {
    const bx = vx + 10 + k * (vw / 2);
    text(p1, lab, bx, vy + vh - 16, { bold: true, size: 10, color: col });
    text(p1, "ATUAL", bx, vy + vh - 26, { size: 6.5, color: CINZA });
    box(p1, bx, vy + 34, 50, 20, { bw: 0.8 });
    field(p1, key + "_atual", bx + 1, vy + 35, 48, 18, { align: "center", size: 11 });
    text(p1, "/", bx + 56, vy + 26, { size: 12 });
    text(p1, "TOTAL", bx + 64, vy + vh - 26, { size: 6.5, color: CINZA });
    box(p1, bx + 64, vy + 18, 50, 20, { bw: 0.8 });
    field(p1, key + "_total", bx + 65, vy + 19, 48, 18, { align: "center", size: 11 });
  });

  // --- CICATRIZES ---
  const sx = 300, sw = W - M - sx;
  box(p1, sx, ay, sw, ah);
  title(p1, "CICATRIZES", sx + 10, ay + ah - 18);
  // Silhuetas (frente e costas) — desenho vetorial simples
  const corpo = "M-6,-40 L-20,-36 L-26,-6 L-30,24 L-25,25 L-18,-4 L-15,-20 L-14,10 L-16,58 L-6,58 L-2,14 L2,14 L6,58 L16,58 L14,10 L15,-20 L18,-4 L25,25 L30,24 L26,-6 L20,-36 L6,-40 Z";
  [sx + sw * 0.3, sx + sw * 0.7].forEach((bx, k) => {
    p1.drawSvgPath(corpo, { x: bx, y: 655, borderColor: NIGREDO, borderWidth: 0.8, scale: 1.15 });
    p1.drawCircle({ x: bx, y: 655 + 51 * 1.15, size: 11, borderColor: NIGREDO, borderWidth: 0.8 });
    textC(p1, k ? "COSTAS" : "FRENTE", bx, 582, { size: 6.5, color: CINZA });
  });
  for (let i = 0; i < 8; i++) {
    const ly = 562 - i * 11.4;
    line(p1, sx + 12, ly, sx + sw - 12, ly, { t: 0.4, color: CINZA });
    field(p1, `cicatriz_${i + 1}`, sx + 12, ly + 0.5, sw - 24, 10.5, { size: 7.5 });
  }

  // --- DEFESAS E MOVIMENTO / AÇÕES E REAÇÕES ---
  const dx = M, dy = 40, dw = 172, dh = 420;
  box(p1, dx, dy, dw, dh);
  title(p1, "DEFESAS E MOVIMENTO", dx + 10, dy + dh - 18);
  [["BLOQUEIO", "bloqueio"], ["ESQUIVA", "esquiva"], ["DESLOCAMENTO", "deslocamento"]].forEach(([lab, key], i) => {
    const ry = dy + dh - 64 - i * 44;
    text(p1, lab, dx + 12, ry + 10, { bold: true, size: 8.5 });
    box(p1, dx + dw - 62, ry, 50, 28, { bw: 0.8 });
    field(p1, key, dx + dw - 61, ry + 1, 48, 26, { align: "center", size: 13 });
  });
  line(p1, dx + 10, dy + 214, dx + dw - 10, dy + 214, { dash: [3, 3] });
  title(p1, "AÇÕES E REAÇÕES", dx + 10, dy + 192);
  text(p1, "AÇÕES", dx + 12, dy + 168, { size: 7.5, color: CINZA });
  for (let i = 0; i < 6; i++) check(p1, `acao_${i + 1}`, dx + 12 + i * 25, dy + 146, 15);
  line(p1, dx + 10, dy + 128, dx + dw - 10, dy + 128, { dash: [3, 3] });
  text(p1, "REAÇÕES", dx + 12, dy + 108, { size: 7.5, color: CINZA });
  for (let i = 0; i < 4; i++) check(p1, `reacao_${i + 1}`, dx + 12 + i * 25, dy + 86, 15);
  text(p1, "Marque as ações e reações", dx + 12, dy + 50, { size: 6.5, color: CINZA });
  text(p1, "usadas no turno.", dx + 12, dy + 41, { size: 6.5, color: CINZA });

  // --- DADOS DO PERSONAGEM ---
  const px = 210, pw = W - M - px, py = 330, ph = 130;
  box(p1, px, py, pw, ph);
  title(p1, "DADOS DO PERSONAGEM", px + 10, py + ph - 18);
  const lineField = (pg, lab, name, x, y, w) => {
    text(pg, lab, x, y + 2, { bold: true, size: 7.5 });
    const lw = bold.widthOfTextAtSize(lab, 7.5) + 4;
    line(pg, x + lw, y, x + w, y, { t: 0.5 });
    field(pg, name, x + lw, y + 0.5, w - lw, 13, { size: 9 });
  };
  lineField(p1, "NOME:", "nome", px + 10, py + ph - 40, pw - 20);
  lineField(p1, "IDADE:", "idade", px + 10, py + ph - 60, 80);
  lineField(p1, "RAÇA:", "raca", px + 100, py + ph - 60, 120);
  lineField(p1, "CLASSE:", "classe", px + 230, py + ph - 60, pw - 240);
  text(p1, "APARÊNCIA:", px + 10, py + ph - 78, { bold: true, size: 7.5 });
  for (let i = 0; i < 3; i++) line(p1, px + 10, py + ph - 80 - i * 14 - (i ? 0 : 0), px + pw - 10, py + ph - 80 - i * 14, { t: 0.4, color: CINZA });
  field(p1, "aparencia", px + 10, py + 8, pw - 20, 44, { multiline: true, size: 8 });

  // --- INVENTÁRIO ---
  const ix = px, iw = pw, iy = 40, ih = 280;
  box(p1, ix, iy, iw, ih);
  title(p1, "INVENTÁRIO", ix + 10, iy + ih - 18);
  const tipos = [["EM MÃOS", "maos", 2, "2 iniciais"], ["EQUIPADO", "equip", 4, "4 iniciais"], ["ACESSO RÁPIDO", "rapido", 4, "0 iniciais"], ["GUARDADO", "guard", 4, "4 iniciais"]];
  const tw = (iw - 20) / 4, ty = iy + ih - 86;
  box(p1, ix + 10, ty, iw - 20, 58, { bw: 0.8 });
  textC(p1, "TIPOS DE ESPAÇO", ix + iw / 2, ty + 62, { size: 6.5, color: CINZA });
  tipos.forEach(([lab, key, n, ini], k) => {
    const tx = ix + 10 + k * tw;
    if (k) line(p1, tx, ty, tx, ty + 58, { t: 0.6 });
    textC(p1, lab, tx + tw / 2, ty + 44, { bold: true, size: 7 });
    const startX = tx + tw / 2 - (n * 15 - 4) / 2;
    for (let i = 0; i < n; i++) check(p1, `esp_${key}_${i + 1}`, startX + i * 15, ty + 22, 11);
    textC(p1, `(${ini})`, tx + tw / 2, ty + 8, { size: 6.5, color: CINZA });
  });
  const cols = [["NOME", iw - 20 - 150], ["TIPO DE ESPAÇO", 95], ["QTD.", 55]];
  const thy = ty - 24, rowH = 17, rows = 10;
  let cxp = ix + 10;
  box(p1, ix + 10, thy, iw - 20, 16, { fill: NIGREDO, bw: 0 });
  cols.forEach(([lab, w]) => { textC(p1, lab, cxp + w / 2, thy + 5, { bold: true, size: 7, color: rgb(1, 1, 1) }); cxp += w; });
  for (let r = 0; r < rows; r++) {
    const ry = thy - (r + 1) * rowH;
    box(p1, ix + 10, ry, iw - 20, rowH, { bw: 0.5 });
    let xx = ix + 10;
    ["inv_nome", "inv_tipo", "inv_qtd"].forEach((k, c) => {
      const w = cols[c][1];
      if (c) line(p1, xx, ry, xx, ry + rowH, { t: 0.5 });
      field(p1, `${k}_${r + 1}`, xx + 3, ry + 1, w - 6, rowH - 2, { size: 8, align: c === 2 ? "center" : undefined });
      xx += w;
    });
  }

  // ================= PÁGINA 2 — VERSO =================
  const p2 = pdf.addPage([W, H]);
  p2.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CLARO });
  frame(p2);

  // --- ORIGENS ---
  const ox = M, ow = W - 2 * M, oy = H - 150, oh = 120;
  box(p2, ox, oy, ow, oh);
  title(p2, "ORIGENS", ox + 10, oy + oh - 18);
  const colW = (ow - 20) / 3;
  for (let c = 0; c < 3; c++) {
    if (c) line(p2, ox + 10 + c * colW, oy + 10, ox + 10 + c * colW, oy + oh - 30, { t: 0.5 });
    for (let r = 0; r < 5; r++) {
      const n = c * 5 + r + 1;
      const ly = oy + oh - 44 - r * 16;
      const lx = ox + 16 + c * colW;
      text(p2, `${n}.`, lx, ly + 2, { bold: true, size: 8 });
      line(p2, lx + 16, ly, lx + colW - 16, ly, { t: 0.4, color: CINZA });
      field(p2, `origem_${n}`, lx + 16, ly + 0.5, colW - 32, 13, { size: 8.5 });
    }
  }

  // --- CARTAS ---
  const kx = M, kw = W - 2 * M, ky = 40, kh = oy - 14 - ky;
  box(p2, kx, ky, kw, kh);
  title(p2, "CARTAS", kx + 10, ky + kh - 18);
  const kcols = [["#", 22], ["NOME", 140], ["CUSTO", 56], ["EFEITO", kw - 20 - 218]];
  const khy = ky + kh - 44, krow = (khy - ky - 8) / 30;
  let kxp = kx + 10;
  box(p2, kx + 10, khy, kw - 20, 16, { fill: NIGREDO, bw: 0 });
  kcols.forEach(([lab, w]) => { textC(p2, lab, kxp + w / 2, khy + 5, { bold: true, size: 7, color: rgb(1, 1, 1) }); kxp += w; });
  for (let r = 0; r < 30; r++) {
    const ry = khy - (r + 1) * krow;
    box(p2, kx + 10, ry, kw - 20, krow, { bw: 0.5 });
    p2.drawRectangle({ x: kx + 10, y: ry, width: 22, height: krow, color: rgb(0.93, 0.92, 0.9) });
    textC(p2, String(r + 1), kx + 21, ry + 7, { bold: true, size: 7.5 });
    let xx = kx + 10 + 22;
    [["carta_nome", 140], ["carta_custo", 56], ["carta_efeito", kw - 20 - 218]].forEach(([k, w]) => {
      line(p2, xx, ry, xx, ry + krow, { t: 0.5 });
      field(p2, `${k}_${r + 1}`, xx + 3, ry + 1, w - 6, krow - 2, {
        size: k === "carta_efeito" ? 6.5 : 8, multiline: k === "carta_efeito", align: k === "carta_custo" ? "center" : undefined,
      });
      xx += w;
    });
  }

  const out = path.join(__dirname, "..", "public", "docs", "ficha-aster66.pdf");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await pdf.save());
  console.log("Ficha gerada:", out, `(${form.getFields().length} campos)`);
})();
