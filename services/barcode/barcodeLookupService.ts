/**
 * Barcode Lookup Service
 * Tries multiple free APIs in fallback order to find product info
 */

interface BarcodeResult {
  barcode: string;
  type: string;
  source: string | null;
  confidence: number;
  product: {
    name?: string;
    manufacturer?: string;
    ingredients?: string[];
    package?: string;
    dosage?: string;
    image?: string;
  };
  fetchedUrls: Array<{
    url: string;
    status: number;
    timeMs: number;
    result: 'found' | 'no-result' | 'error';
  }>;
  rawResponse?: any;
  timestamp: string;
}

interface ServiceResult {
  found: boolean;
  source?: string;
  confidence?: number;
  product?: any;
  rawResponse?: any;
  fetchedUrls: Array<{
    url: string;
    status: number;
    timeMs: number;
    result: 'found' | 'no-result' | 'error';
  }>;
}

export class BarcodeLookupService {
  private static instance: BarcodeLookupService;
  private euriApiKey: string;
  private apiBaseUrl: string = 'https://api.euron.one/api/v1/euri/chat/completions';

  private constructor() {
    this.euriApiKey = process.env.EXPO_PUBLIC_EURI_API_KEY || '';
  }

  public static getInstance(): BarcodeLookupService {
    if (!BarcodeLookupService.instance) {
      BarcodeLookupService.instance = new BarcodeLookupService();
    }
    return BarcodeLookupService.instance;
  }

  /**
   * Main lookup function with fallback chain
   */
  async lookupBarcode(barcode: string, type: string): Promise<BarcodeResult> {
    const result: BarcodeResult = {
      barcode,
      type,
      source: null,
      confidence: 0,
      product: {},
      fetchedUrls: [],
      timestamp: new Date().toISOString(),
    };

    // Try each service in order
    const services = [
      () => this.tryOpenFoodFacts(barcode),
      () => this.tryOpenFDA(barcode),
      () => this.tryUPCItemDB(barcode),
      () => this.tryAILookup(barcode),
    ];

    for (const service of services) {
      try {
        const serviceResult = await service();
        
        if (serviceResult) {
          result.fetchedUrls.push(...serviceResult.fetchedUrls);
          
          if (serviceResult.found && serviceResult.source && serviceResult.product) {
            result.source = serviceResult.source;
            result.product = serviceResult.product;
            result.confidence = serviceResult.confidence || 0;
            result.rawResponse = serviceResult.rawResponse;
            break;
          }
        }
      } catch (error) {
        console.error('Service error:', error);
      }
    }

    return result;
  }

  /**
   * Try OpenFoodFacts API (free, global food database)
   */
  private async tryOpenFoodFacts(barcode: string): Promise<ServiceResult> {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, { method: 'GET' });
      const timeMs = Date.now() - startTime;
      const data = await response.json();

      const fetchInfo = {
        url,
        status: response.status,
        timeMs,
        result: data.status === 1 ? 'found' as const : 'no-result' as const,
      };

      if (data.status === 1 && data.product) {
        const product = data.product;
        return {
          found: true,
          source: 'OpenFoodFacts',
          confidence: 0.85,
          product: {
            name: product.product_name || product.generic_name,
            manufacturer: product.brands || product.manufacturer,
            ingredients: product.ingredients_text ? [product.ingredients_text] : [],
            package: product.quantity,
            image: product.image_url,
          },
          rawResponse: data,
          fetchedUrls: [fetchInfo],
        };
      }

