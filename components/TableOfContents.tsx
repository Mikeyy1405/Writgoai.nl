'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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

    return () => observer.disconnect();
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
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Inhoudsopgave
        </h3>
        <nav className="space-y-2">
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={cn(
                'block w-full text-left text-sm transition-colors hover:text-primary',
                item.level === 2 && 'font-medium',
                item.level === 3 && 'pl-4 text-muted-foreground',
                activeId === item.id
                  ? 'text-primary font-semibold'
                  : 'text-foreground/80'
              )}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Leesvoortgang</span>
          <span>{Math.round((window.scrollY / document.body.scrollHeight) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${Math.min(100, (window.scrollY / document.body.scrollHeight) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
