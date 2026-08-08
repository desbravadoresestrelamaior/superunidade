import React from "react";
import estrelaSrc from "../assets/estrela.webp";
import monogramaSrc from "../assets/monograma.webp";
import brasaoSrc from "../assets/brasao.webp";

export const NAVY_DEEP = "#061529";
export const NAVY = "#0B1F3F";
export const NAVY_MID = "#12294E";
export const NAVY_LINE = "#26436F";
export const GOLD = "#D4AF37";
export const GOLD_LT = "#F2DC9A";
export const SILVER = "#C9D2E0";
export const SILVER_DIM = "#7E8AA0";

/* ------------------------------------------------------------- marcas --- */

/* A estrela do brasão. Com `pct`, vira medidor: revela a arte de baixo
   para cima conforme o aproveitamento sobe. */
export function Estrela({ size = 24, pct = null }) {
  if (pct === null)
    return (
      <img
        src={estrelaSrc}
        alt=""
        style={{ width: size, height: size, display: "block", flexShrink: 0 }}
      />
    );
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <img
        src={estrelaSrc}
        alt=""
        style={{
          width: size,
          height: size,
          position: "absolute",
          left: 0,
          top: 0,
          filter: "grayscale(1) brightness(0.5)",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: `${p}%`,
          overflow: "hidden",
        }}
      >
        <img
          src={estrelaSrc}
          alt=""
          style={{
            width: size,
            height: size,
            maxWidth: "none",
            position: "absolute",
            left: 0,
            bottom: 0,
          }}
        />
      </div>
    </div>
  );
}

export function Brasao({ size = 200 }) {
  return (
    <img
      src={brasaoSrc}
      alt="Clube de Desbravadores Estrela Maior"
      style={{ width: size, height: "auto", display: "block" }}
    />
  );
}

export function MarcaEM({ size = 46 }) {
  return (
    <img
      src={monogramaSrc}
      alt="Estrela Maior"
      style={{ width: size, height: "auto", display: "block" }}
    />
  );
}

/* ------------------------------------------------------------ moldura --- */

