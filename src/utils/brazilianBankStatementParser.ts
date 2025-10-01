import { parse } from 'papaparse';

export interface BrazilianBankTransaction {
  date: string;
  description: string;
  amount: number;
}

export class BrazilianBankStatementParser {
  private static readonly COMMON_HEADERS = {
    date: ['data', 'date', 'dt'],
    description: ['descrição', 'descricao', 'description', 'desc', 'historico'],
    amount: ['valor', 'amount', 'quantia'],
    debit: ['debito', 'débito', 'debit', 'saida', 'saída'],
    credit: ['credito', 'crédito', 'credit', 'entrada']
  };

  private static readonly IGNORE_COLUMNS = [
    'identificador', 'identifier', 'id', 'categoria', 'category', 
    'tags', 'tag', 'tipo', 'type', 'status'
  ];

  /**
   * Parse Brazilian bank statement file (CSV or TXT)
   */
  static async parseFile(file: File): Promise<BrazilianBankTransaction[]> {
    try {
      const content = await this.readFileContent(file);
      const delimiter = this.detectDelimiter(content);
      
      const parseResult = parse(content, {
        delimiter,
        header: false,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.toLowerCase().trim()
      });

      if (parseResult.errors.length > 0) {
        console.warn('Parse warnings:', parseResult.errors);
      }

      const rows = parseResult.data as string[][];
      if (rows.length === 0) return [];

      const columnMapping = this.detectColumnMapping(rows);
      const hasHeader = this.hasHeaderRow(rows[0]);
      const dataRows = hasHeader ? rows.slice(1) : rows;

      return this.processRows(dataRows, columnMapping);
    } catch (error) {
      console.error('Error parsing Brazilian bank statement:', error);
      throw new Error('Failed to parse bank statement file');
    }
  }

  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'utf-8');
    });
  }

  private static detectDelimiter(content: string): string {
    const lines = content.split('\n').slice(0, 5);
    const delimiters = [',', ';', '\t', '|'];
    
    let bestDelimiter = ',';
    let maxColumns = 0;

    for (const delimiter of delimiters) {
      const avgColumns = lines.reduce((sum, line) => {
        return sum + line.split(delimiter).length;
      }, 0) / lines.length;

      if (avgColumns > maxColumns) {
        maxColumns = avgColumns;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  private static detectColumnMapping(rows: string[][]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    if (rows.length === 0) return mapping;

    const firstRow = rows[0];
    const isHeader = this.hasHeaderRow(firstRow);
    const headerRow = isHeader ? firstRow : null;

    // Try to map based on headers first
    if (headerRow) {
      headerRow.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().trim();
        
        // Skip ignored columns
        if (this.IGNORE_COLUMNS.some(ignored => normalizedHeader.includes(ignored))) {
          return;
        }

        // Map common headers
        Object.entries(this.COMMON_HEADERS).forEach(([field, keywords]) => {
          if (keywords.some(keyword => normalizedHeader.includes(keyword))) {
            mapping[field] = index;
          }
        });
      });
    }

    // If no headers or incomplete mapping, try heuristic detection
    if (!mapping.date || !mapping.description || (!mapping.amount && !mapping.debit && !mapping.credit)) {
      this.applyHeuristicMapping(rows, mapping);
    }

    return mapping;
  }

  private static hasHeaderRow(firstRow: string[]): boolean {
    return firstRow.some(cell => {
      const normalized = cell.toLowerCase().trim();
      return Object.values(this.COMMON_HEADERS).flat().some(keyword => 
        normalized.includes(keyword)
      );
    });
  }

  private static applyHeuristicMapping(rows: string[][], mapping: Record<string, number>): void {
    if (rows.length < 2) return;

    const sampleRows = rows.slice(0, Math.min(5, rows.length));
    
    sampleRows[0].forEach((_, index) => {
      const columnSamples = sampleRows.map(row => row[index] || '');
      
      // Detect date column
      if (!mapping.date && this.isDateColumn(columnSamples)) {
        mapping.date = index;
      }
      
      // Detect amount/value column
      if (!mapping.amount && !mapping.debit && !mapping.credit && this.isAmountColumn(columnSamples)) {
        mapping.amount = index;
      }
      
      // Detect description column (usually the longest text column)
      if (!mapping.description && this.isDescriptionColumn(columnSamples)) {
        mapping.description = index;
      }
    });
  }

  private static isDateColumn(samples: string[]): boolean {
    return samples.filter(sample => this.isValidDate(sample)).length >= samples.length * 0.7;
  }

  private static isAmountColumn(samples: string[]): boolean {
    return samples.filter(sample => this.isValidAmount(sample)).length >= samples.length * 0.7;
  }

  private static isDescriptionColumn(samples: string[]): boolean {
    const avgLength = samples.reduce((sum, sample) => sum + sample.length, 0) / samples.length;
    return avgLength > 10 && samples.every(sample => sample.length > 3);
  }

  private static processRows(rows: string[][], mapping: Record<string, number>): BrazilianBankTransaction[] {
    const transactions: BrazilianBankTransaction[] = [];

    for (const row of rows) {
      try {
        const transaction = this.parseRow(row, mapping);
        if (transaction && this.isValidTransaction(transaction)) {
          transactions.push(transaction);
        }
      } catch (error) {
        // Skip invalid rows silently
        continue;
      }
    }

    return transactions;
  }

  private static parseRow(row: string[], mapping: Record<string, number>): BrazilianBankTransaction | null {
    const dateStr = row[mapping.date]?.trim();
    const description = row[mapping.description]?.trim();
    
    if (!dateStr || !description) return null;

    const date = this.parseDate(dateStr);
    if (!date) return null;

    let amount = 0;

    // Handle single amount column
    if (mapping.amount !== undefined) {
      const amountStr = row[mapping.amount]?.trim();
      amount = this.parseAmount(amountStr);
    }
    // Handle separate debit/credit columns
    else if (mapping.debit !== undefined || mapping.credit !== undefined) {
      const debitStr = mapping.debit !== undefined ? row[mapping.debit]?.trim() : '';
      const creditStr = mapping.credit !== undefined ? row[mapping.credit]?.trim() : '';
      
      const debitAmount = this.parseAmount(debitStr);
      const creditAmount = this.parseAmount(creditStr);
      
      amount = creditAmount - debitAmount;
    }

    return {
      date,
      description,
      amount
    };
  }

  private static parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    // Remove common prefixes/suffixes
    const cleaned = dateStr.replace(/[^\d\/\-\.]/g, '');
    
    // Try different date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // DD/MM/YY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{2})$/, // DD-MM-YY
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
      /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, // DD.MM.YY
    ];

    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        let day, month, year;
        
        if (format === formats[2]) { // YYYY-MM-DD
          [, year, month, day] = match;
        } else { // DD/MM/YYYY variants
          [, day, month, year] = match;
        }

        // Handle 2-digit year format (YY)
        let fullYear = parseInt(year);
        if (year.length === 2) {
          const twoDigitYear = parseInt(year);
          const currentYear = new Date().getFullYear();
          const currentCentury = Math.floor(currentYear / 100) * 100;
          
          // If year is in the future (e.g., 25 when we're in 2025), use previous century
          // If year is reasonable past (e.g., 20-24), use current century
          if (twoDigitYear > (currentYear % 100)) {
            fullYear = currentCentury - 100 + twoDigitYear;
          } else {
            fullYear = currentCentury + twoDigitYear;
          }
          
          console.log(`📅 2-digit year detected: ${year} → ${fullYear} (current year: ${currentYear})`);
        }

        const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        if (date.getFullYear() == fullYear && 
            date.getMonth() == parseInt(month) - 1 && 
            date.getDate() == parseInt(day)) {
          return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    return null;
  }

  private static parseAmount(amountStr: string): number {
    if (!amountStr) return 0;

    // Remove R$ and other currency symbols
    let cleaned = amountStr.replace(/[R$\s]/g, '');
    
    // Handle parentheses for negative amounts
    const isNegative = cleaned.includes('(') && cleaned.includes(')');
    cleaned = cleaned.replace(/[()]/g, '');

    // Handle Brazilian number format: 1.234.567,89 -> 1234567.89
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Remove thousand separators (dots) and replace decimal comma
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      // Only comma present, assume it's decimal separator
      cleaned = cleaned.replace(',', '.');
    }

    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : (isNegative ? -Math.abs(amount) : amount);
  }

  private static isValidDate(dateStr: string): boolean {
    return this.parseDate(dateStr) !== null;
  }

  private static isValidAmount(amountStr: string): boolean {
    if (!amountStr) return false;
    const amount = this.parseAmount(amountStr);
    return !isNaN(amount);
  }

  private static isValidTransaction(transaction: BrazilianBankTransaction): boolean {
    return transaction.date !== '' && 
           transaction.description !== '' && 
           !isNaN(transaction.amount) &&
           transaction.description.length > 2;
  }
}