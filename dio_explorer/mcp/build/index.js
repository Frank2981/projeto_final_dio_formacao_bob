#!/usr/bin/env node
/**
 * index.js — DIO Explorer MCP Server (stdio transport)
 * Pre-compiled build — gerado a partir de src/index.ts
 *
 * Ferramentas expostas:
 *   • listar-trilhas      — lista todas as tecnologias disponíveis
 *   • buscar-trilha       — retorna detalhes de uma trilha
 *   • gerar-plano         — gera plano de estudos Markdown
 *   • gerar-desafio       — gera desafio de código
 *   • gerar-certificado   — gera certificado fictício de conclusão
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ─── Lógica de negócio ───────────────────────────────────────────────────────

const DATA_PATH = path.resolve(__dirname, '../../data/trilhas_dio.json');

function carregarTrilhas(jsonPath) {
  const filePath = jsonPath || DATA_PATH;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buscarTrilhaPorTecnologia(tecnologia, jsonPath) {
  if (!tecnologia) return null;
  const { trilhas } = carregarTrilhas(jsonPath);
  const termo = tecnologia.trim().toLowerCase();
  return trilhas.find(t =>
    t.tecnologia.toLowerCase().includes(termo) ||
    t.nome.toLowerCase().includes(termo)
  ) || null;
}

function listarTecnologias(jsonPath) {
  return carregarTrilhas(jsonPath).trilhas.map(t => t.tecnologia);
}

const NOMES_MODULOS = [
  'Fundamentos e Configuração do Ambiente', 'Sintaxe e Estruturas Básicas',
  'Estruturas de Dados e Coleções', 'Programação Orientada a Objetos',
  'Tratamento de Erros e Exceções', 'Módulos, Pacotes e Dependências',
  'Testes Unitários e Boas Práticas', 'Persistência e Banco de Dados',
  'APIs e Integração de Serviços', 'Segurança e Autenticação',
  'Performance e Otimização', 'Deploy, CI/CD e Boas Práticas de Produção',
  'Arquitetura e Padrões de Projeto', 'Projeto Final Integrador',
  'Monitoramento e Observabilidade', 'Tópicos Avançados e Tendências',
];

function gerarPlanoDeEstudos(tecnologia, jsonPath) {
  const trilha = buscarTrilhaPorTecnologia(tecnologia, jsonPath);
  if (!trilha) {
    const disponiveis = listarTecnologias(jsonPath).join('\n- ');
    return `❌ Trilha não encontrada para: **${tecnologia}**\n\nTecnologias disponíveis:\n- ${disponiveis}`;
  }
  const vitalicio = trilha.vitalicio ? 'Sim ✅' : 'Não ❌';
  const modulos = Array.from({ length: trilha.numero_de_modulos }, (_, i) =>
    `  ${i + 1}. Módulo ${i + 1} – ${NOMES_MODULOS[i] || `Tópico Avançado ${i + 1}`}`
  ).join('\n');
  const badges = trilha.badges_disponiveis.map((b, i) => {
    const emoji = i === 0 ? '🥉' : i === trilha.badges_disponiveis.length - 1 ? '🥇' : '🥈';
    return `- ${emoji} ${b}`;
  }).join('\n');
  const live = trilha.live_ao_vivo.disponivel
    ? `> 📡 **Frequência:** ${trilha.live_ao_vivo.frequencia}\n> 🗓️ **Horário:** ${trilha.live_ao_vivo.dia_hora}`
    : '> ⚠️ Esta trilha não possui lives ao vivo no momento.';
  const promo = trilha.promocoes
    ? `> 🎟️ Use o cupom **${trilha.promocoes.cupom}** e ganhe **${trilha.promocoes.desconto_percentual}%** de desconto!\n> ⏳ Válido até: ${trilha.promocoes.validade}`
    : '> Nenhuma promoção ativa no momento.';
  return `# 📚 Plano de Estudos — ${trilha.nome}\n\n**🏷️ Tecnologia:** ${trilha.tecnologia}\n**📊 Nível:** ${trilha.nivel}\n**🧩 Módulos:** ${trilha.numero_de_modulos} módulos\n**⭐ XP Total:** ${trilha.xp_total.toLocaleString('pt-BR')} XP\n**♾️ Acesso Vitalício:** ${vitalicio}\n\n---\n\n## 🗂️ Cronograma de Módulos\n\n${modulos}\n\n---\n\n## 🏅 Badges Disponíveis\n\n${badges}\n\n---\n\n## 🎥 Lives ao Vivo\n\n${live}\n\n---\n\n## 🏷️ Promoção Ativa\n\n${promo}\n`;
}

const XP_RANGE = { basico: { min: 500, max: 1500 }, intermediario: { min: 1500, max: 3000 }, avancado: { min: 3000, max: 5000 } };
const TEMPO_RANGE = { basico: '30–60 min', intermediario: '1h–2h', avancado: '2h–4h' };

function normalizar(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function calcularXpDesafio(nivel) {
  const r = XP_RANGE[normalizar(nivel)] || XP_RANGE.intermediario;
  return Math.round((r.min + r.max) / 2);
}

function calcularTempoDesafio(nivel) {
  return TEMPO_RANGE[normalizar(nivel)] || TEMPO_RANGE.intermediario;
}

function gerarIdDesafio(tecnologia) {
  const seed = (tecnologia || 'DIO').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `DIO-${String(1000 + (seed % 9000)).padStart(4, '0')}`;
}

function gerarDesafio(tecnologia, nivel) {
  if (!tecnologia || !nivel) return '❌ Informe a tecnologia e o nível para gerar o desafio.';
  const id = gerarIdDesafio(tecnologia);
  const xp = calcularXpDesafio(nivel);
  const tempo = calcularTempoDesafio(nivel);
  return `# ⚔️ Desafio DIO — ${tecnologia} · Nível ${nivel}\n\n**🆔 Desafio:** ${id}\n**🛠️ Tecnologia:** ${tecnologia}\n**📊 Nível:** ${nivel}\n**⭐ XP ao concluir:** ${xp} XP\n**⏱️ Tempo estimado:** ${tempo}\n\n---\n\nVocê foi contratado para construir um **sistema de rastreamento de progresso de alunos** em ${tecnologia}. Alunos com ≥ 70% de módulos concluídos são aptos ao certificado.\n\n---\n\n> ✅ +${xp} XP adicionados ao seu perfil DIO\n> 🏆 Badge desbloqueada: **${tecnologia} Developer**\n`;
}

function gerarIdCertificado(nome, trilha) {
  const base = (nome + trilha).toUpperCase().replace(/\s/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[base.charCodeAt(i % base.length) % chars.length];
  return `DIO-CERT-${id}`;
}

function gerarCertificado(nomeUsuario, nomeTrilha, jsonPath, date) {
  if (!nomeUsuario || !nomeTrilha) return '❌ Informe o nome do usuário e a trilha.';
  const certId = gerarIdCertificado(nomeUsuario, nomeTrilha);
  const dataHoje = (date || new Date()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const trilha = buscarTrilhaPorTecnologia(nomeTrilha, jsonPath);
  const nivel = trilha ? trilha.nivel : 'Intermediário';
  const cargaHora = trilha ? `${Math.min(120, trilha.numero_de_modulos * 8)}h` : '80h';
  const anoAtual = (date || new Date()).getFullYear();
  const competencias = trilha
    ? trilha.badges_disponiveis.map(b => `- ✔️ ${b}`).join('\n')
    : `- ✔️ Fundamentos de ${nomeTrilha}\n- ✔️ Boas práticas de desenvolvimento\n- ✔️ Resolução de problemas reais`;
  return `# 🏆 Certificado de Conclusão\n\n**👤 Aluno:** ${nomeUsuario}\n**📚 Trilha:** ${nomeTrilha}\n**🏫 Instituição:** Digital Innovation One — DIO\n**🗓️ Data de Conclusão:** ${dataHoje}\n**⏱️ Carga Horária:** ${cargaHora}\n**📊 Nível:** ${nivel}\n**🆔 ID:** ${certId}\n**✅ Status:** Aprovado\n\n### 🏅 Competências Certificadas\n\n${competencias}\n\n### 🌐 Verificação\n\n> https://www.dio.me/certificate/${certId}\n\n*© ${anoAtual} Digital Innovation One.*\n`;
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const server = new McpServer({ name: 'dio-explorer', version: '1.0.0' });

// listar-trilhas
server.registerTool('listar-trilhas', {
  description: 'Lista todas as tecnologias/trilhas disponíveis na plataforma DIO.',
  inputSchema: z.object({}),
}, async () => {
  try {
    const tecnologias = listarTecnologias();
    const texto = tecnologias.map((t, i) => `${i + 1}. ${t}`).join('\n');
    return { content: [{ type: 'text', text: `## Trilhas disponíveis na DIO\n\n${texto}` }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
  }
});

// buscar-trilha
server.registerTool('buscar-trilha', {
  description: 'Retorna detalhes completos de uma trilha DIO pela tecnologia ou nome da formação.',
  inputSchema: z.object({
    tecnologia: z.string().describe('Nome da tecnologia ou trilha (ex: "Python", "Java", "React")'),
  }),
}, async ({ tecnologia }) => {
  try {
    const trilha = buscarTrilhaPorTecnologia(tecnologia);
    if (!trilha) {
      return { content: [{ type: 'text', text: `❌ Trilha não encontrada: ${tecnologia}. Disponíveis: ${listarTecnologias().join(', ')}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(trilha, null, 2) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
  }
});

// gerar-plano
server.registerTool('gerar-plano', {
  description: 'Gera um plano de estudos completo em Markdown para uma tecnologia da DIO.',
  inputSchema: z.object({
    tecnologia: z.string().describe('Tecnologia desejada (ex: "Python", "Java", "React")'),
  }),
}, async ({ tecnologia }) => {
  try {
    return { content: [{ type: 'text', text: gerarPlanoDeEstudos(tecnologia) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
  }
});

// gerar-desafio
server.registerTool('gerar-desafio', {
  description: 'Gera um desafio de código personalizado para uma tecnologia e nível.',
  inputSchema: z.object({
    tecnologia: z.string().describe('Tecnologia do desafio (ex: "Python", "JavaScript")'),
    nivel: z.enum(['Básico', 'Intermediário', 'Avançado']).describe('Nível de dificuldade'),
  }),
}, async ({ tecnologia, nivel }) => {
  try {
    return { content: [{ type: 'text', text: gerarDesafio(tecnologia, nivel) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
  }
});

// gerar-certificado
server.registerTool('gerar-certificado', {
  description: 'Gera um certificado fictício de conclusão de trilha DIO para um aluno.',
  inputSchema: z.object({
    nome_usuario: z.string().describe('Nome completo do aluno'),
    nome_trilha: z.string().describe('Nome da trilha ou tecnologia concluída'),
  }),
}, async ({ nome_usuario, nome_trilha }) => {
  try {
    return { content: [{ type: 'text', text: gerarCertificado(nome_usuario, nome_trilha) }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[dio-explorer-mcp] Servidor MCP rodando via stdio');
}

main().catch(err => {
  console.error('[dio-explorer-mcp] Erro fatal:', err);
  process.exit(1);
});
