import { Transaction } from '@/hooks/useConciliacao';

export class FileParser {
  static parseCSV(content: string): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] {
    console.log('Iniciando parsing CSV. Conteúdo recebido:', content.length, 'caracteres');
    
    const lines = content.split('\n').filter(line => line.trim());
    console.log('Linhas encontradas:', lines.length);
    
    const transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] = [];

    // Skip header if present
    const startIndex = this.hasCSVHeader(lines[0]) ? 1 : 0;
    console.log('Índice de início (pulando header):', startIndex);

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Processando linha ${i}:`, line);
      
      const fields = this.parseCSVLine(line);
      console.log('Campos extraídos:', fields);
      
      if (fields.length >= 3) {
        const transaction = this.createTransactionFromCSV(fields, i);
        if (transaction) {
          console.log('Transação criada:', transaction);
          transactions.push(transaction);
        } else {
          console.log('Transação inválida ignorada na linha', i);
        }
      } else {
        console.log('Linha com poucos campos ignorada:', fields.length);
      }
    }

    console.log('Total de transações parseadas:', transactions.length);
    return transactions;
  }

  private static hasCSVHeader(firstLine: string): boolean {
    const headerKeywords = ['data', 'descricao', 'valor', 'date', 'description', 'amount'];
    const lowerLine = firstLine.toLowerCase();
    return headerKeywords.some(keyword => lowerLine.includes(keyword));
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
    return fields;
  }

  private static createTransactionFromCSV(fields: string[], index: number): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'> | null {
    try {
      // Common CSV formats: [date, description, amount] or [date, description, debit, credit]
      let date = fields[0];
      let description = fields[1];
      let amount: number;

      // Try to parse date
      date = this.normalizeDate(date);
      if (!date) {
        console.warn(`Data inválida ignorada: ${fields[0]}`);
        return null;
      }

      // Clean description
      description = description.replace(/['"]/g, '').trim();
      if (!description) description = 'Transação importada';

      // Parse amount - handle different formats
      if (fields.length === 3) {
        // Format: date, description, amount
        amount = this.parseAmount(fields[2]);
      } else if (fields.length >= 4) {
        // Format: date, description, debit, credit
        const debit = this.parseAmount(fields[2]);
        const credit = this.parseAmount(fields[3]);
        amount = credit || -Math.abs(debit);
      } else {
        return null;
      }

      // Validar valor obrigatório
      if (isNaN(amount) || amount === 0) {
        console.warn(`Valor inválido ignorado: ${fields[2] || fields[3]}`);
        return null;
      }

      return {
        id: `import_${Date.now()}_${index}`,
        data_transacao: date,
        descricao: description,
        valor: amount,
        tipo: amount >= 0 ? 'entrada' : 'saida',
        status_conciliacao: false,
        origem_arquivo: 'CSV',
        mes_referencia: date.substring(0, 7) + '-01' // YYYY-MM-01
      };
    } catch (error) {
      console.error('Error parsing CSV line:', error);
      return null;
    }
  }

  private static normalizeDate(dateStr: string): string {
    // Remove quotes and trim
    dateStr = dateStr.replace(/['"]/g, '').trim();
    
    // Try different date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        let day, month, year;
        
        if (format === formats[1]) {
          // YYYY-MM-DD format
          year = match[1];
          month = match[2];
          day = match[3];
        } else {
          // DD/MM/YYYY or DD-MM-YYYY format
          day = match[1];
          month = match[2];
          year = match[3];
        }

        // Validar valores de data com verificação mais rigorosa
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Validação básica de ranges
        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
          console.warn(`Data inválida - valores fora do range: ${dateStr}`);
          return '';
        }

        // Validação avançada considerando dias por mês
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        // Verificar anos bissextos
        if ((yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0)) {
          daysInMonth[1] = 29; // Fevereiro em ano bissexto
        }
        
        if (dayNum > daysInMonth[monthNum - 1]) {
          console.warn(`Data inválida - dia não existe no mês: ${dateStr} (dia ${dayNum} no mês ${monthNum})`);
          return '';
        }

        // Validar se a data não é no futuro distante
        const currentYear = new Date().getFullYear();
        if (yearNum > currentYear + 1) {
          console.warn(`Data inválida - ano muito no futuro: ${dateStr}`);
          return '';
        }

        // Retornar no formato YYYY-MM-DD com zero padding
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      }
    }

    console.warn(`Formato de data não reconhecido: ${dateStr}`);
    return '';
  }

  private static parseAmount(amountStr: string): number {
    // Remove quotes, spaces, and common currency symbols
    let cleaned = amountStr
      .replace(/['"R$\s]/g, '')
      .replace(/\./g, '') // Remove thousands separator
      .replace(',', '.'); // Convert decimal separator

    // Handle negative amounts in parentheses
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.slice(1, -1);
    }

    // Remove any remaining non-numeric characters except minus and dot
    cleaned = cleaned.replace(/[^-0-9.]/g, '');

    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
  }

  static parseOFX(content: string): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] {
    const transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] = [];
    const stmtTrnRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    let match;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      const trnContent = match[1];
      
      const trnAmt = this.extractOFXValue(trnContent, 'TRNAMT');
      const dtPosted = this.extractOFXValue(trnContent, 'DTPOSTED');
      const memo = this.extractOFXValue(trnContent, 'MEMO') || 
                   this.extractOFXValue(trnContent, 'NAME') || 
                   'Transação OFX';
      const fitId = this.extractOFXValue(trnContent, 'FITID');

      if (trnAmt && dtPosted) {
        const amount = parseFloat(trnAmt);
        const date = this.parseOFXDate(dtPosted);

        if (date && !isNaN(amount) && amount !== 0) {
          transactions.push({
            id: fitId || `ofx_${Date.now()}_${transactions.length}`,
            data_transacao: date,
            descricao: memo,
            valor: amount,
            tipo: amount >= 0 ? 'entrada' : 'saida',
            status_conciliacao: false,
            origem_arquivo: 'OFX',
            mes_referencia: date.substring(0, 7) + '-01' // YYYY-MM-01
          });
        }
      }
    }

    return transactions;
  }

  private static extractOFXValue(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([^<]*)`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private static parseOFXDate(dateStr: string): string {
    // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
    if (dateStr.length >= 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      
      // Validar valores de data
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        console.warn(`Data OFX inválida: ${dateStr}`);
        return '';
      }
      
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  static async parseFile(file: File): Promise<Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const extension = file.name.toLowerCase().split('.').pop();

        try {
          let transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] = [];

          switch (extension) {
            case 'csv':
              transactions = this.parseCSV(content);
              break;
            case 'ofx':
              transactions = this.parseOFX(content);
              break;
            case 'pdf':
              // PDF parsing would require a more complex implementation
              // For now, we'll show an error
              reject(new Error('Parsing de PDF ainda não implementado. Use CSV ou OFX.'));
              return;
            default:
              reject(new Error('Formato de arquivo não suportado'));
              return;
          }

          console.log(`Parsed ${transactions.length} transactions from ${extension.toUpperCase()}`);
          resolve(transactions);
        } catch (error) {
          console.error('Erro no parsing do arquivo:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsText(file);
    });
  }
}