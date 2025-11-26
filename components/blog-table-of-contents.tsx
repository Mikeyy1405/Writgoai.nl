
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface BlogTableOfContentsProps {
  content: string;
}

export default function BlogTableOfContents({ content }: BlogTableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Parse HTML content and extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    const items: TocItem[] = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent || '';
      
      // Create unique ID if not present
      let id = heading.id;
      if (!id) {
        id = `heading-${index}`;
        heading.id = id;
      }
      
      items.push({ id, text, level });
    });
    
    setTocItems(items);

    // Add IDs to actual DOM elements after content is rendered
    setTimeout(() => {
      const contentElement = document.querySelector('.blog-content');
      if (contentElement) {
        const actualHeadings = contentElement.querySelectorAll('h2, h3');
        actualHeadings.forEach((heading, index) => {
          if (!heading.id) {
            heading.id = `heading-${index}`;
          }
        });
      }
    }, 100);
  }, [content]);

  useEffect(() => {
    // Track scroll position and highlight active section
    const handleScroll = () => {
      const headingElements = tocItems.map(item => 
        document.getElementById(item.id)
      ).filter(Boolean) as HTMLElement[];

      let currentActiveId = '';
      
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i];
        if (heading && heading.getBoundingClientRect().top <= 150) {
          currentActiveId = heading.id;
          break;
        }
      }

      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sticky top-24">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800">
        <List className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-white">Inhoud</h3>
      </div>
      
      <nav className="space-y-1">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`
              block w-full text-left py-1.5 px-2 rounded transition-all duration-200
              ${item.level === 2 ? 'pl-2' : 'pl-4'}
              ${
                activeId === item.id
                  ? 'bg-orange-900/30 text-orange-400 font-medium border-l-2 border-orange-500'
                  : 'text-gray-400 hover:text-orange-300 hover:bg-gray-800/50 text-xs'
              }
            `}
          >
            <span className="line-clamp-2 text-xs leading-snug">
              {item.text}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
