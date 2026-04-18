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

export async function getPageMetadata(url: string): Promise<PageMetadata> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const metaTitle =
      (doc.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('meta[name="twitter:title"]') as HTMLMetaElement)?.content?.trim() ||
      doc.title.trim();
    const title = metaTitle || doc.querySelector('h1')?.textContent?.trim() || 'No title';
    const metaDesc =
      (doc.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('meta[name="description"]') as HTMLMetaElement)?.content?.trim() ||
      '';
    const description = metaDesc;
    const author =
      (doc.querySelector('meta[name="author"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('meta[property="article:author"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('meta[name="twitter:creator"]') as HTMLMetaElement)?.content?.trim() ||
      '';
    const siteName =
      (doc.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content?.trim() ||
      new URL(url).hostname.replace(/^www\./i, '');
    const image =
      (doc.querySelector('meta[property="og:image"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('meta[name="twitter:image"]') as HTMLMetaElement)?.content?.trim() ||
      '';
    const canonicalUrl = (doc.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href?.trim() || url;
    const ogType =
      (doc.querySelector('meta[property="og:type"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('meta[name="twitter:card"]') as HTMLMetaElement)?.content?.trim() ||
      '';
    const publishedAt =
      (doc.querySelector('meta[property="article:published_time"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('meta[name="pubdate"]') as HTMLMetaElement)?.content?.trim() ||
      (doc.querySelector('time')?.getAttribute('datetime') || '').trim() ||
      '';
    const keywords =
      (doc.querySelector('meta[name="keywords"]') as HTMLMetaElement)?.content
        ?.split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean) || [];
    
    // Get main readable text (limit to avoid huge payloads)
    const main = doc.querySelector('main') || doc.querySelector('article') || doc.body;
    const text = main?.textContent?.trim().slice(0, 10000) || '';

    return {
      title,
      description,
      text,
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
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Page load timeout - try shorter URL or later');
      }
    }
    // Fallback
    return {
      title: new URL(url).hostname,
      description: '',
      text: '',
      url,
      siteName: new URL(url).hostname.replace(/^www\./i, ''),
    };
  }
}