      return {
        found: false,
        fetchedUrls: [fetchInfo],
      };

    } catch (error) {
      return {
        found: false,
        fetchedUrls: [{
          url,
          status: 0,
          timeMs: Date.now() - startTime,
          result: 'error' as const,
        }],
      };
    }
  }

  /**
   * Try OpenFDA API (free, US drug/device database)
   */
  private async tryOpenFDA(barcode: string): Promise<ServiceResult> {
    const url = `https://api.fda.gov/drug/ndc.json?search=product_ndc:${barcode}&limit=1`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, { method: 'GET' });
      const timeMs = Date.now() - startTime;
      const data = await response.json();

      const fetchInfo = {
        url,
        status: response.status,
        timeMs,
        result: data.results && data.results.length > 0 ? 'found' as const : 'no-result' as const,
      };

      if (data.results && data.results.length > 0) {
        const product = data.results[0];
        return {
          found: true,
          source: 'OpenFDA',
          confidence: 0.9,
          product: {
            name: product.brand_name || product.generic_name,
            manufacturer: product.labeler_name,
            dosage: product.dosage_form,
            package: product.packaging?.[0]?.description,
          },
          rawResponse: data,
          fetchedUrls: [fetchInfo],
        };
      }

      return {
        found: false,
        fetchedUrls: [fetchInfo],
      };

    } catch (error) {
      return {
        found: false,
        fetchedUrls: [{
          url,
          status: 0,
          timeMs: Date.now() - startTime,
          result: 'error' as const,
        }],
      };
    }
  }

  /**
   * Try UPCItemDB trial API (free limited trial)
   */
  private async tryUPCItemDB(barcode: string): Promise<ServiceResult> {
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, { method: 'GET' });
      const timeMs = Date.now() - startTime;
      const data = await response.json();

      const fetchInfo = {
        url,
        status: response.status,
        timeMs,
        result: data.items && data.items.length > 0 ? 'found' as const : 'no-result' as const,
      };

      if (data.items && data.items.length > 0) {
        const product = data.items[0];
        return {
          found: true,
          source: 'UPCItemDB',
          confidence: 0.75,
          product: {
            name: product.title,
            manufacturer: product.brand,
            package: product.description,
            image: product.images?.[0],
          },
          rawResponse: data,
          fetchedUrls: [fetchInfo],
        };
      }

      return {
        found: false,
        fetchedUrls: [fetchInfo],
      };

    } catch (error) {
      return {
        found: false,
        fetchedUrls: [{
          url,
          status: 0,
          timeMs: Date.now() - startTime,
          result: 'error' as const,
        }],
      };
    }
  }

  /**
   * Use AI to analyze barcode and suggest medicine info (using Euron API)
   */
  private async tryAILookup(barcode: string): Promise<ServiceResult> {
    if (!this.euriApiKey) {
      return { found: false, fetchedUrls: [] };
    }

    const url = `ai-inference`;
    const startTime = Date.now();

    try {
      const prompt = `You are a medicine database expert. A user scanned a barcode: "${barcode}".

Based on this barcode number, try to identify if this could be a medicine and provide your best guess about:
1. Medicine name (if you can identify the pattern)
2. Manufacturer (if the barcode prefix indicates a known company)
3. Country of origin (based on barcode prefix)

Common barcode prefixes:
- 890: India
- 489: Hong Kong
- 628: Saudi Arabia
- US NDC codes are typically 10-11 digits

Return ONLY a JSON object:
{
  "found": true/false,
  "confidence": 0.0-1.0,
  "name": "medicine name or null",
  "manufacturer": "manufacturer or null",
  "notes": "any additional info about the barcode pattern",
  "suggestion": "suggest user to manual enter or take photo of packaging"
}`;

      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.euriApiKey}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4.1-nano',
          max_tokens: 512,
          temperature: 0.2,
        }),
      });

      const timeMs = Date.now() - startTime;
      const data = await response.json();

      if (data.choices && data.choices[0]) {
        const text = data.choices[0].message.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const parsed = JSON.parse(text);

        return {
          found: parsed.found,
          source: 'AI Analysis',
          confidence: parsed.confidence,
          product: {
            name: parsed.name,
            manufacturer: parsed.manufacturer,
          },
          rawResponse: parsed,
          fetchedUrls: [{
            url,
            status: 200,
            timeMs,
            result: parsed.found ? 'found' as const : 'no-result' as const,
          }],
        };
      }

      return { found: false, fetchedUrls: [] };

    } catch (error) {
      return { found: false, fetchedUrls: [] };
    }
  }
}