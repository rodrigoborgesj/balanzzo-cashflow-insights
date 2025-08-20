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
    data: ['data', 'date', 'dt', 'operacao', 'movimento', 'transacao', 'lancamento', 'dt_transacao', 'dt_movimento', 'data da operação', 'data da transação', 'data de pagamento', 'transaction date'],
    descricao: ['descricao', 'description', 'historico', 'memo', 'detalhe', 'observacao', 'name', 'detalhes', 'complemento', 'descrição', 'descrição da transação', 'descrição da operação', 'detalhamento'],
    valor: ['valor', 'amount', 'quantia', 'montante', 'total', 'vl_transacao', 'vl_movimento', 'valor (r$)', 'value', 'valor final'],
    credito: ['credito', 'credit', 'entrada', 'receita', 'crédito'],
    debito: ['debito', 'debit', 'saida', 'despesa', 'débito'],
    tipo: ['tipo', 'type', 'operacao', 'movimento', 'tipo de operação', 'movimentação', 'categoria', 'transação', 'crédito/débito'],
    categoria: ['categoria', 'category', 'tipo', 'classificacao', 'classificação']
  };

  private static readonly CATEGORY_RULES = {
    'Alimentação': ['mercado', 'supermercado', 'carrefour', 'pão de açúcar', 'padaria', 'açougue', 'hortifruti', 'feira', 'extra', 'big', 'walmart'],
    'Transporte': ['uber', '99', 'combustível', 'posto', 'gasolina', 'álcool', 'etanol', 'shell', 'ipiranga', 'br', 'taxi'],
    'Moradia': ['aluguel', 'condomínio', 'luz', 'energia', 'copel', 'sabesp', 'água', 'gás', 'telefone', 'internet'],
    'Lazer': ['netflix', 'spotify', 'cinema', 'ifood', 'delivery', 'restaurante', 'bar', 'show', 'teatro'],
    'Receita': ['pix recebido', 'transferência recebida', 'depósito', 'salário', 'pagamento recebido', 'recebimento']
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

      // Detectar colunas automaticamente - usar múltiplas linhas para melhor detecção
      const sampleRows = rows.slice(0, Math.min(3, rows.length));
      const columnMapping = this.detectColumnMapping(sampleRows);
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

  private static detectColumnMapping(sampleRows: string[][]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    if (sampleRows.length === 0) return mapping;
    
    const firstRow = sampleRows[0];
    
    // Primeira tentativa: detectar por cabeçalhos
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

    // Segunda tentativa: análise heurística com dados das primeiras linhas
    if (Object.keys(mapping).length < 2) {
      console.log('🔄 Usando análise heurística com dados amostrais');
      
      const intelligentMapping: Record<string, number> = {};
      
      for (let colIndex = 0; colIndex < firstRow.length; colIndex++) {
        let dateScore = 0;
        let valueScore = 0;
        let textScore = 0;
        
        // Analisar cada linha de amostra para esta coluna
        for (const row of sampleRows) {
          if (row[colIndex]) {
            const cell = row[colIndex].trim();
            
            // Pontuação para data
            if (this.parseDate(cell)) {
              dateScore += 10;
            } else if (/\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cell)) {
              dateScore += 5;
            }
            
            // Pontuação para valor
            if (!isNaN(this.parseAmount(cell)) && this.parseAmount(cell) !== 0) {
              valueScore += 10;
            } else if (/[\d,\.]+/.test(cell)) {
              valueScore += 3;
            }
            
            // Pontuação para texto descritivo
            if (cell.length > 5 && /[a-zA-Z]/.test(cell) && !/^\d+[,.\d]*$/.test(cell)) {
              textScore += 5;
            }
          }
        }
        
        // Definir colunas baseado nas pontuações
        if (dateScore >= 5 && !intelligentMapping.data) {
          intelligentMapping.data = colIndex;
          console.log(`📅 Coluna de data detectada por heurística na posição ${colIndex} (score: ${dateScore})`);
        }
        
        if (valueScore >= 10 && !intelligentMapping.valor) {
          intelligentMapping.valor = colIndex;
          console.log(`💰 Coluna de valor detectada por heurística na posição ${colIndex} (score: ${valueScore})`);
        }
        
        if (textScore >= 15 && !intelligentMapping.descricao && 
            colIndex !== intelligentMapping.data && colIndex !== intelligentMapping.valor) {
          intelligentMapping.descricao = colIndex;
          console.log(`📝 Coluna de descrição detectada por heurística na posição ${colIndex} (score: ${textScore})`);
        }
      }
      
      // Aplicar mapeamento inteligente se não temos mapeamento suficiente
      if (Object.keys(mapping).length < 2) {
        return {
          data: intelligentMapping.data ?? 0,
          descricao: intelligentMapping.descricao ?? 1,
          valor: intelligentMapping.valor ?? 2,
          debito: firstRow.length >= 4 ? 3 : -1,
          credito: firstRow.length >= 5 ? 4 : -1,
          categoria: firstRow.length >= 6 ? 5 : -1
        };
      }
    }

    // Garantir que temos as colunas essenciais mapeadas
    if (!mapping.data && firstRow.length > 0) mapping.data = 0;
    if (!mapping.descricao && firstRow.length > 1) mapping.descricao = 1;
    if (!mapping.valor && !mapping.debito && !mapping.credito && firstRow.length > 2) mapping.valor = 2;

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
      const dateIndex = mapping.data ?? 0;
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

      // Extrair descrição - APENAS da coluna que contém "descrição"
      let description: string;
      
      // Buscar especificamente por coluna com "descrição" no cabeçalho
      const descricaoIndex = this.findDescriptionColumn(row, mapping);
      
      if (descricaoIndex !== -1 && descricaoIndex < row.length) {
        description = row[descricaoIndex]?.trim() || `Transação linha ${rowIndex}`;
      } else {
        description = `Transação linha ${rowIndex}`;
        console.warn(`Linha ${rowIndex}: coluna de descrição não encontrada`);
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
        // Fallback - tentar encontrar valor automaticamente em colunas numéricas
        console.log(`Linha ${rowIndex}: tentando detectar valor automaticamente`);
        
        let foundValue = false;
        for (let i = 1; i < Math.min(row.length, 6); i++) {
          // Pular colunas já identificadas como data ou descrição
          if (i === mapping.data || i === mapping.descricao) continue;
          
          const cellValue = row[i]?.trim();
          if (!cellValue) continue;
          
          const possibleValue = this.parseAmount(cellValue);
          if (!isNaN(possibleValue) && Math.abs(possibleValue) > 0) {
            amount = possibleValue;
            console.log(`Linha ${rowIndex}: valor detectado na coluna ${i}: ${amount}`);
            foundValue = true;
            break;
          }
        }
        
        if (!foundValue) {
          console.warn(`Linha ${rowIndex}: nenhum valor válido encontrado`);
          return null;
        }
      }

      if (isNaN(amount)) {
        console.warn(`Linha ${rowIndex}: valor inválido`);
        return null;
      }

      // Sugerir categoria automaticamente baseada na descrição
      const categoriaSugerida = this.suggestCategory(description);
      
      // Determinar tipo de transação baseado no sinal do valor
      const tipoTransacao = this.identifyTransactionType(description, amount);
      
      // Preservar o valor original (com sinal) para que valores negativos sejam exibidos corretamente
      // O tipo já foi determinado corretamente pela função identifyTransactionType
      const valorAjustado = amount;

      // Criar transação 
      const transaction = {
        id: `csv_${Date.now()}_${rowIndex}`,
        data_transacao: parsedDate,
        descricao: description,
        valor: valorAjustado,
        tipo: tipoTransacao,
        status_conciliacao: false,
        origem_arquivo: 'CSV',
        mes_referencia: parsedDate.substring(0, 7) + '-01',
        categoria_final: categoriaSugerida
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
            // Converter ano de 2 dígitos - assumir 20XX para transações modernas
            const yearNum = parseInt(year);
            year = `20${year.padStart(2, '0')}`;
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
    
    // Detectar se é negativo através do sinal (-) no início ou parênteses
    const hasNegativeSign = amountStr.trim().startsWith('-') || amountStr.includes('(');
    
    // Remover símbolos de moeda, espaços e caracteres especiais, mas preservar o sinal negativo
    let cleaned = amountStr
      .replace(/[R$€£¥₹₽\s"'()]/g, '')
      .replace(/[^\d,.+-]/g, '')
      .trim();
    
    console.log('💰 Após limpeza inicial:', cleaned);
    
    if (!cleaned || cleaned === '-' || cleaned === '+') return 0;
    
    // Preservar o sinal negativo se detectado
    const isNegative = hasNegativeSign || cleaned.startsWith('-');
    
    // Remover todos os sinais para processamento
    cleaned = cleaned.replace(/^[-+]+/, '');
    
    // Casos especiais para formatos brasileiros e internacionais
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
      
      if (afterComma.length <= 2 && afterComma.length > 0) {
        // Provavelmente decimal: 1234,56 -> 1234.56
        cleaned = cleaned.replace(',', '.');
      } else if (afterComma.length === 0) {
        // Vírgula no final, remover
        cleaned = cleaned.replace(',', '');
      } else {
        // Provavelmente separador de milhares: 1,234,567 -> 1234567
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes('.')) {
      // Só ponto - verificar se é decimal ou separador de milhares
      const dotIndex = cleaned.lastIndexOf('.');
      const afterDot = cleaned.substring(dotIndex + 1);
      
      if (afterDot.length > 2) {
        // Pontos são separadores de milhares: 1.234.567
        cleaned = cleaned.replace(/\./g, '');
      }
      // Se afterDot.length <= 2, assumir que é decimal
    }
    
    console.log('💰 Valor final limpo:', cleaned);
    
    const result = parseFloat(cleaned);
    
    if (isNaN(result)) {
      console.warn('💰 Resultado inválido após parse:', cleaned);
      return 0;
    }
    
    // Retornar o valor com o sinal correto
    const finalValue = isNegative ? -Math.abs(result) : Math.abs(result);
    
    console.log('💰 Resultado final:', finalValue, '(original tinha sinal negativo:', isNegative, ')');
    
    return finalValue;
  }

  private static findDescriptionColumn(row: string[], mapping: Record<string, number>): number {
    // PRIORIDADE MÁXIMA: Se já temos mapeamento para descrição, usar SEMPRE
    if (mapping.descricao !== undefined && mapping.descricao >= 0) {
      console.log(`📝 Usando coluna de descrição mapeada: índice ${mapping.descricao}`);
      return mapping.descricao;
    }
    
    // Se não temos mapeamento, buscar pela primeira coluna que contenha texto descritivo
    for (let i = 0; i < row.length; i++) {
      if (i !== mapping.data && i !== mapping.valor && i !== mapping.debito && i !== mapping.credito) {
        const cell = row[i]?.trim();
        
        // Verificar se é uma coluna de texto descritivo:
        // - Não é vazia
        // - Tem mais de 2 caracteres
        // - Contém letras (texto)
        // - NÃO é apenas um número puro (como "1234.56" ou "-118.88")
        // - NÃO é uma data
        if (cell && 
            cell.length > 2 && 
            /[a-zA-Z]/.test(cell) && 
            !/^[\d\s,.\-\+R$€£¥₹₽()'"]*$/.test(cell) && 
            !this.parseDate(cell)) {
          console.log(`📝 Coluna de descrição encontrada no índice ${i}: "${cell}"`);
          return i;
        }
      }
    }
    
    // Fallback: se não encontrou texto descritivo, usar primeira coluna que não seja data/valor
    for (let i = 0; i < row.length; i++) {
      if (i !== mapping.data && i !== mapping.valor && i !== mapping.debito && i !== mapping.credito) {
        console.log(`📝 Usando fallback para descrição no índice ${i}`);
        return i;
      }
    }
    
    return -1;
  }

  private static suggestCategory(description: string): string {
    const descricaoLower = description.toLowerCase();
    
    for (const [categoria, termos] of Object.entries(this.CATEGORY_RULES)) {
      if (termos.some(termo => descricaoLower.includes(termo))) {
        return categoria;
      }
    }
    
    return 'Outros';
  }

  private static identifyTransactionType(description: string, amount: number): 'entrada' | 'saida' {
    const descricaoLower = description.toLowerCase();
    
    // Palavras-chave para saídas
    const saidaKeywords = ['compra', 'pagamento', 'pix enviado', 'débito', 'transferência enviada', 'saque', 'taxa'];
    
    // Palavras-chave para entradas  
    const entradaKeywords = ['recebido', 'pix recebido', 'crédito', 'depósito', 'transferência recebida', 'salário'];
    
    // Primeiro, verificar palavras-chave na descrição
    if (saidaKeywords.some(palavra => descricaoLower.includes(palavra))) {
      return 'saida';
    }
    
    if (entradaKeywords.some(palavra => descricaoLower.includes(palavra))) {
      return 'entrada';
    }
    
    // Fallback principal: usar o sinal do valor para determinar o tipo
    // Se o valor é negativo (tem sinal -), é uma saída/despesa
    // Se o valor é positivo, é uma entrada/receita
    return amount < 0 ? 'saida' : 'entrada';
  }
}