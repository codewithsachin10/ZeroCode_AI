import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  structuredData?: Record<string, unknown>;
  robots?: string;
}

/**
 * SEO Component for managing meta tags and structured data
 */
export const SEO: React.FC<SEOProps> = ({
  title = 'ZeroCode AI - Master Prompt Engineering & AI Development',
  description = 'Learn AI development through guided builds, prompts, and interactive tutorials. Master the art of prompt engineering from basic to advanced levels.',
  keywords = 'prompt engineering, AI development, coding tutorials, machine learning, LLMs',
  image = 'https://vibecode-academy.com/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author = 'ZeroCode Academy',
  structuredData,
  robots = 'index, follow',
}) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }

      tag.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', description, 'name');
    updateMetaTag('keywords', keywords, 'name');
    updateMetaTag('author', author, 'name');
    updateMetaTag('robots', robots, 'name');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1', 'name');

    // Open Graph meta tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', type, 'property');

    // Twitter meta tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', image, 'name');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Structured data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');

      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function
    return () => {
      // Keep meta tags for page transitions
    };
  }, [title, description, keywords, image, url, type, author, robots, structuredData]);

  return null;
};

/**
 * Structured data schemas for common page types
 */
export const schemas = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ZeroCode Academy',
    url: 'https://vibecode-academy.com',
    logo: 'https://vibecode-academy.com/logo.png',
    sameAs: [
      'https://twitter.com/zerocodeai',
      'https://github.com/zerocodeai',
    ],
    description: 'AI-powered coding education platform for learning prompt engineering and development.',
  },

  course: (courseData: {
    name: string;
    description: string;
    url: string;
    image: string;
    author: string;
    difficulty: string;
    duration?: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseData.name,
    description: courseData.description,
    url: courseData.url,
    image: courseData.image,
    author: {
      '@type': 'Organization',
      name: courseData.author,
    },
    educationalLevel: courseData.difficulty,
    duration: courseData.duration,
  }),

  article: (articleData: {
    headline: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author: string;
    url: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleData.headline,
    description: articleData.description,
    image: articleData.image,
    datePublished: articleData.datePublished,
    dateModified: articleData.dateModified || articleData.datePublished,
    author: {
      '@type': 'Person',
      name: articleData.author,
    },
    url: articleData.url,
  }),

  faq: (faqs: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }),

  video: (videoData: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration: string;
    url: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: videoData.name,
    description: videoData.description,
    thumbnailUrl: videoData.thumbnailUrl,
    uploadDate: videoData.uploadDate,
    duration: videoData.duration,
    url: videoData.url,
  }),
};

export default SEO;
