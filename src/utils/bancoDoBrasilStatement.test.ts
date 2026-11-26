import { expect, test } from 'bun:test';
import { StandardizedBankStatementParser } from './standardizedBankStatementParser';

const HEADER = '"Data","Lançamento","Detalhes","N° documento","Valor","Tipo Lançamento"';

const FIXTURE = [
  HEADER,
  '"23/09/2026","Saldo Anterior","","","0,00",""',
  '"01/10/2026","Pix - Recebido","01/10 13:53 59625260000103 CUSCO VEIO","11353484262712","6,00","Entrada"',
  '"01/10/2026","BB Rende Fácil","Rende Facil","9903","-516,92","Saída"',
  '"01/10/2026","Saldo do dia","","","0,00",""',
  '"02/10/2026","BB Rende Fácil","Rende Facil","9903","-1.905,54","Saída"',
  '"02/10/2026","Saldo do dia","","","0,00",""',
  '"02/10/2026","Pix - Enviado","02/10 09:15 59625260000103 FULANO","11400000000001","-6,00","Saída"',
  '"02/10/2026","Pix - Enviado","02/10 18:40 59625260000103 FULANO","11400000000002","-6,00","Saída"',
].join('\n');

test('ignora BB Rende Fácil e todas as linhas de saldo do extrato Banco do Brasil', () => {
  const result = StandardizedBankStatementParser.parseBancoDoBrasilCSV(FIXTURE);
  const descriptions = result.transactions.map(t => t.description);

  expect(result.transactions).toHaveLength(3);
  expect(descriptions).toEqual(['Pix - Recebido', 'Pix - Enviado', 'Pix - Enviado']);
  expect(descriptions.some(d => /rende\s*facil/i.test(d))).toBe(false);
  expect(descriptions.some(d => /saldo/i.test(d))).toBe(false);
});

test('mantém valores e sinais das movimentações reais do Banco do Brasil', () => {
  const result = StandardizedBankStatementParser.parseBancoDoBrasilCSV(FIXTURE);
  const values = result.transactions.map(t => t.value);

  expect(values).toEqual([6, -6, -6]);
  expect(result.validRows).toBe(3);
});

test('não trata como duplicata movimentações com o mesmo valor em horários diferentes', () => {
  const result = StandardizedBankStatementParser.parseBancoDoBrasilCSV(FIXTURE);
  const identifiers = result.transactions.map(t => t.identifier);

  expect(new Set(identifiers).size).toBe(3);
});
