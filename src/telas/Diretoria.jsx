import React, { useState, useEffect, useMemo } from "react";
import {
  statsDia, statsPeriodo, fmtData, fmtMes, mesAtual, faixaDoMes,
} from "../lib/pontuacao";
import {
  carregarPeriodo, criarUnidade, renomearUnidade, excluirUnidade,
  criarMembro, renomearMembro, excluirMembro,
  listarPessoas, atualizarPessoa,
} from "../lib/api";
import {
  Cabecalho, Cartao, Titulo, Botao, Campo, Selecao, Abas, Metrica, Barras,
  LinhaRanking, Estrela, Aviso, Carregando,
  GOLD, GOLD_LT, NAVY_DEEP, NAVY_MID, NAVY_LINE, SILVER, SILVER_DIM,
} from "../componentes/ui";
import { RankingAno } from "../componentes/visoes";

const LIMITE_CONSELHEIROS = 3;

const PAPEIS = [
  ["pendente", "Aguardando liberação"],
  ["desbravador", "Desbravador (só consulta)"],
  ["secretario", "Secretário (lança)"],
  ["conselheiro", "Conselheiro (lança)"],
  ["diretoria", "Diretoria Executiva"],
];

export default function Diretoria({ clube, unidades, recarregarUnidades, onSair, onAbrirUnidade }) {
  const [aba, setAba] = useState("painel");
  return (
    <>
      <Cabecalho
        titulo="Diretoria Executiva"
        sub={clube}
        direita={<Botao tipo="fantasma" small onClick={onSair}>Sair</Botao>}
      />
      <Abas
        valor={aba}
        onChange={setAba}
        itens={[
          ["painel", "Painel geral"],
          ["cadastro", "Unidades"],
          ["pessoas", "Pessoas"],
        ]}
      />
      {aba === "painel" && (
        <PainelGeral clube={clube} unidades={unidades} onAbrirUnidade={onAbrirUnidade} />
      )}
      {aba === "cadastro" && (
        <Cadastro unidades={unidades} recarregar={recarregarUnidades} onAbrirUnidade={onAbrirUnidade} />
      )}
      {aba === "pessoas" && <Pessoas unidades={unidades} />}
    </>
  );
}

/* ============================================================ painel geral === */

