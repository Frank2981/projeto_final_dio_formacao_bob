/**
 * trilhas.test.js
 * Testes unitários para dio_explorer/src/trilhas.js
 * Runner: Node.js puro (sem dependências externas)
 *
 * Cobertura-alvo: ≥ 70% das funções exportadas
 * Execute: node dio_explorer/src/trilhas.test.js
 */

'use strict';

const path = require('path');
const {
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
} = require('./trilhas');

// ─── Mini test runner ────────────────────────────────────────────────────────

const JSON_PATH = path.resolve(__dirname, '../data/trilhas_dio.json');

let passed = 0;
let failed = 0;
const results = [];

function assert(description, condition) {
  if (condition) {
    passed++;
    results.push({ status: 'PASS', description });
    console.log(`  ✅ PASS — ${description}`);
  } else {
    failed++;
    results.push({ status: 'FAIL', description });
    console.error(`  ❌ FAIL — ${description}`);
  }
}

function assertThrows(description, fn) {
  try {
    fn();
    failed++;
    results.push({ status: 'FAIL', description: `${description} (esperava erro)` });
    console.error(`  ❌ FAIL — ${description} (esperava erro mas não lançou)`);
  } catch {
    passed++;
    results.push({ status: 'PASS', description });
    console.log(`  ✅ PASS — ${description}`);
  }
}

function suite(name, fn) {
  console.log(`\n📦 ${name}`);
  console.log('─'.repeat(60));
  fn();
}

// ─── Testes: carregarTrilhas ─────────────────────────────────────────────────

suite('carregarTrilhas()', () => {
  const data = carregarTrilhas(JSON_PATH);

  assert('retorna objeto com propriedade "trilhas"',
    data && typeof data === 'object' && Array.isArray(data.trilhas));

  assert('contém pelo menos 30 trilhas',
    data.trilhas.length >= 30);

  assert('cada trilha possui campo "id"',
    data.trilhas.every(t => typeof t.id === 'number'));

  assert('cada trilha possui campo "nome"',
    data.trilhas.every(t => typeof t.nome === 'string' && t.nome.length > 0));

  assert('cada trilha possui campo "tecnologia"',
    data.trilhas.every(t => typeof t.tecnologia === 'string'));

  assert('cada trilha possui campo "nivel" válido',
    data.trilhas.every(t => ['Básico', 'Intermediário', 'Avançado'].includes(t.nivel)));

  assert('cada trilha possui "numero_de_modulos" > 0',
    data.trilhas.every(t => typeof t.numero_de_modulos === 'number' && t.numero_de_modulos > 0));

  assert('cada trilha possui "xp_total" > 0',
    data.trilhas.every(t => typeof t.xp_total === 'number' && t.xp_total > 0));

  assert('cada trilha possui "badges_disponiveis" como array não-vazio',
    data.trilhas.every(t => Array.isArray(t.badges_disponiveis) && t.badges_disponiveis.length > 0));

  assert('cada trilha possui campo "vitalicio" booleano',
    data.trilhas.every(t => typeof t.vitalicio === 'boolean'));

  assert('cada trilha possui objeto "live_ao_vivo"',
    data.trilhas.every(t => t.live_ao_vivo && typeof t.live_ao_vivo === 'object'));

  assertThrows('lança erro ao receber caminho inválido',
    () => carregarTrilhas('/caminho/inexistente/trilhas.json'));
});

// ─── Testes: buscarTrilhaPorTecnologia ───────────────────────────────────────

suite('buscarTrilhaPorTecnologia()', () => {
  assert('encontra trilha Java por nome exato (case-insensitive)',
    buscarTrilhaPorTecnologia('java', JSON_PATH) !== null);

  assert('encontra trilha Java por nome em maiúsculo',
    buscarTrilhaPorTecnologia('JAVA', JSON_PATH) !== null);

  assert('retorna trilha com nome "Formação Java Developer"',
    buscarTrilhaPorTecnologia('Java', JSON_PATH).nome === 'Formação Java Developer');

  assert('encontra trilha Python por match parcial',
    buscarTrilhaPorTecnologia('python', JSON_PATH) !== null);

  assert('encontra trilha React por match parcial',
    buscarTrilhaPorTecnologia('react', JSON_PATH) !== null);

  assert('retorna null para tecnologia inexistente',
    buscarTrilhaPorTecnologia('COBOL_INEXISTENTE_XYZ', JSON_PATH) === null);

  assert('retorna null para string vazia',
    buscarTrilhaPorTecnologia('', JSON_PATH) === null);

  assert('retorna null para argumento null',
    buscarTrilhaPorTecnologia(null, JSON_PATH) === null);

  assert('retorna null para argumento undefined',
    buscarTrilhaPorTecnologia(undefined, JSON_PATH) === null);

  assert('encontra trilha por match no nome da formação',
    buscarTrilhaPorTecnologia('Engenharia de Dados', JSON_PATH) !== null);
});

