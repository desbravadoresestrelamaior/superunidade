import { supabase } from "./supabase";
import { REGISTRO_VAZIO } from "./pontuacao";

/* Toda conversa com o banco passa por aqui. As telas não conhecem SQL. */

function erro(e) {
  if (e) throw new Error(e.message || "Não foi possível falar com o servidor.");
}

/* ------------------------------------------------------------- sessão --- */

export async function entrar(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
  });
  erro(error);
  return data;
}

export async function criarConta(nome, email, senha) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { nome: nome.trim() } },
  });
  erro(error);
  return data;
}

export async function sair() {
  await supabase.auth.signOut();
}

export async function meuPerfil() {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao?.user) return null;
  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", sessao.user.id)
    .maybeSingle();
  erro(error);
  return data;
}

/* ------------------------------------------------------------ pessoas --- */

export async function listarPessoas() {
  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .order("criado_em", { ascending: true });
  erro(error);
  return data || [];
}

export async function atualizarPessoa(id, campos) {
  const { error } = await supabase.from("perfis").update(campos).eq("id", id);
  erro(error);
}

/* ----------------------------------------------------------- unidades --- */

export async function listarUnidades() {
  const { data, error } = await supabase
    .from("unidades")
    .select("id, nome, membros(id, nome, ativo)")
    .order("nome");
  erro(error);
  return (data || []).map((u) => ({
    ...u,
    membros: (u.membros || [])
      .filter((m) => m.ativo !== false)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  }));
}

export async function criarUnidade(nome) {
  const { data, error } = await supabase
    .from("unidades")
    .insert({ nome })
    .select()
    .single();
  erro(error);
  return data;
}

export async function renomearUnidade(id, nome) {
  const { error } = await supabase.from("unidades").update({ nome }).eq("id", id);
  erro(error);
}

export async function excluirUnidade(id) {
  const { error } = await supabase.from("unidades").delete().eq("id", id);
  erro(error);
}

/* ------------------------------------------------------------ membros --- */

export async function criarMembro(unidadeId, nome) {
  const { data, error } = await supabase
    .from("membros")
    .insert({ unidade_id: unidadeId, nome })
    .select()
    .single();
  erro(error);
  return data;
}

export async function renomearMembro(id, nome) {
  const { error } = await supabase.from("membros").update({ nome }).eq("id", id);
  erro(error);
}

export async function excluirMembro(id) {
  const { error } = await supabase.from("membros").delete().eq("id", id);
  erro(error);
}

/* ----------------------------------------------------------- reuniões --- */

export async function criarReuniao(unidadeId, data) {
  const { data: linha, error } = await supabase
    .from("reunioes")
    .insert({ unidade_id: unidadeId, data })
    .select()
    .single();
  if (error && error.code === "23505")
    throw new Error("Já existe uma reunião lançada nessa data.");
  erro(error);
  return linha;
}

export async function atualizarReuniao(id, campos) {
  const { error } = await supabase.from("reunioes").update(campos).eq("id", id);
  erro(error);
}

export async function excluirReuniao(id) {
  const { error } = await supabase.from("reunioes").delete().eq("id", id);
  erro(error);
}

/* --------------------------------------------------------- avaliações --- */

export async function salvarAvaliacao(reuniaoId, membroId, reg) {
  const { error } = await supabase.from("avaliacoes").upsert(
    {
      reuniao_id: reuniaoId,
      membro_id: membroId,
      frequencia: reg.frequencia ?? null,
      devocao: reg.devocao || {},
      uniforme: reg.uniforme || {},
      materiais: reg.materiais || {},
      disciplina: reg.disciplina ?? null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "reuniao_id,membro_id" }
  );
  erro(error);
}

/* ------------------------------------------------------------ período --- */

/* Carrega reuniões e avaliações de um intervalo de datas e devolve, para cada
   unidade, o mesmo formato que as funções de estatística esperam:
   { reunioes: [...], registros: { membroId: { reuniaoId: registro } } }      */
export async function carregarPeriodo(unidadeIds, de, ate) {
  const vazio = () => ({ reunioes: [], registros: {} });
  const mapa = {};
  for (const id of unidadeIds) mapa[id] = vazio();
  if (unidadeIds.length === 0) return mapa;

  const { data: reunioes, error: e1 } = await supabase
    .from("reunioes")
    .select("*")
    .in("unidade_id", unidadeIds)
    .gte("data", de)
    .lte("data", ate)
    .order("data");
  erro(e1);

  for (const r of reunioes || []) mapa[r.unidade_id]?.reunioes.push(r);

  const ids = (reunioes || []).map((r) => r.id);
  if (ids.length === 0) return mapa;

  const { data: avaliacoes, error: e2 } = await supabase
    .from("avaliacoes")
    .select("*")
    .in("reuniao_id", ids);
  erro(e2);

  const unidadeDaReuniao = {};
  for (const r of reunioes) unidadeDaReuniao[r.id] = r.unidade_id;

  for (const a of avaliacoes || []) {
    const u = unidadeDaReuniao[a.reuniao_id];
    if (!u) continue;
    const reg = mapa[u].registros;
    reg[a.membro_id] = reg[a.membro_id] || {};
    reg[a.membro_id][a.reuniao_id] = {
      frequencia: a.frequencia,
      devocao: a.devocao || {},
      uniforme: a.uniforme || {},
      materiais: a.materiais || {},
      disciplina: a.disciplina,
    };
  }
  return mapa;
}

export { REGISTRO_VAZIO };
