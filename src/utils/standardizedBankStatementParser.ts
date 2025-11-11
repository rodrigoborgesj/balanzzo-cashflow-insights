import { parse } from 'papaparse';

// OFX Parser helper functions
function extractOFXValue(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<]+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function parseOFXDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return '';
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}

function parseOFXAmount(amountStr: string): number {
  if (!amountStr) return 0;
  return parseFloat(amountStr.replace(',', '.'));
}

export interface StandardizedBankTransaction {
  date: string; // YYYY-MM-DD format
  value: number; // with dot as decimal separator
  description: string;
  identifier?: string; // Unique bank identifier (e.g., Nubank UUID)
}

export interface StandardizedParseResult {
  transactions: StandardizedBankTransaction[];
  errors: string[];
  warnings: string[];
  processedRows: number;
  validRows: number;
}

/**
 * Standardized Bank Statement Parser
 * 
 * Expects CSV format with columns:
 * - Date: Transaction date (required)
 * - Value: Transaction amount (required) 
 * - Identifier: Internal bank identifier (ignored completely)
 * - Description: Transaction description (required)
 * 
 * If Identifier column is missing, processes with Date, Value, Description only.
 */
export class StandardizedBankStatementParser {
  private static readonly EXPECTED_COLUMNS = {
    DATE: 0,
    VALUE: 1, 
    IDENTIFIER: 2, // Always ignored
    DESCRIPTION: 3
  };

