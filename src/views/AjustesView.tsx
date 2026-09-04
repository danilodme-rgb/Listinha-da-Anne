import { useState } from 'react'
import type { Estado } from '../lib/types'
import { alterar, exportarEstado, importarEstado, useSincronizacao } from '../lib/store'
import {
  familiaMudou, interpretarConfig, lerConfigNuvem, linkDeSincronizacao, normalizarFamilia,
  salvarConfigNuvem,
} from '../lib/nuvem'
import { traduzirErroNuvem } from '../lib/conexao'
import { GaleriaFotos } from '../components/Fotos'
import { CartaoAvisosDoCelular } from '../components/AvisosDoCelular'
import { procurarAtualizacao, versaoDoApp } from '../lib/atualizacao'

const RECADO_STATUS: Record<string, string> = {
  desligado: 'Só neste aparelho',
  conectando: 'Conectando…',
  ligado: 'Sincronizado ✅',
  erro: 'Erro ao conectar',
}

export function AjustesView({ estado }: { estado: Estado }) {
  const { status, detalhe } = useSincronizacao()
  const config = lerConfigNuvem()
  const [texto, setTexto] = useState('')
  const [familia, setFamilia] = useState(config?.familia ?? '')
  const [pin, setPin] = useState(estado.config.pinKelly ?? '')
  const [link, setLink] = useState('')
  const [procurando, setProcurando] = useState(false)

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
          {detalhe && <div style={{ marginTop: 4, fontWeight: 600 }}>{traduzirErroNuvem(detalhe)}</div>}
        </div>

        <label className="rotulo" style={{ marginTop: 14 }} htmlFor="aj-familia">Código da família</label>
        <input
          id="aj-familia"
          className="campo"
          placeholder="ex.: anne-kelly-2026"
          value={familia}
          onChange={(e) => setFamilia(e.target.value)}
        />
        <p className="ajuda" style={{ marginTop: 6 }}>
          {familiaMudou(familia)
            ? <>Só letras, números e hífen — vou salvar como <b>{normalizarFamilia(familia)}</b>.</>
            : 'Só letras, números e hífen. Os dois celulares precisam usar exatamente o mesmo código.'}
        </p>

        {config && (
          <p className="ajuda" style={{ marginTop: 12 }}>
            ✅ Já tem configuração guardada neste aparelho — projeto <b>{config.projectId || '—'}</b>,
            banco <b>{config.databaseURL.replace(/^https?:\/\//, '')}</b>.
            O campo abaixo aparece vazio de propósito: o app não mostra o que já guardou.
            Só preencha se for trocar de projeto.
          </p>
        )}

        <label className="rotulo" style={{ marginTop: 10 }} htmlFor="aj-config">
          Configuração do Firebase {config ? '(só para trocar de projeto)' : '(cole aqui)'}
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
              const c = texto.trim()
                ? interpretarConfig(texto, familia)
                : config && { ...config, familia: familia.trim() ? normalizarFamilia(familia) : config.familia }
              if (!c) {
                alert(config
                  ? 'Não achei apiKey e databaseURL neste texto.'
                  : 'Cole a configuração do Firebase primeiro.')
                return
              }
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

      {config && (
        <div className="cartao">
          <h2>📲 Ligar no celular da Anne</h2>
          <p className="ajuda">
            O app da Anne não tem Ajustes de propósito. Gere o link abaixo e mande para o celular
            dela (WhatsApp serve). Abrindo o link uma vez, o aparelho dela já fica sincronizado.
          </p>
          <button
            className="btn grande"
            onClick={() => setLink(linkDeSincronizacao(config, `${location.origin}${import.meta.env.BASE_URL}anne/`))}
          >
            Gerar link de sincronização
          </button>
          {link && (
            <>
              <textarea className="campo" style={{ minHeight: 84, fontSize: 12, marginTop: 10 }} readOnly value={link} />
              <div className="linha" style={{ gap: 8, marginTop: 8 }}>
                <button
                  className="btn primario"
                  style={{ flex: 1 }}
                  onClick={() => {
                    void navigator.clipboard?.writeText(link)
                      .then(() => alert('Link copiado! Mande para o celular da Anne. 💜'))
                      .catch(() => alert('Não consegui copiar. Selecione o texto e copie na mão.'))
                  }}
                >
                  Copiar link
                </button>
                <button className="btn" onClick={() => setLink('')}>Esconder</button>
              </div>
              <p className="ajuda" style={{ marginTop: 8 }}>
                ⚠️ Esse link carrega a chave do seu Firebase. Mande só para os celulares da família.
              </p>
            </>
          )}
        </div>
      )}

      <div className="cartao">
        <h2>📸 Fotos do app da Anne</h2>
        <GaleriaFotos />
      </div>

      <div className="cartao">
        <h2>🔒 Senha da aba da mamãe</h2>
        <p className="ajuda">
          Um PIN de 4 números para a Anne não conseguir conferir as próprias tarefas.
          Deixe em branco para não pedir senha. Com a sincronização ligada, o PIN vale
          em todos os aparelhos — pode levar alguns segundos para chegar no outro.
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

      <CartaoAvisosDoCelular perfil="kelly" />
      <div className="cartao">
        <h2>📦 Versão do app</h2>
        <p className="ajuda">
          Os dois apps se atualizam sozinhos: quando sai novidade, o celular troca de versão
          e a tela recarrega na hora seguinte em que o app estiver aberto. Não precisa
          desinstalar nem reinstalar nada.
        </p>
        <div className="linha" style={{ gap: 8 }}>
          <code style={{ flex: 1, fontSize: 13, color: 'var(--tinta-fraca)' }}>{versaoDoApp()}</code>
          <button
            className="btn"
            disabled={procurando}
            onClick={() => {
              setProcurando(true)
              void procurarAtualizacao()
                .then((r) => {
                  if (r === 'nova') return // a tela ja' vai recarregar sozinha
                  alert(r === 'atual'
                    ? 'Tudo certo: você já está com a versão mais nova. ✅'
                    : 'Este endereço não guarda versão instalada — é sempre a mais nova.')
                })
                .catch(() => alert('Não deu para procurar agora. Confira a internet e tente de novo.'))
                .finally(() => setProcurando(false))
            }}
          >
            {procurando ? 'Procurando…' : 'Procurar novidade'}
          </button>
        </div>
      </div>
    </>
  )
}
