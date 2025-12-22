'use client';

import { useEffect, useState } from 'react';

// Simple cn utility
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Extract headings from content
    const headings: TOCItem[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const headingElements = tempDiv.querySelectorAll('h2, h3');
    headingElements.forEach((heading, index) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName[1]);
      const id = heading.id || `heading-${index}`;
      
      // Add ID to heading if it doesn't have one
      if (!heading.id) {
        heading.id = id;
      }

      headings.push({ id, text, level });
    });

    setToc(headings);

    // Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    // Observe all headings
    document.querySelectorAll('h2, h3').forEach((heading) => {
      observer.observe(heading);
    });

    // Scroll progress handler
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (toc.length === 0) return null;

  return (
    <div className="sticky top-24 hidden lg:block">
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6 shadow-lg">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-orange-400">
          Inhoudsopgave
        </h3>
        <nav className="space-y-2">
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={cn(
                'block w-full text-left text-sm transition-colors',
                item.level === 2 && 'font-medium',
                item.level === 3 && 'pl-4',
                activeId === item.id
                  ? 'text-orange-400 font-semibold'
                  : 'text-white hover:text-orange-300'
              )}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>Leesvoortgang</span>
          <span className="text-white font-medium">{Math.round(scrollProgress)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
            style={{
              width: `${scrollProgress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
