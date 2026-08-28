import { useEffect, useRef, useState } from 'react'
import type { Perfil } from './lib/types'
import { hoje, paraData } from './lib/dates'
import { avisosDe, conectarNuvem, listaDe, naoLidos, useEstado } from './lib/store'
import { EscalaView } from './views/EscalaView'
import { KellyView } from './views/KellyView'
import { AnneView } from './views/AnneView'
import { AjustesView } from './views/AjustesView'
import { Modal } from './components/Modal'

type Aba = 'escala' | 'kelly' | 'anne' | 'ajustes'

const CHAVE_PERFIL = 'listinha-da-anne/perfil'

interface PropsApp {
  /**
   * Quando informado, o app abre travado nesse perfil e some o botao de troca.
   * E' o que diferencia os links /anne/ e /kelly/ do endereco completo.
   */
  perfilFixo?: Perfil
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

  useEffect(() => { conectarNuvem() }, [])
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
        {aba === 'escala' && (
          <EscalaView estado={estado} perfil={perfil} ano={ano} mes={mes} aoMudarMes={mudarMes} />
        )}
        {aba === 'kelly' && perfil === 'kelly' && (
          <KellyView estado={estado} ano={ano} mes={mes} aoMudarMes={mudarMes} dia={dia} aoMudarDia={mudarDia} />
        )}
        {aba === 'anne' && (
          <AnneView estado={estado} ano={ano} mes={mes} aoMudarMes={mudarMes} dia={dia} aoMudarDia={mudarDia} />
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
      {errou && <div className="alerta-leitura" style={{ marginTop: 10 }}>PIN errado, tenta de novo.</div>}
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

/** Dispara a notificação do sistema quando chega um aviso novo para o perfil aberto. */
function useAvisoDoCelular(perfil: Perfil) {
  const estado = useEstado()
  const visto = useRef<string | null>(null)
  const montado = useRef(Date.now())

  useEffect(() => {
    const meus = avisosDe(estado, perfil)
    const ultimo = meus[0]
    if (!ultimo || ultimo.id === visto.current) return
    const primeiraVez = visto.current === null
    visto.current = ultimo.id
    if (primeiraVez || ultimo.em < montado.current) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    try {
      new Notification(ultimo.titulo, { body: ultimo.texto, tag: ultimo.id })
    } catch { /* alguns navegadores exigem service worker */ }
  }, [estado, perfil])
}
