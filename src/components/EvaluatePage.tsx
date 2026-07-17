import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { Puzzle } from "../model.ts";
import { BinaryEncoder } from "../encoding/BinaryEncoder.ts";
import { getMenu } from "../PuzzleApi.ts";
import "./EvaluatePage.css";

const ENCODINGS_MENU = "AbandonedMall-March2025";
const ENCODING_OPTIONS = ["AlphaLengthA1", "5bA1"] as const;
type EncodingOption = typeof ENCODING_OPTIONS[number];
type PuzzleType = "Encode" | "Decode";

interface CandidateEvaluation {
  difficulty: number | null;
  tone: number | null;
  world: number | null;
  note: string;
  puzzleType: PuzzleType;
  encoding: EncodingOption;
  solved: boolean;
  revealed: boolean;
  evaluated_at: string;
}

interface Candidate {
  puzzleName: string;
  clue: string[];
  winMessage: string[];
  evaluation?: CandidateEvaluation;
}

interface GeneratedWord {
  winText: string;
  type?: string;
  generated_at?: string;
  model?: string;
  candidates: Candidate[];
  rejected?: unknown[];
}

interface EvaluationDraft {
  difficulty: number | null;
  tone: number | null;
  world: number | null;
  note: string;
  solved: boolean;
  revealed: boolean;
}

const emptyDraft = (): EvaluationDraft => ({
  difficulty: null,
  tone: null,
  world: null,
  note: "",
  solved: false,
  revealed: false,
});

const draftFromCandidate = (candidate: Candidate): EvaluationDraft => {
  if (!candidate.evaluation) {
    return emptyDraft();
  }
  return {
    difficulty: candidate.evaluation.difficulty ?? null,
    tone: candidate.evaluation.tone ?? null,
    world: candidate.evaluation.world ?? null,
    note: candidate.evaluation.note ?? "",
    solved: candidate.evaluation.solved ?? false,
    revealed: candidate.evaluation.revealed ?? false,
  };
};

const hasAnyRating = (draft: EvaluationDraft): boolean =>
  draft.difficulty !== null || draft.tone !== null || draft.world !== null || draft.note.trim().length > 0;

interface RatingRowProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}

const RatingRow = ({ label, value, onChange }: RatingRowProps) => (
  <div className="eval-rating-row">
    <span className="eval-rating-label">{label}</span>
    <span className="eval-rating-buttons">
      {[1, 2, 3, 4, 5].map((ratingValue) => (
        <button
          type="button"
          key={ratingValue}
          className={value === ratingValue ? "selected" : ""}
          onClick={() => onChange(ratingValue)}
        >
          {ratingValue}
        </button>
      ))}
    </span>
  </div>
);

