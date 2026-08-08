/* Regras de pontuação da ficha de avaliação de unidade. */

export const CRITERIOS = [
  {
    key: "frequencia",
    n: "01",
    label: "Frequência",
    tipo: "unico",
    opcoes: [
      { id: "pontual", label: "Pontual", v: 40 },
      { id: "presenca", label: "Presença", v: 10 },
      { id: "ausencia", label: "Ausência", v: 0 },
    ],
  },
  {
    key: "devocao",
    n: "02",
    label: "Devoção",
    tipo: "multi",
    opcoes: [
      { id: "classe", label: "Classe Bíblica", v: 10 },
      { id: "meditacao", label: "Meditação", v: 10 },
      { id: "anobiblico", label: "Ano Bíblico", v: 30 },
    ],
  },
  {
    key: "uniforme",
    n: "03",
    label: "Uniforme",
    tipo: "multi",
    opcoes: [
      { id: "lenco", label: "Lenço", v: 20 },
      { id: "camiseta", label: "Camiseta", v: 20 },
      { id: "calcado", label: "Calçado", v: 10 },
    ],
  },
  {
    key: "materiais",
    n: "04",
    label: "Materiais",
    tipo: "multi",
    opcoes: [
      { id: "biblia", label: "Bíblia", v: 25 },
      { id: "classe", label: "Classe", v: 15 },
      { id: "caderno", label: "Caderno", v: 10 },
    ],
  },
  {
    key: "disciplina",
    n: "05",
    label: "Disciplina",
    tipo: "unico",
    opcoes: [
      { id: "disciplinado", label: "Disciplinado", v: 50 },
      { id: "indisciplinado", label: "Indisciplinado", v: 0 },
    ],
  },
];

export const MAX_MEMBRO = 240; // 40 + 50 + 50 + 50 + 50
export const PT_BANDEIRIM = 25;
export const PT_COMPLETA = 25;

/* Peso do ranking anual: o percentual dos membros pesa mais que o coletivo. */
export const PESO_MEMBROS = 0.8;
export const PESO_UNIDADE = 0.2;

export function pontosDoRegistro(reg) {
  if (!reg) return 0;
  let t = 0;
  for (const c of CRITERIOS) {
    if (c.tipo === "unico") {
      const o = c.opcoes.find((o) => o.id === reg[c.key]);
      if (o) t += o.v;
    } else {
      const sel = reg[c.key] || {};
      for (const o of c.opcoes) if (sel[o.id]) t += o.v;
    }
  }
  return t;
}

