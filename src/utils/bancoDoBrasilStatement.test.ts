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

test('usa Detalhes como descrição e ignora BB Rende Fácil e linhas de saldo', () => {
  const result = StandardizedBankStatementParser.parseBancoDoBrasilCSV(FIXTURE);
  const descriptions = result.transactions.map(t => t.description);

  expect(result.transactions).toHaveLength(3);
  expect(descriptions).toEqual([
    '01/10 13:53 59625260000103 CUSCO VEIO',
    '02/10 09:15 59625260000103 FULANO',
    '02/10 18:40 59625260000103 FULANO',
  ]);
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

test('identifica Pix, débito e crédito pela coluna Lançamento sem classificar boleto como cartão', () => {
  const result = StandardizedBankStatementParser.parseBancoDoBrasilCSV([
    HEADER,
    '"02/10/2026","Pix - Enviado","02/10 10:37 MURIELA ALIMENTOS","100202","-696,50","Saída"',
    '"02/10/2026","Compra com Cartão","02/10 12:52 MP*TROPICAL","428171","-60,00","Saída"',
    '"02/10/2026","Compra no Cartão de Crédito","02/10 13:04 HAUSSEN","452796","-51,55","Saída"',
    '"02/10/2026","Pagamento de Boleto","KEM DISTRIBUIDORA A LTDA","100201","-339,86","Saída"',
  ].join('\n'));

  expect(result.transactions.map(t => t.paymentMethod)).toEqual([
    'pix',
    'cartao_debito',
    'cartao_credito',
    'boleto',
  ]);
});
