import './StoryPage.css'
import { Link, useParams } from "react-router-dom";
import { stories } from "../stories.ts";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function importStory(fileName: string) {
  return import.meta.glob("../assets/story/*.md", { query: "?raw", import: "default", eager: true })[
    `../assets/story/${fileName}`
    ] as string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/_(.+?)_/gs, '$1')
    .replace(/`(.+?)`/gs, '$1')
    .replace(/\[(.+?)\]\(.+?\)/gs, '$1')
    .replace(/^[-*_]{3,}$/, '')
    .trim();
}

function wordWrap(text: string, cols: number): string[] {
  if (!text) {
    return [];
  }
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) {
      line = word;
    } else if (line.length + 1 + word.length <= cols) {
      line += ' ' + word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

function buildLines(markdown: string, cols: number): string[] {
  const allLines: string[] = [];
  for (const part of markdown.split(/(```[\s\S]*?```)/)) {
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3).replace(/^\n/, '').replace(/\n$/, '');
      if (!inner) {
        continue;
      }
      if (allLines.length > 0) {
        allLines.push('');
      }
      allLines.push(...inner.split('\n'));
    } else {
      for (const para of part.split(/\n\n+/)) {
        const text = stripMarkdown(para.replace(/\n/g, ' ').trim());
        if (!text) {
          continue;
        }
        if (allLines.length > 0) {
          allLines.push('');
        }
        allLines.push(...wordWrap(text, cols));
      }
    }
  }
  return allLines;
}

const PAGE_OVERLAP = 1;

function paginateLines(lines: string[], rows: number): string[][] {
  if (rows <= 0) {
    return [lines];
  }
  const step = Math.max(1, rows - PAGE_OVERLAP);
  const pages: string[][] = [];
  let i = 0;
  while (i < lines.length) {
    while (i < lines.length && !lines[i]) {
      i++;
    } // strip leading blank lines per page
    if (i >= lines.length) {
      break;
    }
    pages.push(lines.slice(i, i + rows));
    i += step;
  }
  return pages.length > 0 ? pages : [[]];
}

export function StoryPage() {
  const { slug } = useParams();

  const index = stories.findIndex(s => s.slug === slug);
  const story = index !== -1 ? stories[index] : null;
  const storyMarkdown = story ? importStory(story.fileName) : null;

  const [pageIndex, setPageIndex] = useState(0);
  const [cols, setCols] = useState(40);
  const [rows, setRows] = useState(20);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [fontSizeAdjust, setFontSizeAdjust] = useState<number>(
    () => parseInt(localStorage.getItem('storyFontAdjust') || '0', 10)
  );
  const fontSizeAdjustRef = useRef(fontSizeAdjust);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'storyFontAdjust') {
        setFontSizeAdjust(parseInt(e.newValue || '0', 10));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  useEffect(() => { fontSizeAdjustRef.current = fontSizeAdjust; }, [fontSizeAdjust]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);

  const measure = useCallback(() => {
    const ruler = rulerRef.current;
    const container = containerRef.current;
    if (!ruler || !container) {
      return;
    }
    const charWidth = ruler.offsetWidth;
    const lineHeight = ruler.offsetHeight;
    if (!charWidth || !lineHeight) {
      return;
    }
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const currentFontSize = parseFloat(getComputedStyle(container).fontSize);
    const scale = containerWidth / (38 * charWidth);
    const baseFontSize = currentFontSize * scale;
    const newFontSize = baseFontSize + fontSizeAdjustRef.current;
    const ratio = newFontSize / currentFontSize;
    setFontSize(prev => (prev !== null && Math.abs(prev - newFontSize) < 1 ? prev : newFontSize));
    setCols(Math.floor(containerWidth / (charWidth * ratio)));
    setRows(Math.floor(containerHeight / (lineHeight * ratio)));
  }, []);

  useLayoutEffect(() => {
    measure();
    let timer: ReturnType<typeof setTimeout>;
    const debouncedMeasure = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 50);
    };
    const observer = new ResizeObserver(debouncedMeasure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [measure]);

  useLayoutEffect(() => {
    measure();
  }, [fontSizeAdjust, measure]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageIndex(0);
  }, [storyMarkdown, cols, rows]);

  const pages = useMemo(
    () => storyMarkdown ? paginateLines(buildLines(storyMarkdown, cols), rows) : [[]],
    [storyMarkdown, cols, rows]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        setPageIndex(p => Math.min(p + 1, pages.length - 1));
      } else if (e.key === 'ArrowUp') {
        setPageIndex(p => Math.max(p - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pages.length]);

  if (index === -1) {
    console.error(`StoryPage: no story found for slug "${slug}"`);
    return <div>Story not found</div>;
  }

  if (!storyMarkdown || !story) {
    console.error(`StoryPage: markdown not found for slug "${slug}"`);
    return <div>Story content missing</div>;
  }

  const prev = stories[index - 1];
  const next = stories[index + 1];
  const currentPage = pages[pageIndex] ?? [];
  const canGoBack = pageIndex > 0;
  const canGoForward = pageIndex < pages.length - 1;

  return (
    <div className="story-page" style={fontSize != null ? { fontSize: `${fontSize}px` } : undefined}>
      <div
        ref={containerRef}
        id="main-display"
        className="paginated"
        onClick={() => {
          if (canGoForward) {
            setPageIndex(p => p + 1);
          }
        }}
      >
        <span ref={rulerRef} className="char-ruler">M</span>
        <div className="story-lines">
          {currentPage.map((line, i) => (
            <div key={i} className="story-line">{line || ' '}</div>
          ))}
        </div>
      </div>
      <div className="story-cta" style={pageIndex !== pages.length - 1 ? { visibility: 'hidden' } : undefined}>
        <Link to="/">Play the game!</Link>
      </div>
      <nav className="story-navigation">
        <div className="left-item">
          {prev ? <Link to={`/story/${prev.slug}`}>|◀◀{prev.slug}</Link> : <span />}
        </div>
        <div className="center">
          <div className="page-controls">
            <button type="button" onClick={() => setPageIndex(p => p - 1)} disabled={!canGoBack}>▲</button>
            <span>{pageIndex + 1}/{pages.length}</span>
            <button type="button" onClick={() => setPageIndex(p => p + 1)} disabled={!canGoForward}>▼</button>
          </div>
          <Link to="/story">&#x23CF; Story Index</Link>
        </div>
        <div className="right-item">
          {next ? <Link to={`/story/${next.slug}`}>{next.slug}▶▶|</Link> : <span />}
        </div>
      </nav>
    </div>
  );
}
