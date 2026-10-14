#!/usr/bin/env node
/**
 * http.ts — DIO Explorer MCP Server (HTTP / Streamable HTTP transport)
 *
 * Permite acesso remoto ao servidor MCP via HTTPS ou API REST.
 * Útil quando o servidor está hospedado em nuvem e clientes se conectam por URL.
 *
 * Uso:
 *   node build/http.js
 *
 * Variáveis de ambiente:
 *   PORT      — porta de escuta (padrão: 3000)
 *   HOST      — interface de rede (padrão: 0.0.0.0)
 *
 * Registro no Bob (mcp.json):
 *   {
 *     "mcpServers": {
 *       "dio-explorer": {
 *         "url": "http://localhost:3000/mcp"
 *       }
 *     }
 *   }
 */

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

import {
  listarTecnologias,
  buscarTrilhaPorTecnologia,
  gerarPlanoDeEstudos,
  gerarDesafio,
  gerarCertificado,
} from './trilhas.js';

// ─── Configuração ─────────────────────────────────────────────────────────────

const PORT = Number(process.env['PORT'] ?? 3000);
const HOST = process.env['HOST'] ?? '0.0.0.0';

// ─── Fábrica de servidor MCP ─────────────────────────────────────────────────
// Uma instância nova por sessão (stateless-compatible)

function criarServidor(): McpServer {
  const server = new McpServer({
    name: 'dio-explorer',
    version: '1.0.0',
  });

  // listar-trilhas
  server.registerTool(
    'listar-trilhas',
    {
      description: 'Lista todas as tecnologias/trilhas disponíveis na plataforma DIO.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const tecnologias = listarTecnologias();
        const texto = tecnologias.map((t, i) => `${i + 1}. ${t}`).join('\n');
        return {
          content: [{ type: 'text', text: `## Trilhas disponíveis na DIO\n\n${texto}` }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Erro: ${String(err)}` }],
          isError: true,
        };
      }
    },
  );

  // buscar-trilha
  server.registerTool(
    'buscar-trilha',
    {
      description: 'Retorna detalhes completos de uma trilha DIO.',
      inputSchema: z.object({
        tecnologia: z.string().describe('Nome da tecnologia ou trilha'),
      }),
    },
    async ({ tecnologia }) => {
      try {
        const trilha = buscarTrilhaPorTecnologia(tecnologia);
        if (!trilha) {
          return {
            content: [{ type: 'text', text: `❌ Trilha não encontrada: ${tecnologia}` }],
            isError: true,
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(trilha, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Erro: ${String(err)}` }],
          isError: true,
        };
      }
    },
  );

  // gerar-plano
  server.registerTool(
    'gerar-plano',
    {
      description: 'Gera um plano de estudos completo em Markdown.',
      inputSchema: z.object({
        tecnologia: z.string().describe('Tecnologia desejada'),
      }),
    },
    async ({ tecnologia }) => {
      try {
        return { content: [{ type: 'text', text: gerarPlanoDeEstudos(tecnologia) }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Erro: ${String(err)}` }],
          isError: true,
        };
      }
    },
  );

  // gerar-desafio
  server.registerTool(
    'gerar-desafio',
    {
      description: 'Gera um desafio de código para uma tecnologia e nível.',
      inputSchema: z.object({
        tecnologia: z.string().describe('Tecnologia do desafio'),
        nivel: z.enum(['Básico', 'Intermediário', 'Avançado']).describe('Nível de dificuldade'),
      }),
    },
    async ({ tecnologia, nivel }) => {
      try {
        return { content: [{ type: 'text', text: gerarDesafio(tecnologia, nivel) }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Erro: ${String(err)}` }],
          isError: true,
        };
      }
    },
  );

  // gerar-certificado
  server.registerTool(
    'gerar-certificado',
    {
      description: 'Gera um certificado fictício de conclusão de trilha DIO.',
      inputSchema: z.object({
        nome_usuario: z.string().describe('Nome completo do aluno'),
        nome_trilha: z.string().describe('Nome da trilha ou tecnologia concluída'),
      }),
    },
    async ({ nome_usuario, nome_trilha }) => {
      try {
        return { content: [{ type: 'text', text: gerarCertificado(nome_usuario, nome_trilha) }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Erro: ${String(err)}` }],
          isError: true,
        };
      }
    },
  );

  return server;
}

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Health-check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dio-explorer-mcp', version: '1.0.0' });
});

// MCP endpoint (Streamable HTTP)
app.all('/mcp', async (req, res) => {
  const server = criarServidor();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — sem sessão persistente
  });

  res.on('close', () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', detail: String(err) });
    }
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, HOST, () => {
  console.error(`[dio-explorer-mcp] HTTP server escutando em http://${HOST}:${PORT}`);
  console.error(`[dio-explorer-mcp] Endpoint MCP: http://${HOST}:${PORT}/mcp`);
  console.error(`[dio-explorer-mcp] Health check: http://${HOST}:${PORT}/health`);
});
