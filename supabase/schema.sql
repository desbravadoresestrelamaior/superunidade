-- ===========================================================================
-- CLUBE DE DESBRAVADORES ESTRELA MAIOR
-- Avaliação de unidade — estrutura do banco
--
-- Como usar: abra o painel do Supabase, vá em SQL Editor, cole este arquivo
-- inteiro e execute. Depois siga o passo do primeiro diretor, no fim do arquivo.
-- ===========================================================================

-- ---------------------------------------------------------------- tabelas ---

create table if not exists public.unidades (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  criado_em  timestamptz not null default now()
);

create table if not exists public.perfis (
  id          uuid primary key references auth.users on delete cascade,
  nome        text not null default '',
  email       text,
  papel       text not null default 'pendente'
              check (papel in ('pendente','desbravador','secretario','conselheiro','diretoria')),
  unidade_id  uuid references public.unidades(id) on delete set null,
  criado_em   timestamptz not null default now()
);

create table if not exists public.membros (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references public.unidades(id) on delete cascade,
  nome        text not null,
  perfil_id   uuid references public.perfis(id) on delete set null,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);
create index if not exists membros_unidade_idx on public.membros(unidade_id);

create table if not exists public.reunioes (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid not null references public.unidades(id) on delete cascade,
  data        date not null,
  bandeirim   boolean not null default false,
  completa    boolean not null default false,
  criado_em   timestamptz not null default now(),
  unique (unidade_id, data)
);
create index if not exists reunioes_unidade_data_idx on public.reunioes(unidade_id, data);

create table if not exists public.avaliacoes (
  id           uuid primary key default gen_random_uuid(),
  reuniao_id   uuid not null references public.reunioes(id) on delete cascade,
  membro_id    uuid not null references public.membros(id) on delete cascade,
  frequencia   text,                       -- pontual | presenca | ausencia | null
  devocao      jsonb not null default '{}'::jsonb,
  uniforme     jsonb not null default '{}'::jsonb,
  materiais    jsonb not null default '{}'::jsonb,
  disciplina   text,                       -- disciplinado | indisciplinado | null
  atualizado_em timestamptz not null default now(),
  unique (reuniao_id, membro_id)
);
create index if not exists avaliacoes_reuniao_idx on public.avaliacoes(reuniao_id);

-- ------------------------------------------------- funções de permissão ---
-- SECURITY DEFINER para consultar "perfis" sem cair na própria política
-- (evita recursão infinita nas regras de acesso).

create or replace function public.sou_diretoria()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'diretoria' from public.perfis where id = auth.uid()), false);
$$;

create or replace function public.minha_unidade()
returns uuid language sql stable security definer set search_path = public as $$
  select unidade_id from public.perfis where id = auth.uid();
$$;

-- vê a unidade: diretoria vê tudo; os demais só a unidade em que estão
create or replace function public.vejo_unidade(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select papel = 'diretoria' or (papel <> 'pendente' and unidade_id = u)
    from public.perfis where id = auth.uid()
  ), false);
$$;

-- edita a unidade: diretoria, conselheiro e secretário da própria unidade
create or replace function public.edito_unidade(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select papel = 'diretoria'
        or (papel in ('conselheiro','secretario') and unidade_id = u)
    from public.perfis where id = auth.uid()
  ), false);
$$;