// ─── Testes: listarTecnologias ───────────────────────────────────────────────

suite('listarTecnologias()', () => {
  const tecnologias = listarTecnologias(JSON_PATH);

  assert('retorna um array',
    Array.isArray(tecnologias));

  assert('retorna pelo menos 30 tecnologias',
    tecnologias.length >= 30);

  assert('contém "Java" na lista',
    tecnologias.includes('Java'));

  assert('todos os itens são strings não-vazias',
    tecnologias.every(t => typeof t === 'string' && t.length > 0));
});

// ─── Testes: gerarPlanoDeEstudos ─────────────────────────────────────────────

suite('gerarPlanoDeEstudos()', () => {
  const plano = gerarPlanoDeEstudos('Java', JSON_PATH);

  assert('retorna string não-vazia para Java',
    typeof plano === 'string' && plano.length > 0);

  assert('contém o nome da trilha no plano',
    plano.includes('Formação Java Developer'));

  assert('contém seção de Módulos',
    plano.includes('Módulos'));

  assert('contém seção de Badges',
    plano.includes('Badges'));

  assert('contém seção de Lives ao Vivo',
    plano.includes('Lives ao Vivo'));

  assert('contém seção de Promoção',
    plano.includes('Promoção'));

  assert('contém o cupom JAVA20',
    plano.includes('JAVA20'));

  assert('contém XP total da trilha Java (48.000)',
    plano.includes('48'));

  const planoInexistente = gerarPlanoDeEstudos('COBOL_INEXISTENTE_XYZ', JSON_PATH);
  assert('retorna mensagem de erro para trilha não encontrada',
    planoInexistente.includes('não encontrada'));

  assert('lista tecnologias disponíveis quando trilha não encontrada',
    planoInexistente.includes('Java'));

  // Trilha sem live ao vivo (Angular - id 4)
  const planoAngular = gerarPlanoDeEstudos('Angular', JSON_PATH);
  assert('exibe aviso de ausência de lives quando disponivel=false',
    planoAngular.includes('não possui lives ao vivo'));

  // Trilha sem promoção (Node.js - id 5)
  const planoNode = gerarPlanoDeEstudos('Node.js', JSON_PATH);
  assert('exibe mensagem sem promoção quando promocoes=null',
    planoNode.includes('Nenhuma promoção ativa'));
});

// ─── Testes: calcularXpDesafio ───────────────────────────────────────────────

suite('calcularXpDesafio()', () => {
  assert('Básico retorna XP entre 500 e 1500',
    calcularXpDesafio('Básico') >= 500 && calcularXpDesafio('Básico') <= 1500);

  assert('Intermediário retorna XP entre 1500 e 3000',
    calcularXpDesafio('Intermediário') >= 1500 && calcularXpDesafio('Intermediário') <= 3000);

  assert('Avançado retorna XP entre 3000 e 5000',
    calcularXpDesafio('Avançado') >= 3000 && calcularXpDesafio('Avançado') <= 5000);

  assert('nível inválido retorna valor padrão (Intermediário)',
    calcularXpDesafio('Desconhecido') >= 1500 && calcularXpDesafio('Desconhecido') <= 3000);

  assert('nível em minúsculas funciona corretamente',
    calcularXpDesafio('básico') >= 500 && calcularXpDesafio('básico') <= 1500);
});

// ─── Testes: calcularTempoDesafio ────────────────────────────────────────────

suite('calcularTempoDesafio()', () => {
  assert('Básico retorna "30–60 min"',
    calcularTempoDesafio('Básico') === '30–60 min');

  assert('Intermediário retorna "1h–2h"',
    calcularTempoDesafio('Intermediário') === '1h–2h');

  assert('Avançado retorna "2h–4h"',
    calcularTempoDesafio('Avançado') === '2h–4h');

  assert('nível inválido retorna valor padrão',
    typeof calcularTempoDesafio('Desconhecido') === 'string');
});

// ─── Testes: gerarIdDesafio ──────────────────────────────────────────────────

suite('gerarIdDesafio()', () => {
  const id = gerarIdDesafio('Java');

  assert('retorna string com prefixo "DIO-"',
    id.startsWith('DIO-'));

  assert('retorna string com 8 caracteres totais (DIO-XXXX)',
    id.length === 8);

  assert('parte numérica tem 4 dígitos',
    /^DIO-\d{4}$/.test(id));

  assert('é determinístico (mesma entrada → mesmo ID)',
    gerarIdDesafio('Java') === gerarIdDesafio('Java'));

  assert('tecnologias diferentes geram IDs diferentes',
    gerarIdDesafio('Java') !== gerarIdDesafio('Python'));
});

// ─── Testes: gerarDesafio ────────────────────────────────────────────────────

