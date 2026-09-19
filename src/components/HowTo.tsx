import JudgmentLegend from "./JudgmentLegend.tsx";

export default function FirstTimeContent() {
  return (
    <>
      <h2>Welcome to MAGiE</h2>
      <p><em>A retro-future puzzle game with bits and a totally rad mall!</em></p>

      <h3>🔍 How it works</h3>
      <ul>
        <li>Each puzzle hides a secret message—your job is to figure it out.</li>
        <li>Decode-type puzzles show you bits; you decode and type the message.</li>
      </ul>

      <JudgmentLegend />
      <h3>🕹️ Tips</h3>
      <ul>
        <li>Guess as many times as you like—no penalty for wrong guesses.</li>
        <li>New puzzles appear daily—you can also revisit previous days.</li>
      </ul>

      <div className="coming-soon">
        <h3>🛍️ Coming Soon: more puzzle types!</h3>
      </div>
    </>
  );
}
