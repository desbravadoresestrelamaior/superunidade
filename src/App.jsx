import React, { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigurado } from "./lib/supabase";
import { meuPerfil, listarUnidades, sair } from "./lib/api";
import Login from "./telas/Login";
import Diretoria from "./telas/Diretoria";
import Unidade from "./telas/Unidade";
import {
  Tela, Cartao, Titulo, Botao, Brasao, Aviso, Carregando,
  GOLD, SILVER, SILVER_DIM,
} from "./componentes/ui";

const CLUBE = "Clube de Desbravadores Estrela Maior";

const ROTULOS = {
  diretoria: "Diretoria Executiva",
  conselheiro: "conselheiro",
  secretario: "secretário",
  desbravador: "consulta",
};

export default function App() {
  const [sessao, setSessao] = useState(undefined); // undefined = ainda verificando
  const [perfil, setPerfil] = useState(null);
  const [unidades, setUnidades] = useState(null);
  const [unidadeAberta, setUnidadeAberta] = useState(null);
  const [erro, setErro] = useState("");

  /* ------------------------------------------------------------ sessão --- */

  useEffect(() => {
    if (!supabaseConfigurado) return;
    supabase.auth.getSession().then(({ data }) => setSessao(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSessao(s ?? null);
      if (!s) {
        setPerfil(null);
        setUnidades(null);
        setUnidadeAberta(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const carregarUnidades = useCallback(async () => {
    setUnidades(await listarUnidades());
  }, []);

  useEffect(() => {
    if (!sessao) return;
    let vivo = true;
    (async () => {
      try {
        setErro("");
        const p = await meuPerfil();
        if (!vivo) return;
        setPerfil(p);
        if (p && p.papel !== "pendente") await carregarUnidades();
      } catch (e) {
        if (vivo) setErro(e.message);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [sessao, carregarUnidades]);

  /* ------------------------------------------------------------- telas --- */

  if (!supabaseConfigurado)
    return (
      <Tela>
        <div className="pt-10">
          <div className="flex justify-center mb-6">
            <Brasao size={190} />
          </div>
          <Cartao>
            <Titulo sub="O sistema ainda não sabe onde ficam os dados.">Falta configurar</Titulo>
            <p className="text-xs leading-relaxed mb-3" style={{ color: SILVER }}>
              Crie o arquivo <strong>.env</strong> na raiz do projeto, a partir do{" "}
              <strong>.env.example</strong>, com o endereço e a chave pública do seu projeto no
              Supabase. Depois reinicie o servidor.
            </p>
            <p className="text-[11px]" style={{ color: SILVER_DIM }}>
              No GitHub Pages, as mesmas duas variáveis entram como segredos do repositório.
              O README explica o passo a passo.
            </p>
          </Cartao>
        </div>
      </Tela>
    );

  if (sessao === undefined)
    return (
      <Tela>
        <div className="pt-20 text-center">
          <Carregando />
        </div>
      </Tela>
    );

  if (!sessao)
    return (
      <Tela>
        <Login />
      </Tela>
    );

  if (erro)
    return (
      <Tela>
        <div className="pt-10">
          <Aviso>{erro}</Aviso>
          <Botao tipo="fantasma" onClick={sair}>Sair</Botao>
        </div>
      </Tela>
    );

  if (!perfil)
    return (
      <Tela>
        <div className="pt-20 text-center">
          <Carregando texto="Carregando seu acesso…" />
        </div>
      </Tela>
    );

  if (perfil.papel === "pendente")
    return (
      <Tela>
        <div className="pt-10">
          <div className="flex justify-center mb-6">
            <Brasao size={180} />
          </div>
          <Cartao>
            <Titulo sub={perfil.email}>Quase lá, {primeiroNome(perfil.nome)}</Titulo>
            <p className="text-xs leading-relaxed mb-4" style={{ color: SILVER }}>
              Sua conta foi criada. Agora a Diretoria Executiva precisa vincular você a uma
              unidade e definir se você vai lançar a pontuação ou apenas acompanhar. Assim que
              isso for feito, é só entrar de novo.
            </p>
            <Botao tipo="fantasma" onClick={sair}>Sair</Botao>
          </Cartao>
        </div>
      </Tela>
    );

  if (!unidades)
    return (
      <Tela>
        <div className="pt-20 text-center">
          <Carregando texto="Carregando as unidades…" />
        </div>
      </Tela>
    );

  /* ---------------------------------------------------------- diretoria --- */

  if (perfil.papel === "diretoria") {
    if (unidadeAberta) {
      const u = unidades.find((x) => x.id === unidadeAberta);
      if (u)
        return (
          <Tela larga>
            <Unidade
              unidade={u}
              clube={CLUBE}
              podeEditar
              rotulo={ROTULOS.diretoria}
              onSair={() => setUnidadeAberta(null)}
            />
          </Tela>
        );
    }
    return (
      <Tela larga>
        <Diretoria
          clube={CLUBE}
          unidades={unidades}
          recarregarUnidades={carregarUnidades}
          onSair={sair}
          onAbrirUnidade={setUnidadeAberta}
        />
      </Tela>
    );
  }

  /* ------------------------------------------------------------ unidade --- */

  const minha = unidades.find((u) => u.id === perfil.unidade_id);

  if (!minha)
    return (
      <Tela>
        <div className="pt-10">
          <div className="flex justify-center mb-6">
            <Brasao size={180} />
          </div>
          <Cartao>
            <Titulo>Sem unidade vinculada</Titulo>
            <p className="text-xs leading-relaxed mb-4" style={{ color: SILVER }}>
              Seu acesso está liberado, mas ninguém definiu ainda em qual unidade você está.
              Peça à Diretoria Executiva para fazer o vínculo na tela Pessoas.
            </p>
            <Botao tipo="fantasma" onClick={sair}>Sair</Botao>
          </Cartao>
        </div>
      </Tela>
    );

  return (
    <Tela larga>
      <Unidade
        unidade={minha}
        clube={CLUBE}
        podeEditar={perfil.papel === "conselheiro" || perfil.papel === "secretario"}
        rotulo={ROTULOS[perfil.papel]}
        onSair={sair}
      />
    </Tela>
  );
}

function primeiroNome(nome = "") {
  return nome.trim().split(" ")[0] || "desbravador";
}
