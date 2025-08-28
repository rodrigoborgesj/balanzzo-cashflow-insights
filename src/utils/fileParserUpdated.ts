import { Transaction } from '@/hooks/useConciliacao';

export class FileParser {
  static parseCSV(content: string): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] {
    console.log('=== INICIANDO PARSE CSV ===');
    console.log('Conteúdo recebido (primeiros 200 chars):', content.substring(0, 200));
    console.log('Tamanho total do conteúdo:', content.length);
    
    if (!content || content.trim().length === 0) {
      console.error('Conteúdo do arquivo está vazio');
      return [];
    }
    
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log('Linhas válidas encontradas:', lines.length);
    console.log('Primeiras 3 linhas:', lines.slice(0, 3));

    if (lines.length === 0) {
      console.error('Nenhuma linha válida encontrada após filtrar');
      return [];
    }

    const transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] = [];

    // Skip header if present
    const startIndex = this.hasCSVHeader(lines[0]) ? 1 : 0;
    console.log('Índice de início (pulando header se existir):', startIndex);
    console.log('Header detectado?', this.hasCSVHeader(lines[0]));

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      console.log(`\n--- Processando linha ${i + 1} ---`);
      console.log('Conteúdo da linha:', line);
      
      if (!line || line.length === 0) {
        console.log('Linha vazia, pulando...');
        continue;
      }
      
      const fields = this.parseCSVLine(line);
      console.log('Campos extraídos:', fields, '(total:', fields.length, ')');
      
      if (fields.length < 3) {
        console.warn('Linha com poucos campos (mínimo 3), pulando...');
        continue;
      }
      
      const transaction = this.createTransactionFromCSV(fields, i);
      if (transaction) {
        console.log('✅ Transação criada com sucesso:', transaction);
        transactions.push(transaction);
      } else {
        console.log('❌ Falha ao criar transação');
      }
    }

    console.log('\n=== RESULTADO FINAL ===');
    console.log('Total de transações válidas criadas:', transactions.length);
    return transactions;
  }

  private static hasCSVHeader(firstLine: string): boolean {
    if (!firstLine) return false;
    const headerKeywords = ['data', 'descricao', 'valor', 'date', 'description', 'amount'];
    const lowerLine = firstLine.toLowerCase();
    const hasKeywords = headerKeywords.some(keyword => lowerLine.includes(keyword));
    console.log('Verificando header:', firstLine, '-> contém palavras-chave:', hasKeywords);
    return hasKeywords;
  }

  private static parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    
    // Remove aspas dos campos se existirem
    const cleanedFields = fields.map(field => field.replace(/^["']|["']$/g, '').trim());
    console.log('Campos após limpeza:', cleanedFields);
    
    return cleanedFields;
  }

  private static createTransactionFromCSV(fields: string[], index: number): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'> | null {
    try {
      console.log(`Criando transação da linha ${index + 1}, campos disponíveis:`, fields);
      
      if (fields.length < 3) {
        console.warn(`Campos insuficientes (${fields.length}/3 mínimo)`);
        return null;
      }

      // Common CSV formats: [date, description, amount] or [date, description, debit, credit]
      const dateField = fields[0]?.trim();
      const descriptionField = fields[1]?.trim() || 'Transação sem descrição';
      let amount: number;

      console.log('Campo data bruto:', dateField);
      console.log('Campo descrição:', descriptionField);

      if (!dateField) {
        console.warn('Campo de data está vazio');
        return null;
      }

      // Try to parse date
      const normalizedDate = this.normalizeDate(dateField);
      if (!normalizedDate) {
        console.warn(`Data não pôde ser normalizada: "${dateField}"`);
        return null;
      }
      console.log('Data normalizada:', normalizedDate);

      // Try to get amount from third field, or if there are 4+ fields, try different combinations
      if (fields.length >= 4) {
        // Format: [date, description, debit, credit] or similar
        console.log('Tentando formato com 4+ campos');
        const field3 = fields[2]?.trim() || '0';
        const field4 = fields[3]?.trim() || '0';
        
        console.log('Campo 3 (possível débito):', field3);
        console.log('Campo 4 (possível crédito):', field4);
        
        const amount3 = this.parseAmount(field3);
        const amount4 = this.parseAmount(field4);
        
        console.log('Valores parseados - campo 3:', amount3, 'campo 4:', amount4);
        
        // Try different interpretations
        if (!isNaN(amount3) && !isNaN(amount4)) {
          // Both are numbers, assume debit/credit format
          amount = amount4 - amount3; // credit - debit
          console.log('Formato débito/crédito assumido, resultado:', amount);
        } else if (!isNaN(amount3)) {
          amount = amount3;
          console.log('Usando campo 3 como valor:', amount);
        } else if (!isNaN(amount4)) {
          amount = amount4;
          console.log('Usando campo 4 como valor:', amount);
        } else {
          console.warn('Nenhum dos campos 3 ou 4 contém valor válido');
          return null;
        }
      } else {
        // Format: [date, description, amount]
        console.log('Formato com 3 campos');
        const amountField = fields[2]?.trim();
        console.log('Campo valor bruto:', amountField);
        
        amount = this.parseAmount(amountField || '0');
        console.log('Valor parseado:', amount);
      }

      if (isNaN(amount)) {
        console.warn('Valor final é NaN, transação inválida');
        return null;
      }

      const transaction = {
        id: `import_${Date.now()}_${index}`,
        data_transacao: normalizedDate,
        descricao: descriptionField,
        valor: amount,
        tipo: amount >= 0 ? 'entrada' as const : 'saida' as const,
        status_conciliacao: false,
        origem_arquivo: 'CSV',
        mes_referencia: normalizedDate.substring(0, 7) + '-01' // YYYY-MM-01
      };

      console.log('✅ Transação criada:', transaction);
      return transaction;
    } catch (error) {
      console.error(`❌ Erro ao processar linha ${index + 1}:`, error);
      console.error('Campos que causaram erro:', fields);
      return null;
    }
  }

  private static normalizeDate(dateStr: string): string {
    console.log('Normalizando data:', dateStr);
    
    if (!dateStr) {
      console.log('Data vazia');
      return '';
    }
    
    // Remove quotes and trim
    dateStr = dateStr.replace(/['"]/g, '').trim();
    console.log('Data após limpeza:', dateStr);
    
    // Try different date formats
    const formats = [
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, type: 'DD/MM/YYYY' }, // DD/MM/YYYY
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, type: 'YYYY-MM-DD' }, // YYYY-MM-DD
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, type: 'DD-MM-YYYY' }, // DD-MM-YYYY
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, type: 'DD/MM/YY' }, // DD/MM/YY
    ];

    for (const format of formats) {
      const match = dateStr.match(format.regex);
      if (match) {
        console.log(`Formato detectado: ${format.type}`, match);
        
        let day, month, year;
        
        if (format.type === 'YYYY-MM-DD') {
          year = match[1];
          month = match[2];
          day = match[3];
        } else if (format.type === 'DD/MM/YY') {
          day = match[1];
          month = match[2];
          year = match[3];
          // Convert 2-digit year to 4-digit - assume 20XX for modern transactions
          year = `20${year.padStart(2, '0')}`;
          console.log(`Ano convertido de ${match[3]} para ${year}`);
        } else {
          // DD/MM/YYYY or DD-MM-YYYY format
          day = match[1];
          month = match[2];
          year = match[3];
        }

        // Parse as integers for validation
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        console.log(`Valores parseados: dia=${dayNum}, mês=${monthNum}, ano=${yearNum}`);

        // Basic validation
        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
          console.warn(`Data inválida - valores fora do range válido`);
          continue;
        }

        // More detailed validation
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        // Check for leap year
        if ((yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0)) {
          daysInMonth[1] = 29;
        }
        
        if (dayNum > daysInMonth[monthNum - 1]) {
          console.warn(`Data inválida - dia ${dayNum} não existe no mês ${monthNum}`);
          continue;
        }

        // Return in YYYY-MM-DD format with zero padding
        const result = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
        console.log('Data normalizada com sucesso:', result);
        return result;
      }
    }

    console.warn(`Formato de data não reconhecido: "${dateStr}"`);
    return '';
  }

  private static parseAmount(amountStr: string): number {
    console.log('Parseando valor:', amountStr);
    
    if (!amountStr) {
      console.log('Valor vazio, retornando 0');
      return 0;
    }
    
    // Remove quotes, spaces, and common currency symbols
    let cleaned = amountStr
      .replace(/['"R$\s]/g, '')
      .replace(/\./g, '') // Remove thousands separator (assuming Brazilian format)
      .replace(',', '.'); // Convert decimal separator to dot

    console.log('Valor após limpeza:', cleaned);

    // Handle negative amounts in parentheses
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.slice(1, -1);
      console.log('Valor negativo detectado (parênteses):', cleaned);
    }

    // Handle explicit negative sign
    const isNegative = cleaned.startsWith('-');
    if (isNegative) {
      cleaned = cleaned.substring(1);
    }

    const result = parseFloat(cleaned);
    const finalResult = isNegative ? -result : result;
    
    console.log('Valor final parseado:', finalResult);
    
    return finalResult;
  }

  static parseOFX(content: string): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] {
    const transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] = [];
    
    // Extract STMTTRN blocks
    const stmtTrnRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    const matches = content.match(stmtTrnRegex);
    
    if (!matches) {
      return transactions;
    }
    
    matches.forEach((match, index) => {
      try {
        const trnAmt = this.extractOFXValue(match, 'TRNAMT');
        const dtPosted = this.extractOFXValue(match, 'DTPOSTED');
        const memo = this.extractOFXValue(match, 'MEMO') || this.extractOFXValue(match, 'NAME') || 'Transação OFX';
        
        if (trnAmt && dtPosted) {
          const amount = parseFloat(trnAmt);
          const date = this.parseOFXDate(dtPosted);
          
          if (!isNaN(amount) && date) {
            transactions.push({
              id: `ofx_${Date.now()}_${index}`,
              data_transacao: date,
              descricao: memo,
              valor: amount,
              tipo: amount >= 0 ? 'entrada' as const : 'saida' as const,
              status_conciliacao: false,
              origem_arquivo: 'OFX',
              mes_referencia: date.substring(0, 7) + '-01'
            });
          }
        }
      } catch (error) {
        console.error('Error parsing OFX transaction:', error);
      }
    });
    
    return transactions;
  }

  private static extractOFXValue(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([^<]*)`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private static parseOFXDate(dateStr: string): string {
    // OFX dates are typically in YYYYMMDD format
    const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return '';
  }

  static async parseFile(file: File): Promise<Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[]> {
    try {
      console.log('🔄 Delegando para StandardizedBankStatementParser:', file.name);
      
      // Usar o parser padronizado para todos os arquivos CSV
      if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
        const { StandardizedBankStatementParser } = await import('./standardizedBankStatementParser');
        const result = await StandardizedBankStatementParser.parseFile(file);
        
        if (result.errors.length > 0) {
          console.warn('⚠️ Parser padronizado encontrou erros:', result.errors);
        }
        
        if (result.warnings.length > 0) {
          console.warn('⚠️ Parser padronizado encontrou avisos:', result.warnings);
        }
        
        console.log('✅ Parser padronizado concluído:', {
          transações: result.transactions.length,
          processedRows: result.processedRows,
          validRows: result.validRows
        });
        
        // Map standardized format to application format
        return result.transactions.map((transaction, index) => ({
          id: `import_${Date.now()}_${index}`,
          data_transacao: transaction.date,
          descricao: transaction.description,
          valor: transaction.value,
          tipo: transaction.value > 0 ? 'entrada' : 'saida',
          categoria: 'outros',
          categoria_final: '',
          status_conciliacao: false,
          conciliado: false,
          observacoes: '',
          conta_origem: 'importacao',
          conta_destino: '',
          metodo_pagamento: '',
          tags: [],
          anexos: [],
          origem_arquivo: 'CSV',
          mes_referencia: transaction.date.substring(0, 7) + '-01'
        }));
      } else if (file.name.toLowerCase().endsWith('.ofx')) {
        // Manter OFX parsing original
        const content = await this.readFileContent(file);
        return this.parseOFX(content);
      } else {
        throw new Error('Formato não suportado. Use CSV ou OFX.');
      }
    } catch (error) {
      console.error('❌ Erro no parseFile:', error);
      throw error;
    }
  }

  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }
}
