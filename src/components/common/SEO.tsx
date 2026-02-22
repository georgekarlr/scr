import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image = '/og-image.png', 
  url = window.location.href, 
  type = 'website' 
}) => {
  const siteTitle = 'Ceintelly';
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - The Social Learning Network`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || 'Ceintelly is the social learning network where you can create study sets, play games, and connect with other learners.');
    }

    // Update Open Graph tags
    const updateMetaTag = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };

    updateMetaTag('meta[property="og:title"]', fullTitle);
    updateMetaTag('meta[property="og:url"]', url);
    updateMetaTag('meta[property="og:type"]', type);
    updateMetaTag('meta[property="og:image"]', image);
    if (description) {
      updateMetaTag('meta[property="og:description"]', description);
    }

    // Update Twitter tags
    updateMetaTag('meta[property="twitter:title"]', fullTitle);
    updateMetaTag('meta[property="twitter:url"]', url);
    updateMetaTag('meta[property="twitter:image"]', image);
    if (description) {
      updateMetaTag('meta[property="twitter:description"]', description);
    }

  }, [fullTitle, description, image, url, type]);

  return null;
};

export default SEO;
