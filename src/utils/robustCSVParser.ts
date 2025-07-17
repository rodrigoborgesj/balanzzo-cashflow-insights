import Papa from 'papaparse';
import { Transaction } from '@/hooks/useConciliacao';

export interface CSVParseResult {
  transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[];
  errors: string[];
  warnings: string[];
  processedRows: number;
  validRows: number;
  encoding: string;
  delimiter: string;
  hasHeader: boolean;
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
    data: ['data', 'date', 'dt', 'operacao', 'movimento', 'transacao', 'lancamento', 'dt_transacao', 'dt_movimento', 'data da operação', 'data da transação'],
    descricao: ['descricao', 'description', 'historico', 'memo', 'detalhe', 'observacao', 'name', 'detalhes', 'complemento', 'descrição'],
    valor: ['valor', 'amount', 'quantia', 'montante', 'total', 'vl_transacao', 'vl_movimento', 'valor (r$)', 'value'],
    credito: ['credito', 'credit', 'entrada', 'receita', 'crédito'],
    debito: ['debito', 'debit', 'saida', 'despesa', 'débito'],
    tipo: ['tipo', 'type', 'operacao', 'movimento', 'tipo de operação', 'movimentação']
  };

  static async parseCSV(file: File): Promise<CSVParseResult> {
    console.log('🚀 Iniciando parsing robusto universal para:', file.name);
    
    const result: CSVParseResult = {
      transactions: [],
      errors: [],
      warnings: [],
      processedRows: 0,
      validRows: 0,
      encoding: 'UTF-8',
      delimiter: ',',
      hasHeader: false
    };

    try {
      // Detectar encoding e ler o arquivo com múltiplas tentativas
      const { content, encoding } = await this.readFileWithEncoding(file);
      result.encoding = encoding;
      console.log('📄 Conteúdo lido com sucesso:', { tamanho: content.length, encoding });

      if (!content || content.trim().length === 0) {
        result.errors.push('Arquivo vazio ou sem conteúdo válido');
        return result;
      }

      // Detectar delimitador automaticamente
      const delimiter = this.detectDelimiter(content);
      result.delimiter = delimiter;
      console.log('🔍 Delimitador detectado:', delimiter === '\t' ? 'TAB' : delimiter);

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
        result.warnings.push(...parseResult.errors.map(e => e.message));
      }

      const rows = parseResult.data as string[][];
      result.processedRows = rows.length;
      
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
      result.hasHeader = hasHeader;
      const dataStartIndex = hasHeader ? 1 : 0;
      
      console.log('📋 Header detectado:', hasHeader, '- Iniciando dados na linha:', dataStartIndex);

      // Processar cada linha de dados
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row || row.length === 0) {
          continue;
        }

        const transaction = this.createTransactionFromRow(row, columnMapping, i);
        
        if (transaction) {
          result.transactions.push(transaction);
          result.validRows++;
          console.log(`✅ Transação ${i} criada:`, transaction);
        } else {
          result.warnings.push(`Linha ${i + 1}: Não foi possível processar (dados insuficientes ou inválidos)`);
          console.log(`⏭️ Linha ${i} ignorada - dados insuficientes ou inválidos`);
        }
      }

      console.log('🎯 Resultado final:', {
        processedRows: result.processedRows,
        validRows: result.validRows,
        errors: result.errors.length,
        warnings: result.warnings.length,
        encoding: result.encoding,
        delimiter: result.delimiter
      });
      
      return result;

    } catch (error) {
      console.error('❌ Erro no parsing do CSV:', error);
      result.errors.push(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return result;
    }
  }

  private static async readFileWithEncoding(file: File): Promise<{ content: string, encoding: string }> {
    const encodings = ['UTF-8', 'ISO-8859-1', 'Windows-1252'];
    
    for (const encoding of encodings) {
      try {
        console.log(`🔄 Tentando encoding: ${encoding}`);
        const content = await this.readFileAsText(file, encoding);
        
        // Verificar qualidade do encoding
        const hasReplacementChars = content.includes('\uFFFD');
        const hasValidText = /[a-zA-Z0-9]/.test(content);
        const hasValidDates = /\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(content);
        
        if (hasValidText && !hasReplacementChars && content.trim().length > 0) {
          console.log(`✅ Sucesso com encoding: ${encoding}`);
          return { content, encoding };
        }
        
        if (hasValidDates && hasValidText) {
          console.log(`✅ Encoding aceitável: ${encoding} (com alguns caracteres especiais)`);
          return { content, encoding };
        }
        
      } catch (error) {
        console.log(`❌ Falha com encoding ${encoding}:`, error);
        continue;
      }
    }
    
    // Fallback final
    console.log('🔄 Usando fallback UTF-8');
    const content = await this.readFileAsText(file, 'UTF-8');
    return { content, encoding: 'UTF-8' };
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
      const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
      
      // Detectar colunas baseado em palavras-chave
      for (const [type, keywords] of Object.entries(this.HEADER_KEYWORDS)) {
        if (keywords.some(keyword => normalizedHeader.includes(keyword.toLowerCase()))) {
          if (!mapping[type]) { // Usar a primeira correspondência
            mapping[type] = index;
            console.log(`📍 Coluna '${type}' detectada no índice ${index}: "${header}"`);
          }
        }
      }
    });

    // Fallback inteligente para posições padrão
    if (Object.keys(mapping).length < 2) {
      console.log('🔄 Usando mapeamento padrão por posição e heurística');
      
      // Análise heurística das primeiras linhas para detectar colunas
      const intelligentMapping: Record<string, number> = {};
      
      for (let i = 0; i < Math.min(firstRow.length, 6); i++) {
        const cell = firstRow[i].toLowerCase();
        
        // Detectar possível coluna de data
        if (i <= 2 && !intelligentMapping.data) {
          if (/data|date|dt/.test(cell) || this.parseDate(firstRow[i])) {
            intelligentMapping.data = i;
            continue;
          }
        }
        
        // Detectar possível coluna de valor
        if (i >= 1 && !intelligentMapping.valor) {
          if (/valor|amount|total|r\$|\d+[,\.]\d+/.test(cell) || this.parseAmount(firstRow[i]) !== 0) {
            intelligentMapping.valor = i;
            continue;
          }
        }
        
        // Detectar colunas de débito/crédito
        if (/debito|debit|saida/.test(cell) && !intelligentMapping.debito) {
          intelligentMapping.debito = i;
        } else if (/credito|credit|entrada/.test(cell) && !intelligentMapping.credito) {
          intelligentMapping.credito = i;
        }
      }
      
      return {
        data: intelligentMapping.data ?? 0,
        descricao: 1,
        valor: intelligentMapping.valor ?? 2,
        debito: intelligentMapping.debito ?? (firstRow.length >= 4 ? 2 : -1),
        credito: intelligentMapping.credito ?? (firstRow.length >= 4 ? 3 : -1)
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

      // Extrair descrição - com fallbacks inteligentes
      let description: string;
      
      if (mapping.descricao !== undefined && mapping.descricao >= 0 && mapping.descricao < row.length) {
        description = row[mapping.descricao]?.trim() || `Transação linha ${rowIndex}`;
      } else {
        // Tentar encontrar coluna com texto descritivo
        for (let i = 1; i < Math.min(row.length, 4); i++) {
          const cell = row[i]?.trim();
          if (cell && cell.length > 3 && !/^\d+[,.\d]*$/.test(cell) && !this.parseDate(cell)) {
            description = cell;
            break;
          }
        }
        description = description || `Transação linha ${rowIndex}`;
      }

      // Extrair valor - com lógica inteligente para diferentes formatos
      let amount: number;
      
      if (mapping.debito !== undefined && mapping.credito !== undefined && 
          mapping.debito >= 0 && mapping.credito >= 0 && 
          mapping.debito < row.length && mapping.credito < row.length) {
        // Formato débito/crédito separado
        const debitValue = this.parseAmount(row[mapping.debito] || '0');
        const creditValue = this.parseAmount(row[mapping.credito] || '0');
        
        amount = creditValue - debitValue;
        console.log(`Linha ${rowIndex}: débito=${debitValue}, crédito=${creditValue}, resultado=${amount}`);
      } else if (mapping.valor !== undefined && mapping.valor >= 0 && mapping.valor < row.length) {
        // Formato valor único
        const rawValue = row[mapping.valor]?.trim();
        
        if (!rawValue) {
          console.warn(`Linha ${rowIndex}: valor vazio`);
          return null;
        }
        
        amount = this.parseAmount(rawValue);
      } else {
        // Fallback - tentar encontrar valor em qualquer coluna numérica
        console.log(`Linha ${rowIndex}: tentando detectar valor automaticamente`);
        
        for (let i = 2; i < Math.min(row.length, 6); i++) {
          const possibleValue = this.parseAmount(row[i] || '0');
          if (!isNaN(possibleValue) && possibleValue !== 0) {
            amount = possibleValue;
            console.log(`Linha ${rowIndex}: valor detectado na coluna ${i}: ${amount}`);
            break;
          }
        }
        
        if (amount === undefined) {
          console.warn(`Linha ${rowIndex}: nenhum valor válido encontrado`);
          return null;
        }
      }

      if (isNaN(amount)) {
        console.warn(`Linha ${rowIndex}: valor inválido`);
        return null;
      }

      // Criar transação com valores absolutos (conforme padrão do banco)
      const transaction = {
        id: `csv_${Date.now()}_${rowIndex}`,
        data_transacao: parsedDate,
        descricao: description,
        valor: Math.abs(amount), // Sempre positivo no banco
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
    if (!amountStr || amountStr.trim() === '') return 0;
    
    console.log('💰 Processando valor original:', amountStr);
    
    // Detectar se é negativo (parênteses ou sinal)
    const isNegative = amountStr.includes('(') || amountStr.includes('-') || 
                      amountStr.toLowerCase().includes('debito') || 
                      amountStr.toLowerCase().includes('saída');
    
    // Remover símbolos de moeda e espaços
    let cleaned = amountStr
      .replace(/[R$€£¥₹₽\s"'()]/g, '')
      .replace(/[^\d,.-]/g, '')
      .trim();
    
    console.log('💰 Após limpeza:', cleaned);
    
    if (!cleaned) return 0;
    
    // Normalizar separadores decimais
    if (cleaned.includes('.') && cleaned.includes(',')) {
      // Formato: 1.234.567,89 (brasileiro) ou 1,234,567.89 (americano)
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // Vírgula é decimal: 1.234,56 -> 1234.56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Ponto é decimal: 1,234.56 -> 1234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',')) {
      // Só vírgula - verificar se é decimal ou separador de milhares
      const commaIndex = cleaned.lastIndexOf(',');
      const afterComma = cleaned.substring(commaIndex + 1);
      
      if (afterComma.length <= 2) {
        // Provavelmente decimal: 1234,56 -> 1234.56
        cleaned = cleaned.replace(',', '.');
      } else {
        // Provavelmente separador de milhares: 1,234,567 -> 1234567
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    const result = parseFloat(cleaned);
    const finalValue = isNaN(result) ? 0 : (isNegative ? -Math.abs(result) : result);
    
    console.log('💰 Valor final calculado:', finalValue);
    
    return finalValue;
  }
}