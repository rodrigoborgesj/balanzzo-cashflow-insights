import { parse } from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';

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
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+às\s+\d{2}:\d{2}:\d{2}$/, // DD/MM/YY às HH:MM:SS (XP Investimentos)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{2})$/, // DD-MM-YY (2-digit year)
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, // DD.MM.YY (2-digit year)
  ];

  /**
   * Detect if content is from a credit card statement (fatura)
   */
  private static isCreditCardStatement(content: string): boolean {
    const lowerContent = content.toLowerCase();
    // Account statements (e.g., Asaas) frequently mention "fatura" (invoice) in
    // transaction descriptions without being credit card statements. Require
    // stronger indicators specific to credit card invoices to avoid flipping
    // legitimate credits into expenses.
    const creditCardIndicators = [
      'fatura de cartão',
      'fatura do cartão',
      'fatura de cartao',
      'fatura do cartao',
      'cartão de crédito',
      'cartao de credito',
      'credit card statement',
      'limite disponível',
      'limite disponivel',
      'melhor dia de compra',
      'vencimento da fatura',
    ];
    return creditCardIndicators.some(k => lowerContent.includes(k));
  }

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
      
      // Detect if this is a credit card statement
      const isCreditCard = this.isCreditCardStatement(content);
      if (isCreditCard) {
        console.log('💳 Credit card statement detected - all values will be treated as negative (expenses)');
      }
      
      // Detect file type and delegate to appropriate parser
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (fileExtension === 'ofx') {
        console.log('📄 OFX file detected, using OFX parser');
        return await this.parseOFXFile(content);
      }
      
      if (fileExtension === 'pdf') {
        console.log('📄 PDF file detected, using PDF parser');
        return await this.parsePDFFile(file);
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
        transform: (value: string) => value.trim(),
        quoteChar: '"' // Handle quoted values like "R$ 189,90"
      });

      if (parseResult.errors.length > 0) {
        console.warn('⚠️ Parse warnings:', parseResult.errors);
        result.warnings.push(...parseResult.errors.map(e => e.message));
      }

      let rows = parseResult.data as string[][];
      result.processedRows = rows.length;

      if (rows.length === 0) {
        result.errors.push('Arquivo não contém dados válidos');
        return result;
      }

      // Find the actual header row (Sicredi has metadata lines before the header)
      // Look for rows containing date/description/value headers
      let headerIndex = -1;
      for (let i = 0; i < Math.min(rows.length, 25); i++) {
        // Clean the row cells before checking for header
        const cleanedRow = rows[i].map(cell => cell.trim());
        if (this.hasHeaderRow(cleanedRow)) {
          headerIndex = i;
          console.log(`📋 Header found at line ${i + 1}:`, rows[i]);
          break;
        }
      }

      // Skip all lines before the header and the header itself
      const dataStartIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
      rows = rows.slice(dataStartIndex);
      
      console.log(`📊 Data starts at original line ${dataStartIndex + 1}, ${rows.length} data rows to process`);

      // Determine column mapping based on the header row
      const headerRow = headerIndex >= 0 ? parseResult.data[headerIndex] as string[] : rows[0];
      const hasHeader = headerIndex >= 0;
      
      // Determine column mapping based on file structure
      const columnMapping = this.determineColumnMapping(headerRow, hasHeader);
      console.log('🗂️ Column mapping:', columnMapping);
      
      console.log('📊 Processing info:', {
        totalDataRows: rows.length,
        hasHeader,
        columnMapping,
        sampleRow: rows[0]
      });

      // Process data rows
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row || row.length === 0) {
          continue;
        }

        const transaction = this.createTransactionFromRow(row, columnMapping, i + 1, isCreditCard);
        
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
    const headerKeywords = ['data', 'date', 'valor', 'value', 'amount', 'descricao', 'description', 'identificador', 'identifier', 'descrição', 'parcela'];
    const rowText = firstRow.join(' ').toLowerCase();
    
    const keywordMatches = headerKeywords.filter(keyword => rowText.includes(keyword)).length;
    const hasDateValue = firstRow.some(cell => this.parseDate(cell) !== null);
    
    // Header if has keywords and no valid date values
    const isHeader = keywordMatches >= 2 && !hasDateValue;
    
    if (isHeader) {
      console.log(`📋 Header row detected with ${keywordMatches} keyword matches:`, firstRow);
    }
    
    return isHeader;
  }

  private static determineColumnMapping(firstRow: string[], hasHeader: boolean): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    if (hasHeader) {
      // Map based on header keywords
      firstRow.forEach((header, index) => {
        const normalized = header.toLowerCase().trim();

        // Date columns - must be exact "data" or start with "data de" but NOT "data de vencimento"
        if (mapping.date === undefined) {
          const isDateColumn = 
            normalized === 'data' || 
            normalized === 'date' ||
            (normalized.startsWith('data') && !normalized.includes('vencimento'));
          
          if (isDateColumn) {
            mapping.date = index;
            console.log(`📅 Date column found at index ${index}: "${header}"`);
            return;
          }
        }

        // Skip "saldo" column completely (XP Investimentos and other banks)
        if (normalized.includes('saldo') || normalized.includes('balance')) {
          console.log(`📊 Ignoring balance column at index ${index}: "${header}"`);
          return;
        }

        // Skip foreign currency value columns
        const isForeignValue =
          normalized.includes('valor em dólar') ||
          normalized.includes('valor em dolar') ||
          normalized.includes('dólar') ||
          normalized.includes('dolar');

        if (isForeignValue) {
          console.log(`💵 Ignoring foreign value column at index ${index}: "${header}"`);
          return;
        }

        // Main value column (use the first valid match only)
        // Must be exactly "valor" or "value" or "amount", not compound terms
        if (mapping.value === undefined) {
          const isValueColumn = 
            normalized === 'valor' || 
            normalized === 'value' || 
            normalized === 'amount' ||
            (normalized.includes('valor') && !normalized.includes('dólar') && !normalized.includes('dolar'));
          
          if (isValueColumn) {
            mapping.value = index;
            console.log(`💰 Value column found at index ${index}: "${header}"`);
            return;
          }
        }

        // Description columns - must contain "descri" (covers descrição, descricao, description)
        if (mapping.description === undefined) {
          const isDescriptionColumn = 
            normalized.includes('descricao') || 
            normalized.includes('descrição') || 
            normalized.includes('description') ||
            normalized === 'descri';
          
          if (isDescriptionColumn) {
            mapping.description = index;
            console.log(`📝 Description column found at index ${index}: "${header}"`);
            return;
          }
        }

        // Optional identifier column
        if ((normalized.includes('identificador') || normalized.includes('identifier') || normalized.includes(' id')) && mapping.identifier === undefined) {
          mapping.identifier = index;
        }
      });

      // Log the final mapping found from headers
      console.log('📋 Column mapping from headers:', mapping);
    }
    
    // Default mapping if no header or incomplete mapping
    if (mapping.date === undefined || mapping.value === undefined || mapping.description === undefined) {
      console.log('⚠️ Incomplete mapping, applying defaults. Current:', mapping, 'Row length:', firstRow.length);
      
      if (firstRow.length >= 4) {
        // Standard 4-column format: Date, Value, Identifier, Description  
        if (mapping.date === undefined) mapping.date = 0;
        if (mapping.value === undefined) mapping.value = 1;
        if (mapping.identifier === undefined) mapping.identifier = 2;
        if (mapping.description === undefined) mapping.description = 3;
      } else if (firstRow.length === 3) {
        // 3-column format without identifier: Date, Value, Description
        if (mapping.date === undefined) mapping.date = 0;
        if (mapping.value === undefined) mapping.value = 1; 
        if (mapping.description === undefined) mapping.description = 2;
      } else {
        // Fallback for any other format
        if (mapping.date === undefined) mapping.date = 0;
        if (mapping.value === undefined) mapping.value = firstRow.length > 1 ? 1 : 0;
        if (mapping.description === undefined) mapping.description = firstRow.length > 2 ? 2 : 1;
      }
      
      console.log('📋 Final column mapping with defaults:', mapping);
    }
    
    return mapping;
  }

  private static createTransactionFromRow(
    row: string[], 
    mapping: Record<string, number>, 
    lineNumber: number,
    isCreditCard: boolean = false
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

      let value = this.parseAmount(rawValue);
      if (isNaN(value)) {
        console.warn(`Line ${lineNumber}: Invalid amount format - "${rawValue}"`);
        return null;
      }

      // For credit card statements, all transactions are expenses (negative values)
      if (isCreditCard && value > 0) {
        value = -value;
        console.log(`💳 Line ${lineNumber}: Converted to negative (credit card expense): ${rawValue} → ${value}`);
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

    // Remove timestamp from XP Investimentos format (DD/MM/YY às HH:MM:SS)
    let cleaned = dateStr;
    if (cleaned.includes(' às ')) {
      cleaned = cleaned.split(' às ')[0];
    }
    
    // Remove any time portion (e.g., "2025-11-05 10:30:00" -> "2025-11-05")
    cleaned = cleaned.split(' ')[0];
    
    // Remove non-date characters except separators
    cleaned = cleaned.replace(/[^\d\/\-\.]/g, '');
    
    // Check for YYYY-MM-DD format first (ISO format)
    const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const fullYear = parseInt(year);
      const dateObj = new Date(fullYear, parseInt(month) - 1, parseInt(day));
      if (dateObj.getFullYear() === fullYear && 
          dateObj.getMonth() === parseInt(month) - 1 && 
          dateObj.getDate() === parseInt(day)) {
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Check other date formats (DD/MM/YYYY, DD-MM-YYYY, etc.)
    for (const format of this.DATE_FORMATS) {
      // Skip the ISO format as we already checked it
      if (format.source.includes('\\d{4})-')) continue;
      
      const match = cleaned.match(format);
      if (match) {
        let day: string, month: string, year: string;
        [, day, month, year] = match;

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

    // Remove currency symbols, spaces, and quotes
    let cleaned = amountStr.replace(/[R$\s€£¥₹₽"]/g, '');
    
    // Handle parentheses for negative amounts
    const isNegative = cleaned.includes('(') && cleaned.includes(')') || cleaned.includes('-');
    cleaned = cleaned.replace(/[()-]/g, '');

    // Handle different decimal separators
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Format: 1.234.567,89 -> 1234567.89
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Format: 1234,89 or "R$ 189,90" -> 1234.89
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

  /**
   * Parse PDF bank statement file
   */
  private static async parsePDFFile(file: File): Promise<StandardizedParseResult> {
    console.log('📄 Starting PDF parse');
    
    const result: StandardizedParseResult = {
      transactions: [],
      errors: [],
      warnings: [],
      processedRows: 0,
      validRows: 0
    };

    try {
      // Configure PDF.js worker - using local worker file
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

      // Extract lines grouped by Y coordinate to preserve layout (needed for
      // banks like Banrisul where description sits on the line below the value)
      const layoutLines: string[] = [];
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Group items by rounded Y position (top→bottom, left→right)
        const rows = new Map<number, Array<{ x: number; str: string }>>();
        for (const item of textContent.items as any[]) {
          if (!item.str || !item.transform) continue;
          const y = Math.round(item.transform[5]);
          const x = item.transform[4];
          if (!rows.has(y)) rows.set(y, []);
          rows.get(y)!.push({ x, str: item.str });
        }
        const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a);
        for (const y of sortedYs) {
          const rowItems = rows.get(y)!.sort((a, b) => a.x - b.x);
          const line = rowItems.map(r => r.str).join(' ').replace(/\s+/g, ' ').trim();
          if (line) layoutLines.push(line);
        }

        fullText += (textContent.items as any[]).map(i => i.str).join(' ') + '\n';
      }

      console.log('📄 Text extracted from PDF, analyzing transactions...');

      // Detect Banrisul layout and delegate to a specific parser
      const upperFull = fullText.toUpperCase();
      if (upperFull.includes('BANRISUL') && /MOVIMENTOS\s+[A-Z]{3}\/\d{4}/.test(upperFull)) {
        console.log('🏦 Banrisul statement detected, using Banrisul PDF parser');
        return this.parseBanrisulPDFLines(layoutLines);
      }

      // Split text into lines for intelligent parsing
      let lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      console.log(`📄 Total lines extracted: ${lines.length}`);

      // PRE-PROCESSING: Reconstruct fragmented transactions
      // Banks like Sicredi and Itaú Empresas extract transactions across multiple lines
      console.log('🔧 Pre-processing: Reconstructing fragmented transactions...');
      
      const reconstructedLines: string[] = [];
      let currentBlock: string[] = [];
      let blockStarted = false;

      // Keywords to ignore even if line starts with date (balance lines)
      const balanceKeywords = [
        'SALDO EM CONTA CORRENTE',
        'SALDO TOTAL DISPONÍVEL DIA',
        'SALDO TOTAL DISPONIVEL DIA',
        'SALDO ANTERIOR',
        'SALDO DISPONÍVEL',
        'SALDO DISPONIVEL',
        'SALDO TOTAL',
        'LIMITE DA CONTA',
        'LIMITE DISPONÍVEL',
        'AGÊNCIA',
        'CONTA'
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if line starts with a date (DD/MM/YYYY or D/M/YYYY)
        const startsWithDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line);
        
        if (startsWithDate) {
          // Check if this is a balance/summary line (should be ignored)
          const isBalanceLine = balanceKeywords.some(keyword => 
            line.toUpperCase().includes(keyword)
          );
          
          // Check if second word after date is "SALDO"
          const parts = line.split(/\s+/);
          const secondWordIsSaldo = parts.length > 1 && parts[1].toUpperCase() === 'SALDO';
          
          if (isBalanceLine || secondWordIsSaldo) {
            console.log(`⏭️ Ignoring balance line: ${line.substring(0, 60)}...`);
            
            // If we had a block started, save it first
            if (blockStarted && currentBlock.length > 0) {
              const reconstructed = currentBlock.join(' ').replace(/\s+/g, ' ').trim();
              reconstructedLines.push(reconstructed);
              console.log(`✅ Saved block before balance line: ${reconstructed.substring(0, 80)}...`);
              currentBlock = [];
              blockStarted = false;
            }
            
            continue; // Skip this balance line
          }
          
          // If we already had a block, save it first
          if (blockStarted && currentBlock.length > 0) {
            const reconstructed = currentBlock.join(' ').replace(/\s+/g, ' ').trim();
            reconstructedLines.push(reconstructed);
            console.log(`✅ Block: ${reconstructed.substring(0, 100)}...`);
          }
          
          // Start new block with this date line
          currentBlock = [line];
          blockStarted = true;
        } else if (blockStarted) {
          // Add line to current block (it's a continuation of the transaction)
          currentBlock.push(line);
          
          // Check if this line ends with a monetary value (transaction complete)
          // Look for value at the END of the line: number with comma as decimal
          // Pattern: [+/-]?digits with optional thousand separators, comma, 2 decimals
          // Examples: 39,44 | -380,00 | 1.234,56 | -2.345,67 | +500,00
          const valueMatch = line.match(/([+-]?\d{1,3}(?:\.\d{3})*,\d{2})\s*$/);
          
          if (valueMatch) {
            // Transaction complete - save and reset
            const reconstructed = currentBlock.join(' ').replace(/\s+/g, ' ').trim();
            reconstructedLines.push(reconstructed);
            console.log(`✅ Complete: ${reconstructed.substring(0, 100)}...`);
            currentBlock = [];
            blockStarted = false;
          }
        }
      }
      
      // Save last block if exists (some PDFs might not end with a value)
      if (blockStarted && currentBlock.length > 0) {
        const reconstructed = currentBlock.join(' ').replace(/\s+/g, ' ').trim();
        // Check if it has a value at the end before saving
        const hasValue = /([+-]?\d{1,3}(?:\.\d{3})*,\d{2})\s*$/.test(reconstructed);
        if (hasValue) {
          reconstructedLines.push(reconstructed);
          console.log(`✅ Final: ${reconstructed.substring(0, 100)}...`);
        } else {
          console.log(`⚠️ Discarding incomplete block (no value): ${reconstructed.substring(0, 80)}...`);
        }
      }
      
      console.log(`📄 Reconstructed ${reconstructedLines.length} transaction blocks from ${lines.length} original lines`);
      
      // Replace original lines with reconstructed ones
      lines = reconstructedLines;

      // Blocked phrases that indicate non-transaction lines (balance, summaries, etc.)
      const blockedPhrases = [
        'saldo total disponível dia',
        'saldo total disponivel dia',
        'saldo em conta corrente',
        'saldo anterior',
        'saldo disponivel',
        'saldo disponível',
        'saldo em',
        'saldo total',
        'limite da conta',
        'utilizado',
        'disponível',
        'disponivel',
        'agência',
        'agencia',
        'conta',
        'lançamentos do período',
        'lancamentos do periodo'
      ];

      const foundTransactions = new Set<string>();
      let transactionCount = 0;
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];
        
        // Check if line starts with a valid date (DD/MM/YYYY)
        const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.*)$/);
        
        if (!dateMatch) {
          i++;
          continue;
        }

        const dateStr = dateMatch[1];
        let remainingText = dateMatch[2].trim();

        // Check if this line contains blocked phrases (balance lines, not transactions)
        const lowerLine = line.toLowerCase();
        const isBlocked = blockedPhrases.some(phrase => lowerLine.includes(phrase));

        if (isBlocked) {
          console.log(`⏭️ Skipping balance/summary line: ${line.substring(0, 60)}...`);
          i++;
          continue;
        }

        // Try to extract amount from current line
        // Pattern: value at the end, format: -?1.234,56 or -?1234,56
        const amountPattern = /(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
        let amountMatch = remainingText.match(amountPattern);
        let description = remainingText;
        let amountStr = '';

        if (amountMatch) {
          // Amount found on same line
          amountStr = amountMatch[1];
          description = remainingText.substring(0, remainingText.lastIndexOf(amountStr)).trim();
        } else {
          // Amount might be on next lines, collect description until we find a value
          let j = i + 1;
          let descriptionParts = [remainingText];
          
          while (j < lines.length && j < i + 5) { // Look ahead max 5 lines
            const nextLine = lines[j].trim();
            
            // Stop if next line starts with a date (new transaction)
            if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(nextLine)) {
              break;
            }

            // Check if this line contains the amount
            const nextAmountMatch = nextLine.match(amountPattern);
            if (nextAmountMatch) {
              amountStr = nextAmountMatch[1];
              const beforeAmount = nextLine.substring(0, nextLine.lastIndexOf(amountStr)).trim();
              if (beforeAmount) {
                descriptionParts.push(beforeAmount);
              }
              i = j; // Update main counter to skip processed lines
              break;
            } else {
              // Add to description
              descriptionParts.push(nextLine);
            }
            
            j++;
          }
          
          description = descriptionParts.join(' ').trim();
        }

        // If no amount found, skip this entry
        if (!amountStr) {
          console.log(`⏭️ No amount found for date ${dateStr}, skipping`);
          i++;
          continue;
        }

        // Clean up description
        description = description.replace(/\s+/g, ' ').substring(0, 200);

        // Validate minimum description length
        if (description.length < 3) {
          console.log(`⏭️ Description too short for ${dateStr}: "${description}"`);
          i++;
          continue;
        }

        // Create unique key to avoid duplicates
        const uniqueKey = `${dateStr}-${amountStr}-${description.substring(0, 20)}`;
        if (foundTransactions.has(uniqueKey)) {
          i++;
          continue;
        }
        foundTransactions.add(uniqueKey);

        transactionCount++;

        try {
          // Parse date
          const date = this.parseDate(dateStr);
          if (!date) {
            result.warnings.push(`Transação ${transactionCount}: Data inválida (${dateStr})`);
            i++;
            continue;
          }

          // Parse amount (Brazilian format: 1.234,56)
          const value = this.parseAmount(amountStr.replace('R$', '').trim());
          if (isNaN(value) || value === 0) {
            result.warnings.push(`Transação ${transactionCount}: Valor inválido (${amountStr})`);
            i++;
            continue;
          }

          console.log(`✅ Transaction found: ${dateStr} | ${description.substring(0, 30)}... | ${amountStr}`);

          result.transactions.push({
            date,
            value,
            description
          });
          
          result.validRows++;
        } catch (error) {
          result.warnings.push(`Transação ${transactionCount}: Erro ao processar - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }

        i++;
      }

      result.processedRows = transactionCount;

      console.log('✅ PDF Parse completed:', {
        processedRows: result.processedRows,
        validRows: result.validRows,
        errors: result.errors.length,
        warnings: result.warnings.length
      });

      if (result.transactions.length === 0) {
        result.errors.push('Nenhuma transação encontrada no PDF. Verifique se o arquivo contém um extrato bancário no formato esperado.');
        result.warnings.push('Formatos esperados: Data (DD/MM/YYYY), Descrição, Valor (R$ 1.234,56)');
      }

      return result;

    } catch (error) {
      console.error('❌ Error parsing PDF file:', error);
      result.errors.push(`Erro ao processar arquivo PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return result;
    }
  }

  /**
   * Banrisul-specific PDF parser.
   * The Banrisul PJ statement puts the day + histórico + document + value on one
   * line, and the counterparty (NOME: ...) on the following line. Subsequent
   * transactions on the same day omit the day prefix.
   */
  private static parseBanrisulPDFLines(lines: string[]): StandardizedParseResult {
    const result: StandardizedParseResult = {
      transactions: [],
      errors: [],
      warnings: [],
      processedRows: 0,
      validRows: 0
    };

    const MONTHS: Record<string, number> = {
      JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6,
      JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12
    };

    // Lines that must be ignored (balances, limits, investment positions, etc.)
    const EXCLUDE_PATTERNS = [
      'SALDO DISPONIVEL', 'SALDO DISPONÍVEL',
      'SALDO INICIAL', 'SALDO ANTERIOR', 'SALDO ANT', 'SALDO NA DATA', 'SALDO EM',
      'SALDO LIVRE', 'SALDO ATUAL', 'SALDO TOTAL',
      'INVEST RESGATE', 'INVESTIMENTOS BANRISUL', 'CDB AUTOMATICO',
      'RESGATE AUTOMATICO CDB', 'VALOR EM CDB',
      'LIMITE DA CONTA', 'LIMITE DISPONIVEL', 'LIMITE DISPONÍVEL',
      'LIMITE TOTAL', 'LIMITE UTILIZADO', 'LIMITE........',
      'UTILIZADO.....', 'DISPONIVEL....', 'DISPONÍVEL....',
      'ENCARGOS FINANCEIROS', 'TAXA DE JUROS', 'CUSTO EFETIVO TOTAL',
      'VENCIMENTO DA CONTA', 'BANRICOMPRAS A PRAZO',
      'TEB PJ', 'TARIFA ECONOMICA', 'BENEFICIOS ADICIONAIS',
      'QUANTIDADE DE OPER', 'POSICAO EM',
      'PARA SIMPLES CONFERENCIA', 'IDENTIFICACAO', 'AGENCIA:',
      'CONTA..', 'NOME...', 'DIA HISTORICO', 'MOVIMENTOS DA CONTA',
      'PREZADO CLIENTE', 'VALORES DISPONIVEIS'
    ];

    let currentMonth: number | null = null;
    let currentYear: number | null = null;
    let currentDay: number | null = null;
    let lastTx: StandardizedBankTransaction | null = null;

    // Value at end: 1.234,56 optionally followed by '-' (debit marker)
    const valueRe = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*(-)?\s*$/;
    const monthRe = /MOVIMENTOS\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/(\d{4})/i;
    const nomeRe = /^NOME\s*[:.]\s*(.+)$/i;
    const dayLeadRe = /^(\d{1,2})\s+([A-Za-zÀ-ÿ].*)$/;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Section header (month/year)
      const mm = line.match(monthRe);
      if (mm) {
        currentMonth = MONTHS[mm[1].toUpperCase()];
        currentYear = parseInt(mm[2], 10);
        currentDay = null;
        continue;
      }

      // Counterparty line — attach to previous transaction
      const nm = line.match(nomeRe);
      if (nm && lastTx) {
        const counterparty = nm[1].replace(/\s+/g, ' ').trim();
        if (counterparty.length >= 2) {
          lastTx.description = `${lastTx.description} - ${counterparty}`.substring(0, 200);
        }
        continue;
      }

      // Skip excluded lines
      const upper = line.toUpperCase();
      if (EXCLUDE_PATTERNS.some(p => upper.includes(p))) continue;

      // Must have a value at the end to be a transaction line
      const vm = line.match(valueRe);
      if (!vm) continue;

      const isNegative = vm[2] === '-';
      const numeric = this.parseAmount(vm[1]);
      if (isNaN(numeric) || numeric === 0) continue;
      const value = isNegative ? -Math.abs(numeric) : Math.abs(numeric);

      // Content before the value
      const before = line.substring(0, line.length - vm[0].length).trim();

      // Optional day prefix (only present on the first tx of the day)
      let historico = before;
      const dm = before.match(dayLeadRe);
      if (dm) {
        const d = parseInt(dm[1], 10);
        if (d >= 1 && d <= 31) {
          currentDay = d;
          historico = dm[2];
        }
      }

      // Strip trailing document number (typically 6+ digits)
      historico = historico.replace(/\s+\d{5,}\s*$/, '').trim();

      if (!historico || historico.length < 3) continue;
      if (currentMonth === null || currentYear === null || currentDay === null) continue;

      // Guard: some balance snippets slip through
      if (EXCLUDE_PATTERNS.some(p => historico.toUpperCase().includes(p))) continue;

      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

      const tx: StandardizedBankTransaction = {
        date,
        value,
        description: historico.replace(/\s+/g, ' ').substring(0, 200)
      };
      result.transactions.push(tx);
      result.validRows++;
      result.processedRows++;
      lastTx = tx;
    }

    console.log('✅ Banrisul PDF parse completed:', {
      transactions: result.transactions.length
    });

    if (result.transactions.length === 0) {
      result.errors.push('Nenhuma transação encontrada no extrato Banrisul.');
    }

    return result;
  }
}
}