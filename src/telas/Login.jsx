import React, { useState } from "react";
import { entrar, criarConta } from "../lib/api";
import {
  Brasao, Cartao, Campo, Botao, Aviso, GOLD, SILVER_DIM,
} from "../componentes/ui";

export default function Login() {
  const [modo, setModo] = useState("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const enviar = async () => {
    setErro("");
    setAviso("");
    if (!email.trim() || !senha) return setErro("Preencha o e-mail e a senha.");
    if (modo === "criar" && !nome.trim()) return setErro("Diga seu nome completo.");
    if (modo === "criar" && senha.length < 8)
      return setErro("Use uma senha com pelo menos 8 caracteres.");
    setOcupado(true);
    try {
      if (modo === "entrar") {
        await entrar(email, senha);
      } else {
        await criarConta(nome, email, senha);
        setAviso(
          "Conta criada. Se o Supabase estiver pedindo confirmação, verifique seu e-mail. " +
            "Depois disso, a diretoria libera seu acesso à unidade."
        );
        setModo("entrar");
      }
    } catch (e) {
      setErro(traduz(e.message));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="pt-8">
      <div className="flex justify-center mb-5">
        <Brasao size={210} />
      </div>
      <p
        className="text-center text-[11px] uppercase tracking-[0.25em] mb-8"
        style={{ color: GOLD }}
      >
        Avaliação de unidade
      </p>

      <Cartao>
        <div className="space-y-4">
          {erro && <Aviso>{erro}</Aviso>}
          {aviso && <Aviso tipo="info">{aviso}</Aviso>}

          {modo === "criar" && (
            <Campo
              label="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
          )}
          <Campo
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Campo
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          />

          <Botao onClick={enviar} full disabled={ocupado}>
            {ocupado ? "Um momento…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Botao>

          <button
            type="button"
            onClick={() => {
              setModo(modo === "entrar" ? "criar" : "entrar");
              setErro("");
              setAviso("");
            }}
            className="w-full text-xs underline"
            style={{ color: SILVER_DIM }}
          >
            {modo === "entrar"
              ? "Ainda não tenho conta"
              : "Já tenho conta, quero entrar"}
          </button>
        </div>
      </Cartao>
    </div>
  );
}

function traduz(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha não conferem.";
  if (m.includes("already registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (m.includes("email not confirmed"))
    return "Confirme o e-mail pelo link que o Supabase enviou antes de entrar.";
  if (m.includes("password")) return "A senha precisa ter pelo menos 8 caracteres.";
  return msg || "Algo deu errado. Tente de novo.";
}
