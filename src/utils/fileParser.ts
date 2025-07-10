export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  category?: string;
  status: 'pendente' | 'conciliado';
}

export class FileParser {
  static parseCSV(content: string): Transaction[] {
    const lines = content.split('\n').filter(line => line.trim());
    const transactions: Transaction[] = [];

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

  private static createTransactionFromCSV(fields: string[], index: number): Transaction | null {
    try {
      // Common CSV formats: [date, description, amount] or [date, description, debit, credit]
      let date = fields[0];
      let description = fields[1];
      let amount: number;

      // Try to parse date
      date = this.normalizeDate(date);
      if (!date) return null;

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

      if (isNaN(amount)) return null;

      return {
        id: `import_${Date.now()}_${index}`,
        date,
        description,
        amount,
        type: amount >= 0 ? 'entrada' : 'saida',
        status: 'pendente',
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
        if (format === formats[1]) {
          // YYYY-MM-DD format
          return `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[1]}`;
        } else {
          // DD/MM/YYYY or DD-MM-YYYY format
          return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
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

  static parseOFX(content: string): Transaction[] {
    const transactions: Transaction[] = [];
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

        if (date && !isNaN(amount)) {
          transactions.push({
            id: fitId || `ofx_${Date.now()}_${transactions.length}`,
            date,
            description: memo,
            amount,
            type: amount >= 0 ? 'entrada' : 'saida',
            status: 'pendente',
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
      return `${day}/${month}/${year}`;
    }
    return '';
  }

  static async parseFile(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const extension = file.name.toLowerCase().split('.').pop();

        try {
          let transactions: Transaction[] = [];

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