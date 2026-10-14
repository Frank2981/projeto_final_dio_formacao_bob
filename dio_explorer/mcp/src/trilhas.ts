/**
 * trilhas.ts
 * Lógica de negócio reutilizada pelo MCP Server (ESM / TypeScript).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Promocao {
  desconto_percentual: number;
  validade: string;
  cupom: string;
}

export interface LiveAoVivo {
  disponivel: boolean;
  frequencia: string | null;
  dia_hora: string | null;
}

export interface Trilha {
  id: number;
  nome: string;
  tecnologia: string;
  nivel: string;
  numero_de_modulos: number;
  xp_total: number;
  badges_disponiveis: string[];
  promocoes: Promocao | null;
  vitalicio: boolean;
  live_ao_vivo: LiveAoVivo;
}

interface DadosTrilhas {
  trilhas: Trilha[];
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

const DATA_PATH = path.resolve(__dirname, '../../data/trilhas_dio.json');

export function carregarTrilhas(jsonPath?: string): DadosTrilhas {
  const filePath = jsonPath ?? DATA_PATH;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as DadosTrilhas;
}

export function buscarTrilhaPorTecnologia(tecnologia: string, jsonPath?: string): Trilha | null {
  if (!tecnologia || typeof tecnologia !== 'string') return null;
  const { trilhas } = carregarTrilhas(jsonPath);
  const termo = tecnologia.trim().toLowerCase();
  return (
    trilhas.find(
      (t) =>
        t.tecnologia.toLowerCase().includes(termo) ||
        t.nome.toLowerCase().includes(termo),
    ) ?? null
  );
}

export function listarTecnologias(jsonPath?: string): string[] {
  const { trilhas } = carregarTrilhas(jsonPath);
  return trilhas.map((t) => t.tecnologia);
}

// ─── /trilha ─────────────────────────────────────────────────────────────────

const NOMES_MODULOS = [
  'Fundamentos e Configuração do Ambiente',
  'Sintaxe e Estruturas Básicas',
  'Estruturas de Dados e Coleções',
  'Programação Orientada a Objetos',
  'Tratamento de Erros e Exceções',
  'Módulos, Pacotes e Dependências',
  'Testes Unitários e Boas Práticas',
  'Persistência e Banco de Dados',
  'APIs e Integração de Serviços',
  'Segurança e Autenticação',
  'Performance e Otimização',
  'Deploy, CI/CD e Boas Práticas de Produção',
  'Arquitetura e Padrões de Projeto',
  'Projeto Final Integrador',
  'Monitoramento e Observabilidade',
  'Tópicos Avançados e Tendências',
];

export function gerarPlanoDeEstudos(tecnologia: string, jsonPath?: string): string {
  const trilha = buscarTrilhaPorTecnologia(tecnologia, jsonPath);
  if (!trilha) {
    const disponiveis = listarTecnologias(jsonPath).join('\n- ');
    return `❌ Trilha não encontrada para: **${tecnologia}**\n\nTecnologias disponíveis:\n- ${disponiveis}`;
  }

  const vitalicio = trilha.vitalicio ? 'Sim ✅' : 'Não ❌';
  const modulos = Array.from({ length: trilha.numero_de_modulos }, (_, i) => {
    const label = NOMES_MODULOS[i] ?? `Tópico Avançado ${i + 1}`;
    return `  ${i + 1}. Módulo ${i + 1} – ${label}`;
  }).join('\n');

  const badges = trilha.badges_disponiveis
    .map((b, i) => {
      const emoji =
        i === 0 ? '🥉' : i === trilha.badges_disponiveis.length - 1 ? '🥇' : '🥈';
      return `- ${emoji} ${b}`;
    })
    .join('\n');

  const live = trilha.live_ao_vivo.disponivel
    ? `> 📡 **Frequência:** ${trilha.live_ao_vivo.frequencia}\n> 🗓️ **Horário:** ${trilha.live_ao_vivo.dia_hora}`
    : '> ⚠️ Esta trilha não possui lives ao vivo no momento.';

  const promo = trilha.promocoes
    ? `> 🎟️ Use o cupom **${trilha.promocoes.cupom}** e ganhe **${trilha.promocoes.desconto_percentual}%** de desconto!\n> ⏳ Válido até: ${trilha.promocoes.validade}`
    : '> Nenhuma promoção ativa no momento.';

  return `# 📚 Plano de Estudos — ${trilha.nome}

**🏷️ Tecnologia:** ${trilha.tecnologia}
**📊 Nível:** ${trilha.nivel}
**🧩 Módulos:** ${trilha.numero_de_modulos} módulos
**⭐ XP Total:** ${trilha.xp_total.toLocaleString('pt-BR')} XP
**♾️ Acesso Vitalício:** ${vitalicio}

---

## 🗂️ Cronograma de Módulos

${modulos}

---

## 🏅 Badges Disponíveis

${badges}

---

## 🎥 Lives ao Vivo

${live}

---

## 🏷️ Promoção Ativa

${promo}
`;
}

// ─── /desafio ────────────────────────────────────────────────────────────────

const XP_RANGE: Record<string, { min: number; max: number }> = {
  basico: { min: 500, max: 1500 },
  intermediario: { min: 1500, max: 3000 },
  avancado: { min: 3000, max: 5000 },
};

const TEMPO_RANGE: Record<string, string> = {
  basico: '30–60 min',
  intermediario: '1h–2h',
  avancado: '2h–4h',
};

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function calcularXpDesafio(nivel: string): number {
  const key = normalizar(nivel);
  const range = XP_RANGE[key] ?? XP_RANGE['intermediario'];
  return Math.round((range.min + range.max) / 2);
}

export function calcularTempoDesafio(nivel: string): string {
  const key = normalizar(nivel);
  return TEMPO_RANGE[key] ?? TEMPO_RANGE['intermediario'];
}

export function gerarIdDesafio(tecnologia: string): string {
  const seed = (tecnologia || 'DIO')
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const num = String(1000 + (seed % 9000)).padStart(4, '0');
  return `DIO-${num}`;
}

export function gerarDesafio(tecnologia: string, nivel: string): string {
  if (!tecnologia || !nivel) {
    return '❌ Informe a tecnologia e o nível para gerar o desafio.';
  }
  const id = gerarIdDesafio(tecnologia);
  const xp = calcularXpDesafio(nivel);
  const tempo = calcularTempoDesafio(nivel);
  return `# ⚔️ Desafio DIO — ${tecnologia} · Nível ${nivel}\n\n**🆔 Desafio:** ${id}\n**🛠️ Tecnologia:** ${tecnologia}\n**📊 Nível:** ${nivel}\n**⭐ XP ao concluir:** ${xp} XP\n**⏱️ Tempo estimado:** ${tempo}\n\n---\n\nVocê foi contratado para construir um **sistema de rastreamento de progresso de alunos** em ${tecnologia}. O sistema deve receber uma lista de alunos com seus respectivos módulos concluídos e calcular o percentual de conclusão. Alunos com ≥ 70% são aptos ao certificado.\n\n---\n\n> ✅ +${xp} XP adicionados ao seu perfil DIO\n> 🏆 Badge desbloqueada: **${tecnologia} Developer**\n`;
}

// ─── /certificado ────────────────────────────────────────────────────────────

export function gerarIdCertificado(nome: string, trilha: string): string {
  const base = (nome + trilha).toUpperCase().replace(/\s/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[base.charCodeAt(i % base.length) % chars.length];
  }
  return `DIO-CERT-${id}`;
}

export function gerarCertificado(
  nomeUsuario: string,
  nomeTrilha: string,
  jsonPath?: string,
  date?: Date,
): string {
  if (!nomeUsuario || !nomeTrilha) {
    return '❌ Informe o nome do usuário e a trilha para gerar o certificado.';
  }
  const certId = gerarIdCertificado(nomeUsuario, nomeTrilha);
  const dataHoje = (date ?? new Date()).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const trilha = buscarTrilhaPorTecnologia(nomeTrilha, jsonPath);
  const nivel = trilha ? trilha.nivel : 'Intermediário';
  const cargaHora = trilha
    ? `${Math.min(120, trilha.numero_de_modulos * 8)}h`
    : '80h';
  const anoAtual = (date ?? new Date()).getFullYear();
  const competencias = trilha
    ? trilha.badges_disponiveis.map((b) => `- ✔️ ${b}`).join('\n')
    : `- ✔️ Fundamentos de ${nomeTrilha}\n- ✔️ Boas práticas de desenvolvimento\n- ✔️ Resolução de problemas reais`;

  return `# 🏆 Certificado de Conclusão\n\n**👤 Aluno:** ${nomeUsuario}\n**📚 Trilha:** ${nomeTrilha}\n**🏫 Instituição:** Digital Innovation One — DIO\n**🗓️ Data de Conclusão:** ${dataHoje}\n**⏱️ Carga Horária:** ${cargaHora}\n**📊 Nível:** ${nivel}\n**🆔 ID:** ${certId}\n**✅ Status:** Aprovado\n\n### 🏅 Competências Certificadas\n\n${competencias}\n\n### 🌐 Verificação\n\n> https://www.dio.me/certificate/${certId}\n\n*© ${anoAtual} Digital Innovation One.*\n`;
}
