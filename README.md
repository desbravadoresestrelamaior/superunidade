# Avaliação de Unidade — Clube de Desbravadores Estrela Maior

Sistema para lançar e acompanhar a pontuação das unidades: frequência, devoção,
uniforme, materiais, disciplina, bandeirim e unidade completa. Substitui a ficha
de papel, com painéis do dia, do mês, por unidade e ranking anual em percentual.

## Quem vê o quê

| Papel | Pode |
| --- | --- |
| **Diretoria Executiva** | Tudo: cadastra unidades e membros, libera pessoas, vê todos os painéis |
| **Conselheiro** | Lança a pontuação da própria unidade (até 3 por unidade) |
| **Secretário** | Lança a pontuação da própria unidade |
| **Desbravador** | Consulta a pontuação da própria unidade |

Quem cria conta entra como **pendente** e não enxerga nada até a diretoria
definir o papel e a unidade. Uma unidade aceita no máximo **3 conselheiros** —
o limite vale no banco, não só na tela. Essas regras valem no banco, não só na tela — mesmo
quem souber mexer no código não consegue ler ou gravar fora da própria unidade.

> **Primeira vez publicando?** O arquivo [`GUIA-PUBLICACAO.md`](GUIA-PUBLICACAO.md)
> traz o passo a passo detalhado, com telas, conferências e o que fazer quando
> algo dá errado. O resumo abaixo serve para quem já conhece as ferramentas.

## 1. Criar o banco no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um projeto novo
   (o plano gratuito basta para um clube). Guarde a senha do banco.
2. No projeto, abra **SQL Editor**, cole o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e execute.
3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **anon public** (a chave pública; a `service_role` nunca vai para o site)

Se quiser dispensar a confirmação por e-mail enquanto testa, vá em
**Authentication → Providers → Email** e desligue *Confirm email*.

## 2. Rodar no seu computador

Precisa do [Node.js 20+](https://nodejs.org).

```bash
npm install
cp .env.example .env      # no Windows: copy .env.example .env
```

Abra o `.env` e preencha:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

```bash
npm run dev
```

Abra o endereço que aparecer no terminal.

## 3. Virar o primeiro diretor

1. No sistema, clique em **Ainda não tenho conta** e crie a sua.
2. Volte ao **SQL Editor** do Supabase e rode, trocando o e-mail:

```sql
update public.perfis set papel = 'diretoria' where email = 'seu@email.com';
```

3. Entre de novo. A partir daí você cadastra as unidades e libera todo mundo
   pela aba **Pessoas**.

## 4. Publicar no GitHub Pages

1. Suba o projeto para um repositório no GitHub.
2. Em **Settings → Secrets and variables → Actions → New repository secret**,
   crie os dois segredos:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
4. Todo push na branch `main` publica o site sozinho.

O endereço fica `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Como o
Vite está com `base: "./"`, funciona tanto na raiz quanto numa subpasta.

Por fim, volte ao Supabase em **Authentication → URL Configuration** e coloque
esse endereço em *Site URL* e em *Redirect URLs*.

## Sobre a chave pública no código

A `anon key` fica visível no site publicado — é assim que o Supabase funciona, e
não é um problema: quem protege os dados são as políticas de acesso do banco
(*Row Level Security*), que já estão no `schema.sql`. O que **nunca** pode ir
para o repositório é a chave `service_role`.

Como o sistema guarda nome e frequência de menores, vale combinar com a
diretoria quem terá acesso e revisar a lista de pessoas de tempos em tempos.

## Como a pontuação é calculada

| Critério | Itens |
| --- | --- |
| 01 Frequência | Pontual 40 · Presença 10 · Ausência 0 |
| 02 Devoção | Classe Bíblica 10 · Meditação 10 · Ano Bíblico 30 |
| 03 Uniforme | Lenço 20 · Camiseta 20 · Calçado 10 |
| 04 Materiais | Bíblia 25 · Classe 15 · Caderno 10 |
| 05 Disciplina | Disciplinado 50 · Indisciplinado 0 |
| 06 Unidade | Unidade completa 25 · Bandeirim 25 |

Máximo por desbravador em cada reunião: **240 pontos**.
Marcar **Ausência** zera e bloqueia os demais itens daquela reunião.

**Ranking anual.** Para unidade grande e pequena disputarem em igualdade, a nota
não é a soma de pontos e sim um percentual:

```
nota = 80% × (pontos dos membros ÷ máximo possível)
     + 20% × (bandeirim e unidade completa ÷ máximo possível)
```

No ranking individual, cada desbravador aparece pelo percentual do que era
possível somar no ano, com a frequência ao lado e um filtro de frequência
mínima — útil para decidir a insígnia de excelência.

## Estrutura

```
src/
  lib/
    supabase.js     conexão
    api.js          todas as consultas ao banco
    pontuacao.js    critérios, cálculos e estatísticas
  componentes/
    ui.jsx          peças visuais e a identidade do clube
    visoes.jsx      ficha do membro, painéis e ranking
  telas/
    Login.jsx  Diretoria.jsx  Unidade.jsx
  assets/           brasão, estrela e monograma
supabase/schema.sql tabelas, funções e políticas de acesso
```

## Identidade visual

Azul-marinho, prata e ouro, com a estrela de quatro pontas do brasão. Na lista
de pontuação a estrela funciona como medidor: vai se revelando conforme o
aproveitamento sobe. Os arquivos em `src/assets` são os originais do clube.