suite('gerarDesafio()', () => {
  const desafio = gerarDesafio('Java', 'Intermediário');

  assert('retorna string não-vazia',
    typeof desafio === 'string' && desafio.length > 0);

  assert('contém a tecnologia no cabeçalho',
    desafio.includes('Java'));

  assert('contém o nível no cabeçalho',
    desafio.includes('Intermediário'));

  assert('contém seção de Descrição',
    desafio.includes('Descrição'));

  assert('contém seção de Requisitos',
    desafio.includes('Requisitos'));

  assert('contém seção de Casos de teste',
    desafio.includes('Casos de teste'));

  assert('contém seção de Recompensa',
    desafio.includes('Recompensa'));

  assert('contém XP ao concluir',
    desafio.includes('XP'));

  const semArgs = gerarDesafio('', '');
  assert('retorna erro quando tecnologia e nível são vazios',
    semArgs.includes('❌'));

  const semNivel = gerarDesafio('Python', '');
  assert('retorna erro quando nível é vazio',
    semNivel.includes('❌'));
});

// ─── Testes: gerarIdCertificado ──────────────────────────────────────────────

suite('gerarIdCertificado()', () => {
  const id = gerarIdCertificado('Piminchumo', 'Java');

  assert('retorna string com prefixo "DIO-CERT-"',
    id.startsWith('DIO-CERT-'));

  assert('parte alfanumérica tem 8 caracteres',
    id.replace('DIO-CERT-', '').length === 8);

  assert('é determinístico (mesma entrada → mesmo ID)',
    gerarIdCertificado('Piminchumo', 'Java') === gerarIdCertificado('Piminchumo', 'Java'));

  assert('alunos diferentes geram IDs diferentes',
    gerarIdCertificado('Piminchumo', 'Java') !== gerarIdCertificado('Ana', 'Java'));
});

// ─── Testes: formatarData ────────────────────────────────────────────────────

suite('formatarData()', () => {
  const dataFixa = new Date(2025, 0, 15); // 15/01/2025
  const resultado = formatarData(dataFixa);

  assert('retorna string no formato DD/MM/AAAA',
    /^\d{2}\/\d{2}\/\d{4}$/.test(resultado));

  assert('formata 15/01/2025 corretamente',
    resultado === '15/01/2025');

  assert('sem argumento retorna a data de hoje (string válida)',
    /^\d{2}\/\d{2}\/\d{4}$/.test(formatarData()));
});

// ─── Testes: gerarCertificado ────────────────────────────────────────────────

suite('gerarCertificado()', () => {
  const dataFixa = new Date(2025, 5, 15); // 15/06/2025
  const cert = gerarCertificado('Piminchumo', 'Java', JSON_PATH, dataFixa);

  assert('retorna string não-vazia',
    typeof cert === 'string' && cert.length > 0);

  assert('contém o nome do aluno',
    cert.includes('Piminchumo'));

  assert('contém o nome da trilha',
    cert.includes('Java'));

  assert('contém ID de certificado com prefixo DIO-CERT-',
    cert.includes('DIO-CERT-'));

  assert('contém a data de conclusão formatada',
    cert.includes('15/06/2025'));

  assert('contém link de verificação dio.me',
    cert.includes('dio.me/certificate'));

  assert('contém seção de Competências Certificadas',
    cert.includes('Competências Certificadas'));

  assert('contém assinaturas',
    cert.includes('Yure Souza'));

  assert('contém aviso de certificado fictício',
    cert.includes('fictício'));

  const semArgs = gerarCertificado('', '');
  assert('retorna erro quando nome e trilha são vazios',
    semArgs.includes('❌'));

  // Trilha inexistente — usa valores padrão
  const certGenerico = gerarCertificado('Piminchumo', 'TrilhaDesconhecida', JSON_PATH, dataFixa);
  assert('gera certificado com valores padrão para trilha não encontrada no JSON',
    certGenerico.includes('Piminchumo') && certGenerico.includes('TrilhaDesconhecida'));
});

// ─── Relatório final ─────────────────────────────────────────────────────────

const total      = passed + failed;
const cobertura  = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const aprovado   = parseFloat(cobertura) >= 70;

console.log('\n' + '═'.repeat(60));
console.log('📊  RELATÓRIO DE TESTES — DIO Explorer');
console.log('═'.repeat(60));
console.log(`  Total de testes : ${total}`);
console.log(`  ✅ Aprovados    : ${passed}`);
console.log(`  ❌ Reprovados   : ${failed}`);
console.log(`  📈 Cobertura    : ${cobertura}%  (meta: ≥ 70%)`);
console.log(`  🏁 Status       : ${aprovado ? '✅ META ATINGIDA' : '❌ META NÃO ATINGIDA'}`);
console.log('═'.repeat(60) + '\n');

// Expõe resultados para quem importar (uso pelo script de relatório)
module.exports = { results, passed, failed, total, cobertura };
