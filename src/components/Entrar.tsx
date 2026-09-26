'use client';

import { useEffect, useState } from 'react';
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { ErroApi, api } from '@/lib/cliente';

type Aviso = { texto: string; tipo: '' | 'erro' | 'ok' } | null;

function explicar(e: unknown): string {
  if (e instanceof ErroApi) return e.message;
  const nome = (e as { name?: string })?.name;
  if (nome === 'NotAllowedError') return 'Cancelado ou sem resposta do aparelho. Tente de novo.';
  if (nome === 'InvalidStateError') return 'Este aparelho já tem uma chave da Torre. Use "Entrar".';
  if (nome === 'SecurityError') return 'O endereço não bate com o TORRE_HOST configurado.';
  return (e as Error)?.message || 'Não deu certo. Tente de novo.';
}

/** Tela pública: entrar com a passkey do aparelho, ou cadastrar a passkey com código. */
export default function Entrar() {
  const [suporta, setSuporta] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [avisoLogin, setAvisoLogin] = useState<Aviso>(null);
  const [avisoCad, setAvisoCad] = useState<Aviso>(null);
  const [codigo, setCodigo] = useState('');
  const [aparelho, setAparelho] = useState('');

  useEffect(() => {
    setSuporta(browserSupportsWebAuthn());
  }, []);

  async function entrar() {
    setOcupado(true);
    setAvisoLogin({ texto: 'Aguardando o aparelho…', tipo: '' });
    try {
      const opcoes = await api<Parameters<typeof startAuthentication>[0]['optionsJSON']>('GET', '/api/auth/login/opcoes');
      const resposta = await startAuthentication({ optionsJSON: opcoes });
      await api('POST', '/api/auth/login', { resposta });
      setAvisoLogin({ texto: 'Pronto. Abrindo a Torre…', tipo: 'ok' });
      window.location.assign('/');
    } catch (e) {
      setAvisoLogin({ texto: explicar(e), tipo: 'erro' });
    } finally {
      setOcupado(false);
    }
  }

  async function cadastrar(ev: React.FormEvent) {
    ev.preventDefault();
    const c = codigo.trim();
    if (!c) {
      setAvisoCad({ texto: 'Digite o código.', tipo: 'erro' });
      return;
    }
    setOcupado(true);
    setAvisoCad({ texto: 'Conferindo o código…', tipo: '' });
    try {
      const qs = new URLSearchParams({ aparelho: aparelho.trim() || 'aparelho' });
      const r = await fetch(`/api/auth/registro/opcoes?${qs}`, {
        cache: 'no-store',
        headers: { 'X-Torre-Codigo': c },
      });
      const dados = await r.json().catch(() => null);
      if (!r.ok) throw new ErroApi(r.status, (dados && dados.erro) || `erro ${r.status}`);
      setAvisoCad({ texto: 'Aguardando o aparelho criar a chave…', tipo: '' });
      const resposta = await startRegistration({ optionsJSON: dados });
      await api('POST', '/api/auth/registro', { resposta });
      setAvisoCad({ texto: 'Chave criada. Abrindo a Torre…', tipo: 'ok' });
      window.location.assign('/');
    } catch (e) {
      setAvisoCad({ texto: explicar(e), tipo: 'erro' });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="entrar">
      <h1 className="marca">Torre</h1>

      {suporta === false && (
        <p className="aviso-acesso">
          <strong>Este navegador não tem passkeys.</strong> Use um navegador atual (Safari, Chrome, Edge ou Firefox).
        </p>
      )}

      <section className="caixa" aria-labelledby="t-entrar">
        <h2 id="t-entrar">Entrar</h2>
        <p className="painel-dica">Use a chave (passkey) já cadastrada neste aparelho: digital, rosto ou PIN.</p>
        <button type="button" className="btn btn-go btn-largo" onClick={entrar} disabled={ocupado || suporta === false}>
          Entrar com a chave deste aparelho
        </button>
        {avisoLogin && (
          <p className={`pend-aviso ${avisoLogin.tipo}`} role="status" aria-live="polite">{avisoLogin.texto}</p>
        )}
      </section>

      <form className="caixa" aria-labelledby="t-cadastrar" onSubmit={cadastrar}>
        <h2 id="t-cadastrar">Cadastrar este aparelho</h2>
        <p className="painel-dica">
          Primeiro aparelho: o código de setup. Aparelho novo: o código de 6 dígitos gerado em
          &quot;Adicionar aparelho&quot; num aparelho já logado (vale 10 minutos, uma vez).
        </p>
        <div className="campo">
          <label htmlFor="codigo">Código</label>
          <input
            id="codigo" name="codigo" type="password" autoComplete="one-time-code" maxLength={200}
            value={codigo} onChange={(e) => setCodigo(e.target.value)} disabled={ocupado}
          />
        </div>
        <div className="campo">
          <label htmlFor="aparelho">Nome do aparelho</label>
          <input
            id="aparelho" name="aparelho" type="text" maxLength={60} placeholder="celular, PC…" autoComplete="off"
            value={aparelho} onChange={(e) => setAparelho(e.target.value)} disabled={ocupado}
          />
        </div>
        <button type="submit" className="btn btn-largo" disabled={ocupado || suporta === false}>
          Criar a chave deste aparelho
        </button>
        {avisoCad && (
          <p className={`pend-aviso ${avisoCad.tipo}`} role="status" aria-live="polite">{avisoCad.texto}</p>
        )}
      </form>

      <p className="rodape-entrar">Uma chave por aparelho. A chave fica no aparelho; a Torre guarda só a parte pública.</p>
    </main>
  );
}
