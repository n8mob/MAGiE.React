import { useRef } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import storyMarkdown from '../assets/story/02.PreparationPeriod.md?raw';
import { useHeader } from "../hooks/useHeader.ts";

export function StoryPage() {
  const { setHeaderContent } = useHeader();
  const headerSet = useRef(false);

  return (
    <div id="main-display" className="story-page">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          h1({ children, ...props }) {
            if (!headerSet.current) {
              setHeaderContent(String(children));
              headerSet.current = true;
            }
            return <h1 {...props}>{children}</h1>;
          },
        }}>
        {storyMarkdown}
      </ReactMarkdown>
    </div>
  );
}
