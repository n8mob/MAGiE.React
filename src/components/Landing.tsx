import {Link} from "react-router-dom";

function todayPath() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `/date/${yyyy}/${mm}/${dd}`;
}

export function Landing() {
  const toToday = todayPath();
  return (
    <main className="landing">
      <div className="cta-row">
        <Link to={"/tutorial/0/levels/28/puzzles/0"} className="button secondary">
          <h2>How to Play</h2>
        </Link>
        <Link to={toToday} className="button primary">
          <h2>Play Today's Puzzle</h2>
        </Link>
      </div>
    </main>
  )
}
