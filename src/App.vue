<!--
Centro de Investigación en Computación
Instituto Politécnico Nacional
Autor: Kevin Acosta
Ejercicio: Máquinas de Turing
-->
<script setup lang="ts">

import { ref, type Ref, onMounted, onUnmounted, computed } from 'vue';
import { tmParser } from './composables/tmParser.ts';

import { basicSetup, EditorView } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import type { ComputationSummaryStep, TuringMachine } from './model/interfaces';

import Swal from 'sweetalert2'

import CompResult from './components/CompResult.vue';

const { parse: tmParse } = tmParser();

let tmDef: TuringMachine | undefined;

// Máquina
const blankChar = ref('\u200B')
const tape: Ref<string[]> = ref([])
const state = ref('0')
const tapeHead = ref(0);
const status: Ref<'Accepted' | 'Rejected' | 'Unknown' | undefined> = ref(undefined)
const stepCount = ref(0)

const compBreakdown: Ref<ComputationSummaryStep[]> = ref([])

//controles
const tapeInputTxt = ref('')

const autoPlay = ref(false)
const autoPlaySpeed = ref(0);
let autoPlayDelay = 1000
const autoPlayDisplay = computed(() => {
  return Math.exp(autoPlaySpeed.value).toFixed(2)
})

//menú
const menuTab: Ref<'code' | 'settings'> = ref('code')

//code mirror
let view: EditorView | null;

const parseFile = () => {
  let tmTemp = tmParse(view?.state.doc.toString() ?? '')
  if((tmTemp as TuringMachine).transitionRules != undefined) {
    tmDef = tmTemp as TuringMachine
    Swal.fire({
      theme: 'dark',
      icon: 'success',
      title: `Máquina cargada.`,
      text: `${tmDef.transitionRules.length} reglas. Acepta en: [${tmDef.acceptStates.join(',')}]`
    })
  }
  else {
    Swal.fire({
    theme: 'dark',
    icon: 'error',
    title: 'Interpretación fallida',
    text: tmTemp as string
  })
  }
  //console.log(tmDef?.acceptStates)
  //console.table(tmDef?.transitionRules)
  fullReset()
}


let timeoutId = -1
const execLoop = () => {
  execStep()
  if(status.value == undefined)
    timeoutId = setTimeout(execLoop, autoPlayDelay)
}

const resetTapeHead = () => {
  stepCount.value = 0
  status.value = undefined
  state.value = '0'

  tapeHead.value = 1

  compBreakdown.value = [ {
    state: state.value,
    cells: tape.value.map((c, idx) => {
    return {
      state: state.value,
      symbol: c == blankChar.value ? 'B' : c,
      tapeHere: idx == tapeHead.value,
      isBlank: c == blankChar.value
    }
  })} ]
}

const loadTapeInput = (input: string, resetHead = false) => {
  if(input == '') input = blankChar.value
  let tapeString = blankChar.value + input + blankChar.value
  tape.value = []
  for(let chr of tapeString)
  {
    tape.value.push(chr);
  }
  if(resetHead) resetTapeHead()
}

const fullReset = () => {
  loadTapeInput(blankChar.value, true)
}

const acceptAlert = () => {
  Swal.fire({
    theme: 'dark',
    icon: 'success',
    title: 'Entrada aceptada',
    text: 'Resultado: '+tape.value.filter((c, idx) => idx > 0).map(c => c == blankChar.value ? ' ' : c).join('').trim()
  })
}

const rejectAlert = () => {
  Swal.fire({
    theme: 'dark',
    icon: 'error',
    title: 'Entrada rechazada',
    text: 'Resultado: '+tape.value.filter((c, idx) => idx > 0).map(c => c == blankChar.value ? ' ' : c).join('').trim()
  })
}

const updateCompBreakdown = () => {
  compBreakdown.value.push( {
    state: state.value,
    cells: tape.value.map((c, idx) => {
    return {
      symbol: c == blankChar.value ? 'B' : c,
      tapeHere: idx == tapeHead.value,
      isBlank: c == blankChar.value
    }
  })} )
}

