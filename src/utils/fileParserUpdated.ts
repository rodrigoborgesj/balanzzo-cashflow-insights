import { Transaction } from '@/hooks/useConciliacao';

export class FileParser {
  static parseCSV(content: string): Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] {
    const lines = content.split('\n').filter(line => line.trim());
    const transactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[] = [];

    // Skip header if present
    const startIndex = this.hasCSVHeader(lines[0]) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const fields = this.parseCSVLine(line);
      
      if (fields.length >= 3) {
        const transaction = this.createTransactionFromCSV(fields, i);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }

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
      let data_transacao = fields[0];
      let descricao = fields[1];
      let valor: number;

      // Try to parse date
      data_transacao = this.normalizeDate(data_transacao);
      if (!data_transacao) return null;

      // Clean description
      descricao = descricao.replace(/['"]/g, '').trim();
      if (!descricao) descricao = 'Transação importada';

      // Parse amount - handle different formats
      if (fields.length === 3) {
        // Format: date, description, amount
        valor = this.parseAmount(fields[2]);
      } else if (fields.length >= 4) {
        // Format: date, description, debit, credit
        const debit = this.parseAmount(fields[2]);
        const credit = this.parseAmount(fields[3]);
        valor = credit || -Math.abs(debit);
      } else {
        return null;
      }

      if (isNaN(valor)) return null;

      return {
        id: `import_${Date.now()}_${index}`,
        data_transacao,
        descricao,
        valor,
        tipo: valor >= 0 ? 'entrada' : 'saida',
        status_conciliacao: false,
        origem_arquivo: 'CSV',
      };
    } catch (error) {
      console.error('Error parsing CSV line:', error);
      return null;
    }
  }

  private static normalizeDate(dateStr: string): string {
    // Remove quotes and trim
    dateStr = dateStr.replace(/['"]/g, '').trim();
    
    // Try different date formats and convert to YYYY-MM-DD
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[1]) {
          // YYYY-MM-DD format (already correct)
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          // DD/MM/YYYY or DD-MM-YYYY format (convert to YYYY-MM-DD)
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        }
      }
    }

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

    return parseFloat(cleaned) || 0;
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
        const valor = parseFloat(trnAmt);
        const data_transacao = this.parseOFXDate(dtPosted);

        if (data_transacao && !isNaN(valor)) {
          transactions.push({
            id: fitId || `ofx_${Date.now()}_${transactions.length}`,
            data_transacao,
            descricao: memo,
            valor,
            tipo: valor >= 0 ? 'entrada' : 'saida',
            status_conciliacao: false,
            origem_arquivo: 'OFX',
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

          // Add origem_arquivo to all transactions
          transactions = transactions.map(t => ({
            ...t,
            origem_arquivo: file.name,
          }));

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsText(file);
    });
  }
}