import React, { useState, useEffect, useRef } from "react";
import {
  CRITERIOS, MAX_MEMBRO, PT_BANDEIRIM, PT_COMPLETA,
  pontosDoRegistro, statsPeriodo, fmtData, fmtMes, mesAtual, hojeISO, faixaDoMes,
} from "../lib/pontuacao";
import {
  carregarPeriodo, criarReuniao, atualizarReuniao, excluirReuniao, salvarAvaliacao,
} from "../lib/api";
import {
  Cabecalho, Cartao, Titulo, Botao, Abas, Aviso, Carregando, baixarCSV,
  GOLD, GOLD_LT, NAVY_DEEP, NAVY_MID, NAVY_LINE, SILVER, SILVER_DIM,
} from "../componentes/ui";
import { FichaMembro, VisaoDia, VisaoMes, RankingAno } from "../componentes/visoes";

export default function Unidade({ unidade, clube, podeEditar, onSair, rotulo }) {
  const [mes, setMes] = useState(mesAtual());
  const [dados, setDados] = useState(null);
  const [aba, setAba] = useState(podeEditar ? "lancar" : "dia");
  const [reuniaoId, setReuniaoId] = useState(null);
  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("");
  const temporizadores = useRef({});

  useEffect(() => {
    let vivo = true;
    setDados(null);
    setErro("");
    (async () => {
      try {
        const [de, ate] = faixaDoMes(mes);
        const mapa = await carregarPeriodo([unidade.id], de, ate);
        if (!vivo) return;
        const d = mapa[unidade.id];
        setDados(d);
        setReuniaoId(d.reunioes[d.reunioes.length - 1]?.id || null);
      } catch (e) {
        if (vivo) setErro(e.message);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [unidade.id, mes]);

  if (erro && !dados)
    return (
      <>
        <Cabecalho titulo={unidade.nome} sub={clube} direita={<Botao tipo="fantasma" small onClick={onSair}>Sair</Botao>} />
        <Aviso>{erro}</Aviso>
      </>
    );
  if (!dados)
    return (
      <>
        <Cabecalho titulo={unidade.nome} sub={clube} direita={<Botao tipo="fantasma" small onClick={onSair}>Sair</Botao>} />
        <Carregando texto="Abrindo a unidade…" />
      </>
    );

  const reuniao = dados.reunioes.find((r) => r.id === reuniaoId) || null;

  /* ------------------------------------------------------------ ações --- */

  const novaReuniao = async () => {
    try {
      const nova = await criarReuniao(unidade.id, hojeISO());
      setDados({
        ...dados,
        reunioes: [...dados.reunioes, nova].sort((a, b) => (a.data < b.data ? -1 : 1)),
      });
      setReuniaoId(nova.id);
      setErro("");
    } catch (e) {
      setErro(e.message);
    }
  };

  const mudarReuniao = async (id, campos) => {
    setDados({
      ...dados,
      reunioes: dados.reunioes.map((r) => (r.id === id ? { ...r, ...campos } : r)),
    });
    try {
      await atualizarReuniao(id, campos);
      piscar("salvo");
    } catch (e) {
      setErro(e.message);
    }
  };

  const apagarReuniao = async (id) => {
    if (!window.confirm("Excluir esta reunião e tudo o que foi lançado nela?")) return;
    try {
      await excluirReuniao(id);
      const registros = { ...dados.registros };
      for (const m of Object.keys(registros)) {
        const copia = { ...registros[m] };
        delete copia[id];
        registros[m] = copia;
      }
      const reunioes = dados.reunioes.filter((r) => r.id !== id);
      setDados({ reunioes, registros });
      setReuniaoId(reunioes[reunioes.length - 1]?.id || null);
    } catch (e) {
      setErro(e.message);
    }
  };

  const piscar = (texto) => {
    setStatus(texto);
    setTimeout(() => setStatus(""), 1600);
  };

  /* Atualiza na tela na hora e grava no banco pouco depois, para não
     disparar uma escrita a cada toque. */
  const mudarRegistro = (membroId, patch) => {
    const atual = dados.registros[membroId]?.[reuniaoId] || {};
    const novo = { ...atual, ...patch };
    setDados({
      ...dados,
      registros: {
        ...dados.registros,
        [membroId]: { ...(dados.registros[membroId] || {}), [reuniaoId]: novo },
      },
    });

    const chave = `${reuniaoId}:${membroId}`;
    clearTimeout(temporizadores.current[chave]);
    setStatus("salvando");
    temporizadores.current[chave] = setTimeout(async () => {
      try {
        await salvarAvaliacao(reuniaoId, membroId, novo);
        piscar("salvo");
      } catch (e) {
        setErro(e.message);
        setStatus("");
      }
    }, 700);
  };

  /* ----------------------------------------------------------- números --- */

  const s = statsPeriodo(unidade, dados);
  const totalMembro = (id) => s.membros.find((m) => m.id === id)?.total ?? 0;

  const exportar = () => {
    const linhas = [
      `${clube} — Avaliação de unidade`,
      `Unidade: ${unidade.nome};Mês: ${fmtMes(mes)}`,
      "",
      ["Membro", ...dados.reunioes.map((r) => fmtData(r.data)), "Total"].join(";"),
    ];
    for (const m of unidade.membros)
      linhas.push(
        [
          m.nome,
          ...dados.reunioes.map((r) => pontosDoRegistro(dados.registros[m.id]?.[r.id])),
          totalMembro(m.id),
        ].join(";")
      );
    linhas.push("");
    linhas.push(
      [
        "Unidade (bandeirim + completa)",
        ...dados.reunioes.map(
          (r) => (r.bandeirim ? PT_BANDEIRIM : 0) + (r.completa ? PT_COMPLETA : 0)
        ),
        s.ptUnidade,
      ].join(";")
    );
    baixarCSV(`avaliacao-${unidade.nome.toLowerCase().replace(/\s+/g, "-")}-${mes}.csv`, linhas);
  };

  const seletorReuniao = (
    <div className="flex flex-wrap gap-2">
      {dados.reunioes.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => setReuniaoId(r.id)}
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: r.id === reuniaoId ? GOLD : "transparent",
            color: r.id === reuniaoId ? NAVY_DEEP : SILVER,
            border: `1px solid ${r.id === reuniaoId ? GOLD : NAVY_LINE}`,
          }}
        >
          {fmtData(r.data)}
        </button>
      ))}
      {podeEditar && (
        <button
          type="button"
          onClick={novaReuniao}
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "transparent", color: GOLD, border: `1px dashed ${GOLD}` }}
        >
          + reunião
        </button>
      )}
      {dados.reunioes.length === 0 && !podeEditar && (
        <p className="text-xs" style={{ color: SILVER_DIM }}>
          Nenhuma reunião registrada neste mês.
        </p>
      )}
    </div>
  );

  return (
    <>
      <Cabecalho
        titulo={unidade.nome}
        sub={`${clube} · ${rotulo}`}
        direita={<Botao tipo="fantasma" small onClick={onSair}>Sair</Botao>}
      />

      {erro && <Aviso>{erro}</Aviso>}

      <div className="flex items-center gap-2 mb-4">
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: NAVY_MID, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
        />
        <div className="flex-1" />
        {status && (
          <span className="text-[11px]" style={{ color: GOLD }}>
            {status === "salvando" ? "salvando…" : "salvo"}
          </span>
        )}
      </div>

      <Abas
        valor={aba}
        onChange={setAba}
        itens={[
          ["dia", "Dia"],
          ["mes", "Mês"],
          ["lancar", podeEditar ? "Lançar" : "Reuniões"],
          ["resumo", "Resumo"],
          ["ano", "Ano"],
        ]}
      />

      {aba === "ano" && <RankingAno unidades={[unidade]} clube={clube} />}

      {aba === "dia" && (
        <>
          <Cartao className="mb-4">
            <Titulo sub="Selecione a data para ver como foi a reunião.">Reunião</Titulo>
            {seletorReuniao}
          </Cartao>
          <VisaoDia unidade={unidade} dados={dados} reuniao={reuniao} />
        </>
      )}

      {aba === "mes" && <VisaoMes unidade={unidade} dados={dados} mes={mes} />}

      {aba === "lancar" && (
        <>
          <Cartao className="mb-4">
            <Titulo sub="Escolha a reunião que você está avaliando.">Reunião</Titulo>
            <div className="mb-3">{seletorReuniao}</div>

            {reuniao && (
              <div className="pt-3" style={{ borderTop: `1px solid ${NAVY_LINE}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="date"
                    value={reuniao.data}
                    disabled={!podeEditar}
                    onChange={(e) => mudarReuniao(reuniao.id, { data: e.target.value })}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: NAVY_DEEP, border: `1px solid ${NAVY_LINE}`, color: "#fff" }}
                  />
                  <div className="flex-1" />
                  {podeEditar && (
                    <Botao tipo="perigo" small onClick={() => apagarReuniao(reuniao.id)}>
                      Excluir
                    </Botao>
                  )}
                </div>

                <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: SILVER_DIM }}>
                  06 · Pontuação da unidade
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["bandeirim", "Bandeirim", PT_BANDEIRIM],
                    ["completa", "Unidade completa", PT_COMPLETA],
                  ].map(([campo, label, pts]) => (
                    <button
                      key={campo}
                      type="button"
                      disabled={!podeEditar}
                      onClick={() => mudarReuniao(reuniao.id, { [campo]: !reuniao[campo] })}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-left"
                      style={{
                        background: reuniao[campo] ? GOLD : "transparent",
                        color: reuniao[campo] ? NAVY_DEEP : SILVER,
                        border: `1px solid ${reuniao[campo] ? GOLD : NAVY_LINE}`,
                      }}
                    >
                      <span className="block leading-tight">{label}</span>
                      <span className="block text-[10px] font-normal mt-0.5" style={{ opacity: 0.75 }}>
                        {pts} pts
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Cartao>

          {reuniao &&
            unidade.membros.map((m) => (
              <FichaMembro
                key={m.id}
                membro={m}
                reg={dados.registros[m.id]?.[reuniaoId]}
                podeEditar={podeEditar}
                onChange={(patch) => mudarRegistro(m.id, patch)}
              />
            ))}

          {reuniao && unidade.membros.length === 0 && (
            <Cartao>
              <p className="text-xs" style={{ color: SILVER_DIM }}>
                Esta unidade ainda não tem membros. A diretoria cadastra os nomes na tela de unidades.
              </p>
            </Cartao>
          )}
        </>
      )}

      {aba === "resumo" && (
        <>
          <Cartao className="mb-4">
            <Titulo sub="Pontos por reunião">Detalhamento</Titulo>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ color: SILVER }}>
                <thead>
                  <tr style={{ color: SILVER_DIM }}>
                    <th className="text-left py-2 pr-3 font-semibold">Membro</th>
                    {dados.reunioes.map((r) => (
                      <th key={r.id} className="py-2 px-2 font-semibold whitespace-nowrap">
                        {fmtData(r.data)}
                      </th>
                    ))}
                    <th className="py-2 pl-2 font-semibold" style={{ color: GOLD }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unidade.membros.map((m) => (
                    <tr key={m.id} style={{ borderTop: `1px solid ${NAVY_LINE}` }}>
                      <td className="py-2 pr-3 whitespace-nowrap" style={{ color: "#fff" }}>
                        {m.nome}
                      </td>
                      {dados.reunioes.map((r) => (
                        <td key={r.id} className="py-2 px-2 text-center">
                          {pontosDoRegistro(dados.registros[m.id]?.[r.id])}
                        </td>
                      ))}
                      <td className="py-2 pl-2 text-center font-bold" style={{ color: GOLD_LT }}>
                        {totalMembro(m.id)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `2px solid ${NAVY_LINE}` }}>
                    <td className="py-2 pr-3 whitespace-nowrap font-semibold" style={{ color: GOLD }}>
                      Unidade
                    </td>
                    {dados.reunioes.map((r) => (
                      <td key={r.id} className="py-2 px-2 text-center">
                        {(r.bandeirim ? PT_BANDEIRIM : 0) + (r.completa ? PT_COMPLETA : 0)}
                      </td>
                    ))}
                    <td className="py-2 pl-2 text-center font-bold" style={{ color: GOLD_LT }}>
                      {s.ptUnidade}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Cartao>

          <div className="flex gap-2 mb-4">
            <Botao tipo="fantasma" onClick={exportar}>Baixar planilha</Botao>
            <Botao tipo="fantasma" onClick={() => window.print()}>Imprimir</Botao>
          </div>

          <Cartao>
            <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: SILVER_DIM }}>
              Tabela de pontos
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CRITERIOS.map((c) => (
                <div key={c.key}>
                  <p className="text-xs font-semibold mb-1" style={{ color: GOLD_LT }}>
                    {c.n} · {c.label}
                  </p>
                  {c.opcoes.map((o) => (
                    <p key={o.id} className="text-[11px]" style={{ color: SILVER }}>
                      {o.label} = {o.v}
                    </p>
                  ))}
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: GOLD_LT }}>
                  06 · Unidade
                </p>
                <p className="text-[11px]" style={{ color: SILVER }}>Completa = {PT_COMPLETA}</p>
                <p className="text-[11px]" style={{ color: SILVER }}>Bandeirim = {PT_BANDEIRIM}</p>
              </div>
            </div>
          </Cartao>
        </>
      )}
    </>
  );
}
