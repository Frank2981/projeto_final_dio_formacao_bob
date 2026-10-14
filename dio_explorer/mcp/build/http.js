#!/usr/bin/env node
/**
 * http.js — DIO Explorer MCP Server (HTTP / Streamable HTTP transport)
 * Pre-compiled build — gerado a partir de src/http.ts
 *
 * Uso:
 *   node build/http.js
 *
 * Variáveis de ambiente:
 *   PORT   — porta de escuta (padrão: 3000)
 *   HOST   — interface de rede (padrão: 0.0.0.0)
 *
 * Registro no Bob (mcp.json) para acesso remoto:
 *   {
 *     "mcpServers": {
 *       "dio-explorer": {
 *         "url": "http://localhost:3000/mcp"
 *       }
 *     }
 *   }
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ─── Lógica de negócio ───────────────────────────────────────────────────────

const DATA_PATH = path.resolve(__dirname, '../../data/trilhas_dio.json');

function carregarTrilhas(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath || DATA_PATH, 'utf8'));
}

function buscarTrilhaPorTecnologia(tecnologia, jsonPath) {
  if (!tecnologia) return null;
  const { trilhas } = carregarTrilhas(jsonPath);
  const termo = tecnologia.trim().toLowerCase();
  return trilhas.find(t =>
    t.tecnologia.toLowerCase().includes(termo) || t.nome.toLowerCase().includes(termo)
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

function gerarDesafio(tecnologia, nivel) {
  if (!tecnologia || !nivel) return '❌ Informe a tecnologia e o nível.';
  const xp = (() => { const r = XP_RANGE[normalizar(nivel)] || XP_RANGE.intermediario; return Math.round((r.min + r.max) / 2); })();
  const tempo = TEMPO_RANGE[normalizar(nivel)] || TEMPO_RANGE.intermediario;
  const seed = (tecnologia || 'DIO').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const id = `DIO-${String(1000 + (seed % 9000)).padStart(4, '0')}`;
  return `# ⚔️ Desafio DIO — ${tecnologia} · Nível ${nivel}\n\n**🆔 Desafio:** ${id}\n**🛠️ Tecnologia:** ${tecnologia}\n**📊 Nível:** ${nivel}\n**⭐ XP ao concluir:** ${xp} XP\n**⏱️ Tempo estimado:** ${tempo}\n\n---\n\nVocê foi contratado para construir um **sistema de rastreamento de progresso de alunos** em ${tecnologia}. Alunos com ≥ 70% de módulos concluídos são aptos ao certificado.\n\n---\n\n> ✅ +${xp} XP\n> 🏆 Badge: **${tecnologia} Developer**\n`;
}

function gerarCertificado(nomeUsuario, nomeTrilha, jsonPath, date) {
  if (!nomeUsuario || !nomeTrilha) return '❌ Informe o nome e a trilha.';
  const base = (nomeUsuario + nomeTrilha).toUpperCase().replace(/\s/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let certSuffix = '';
  for (let i = 0; i < 8; i++) certSuffix += chars[base.charCodeAt(i % base.length) % chars.length];
  const certId = `DIO-CERT-${certSuffix}`;
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

// ─── HTTP MCP Server ─────────────────────────────────────────────────────────

const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

function criarServidor() {
  const server = new McpServer({ name: 'dio-explorer', version: '1.0.0' });

  server.registerTool('listar-trilhas', {
    description: 'Lista todas as tecnologias/trilhas disponíveis na plataforma DIO.',
    inputSchema: z.object({}),
  }, async () => {
    try {
      const tecnologias = listarTecnologias();
      return { content: [{ type: 'text', text: `## Trilhas disponíveis na DIO\n\n${tecnologias.map((t, i) => `${i + 1}. ${t}`).join('\n')}` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
    }
  });

  server.registerTool('buscar-trilha', {
    description: 'Retorna detalhes completos de uma trilha DIO.',
    inputSchema: z.object({ tecnologia: z.string().describe('Tecnologia ou nome da trilha') }),
  }, async ({ tecnologia }) => {
    try {
      const trilha = buscarTrilhaPorTecnologia(tecnologia);
      if (!trilha) return { content: [{ type: 'text', text: `❌ Não encontrada: ${tecnologia}` }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(trilha, null, 2) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
    }
  });

  server.registerTool('gerar-plano', {
    description: 'Gera plano de estudos completo em Markdown.',
    inputSchema: z.object({ tecnologia: z.string().describe('Tecnologia desejada') }),
  }, async ({ tecnologia }) => {
    try {
      return { content: [{ type: 'text', text: gerarPlanoDeEstudos(tecnologia) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
    }
  });

  server.registerTool('gerar-desafio', {
    description: 'Gera desafio de código para uma tecnologia e nível.',
    inputSchema: z.object({
      tecnologia: z.string().describe('Tecnologia do desafio'),
      nivel: z.enum(['Básico', 'Intermediário', 'Avançado']).describe('Nível de dificuldade'),
    }),
  }, async ({ tecnologia, nivel }) => {
    try {
      return { content: [{ type: 'text', text: gerarDesafio(tecnologia, nivel) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Erro: ${String(err)}` }], isError: true };
    }
  });

  server.registerTool('gerar-certificado', {
    description: 'Gera certificado fictício de conclusão de trilha DIO.',
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

  return server;
}

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dio-explorer-mcp', version: '1.0.0' });
});

app.all('/mcp', async (req, res) => {
  const server = criarServidor();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error', detail: String(err) });
  }
});

app.listen(PORT, HOST, () => {
  console.error(`[dio-explorer-mcp] HTTP server em http://${HOST}:${PORT}`);
  console.error(`[dio-explorer-mcp] Endpoint MCP: http://${HOST}:${PORT}/mcp`);
  console.error(`[dio-explorer-mcp] Health check: http://${HOST}:${PORT}/health`);
});