const execStep = () => {
  stepCount.value++;
  if(tmDef?.acceptStates.find(q => q == state.value) != undefined)
  {
    status.value = 'Accepted'
    if(autoPlay.value) {
      autoPlay.value = false
      clearTimeout(timeoutId)
    }
    acceptAlert()
    return
  }

  let readSymbol = tape.value[tapeHead.value]
  let nextTransition = tmDef?.transitionRules.find(d => d.StateFrom == state.value && d.SymbolRead == readSymbol)

  //console.log(nextTransition)

  if(nextTransition != undefined){
    if(state.value != nextTransition.StateTo)

    console.log(nextTransition.SymbolWrite)

    tape.value[tapeHead.value] = nextTransition.SymbolWrite
    state.value = nextTransition.StateTo
    if(nextTransition.TapeDirection == 'left') tapeHead.value--
    else if(nextTransition.TapeDirection == 'right') tapeHead.value++
    updateCompBreakdown()
  }
  else {
    status.value = 'Rejected'
    if(autoPlay.value) {
      autoPlay.value = false
      clearTimeout(timeoutId)
    }
    rejectAlert()
  }

  if(tape.value[tapeHead.value+1] == undefined) tape.value.push(blankChar.value)
  if(tapeHead.value-1 < 0) {
    tape.value.unshift(blankChar.value)
    tapeHead.value++
  }
  
}

const execInstant = () => {
  let failsafe = 1000
  let stateChangedInstant = false;
  let i = 0

  while(i < failsafe)
  {
    //console.log("looping...", state.value)

    if(tmDef?.acceptStates.find(q => q == state.value) != undefined)
    {
      status.value = 'Accepted'
      acceptAlert()
      break
    }

    let readSymbol = tape.value[tapeHead.value]
    let nextTransition = tmDef?.transitionRules.find(d => d.StateFrom == state.value && d.SymbolRead == readSymbol)

    if(nextTransition != undefined){
      if(state.value != nextTransition.StateTo) stateChangedInstant = true
      tape.value[tapeHead.value] = nextTransition.SymbolWrite
      state.value = nextTransition.StateTo
      if(nextTransition.TapeDirection == 'left') tapeHead.value--
      else if(nextTransition.TapeDirection == 'right') tapeHead.value++
      updateCompBreakdown()
    }
    else {
      status.value = 'Rejected'
      rejectAlert()
      break
    }
    if(tape.value[tapeHead.value+1] == undefined) tape.value.push(blankChar.value)
    if(tapeHead.value-1 < 0) {
      tape.value.unshift(blankChar.value)
      tapeHead.value++
    }
    i++
    stepCount.value++
  }

  if(stateChangedInstant)
  if(i >= failsafe) {
    status.value = 'Unknown'
    Swal.fire({
      theme: 'dark',
      icon: 'warning',
      title: `Ejecución excedió ${failsafe} pasos.`,
      text: 'Resultado: '+tape.value.filter((c, idx) => idx > 0).map(c => c == blankChar.value ? ' ' : c).join('').trim()
    })
  }
}

const autoPlaySpeedChanged = (e: Event) => {
  autoPlayDelay = 1000/Math.exp(autoPlaySpeed.value)
  if(autoPlay.value)
  {
    clearTimeout(timeoutId)
    execLoop()
  }
}

const toggleAutoPlay = () => {
  autoPlay.value = !autoPlay.value;
  if(autoPlay.value) execLoop()
  else clearInterval(timeoutId)
}

onMounted(() => {
  let code = "8\n0,1,0,\\b,>\n0,5,*,\\b,>\n1,1,0,0,>\n1,2,*,*,>\n2,2,Y,Y,>\n2,2,0,X,>\n2,3,\\b,\\b,<\n3,3,Y,Y,<\n3,3,*,*,<\n3,3,0,0,<\n3,0,\\b,\\b,>\n3,4,X,Y,>\n4,4,Y,Y,>\n4,4,0,0,>\n4,3,\\b,0,<\n5,5,Y,0,>\n5,5,0,\\b,>\n5,6,\\b,\\b,<\n6,6,\\b,\\b,<\n6,7,0,0,<\n7,7,0,0,<\n7,8,\\b,\\b,<"
  //codemirror
  view = new EditorView({
    doc: code,
    parent: (document.getElementById('codigo') as HTMLElement),
    extensions: [basicSetup, oneDark]
  })
  
  loadTapeInput(blankChar.value, true)
  //execLoop()
})