create or replace function public.unidade_da_reuniao(r uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select unidade_id from public.reunioes where id = r;
$$;

-- --------------------------------------------------------- perfil novo ----
-- Ao criar a conta, o usuário entra como "pendente" e a diretoria libera.

create or replace function public.novo_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.novo_perfil();

-- --------------------------------------------- limite de conselheiros ----
-- Uma unidade pode ter até 3 conselheiros. A regra fica no banco para valer
-- mesmo que alguém tente contornar a tela.

create or replace function public.limite_conselheiros()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  quantos int;
begin
  if new.papel = 'conselheiro' and new.unidade_id is not null then
    select count(*) into quantos
      from public.perfis
     where unidade_id = new.unidade_id
       and papel = 'conselheiro'
       and id <> new.id;
    if quantos >= 3 then
      raise exception
        'Esta unidade já tem 3 conselheiros. Troque o papel de um deles antes de incluir outro.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists limite_de_conselheiros on public.perfis;
create trigger limite_de_conselheiros
  before insert or update on public.perfis
  for each row execute function public.limite_conselheiros();

-- ------------------------------------------------------------- políticas ---

alter table public.unidades   enable row level security;
alter table public.perfis     enable row level security;
alter table public.membros    enable row level security;
alter table public.reunioes   enable row level security;
alter table public.avaliacoes enable row level security;

-- perfis: cada um vê o próprio; a diretoria vê e edita todos
drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis for select
  using (id = auth.uid() or public.sou_diretoria());

drop policy if exists perfis_editar on public.perfis;
create policy perfis_editar on public.perfis for update
  using (public.sou_diretoria()) with check (public.sou_diretoria());

drop policy if exists perfis_excluir on public.perfis;
create policy perfis_excluir on public.perfis for delete
  using (public.sou_diretoria());

-- unidades
drop policy if exists unidades_ler on public.unidades;
create policy unidades_ler on public.unidades for select
  using (public.vejo_unidade(id));

drop policy if exists unidades_criar on public.unidades;
create policy unidades_criar on public.unidades for insert
  with check (public.sou_diretoria());

drop policy if exists unidades_editar on public.unidades;
create policy unidades_editar on public.unidades for update
  using (public.sou_diretoria()) with check (public.sou_diretoria());

drop policy if exists unidades_excluir on public.unidades;
create policy unidades_excluir on public.unidades for delete
  using (public.sou_diretoria());

-- membros
drop policy if exists membros_ler on public.membros;
create policy membros_ler on public.membros for select
  using (public.vejo_unidade(unidade_id));

drop policy if exists membros_criar on public.membros;
create policy membros_criar on public.membros for insert
  with check (public.edito_unidade(unidade_id));

drop policy if exists membros_editar on public.membros;
create policy membros_editar on public.membros for update
  using (public.edito_unidade(unidade_id)) with check (public.edito_unidade(unidade_id));

drop policy if exists membros_excluir on public.membros;
create policy membros_excluir on public.membros for delete
  using (public.edito_unidade(unidade_id));

-- reuniões
drop policy if exists reunioes_ler on public.reunioes;
create policy reunioes_ler on public.reunioes for select
  using (public.vejo_unidade(unidade_id));

drop policy if exists reunioes_criar on public.reunioes;
create policy reunioes_criar on public.reunioes for insert
  with check (public.edito_unidade(unidade_id));

drop policy if exists reunioes_editar on public.reunioes;
create policy reunioes_editar on public.reunioes for update
  using (public.edito_unidade(unidade_id)) with check (public.edito_unidade(unidade_id));

drop policy if exists reunioes_excluir on public.reunioes;
create policy reunioes_excluir on public.reunioes for delete
  using (public.edito_unidade(unidade_id));

-- avaliações (a unidade vem da reunião)
drop policy if exists avaliacoes_ler on public.avaliacoes;
create policy avaliacoes_ler on public.avaliacoes for select
  using (public.vejo_unidade(public.unidade_da_reuniao(reuniao_id)));

drop policy if exists avaliacoes_criar on public.avaliacoes;
create policy avaliacoes_criar on public.avaliacoes for insert
  with check (public.edito_unidade(public.unidade_da_reuniao(reuniao_id)));

drop policy if exists avaliacoes_editar on public.avaliacoes;
create policy avaliacoes_editar on public.avaliacoes for update
  using (public.edito_unidade(public.unidade_da_reuniao(reuniao_id)))
  with check (public.edito_unidade(public.unidade_da_reuniao(reuniao_id)));

drop policy if exists avaliacoes_excluir on public.avaliacoes;
create policy avaliacoes_excluir on public.avaliacoes for delete
  using (public.edito_unidade(public.unidade_da_reuniao(reuniao_id)));

-- ===========================================================================
-- PRIMEIRO DIRETOR
-- Crie sua conta pelo próprio sistema e, depois, rode a linha abaixo trocando
-- o e-mail. A partir daí você libera todo mundo pela tela "Pessoas".
--
--   update public.perfis set papel = 'diretoria' where email = 'seu@email.com';
-- ===========================================================================
