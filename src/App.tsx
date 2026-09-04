import { useEffect, useRef, useState } from 'react'
import type { Perfil } from './lib/types'
import { hoje, paraData } from './lib/dates'
import {
  atualizarDaNuvem, avisosDe, conectarNuvem, conferirAvisoDoPapai, listaDe, naoLidos, useEstado,
  useSincronizacao,
} from './lib/store'
import { ligadaPeloLink } from './lib/nuvem'
import { resumoConexao } from './lib/conexao'
import { avisosANotificar, mostrarNoCelular } from './lib/avisos-do-celular'
import { EscalaView } from './views/EscalaView'
import { KellyView } from './views/KellyView'
import { AnneView } from './views/AnneView'
import { AjustesView } from './views/AjustesView'
import { Modal } from './components/Modal'
import { FaixaAtualizar, useAtualizarPuxando } from './components/Atualizar'

type Aba = 'escala' | 'kelly' | 'anne' | 'ajustes'

const CHAVE_PERFIL = 'listinha-da-anne/perfil'

interface PropsApp {
  /**
   * Quando informado, o app abre travado nesse perfil e some o botao de troca.
   * E' o que diferencia os links /anne/ e /kelly/ do endereco completo.
   */
  perfilFixo?: Perfil
}

/**
 * Aviso curto no topo quando a sincronizacao nao esta boa. Sem isso, uma falha
 * ficava invisivel: o app parecia certo e nada chegava no outro celular -- e o
 * pior caso, aparelho sem configuracao nenhuma, nao dizia nada em lugar nenhum.
 * So' aparece quando ha' o que fazer: erro ou aparelho ainda nao ligado.
 * "Conectando" nao entra aqui, senao o aviso vira paisagem.
 */
function AvisoDeNuvem({ perfil }: { perfil: Perfil }) {
  const sinc = useSincronizacao()
  const resumo = resumoConexao({ ...sinc, agora: Date.now() }, perfil)
  if (resumo.tom !== 'erro' && !(resumo.tom === 'atencao' && !sinc.configurada)) return null
  return (
    <div className="sub" style={{ fontWeight: 800 }}>
      {sinc.configurada
        ? (perfil === 'kelly' ? '⚠️ Sincronização com erro — veja em Ajustes' : '⚠️ Sem conexão com o celular da mamãe')
        : (perfil === 'kelly' ? '🔌 Sincronização desligada — ligue em Ajustes' : '🔌 Este celular ainda não está ligado no da mamãe')}
    </div>
  )
}

