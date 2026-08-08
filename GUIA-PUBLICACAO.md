# Guia de publicação — Avaliação de Unidade

Este guia leva o sistema do arquivo `.zip` até um endereço na internet que
qualquer pessoa do clube abre pelo celular. Não é preciso saber programar: são
formulários, dois comandos no terminal e alguns cliques.

**Tempo:** cerca de 2 horas na primeira vez, com calma.
**Custo:** nenhum. Supabase e GitHub Pages têm planos gratuitos que sobram para
um clube.

Vá marcando os quadradinhos conforme avança.

---

## Parte 0 — Antes de começar

Separe:

- [ ] Um computador (Windows ou Mac). Não dá para fazer só pelo celular.
- [ ] Um e-mail seu, que será a conta de Diretoria Executiva.
- [ ] Uns 15 minutos sem interrupção para a Parte 3, que é a mais chata.

Você vai criar duas contas gratuitas: **Supabase** (guarda os dados) e
**GitHub** (guarda o código e publica o site).

---

## Parte 1 — Instalar os dois programas

### 1.1 Node.js

1. Abra [nodejs.org](https://nodejs.org).
2. Clique no botão grande que diz **LTS** (versão 20 ou maior).
3. Instale clicando em Avançar/Continuar até o fim. Não precisa mudar nada.

### 1.2 GitHub Desktop

1. Abra [desktop.github.com](https://desktop.github.com) e baixe.
2. Instale, mas ainda não abra. Voltamos nele na Parte 8.

> Por que o GitHub Desktop? Ele faz por botões o que normalmente se faz por
> comandos. Poupa você de decorar git.

### 1.3 Conferir se o Node instalou

**Windows:** aperte a tecla Windows, digite `powershell`, abra.
**Mac:** aperte Command + Espaço, digite `terminal`, abra.

Digite e dê Enter:

```
node --version
```

Tem que aparecer algo como `v20.11.0`. Se disser que o comando não existe,
feche a janela, abra de novo e tente outra vez. Se ainda assim não funcionar,
reinicie o computador.

---

## Parte 2 — Descompactar o projeto

1. Salve o arquivo `estrela-maior-avaliacao.zip` na pasta **Documentos**.
2. Clique com o botão direito → **Extrair tudo** (Windows) ou dois cliques
   (Mac).
3. Você vai ficar com uma pasta chamada `estrela-maior`.

**Confira:** dentro dela devem existir as pastas `src` e `supabase` e os
arquivos `package.json`, `README.md` e `.env.example`. Se você abriu uma pasta e
dentro dela tem outra `estrela-maior`, use a de dentro — é a que tem o
`package.json`.

Agora anote o caminho completo dessa pasta, você vai precisar:

- Windows: algo como `C:\Users\Gabriel\Documents\estrela-maior`
- Mac: algo como `/Users/gabriel/Documents/estrela-maior`

---

## Parte 3 — Criar o banco de dados no Supabase

### 3.1 Criar a conta e o projeto

1. Abra [supabase.com](https://supabase.com) e clique em **Start your project**.
2. Entre com o Google ou com o GitHub (se já criou o GitHub, use ele).
3. Clique em **New project**.
4. Preencha:
   - **Name:** `estrela-maior`
   - **Database Password:** clique em *Generate a password* e **copie essa senha
     para um lugar seguro**. Você provavelmente nunca vai usar, mas se perder e
     precisar, não tem como recuperar.
   - **Region:** `South America (São Paulo)` — deixa o sistema mais rápido aqui.
   - **Plan:** Free
5. Clique em **Create new project** e espere. Leva de 1 a 3 minutos. Enquanto
   isso aparece uma tela de "Setting up project".

### 3.2 Desligar a confirmação por e-mail

Esse passo evita uma dor de cabeça grande mais à frente.

1. No menu da esquerda, clique no ícone de **Authentication** (um cadeado).
2. Vá em **Sign In / Providers** → **Email**.
3. Desligue a chave **Confirm email**.
4. Clique em **Save**.

> Por quê? No plano gratuito, o Supabase envia poucos e-mails por hora. Se 20
> desbravadores criarem conta na mesma noite, a maioria não receberia a
> confirmação e ficaria travada. Sem confirmação, a conta já nasce pronta e você
> continua controlando tudo pela tela Pessoas.

### 3.3 Criar as tabelas

1. No menu da esquerda, clique em **SQL Editor**.
2. Clique em **New query** (ou no `+`).
3. No seu computador, abra a pasta `estrela-maior` → pasta `supabase` → arquivo
   `schema.sql`. Abra com o Bloco de Notas (Windows) ou TextEdit (Mac).
4. Selecione tudo (Ctrl+A / Command+A), copie (Ctrl+C / Command+C).
5. Volte ao Supabase, clique dentro da área escura e cole (Ctrl+V / Command+V).
6. Clique em **Run** (ou Ctrl+Enter).

**Confira:** embaixo deve aparecer **Success. No rows returned**. Se aparecer
erro em vermelho, você provavelmente colou só um pedaço — apague tudo, copie o
arquivo inteiro de novo e rode outra vez. Rodar duas vezes não causa problema.

**Confira também:** clique em **Table Editor** no menu da esquerda. Devem
aparecer 5 tabelas: `avaliacoes`, `membros`, `perfis`, `reunioes`, `unidades`.

### 3.4 Copiar as duas chaves

1. No menu da esquerda, lá embaixo, clique na engrenagem **Project Settings**.
2. Clique em **API Keys** (ou **API**, dependendo da versão).
3. Deixe essa aba aberta. Você vai copiar duas coisas na próxima parte:
   - **Project URL** — algo como `https://abcdefgh.supabase.co`
   - **anon public** — um texto bem longo que começa com `eyJ...`

> ⚠️ Existe uma terceira chave chamada **service_role**. Ela nunca entra no
> projeto, nunca vai para o GitHub, nunca vai para o WhatsApp. Essa é a chave
> mestra do banco.

---

## Parte 4 — Ligar o sistema ao banco

Você vai criar um arquivo chamado `.env` (com o ponto na frente, sem nome) na
pasta `estrela-maior`.

### No Windows

1. Abra a pasta `estrela-maior`.
2. Clique com o botão direito num espaço vazio → **Novo** → **Documento de
   texto**.
3. Abra esse arquivo no Bloco de Notas.
4. Cole isto dentro:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

5. Volte no Supabase, copie o **Project URL** e cole logo depois do primeiro
   `=`, sem espaço. Faça o mesmo com a chave **anon public** na segunda linha.
6. Menu **Arquivo** → **Salvar como**.
7. Em **Tipo**, escolha **Todos os arquivos**.
8. Em **Nome**, digite com aspas: `".env"` — as aspas são essenciais, senão o
   Windows salva como `.env.txt`.
9. Salve dentro da pasta `estrela-maior` e apague o `Novo documento de texto.txt`
   que sobrou.

### No Mac

1. Abra a pasta `estrela-maior`.
2. Duplique o arquivo `.env.example` (botão direito → Duplicar).
3. Renomeie a cópia para `.env`.
4. Abra com o TextEdit e preencha as duas linhas com o que você copiou.

> Se você não estiver vendo o `.env.example`, aperte Command + Shift + Ponto no
> Finder para mostrar arquivos ocultos.

O arquivo deve ficar mais ou menos assim:

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

Sem aspas, sem espaço antes ou depois do `=`, cada um numa linha só.

---

## Parte 5 — Rodar no seu computador

1. Abra o PowerShell (Windows) ou o Terminal (Mac).
2. Digite `cd `, dê um espaço, e **arraste a pasta `estrela-maior`** para dentro
   da janela preta. Ele preenche o caminho sozinho. Dê Enter.
3. Digite e dê Enter:

```
npm install
```

Isso baixa as peças que o sistema usa. Demora de 1 a 3 minutos e enche a tela de
texto — é normal. Avisos amarelos de `deprecated` podem ser ignorados.

4. Depois que terminar, digite e dê Enter:

```
npm run dev
```

5. Vai aparecer algo como `Local: http://localhost:5173/`. Segure Ctrl (ou
   Command) e clique no endereço, ou copie e cole no navegador.

**Confira:** deve aparecer o brasão do clube e a tela de entrada. Se aparecer
"Falta configurar", o `.env` está com o nome ou o conteúdo errado — volte à
Parte 4, corrija, feche a janela preta com Ctrl+C e rode `npm run dev` de novo.

> Enquanto essa janela preta estiver aberta, o sistema está no ar **só no seu
> computador**. Fechou a janela, parou. Isso é só para teste.

---

## Parte 6 — Virar Diretoria Executiva

1. Na tela de entrada, clique em **Ainda não tenho conta**.
2. Preencha seu nome completo, seu e-mail de verdade e uma senha de pelo menos
   8 caracteres. Clique em **Criar conta**.
3. Entre com esse e-mail e senha.
4. Vai aparecer a tela "Quase lá" — está certo. Sua conta nasceu pendente.
5. Volte ao Supabase → **SQL Editor** → **New query**. Cole a linha abaixo,
   trocando pelo seu e-mail, e clique em **Run**:

```sql
update public.perfis set papel = 'diretoria' where email = 'seu@email.com';
```

**Confira:** deve dizer `Success. No rows returned`. Se aparecer
`0 rows affected`, o e-mail está escrito diferente do que você cadastrou.

6. Volte ao sistema no navegador e aperte F5.

**Confira:** agora aparece o cabeçalho **Diretoria Executiva** com as abas
Painel geral, Unidades e Pessoas.

---

## Parte 7 — Cadastrar o clube e testar de verdade

Faça isso agora, ainda no seu computador, antes de publicar. É mais fácil
corrigir enquanto ninguém está usando.

1. Aba **Unidades** → digite o nome da primeira unidade → **Adicionar**.
2. Clique em **Ajustes** naquela unidade e vá incluindo os membros, um por um.
3. Repita para todas as unidades.
4. Clique em **Abrir** numa unidade → aba **Lançar** → **+ reunião**.
5. Marque a pontuação de dois ou três membros, teste o **Ausência** (os outros
   campos devem travar), marque Bandeirim.
6. Vá nas abas **Dia**, **Mês** e **Resumo** e veja se os números batem com o
   que você esperava.
7. Se quiser, apague essa reunião de teste antes de seguir.

---

## Parte 8 — Subir o código para o GitHub

### 8.1 Criar a conta

1. Abra [github.com](https://github.com) → **Sign up**.
2. Use o mesmo e-mail, escolha um nome de usuário (aparece no endereço do site,
   então escolha algo apresentável) e confirme o e-mail que eles enviam.

### 8.2 Publicar a pasta

1. Abra o **GitHub Desktop** e faça login com a conta que acabou de criar.
2. Menu **File** → **Add local repository**.
3. Clique em **Choose** e selecione a pasta `estrela-maior`.
4. Ele vai avisar que não é um repositório e oferecer **create a repository** —
   clique nesse link.
5. Na tela que abre, deixe o nome `estrela-maior` e clique em **Create
   repository**.
6. No topo, clique em **Publish repository**.
7. Deixe marcado **Keep this code private**. O site publicado funciona igual, e
   o código fica fechado.
8. Clique em **Publish repository** e espere.

**Confira:** o arquivo `.env` **não** pode aparecer na lista de arquivos do
GitHub Desktop. Ele já está bloqueado pelo `.gitignore`. Se aparecer, pare e me
avise antes de publicar.

---

## Parte 9 — Publicar o site

### 9.1 Guardar as chaves no GitHub

O site precisa das mesmas duas chaves, mas elas não estão no código (e ainda bem).

1. No site do github.com, abra seu repositório `estrela-maior`.
2. Aba **Settings** (a engrenagem no menu de cima do repositório, não a do seu
   perfil).
3. Menu da esquerda: **Secrets and variables** → **Actions**.
4. Botão **New repository secret**.
   - **Name:** `VITE_SUPABASE_URL`
   - **Secret:** cole o Project URL
   - **Add secret**
5. **New repository secret** de novo.
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Secret:** cole a chave anon public
   - **Add secret**

Os nomes precisam estar exatamente assim, em maiúsculas, com os underlines.

### 9.2 Ligar o GitHub Pages

1. Ainda em **Settings**, menu da esquerda → **Pages**.
2. Em **Source**, escolha **GitHub Actions**.
3. Pronto, não precisa salvar nada.

### 9.3 Disparar a publicação

1. Vá na aba **Actions** do repositório.
2. Se já houver uma execução chamada "Publicar no GitHub Pages", clique nela.
   Se estiver vermelha ou não existir, clique no fluxo à esquerda e depois em
   **Run workflow** → **Run workflow**.
3. Espere de 1 a 3 minutos. Quando ficar com o ✅ verde, clique na execução: o
   endereço do site aparece no bloco **deploy**.

O endereço fica assim:
`https://SEU-USUARIO.github.io/estrela-maior/`

### 9.4 Avisar o Supabase do endereço

1. Volte ao Supabase → **Authentication** → **URL Configuration**.
2. Em **Site URL**, cole o endereço do site.
3. Em **Redirect URLs**, clique em **Add URL** e cole o mesmo endereço.
4. **Save**.

**Confira:** abra o endereço no celular. Deve aparecer o brasão e a tela de
entrada. Faça login com sua conta de diretoria e veja se as unidades que você
cadastrou estão lá.

---

## Parte 10 — Chamar a equipe

Faça nesta ordem, sem pressa:

1. **Conselheiros e secretários primeiro.** Mande o link e peça para criarem a
   conta. Você libera cada um na aba **Pessoas**, escolhendo o papel e a
   unidade. Lembre que são no máximo 3 conselheiros por unidade.
2. **Teste com um conselheiro real**, junto com ele, numa reunião de verdade.
   É aí que aparecem as dúvidas que a gente não previu.
3. **Só depois abra para os desbravadores**, com o papel *Desbravador (só
   consulta)*.

Sugestão de mensagem para o grupo:

> Pessoal, a ficha de avaliação da unidade agora é digital.
> Entrem em ENDEREÇO, cliquem em "Ainda não tenho conta" e criem o acesso com
> nome completo. Me avisem quando criarem que eu libero a unidade de vocês.

---

## Parte 11 — Como mudar alguma coisa depois

Sempre que quiser ajustar o sistema:

1. Edite os arquivos na pasta `estrela-maior` no seu computador.
2. Teste com `npm run dev`.
3. Abra o GitHub Desktop: as mudanças aparecem na lista.
4. Escreva embaixo, à esquerda, o que você mudou (ex.: "corrige nome da
   unidade").
5. **Commit to main** → **Push origin**.
6. Em 2 minutos o site publicado se atualiza sozinho.

---

## Parte 12 — Quando algo dá errado

| O que aparece | O que fazer |
| --- | --- |
| "Falta configurar" na tela | O `.env` está com nome errado (virou `.env.txt`) ou faltou uma das linhas |
| `npm: command not found` | O Node não instalou. Reinicie o computador e refaça a Parte 1 |
| "E-mail ou senha não conferem" | Senha errada, ou a conta foi criada em outro projeto do Supabase |
| Fica preso em "Quase lá" | Falta a diretoria liberar o papel na aba Pessoas |
| "Sem unidade vinculada" | O papel foi definido mas a unidade ficou em branco |
| A publicação no GitHub falha (❌) | Quase sempre é nome de segredo trocado. Confira maiúsculas e underlines |
| Site abre em branco | Espere 2 minutos e recarregue; a primeira publicação demora |
| Tela pede login toda hora | Falta colar o endereço em Authentication → URL Configuration |
| "Esta unidade já tem 3 conselheiros" | Mude o papel de um deles antes de incluir outro |

---

## Parte 13 — Manutenção ao longo do ano

**O projeto hiberna.** Depois de 7 dias sem ninguém acessar, o Supabase gratuito
pausa o banco. Como o clube se reúne toda semana, isso só deve acontecer nas
férias. Se acontecer, entre no painel do Supabase e clique em **Restore** —
nenhum dado se perde.

**Guarde uma cópia dos dados.** Uma vez por mês, entre como diretoria, abra cada
unidade na aba **Resumo** e clique em **Baixar planilha**. No fim do ano, faça o
mesmo pelo ranking anual. São arquivos pequenos e valem ouro se algo der errado.

**Revise quem tem acesso.** No começo de cada ano, passe pela aba **Pessoas** e
tire o acesso de quem saiu do clube — é só mudar o papel para *Aguardando
liberação*.

**Sobre os dados dos menores.** O sistema guarda nome e frequência de crianças e
adolescentes. Combine com a diretoria quem terá acesso, não compartilhe o login
de diretoria com ninguém e evite colocar informações além do necessário nos
nomes (nada de apelidos constrangedores, endereço, telefone).

---

Se travar em qualquer ponto, anote **em qual parte você está** e **a mensagem
exata que apareceu na tela**. Com essas duas informações, resolver costuma ser
rápido.
