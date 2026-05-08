import './StoryPage.css'
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Link, useParams } from "react-router-dom";

const stories = [
  { slug: "01", fileName: "01.Open.md", title: "Open" },
  { slug: "02", fileName: "02.PreparationPeriod.md", title: "Preparation Period" },
  { slug: "03", fileName: "03.MetingUpWithHepi.md", title: "Meeting Up With Hepi" },
  { slug: "04", fileName: "04.First_SignalHut_then_TheNewsstand.md", title: "First SignalHut, then The Newsstand" },
  { slug: "10", fileName: "10.EnoughWaiting.md", title: "Enough Waiting" }
];

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
          <Link to="/"> &#x23CF; MAGiE Home</Link>
        </div>
          {next && <Link className="right-item" to={`/story/${next.slug}`}>{next.slug} ▶▶</Link>}
      </nav>
    </div>
  );
}
