/*
Centro de Investigación en Computación
Instituto Politécnico Nacional
Autor: Kevin Acosta
Ejercicio: Máquinas de Turing
*/

interface TransitionRule
{
    StateFrom: string,
    StateTo: string,
    SymbolRead: string,
    SymbolWrite: string,
    TapeDirection: 'left' | 'right' | 'stay'
}

interface TuringMachine
{
    acceptStates: string[],
    transitionRules: TransitionRule[]
}

interface ComputationSummaryCell
{
    symbol: string,
    tapeHere: boolean,
    isBlank: boolean
}

interface ComputationSummaryStep
{
    state: string,
    cells: ComputationSummaryCell[]
}

export type { TransitionRule, TuringMachine, ComputationSummaryStep, ComputationSummaryCell }