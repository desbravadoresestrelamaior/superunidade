import React, { useState, useEffect } from "react";
import {
  CRITERIOS, MAX_MEMBRO, PT_BANDEIRIM, PT_COMPLETA,
  PESO_MEMBROS, PESO_UNIDADE,
  statsDia, statsPeriodo, rankingMembros, pontosDoRegistro,
  fmtData, fmtMes, faixaDoAno,
} from "../lib/pontuacao";
import { carregarPeriodo } from "../lib/api";
import {
  Cartao, Titulo, Metrica, Barras, Chip, Botao, LinhaRanking, Estrela,
  Carregando, Aviso, baixarCSV,
  GOLD, GOLD_LT, NAVY_DEEP, NAVY_MID, NAVY_LINE, SILVER, SILVER_DIM,
} from "./ui";

/* ---------------------------------------------------------- ficha do dia --- */

export function FichaMembro({ membro, reg, podeEditar, onChange }) {
  const [aberto, setAberto] = useState(false);
  const pontos = pontosDoRegistro(reg);
  const pct = Math.round((pontos / MAX_MEMBRO) * 100);
  const ausente = reg?.frequencia === "ausencia";

  const marcarTudo = () =>
    onChange({
      frequencia: "pontual",
      devocao: { classe: true, meditacao: true, anobiblico: true },
      uniforme: { lenco: true, camiseta: true, calcado: true },
      materiais: { biblia: true, classe: true, caderno: true },
      disciplina: "disciplinado",
    });

  const limpar = () =>
    onChange({ frequencia: null, devocao: {}, uniforme: {}, materiais: {}, disciplina: null });

  return (
    <div
      className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: NAVY_MID, border: `1px solid ${NAVY_LINE}` }}
    >
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <Estrela size={30} pct={pct} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
            {membro.nome}
          </p>
          <p className="text-[11px]" style={{ color: SILVER_DIM }}>
            {aberto ? "toque para fechar" : podeEditar ? "toque para avaliar" : "toque para ver"}
          </p>
        </div>
        <span className="text-base font-bold" style={{ color: GOLD_LT }}>
          {pontos}
        </span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${NAVY_LINE}` }}>
          {ausente && (
            <p
              className="text-[11px] leading-relaxed mt-3 px-3 py-2 rounded-lg"
              style={{ background: NAVY_DEEP, color: SILVER, border: `1px solid ${NAVY_LINE}` }}
            >
              Marcado como ausente. Os outros itens ficam bloqueados — para liberá-los,
              escolha Presença ou Pontual.
            </p>
          )}

          {CRITERIOS.map((c) => (
            <div key={c.key} className="pt-3">
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: SILVER_DIM }}>
                {c.n} · {c.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {c.opcoes.map((o) => {
                  const ativo =
                    c.tipo === "unico" ? reg?.[c.key] === o.id : !!reg?.[c.key]?.[o.id];
                  const bloqueado = !podeEditar || (ausente && c.key !== "frequencia");
                  return (
                    <Chip
                      key={o.id}
                      ativo={ativo}
                      disabled={bloqueado}
                      sub={`${o.v} pts`}
                      onClick={() => {
                        if (c.key === "frequencia" && o.id === "ausencia" && !ativo) {
                          onChange({
                            frequencia: "ausencia",
                            devocao: {},
                            uniforme: {},
                            materiais: {},
                            disciplina: null,
                          });
                          return;
                        }
                        if (c.tipo === "unico") onChange({ [c.key]: ativo ? null : o.id });
                        else
                          onChange({
                            [c.key]: { ...(reg?.[c.key] || {}), [o.id]: !ativo },
                          });
                      }}
                    >
                      {o.label}
                    </Chip>
                  );
                })}
              </div>
            </div>
          ))}

          {podeEditar && (
            <div className="flex gap-2 pt-1">
              <Botao small tipo="fantasma" onClick={marcarTudo}>Marcar tudo</Botao>
              <Botao small tipo="fantasma" onClick={limpar}>Limpar</Botao>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ visão do dia --- */

export function VisaoDia({ unidade, dados, reuniao }) {
  const s = statsDia(unidade, dados, reuniao);
  if (!s)
    return (
      <Cartao>
        <p className="text-xs" style={{ color: SILVER_DIM }}>
          Escolha uma reunião para ver o resumo do dia.
        </p>
      </Cartao>
    );

  const itensCriterio = [];
  for (const c of CRITERIOS)
    for (const o of c.opcoes) {
      if (o.v === 0) continue;
      const n = s.membros.filter((m) =>
        c.tipo === "unico" ? m.reg?.[c.key] === o.id : !!m.reg?.[c.key]?.[o.id]
      ).length;
      itensCriterio.push({
        label: `${c.label} · ${o.label}`,
        valor: n,
        texto: `${n}/${unidade.membros.length}`,
      });
    }

  return (
    <>
      <Cartao className="mb-4">
        <Titulo sub={`Reunião de ${fmtData(reuniao.data)}`}>Resumo do dia</Titulo>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Metrica
            valor={s.total}
            label="Pontos do dia"
            sub={`${s.totalMembros} membros + ${s.ptUnidade} unidade`}
            destaque
          />
          <Metrica valor={`${s.aproveitamento}%`} label="Aproveitamento" sub={`de ${s.max} possíveis`} />
          <Metrica
            valor={`${s.presentes}/${unidade.membros.length}`}
            label="Presentes"
            sub={`${s.pontuais} pontuais`}
          />
          <Metrica
            valor={s.ausentes}
            label="Ausentes"
            sub={s.naoAvaliados ? `${s.naoAvaliados} sem lançamento` : "todos avaliados"}
          />
        </div>
        <div className="flex gap-2">
          {[["Bandeirim", reuniao.bandeirim], ["Unidade completa", reuniao.completa]].map(
            ([l, ativo]) => (
              <span
                key={l}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: ativo ? GOLD : "transparent",
                  color: ativo ? NAVY_DEEP : SILVER_DIM,
                  border: `1px solid ${ativo ? GOLD : NAVY_LINE}`,
                }}
              >
                {l}
              </span>
            )
          )}
        </div>
      </Cartao>

      <Cartao className="mb-4">
        <Titulo sub="Pontuação de cada desbravador na reunião">Membros no dia</Titulo>
        <Barras
          itens={[...s.membros]
            .sort((a, b) => b.pontos - a.pontos)
            .map((m) => ({ label: m.nome, valor: m.pontos }))}
          max={MAX_MEMBRO}
          vazio="Esta unidade ainda não tem membros."
        />
      </Cartao>

      <Cartao>
        <Titulo sub="Quantos cumpriram cada item">Itens do dia</Titulo>
        <Barras itens={itensCriterio} max={unidade.membros.length || 1} />
      </Cartao>
    </>
  );
}

/* ---------------------------------------------------------- visão do mês --- */

export function VisaoMes({ unidade, dados, mes }) {
  const s = statsPeriodo(unidade, dados);
  return (
    <>
      <Cartao className="mb-4">
        <Titulo sub={fmtMes(mes)}>Resumo do mês</Titulo>
        <div className="grid grid-cols-2 gap-2">
          <Metrica
            valor={s.total}
            label="Pontos no mês"
            sub={`${s.totalMembros} membros + ${s.ptUnidade} unidade`}
            destaque
          />
          <Metrica valor={`${s.aproveitamento}%`} label="Aproveitamento" sub={`de ${s.max} possíveis`} />
          <Metrica valor={`${s.frequencia}%`} label="Frequência" sub={`${s.reunioes.length} reuniões`} />
          <Metrica
            valor={s.mediaMembro}
            label="Média por membro"
            sub={`${unidade.membros.length} membros`}
          />
        </div>
      </Cartao>

      <Cartao className="mb-4">
        <Titulo sub="Total somado em cada reunião">Reunião a reunião</Titulo>
        <Barras itens={s.porReuniao} vazio="Nenhuma reunião registrada neste mês." />
      </Cartao>

      <Cartao className="mb-4">
        <Titulo sub="Acumulado do mês">Classificação</Titulo>
        <div className="space-y-2">
          {s.membros.map((m, i) => {
            const pct = s.reunioes.length
              ? Math.round((m.total / (s.reunioes.length * MAX_MEMBRO)) * 100)
              : 0;
            return (
              <LinhaRanking
                key={m.id}
                posicao={i + 1}
                pct={pct}
                nome={m.nome}
                detalhe={`${pct}% do possível`}
                valor={m.total}
              />
            );
          })}
          {s.membros.length === 0 && (
            <p className="text-xs" style={{ color: SILVER_DIM }}>
              Sem membros cadastrados.
            </p>
          )}
        </div>
      </Cartao>

      <Cartao>
        <Titulo sub="Conquistas coletivas no mês">Unidade</Titulo>
        <div className="grid grid-cols-2 gap-2">
          <Metrica valor={`${s.bandeirins}/${s.reunioes.length}`} label="Bandeirim" />
          <Metrica valor={`${s.completas}/${s.reunioes.length}`} label="Unidade completa" />
        </div>
      </Cartao>
    </>
  );
}

/* -------------------------------------------------------- ranking do ano --- */

export function RankingAno({ unidades, clube = "Clube Estrela Maior" }) {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [mapa, setMapa] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [minimo, setMinimo] = useState(0);

  const chave = unidades.map((u) => u.id).join(",");
  useEffect(() => {
    setMapa(null);
  }, [ano, chave]);

  const carregar = async () => {
    setOcupado(true);
    setErro("");
    try {
      const [de, ate] = faixaDoAno(ano);
      setMapa(await carregarPeriodo(unidades.map((u) => u.id), de, ate));
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const rankUnidades = mapa
    ? unidades
        .map((u) => ({ u, st: statsPeriodo(u, mapa[u.id] || { reunioes: [], registros: {} }) }))
        .sort((a, b) => b.st.nota - a.st.nota)
    : [];

  const membros = mapa ? rankingMembros(unidades, mapa) : [];
  const filtrados = membros.filter((m) => m.freq >= minimo);

  const exportar = () => {
    const linhas = [`${clube} — Ranking ${ano}`, ""];
    if (unidades.length > 1) {
      linhas.push(["Pos", "Unidade", "% final", "% membros", "% coletivo", "Reuniões"].join(";"));
      rankUnidades.forEach((x, i) =>
        linhas.push(
          [i + 1, x.u.nome, x.st.nota, x.st.aproveitamento, x.st.aproveitamentoUnidade, x.st.reunioes.length].join(";")
        )
      );
      linhas.push("");
    }
    linhas.push(
      ["Pos", "Desbravador", "Unidade", "% aproveitamento", "% frequência", "Pontos", "Reuniões"].join(";")
    );
    filtrados.forEach((m, i) =>
      linhas.push([i + 1, m.nome, m.unidade, m.pct, m.freq, m.total, m.reunioes].join(";"))
    );
    baixarCSV(`ranking-${ano}.csv`, linhas);
  };

  return (
    <>
      <Cartao className="mb-4">
        <Titulo sub="O ranking usa percentual de aproveitamento, então unidades grandes e pequenas competem em igualdade.">
          Ranking do ano
        </Titulo>
        {erro && <Aviso>{erro}</Aviso>}
        <div className="flex flex-wrap gap-2 mb-4">
          {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAno(a)}
              className="px-3 py-2 rounded-lg text-xs font-semibold"
              style={{
                background: a === ano ? GOLD : "transparent",
                color: a === ano ? NAVY_DEEP : SILVER,
                border: `1px solid ${a === ano ? GOLD : NAVY_LINE}`,
              }}
            >
              {a}
            </button>
          ))}
        </div>

        {!mapa ? (
          <Botao onClick={carregar} full disabled={ocupado}>
            {ocupado ? "Somando o ano inteiro…" : `Calcular o ranking de ${ano}`}
          </Botao>
        ) : (
          <div className="flex gap-2">
            <Botao tipo="fantasma" small onClick={carregar}>Atualizar</Botao>
            <Botao tipo="fantasma" small onClick={exportar}>Baixar planilha</Botao>
          </div>
        )}

        <p className="text-[11px] leading-relaxed mt-3" style={{ color: SILVER_DIM }}>
          Nota da unidade: {Math.round(PESO_MEMBROS * 100)}% do aproveitamento dos membros +{" "}
          {Math.round(PESO_UNIDADE * 100)}% das conquistas coletivas (bandeirim e unidade completa).
        </p>
      </Cartao>

      {mapa && unidades.length > 1 && (
        <Cartao className="mb-4">
          <Titulo sub={`Percentual de aproveitamento em ${ano}`}>Unidades</Titulo>
          <div className="space-y-2">
            {rankUnidades.map((x, i) => (
              <LinhaRanking
                key={x.u.id}
                posicao={i + 1}
                pct={x.st.nota}
                nome={x.u.nome}
                detalhe={`membros ${x.st.aproveitamento}% · coletivo ${x.st.aproveitamentoUnidade}% · ${x.st.reunioes.length} reuniões · ${x.u.membros.length} membros`}
                valor={`${x.st.nota}%`}
              />
            ))}
          </div>
        </Cartao>
      )}

      {mapa && (
        <Cartao className="mb-4">
          <Titulo sub="Percentual sobre tudo o que era possível somar no ano. Use junto com a frequência para decidir a insígnia de excelência.">
            Desbravadores
          </Titulo>
          <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: SILVER_DIM }}>
            Frequência mínima
          </p>
          <div className="flex gap-2 mb-4">
            {[[0, "Todos"], [50, "50%+"], [75, "75%+"], [90, "90%+"]].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMinimo(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: minimo === v ? GOLD : "transparent",
                  color: minimo === v ? NAVY_DEEP : SILVER,
                  border: `1px solid ${minimo === v ? GOLD : NAVY_LINE}`,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtrados.map((m, i) => (
              <LinhaRanking
                key={m.id}
                posicao={i + 1}
                pct={m.pct}
                nome={m.nome}
                detalhe={`${unidades.length > 1 ? m.unidade + " · " : ""}frequência ${m.freq}% · ${m.total} pts`}
                valor={`${m.pct}%`}
              />
            ))}
            {filtrados.length === 0 && (
              <p className="text-xs" style={{ color: SILVER_DIM }}>
                Ninguém alcançou essa frequência mínima no ano.
              </p>
            )}
          </div>
        </Cartao>
      )}
    </>
  );
}

export { Carregando };
