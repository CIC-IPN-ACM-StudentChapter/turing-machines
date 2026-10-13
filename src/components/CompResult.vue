<!--
Centro de Investigación en Computación
Instituto Politécnico Nacional
Autor: Kevin Acosta
Ejercicio: Máquinas de Turing
-->
<script setup lang="ts">
import type { ComputationSummaryStep } from '@/model/interfaces';

const { comp } = defineProps<{comp: ComputationSummaryStep[]}>()

</script>

<template>
  <div style="display: flex;justify-content: center;align-items: center;">
    <span class="computation-in">
      (<span>{{ comp[0]?.state }},&nbsp;</span><span v-for="cell in comp[0]?.cells" :class="['computation-char', cell.tapeHere ? 'computation-tape-head' : '', cell.isBlank ? 'computation-char-blank' : '']">
          {{ (cell.symbol) }}
      </span>)
    </span>
    <span v-if="comp.length > 1" class="computation-out">
      (<span>{{ comp[comp.length-1]?.state }},&nbsp;</span><span v-for="cell in comp[comp.length-1]?.cells" :class="['computation-char', cell.tapeHere ? 'computation-tape-head' : '', cell.isBlank ? 'computation-char-blank' : '']">
          {{ cell.symbol }}
      </span>)
    </span>
  </div>
</template>