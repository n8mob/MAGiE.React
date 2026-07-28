import { Link } from "react-router-dom";
import { stories } from "../stories.ts";
import './StoryPage.css';
import { usePageTitle } from "../hooks/usePageTitle.ts";
import { storyTitle } from "../pageTitles.ts";

export function StoryIndex() {
  usePageTitle(storyTitle());
  return (
    <div className="story-page">
      <div id="main-display">
        <h2>MAGiE Story</h2>
        <ul className="story-list">
          {stories.map(story => (
            <li key={story.slug}>
              {story.slug}: <Link to={`/story/${story.slug}`}>{story.title}</Link>
            </li>
          ))}
        </ul>
      </div>
      <nav className="story-navigation">
        <div className="center">
          <Link to="/"> &#x23CF; MAGiE Home</Link>
        </div>
      </nav>
    </div>
  );
}
