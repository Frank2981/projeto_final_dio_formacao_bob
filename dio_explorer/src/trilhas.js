/**
 * trilhas.js
 * Módulo principal: funções que alimentam os slash commands /trilha, /desafio e /certificado.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Utilitários ────────────────────────────────────────────────────────────

/**
 * Carrega e parseia trilhas_dio.json.
 * @param {string} [jsonPath] caminho opcional (facilita testes)
 * @returns {{ trilhas: object[] }}
 */
function carregarTrilhas(jsonPath) {
  const filePath = jsonPath || path.resolve(__dirname, '../data/trilhas_dio.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Busca uma trilha pela tecnologia (match parcial, case-insensitive).
 * @param {string} tecnologia
 * @param {string} [jsonPath]
 * @returns {object|null}
 */
function buscarTrilhaPorTecnologia(tecnologia, jsonPath) {
  if (!tecnologia || typeof tecnologia !== 'string') return null;
  const { trilhas } = carregarTrilhas(jsonPath);
  const termo = tecnologia.trim().toLowerCase();
  return trilhas.find(t =>
    t.tecnologia.toLowerCase().includes(termo) ||
    t.nome.toLowerCase().includes(termo)
  ) || null;
}

/**
 * Lista todas as tecnologias disponíveis no JSON.
 * @param {string} [jsonPath]
 * @returns {string[]}
 */
function listarTecnologias(jsonPath) {
  const { trilhas } = carregarTrilhas(jsonPath);
  return trilhas.map(t => t.tecnologia);
}

// ─── /trilha ────────────────────────────────────────────────────────────────

/**
 * Gera o plano de estudos formatado em Markdown para uma tecnologia.
 * @param {string} tecnologia
 * @param {string} [jsonPath]
 * @returns {string}
 */
function gerarPlanoDeEstudos(tecnologia, jsonPath) {
  const trilha = buscarTrilhaPorTecnologia(tecnologia, jsonPath);

  if (!trilha) {
    const disponiveis = listarTecnologias(jsonPath).join('\n- ');
    return (
      `❌ Trilha não encontrada para a tecnologia: **${tecnologia}**\n\n` +
      `Tecnologias disponíveis:\n- ${disponiveis}`
    );
  }

  const vitalicio = trilha.vitalicio ? 'Sim ✅' : 'Não ❌';

  // Módulos com nomes genéricos progressivos
  const modulos = Array.from({ length: trilha.numero_de_modulos }, (_, i) => {
    const nomes = [
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
    const label = nomes[i] || `Tópico Avançado ${i + 1}`;
    return `  ${i + 1}. Módulo ${i + 1} – ${label}`;
  }).join('\n');

  // Badges
  const badges = trilha.badges_disponiveis
    .map((b, i) => {
      const emoji = i === 0 ? '🥉' : i === trilha.badges_disponiveis.length - 1 ? '🥇' : '🥈';
      return `- ${emoji} ${b}`;
    })
    .join('\n');

  // Lives
  const live = trilha.live_ao_vivo.disponivel
    ? `> 📡 **Frequência:** ${trilha.live_ao_vivo.frequencia}\n> 🗓️ **Horário:** ${trilha.live_ao_vivo.dia_hora}`
    : '> ⚠️ Esta trilha não possui lives ao vivo no momento.';

  // Promoção
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

// ─── /desafio ───────────────────────────────────────────────────────────────

const XP_RANGE = {
  básico:        { min: 500,  max: 1500 },
  intermediário: { min: 1500, max: 3000 },
  avançado:      { min: 3000, max: 5000 },
};

const TEMPO_RANGE = {
  básico:        '30–60 min',
  intermediário: '1h–2h',
  avançado:      '2h–4h',
};

/**
 * Retorna XP baseado no nível.
 * @param {string} nivel
 * @returns {number}
 */
function calcularXpDesafio(nivel) {
  const key = (nivel || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const range = XP_RANGE[key] || XP_RANGE['intermediário'];
  // valor determinístico para testes: sempre retorna o mid
  return Math.round((range.min + range.max) / 2);
}

/**
 * Retorna o tempo estimado baseado no nível.
 * @param {string} nivel
 * @returns {string}
 */
function calcularTempoDesafio(nivel) {
  const key = (nivel || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return TEMPO_RANGE[key] || TEMPO_RANGE['intermediário'];
}

/**
 * Gera um ID de desafio no formato DIO-XXXX.
 * @param {string} tecnologia - usado como seed determinístico para testes
 * @returns {string}
 */
function gerarIdDesafio(tecnologia) {
  const seed = (tecnologia || 'DIO').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const num = String(1000 + (seed % 9000)).padStart(4, '0');
  return `DIO-${num}`;
}

/**
 * Gera o markdown de um desafio de código.
 * @param {string} tecnologia
 * @param {string} nivel
 * @returns {string}
 */
function gerarDesafio(tecnologia, nivel) {
  if (!tecnologia || !nivel) {
    return '❌ Informe a tecnologia e o nível para gerar o desafio.';
  }

  const id    = gerarIdDesafio(tecnologia);
  const xp    = calcularXpDesafio(nivel);
  const tempo = calcularTempoDesafio(nivel);

  return `# ⚔️ Desafio DIO — ${tecnologia} · Nível ${nivel}

**🆔 Desafio:** ${id}
**🛠️ Tecnologia:** ${tecnologia}
**📊 Nível:** ${nivel}
**⭐ XP ao concluir:** ${xp} XP
**⏱️ Tempo estimado:** ${tempo}

---

## 📋 Descrição

Você foi contratado por uma startup de EdTech para construir um **sistema de rastreamento de progresso de alunos** em ${tecnologia}. O sistema deve receber uma lista de alunos com seus respectivos módulos concluídos e calcular o percentual de conclusão de cada um.

O desafio simula um cenário real do dia a dia de desenvolvimento com ${tecnologia}, exigindo domínio sobre estruturas de dados, lógica de negócio e boas práticas de código limpo.

Ao final, o sistema deve ser capaz de identificar automaticamente os alunos aptos a receber o certificado (≥ 70% de conclusão).

---

## 🎯 Requisitos

1. Receber uma lista de alunos com nome e módulos concluídos
2. Calcular o percentual de conclusão de cada aluno
3. Identificar alunos aptos ao certificado (conclusão ≥ 70%)
4. Retornar resultado ordenado por percentual (decrescente)
5. Tratar entradas inválidas (lista vazia, módulos negativos)

---

## 📥 Entrada esperada

Lista de objetos com \`nome\` (string) e \`modulos_concluidos\` (inteiro).
Total de módulos da trilha: **12**.

Exemplo:
\`\`\`
[
  { "nome": "Piminchumo", "modulos_concluidos": 10 },
  { "nome": "Ana",        "modulos_concluidos": 5  },
  { "nome": "Carlos",     "modulos_concluidos": 12 }
]
\`\`\`

---

## 📤 Saída esperada

Lista ordenada com percentual e status de certificação.

| Aluno       | Módulos | % Conclusão | Certificado |
|-------------|---------|-------------|-------------|
| Carlos      | 12/12   | 100%        | ✅ Apto     |
| Piminchumo  | 10/12   | 83%         | ✅ Apto     |
| Ana         | 5/12    | 42%         | ❌ Pendente |

---

## 💡 Dicas

1. Calcule o percentual como \`(modulos_concluidos / total_modulos) * 100\`
2. Use \`sort()\` com função comparadora para ordenar decrescente
3. Valide se \`modulos_concluidos\` é um número não-negativo antes de processar
4. Considere criar uma função pura e testável separada para o cálculo do percentual

---

## 🧪 Casos de teste

| Entrada                              | Saída esperada                   |
|--------------------------------------|----------------------------------|
| modulos_concluidos: 12, total: 12    | 100% — ✅ Apto                   |
| modulos_concluidos: 8,  total: 12    | 67% — ❌ Pendente                |
| modulos_concluidos: 0,  total: 12    | 0%  — ❌ Pendente                |
| Lista vazia                          | [] (lista vazia sem erro)        |

---

## 🏅 Recompensa ao concluir

> ✅ +${xp} XP adicionados ao seu perfil DIO
> 🏆 Badge desbloqueada: **${tecnologia} Developer**
`;
}

// ─── /certificado ───────────────────────────────────────────────────────────

/**
 * Gera um ID de certificado determinístico no formato DIO-CERT-XXXXXXXX.
 * @param {string} nome
 * @param {string} trilha
 * @returns {string}
 */
function gerarIdCertificado(nome, trilha) {
  const base = (nome + trilha).toUpperCase().replace(/\s/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[base.charCodeAt(i % base.length) % chars.length];
  }
  return `DIO-CERT-${id}`;
}

/**
 * Retorna a data atual formatada como DD/MM/AAAA.
 * @param {Date} [date]
 * @returns {string}
 */
function formatarData(date) {
  const d = date || new Date();
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Gera o markdown de um certificado fictício.
 * @param {string} nomeUsuario
 * @param {string} nomeTrilha
 * @param {string} [jsonPath]
 * @param {Date}   [date]
 * @returns {string}
 */
function gerarCertificado(nomeUsuario, nomeTrilha, jsonPath, date) {
  if (!nomeUsuario || !nomeTrilha) {
    return '❌ Informe o nome do usuário e a trilha para gerar o certificado.';
  }

  const certId    = gerarIdCertificado(nomeUsuario, nomeTrilha);
  const dataHoje  = formatarData(date);
  const trilha    = buscarTrilhaPorTecnologia(nomeTrilha, jsonPath);
  const nivel     = trilha ? trilha.nivel : 'Intermediário';
  const cargaHora = trilha ? Math.min(120, trilha.numero_de_modulos * 8) + 'h' : '80h';
  const anoAtual  = (date || new Date()).getFullYear();

  const competencias = trilha
    ? trilha.badges_disponiveis.map(b => `- ✔️ ${b}`).join('\n')
    : `- ✔️ Fundamentos de ${nomeTrilha}\n- ✔️ Boas práticas de desenvolvimento\n- ✔️ Resolução de problemas reais`;

  return `\`\`\`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              🎓  CERTIFICADO DE CONCLUSÃO  🎓                    ║
║                      dio.me                                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
\`\`\`

# 🏆 Certificado de Conclusão

---

> *A Digital Innovation One certifica que*

## ${nomeUsuario}

> *concluiu com êxito a trilha de aprendizagem*

## 📚 ${nomeTrilha}

---

### 📋 Detalhes do Certificado

| Campo                    | Informação                               |
|--------------------------|------------------------------------------|
| **👤 Aluno**             | ${nomeUsuario}                           |
| **📚 Trilha**            | ${nomeTrilha}                            |
| **🏫 Instituição**       | Digital Innovation One — DIO             |
| **🗓️ Data de Conclusão** | ${dataHoje}                              |
| **⏱️ Carga Horária**     | ${cargaHora}                             |
| **📊 Nível**             | ${nivel}                                 |
| **🆔 ID do Certificado** | ${certId}                                |
| **✅ Status**            | Aprovado                                 |

---

### 🏅 Competências Certificadas

${competencias}

---

### 🌐 Verificação

> Este certificado pode ser verificado em:
> **https://www.dio.me/certificate/${certId}**

---

### 🖊️ Assinaturas

\`\`\`
_________________________________      _________________________________
   Yure Souza                              Claudio Giorgio
   CEO — Digital Innovation One            CTO — Digital Innovation One
\`\`\`

---

*© ${anoAtual} Digital Innovation One. Todos os direitos reservados.*
*Este é um certificado fictício gerado para fins educacionais.*
`;
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  carregarTrilhas,
  buscarTrilhaPorTecnologia,
  listarTecnologias,
  gerarPlanoDeEstudos,
  calcularXpDesafio,
  calcularTempoDesafio,
  gerarIdDesafio,
  gerarDesafio,
  gerarIdCertificado,
  formatarData,
  gerarCertificado,
};