onUnmounted(() => {
  (document.getElementById('codigo') as HTMLElement).replaceChildren()

  if(timeoutId > 0) clearTimeout(timeoutId)
})

</script>

<template>
  <section class="main">
    <h1>Máquina de Turing</h1>

    <div class="tape-panel">
      <div class="tape-container">
        <p style="font-weight: bold;">Cinta de trabajo:</p>
        <div style="display: flex; overflow: auto; padding: 1rem 0 1.5rem 0; justify-content: center;">
          <div v-for="(symbol, idx) in tape" :class="['tape-cell', idx == tapeHead ? 'tape-head' : '', symbol == blankChar ? 'blank' : '']">
            {{ (symbol == blankChar ? 'B' : symbol) }}
          </div>
        </div>

        <p style="font-weight: bold;">Estado:</p>
        <div style="display: flex; justify-self: center; padding: 1rem 0 1.5rem 0;">
          <div class="state-cell">{{ state }}</div>
        </div>

        <p style="font-weight: bold;">Controles:</p>
        <div class="tape-controls">
          <label for="tapeInputTxt">Cadena de entrada: </label>
          <input type="text" id="tapeInputTxt" placeholder="Escribe entrada..." v-model="tapeInputTxt" />
          <button v-on:click="() => loadTapeInput(tapeInputTxt, true)" :disabled="autoPlay == true">Cargar a cinta</button>
        </div>
        <div class="tape-controls">
          <button v-on:click="resetTapeHead" :disabled="autoPlay == true">Reiniciar cabezal</button>
          <button v-on:click="fullReset" :disabled="autoPlay == true">Reinicio total</button>
          <button v-on:click="execStep" :disabled="status != undefined || autoPlay == true">Siguiente paso</button>
          <button v-on:click="toggleAutoPlay" :disabled="status != undefined">{{ autoPlay ? '\u23f8' : '\u23f5' }} Autoplay</button>
          <button v-on:click="execInstant" :disabled="status != undefined || autoPlay == true">Cómputo inmediato</button>
        </div>

        <div v-if="status == 'Accepted'" class="accept-label">Aceptado.<br>
          <CompResult :comp="compBreakdown"/>
        </div>
        <div v-else-if="status == 'Rejected'" class="reject-label">Rechazado.<br>
          <CompResult :comp="compBreakdown"/>
        </div>
        <div v-else-if="status == 'Unknown'" class="warning-label" >Desconocido.<br>
          <CompResult :comp="compBreakdown"/>
        </div>
      </div>
    </div>

    <div class="settings-panel">      
      <div class="tabs">
        <button v-on:click="() => menuTab = 'code'" :class="menuTab == 'code' ? 'active' : ''">Reglas de transición</button>
        <button v-on:click="() => menuTab = 'settings'" :class="menuTab == 'settings' ? 'active' : ''">Configuraciones</button>
      </div>

      <div v-show="menuTab == 'code'" class="menu">
        <p>Formato: <br>
          F,T,R,W,M <br>
          F: Estado origen (0,1,2,...) <br>
          T: Estado destino <br>
          R: Símbolo a leer <br>
          W: Símbolo a escribir <br>
          M: Movimiento (<,>,!)</p>
        <button v-on:click="parseFile">Interpretar código</button>
        <div style="width: 100%;">
          <div id="codigo"></div>
        </div>
      </div>

      <div v-show="menuTab == 'settings'" class="menu">
        <p>Velocidad (símbolos por segundo): {{ autoPlayDisplay }}</p>
        <input type="range" name="autoplayspeed" id="autoplayspeed" min="-2.302585" max="4.094344" step="any" v-model="autoPlaySpeed" v-on:change="autoPlaySpeedChanged" style="width: 15rem; margin-bottom: 1rem;" />
      
        <div style="display: flex; column-gap: 0.5rem;">
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="css">
  @import './styles/global.css';
</style>
