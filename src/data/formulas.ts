import type { FormulaItem } from '../types'
export const formulaSeed:FormulaItem[]=[
{id:'f-newton2',topic:'fisica-mecanica-1',title:'2ª Lei de Newton',formula:'F = m · a',note:'Força resultante, massa e aceleração.'},
{id:'f-work',topic:'fisica-mecanica-5',title:'Trabalho',formula:'W = F · d · cos θ',note:'Trabalho de força constante.'},
{id:'f-kinetic',topic:'fisica-mecanica-5',title:'Energia cinética',formula:'Ec = ½mv²',note:'Energia associada ao movimento.'},
{id:'f-momentum',topic:'fisica-mecanica-3',title:'Momento linear',formula:'p = m · v',note:'Quantidade de movimento.'},
{id:'f-gravity',topic:'fisica-mecanica-10',title:'Gravitação universal',formula:'F = G M m / r²',note:'Interação gravitacional entre massas.'},
{id:'f-firstlaw',topic:'fisica-termodinamica-1',title:'1ª Lei da Termodinâmica',formula:'ΔU = Q − W',note:'Convenção: W realizado pelo sistema.'},
{id:'f-eff',topic:'fisica-termodinamica-5',title:'Rendimento',formula:'η = Wútil / Qrecebido',note:'Máquinas térmicas.'},
{id:'f-coulomb',topic:'fisica-eletricidade-e-magnetismo-1',title:'Lei de Coulomb',formula:'F = k |q₁q₂| / r²',note:'Força eletrostática entre cargas puntiformes.'},
{id:'f-field',topic:'fisica-eletricidade-e-magnetismo-1',title:'Campo elétrico',formula:'E = F/q',note:'Definição operacional.'},
{id:'f-ohm',topic:'fisica-eletricidade-e-magnetismo-4',title:'Lei de Ohm',formula:'U = R · I',note:'Relação tensão, resistência e corrente.'},
{id:'f-power',topic:'fisica-eletricidade-e-magnetismo-4',title:'Potência elétrica',formula:'P = U · I',note:'Também P=RI² e P=U²/R em resistor ôhmico.'},
{id:'f-wire',topic:'fisica-eletricidade-e-magnetismo-6',title:'Campo de fio retilíneo longo',formula:'B = μ₀I / (2πr)',note:'No vácuo; regra da mão direita para o sentido.'},
{id:'f-loop',topic:'fisica-eletricidade-e-magnetismo-6',title:'Campo no centro da espira',formula:'B = μ₀I / (2R)',note:'Uma espira circular no vácuo.'},
{id:'f-faraday',topic:'fisica-eletricidade-e-magnetismo-10',title:'Lei de Faraday',formula:'ε = − dΦB/dt',note:'Sinal associado à lei de Lenz.'},
{id:'f-wave',topic:'fisica-optica-2',title:'Relação fundamental das ondas',formula:'v = λ · f',note:'Velocidade, comprimento de onda e frequência.'},
{id:'f-planck',topic:'fisica-fisica-moderna-1',title:'Energia do fóton',formula:'E = h · f',note:'Quantização da energia.'}
].map(f=>({...f,lapses:0,last:null,favorite:false}))
