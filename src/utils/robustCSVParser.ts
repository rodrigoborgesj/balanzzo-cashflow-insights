import Papa from 'papaparse';
import { Transaction } from '@/hooks/useConciliacao';

interface CSVParseResult {
  transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[];
  errors: string[];
  stats: {
    totalRows: number;
    validTransactions: number;
    skippedRows: number;
  };
}

export class RobustCSVParser {
  private static readonly DATE_FORMATS = [
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: 'DD/MM/YYYY' },
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: 'YYYY-MM-DD' },
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: 'DD-MM-YYYY' },
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, format: 'DD/MM/YY' },
    { regex: /^(\d{2})(\d{2})(\d{4})$/, format: 'DDMMYYYY' },
    { regex: /^(\d{4})(\d{2})(\d{2})$/, format: 'YYYYMMDD' }
  ];

  private static readonly HEADER_KEYWORDS = {
    date: ['data', 'date', 'dt_transacao', 'dt_lancamento', 'dt_movimento'],
    description: ['descricao', 'description', 'historico', 'memo', 'detalhes', 'complemento'],
    value: ['valor', 'value', 'amount', 'vl_transacao', 'vl_movimento'],
    credit: ['credito', 'credit', 'entrada', 'receita'],
    debit: ['debito', 'debit', 'saida', 'despesa'],
    type: ['tipo', 'type', 'operacao']
  };

  static async parseCSV(file: File): Promise<CSVParseResult> {
    console.log('🚀 Iniciando parsing robusto do CSV:', file.name);
    
    const result: CSVParseResult = {
      transactions: [],
      errors: [],
      stats: { totalRows: 0, validTransactions: 0, skippedRows: 0 }
    };

    try {
      // Detectar encoding e ler o arquivo
      const content = await this.readFileWithEncoding(file);
      console.log('📄 Conteúdo lido com sucesso, tamanho:', content.length);

      // Detectar delimitador
      const delimiter = this.detectDelimiter(content);
      console.log('🔍 Delimitador detectado:', delimiter);

      // Parse com PapaParse
      const parseResult = Papa.parse(content, {
        delimiter,
        header: false,
        skipEmptyLines: true,
        trimFields: true,
        transform: (value: string) => value.trim()
      });

      if (parseResult.errors.length > 0) {
        console.warn('⚠️ Avisos durante o parse:', parseResult.errors);
        result.errors.push(...parseResult.errors.map(e => e.message));
      }

      const rows = parseResult.data as string[][];
      result.stats.totalRows = rows.length;
      
      console.log('📊 Total de linhas parseadas:', rows.length);

      if (rows.length === 0) {
        result.errors.push('Arquivo não contém dados válidos');
        return result;
      }

      // Detectar colunas automaticamente
      const columnMapping = this.detectColumnMapping(rows[0]);
      console.log('🗂️ Mapeamento de colunas detectado:', columnMapping);

      // Determinar se primeira linha é header
      const hasHeader = this.hasHeader(rows[0]);
      const dataStartIndex = hasHeader ? 1 : 0;
      
      console.log('📋 Header detectado:', hasHeader, '- Iniciando dados na linha:', dataStartIndex);

      // Processar cada linha de dados
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row || row.length === 0) {
          result.stats.skippedRows++;
          continue;
        }

        const transaction = this.createTransactionFromRow(row, columnMapping, i);
        
        if (transaction) {
          result.transactions.push(transaction);
          result.stats.validTransactions++;
          console.log(`✅ Transação ${i} criada:`, transaction);
        } else {
          result.stats.skippedRows++;
          console.log(`⏭️ Linha ${i} ignorada - dados insuficientes ou inválidos`);
        }
      }

      console.log('🎯 Resultado final:', result.stats);
      return result;

    } catch (error) {
      console.error('❌ Erro no parsing do CSV:', error);
      result.errors.push(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return result;
    }
  }

  private static async readFileWithEncoding(file: File): Promise<string> {
    // Tentar UTF-8 primeiro
    try {
      const content = await this.readFileAsText(file, 'UTF-8');
      // Verificar se há caracteres de substituição que indicam encoding incorreto
      if (!content.includes('\uFFFD')) {
        return content;
      }
    } catch (error) {
      console.log('UTF-8 falhou, tentando outros encodings...');
    }

    // Tentar encodings alternativos
    const encodings = ['ISO-8859-1', 'Windows-1252'];
    
    for (const encoding of encodings) {
      try {
        const content = await this.readFileAsText(file, encoding);
        console.log(`✅ Arquivo lido com encoding: ${encoding}`);
        return content;
      } catch (error) {
        console.log(`❌ Falha com encoding ${encoding}:`, error);
        continue;
      }
    }

    // Fallback para UTF-8 mesmo com possíveis problemas
    return this.readFileAsText(file, 'UTF-8');
  }

  private static readFileAsText(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Falha ao ler arquivo como texto'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, encoding);
    });
  }

  private static detectDelimiter(content: string): string {
    const sample = content.split('\n').slice(0, 5).join('\n');
    const delimiters = [';', ',', '\t', '|'];
    
    let bestDelimiter = ',';
    let maxConsistency = 0;

    for (const delimiter of delimiters) {
      const lines = sample.split('\n').filter(line => line.trim());
      if (lines.length < 2) continue;

      const counts = lines.map(line => (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length);
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
      
      // Calcular consistência (menor variação = mais consistente)
      const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length;
      const consistency = avgCount > 0 ? avgCount / (1 + variance) : 0;

      console.log(`Delimitador '${delimiter}': consistência = ${consistency.toFixed(2)}`);

      if (consistency > maxConsistency) {
        maxConsistency = consistency;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  private static detectColumnMapping(firstRow: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    firstRow.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Detectar colunas baseado em palavras-chave
      for (const [type, keywords] of Object.entries(this.HEADER_KEYWORDS)) {
        if (keywords.some(keyword => normalizedHeader.includes(keyword))) {
          if (!mapping[type]) { // Usar a primeira correspondência
            mapping[type] = index;
            console.log(`📍 Coluna '${type}' detectada no índice ${index}: "${header}"`);
          }
        }
      }
    });

    // Fallback para posições padrão se não detectou pelos headers
    if (Object.keys(mapping).length === 0) {
      console.log('🔄 Usando mapeamento padrão por posição');
      return {
        date: 0,
        description: 1,
        value: firstRow.length >= 4 ? 2 : 2, // Se tem 4+ colunas, pode ser débito/crédito
        debit: firstRow.length >= 4 ? 2 : -1,
        credit: firstRow.length >= 4 ? 3 : -1
      };
    }

    return mapping;
  }

  private static hasHeader(firstRow: string[]): boolean {
    const textContent = firstRow.join(' ').toLowerCase();
    const allKeywords = Object.values(this.HEADER_KEYWORDS).flat();
    
    const keywordMatches = allKeywords.filter(keyword => textContent.includes(keyword)).length;
    const hasDatePattern = firstRow.some(cell => this.parseDate(cell) !== null);
    
    // É header se tem palavras-chave e não tem padrão de data válido
    return keywordMatches >= 2 && !hasDatePattern;
  }

  private static createTransactionFromRow(
    row: string[], 
    mapping: Record<string, number>, 
    rowIndex: number
  ): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'> | null {
    
    try {
      // Extrair data
      const dateIndex = mapping.date ?? 0;
      const rawDate = row[dateIndex]?.trim();
      
      if (!rawDate) {
        console.warn(`Linha ${rowIndex}: campo de data vazio`);
        return null;
      }

      const parsedDate = this.parseDate(rawDate);
      if (!parsedDate) {
        console.warn(`Linha ${rowIndex}: data inválida - "${rawDate}"`);
        return null;
      }

      // Extrair descrição
      const descIndex = mapping.description ?? 1;
      const description = row[descIndex]?.trim() || `Transação linha ${rowIndex}`;

      // Extrair valor
      let amount: number;
      
      if (mapping.debit !== undefined && mapping.credit !== undefined && 
          mapping.debit >= 0 && mapping.credit >= 0) {
        // Formato débito/crédito separado
        const debitValue = this.parseAmount(row[mapping.debit] || '0');
        const creditValue = this.parseAmount(row[mapping.credit] || '0');
        
        amount = creditValue - debitValue;
        console.log(`Linha ${rowIndex}: débito=${debitValue}, crédito=${creditValue}, resultado=${amount}`);
      } else {
        // Formato valor único
        const valueIndex = mapping.value ?? 2;
        const rawValue = row[valueIndex]?.trim();
        
        if (!rawValue) {
          console.warn(`Linha ${rowIndex}: valor vazio`);
          return null;
        }
        
        amount = this.parseAmount(rawValue);
      }

      if (isNaN(amount)) {
        console.warn(`Linha ${rowIndex}: valor inválido`);
        return null;
      }

      // Criar transação
      const transaction = {
        id: `csv_${Date.now()}_${rowIndex}`,
        data_transacao: parsedDate,
        descricao: description,
        valor: amount,
        tipo: amount >= 0 ? 'entrada' as const : 'saida' as const,
        status_conciliacao: false,
        origem_arquivo: 'CSV',
        mes_referencia: parsedDate.substring(0, 7) + '-01'
      };

      return transaction;

    } catch (error) {
      console.error(`Erro ao processar linha ${rowIndex}:`, error);
      return null;
    }
  }

  private static parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    const cleaned = dateStr.replace(/['"]/g, '').trim();
    
    for (const { regex, format } of this.DATE_FORMATS) {
      const match = cleaned.match(regex);
      if (match) {
        let day: string, month: string, year: string;
        
        switch (format) {
          case 'YYYY-MM-DD':
            [, year, month, day] = match;
            break;
          case 'DD/MM/YY':
            [, day, month, year] = match;
            // Converter ano de 2 dígitos
            const yearNum = parseInt(year);
            year = yearNum <= 30 ? `20${year}` : `19${year}`;
            break;
          case 'DDMMYYYY':
            [, day, month, year] = match;
            break;
          case 'YYYYMMDD':
            [, year, month, day] = match;
            break;
          default:
            [, day, month, year] = match;
        }

        // Validação básica
        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);
        
        if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) {
          continue;
        }

        // Retornar no formato ISO
        return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  }

  private static parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remover caracteres não numéricos exceto vírgula, ponto e sinais
    let cleaned = amountStr
      .replace(/[^\d,.-]/g, '')
      .trim();

    // Tratar valores em parênteses como negativos
    if (amountStr.includes('(') && amountStr.includes(')')) {
      cleaned = '-' + cleaned;
    }

    // Detectar formato brasileiro (vírgula como decimal)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Se tem ambos, vírgula é decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      // Verificar se vírgula é separador de milhares ou decimal
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Vírgula como decimal
        cleaned = cleaned.replace(',', '.');
      } else {
        // Vírgula como separador de milhares
        cleaned = cleaned.replace(/,/g, '');
      }
    }

    return parseFloat(cleaned) || 0;
  }
}