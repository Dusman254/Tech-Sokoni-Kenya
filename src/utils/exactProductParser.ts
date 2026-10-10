import { STUDIO_IMAGES } from '../data/initialCatalog';
import {
  CategoryId,
  ProductVariationGroup,
} from '../types/store';

export interface ParsedProductResult {
  name: string;
  sku: string;
  brand: string;
  category: CategoryId;
  price: number;
  shortSpec: string;
  shortDescription: string;
  description: string;
  processor: string;
  ram: string;
  storage: string;
  screenSize: string;
  color: string;
  os: string;
  graphics: string;
  ports: string;
  battery: string;
  weight: string;
  warranty: string;
  variations: ProductVariationGroup[];
  defaultImg: string;
}

/**
 * Extracts exact user-written specifications from a raw input string
 * and merges/enforces them on top of any AI-generated or default values.
 */
export function parseAndEnforceExactUserSpecs(
  rawInput: string,
  aiCandidate?: Partial<ParsedProductResult>
): ParsedProductResult {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  // 1. Detect Category
  let detectedCategory: CategoryId = aiCandidate?.category || 'laptops';
  let skuPrefix = 'LPT';
  let defaultImg = STUDIO_IMAGES.laptopPro;

  if (
    /\b(iphone|galaxy|pixel|redmi|xiaomi|infinix|tecno|oneplus|smartphone|phone)\b/i.test(
      text
    )
  ) {
    detectedCategory = 'phones';
    skuPrefix = 'PHN';
    defaultImg = STUDIO_IMAGES.smartphoneUltra;
  } else if (
    /\b(monitor|display|ultrasharp|odyssey|proart|screen)\b/i.test(text) &&
    !/\b(laptop|macbook|notebook|elitebook|thinkpad|pavilion|xps)\b/i.test(text)
  ) {
    detectedCategory = 'monitors';
    skuPrefix = 'MON';
    defaultImg = STUDIO_IMAGES.monitorStudio;
  } else if (
    /\b(printer|laserjet|officejet|pixma|ecotank|scanner|copier|toner)\b/i.test(
      text
    )
  ) {
    detectedCategory = 'printers';
    skuPrefix = 'PRT';
    defaultImg = STUDIO_IMAGES.printerLaser;
  } else if (/\b(ipad|tablet|galaxy tab|surface pro)\b/i.test(text)) {
    detectedCategory = 'tablets';
    skuPrefix = 'TBL';
    defaultImg = STUDIO_IMAGES.tabletPro;
  } else if (
    /\b(router|wifi|wi-fi|switch|unifi|mikrotik|tp-link|starlink|access point|mesh)\b/i.test(
      text
    )
  ) {
    detectedCategory = 'networking';
    skuPrefix = 'NET';
    defaultImg = STUDIO_IMAGES.networkingRouter;
  } else if (
    /\b(headphone|earbud|airpods|wh-1000|keyboard|mouse|charger|cable|adapter|dock|speaker)\b/i.test(
      text
    )
  ) {
    detectedCategory = 'accessories';
    skuPrefix = 'ACC';
    defaultImg = STUDIO_IMAGES.headphonesAnc;
  } else if (
    /\b(mac studio|mac mini|imac|optiplex|prodesk|elitedesk|thinkcentre|workstation|desktop|all-in-one|tower)\b/i.test(
      text
    )
  ) {
    detectedCategory = 'desktops';
    skuPrefix = 'DSK';
    defaultImg = STUDIO_IMAGES.desktopWorkstation;
  } else if (
    /\b(external ssd|portable ssd|hard drive|hdd|flash drive|nas|sanDisk|t7|t9)\b/i.test(
      text
    )
  ) {
    detectedCategory = 'storage';
    skuPrefix = 'STR';
  } else if (
    /\b(ps5|playstation|xbox|nintendo|steam deck|rog|alienware|legion|omen|predator|gaming)\b/i.test(
      text
    )
  ) {
    detectedCategory = 'gaming';
    skuPrefix = 'GAM';
  }

  // 2. Detect Brand explicitly mentioned by user
  const brandPatterns: Array<[RegExp, string]> = [
    [/\b(apple|macbook|iphone|ipad|imac|airpods|mac studio|mac mini)\b/i, 'Apple'],
    [/\b(hp|hewlett|elitebook|probook|spectre|envy|pavilion|omen|victus|laserjet|zbook)\b/i, 'HP'],
    [/\b(dell|xps|latitude|inspiron|alienware|optiplex|precision|vostro|ultrasharp)\b/i, 'Dell'],
    [/\b(lenovo|thinkpad|ideapad|yoga|legion|thinkbook|thinkcentre)\b/i, 'Lenovo'],
    [/\b(samsung|galaxy|odyssey)\b/i, 'Samsung'],
    [/\b(asus|zenbook|vivobook|rog|tuf|proart)\b/i, 'ASUS'],
    [/\b(acer|swift|aspire|predator|nitro)\b/i, 'Acer'],
    [/\b(microsoft|surface|xbox)\b/i, 'Microsoft'],
    [/\b(sony|playstation|ps5|bravia|wh-1000)\b/i, 'Sony'],
    [/\b(google|pixel)\b/i, 'Google'],
    [/\b(canon|pixma|imageprograf)\b/i, 'Canon'],
    [/\b(epson|ecotank)\b/i, 'Epson'],
    [/\b(lg|ultrapc|gram|ultragear)\b/i, 'LG'],
    [/\b(ubiquiti|unifi)\b/i, 'Ubiquiti'],
    [/\b(logitech|mx master)\b/i, 'Logitech'],
    [/\b(keychron)\b/i, 'Keychron'],
  ];

  let explicitBrand = '';
  for (const [regex, brandName] of brandPatterns) {
    if (regex.test(text)) {
      explicitBrand = brandName;
      break;
    }
  }
  const finalBrand = explicitBrand || aiCandidate?.brand || 'Tech Sokoni';

  // 3. Extract Explicit Processor if written by user
  const cpuMatch =
    text.match(
      /\b((?:intel\s+)?core\s+(?:ultra\s+[579]|i[3579])(?:\s*-\s*\w+|\s+\d{4,5}\w*)?(?:\s+\d+(?:th|rd|nd)\s+gen)?)/i
    ) ||
    text.match(/\b(apple\s+m[1234](?:\s+(?:pro|max|ultra))?|\bm[1234]\s+(?:pro|max|ultra)|\bm[1234]\s+chip\b)/i) ||
    text.match(/\b(amd\s+ryzen\s+[3579](?:\s+\d{4}\w*)?|ryzen\s+[3579](?:\s+\d{4}\w*)?)/i) ||
    text.match(/\b(snapdragon\s+[\w\s]+?(?=\b\d+gb|\bstorage|\bram|$))/i) ||
    text.match(/\b(a1[5678]\s*(?:pro|bionic)?)/i) ||
    text.match(/\b(xeon\s+[\w-]+|celeron\s*\w*|pentium\s*\w*)/i);

  const explicitProcessor = cpuMatch ? cpuMatch[1].trim() : '';

  // 4. Extract Explicit RAM & Storage
  // Look for patterns like "16GB RAM", "32 GB Memory", and storage like "512GB SSD", "1TB NVMe", "256GB"
  const ramExplicitMatch =
    text.match(/\b(\d+\s*(?:GB|TB))\s*(?:unified\s*)?(?:RAM|Memory|LPDDR\w*|DDR\d)/i) ||
    text.match(/(?:RAM|Memory)[:\s]+(\d+\s*(?:GB|TB))/i);

  const storageExplicitMatch =
    text.match(
      /\b(\d+\s*(?:GB|TB))\s*(?:PCIe\s*)?(?:NVMe\s*)?(?:M\.2\s*)?(?:SSD|HDD|Storage|ROM|UFS)/i
    ) || text.match(/(?:Storage|SSD|ROM)[:\s]+(\d+\s*(?:GB|TB)(?:\s*SSD|\s*NVMe)?)/i);

  // Also handle shorthand like "16GB/512GB" or "8GB 256GB"
  const slashComboMatch = text.match(
    /\b(\d+\s*GB)\s*[/+,-]\s*(\d+\s*(?:GB|TB)(?:\s*SSD)?)\b/i
  );

  // Collect all standalone GB/TB tokens if not matched with keywords
  const allCapacityTokens = Array.from(
    text.matchAll(/\b(\d+)\s*(GB|TB)\b/gi)
  ).map((m) => ({
    raw: `${m[1]}${m[2].toUpperCase()}`,
    val: Number(m[1]),
    unit: m[2].toUpperCase(),
  }));

  let explicitRam = ramExplicitMatch
    ? ramExplicitMatch[1].replace(/\s+/g, '').toUpperCase()
    : slashComboMatch
    ? slashComboMatch[1].replace(/\s+/g, '').toUpperCase()
    : '';

  let explicitStorage = storageExplicitMatch
    ? storageExplicitMatch[1].replace(/\s+/g, '').toUpperCase()
    : slashComboMatch
    ? slashComboMatch[2].replace(/\s+/g, '').toUpperCase()
    : '';

  if (!explicitRam || !explicitStorage) {
    for (const tok of allCapacityTokens) {
      if (tok.unit === 'TB' && !explicitStorage) {
        explicitStorage = `${tok.raw} SSD`;
      } else if (tok.unit === 'GB') {
        if (tok.val <= 64 && !explicitRam && detectedCategory !== 'storage') {
          explicitRam = tok.raw;
        } else if (tok.val >= 64 && !explicitStorage) {
          explicitStorage =
            detectedCategory === 'phones' || detectedCategory === 'tablets'
              ? tok.raw
              : `${tok.raw} SSD`;
        }
      }
    }
  }

  if (
    explicitStorage &&
    !explicitStorage.includes('SSD') &&
    (detectedCategory === 'laptops' || detectedCategory === 'desktops')
  ) {
    explicitStorage = `${explicitStorage} SSD`;
  }

  // 5. Extract Explicit Screen Size
  const screenMatch =
    text.match(/\b(\d{1,2}(?:\.\d)?)\s*(?:"|''|inch|inches|-inch|in\b)/i) ||
    text.match(/\b(13\.3|13\.6|14\.0|14\.2|15\.6|16\.0|16\.2|17\.3|24|27|32|34|49)\b/);
  const explicitScreen = screenMatch ? `${screenMatch[1]}"` : '';

  // 6. Extract Explicit Color
  const colorMatch = text.match(
    /\b(Space\s+Black|Space\s+Gray|Space\s+Grey|Natural\s+Titanium|Black\s+Titanium|White\s+Titanium|Desert\s+Titanium|Platinum\s+Silver|Natural\s+Silver|Classic\s+Silver|Midnight|Starlight|Graphite|Obsidian|Silver|Black|White|Grey|Gray|Gold|Rose\s+Gold|Blue|Green|Titanium)\b/i
  );
  const explicitColor = colorMatch ? colorMatch[1] : '';

  // 7. Extract Explicit OS
  const osMatch = text.match(
    /\b(Windows\s*11(?:\s*Pro|\s*Home)?|Windows\s*10(?:\s*Pro)?|macOS(?:\s*\w+)?|iOS\s*\d*|iPadOS\s*\d*|Android\s*\d*|Ubuntu|Linux|FreeDOS)\b/i
  );
  const explicitOs = osMatch ? osMatch[1] : '';

  // 8. Extract Explicit Graphics / GPU
  const gpuMatch = text.match(
    /\b((?:NVIDIA\s+)?(?:GeForce\s+)?RTX\s*\d{4}(?:\s*Ti|\s*Super|\s*Ada)?|(?:NVIDIA\s+)?GTX\s*\d{4}|Intel\s+Iris\s+Xe|Intel\s+Arc(?:\s+Pro)?|AMD\s+Radeon\s+\w+|Integrated\s+Graphics)\b/i
  );
  const explicitGpu = gpuMatch ? gpuMatch[1] : '';

  // 9. Extract Explicit Price if user wrote "KSh 85,000", "KES 85000", or "price 85000"
  const priceMatch =
    text.match(/\b(?:KSh|KES|Kshs?|\$)\s*[:=.]?\s*(\d[\d,]*)/i) ||
    text.match(/\b(?:price)\s*[:=]?\s*(\d[\d,]*)/i);
  const explicitPrice = priceMatch
    ? Number(priceMatch[1].replace(/,/g, ''))
    : 0;

  // Resolve Final Specifications (User Explicit ALWAYS wins over AI candidate, which wins over smart defaults)
  const finalProcessor =
    explicitProcessor ||
    aiCandidate?.processor ||
    (finalBrand === 'Apple'
      ? detectedCategory === 'phones'
        ? 'Apple A18 Pro'
        : 'Apple M4 Pro'
      : detectedCategory === 'phones'
      ? 'Snapdragon 8 Elite'
      : 'Intel Core i7 / Ultra 7');

  const finalRam =
    explicitRam ||
    aiCandidate?.ram ||
    (detectedCategory === 'phones' ? '12GB' : '16GB');

  const finalStorage =
    explicitStorage ||
    aiCandidate?.storage ||
    (detectedCategory === 'phones' ? '256GB' : '512GB SSD');

  const finalScreen =
    explicitScreen ||
    aiCandidate?.screenSize ||
    (detectedCategory === 'phones'
      ? '6.7"'
      : detectedCategory === 'monitors'
      ? '27.0"'
      : '15.6"');

  const finalColor = explicitColor || aiCandidate?.color || 'Space Black';

  const finalOs =
    explicitOs ||
    aiCandidate?.os ||
    (finalBrand === 'Apple'
      ? detectedCategory === 'phones'
        ? 'iOS 18'
        : detectedCategory === 'tablets'
        ? 'iPadOS 18'
        : 'macOS Sequoia'
      : detectedCategory === 'phones' || detectedCategory === 'tablets'
      ? 'Android 15'
      : 'Windows 11 Pro');

  const finalGraphics =
    explicitGpu ||
    aiCandidate?.graphics ||
    (finalBrand === 'Apple'
      ? 'Integrated Apple GPU (Hardware Ray Tracing)'
      : 'Intel Iris Xe / Integrated Studio Graphics');

  const finalPrice =
    explicitPrice ||
    aiCandidate?.price ||
    (detectedCategory === 'phones'
      ? 68000
      : detectedCategory === 'accessories'
      ? 8500
      : detectedCategory === 'printers'
      ? 36000
      : 85000);

  // Build clean Product Name preserving user's exact input
  let cleanTitle = text
    .replace(/\b(?:KSh|KES|Kshs?|\$)\s*[:=.]?\s*\d[\d,]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleanTitle.length > 0) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  } else {
    cleanTitle = aiCandidate?.name || `${finalBrand} Hardware System`;
  }

  // Build exact Key Configuration (`shortSpec`) reflecting the exact resolved specs
  const specParts = [
    finalProcessor,
    finalRam ? `${finalRam} RAM`.replace(/RAM\s+RAM/i, 'RAM') : '',
    finalStorage,
    finalScreen,
    finalColor,
  ].filter(Boolean);
  const finalShortSpec = specParts.join(' · ');

  const finalShortDescription =
    aiCandidate?.shortDescription &&
    (!explicitRam || aiCandidate.shortDescription.includes(explicitRam))
      ? aiCandidate.shortDescription
      : `${cleanTitle} configured with ${finalProcessor}, ${finalRam} memory, ${finalStorage} storage, and a ${finalScreen} display in ${finalColor}.`;

  const finalDescription =
    aiCandidate?.description ||
    `${cleanTitle} delivers reliable performance for professional and everyday workflows. Featuring ${finalProcessor}, ${finalRam} RAM, ${finalStorage}, and ${finalGraphics}, backed by Tech Sokoni Kenya warranty support.`;

  const randomCode = Math.floor(100 + Math.random() * 899);
  const finalSku =
    aiCandidate?.sku && aiCandidate.sku.startsWith('TS-')
      ? aiCandidate.sku
      : `TS-${skuPrefix}-${randomCode}`;

  // Build Product Variations incorporating the exact user values as the base option (+KSh 0)
  const variations: ProductVariationGroup[] = [
    {
      id: `var-storage-${Date.now()}`,
      name: 'Storage',
      options: Array.from(
        new Set([finalStorage, '256GB SSD', '512GB SSD', '1TB NVMe SSD', '2TB NVMe SSD'])
      )
        .slice(0, 4)
        .map((label, idx) => ({
          id: `st-${idx}`,
          label,
          priceDelta: label === finalStorage ? 0 : idx * 12000,
          inStock: true,
        })),
    },
    {
      id: `var-ram-${Date.now() + 1}`,
      name: 'RAM',
      options: Array.from(new Set([finalRam, '8GB', '16GB', '32GB', '64GB']))
        .slice(0, 4)
        .map((label, idx) => ({
          id: `ram-${idx}`,
          label,
          priceDelta: label === finalRam ? 0 : idx * 9500,
          inStock: true,
        })),
    },
    {
      id: `var-color-${Date.now() + 2}`,
      name: 'Color',
      options: Array.from(
        new Set([finalColor, 'Space Black', 'Natural Silver', 'Titanium Gray'])
      )
        .slice(0, 3)
        .map((label, idx) => ({
          id: `col-${idx}`,
          label,
          priceDelta: 0,
          inStock: true,
        })),
    },
    {
      id: `var-screen-${Date.now() + 3}`,
      name: 'Screen Size',
      options: Array.from(
        new Set([
          finalScreen,
          detectedCategory === 'phones' ? '6.3"' : '14.0"',
          detectedCategory === 'phones' ? '6.9"' : '16.0"',
        ])
      )
        .slice(0, 3)
        .map((label, idx) => ({
          id: `scr-${idx}`,
          label,
          priceDelta: label === finalScreen ? 0 : idx === 1 ? -8000 : 12000,
          inStock: true,
        })),
    },
  ];

  return {
    name: cleanTitle,
    sku: finalSku,
    brand: finalBrand,
    category: detectedCategory,
    price: finalPrice,
    shortSpec: finalShortSpec,
    shortDescription: finalShortDescription,
    description: finalDescription,
    processor: finalProcessor,
    ram: finalRam,
    storage: finalStorage,
    screenSize: finalScreen,
    color: finalColor,
    os: finalOs,
    graphics: finalGraphics,
    ports:
      aiCandidate?.ports ||
      'USB-C / Thunderbolt, HDMI, Wi-Fi 6E/7, Bluetooth 5.3',
    battery: aiCandidate?.battery || 'All-Day High-Density Li-Ion Battery',
    weight:
      aiCandidate?.weight ||
      (detectedCategory === 'phones' ? '215 g' : '1.58 kg'),
    warranty:
      aiCandidate?.warranty || '2 Years Official Tech Sokoni Hardware Warranty',
    variations,
    defaultImg,
  };
}
