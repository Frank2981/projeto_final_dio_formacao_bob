#!/usr/bin/env node
/**
 * index.ts — DIO Explorer MCP Server (stdio transport)
 *
 * Expõe as seguintes tools para Bob / qualquer cliente MCP:
 *   • listar-trilhas      — lista todas as tecnologias disponíveis
 *   • buscar-trilha       — retorna detalhes de uma trilha pelo nome/tecnologia
 *   • gerar-plano         — gera plano de estudos Markdown para uma tecnologia
 *   • gerar-desafio       — gera um desafio de código para uma tecnologia e nível
 *   • gerar-certificado   — gera um certificado fictício de conclusão
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  listarTecnologias,
  buscarTrilhaPorTecnologia,
  gerarPlanoDeEstudos,
  gerarDesafio,
  gerarCertificado,
} from './trilhas.js';

// ─── Server ──────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'dio-explorer',
  version: '1.0.0',
});

// ─── Tool: listar-trilhas ────────────────────────────────────────────────────

server.registerTool(
  'listar-trilhas',
  {
    description:
      'Lista todas as tecnologias/trilhas disponíveis na plataforma DIO.',
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const tecnologias = listarTecnologias();
      const texto = tecnologias.map((t, i) => `${i + 1}. ${t}`).join('\n');
      return {
        content: [
          {
            type: 'text',
            text: `## Trilhas disponíveis na DIO\n\n${texto}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Erro ao carregar trilhas: ${String(err)}` }],
        isError: true,
      };
    }
  },
);

// ─── Tool: buscar-trilha ─────────────────────────────────────────────────────

server.registerTool(
  'buscar-trilha',
  {
    description:
      'Retorna os detalhes completos de uma trilha DIO pela tecnologia ou nome da formação.',
    inputSchema: z.object({
      tecnologia: z
        .string()
        .describe('Nome da tecnologia ou trilha a buscar (ex: "Python", "Java", "React")'),
    }),
  },
  async ({ tecnologia }) => {
    try {
      const trilha = buscarTrilhaPorTecnologia(tecnologia);
      if (!trilha) {
        const disponiveis = listarTecnologias().join(', ');
        return {
          content: [
            {
              type: 'text',
              text: `❌ Trilha não encontrada para: **${tecnologia}**\n\nDisponíveis: ${disponiveis}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(trilha, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Erro ao buscar trilha: ${String(err)}` }],
        isError: true,
      };
    }
  },
);

// ─── Tool: gerar-plano ───────────────────────────────────────────────────────

server.registerTool(
  'gerar-plano',
  {
    description:
      'Gera um plano de estudos completo em Markdown para uma tecnologia da DIO.',
    inputSchema: z.object({
      tecnologia: z
        .string()
        .describe('Tecnologia desejada (ex: "Python", "Java", "React")'),
    }),
  },
  async ({ tecnologia }) => {
    try {
      const markdown = gerarPlanoDeEstudos(tecnologia);
      return { content: [{ type: 'text', text: markdown }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Erro ao gerar plano: ${String(err)}` }],
        isError: true,
      };
    }
  },
);

// ─── Tool: gerar-desafio ─────────────────────────────────────────────────────

server.registerTool(
  'gerar-desafio',
  {
    description:
      'Gera um desafio de código personalizado para uma tecnologia e nível.',
    inputSchema: z.object({
      tecnologia: z
        .string()
        .describe('Tecnologia do desafio (ex: "Python", "JavaScript")'),
      nivel: z
        .enum(['Básico', 'Intermediário', 'Avançado'])
        .describe('Nível de dificuldade do desafio'),
    }),
  },
  async ({ tecnologia, nivel }) => {
    try {
      const markdown = gerarDesafio(tecnologia, nivel);
      return { content: [{ type: 'text', text: markdown }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Erro ao gerar desafio: ${String(err)}` }],
        isError: true,
      };
    }
  },
);

// ─── Tool: gerar-certificado ─────────────────────────────────────────────────

server.registerTool(
  'gerar-certificado',
  {
    description:
      'Gera um certificado fictício de conclusão de trilha DIO para um aluno.',
    inputSchema: z.object({
      nome_usuario: z
        .string()
        .describe('Nome completo do aluno'),
      nome_trilha: z
        .string()
        .describe('Nome da trilha ou tecnologia concluída'),
    }),
  },
  async ({ nome_usuario, nome_trilha }) => {
    try {
      const markdown = gerarCertificado(nome_usuario, nome_trilha);
      return { content: [{ type: 'text', text: markdown }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Erro ao gerar certificado: ${String(err)}` }],
        isError: true,
      };
    }
  },
);

// ─── Inicialização ───────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[dio-explorer-mcp] Servidor MCP rodando via stdio');
}

main().catch((err) => {
  console.error('[dio-explorer-mcp] Erro fatal:', err);
  process.exit(1);
});
