# DIO Explorer — MCP Server

Servidor MCP que expõe as funcionalidades do **DIO Explorer** para Bob e qualquer cliente compatível com o Model Context Protocol.

## Estrutura

```
mcp/
├── src/
│   ├── index.ts      # Servidor MCP (stdio transport) — TypeScript
│   ├── http.ts       # Servidor MCP (HTTP transport) — TypeScript
│   └── trilhas.ts    # Lógica de negócio compartilhada
├── build/
│   ├── index.js      # Build pré-compilado (stdio) — pronto para uso
│   └── http.js       # Build pré-compilado (HTTP)  — pronto para uso
├── package.json
└── tsconfig.json
```

## Ferramentas (Tools) disponíveis

| Tool | Descrição | Parâmetros |
|---|---|---|
| `listar-trilhas` | Lista todas as tecnologias disponíveis na DIO | — |
| `buscar-trilha` | Retorna detalhes completos de uma trilha | `tecnologia` |
| `gerar-plano` | Gera plano de estudos em Markdown | `tecnologia` |
| `gerar-desafio` | Gera desafio de código | `tecnologia`, `nivel` |
| `gerar-certificado` | Gera certificado fictício de conclusão | `nome_usuario`, `nome_trilha` |

---

## Pré-requisitos

- **Node.js** v18+ e **npm** (para instalar dependências e reconstruir)
- O diretório `build/` já contém os arquivos pré-compilados; após instalar as dependências o servidor já funciona.

---

## Instalação

```bash
cd dio_explorer/mcp
npm install
```

Para recompilar os fontes TypeScript:

```bash
npm run build
```

---

## Execução

### Modo stdio (para Bob — local)

```bash
node build/index.js
```

### Modo HTTP (para acesso remoto / HTTPS)

```bash
node build/http.js
# ou com porta customizada:
PORT=8080 node build/http.js
```

Endpoints disponíveis:

| Endpoint | Descrição |
|---|---|
| `GET /health` | Health-check |
| `POST /mcp` | Endpoint MCP (Streamable HTTP) |

---

## Registro no Bob

### Opção 1 — stdio (local, recomendado para desenvolvimento)

Edite `.bob/mcp.json` (workspace) ou o arquivo global de MCP do Bob:

```json
{
  "mcpServers": {
    "dio-explorer": {
      "command": "node",
      "args": ["C:/caminho/absoluto/para/dio_explorer/mcp/build/index.js"]
    }
  }
}
```

> Substitua `C:/caminho/absoluto/para/` pelo caminho real da pasta do projeto.

### Opção 2 — HTTP (servidor remoto ou HTTPS)

Primeiro inicie o servidor HTTP:

```bash
PORT=3000 node build/http.js
```

Em seguida registre a URL no Bob:

```json
{
  "mcpServers": {
    "dio-explorer": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Para HTTPS em produção, coloque um proxy reverso (Nginx, Caddy, etc.) na frente do servidor HTTP na porta desejada.

---

## Exemplos de uso no Bob

Após conectar o servidor, use no chat:

```
Liste todas as trilhas da DIO.
Mostre os detalhes da trilha de Python.
Gere um plano de estudos para JavaScript.
Crie um desafio intermediário de React.
Gere meu certificado de conclusão da trilha Java. Meu nome é João Silva.
```

---

## Variáveis de ambiente (modo HTTP)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta de escuta |
| `HOST` | `0.0.0.0` | Interface de rede |

---

## Dados

As trilhas são lidas de [`../data/trilhas_dio.json`](../data/trilhas_dio.json), que contém atualmente **múltiplas formações** cobrindo Java, Python, JavaScript, React, Node.js, Angular, Vue.js, TypeScript, Go, Kotlin, Swift, C#, PHP, Ruby e mais.
