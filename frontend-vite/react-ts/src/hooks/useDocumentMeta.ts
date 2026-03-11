import { useEffect } from 'react';

interface DocumentMeta {
  title?: string;
  description?: string;
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_TITLE = 'LabelGenius - Fast Barcode Label Generator | CSV to Barcode';
const DEFAULT_DESCRIPTION =
  'Generate barcode labels from Excel/CSV in seconds. Free barcode generator for inventory and warehouse labels.';

function setMetaTag(name: string, content: string, attribute = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function useDocumentMeta({ title, description, jsonLd }: DocumentMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:description', description, 'property');
      setMetaTag('twitter:description', description, 'name');
    }

    if (title) {
      setMetaTag('og:title', title, 'property');
      setMetaTag('twitter:title', title, 'name');
    }

    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prevTitle;
      if (description) {
        setMetaTag('description', DEFAULT_DESCRIPTION);
        setMetaTag('og:description', DEFAULT_DESCRIPTION, 'property');
        setMetaTag('twitter:description', DEFAULT_DESCRIPTION, 'name');
      }
      if (title) {
        setMetaTag('og:title', DEFAULT_TITLE, 'property');
        setMetaTag('twitter:title', DEFAULT_TITLE, 'name');
      }
      if (scriptEl) {
        document.head.removeChild(scriptEl);
      }
    };
  }, [title, description, jsonLd]);
}