  private static readonly DATE_FORMATS = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // DD/MM/YY (2-digit year)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{2})$/, // DD-MM-YY (2-digit year)
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, // DD.MM.YY (2-digit year)
  ];

  /**
   * Parse standardized bank statement CSV or OFX file
   */
  static async parseFile(file: File): Promise<StandardizedParseResult> {
    console.log('🏦 Parsing standardized bank statement:', file.name);
    
    const result: StandardizedParseResult = {
      transactions: [],
      errors: [],
      warnings: [],
      processedRows: 0,
      validRows: 0
    };

    try {
      const content = await this.readFileContent(file);
      
      // Detect file type and delegate to appropriate parser
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (fileExtension === 'ofx') {
        console.log('📄 OFX file detected, using OFX parser');
        return await this.parseOFXFile(content);
      }
      
      // Continue with CSV parsing for non-OFX files
      
      if (!content || content.trim().length === 0) {
        result.errors.push('Arquivo vazio ou sem conteúdo válido');
        return result;
      }

      const delimiter = this.detectDelimiter(content);
      console.log('📋 Delimiter detected:', delimiter === '\t' ? 'TAB' : delimiter);

      const parseResult = parse(content, {
        delimiter,
        header: false,
        skipEmptyLines: true,
        trimFields: true,
        transform: (value: string) => value.trim()
      });

      if (parseResult.errors.length > 0) {
        console.warn('⚠️ Parse warnings:', parseResult.errors);
        result.warnings.push(...parseResult.errors.map(e => e.message));
      }

      const rows = parseResult.data as string[][];
      result.processedRows = rows.length;

      if (rows.length === 0) {
        result.errors.push('Arquivo não contém dados válidos');
        return result;
      }

      // Detect if first row is header
      const hasHeader = this.hasHeaderRow(rows[0]);
      const dataStartIndex = hasHeader ? 1 : 0;
      
      console.log('📊 Processing info:', {
        totalRows: rows.length,
        hasHeader,
        dataStartIndex,
        firstRow: rows[0]
      });

      // Determine column mapping based on file structure
      const columnMapping = this.determineColumnMapping(rows[0], hasHeader);
      console.log('🗂️ Column mapping:', columnMapping);

      // Process data rows
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row || row.length === 0) {
          continue;
        }

        const transaction = this.createTransactionFromRow(row, columnMapping, i + 1);
        
        if (transaction) {
          result.transactions.push(transaction);
          result.validRows++;
        } else {
          result.warnings.push(`Linha ${i + 1}: Dados insuficientes ou inválidos`);
        }
      }

      console.log('✅ Parse completed:', {
        processedRows: result.processedRows,
        validRows: result.validRows,
        errors: result.errors.length,
        warnings: result.warnings.length
      });

      return result;

    } catch (error) {
      console.error('❌ Error parsing file:', error);
      result.errors.push(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return result;
    }
  }

  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsText(file, 'utf-8');
    });
  }

  private static detectDelimiter(content: string): string {
    const sample = content.split('\n').slice(0, 5).join('\n');
    const delimiters = [',', ';', '\t', '|'];
    
    let bestDelimiter = ',';
    let maxConsistency = 0;

    for (const delimiter of delimiters) {
      const lines = sample.split('\n').filter(line => line.trim());
      if (lines.length < 2) continue;

      const counts = lines.map(line => (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length);
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
      
      const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length;
      const consistency = avgCount > 0 ? avgCount / (1 + variance) : 0;

      if (consistency > maxConsistency) {
        maxConsistency = consistency;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  private static hasHeaderRow(firstRow: string[]): boolean {
    const headerKeywords = ['data', 'date', 'valor', 'value', 'amount', 'descricao', 'description', 'identificador', 'identifier'];
    const rowText = firstRow.join(' ').toLowerCase();
    
    const keywordMatches = headerKeywords.filter(keyword => rowText.includes(keyword)).length;
    const hasDateValue = firstRow.some(cell => this.parseDate(cell) !== null);
    
    // Header if has keywords and no valid date values
    return keywordMatches >= 2 && !hasDateValue;
  }

  private static determineColumnMapping(firstRow: string[], hasHeader: boolean): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    if (hasHeader) {
      // Map based on header keywords
      firstRow.forEach((header, index) => {
        const normalized = header.toLowerCase().trim();
        
        if (normalized.includes('data') || normalized.includes('date')) {
          mapping.date = index;
        } else if (normalized.includes('valor') || normalized.includes('value') || normalized.includes('amount')) {
          mapping.value = index;
        } else if (normalized.includes('descricao') || normalized.includes('description') || normalized.includes('descrição')) {
          mapping.description = index;
        } else if (normalized.includes('identificador') || normalized.includes('identifier') || normalized.includes('id')) {
          mapping.identifier = index;
        }
      });
    }
    
    // Default mapping if no header or incomplete mapping
    if (!mapping.date || mapping.value === undefined || !mapping.description) {
      if (firstRow.length >= 4) {
        // Standard 4-column format: Date, Value, Identifier, Description  
        mapping.date = 0;
        mapping.value = 1;
        mapping.identifier = 2; // Now we capture the identifier
        mapping.description = 3;
      } else if (firstRow.length === 3) {
        // 3-column format without identifier: Date, Value, Description
        mapping.date = 0;
        mapping.value = 1; 
        mapping.description = 2;
      } else {
        // Fallback for any other format
        mapping.date = 0;
        mapping.value = firstRow.length > 1 ? 1 : 0;
        mapping.description = firstRow.length > 2 ? 2 : 1;
      }
    }
    
    return mapping;
  }

  private static createTransactionFromRow(
    row: string[], 
    mapping: Record<string, number>, 
    lineNumber: number
  ): StandardizedBankTransaction | null {
    
    try {
      // Extract and validate date
      const rawDate = row[mapping.date]?.trim();
      if (!rawDate) {
        console.warn(`Line ${lineNumber}: Empty date field`);
        return null;
      }

      const date = this.parseDate(rawDate);
      if (!date) {
        console.warn(`Line ${lineNumber}: Invalid date format - "${rawDate}"`);
        return null;
      }

      // Extract and validate value
      const rawValue = row[mapping.value]?.trim();
      if (!rawValue) {
        console.warn(`Line ${lineNumber}: Empty value field`);
        return null;
      }

      const value = this.parseAmount(rawValue);
      if (isNaN(value)) {
        console.warn(`Line ${lineNumber}: Invalid amount format - "${rawValue}"`);
        return null;
      }

      // Extract description
      const description = row[mapping.description]?.trim() || `Transaction line ${lineNumber}`;
      
      if (description.length < 2) {
        console.warn(`Line ${lineNumber}: Description too short - "${description}"`);
        return null;
      }

      // Extract identifier if available
      const identifier = mapping.identifier !== undefined 
        ? row[mapping.identifier]?.trim() 
        : undefined;

      return {
        date,
        value,
        description,
        identifier
      };

    } catch (error) {
      console.error(`Line ${lineNumber}: Error processing row -`, error);
      return null;
    }
  }

  private static parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    // Remove non-date characters
    const cleaned = dateStr.replace(/[^\d\/\-\.]/g, '');
    
    for (const format of this.DATE_FORMATS) {
      const match = cleaned.match(format);
      if (match) {
        let day: string, month: string, year: string;
        
        if (format === this.DATE_FORMATS[1]) { // YYYY-MM-DD
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

        // Validate date
        const dateObj = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        if (dateObj.getFullYear() == fullYear && 
            dateObj.getMonth() == parseInt(month) - 1 && 
            dateObj.getDate() == parseInt(day)) {
          return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    return null;
  }

  private static parseAmount(amountStr: string): number {
    if (!amountStr) return NaN;

    // Remove currency symbols and spaces
    let cleaned = amountStr.replace(/[R$\s€£¥₹₽]/g, '');
    
    // Handle parentheses for negative amounts
    const isNegative = cleaned.includes('(') && cleaned.includes(')');
    cleaned = cleaned.replace(/[()]/g, '');

    // Handle different decimal separators
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Format: 1.234.567,89 -> 1234567.89
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Format: 1234,89 -> 1234.89
      cleaned = cleaned.replace(',', '.');
    }
    // If only dots, assume already in correct format

    const amount = parseFloat(cleaned);
    return isNaN(amount) ? NaN : (isNegative ? -Math.abs(amount) : amount);
  }

  /**
   * Parse OFX file format
   */
  private static async parseOFXFile(content: string): Promise<StandardizedParseResult> {
    const result: StandardizedParseResult = {
      transactions: [],
      errors: [],
      warnings: [],
      processedRows: 0,
      validRows: 0
    };

    try {
      if (!content || content.trim().length === 0) {
        result.errors.push('Arquivo OFX vazio ou sem conteúdo válido');
        return result;
      }

      // Extract all transaction blocks
      const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
      const matches = content.matchAll(transactionRegex);

      let transactionCount = 0;
      for (const match of matches) {
        transactionCount++;
        const transactionBlock = match[1];

        try {
          const amountStr = extractOFXValue(transactionBlock, 'TRNAMT');
          const dateStr = extractOFXValue(transactionBlock, 'DTPOSTED');
          const memo = extractOFXValue(transactionBlock, 'MEMO') || 
                      extractOFXValue(transactionBlock, 'NAME') || 
                      'Transação OFX';

          if (!dateStr || !amountStr) {
            result.warnings.push(`Transação OFX ${transactionCount}: Dados incompletos (data ou valor ausente)`);
            continue;
          }

          const date = parseOFXDate(dateStr);
          const value = parseOFXAmount(amountStr);

          if (!date || isNaN(value)) {
            result.warnings.push(`Transação OFX ${transactionCount}: Formato inválido`);
            continue;
          }

          result.transactions.push({
            date,
            value,
            description: memo
          });
          
          result.validRows++;
        } catch (error) {
          result.warnings.push(`Transação OFX ${transactionCount}: Erro ao processar - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      result.processedRows = transactionCount;

      console.log('✅ OFX Parse completed:', {
        processedRows: result.processedRows,
        validRows: result.validRows,
        errors: result.errors.length,
        warnings: result.warnings.length
      });

      if (result.transactions.length === 0 && transactionCount === 0) {
        result.errors.push('Nenhuma transação encontrada no arquivo OFX. Verifique se o arquivo está no formato correto.');
      }

      return result;

    } catch (error) {
      console.error('❌ Error parsing OFX file:', error);
      result.errors.push(`Erro ao processar arquivo OFX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return result;
    }
  }
}