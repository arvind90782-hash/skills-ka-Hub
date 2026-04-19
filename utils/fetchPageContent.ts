export interface PageMetadata {
  title: string;
  description: string;
  text: string;
  url: string;
  author?: string;
  siteName?: string;
  image?: string;
  canonicalUrl?: string;
  ogType?: string;
  publishedAt?: string;
  keywords?: string[];
}

const readMeta = (html: string, attrName: string, attrValue: string): string => {
  const metaPattern = new RegExp(
    `<meta[^>]+${attrName}=["']${attrValue}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    'i'
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attrName}=["']${attrValue}["'][^>]*>`,
    'i'
  );

  return metaPattern.exec(html)?.[1]?.trim() || reversePattern.exec(html)?.[1]?.trim() || '';
};

const readTitle = (html: string): string => {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
};

const readCanonical = (html: string): string => {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1]?.trim() || '';
};

const stripHtml = (html: string): string => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export async function getPageMetadata(url: string): Promise<PageMetadata> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const pageUrl = new URL(url);
    const fallbackSite = pageUrl.hostname.replace(/^www\./i, '');

    const title =
      readMeta(html, 'property', 'og:title') ||
      readMeta(html, 'name', 'twitter:title') ||
      readTitle(html) ||
      fallbackSite;
    const description =
      readMeta(html, 'property', 'og:description') || readMeta(html, 'name', 'description') || '';
    const author =
      readMeta(html, 'name', 'author') ||
      readMeta(html, 'property', 'article:author') ||
      readMeta(html, 'name', 'twitter:creator') ||
      '';
    const siteName = readMeta(html, 'property', 'og:site_name') || fallbackSite;
    const image = readMeta(html, 'property', 'og:image') || readMeta(html, 'name', 'twitter:image') || '';
    const canonicalUrl = readCanonical(html) || url;
    const ogType = readMeta(html, 'property', 'og:type') || readMeta(html, 'name', 'twitter:card') || '';
    const publishedAt =
      readMeta(html, 'property', 'article:published_time') ||
      readMeta(html, 'name', 'pubdate') ||
      html.match(/<time[^>]+datetime=["']([^"']+)["'][^>]*>/i)?.[1]?.trim() ||
      '';

    const keywordString = readMeta(html, 'name', 'keywords');
    const keywords = keywordString
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const bodyMatch =
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
      html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ||
      html;

    return {
      title,
      description,
      text: stripHtml(bodyMatch).slice(0, 10000),
      url,
      author,
      siteName,
      image,
      canonicalUrl,
      ogType,
      publishedAt,
      keywords,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Page load timeout - try again later.');
    }

    const fallbackUrl = new URL(url);
    const hostname = fallbackUrl.hostname.replace(/^www\./i, '');

    return {
      title: hostname,
      description: '',
      text: '',
      url,
      siteName: hostname,
    };
  }
}