function PainelGeral({ clube, unidades, onAbrirUnidade }) {
  const [mes, setMes] = useState(mesAtual());
  const [mapa, setMapa] = useState(null);
  const [vista, setVista] = useState("mes");
  const [dataSel, setDataSel] = useState(null);
  const [aberta, setAberta] = useState(null);
  const [erro, setErro] = useState("");

  const ids = unidades.map((u) => u.id).join(",");

  useEffect(() => {
    let vivo = true;
    setMapa(null);
    setErro("");
    (async () => {
      try {
        const [de, ate] = faixaDoMes(mes);
        const r = await carregarPeriodo(unidades.map((u) => u.id), de, ate);
        if (vivo) setMapa(r);
      } catch (e) {
        if (vivo) setErro(e.message);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [mes, ids]);

  const datas = useMemo(() => {
    if (!mapa) return [];
    const s = new Set();
    for (const u of unidades) (mapa[u.id]?.reunioes || []).forEach((r) => s.add(r.data));
    return [...s].sort();
  }, [mapa, ids]);

  useEffect(() => {
    if (datas.length && !datas.includes(dataSel)) setDataSel(datas[datas.length - 1]);
    if (!datas.length) setDataSel(null);
  }, [datas.join(",")]);

  if (unidades.length === 0)
    return (
      <Cartao>
        <p className="text-xs" style={{ color: SILVER_DIM }}>
          Cadastre a primeira unidade na aba Unidades para o painel começar a mostrar números.
        </p>
      </Cartao>
    );
  if (erro) return <Aviso>{erro}</Aviso>;
  if (!mapa)
    return (
      <Cartao>
        <Carregando texto="Reunindo os dados das unidades…" />
      </Cartao>
    );

  const porUnidade = unidades.map((u) => ({
    unidade: u,
    dados: mapa[u.id] || { reunioes: [], registros: {} },
    st: statsPeriodo(u, mapa[u.id] || { reunioes: [], registros: {} }),
  }));

  const totalClube = porUnidade.reduce((s, x) => s + x.st.total, 0);
  const totalMembros = unidades.reduce((s, u) => s + u.membros.length, 0);
  const reunioesClube = porUnidade.reduce((s, x) => s + x.st.reunioes.length, 0);
  const freqClube = porUnidade.length
    ? Math.round(porUnidade.reduce((s, x) => s + x.st.frequencia, 0) / porUnidade.length)
    : 0;

  const doDia = porUnidade.map((x) => {
    const r = x.dados.reunioes.find((r) => r.data === dataSel) || null;
    return { ...x, reuniao: r, diaSt: r ? statsDia(x.unidade, x.dados, r) : null };
  });
  const totalDia = doDia.reduce((s, x) => s + (x.diaSt?.total || 0), 0);
  const presentesDia = doDia.reduce((s, x) => s + (x.diaSt?.presentes || 0), 0);
  const membrosNoDia = doDia.reduce((s, x) => s + (x.reuniao ? x.unidade.membros.length : 0), 0);

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: NAVY_MID, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
        />
        <div className="flex-1" />
        <span className="text-[11px]" style={{ color: SILVER_DIM }}>
          {unidades.length} {unidades.length === 1 ? "unidade" : "unidades"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[["dia", "Dia"], ["mes", "Mês"], ["unidade", "Por unidade"], ["ano", "Ano"]].map(
          ([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setVista(k)}
              className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest"
              style={{
                background: vista === k ? GOLD : "transparent",
                color: vista === k ? NAVY_DEEP : SILVER,
                border: `1px solid ${vista === k ? GOLD : NAVY_LINE}`,
              }}
            >
              {l}
            </button>
          )
        )}
      </div>

      {vista === "ano" && <RankingAno unidades={unidades} clube={clube} />}

      {vista === "dia" && (
        <>
          <Cartao className="mb-4">
            <Titulo sub="Datas em que alguma unidade se reuniu neste mês.">Data</Titulo>
            <div className="flex flex-wrap gap-2">
              {datas.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDataSel(d)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: d === dataSel ? GOLD : "transparent",
                    color: d === dataSel ? NAVY_DEEP : SILVER,
                    border: `1px solid ${d === dataSel ? GOLD : NAVY_LINE}`,
                  }}
                >
                  {fmtData(d)}
                </button>
              ))}
              {datas.length === 0 && (
                <p className="text-xs" style={{ color: SILVER_DIM }}>
                  Nenhuma unidade lançou reunião neste mês.
                </p>
              )}
            </div>
          </Cartao>

          {dataSel && (
            <>
              <Cartao className="mb-4">
                <Titulo sub={`Reunião de ${fmtData(dataSel)}`}>Clube no dia</Titulo>
                <div className="grid grid-cols-2 gap-2">
                  <Metrica valor={totalDia} label="Pontos do clube" destaque />
                  <Metrica
                    valor={`${presentesDia}/${membrosNoDia}`}
                    label="Presentes"
                    sub={`${doDia.filter((x) => x.reuniao).length} unidades reunidas`}
                  />
                </div>
              </Cartao>

              <Cartao className="mb-4">
                <Titulo sub="Total de cada unidade na data">Comparativo</Titulo>
                <Barras
                  itens={doDia
                    .filter((x) => x.reuniao)
                    .sort((a, b) => b.diaSt.total - a.diaSt.total)
                    .map((x) => ({ label: x.unidade.nome, valor: x.diaSt.total }))}
                  vazio="Nenhuma unidade se reuniu nesta data."
                />
              </Cartao>

              <div className="space-y-3">
                {doDia.map((x) => (
                  <Cartao key={x.unidade.id}>
                    <div className="flex items-center gap-3 mb-3">
                      <Estrela size={22} pct={x.diaSt ? x.diaSt.aproveitamento : 0} />
                      <p className="text-sm font-semibold flex-1 truncate" style={{ color: "#fff" }}>
                        {x.unidade.nome}
                      </p>
                      <Botao small tipo="fantasma" onClick={() => onAbrirUnidade(x.unidade.id)}>
                        Abrir
                      </Botao>
                    </div>
                    {x.reuniao ? (
                      <div className="grid grid-cols-3 gap-2">
                        <Metrica valor={x.diaSt.total} label="Pontos" />
                        <Metrica
                          valor={`${x.diaSt.presentes}/${x.unidade.membros.length}`}
                          label="Presentes"
                        />
                        <Metrica valor={`${x.diaSt.aproveitamento}%`} label="Aproveit." />
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: SILVER_DIM }}>
                        Sem reunião lançada nesta data.
                      </p>
                    )}
                  </Cartao>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {vista === "mes" && (
        <>
          <Cartao className="mb-4">
            <Titulo sub={fmtMes(mes)}>Clube no mês</Titulo>
            <div className="grid grid-cols-2 gap-2">
              <Metrica valor={totalClube} label="Pontos do clube" destaque />
              <Metrica valor={`${freqClube}%`} label="Frequência média" />
              <Metrica valor={totalMembros} label="Desbravadores" sub={`${unidades.length} unidades`} />
              <Metrica valor={reunioesClube} label="Reuniões lançadas" />
            </div>
          </Cartao>

          <Cartao className="mb-4">
            <Titulo sub="Total acumulado no mês">Classificação das unidades</Titulo>
            <div className="space-y-2">
              {[...porUnidade]
                .sort((a, b) => b.st.total - a.st.total)
                .map((x, i) => (
                  <LinhaRanking
                    key={x.unidade.id}
                    posicao={i + 1}
                    pct={x.st.aproveitamento}
                    nome={x.unidade.nome}
                    detalhe={`${x.st.aproveitamento}% · frequência ${x.st.frequencia}%`}
                    valor={x.st.total}
                  />
                ))}
            </div>
          </Cartao>

          <Cartao>
            <Titulo sub="Média de pontos por desbravador">Média por membro</Titulo>
            <Barras
              itens={[...porUnidade]
                .sort((a, b) => b.st.mediaMembro - a.st.mediaMembro)
                .map((x) => ({ label: x.unidade.nome, valor: x.st.mediaMembro }))}
            />
          </Cartao>
        </>
      )}

      {vista === "unidade" && (
        <div className="space-y-3">
          {porUnidade.map((x) => {
            const aberto = aberta === x.unidade.id;
            return (
              <div
                key={x.unidade.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: NAVY_MID, border: `1px solid ${NAVY_LINE}` }}
              >
                <button
                  type="button"
                  onClick={() => setAberta(aberto ? null : x.unidade.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <Estrela size={30} pct={x.st.aproveitamento} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
                      {x.unidade.nome}
                    </p>
                    <p className="text-[11px]" style={{ color: SILVER_DIM }}>
                      {x.unidade.membros.length} membros · {x.st.reunioes.length} reuniões
                    </p>
                  </div>
                  <span className="text-base font-bold" style={{ color: GOLD_LT }}>
                    {x.st.total}
                  </span>
                </button>

                {aberto && (
                  <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${NAVY_LINE}` }}>
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <Metrica valor={`${x.st.aproveitamento}%`} label="Aproveitamento" />
                      <Metrica valor={`${x.st.frequencia}%`} label="Frequência" />
                      <Metrica valor={x.st.mediaMembro} label="Média por membro" />
                      <Metrica
                        valor={`${x.st.bandeirins}/${x.st.reunioes.length}`}
                        label="Bandeirim"
                        sub={`${x.st.completas} unidades completas`}
                      />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: SILVER_DIM }}>
                        Reunião a reunião
                      </p>
                      <Barras itens={x.st.porReuniao} vazio="Sem reuniões neste mês." />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: SILVER_DIM }}>
                        Destaques
                      </p>
                      <Barras
                        itens={x.st.membros.slice(0, 5).map((m) => ({ label: m.nome, valor: m.total }))}
                        vazio="Sem membros cadastrados."
                      />
                    </div>
                    <Botao small tipo="fantasma" onClick={() => onAbrirUnidade(x.unidade.id)}>
                      Abrir a unidade
                    </Botao>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* =============================================================== cadastro === */

function Cadastro({ unidades, recarregar, onAbrirUnidade }) {
  const [nova, setNova] = useState("");
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");

  const tentar = async (fn) => {
    try {
      setErro("");
      await fn();
      await recarregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <>
      {erro && <Aviso>{erro}</Aviso>}
      <Cartao className="mb-4">
        <Titulo sub="A unidade aparece para quem a diretoria vincular a ela na aba Pessoas.">
          Unidades
        </Titulo>

        {unidades.length === 0 && (
          <p className="text-xs mb-4" style={{ color: SILVER_DIM }}>
            Nenhuma unidade cadastrada ainda. Comece pela primeira.
          </p>
        )}

        <div className="space-y-3">
          {unidades.map((u) => (
            <div
              key={u.id}
              className="rounded-xl p-3"
              style={{ background: NAVY_DEEP, border: `1px solid ${NAVY_LINE}` }}
            >
              <div className="flex items-center gap-3">
                <Estrela size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
                    {u.nome}
                  </p>
                  <p className="text-[11px]" style={{ color: SILVER_DIM }}>
                    {u.membros.length} {u.membros.length === 1 ? "membro" : "membros"}
                  </p>
                </div>
                <Botao small tipo="fantasma" onClick={() => setEditando(editando === u.id ? null : u.id)}>
                  {editando === u.id ? "Fechar" : "Ajustes"}
                </Botao>
                <Botao small onClick={() => onAbrirUnidade(u.id)}>Abrir</Botao>
              </div>

              {editando === u.id && (
                <div className="mt-4 space-y-3">
                  <Campo
                    label="Nome da unidade"
                    defaultValue={u.nome}
                    onBlur={(e) =>
                      e.target.value.trim() !== u.nome &&
                      tentar(() => renomearUnidade(u.id, e.target.value.trim()))
                    }
                  />
                  <Membros unidade={u} tentar={tentar} />
                  <Botao
                    tipo="perigo"
                    small
                    onClick={() =>
                      window.confirm(
                        `Excluir a unidade ${u.nome} com todos os membros e lançamentos?`
                      ) && tentar(() => excluirUnidade(u.id))
                    }
                  >
                    Excluir unidade
                  </Botao>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && nova.trim() && tentar(async () => {
                await criarUnidade(nova.trim());
                setNova("");
              })
            }
            placeholder="Nome da nova unidade"
            className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: NAVY_DEEP, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
          />
          <Botao
            onClick={() =>
              nova.trim() &&
              tentar(async () => {
                await criarUnidade(nova.trim());
                setNova("");
              })
            }
          >
            Adicionar
          </Botao>
        </div>
      </Cartao>
    </>
  );
}

function Membros({ unidade, tentar }) {
  const [nome, setNome] = useState("");
  const incluir = () =>
    nome.trim() &&
    tentar(async () => {
      await criarMembro(unidade.id, nome.trim());
      setNome("");
    });

  return (
    <div>
      <span className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: SILVER_DIM }}>
        Membros
      </span>
      <div className="space-y-2 mb-2">
        {unidade.membros.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <input
              defaultValue={m.nome}
              onBlur={(e) =>
                e.target.value.trim() !== m.nome &&
                tentar(() => renomearMembro(m.id, e.target.value.trim()))
              }
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: NAVY_MID, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
            />
            <Botao
              tipo="perigo"
              small
              onClick={() =>
                window.confirm(`Remover ${m.nome} da unidade?`) &&
                tentar(() => excluirMembro(m.id))
              }
            >
              Remover
            </Botao>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && incluir()}
          placeholder="Nome do desbravador"
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: NAVY_MID, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
        />
        <Botao small onClick={incluir}>Incluir</Botao>
      </div>
    </div>
  );
}

/* ================================================================ pessoas === */

function Pessoas({ unidades }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setErro("");
      setLista(await listarPessoas());
    } catch (e) {
      setErro(e.message);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const mudar = async (id, campos) => {
    try {
      setErro("");
      await atualizarPessoa(id, campos);
      setLista((l) => l.map((p) => (p.id === id ? { ...p, ...campos } : p)));
    } catch (e) {
      setErro(e.message);
      carregar();
    }
  };

  if (erro && !lista) return <Aviso>{erro}</Aviso>;
  if (!lista)
    return (
      <Cartao>
        <Carregando texto="Buscando as pessoas do clube…" />
      </Cartao>
    );

  const pendentes = lista.filter((p) => p.papel === "pendente");

  /* Quantos conselheiros cada unidade já tem — o teto é 3. */
  const conselheiros = {};
  for (const u of unidades)
    conselheiros[u.id] = lista.filter(
      (p) => p.papel === "conselheiro" && p.unidade_id === u.id
    );
  const lotada = (unidadeId, pessoa) =>
    (conselheiros[unidadeId] || []).filter((c) => c.id !== pessoa.id).length >= LIMITE_CONSELHEIROS;

  return (
    <>
      {erro && <Aviso>{erro}</Aviso>}

      <Cartao className="mb-4">
        <Titulo sub={`Cada unidade pode ter até ${LIMITE_CONSELHEIROS} conselheiros.`}>
          Conselheiros por unidade
        </Titulo>
        <div className="space-y-2">
          {unidades.map((u) => {
            const nomes = conselheiros[u.id] || [];
            const cheia = nomes.length >= LIMITE_CONSELHEIROS;
            return (
              <div
                key={u.id}
                className="rounded-xl px-3 py-2.5"
                style={{ background: NAVY_DEEP, border: `1px solid ${NAVY_LINE}` }}
              >
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-semibold flex-1 truncate" style={{ color: "#fff" }}>
                    {u.nome}
                  </p>
                  <span
                    className="text-xs font-bold"
                    style={{ color: cheia ? GOLD : SILVER_DIM }}
                  >
                    {nomes.length}/{LIMITE_CONSELHEIROS}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: SILVER_DIM }}>
                  {nomes.length
                    ? nomes.map((c) => c.nome || c.email).join(" · ")
                    : "nenhum conselheiro vinculado"}
                </p>
              </div>
            );
          })}
          {unidades.length === 0 && (
            <p className="text-xs" style={{ color: SILVER_DIM }}>
              Cadastre as unidades primeiro.
            </p>
          )}
        </div>
      </Cartao>

      <Cartao className="mb-4">
        <Titulo sub="Quem cria conta entra como pendente e só enxerga o sistema depois que você define o papel e a unidade.">
          Pessoas
        </Titulo>

        {pendentes.length > 0 && (
          <Aviso tipo="info">
            {pendentes.length === 1
              ? "1 pessoa aguardando liberação."
              : `${pendentes.length} pessoas aguardando liberação.`}
          </Aviso>
        )}

        <div className="space-y-3">
          {lista.map((p) => {
            const bloqueiaConselheiro = p.unidade_id ? lotada(p.unidade_id, p) : false;
            return (
              <div
                key={p.id}
                className="rounded-xl p-3 space-y-3"
                style={{
                  background: NAVY_DEEP,
                  border: `1px solid ${p.papel === "pendente" ? GOLD : NAVY_LINE}`,
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#fff" }}>
                    {p.nome || "sem nome"}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: SILVER_DIM }}>
                    {p.email}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Selecao
                    label="Papel"
                    value={p.papel}
                    onChange={(e) => mudar(p.id, { papel: e.target.value })}
                  >
                    {PAPEIS.map(([v, l]) => (
                      <option
                        key={v}
                        value={v}
                        disabled={v === "conselheiro" && p.papel !== "conselheiro" && bloqueiaConselheiro}
                      >
                        {l}
                      </option>
                    ))}
                  </Selecao>
                  <Selecao
                    label="Unidade"
                    value={p.unidade_id || ""}
                    onChange={(e) => mudar(p.id, { unidade_id: e.target.value || null })}
                  >
                    <option value="">— sem unidade —</option>
                    {unidades.map((u) => (
                      <option
                        key={u.id}
                        value={u.id}
                        disabled={p.papel === "conselheiro" && lotada(u.id, p)}
                      >
                        {u.nome}
                        {p.papel === "conselheiro"
                          ? ` (${(conselheiros[u.id] || []).length}/${LIMITE_CONSELHEIROS})`
                          : ""}
                      </option>
                    ))}
                  </Selecao>
                </div>
                {bloqueiaConselheiro && p.papel !== "conselheiro" && (
                  <p className="text-[11px]" style={{ color: SILVER_DIM }}>
                    Esta unidade já tem {LIMITE_CONSELHEIROS} conselheiros. Para incluir mais um,
                    mude o papel de alguém antes.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Cartao>

      <Cartao>
        <p className="text-[11px] leading-relaxed" style={{ color: SILVER_DIM }}>
          A Diretoria Executiva vê e edita todas as unidades. Conselheiro e secretário lançam
          apenas na unidade em que estão vinculados — até {LIMITE_CONSELHEIROS} conselheiros por
          unidade. O desbravador só consulta a própria unidade.
        </p>
      </Cartao>
    </>
  );
}
