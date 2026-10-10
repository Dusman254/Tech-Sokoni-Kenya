import {
  CategoryId,
  ProductCondition,
  ProductVariationGroup,
} from '../types/store';
import {
  ParsedProductResult,
  parseAndEnforceExactUserSpecs,
} from '../utils/exactProductParser';

export type AiGeneratedProductPayload = Partial<ParsedProductResult> & {
  condition?: ProductCondition;
};

export interface GenerateProductServiceOptions {
  /**
   * Raw product title or specification string provided by the admin.
   */
  productTitle: string;
  /**
   * Optional category hint currently selected in the form.
   */
  categoryHint?: CategoryId;
  /**
   * Whether product variations are explicitly enabled by the admin.
   * Defaults to false so variations are NEVER auto-enabled unless requested.
   */
  includeVariations?: boolean;
}

export interface GeneratedProductFields {
  name: string;
  brand: string;
  category: CategoryId;
  condition: ProductCondition;
  sku: string;
  price: number;
  shortSpec: string;
  shortDescription: string;
  specs: {
    processor: string;
    ram: string;
    storage: string;
    screenSize: string;
    graphics: string;
    color: string;
    os: string;
    battery: string;
    ports: string;
    weight: string;
    warranty: string;
  };
  variations: ProductVariationGroup[];
}

/**
 * Dedicated Admin Dashboard AI Service using the Gemini API (/api/ai/generate-product)
 * combined with deterministic exact-token verification so that every feature written
 * in the product title is strictly matched in Product Name, SKU, Short Summary,
 * Key Configuration, and Technical Specifications.
 */
export const AiProductService = {
  async generateFromTitle(
    options: GenerateProductServiceOptions
  ): Promise<GeneratedProductFields> {
    const query = options.productTitle.trim();
    if (!query) {
      throw new Error('Please provide a product title to auto-generate fields.');
    }

    let rawAiData: AiGeneratedProductPayload = {};

    try {
      const response = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          includeVariations: Boolean(options.includeVariations),
        }),
      });

      if (response.ok) {
        rawAiData = await response.json();
      }
    } catch {
      // Fallback to deterministic local parser if network/API is unreachable
    }

    const validCategories: CategoryId[] = [
      'laptops',
      'phones',
      'desktops',
      'monitors',
      'printers',
      'tablets',
      'accessories',
      'networking',
      'storage',
    ];

    const resolvedCategory: CategoryId = validCategories.includes(
      rawAiData.category as CategoryId
    )
      ? (rawAiData.category as CategoryId)
      : options.categoryHint || 'laptops';

    // Strictly enforce every feature/token present in the user's input title
    const enforced = parseAndEnforceExactUserSpecs(query, {
      ...rawAiData,
      category: resolvedCategory,
    });

    const validConditions: ProductCondition[] = ['New', 'Refurbished', 'Used'];
    const resolvedCondition: ProductCondition = validConditions.includes(
      rawAiData.condition as ProductCondition
    )
      ? (rawAiData.condition as ProductCondition)
      : /\b(refurbished|renewed)\b/i.test(query)
      ? 'Refurbished'
      : /\b(used|pre-owned|ex-uk)\b/i.test(query)
      ? 'Used'
      : 'New';

    return {
      name: enforced.name,
      brand: enforced.brand,
      category: enforced.category,
      condition: resolvedCondition,
      sku: enforced.sku,
      price: enforced.price > 0 ? enforced.price : 65000,
      shortSpec: enforced.shortSpec,
      shortDescription: enforced.shortDescription,
      specs: {
        processor: enforced.processor,
        ram: enforced.ram,
        storage: enforced.storage,
        screenSize: enforced.screenSize,
        graphics: enforced.graphics,
        color: enforced.color,
        os: enforced.os,
        battery: enforced.battery,
        ports: enforced.ports,
        weight: enforced.weight,
        warranty: enforced.warranty,
      },
      // Only return variations when explicitly turned ON by the admin
      variations: options.includeVariations ? enforced.variations : [],
    };
  },
};