/* -------------------------------------------------------------- datas --- */

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function fmtData(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function fmtMes(mes) {
  const [a, m] = mes.split("-");
  return `${MESES[Number(m) - 1]} de ${a}`;
}

export function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* Primeiro e último dia de um mês "AAAA-MM". */
export function faixaDoMes(mes) {
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(a, m, 0).getDate();
  return [`${mes}-01`, `${mes}-${String(ultimo).padStart(2, "0")}`];
}

export function faixaDoAno(ano) {
  return [`${ano}-01-01`, `${ano}-12-31`];
}

/* -------------------------------------------------------- estatísticas --- */

export function statsDia(unidade, dados, reuniao) {
  if (!reuniao) return null;
  const membros = unidade.membros.map((m) => ({
    id: m.id,
    nome: m.nome,
    pontos: pontosDoRegistro(dados.registros[m.id]?.[reuniao.id]),
    reg: dados.registros[m.id]?.[reuniao.id],
  }));
  const totalMembros = membros.reduce((s, m) => s + m.pontos, 0);
  const presentes = membros.filter(
    (m) => m.reg?.frequencia === "pontual" || m.reg?.frequencia === "presenca"
  ).length;
  const pontuais = membros.filter((m) => m.reg?.frequencia === "pontual").length;
  const ausentes = membros.filter((m) => m.reg?.frequencia === "ausencia").length;
  const ptUnidade =
    (reuniao.bandeirim ? PT_BANDEIRIM : 0) + (reuniao.completa ? PT_COMPLETA : 0);
  const max = unidade.membros.length * MAX_MEMBRO;
  return {
    membros,
    totalMembros,
    ptUnidade,
    total: totalMembros + ptUnidade,
    max,
    aproveitamento: max ? Math.round((totalMembros / max) * 100) : 0,
    presentes,
    pontuais,
    ausentes,
    naoAvaliados:
      unidade.membros.length - membros.filter((m) => m.reg?.frequencia).length,
  };
}

/* Serve tanto para um mês quanto para o ano inteiro: o que muda é o período
   já carregado dentro de "dados". */
export function statsPeriodo(unidade, dados) {
  const reunioes = dados.reunioes;
  const membros = unidade.membros.map((m) => ({
    id: m.id,
    nome: m.nome,
    total: reunioes.reduce(
      (s, r) => s + pontosDoRegistro(dados.registros[m.id]?.[r.id]),
      0
    ),
  }));
  const totalMembros = membros.reduce((s, m) => s + m.total, 0);
  const ptUnidade = reunioes.reduce(
    (s, r) => s + (r.bandeirim ? PT_BANDEIRIM : 0) + (r.completa ? PT_COMPLETA : 0),
    0
  );
  const max = reunioes.length * MAX_MEMBRO * unidade.membros.length;
  const maxUnidade = reunioes.length * (PT_BANDEIRIM + PT_COMPLETA);
  const possiveis = reunioes.length * unidade.membros.length;
  let presencas = 0;
  for (const m of unidade.membros)
    for (const r of reunioes) {
      const f = dados.registros[m.id]?.[r.id]?.frequencia;
      if (f === "pontual" || f === "presenca") presencas++;
    }
  const aproveitamento = max ? Math.round((totalMembros / max) * 100) : 0;
  const aproveitamentoUnidade = maxUnidade
    ? Math.round((ptUnidade / maxUnidade) * 100)
    : 0;
  return {
    reunioes,
    membros: membros.sort((a, b) => b.total - a.total),
    totalMembros,
    ptUnidade,
    total: totalMembros + ptUnidade,
    max,
    aproveitamento,
    aproveitamentoUnidade,
    /* nota do ranking: percentual, para unidade grande e pequena competirem igual */
    nota: Math.round(
      PESO_MEMBROS * aproveitamento + PESO_UNIDADE * aproveitamentoUnidade
    ),
    frequencia: possiveis ? Math.round((presencas / possiveis) * 100) : 0,
    mediaMembro: unidade.membros.length
      ? Math.round(totalMembros / unidade.membros.length)
      : 0,
    porReuniao: reunioes.map((r) => ({
      label: fmtData(r.data),
      valor:
        unidade.membros.reduce(
          (s, m) => s + pontosDoRegistro(dados.registros[m.id]?.[r.id]),
          0
        ) +
        (r.bandeirim ? PT_BANDEIRIM : 0) +
        (r.completa ? PT_COMPLETA : 0),
    })),
    bandeirins: reunioes.filter((r) => r.bandeirim).length,
    completas: reunioes.filter((r) => r.completa).length,
  };
}

/* Ranking individual dentro de um período já carregado. */
export function rankingMembros(unidades, mapa) {
  const lista = [];
  for (const u of unidades) {
    const d = mapa[u.id];
    if (!d) continue;
    const nR = d.reunioes.length;
    for (const m of u.membros) {
      const total = d.reunioes.reduce(
        (s, r) => s + pontosDoRegistro(d.registros[m.id]?.[r.id]),
        0
      );
      const presencas = d.reunioes.filter((r) => {
        const f = d.registros[m.id]?.[r.id]?.frequencia;
        return f === "pontual" || f === "presenca";
      }).length;
      lista.push({
        id: m.id,
        nome: m.nome,
        unidade: u.nome,
        total,
        reunioes: nR,
        presencas,
        pct: nR ? Math.round((total / (nR * MAX_MEMBRO)) * 100) : 0,
        freq: nR ? Math.round((presencas / nR) * 100) : 0,
      });
    }
  }
  return lista.sort((a, b) => b.pct - a.pct || b.total - a.total);
}

export const REGISTRO_VAZIO = {
  frequencia: null,
  devocao: {},
  uniforme: {},
  materiais: {},
  disciplina: null,
};
