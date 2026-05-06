// ============================================
// CONFIGURAÇÕES
// ============================================
const TEMPO_FOCO  = 25 * 60  // 25 minutos em segundos
const TEMPO_PAUSA = 5  * 60  //  5 minutos em segundos

// ============================================
// ELEMENTOS DA TELA
// ============================================
const elMinutos       = document.getElementById('minutos')
const elSegundos      = document.getElementById('segundos')
const elContagem      = document.getElementById('contagem')
const elHistorico     = document.getElementById('lista-historico')
const btnIniciar      = document.getElementById('btn-iniciar')
const btnResetar      = document.getElementById('btn-resetar')
const abas            = document.querySelectorAll('.tab')

// ============================================
// ESTADO DO TIMER
// ============================================
let intervalo   = null   // guarda o setInterval
let emExecucao  = false  // está rodando?
let modoAtual   = 'foco' // 'foco' ou 'pausa'
let tempoRestante = TEMPO_FOCO

// ============================================
// CARREGAR DADOS SALVOS
// ============================================
let sessoesHoje = Number(localStorage.getItem('sessoes') || 0)
let historico   = JSON.parse(localStorage.getItem('historico') || '[]')

elContagem.textContent = sessoesHoje
renderizarHistorico()

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

// Atualiza os números na tela
function atualizarTela() {
  const min = Math.floor(tempoRestante / 60)
  const seg = tempoRestante % 60
  elMinutos.textContent = String(min).padStart(2, '0')
  elSegundos.textContent = String(seg).padStart(2, '0')
  document.title = `${elMinutos.textContent}:${elSegundos.textContent} — Pomodoro`
}

// Inicia ou pausa o timer
function iniciarPausar() {
  if (emExecucao) {
    clearInterval(intervalo)
    emExecucao = false
    btnIniciar.textContent = 'Continuar'
    return
  }

  emExecucao = true
  btnIniciar.textContent = 'Pausar'

  intervalo = setInterval(() => {
    tempoRestante--
    atualizarTela()

    if (tempoRestante <= 0) {
      clearInterval(intervalo)
      emExecucao = false
      cicloCompleto()
    }
  }, 1000)
}

// Reseta o timer para o modo atual
function resetar() {
  clearInterval(intervalo)
  emExecucao = false
  btnIniciar.textContent = 'Iniciar'
  tempoRestante = modoAtual === 'foco' ? TEMPO_FOCO : TEMPO_PAUSA
  atualizarTela()
}

// Chamada quando o tempo acaba
function cicloCompleto() {
  tocarSom()
  btnIniciar.textContent = 'Iniciar'

  if (modoAtual === 'foco') {
    // Registra a sessão
    sessoesHoje++
    localStorage.setItem('sessoes', sessoesHoje)
    elContagem.textContent = sessoesHoje

    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const registro = `Sessão de foco — ${agora}`
    historico.unshift(registro)
    localStorage.setItem('historico', JSON.stringify(historico))
    renderizarHistorico()

    // Muda para pausa automaticamente
    mudarModo('pausa')
  } else {
    // Volta para foco
    mudarModo('foco')
  }
}

// Muda entre foco e pausa
function mudarModo(modo) {
  modoAtual = modo
  tempoRestante = modo === 'foco' ? TEMPO_FOCO : TEMPO_PAUSA

  abas.forEach(aba => {
    aba.classList.toggle('active', aba.dataset.mode === modo)
  })

  atualizarTela()
}

// Toca um beep simples ao fim do ciclo
function tocarSom() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const oscilador = ctx.createOscillator()
  const ganho = ctx.createGain()

  oscilador.connect(ganho)
  ganho.connect(ctx.destination)

  oscilador.type = 'sine'
  oscilador.frequency.setValueAtTime(880, ctx.currentTime)
  ganho.gain.setValueAtTime(0.5, ctx.currentTime)
  ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)

  oscilador.start(ctx.currentTime)
  oscilador.stop(ctx.currentTime + 1.5)
}

// Renderiza o histórico na tela
function renderizarHistorico() {
  elHistorico.innerHTML = ''

  if (historico.length === 0) {
    elHistorico.innerHTML = '<li>Nenhuma sessão ainda.</li>'
    return
  }

  historico.slice(0, 10).forEach(item => {
    const li = document.createElement('li')
    li.textContent = item
    elHistorico.appendChild(li)
  })
}

// ============================================
// EVENTOS
// ============================================
btnIniciar.addEventListener('click', iniciarPausar)
btnResetar.addEventListener('click', resetar)

abas.forEach(aba => {
  aba.addEventListener('click', () => {
    if (emExecucao) return // ignora clique se estiver rodando
    mudarModo(aba.dataset.mode)
  })
})

// Inicializa a tela
atualizarTela()