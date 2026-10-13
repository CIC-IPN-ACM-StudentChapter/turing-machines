/*
Centro de Investigación en Computación
Instituto Politécnico Nacional
Autor: Kevin Acosta
Ejercicio: Máquinas de Turing
*/

import type { TuringMachine,  TransitionRule } from "@/model/interfaces";

export function tmParser()
{
  function parse(input: string): TuringMachine | string
  {
    // Variables de trabajo
    let rules: TransitionRule[] = []
    let syntaxErr = '';
    let blankChar = '\u200B'
    let lineIdx = 0
    let acceptStates: string[] = []

    const linesRE = /^.*$/gm
    const acceptRE = /([\s]*(?<state>[0-9]+)[\s]*)+/g
    const ruleRE = /(?<stateFrom>[0-9]+)[\s]*,[\s]*(?<stateTo>[0-9]+)[\s]*,[\s]*(?<read>[^,]|\\[,bs])[\s]*,[\s]*(?<write>[^,]|\\[,bs])[\s]*,[\s]*(?<tape>[<>!])/g

    const linesMatches = [...input.matchAll(linesRE)]

    if(linesMatches[0]?.[0].match(/[^0-9\s,]+/)?.[0] == null) {
      acceptStates = [...(linesMatches[0]?.[0].matchAll(acceptRE) ?? [])].map(m => m.groups?.state ?? "0")
      linesMatches.shift()
      lineIdx++
    }

    for(let line of linesMatches)
    {
      const elements = [...line[0].matchAll(ruleRE)]
      if(elements.length == 0) syntaxErr = `Error cerca de línea ${lineIdx}.`

      let tapeDir: 'left' | 'right' | 'stay', symbolRead: string, symbolWrite: string
      
      const charRead: string = elements[0]?.groups?.read ?? blankChar
      const charWrite: string = elements[0]?.groups?.write ?? blankChar
      const tapeChar = elements[0]?.groups?.tape ?? "!"
      switch(tapeChar) {
        case '>':
          tapeDir = 'right'
          break;
        case '<':
          tapeDir = 'left'
          break;
        default:
          tapeDir = 'stay'
          break;
      }

      switch(charRead) {
        case '\\b':
          symbolRead = blankChar
          break;
        case '\\,':
          symbolRead = ','
          break;
        default:
          symbolRead = charRead
          break;
      }

      switch(charWrite) {
        case '\\b':
          symbolWrite = blankChar
          break;
        case '\\,':
          symbolWrite = ','
          break;
        default:
          symbolWrite = charWrite
          break;
      }

      rules.push({
        StateFrom: elements[0]?.groups?.stateFrom ?? "0",
        StateTo: elements[0]?.groups?.stateTo ?? "0",
        SymbolRead: symbolRead,
        SymbolWrite: symbolWrite,
        TapeDirection: tapeDir
      })

      lineIdx++
    }

    if(syntaxErr) return syntaxErr

    return {

      acceptStates: acceptStates,
      transitionRules: rules
    }
  }

  return { parse }
}