import { useState } from 'react'
import type { Estado } from '../lib/types'
import { alterar, exportarEstado, importarEstado, useStatusNuvem } from '../lib/store'
import { interpretarConfig, lerConfigNuvem, salvarConfigNuvem } from '../lib/nuvem'
import { GaleriaFotos } from '../components/Fotos'

const RECADO_STATUS: Record<string, string> = {
  desligado: 'Só neste aparelho',
  conectando: 'Conectando…',
  ligado: 'Sincronizado ✅',
  erro: 'Erro ao conectar',
}

export function AjustesView({ estado }: { estado: Estado }) {
  const { status, detalhe } = useStatusNuvem()
  const config = lerConfigNuvem()
  const [texto, setTexto] = useState('')
  const [familia, setFamilia] = useState(config?.familia ?? '')
  const [pin, setPin] = useState(estado.config.pinKelly ?? '')

  const baixarBackup = () => {
    const blob = new Blob([JSON.stringify(exportarEstado(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listinha-da-anne-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const restaurar = (arquivo: File) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        importarEstado(JSON.parse(String(leitor.result)))
        alert('Backup restaurado! 💜')
      } catch {
        alert('Não consegui ler esse arquivo.')
      }
    }
    leitor.readAsText(arquivo)
  }

  return (
    <>
      <div className="cartao">
        <h2>☁️ Sincronizar entre celulares</h2>
        <p className="ajuda">
          Sem isso, cada celular guarda a própria listinha. Ligando a sincronização, o que a Kelly
          monta aparece no celular da Anne — e o que a Anne conclui aparece no da Kelly.
          O passo a passo está no arquivo <b>COMO-USAR.md</b> do projeto.
        </p>

        <div className="alerta-leitura" style={{ background: status === 'ligado' ? '#dcfce7' : '#fef3c7', color: status === 'ligado' ? '#14532d' : '#92400e' }}>
          <b>{RECADO_STATUS[status]}</b>
          {config && <> • código da família: <b>{config.familia}</b></>}
          {detalhe && <div style={{ marginTop: 4, fontWeight: 600 }}>{detalhe}</div>}
        </div>

        <label className="rotulo" style={{ marginTop: 14 }} htmlFor="aj-familia">Código da família</label>
        <input
          id="aj-familia"
          className="campo"
          placeholder="ex.: anne-kelly-2026"
          value={familia}
          onChange={(e) => setFamilia(e.target.value)}
        />

        <label className="rotulo" style={{ marginTop: 10 }} htmlFor="aj-config">
          Configuração do Firebase (cole aqui)
        </label>
        <textarea
          id="aj-config"
          className="campo"
          style={{ minHeight: 110, fontSize: 13 }}
          placeholder={'{\n  "apiKey": "…",\n  "databaseURL": "https://….firebaseio.com",\n  "projectId": "…"\n}'}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <div className="linha" style={{ gap: 8, marginTop: 10 }}>
          <button
            className="btn primario"
            style={{ flex: 1 }}
            onClick={() => {
              const c = interpretarConfig(texto, familia)
              if (!c) { alert('Não achei apiKey e databaseURL nesse texto.'); return }
              salvarConfigNuvem(c)
              alert('Configuração salva! O app vai recarregar para conectar.')
              location.reload()
            }}
          >
            Ligar sincronização
          </button>
          {config && (
            <button
              className="btn perigo"
              onClick={() => {
                if (!confirm('Desligar a sincronização neste aparelho?')) return
                salvarConfigNuvem(null)
                location.reload()
              }}
            >
              Desligar
            </button>
          )}
        </div>
      </div>

      <div className="cartao">
        <h2>📸 Fotos do app da Anne</h2>
        <GaleriaFotos />
      </div>

      <div className="cartao">
        <h2>🔒 Senha da aba da mamãe</h2>
        <p className="ajuda">
          Um PIN de 4 números para a Anne não conseguir conferir as próprias tarefas.
          Deixe em branco para não pedir senha.
        </p>
        <div className="linha" style={{ gap: 8 }}>
          <input
            className="campo"
            style={{ flex: 1 }}
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <button
            className="btn primario"
            onClick={() => {
              alterar((e) => { e.config.pinKelly = pin.length === 4 ? pin : null })
              alert(pin.length === 4 ? 'PIN salvo!' : 'PIN removido.')
            }}
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="cartao">
        <h2>💾 Backup</h2>
        <p className="ajuda">Guarde uma cópia de tudo (escala, listas, cofrinho) num arquivo.</p>
        <div className="linha" style={{ gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={baixarBackup}>Baixar backup</button>
          <label className="btn contorno" style={{ flex: 1, textAlign: 'center' }}>
            Restaurar
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) restaurar(f) }}
            />
          </label>
        </div>
      </div>

      <div className="cartao">
        <h2>🔔 Avisos do celular</h2>
        <p className="ajuda">
          Com a permissão ligada, o celular avisa quando a Anne concluir uma tarefa
          (e quando a mamãe mandar listinha nova), desde que o app esteja aberto ou em segundo plano.
        </p>
        <button
          className="btn grande"
          onClick={() => {
            if (!('Notification' in window)) { alert('Esse aparelho não suporta avisos.'); return }
            void Notification.requestPermission().then((p) => {
              alert(p === 'granted' ? 'Avisos ligados! 🔔' : 'Avisos não foram permitidos.')
            })
          }}
        >
          Permitir avisos
        </button>
      </div>
    </>
  )
}
