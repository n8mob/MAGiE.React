import './StoryPage.css'
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Link, useParams } from "react-router-dom";
import { stories } from "../stories.ts";

function importStory(fileName: string) {
  return import.meta.glob("../assets/story/*.md", { query: "?raw", import: "default", eager: true })[
    `../assets/story/${fileName}`
    ] as string;
}

export function StoryPage() {
  const { slug } = useParams();
  const index = stories.findIndex(s => s.slug === slug);

  if (index === -1) {
    console.error(`StoryPage: no story found for slug "${slug}"`);
    return <div>Story not found</div>;
  }

  const story = stories[index];
  const storyMarkdown = importStory(story.fileName);

  if (!storyMarkdown) {
    console.error(`StoryPage: markdown file not found for "${story.fileName}" (slug "${slug}")`);
    return <div>Story content missing</div>;
  }

  const prev = stories[index - 1];
  const next = stories[index + 1];

  return (
    <div className="story-page">
      <div id="main-display" className="story-page">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}>
          {storyMarkdown}
        </ReactMarkdown>
      </div>
      <nav className="story-navigation">
          {prev && <Link className="left-item" to={`/story/${prev.slug}`}>◀◀ {prev.slug}</Link>}
        <div className="center">
          <Link to="/story"> &#x23CF; Story Index</Link>
        </div>
          {next && <Link className="right-item" to={`/story/${next.slug}`}>{next.slug} ▶▶</Link>}
      </nav>
    </div>
  );
}