export function App({ perfilFixo }: PropsApp) {
  const estado = useEstado()
  const [perfil, setPerfil] = useState<Perfil>(
    () => perfilFixo ?? (localStorage.getItem(CHAVE_PERFIL) as Perfil) ?? 'anne',
  )
  const [aba, setAba] = useState<Aba>(perfilFixo === 'kelly' ? 'kelly' : 'anne')
  const [pedindoPin, setPedindoPin] = useState(false)
  const [liberado, setLiberado] = useState(false)
  const inicio = paraData(hoje())
  const [ano, setAno] = useState(inicio.getFullYear())
  const [mes, setMes] = useState(inicio.getMonth())
  const [dia, setDia] = useState(hoje())
  const [avisoDoLink, setAvisoDoLink] = useState(() => ligadaPeloLink())
  const sinc = useSincronizacao()
  // "Sincronizacao ligada!" junto de "nao consigo falar com o outro celular"
  // sao dois recados que se contradizem; nesse caso vale o que informa o erro.
  const conexaoComErro = resumoConexao({ ...sinc, agora: Date.now() }, perfil).tom === 'erro'
  const { puxa, rodando } = useAtualizarPuxando(atualizarDaNuvem)

  useEffect(() => { conectarNuvem() }, [])
  // Escala mudou (na mao ou vinda da nuvem)? Confere o aviso do papai: cria o de
  // hoje e apaga o que a mudanca da escala deixou mentindo.
  // O visibilitychange cobre o celular que fica com o app aberto e vira o dia.
  useEffect(() => {
    const conferir = () => { if (!document.hidden) conferirAvisoDoPapai() }
    conferir()
    document.addEventListener('visibilitychange', conferir)
    return () => document.removeEventListener('visibilitychange', conferir)
  }, [estado.escala])
  useEffect(() => { if (!perfilFixo) localStorage.setItem(CHAVE_PERFIL, perfil) }, [perfil, perfilFixo])
  useEffect(() => { setAba(perfil === 'kelly' ? 'kelly' : 'anne') }, [perfil])

  useAvisoDoCelular(perfil)

  const trocarPerfil = (p: Perfil) => {
    if (p === 'kelly' && estado.config.pinKelly) { setPedindoPin(true); return }
    setPerfil(p)
  }

  const mudarMes = (a: number, m: number) => { setAno(a); setMes(m) }
  const mudarDia = (d: string) => {
    setDia(d)
    const data = paraData(d)
    setAno(data.getFullYear())
    setMes(data.getMonth())
  }

  const listaHoje = listaDe(estado, hoje())
  const novidadeAnne = Boolean(listaHoje.enviadaEm && !listaHoje.vistaEm)

  const abas: Array<{ id: Aba; emoji: string; nome: string; badge?: number }> =
    perfil === 'kelly'
      ? [
        { id: 'escala', emoji: '📅', nome: 'Escala' },
        { id: 'kelly', emoji: '💜', nome: 'Mamãe', badge: naoLidos(estado, 'kelly') },
        ...(perfilFixo ? [] : [{ id: 'anne' as Aba, emoji: '🌟', nome: 'Anne' }]),
        { id: 'ajustes', emoji: '⚙️', nome: 'Ajustes' },
      ]
      : [
        { id: 'anne', emoji: '🌟', nome: 'Minha listinha', badge: novidadeAnne ? 1 : naoLidos(estado, 'anne') },
        { id: 'escala', emoji: '📅', nome: 'Papai' },
      ]

  // O link /kelly/ pede o PIN na abertura, quando houver PIN cadastrado.
  if (perfilFixo === 'kelly' && estado.config.pinKelly && !liberado) {
    return (
      <div className="app">
        <header className="topo">
          <div className="topo-linha">
            <span style={{ fontSize: 26 }}>💜</span>
            <div style={{ flex: 1 }}><h1>Listinha — Mamãe</h1></div>
          </div>
        </header>
        <main className="conteudo">
          <div className="cartao">
            <h2>🔒 Digite seu PIN</h2>
            <p className="ajuda">Os 4 números que você cadastrou em Ajustes.</p>
            <TecladoPin esperado={estado.config.pinKelly} aoAcertar={() => setLiberado(true)} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topo">
        <div className="topo-linha">
          <span style={{ fontSize: 26 }}>📝</span>
          <div style={{ flex: 1 }}>
            <h1>{perfilFixo === 'kelly' ? 'Listinha — Mamãe' : 'Listinha da Anne'}</h1>
            <div className="sub">
              {perfil === 'kelly' ? 'Modo mamãe' : 'Oi, Anne! 💜'}
            </div>
            <AvisoDeNuvem perfil={perfil} />
          </div>
          {!perfilFixo && (
            <div className="perfil-troca">
              <button aria-pressed={perfil === 'anne'} onClick={() => trocarPerfil('anne')}>Anne</button>
              <button aria-pressed={perfil === 'kelly'} onClick={() => trocarPerfil('kelly')}>Mamãe</button>
            </div>
          )}
        </div>
      </header>

      <nav className="abas" role="tablist">
        {abas.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
          >
            <span className="emoji">{a.emoji}</span>
            {a.nome}
            {!!a.badge && a.badge > 0 && aba !== a.id && <span className="bolinha">{a.badge}</span>}
          </button>
        ))}
      </nav>

      <main className="conteudo">
        <FaixaAtualizar puxa={puxa} rodando={rodando} />

        {avisoDoLink && !conexaoComErro && (
          <div className="cartao">
            <h2>☁️ Sincronização ligada!</h2>
            <p className="ajuda">
              Este aparelho agora conversa com o da mamãe. O que ela montar aparece aqui.
            </p>
            <button className="btn primario" onClick={() => setAvisoDoLink(false)}>Entendi 💜</button>
          </div>
        )}

        {aba === 'escala' && (
          <EscalaView estado={estado} perfil={perfil} ano={ano} mes={mes} aoMudarMes={mudarMes} />
        )}
        {aba === 'kelly' && perfil === 'kelly' && (
          <KellyView estado={estado} ano={ano} mes={mes} aoMudarMes={mudarMes} dia={dia} aoMudarDia={mudarDia} />
        )}
        {aba === 'anne' && (
          <AnneView estado={estado} dia={dia} />
        )}
        {aba === 'ajustes' && perfil === 'kelly' && <AjustesView estado={estado} />}
      </main>

      {pedindoPin && (
        <PedirPin
          esperado={estado.config.pinKelly!}
          aoAcertar={() => { setPedindoPin(false); setPerfil('kelly') }}
          aoFechar={() => setPedindoPin(false)}
        />
      )}
    </div>
  )
}

function TecladoPin({ esperado, aoAcertar }: { esperado: string; aoAcertar: () => void }) {
  const [valor, setValor] = useState('')
  const errou = valor.length === 4 && valor !== esperado

  useEffect(() => { if (valor === esperado) aoAcertar() }, [valor, esperado, aoAcertar])

  return (
    <>
      <input
        className="campo"
        style={{ fontSize: 26, textAlign: 'center', letterSpacing: 8 }}
        inputMode="numeric"
        maxLength={4}
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value.replace(/\D/g, '').slice(0, 4))}
        aria-label="PIN de 4 números"
      />
      {errou && <div className="alerta-leitura" style={{ marginTop: 10 }}>PIN errado, tente de novo.</div>}
    </>
  )
}

function PedirPin({ esperado, aoAcertar, aoFechar }: {
  esperado: string
  aoAcertar: () => void
  aoFechar: () => void
}) {
  return (
    <Modal titulo="Senha da mamãe" aoFechar={aoFechar}>
      <p className="ajuda">Digite o PIN de 4 números.</p>
      <TecladoPin esperado={esperado} aoAcertar={aoAcertar} />
    </Modal>
  )
}

/**
 * Dispara a notificação do sistema quando chega um aviso novo para o perfil aberto.
 *
 * A conta é por **id já conhecido**, nunca por horário: o `em` do aviso foi
 * carimbado pelo relógio do outro celular, e um relógio atrasado fazia o aviso
 * recém-chegado parecer velho — ninguém era avisado de nada.
 */
function useAvisoDoCelular(perfil: Perfil) {
  const estado = useEstado()
  const conhecidos = useRef<Set<string> | null>(null)
  const perfilAnterior = useRef<Perfil>(perfil)

  useEffect(() => {
    const meus = avisosDe(estado, perfil)
    // Primeira passada (e troca de perfil): o que já estava aqui não vira aviso.
    if (conhecidos.current === null || perfilAnterior.current !== perfil) {
      perfilAnterior.current = perfil
      conhecidos.current = new Set(meus.map((a) => a.id))
      return
    }
    const novos = avisosANotificar(meus, conhecidos.current)
    for (const a of meus) conhecidos.current.add(a.id)
    for (const a of novos) void mostrarNoCelular(a)
  }, [estado, perfil])
}