const EvaluatePage = () => {
  const [encoders, setEncoders] = useState<Record<string, BinaryEncoder> | null>(null);
  const [encodersError, setEncodersError] = useState<string>("");

  const [words, setWords] = useState<GeneratedWord[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileError, setFileError] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [puzzleType, setPuzzleType] = useState<PuzzleType>("Encode");
  const [encodingName, setEncodingName] = useState<EncodingOption>("AlphaLengthA1");

  const [draft, setDraft] = useState<EvaluationDraft>(emptyDraft());

  useEffect(() => {
    getMenu(ENCODINGS_MENU)
      .then((menu) => setEncoders(menu.encodingProviders))
      .catch((error) => {
        console.error("Failed to load encodings menu:", error);
        setEncodersError("Could not load encodings from the puzzle API.");
      });
  }, []);

  // One review unit per candidate: (word index, candidate index) in file order.
  const flatCandidates = useMemo(() => {
    if (!words) {
      return [];
    }
    return words.flatMap((word, wordIndex) =>
      word.candidates.map((candidate, candidateIndex) => ({ word, wordIndex, candidate, candidateIndex }))
    );
  }, [words]);

  const current = flatCandidates[currentIndex];

  const ratedCount = useMemo(
    () => flatCandidates.filter(({ candidate }) => candidate.evaluation).length,
    [flatCandidates]
  );

  const rejectedCount = useMemo(
    () => (words ?? []).reduce((count, word) => count + (word.rejected?.length ?? 0), 0),
    [words]
  );

  const puzzle: Puzzle | null = useMemo(() => {
    if (!current || !encoders?.[encodingName]) {
      return null;
    }
    return {
      slug: `eval-${current.wordIndex}-${current.candidateIndex}`,
      init: "",
      clue: current.candidate.clue,
      winText: current.word.winText,
      winMessage: current.candidate.winMessage,
      type: puzzleType,
      encoding_name: encodingName,
      encoding: encoders[encodingName],
    };
  }, [current, encoders, encodingName, puzzleType]);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) || parsed.some((entry) => !Array.isArray(entry?.candidates))) {
        setFileError("That file doesn't look like generate.py output (expected an array with candidates).");
        return;
      }
      const loadedWords = parsed as GeneratedWord[];
      setWords(loadedWords);
      setFileName(file.name);
      setFileError("");
      setCurrentIndex(0);
      const firstCandidate = loadedWords.flatMap((word) => word.candidates)[0];
      setDraft(firstCandidate ? draftFromCandidate(firstCandidate) : emptyDraft());
    } catch (error) {
      console.error("Failed to parse candidates file:", error);
      setFileError("Could not parse that file as JSON.");
    }
  };

  // Returns a copy of `source` with the current draft written onto the current
  // candidate's `evaluation`, or `source` unchanged if there is nothing to save.
  const withCurrentDraft = useCallback((source: GeneratedWord[] | null): GeneratedWord[] | null => {
    if (!source || !current || !hasAnyRating(draft)) {
      return source;
    }
    const evaluation: CandidateEvaluation = {
      difficulty: draft.difficulty,
      tone: draft.tone,
      world: draft.world,
      note: draft.note,
      puzzleType,
      encoding: encodingName,
      solved: draft.solved,
      revealed: draft.revealed,
      evaluated_at: new Date().toISOString(),
    };
    return source.map((word, wordIndex) => wordIndex !== current.wordIndex ? word : {
      ...word,
      candidates: word.candidates.map((candidate, candidateIndex) =>
        candidateIndex !== current.candidateIndex ? candidate : { ...candidate, evaluation }
      ),
    });
  }, [current, draft, puzzleType, encodingName]);

  const saveDraft = useCallback(() => {
    setWords((previous) => withCurrentDraft(previous));
  }, [withCurrentDraft]);

  const goTo = useCallback((nextIndex: number, save: boolean) => {
    if (save) {
      saveDraft();
    }
    const clampedIndex = Math.max(0, Math.min(nextIndex, flatCandidates.length - 1));
    setCurrentIndex(clampedIndex);
    const nextCandidate = flatCandidates[clampedIndex]?.candidate;
    setDraft(nextCandidate ? draftFromCandidate(nextCandidate) : emptyDraft());
  }, [saveDraft, flatCandidates]);

  const handleWin = useCallback(() => {
    setDraft((previous) => ({ ...previous, solved: true }));
  }, []);

  const handleReveal = () => {
    setDraft((previous) => ({ ...previous, revealed: true }));
  };

  const handleDownload = () => {
    const data = withCurrentDraft(words);
    if (!data) {
      return;
    }
    setWords(data);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName.replace(/\.json$/i, "")}.evaluated.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // EncodePuzzle listens for 0/1/Backspace on window; keep note-typing out of the bit field.
  const stopKeyPropagation = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="eval-page">
      <div className="eval-settings">
        <label className="eval-file-input">
          <input type="file" accept=".json" onChange={handleFile} />
        </label>
        <label className="eval-type-toggle" title="ON = Encode, OFF = Decode">
          <input
            type="checkbox"
            className="bit-checkbox"
            checked={puzzleType === "Encode"}
            onChange={(event) => setPuzzleType(event.target.checked ? "Encode" : "Decode")}
          />
          <span>{puzzleType}</span>
        </label>
        <span className="eval-encoding-options">
          {ENCODING_OPTIONS.map((option) => (
            <label key={option}>
              <input
                type="radio"
                className="bit-checkbox"
                name="eval-encoding"
                value={option}
                checked={encodingName === option}
                onChange={() => setEncodingName(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </span>
      </div>

      {fileError && <p className="eval-error">{fileError}</p>}
      {encodersError && <p className="eval-error">{encodersError}</p>}
      {!encoders && !encodersError && <p className="eval-meta">Loading encodings…</p>}

      {!words && !fileError && encoders && (
        <p className="eval-meta">Load a candidates .json file from generate.py to begin.</p>
      )}

      {current && (
        <>
          <p className="eval-meta">
            {draft.revealed && current.word.winText + " · "}
            {"candidate "}{current.candidateIndex + 1} of {current.word.candidates.length}
            {" · "}{current.candidate.puzzleName}
            {current.word.model && <>{" · "}{current.word.model}</>}
            {rejectedCount > 0 && <>{" · "}{rejectedCount} rejected (hidden)</>}
          </p>

          {puzzle && (
            <div className="eval-play-area">
              {puzzleType === "Encode" ? (
                <EncodePuzzle
                  key={`${currentIndex}-${puzzleType}-${encodingName}`}
                  puzzle={puzzle}
                  onWin={handleWin}
                  bitButtonWidthPx={32}
                />
              ) : (
                <DecodePuzzle
                  key={`${currentIndex}-${puzzleType}-${encodingName}`}
                  puzzle={puzzle}
                  onWin={handleWin}
                  bitButtonWidthPx={32}
                />
              )}
            </div>
          )}

          {draft.revealed && (
            <div className="eval-reveal display">
              <p>{current.word.winText}</p>
              {current.candidate.winMessage.map((line, lineIndex) => (
                <p key={`reveal-${lineIndex}`}>{line}</p>
              ))}
            </div>
          )}

          <div className="eval-controls">
            <RatingRow
              label="Difficulty"
              value={draft.difficulty}
              onChange={(value) => setDraft((previous) => ({ ...previous, difficulty: value }))}
            />
            <RatingRow
              label="Tone"
              value={draft.tone}
              onChange={(value) => setDraft((previous) => ({ ...previous, tone: value }))}
            />
            <RatingRow
              label="World"
              value={draft.world}
              onChange={(value) => setDraft((previous) => ({ ...previous, world: value }))}
            />
            <input
              type="text"
              className="eval-note"
              placeholder="note (optional)"
              value={draft.note}
              onKeyDown={stopKeyPropagation}
              onChange={(event) => setDraft((previous) => ({ ...previous, note: event.target.value }))}
            />
            <div className="eval-nav">
              <button type="button" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1, true)}>
                ◀ Prev
              </button>
              <button type="button" disabled={draft.revealed} onClick={handleReveal}>
                Reveal
              </button>
              <button
                type="button"
                disabled={currentIndex >= flatCandidates.length - 1}
                onClick={() => goTo(currentIndex + 1, false)}
              >
                Skip
              </button>
              <button
                type="button"
                disabled={currentIndex >= flatCandidates.length - 1}
                onClick={() => goTo(currentIndex + 1, true)}
              >
                Next ▶
              </button>
            </div>
            <div className="eval-progress">
              <span>{ratedCount} / {flatCandidates.length} rated</span>
              <button type="button" onClick={handleDownload}>Download</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { EvaluatePage };