export function Tela({ children, larga }) {
  return (
    <div
      className="min-h-screen w-full py-6 px-4"
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${NAVY} 0%, ${NAVY_DEEP} 60%)`,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      <div className={`mx-auto ${larga ? "max-w-3xl" : "max-w-md"}`}>{children}</div>
    </div>
  );
}

export function Cabecalho({ titulo, sub, direita }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="shrink-0">
        <MarcaEM size={46} />
      </div>
      <div className="flex-1 min-w-0">
        <h1
          className="text-sm font-bold uppercase tracking-widest truncate"
          style={{ color: GOLD_LT, fontFamily: "Georgia, serif" }}
        >
          {titulo}
        </h1>
        <p className="text-xs truncate" style={{ color: SILVER_DIM }}>
          {sub}
        </p>
      </div>
      {direita}
    </div>
  );
}

/* -------------------------------------------------------------- peças --- */

export function Cartao({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: NAVY_MID, border: `1px solid ${NAVY_LINE}` }}
    >
      {children}
    </div>
  );
}

export function Titulo({ children, sub }) {
  return (
    <div className="mb-4">
      <h2
        className="text-lg font-bold tracking-wide"
        style={{ color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {children}
      </h2>
      {sub && (
        <p className="text-xs mt-1" style={{ color: SILVER_DIM }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Botao({ children, onClick, tipo = "primario", full, small, disabled }) {
  const estilos = {
    primario: { background: GOLD, color: NAVY_DEEP, border: `1px solid ${GOLD}` },
    fantasma: { background: "transparent", color: SILVER, border: `1px solid ${NAVY_LINE}` },
    perigo: { background: "transparent", color: "#E88B8B", border: "1px solid #6E3436" },
  }[tipo];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} rounded-lg font-semibold tracking-wide ${
        full ? "w-full" : ""
      }`}
      style={{ ...estilos, opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}

export function Chip({ ativo, onClick, children, sub, disabled }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left"
      style={{
        background: ativo ? GOLD : "transparent",
        color: ativo ? NAVY_DEEP : SILVER,
        border: `1px solid ${ativo ? GOLD : NAVY_LINE}`,
        opacity: disabled && !ativo ? 0.45 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span className="block leading-tight">{children}</span>
      {sub !== undefined && (
        <span className="block text-[10px] font-normal mt-0.5" style={{ opacity: 0.75 }}>
          {sub}
        </span>
      )}
    </button>
  );
}

export function Campo({ label, ...props }) {
  return (
    <label className="block">
      <span
        className="block text-[11px] uppercase tracking-widest mb-1.5"
        style={{ color: SILVER_DIM }}
      >
        {label}
      </span>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
        style={{ background: NAVY_DEEP, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
      />
    </label>
  );
}

export function Selecao({ label, children, ...props }) {
  return (
    <label className="block">
      <span
        className="block text-[11px] uppercase tracking-widest mb-1.5"
        style={{ color: SILVER_DIM }}
      >
        {label}
      </span>
      <select
        {...props}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
        style={{ background: NAVY_DEEP, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
      >
        {children}
      </select>
    </label>
  );
}

export function Abas({ valor, onChange, itens }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {itens.map(([k, l]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest"
          style={{
            background: valor === k ? NAVY_MID : "transparent",
            color: valor === k ? GOLD_LT : SILVER_DIM,
            border: `1px solid ${valor === k ? GOLD : NAVY_LINE}`,
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Metrica({ valor, label, sub, destaque }) {
  return (
    <div
      className="rounded-xl px-3 py-3"
      style={{ background: NAVY_DEEP, border: `1px solid ${destaque ? GOLD : NAVY_LINE}` }}
    >
      <p
        className="text-2xl font-bold leading-none"
        style={{ color: destaque ? GOLD_LT : "#fff", fontFamily: "Georgia, serif" }}
      >
        {valor}
      </p>
      <p className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: SILVER_DIM }}>
        {label}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: SILVER }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Barras({ itens, max, vazio = "Sem dados para mostrar." }) {
  if (itens.length === 0)
    return (
      <p className="text-xs" style={{ color: SILVER_DIM }}>
        {vazio}
      </p>
    );
  const teto = max || Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="space-y-2">
      {itens.map((i, k) => {
        const pct = Math.max(0, Math.min(100, (i.valor / teto) * 100));
        return (
          <div key={k}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs truncate pr-2" style={{ color: SILVER }}>
                {i.label}
              </span>
              <span className="text-xs font-bold shrink-0" style={{ color: GOLD_LT }}>
                {i.texto ?? i.valor}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1B3157" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LT} 100%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LinhaRanking({ posicao, pct, nome, detalhe, valor }) {
  const primeiro = posicao === 1;
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ background: NAVY_DEEP, border: `1px solid ${primeiro ? GOLD : NAVY_LINE}` }}
    >
      <span
        className="text-xs font-bold w-5 text-center"
        style={{ color: primeiro ? GOLD : SILVER_DIM }}
      >
        {posicao}
      </span>
      <Estrela size={26} pct={pct} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
          {nome}
        </p>
        <p className="text-[11px] truncate" style={{ color: SILVER_DIM }}>
          {detalhe}
        </p>
      </div>
      <span className="text-base font-bold" style={{ color: GOLD_LT }}>
        {valor}
      </span>
    </div>
  );
}

export function Aviso({ children, tipo = "erro" }) {
  const cores =
    tipo === "erro"
      ? { background: "#4A1F22", color: "#F3C9C9" }
      : { background: NAVY_DEEP, color: SILVER };
  return (
    <div
      className="mb-3 px-3 py-2 rounded-lg text-xs leading-relaxed"
      style={{ ...cores, border: `1px solid ${NAVY_LINE}` }}
    >
      {children}
    </div>
  );
}

export function Carregando({ texto = "Carregando…" }) {
  return (
    <p className="text-xs" style={{ color: SILVER_DIM }}>
      {texto}
    </p>
  );
}

export function baixarCSV(nome, linhas) {
  const blob = new Blob(["\uFEFF" + linhas.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
