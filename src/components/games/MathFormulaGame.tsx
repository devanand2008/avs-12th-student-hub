"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Gamepad2,
  Zap,
  Layers,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Flame,
  Search,
  Check,
  Share2,
} from "lucide-react";
import {
  MATH_FORMULAS,
  MATH_CHAPTERS,
  MathFormula,
  MathChapter,
} from "@/lib/math-formulas";
import { sound } from "@/lib/sound-effects";
import SectionBadge from "@/components/ui/SectionBadge";

type GameMode = "blitz" | "memory" | "fill" | "vault";

interface MemoryCard {
  id: string;
  formulaId: string;
  type: "concept" | "formula";
  content: string;
  chapter: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MathFormulaGame() {
  // Game Configuration State
  const [mode, setMode] = useState<GameMode>("blitz");
  const [selectedChapter, setSelectedChapter] = useState<MathChapter>("All Chapters");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player Stats (persisted in localStorage)
  const [xp, setXp] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Mode 1: Blitz States
  const [blitzQuestions, setBlitzQuestions] = useState<MathFormula[]>([]);
  const [currentBlitzIndex, setCurrentBlitzIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [blitzScore, setBlitzScore] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // Mode 2: Memory Cards States
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(6);

  // Mode 3: Fill-the-Blank States
  const [fillQuestions, setFillQuestions] = useState<MathFormula[]>([]);
  const [fillIndex, setFillIndex] = useState(0);
  const [selectedFillBlank, setSelectedFillBlank] = useState<string | null>(null);
  const [isFillChecked, setIsFillChecked] = useState(false);
  const [fillScore, setFillScore] = useState(0);

  // Mode 4: Vault Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // Initialize and load localStorage data
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSoundEnabled(sound.isEnabled());
      const savedXp = parseInt(localStorage.getItem("skillup_math_xp") || "0", 10);
      const savedHigh = parseInt(localStorage.getItem("skillup_math_highscore") || "0", 10);
      const savedStreak = parseInt(localStorage.getItem("skillup_math_maxstreak") || "0", 10);
      setXp(savedXp);
      setHighScore(savedHigh);
      setMaxStreak(savedStreak);
    }
  }, []);

  const addXp = useCallback((points: number) => {
    setXp((prev) => {
      const next = prev + points;
      if (typeof window !== "undefined") {
        localStorage.setItem("skillup_math_xp", String(next));
      }
      return next;
    });
  }, []);

  const updateHighScore = useCallback((score: number) => {
    setHighScore((prev) => {
      const best = Math.max(prev, score);
      if (typeof window !== "undefined") {
        localStorage.setItem("skillup_math_highscore", String(best));
      }
      return best;
    });
  }, []);

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  // Filter formulas based on selected chapter
  const filteredFormulas = useMemo(() => {
    if (selectedChapter === "All Chapters") return MATH_FORMULAS;
    return MATH_FORMULAS.filter((f) => f.chapter === selectedChapter);
  }, [selectedChapter]);

  // Utility to shuffle an array
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // --- BLITZ MODE LOGIC ---
  const initBlitzGame = useCallback(() => {
    const pool = shuffleArray(filteredFormulas);
    const selected = pool.slice(0, Math.min(10, pool.length));
    setBlitzQuestions(selected);
    setCurrentBlitzIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setBlitzScore(0);
    setCurrentStreak(0);
    setIsGameOver(false);

    if (selected.length > 0) {
      setShuffledOptions(shuffleArray(selected[0].options));
    }
  }, [filteredFormulas]);

  const handleBlitzSelect = (option: string) => {
    if (isAnswerChecked || !blitzQuestions[currentBlitzIndex]) return;
    sound.playFlip();
    setSelectedOption(option);
    setIsAnswerChecked(true);

    const isCorrect = option === blitzQuestions[currentBlitzIndex].options[0];
    if (isCorrect) {
      sound.playCorrect();
      const streakBonus = currentStreak >= 3 ? 2 : 1;
      const points = 10 * streakBonus;
      setBlitzScore((prev) => prev + points);
      addXp(points);

      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      if (nextStreak > maxStreak) {
        setMaxStreak(nextStreak);
        if (typeof window !== "undefined") {
          localStorage.setItem("skillup_math_maxstreak", String(nextStreak));
        }
      }
      if (nextStreak % 3 === 0) {
        sound.playStreak();
      }
    } else {
      sound.playWrong();
      setCurrentStreak(0);
    }
  };

  const handleNextBlitz = () => {
    if (currentBlitzIndex + 1 < blitzQuestions.length) {
      const nextIndex = currentBlitzIndex + 1;
      setCurrentBlitzIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setShuffledOptions(shuffleArray(blitzQuestions[nextIndex].options));
    } else {
      setIsGameOver(true);
      sound.playVictory();
      updateHighScore(blitzScore);
    }
  };

  // --- MEMORY FLIP MODE LOGIC ---
  const initMemoryGame = useCallback(() => {
    const pool = shuffleArray(filteredFormulas).slice(0, 6);
    const cards: MemoryCard[] = [];

    pool.forEach((f) => {
      cards.push({
        id: `${f.id}-concept`,
        formulaId: f.id,
        type: "concept",
        content: f.name,
        chapter: f.chapter,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: `${f.id}-formula`,
        formulaId: f.id,
        type: "formula",
        content: f.formula,
        chapter: f.chapter,
        isFlipped: false,
        isMatched: false,
      });
    });

    setMemoryCards(shuffleArray(cards));
    setFlippedCards([]);
    setMemoryMoves(0);
    setMatchedPairs(0);
    setTotalPairs(pool.length);
  }, [filteredFormulas]);

  const handleCardClick = (index: number) => {
    if (
      flippedCards.length === 2 ||
      memoryCards[index].isFlipped ||
      memoryCards[index].isMatched
    ) {
      return;
    }

    sound.playFlip();

    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (
        firstCard.formulaId === secondCard.formulaId &&
        firstCard.type !== secondCard.type
      ) {
        // MATCH!
        sound.playCorrect();
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedCards([]);
          setMatchedPairs((p) => {
            const nextP = p + 1;
            addXp(15);
            if (nextP === totalPairs) {
              sound.playVictory();
            }
            return nextP;
          });
        }, 400);
      } else {
        // NO MATCH
        sound.playWrong();
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedCards([]);
        }, 1100);
      }
    }
  };

  // --- FILL IN THE BLANK LOGIC ---
  const initFillGame = useCallback(() => {
    const pool = shuffleArray(filteredFormulas);
    const selected = pool.slice(0, Math.min(8, pool.length));
    setFillQuestions(selected);
    setFillIndex(0);
    setSelectedFillBlank(null);
    setIsFillChecked(false);
    setFillScore(0);
  }, [filteredFormulas]);

  const handleFillSelect = (choice: string) => {
    if (isFillChecked || !fillQuestions[fillIndex]) return;
    sound.playFlip();
    setSelectedFillBlank(choice);
    setIsFillChecked(true);

    const isCorrect = choice === fillQuestions[fillIndex].fillBlank.correct;
    if (isCorrect) {
      sound.playCorrect();
      setFillScore((s) => s + 10);
      addXp(10);
    } else {
      sound.playWrong();
    }
  };

  const handleNextFill = () => {
    if (fillIndex + 1 < fillQuestions.length) {
      setFillIndex((i) => i + 1);
      setSelectedFillBlank(null);
      setIsFillChecked(false);
    } else {
      sound.playVictory();
    }
  };

  // Handle switching modes or chapter changes
  useEffect(() => {
    if (mode === "blitz") initBlitzGame();
    if (mode === "memory") initMemoryGame();
    if (mode === "fill") initFillGame();
  }, [mode, selectedChapter, initBlitzGame, initMemoryGame, initFillGame]);

  // Copy formula text in Vault
  const handleCopyFormula = (f: MathFormula) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${f.name}: ${f.formula}`);
      setCopiedFormulaId(f.id);
      setTimeout(() => setCopiedFormulaId(null), 2000);
    }
  };

  // Calculate Level based on XP
  const level = useMemo(() => {
    if (xp < 50) return { title: "Novice", badge: "Level 1", next: 50 };
    if (xp < 150) return { title: "Apprentice", badge: "Level 2", next: 150 };
    if (xp < 350) return { title: "Scholar", badge: "Level 3", next: 350 };
    if (xp < 700) return { title: "Math Master", badge: "Level 4", next: 700 };
    return { title: "Grand Genius", badge: "Level 5", next: 1000 };
  }, [xp]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Player Status Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#142B63] via-[#1E3A8A] to-[#0F172A] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-blue-900/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Title & Branding */}
          <div className="flex items-start sm:items-center gap-3.5">
            <SectionBadge type="math" size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  CLASS 12 MATH ARCADE
                </span>
                <span className="text-blue-200 text-xs font-semibold">
                  Tamil Nadu State Board
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-heading text-white tracking-tight mt-1">
                Math Formula Quest
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/90 font-medium">
                Master crucial 12th Maths formulas with speed recall, memory pairs & formula puzzles!
              </p>
            </div>
          </div>

          {/* Right Stats & Audio Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-white/15">
            {/* XP & Level */}
            <div className="px-3 py-1.5 bg-blue-950/60 rounded-xl text-center border border-blue-400/20">
              <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {level.title}
              </div>
              <div className="text-sm font-extrabold text-amber-300">
                {xp} <span className="text-[10px] text-white/80 font-semibold">XP</span>
              </div>
            </div>

            {/* Streak */}
            <div className="px-3 py-1.5 bg-blue-950/60 rounded-xl text-center border border-blue-400/20">
              <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                Streak
              </div>
              <div className="text-sm font-extrabold text-orange-300">
                {currentStreak}x
              </div>
            </div>

            {/* Best High Score */}
            <div className="px-3 py-1.5 bg-blue-950/60 rounded-xl text-center border border-blue-400/20">
              <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                Best
              </div>
              <div className="text-sm font-extrabold text-white">
                {highScore}
              </div>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`touch-target p-2.5 rounded-xl border transition-all ${
                soundEnabled
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/30 hover:bg-amber-400/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }`}
              title={soundEnabled ? "Mute audio effects" : "Turn audio on"}
              aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Game Mode Navigation Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => setMode("blitz")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              mode === "blitz"
                ? "bg-amber-400 text-slate-950 shadow-md scale-102"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Formula Blitz (Quiz)</span>
          </button>

          <button
            onClick={() => setMode("memory")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              mode === "memory"
                ? "bg-amber-400 text-slate-950 shadow-md scale-102"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Memory Flip (Pairs)</span>
          </button>

          <button
            onClick={() => setMode("fill")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              mode === "fill"
                ? "bg-amber-400 text-slate-950 shadow-md scale-102"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Formula Puzzle (Blank)</span>
          </button>

          <button
            onClick={() => setMode("vault")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              mode === "vault"
                ? "bg-amber-400 text-slate-950 shadow-md scale-102"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Formula Vault (Sheet)</span>
          </button>
        </div>
      </div>

      {/* Chapter Filter Pill Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        <span className="text-slate-500 font-bold uppercase text-[10px] shrink-0 pl-1">
          Chapter:
        </span>
        {MATH_CHAPTERS.map((chap) => (
          <button
            key={chap}
            onClick={() => setSelectedChapter(chap)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 ${
              selectedChapter === chap
                ? "bg-[#142B63] text-white shadow-xs font-bold"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {chap}
          </button>
        ))}
      </div>

      {/* --- MODE 1: FORMULA BLITZ --- */}
      {mode === "blitz" && (
        <div className="space-y-4">
          {!isGameOver && blitzQuestions.length > 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-3 border-b border-slate-100">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                  {blitzQuestions[currentBlitzIndex].chapter}
                </span>
                <span className="font-mono text-slate-700">
                  Question {currentBlitzIndex + 1} of {blitzQuestions.length}
                </span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  Score: {blitzScore}
                </span>
              </div>

              {/* Formula Concept Prompt */}
              <div className="text-center py-4 px-2 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Identify the Correct Formula
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  {blitzQuestions[currentBlitzIndex].name}
                </h2>
                {blitzQuestions[currentBlitzIndex].tamilName && (
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">
                    {blitzQuestions[currentBlitzIndex].tamilName}
                  </p>
                )}
                <p className="text-xs text-slate-600 max-w-lg mx-auto pt-1">
                  {blitzQuestions[currentBlitzIndex].description}
                </p>
              </div>

              {/* 4 Formula Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {shuffledOptions.map((opt, i) => {
                  const isCorrectAnswer =
                    opt === blitzQuestions[currentBlitzIndex].options[0];
                  const isChosen = selectedOption === opt;

                  let cardStyle =
                    "border-slate-200 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800";
                  if (isAnswerChecked) {
                    if (isCorrectAnswer) {
                      cardStyle =
                        "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30";
                    } else if (isChosen && !isCorrectAnswer) {
                      cardStyle =
                        "border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-400/30";
                    } else {
                      cardStyle = "border-slate-200 bg-slate-100/40 opacity-60 text-slate-600";
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleBlitzSelect(opt)}
                      disabled={isAnswerChecked}
                      className={`p-4 rounded-2xl border text-left font-mono font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-between gap-3 shadow-2xs active:scale-98 ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-white/80 border border-slate-300 text-slate-700 flex items-center justify-center text-xs font-sans font-bold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="select-all">{opt}</span>
                      </div>
                      {isAnswerChecked && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isAnswerChecked && isChosen && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Exam Tip after selection */}
              {isAnswerChecked && (
                <div className="rounded-2xl p-4 bg-amber-50/90 border border-amber-200/80 animate-in fade-in duration-300 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-slate-800">
                      <strong className="text-amber-900 block font-bold">
                        Exam Tip & Mnemonic:
                      </strong>
                      {blitzQuestions[currentBlitzIndex].examTip}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleNextBlitz}
                      className="px-5 py-2.5 bg-[#142B63] hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <span>
                        {currentBlitzIndex + 1 < blitzQuestions.length
                          ? "Next Question"
                          : "View Results"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Game Over / Results Card */
            <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 text-center space-y-5 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-heading">
                Round Complete!
              </h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                You scored <strong className="text-slate-900">{blitzScore} points</strong> with a max streak of{" "}
                <strong className="text-orange-600">{maxStreak}x</strong>! Keep practicing to master all Class 12 formulas.
              </p>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={initBlitzGame}
                  className="px-6 py-3 bg-[#142B63] hover:bg-blue-900 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => setMode("vault")}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Review Formula Vault</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODE 2: MEMORY FLIP --- */}
      {mode === "memory" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
            {/* Header / Stats */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-3 border-b border-slate-100">
              <span className="text-slate-700">
                Moves: <strong className="font-mono text-slate-900">{memoryMoves}</strong>
              </span>
              <span className="text-blue-700 font-extrabold">
                Pairs Matched: {matchedPairs} / {totalPairs}
              </span>
              <button
                onClick={initMemoryGame}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Board
              </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {memoryCards.map((card, idx) => {
                const isOpen = card.isFlipped || card.isMatched;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    disabled={card.isMatched}
                    className={`h-28 sm:h-32 p-3 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-center relative select-none ${
                      card.isMatched
                        ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 shadow-xs"
                        : isOpen
                        ? "border-blue-400 bg-white text-slate-900 shadow-md scale-102 ring-2 ring-blue-400/20"
                        : "border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    {isOpen ? (
                      <div className="animate-in zoom-in-95 duration-200 flex flex-col items-center justify-center h-full w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                          {card.type === "concept" ? "Concept" : "Formula"}
                        </span>
                        <p
                          className={`font-bold leading-snug line-clamp-3 ${
                            card.type === "formula"
                              ? "font-mono text-xs sm:text-sm text-[#142B63]"
                              : "text-xs sm:text-sm text-slate-900"
                          }`}
                        >
                          {card.content}
                        </p>
                        {card.isMatched && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-2 right-2" />
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <HelpCircle className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Flip Card
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Victory Celebration */}
            {matchedPairs === totalPairs && totalPairs > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in zoom-in-95">
                <Trophy className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-950">
                  Fantastic Memory! All {totalPairs} Pairs Cleared!
                </h3>
                <p className="text-xs text-emerald-800">
                  Completed in {memoryMoves} moves. Earned +{totalPairs * 15} XP!
                </p>
                <button
                  onClick={initMemoryGame}
                  className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Play Another Set
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODE 3: FORMULA PUZZLE (FILL IN THE BLANK) --- */}
      {mode === "fill" && (
        <div className="space-y-4">
          {fillQuestions.length > 0 && fillIndex < fillQuestions.length ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-3 border-b border-slate-100">
                <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg">
                  {fillQuestions[fillIndex].chapter}
                </span>
                <span className="font-mono text-slate-700">
                  Puzzle {fillIndex + 1} of {fillQuestions.length}
                </span>
                <span className="text-emerald-700 font-extrabold">
                  Score: {fillScore}
                </span>
              </div>

              {/* Puzzle Prompt */}
              <div className="text-center py-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                  Fill in the Missing Term
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  {fillQuestions[fillIndex].name}
                </h2>
                <div className="my-5 p-5 bg-slate-900 text-white rounded-2xl font-mono text-base sm:text-xl font-bold tracking-wide inline-block shadow-inner max-w-full overflow-x-auto">
                  {fillQuestions[fillIndex].fillBlank.template.split("[?]")[0]}
                  <span className="inline-block mx-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-lg ring-2 ring-amber-300 font-extrabold animate-pulse">
                    {selectedFillBlank || "?"}
                  </span>
                  {fillQuestions[fillIndex].fillBlank.template.split("[?]")[1]}
                </div>
              </div>

              {/* 4 Fill Choices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fillQuestions[fillIndex].fillBlank.options.map((choice) => {
                  const isCorrect =
                    choice === fillQuestions[fillIndex].fillBlank.correct;
                  const isSelected = selectedFillBlank === choice;

                  let style =
                    "border-slate-200 bg-slate-50 text-slate-800 hover:border-violet-400 hover:bg-violet-50/50";
                  if (isFillChecked) {
                    if (isCorrect) {
                      style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-black";
                    } else if (isSelected && !isCorrect) {
                      style = "border-rose-400 bg-rose-50 text-rose-900 line-through";
                    } else {
                      style = "border-slate-200 bg-slate-100/50 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleFillSelect(choice)}
                      disabled={isFillChecked}
                      className={`p-3.5 rounded-xl border text-center font-mono font-bold text-sm sm:text-base transition-all duration-200 shadow-2xs active:scale-98 ${style}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next */}
              {isFillChecked && (
                <div className="rounded-2xl p-4 bg-violet-50 border border-violet-200 animate-in fade-in space-y-3">
                  <div className="text-xs sm:text-sm text-slate-800">
                    <strong className="text-violet-950 font-bold block">
                      Full Formula:
                    </strong>
                    <code className="text-sm font-mono text-violet-900 font-bold">
                      {fillQuestions[fillIndex].formula}
                    </code>
                    <p className="text-slate-600 mt-1">
                      {fillQuestions[fillIndex].examTip}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNextFill}
                      className="px-5 py-2.5 bg-[#142B63] hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs"
                    >
                      <span>
                        {fillIndex + 1 < fillQuestions.length
                          ? "Next Formula"
                          : "Finish Puzzle"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4">
              <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="text-xl font-black text-slate-900">
                Puzzle Round Cleared!
              </h2>
              <p className="text-slate-600 text-sm">
                Final Score: <strong className="text-slate-900">{fillScore}</strong> points.
              </p>
              <button
                onClick={initFillGame}
                className="px-5 py-2.5 bg-[#142B63] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Play Another Round
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MODE 4: FORMULA VAULT (REFERENCE & REVISION) --- */}
      {mode === "vault" && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search formula by name (e.g. Parabola, Inverse, Euler, Bernoulli, Integral...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          {/* Formulas List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredFormulas
              .filter(
                (f) =>
                  f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.chapter.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      {f.chapter}
                    </span>
                    <button
                      onClick={() => handleCopyFormula(f)}
                      className="text-slate-400 hover:text-blue-600 text-xs flex items-center gap-1 transition-colors"
                      title="Copy formula text"
                    >
                      {copiedFormulaId === f.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedFormulaId === f.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {f.name}
                  </h3>

                  <div className="p-2.5 bg-slate-900 text-amber-300 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wide select-all overflow-x-auto">
                    {f.formula}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {f.description}
                  </p>

                  <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/50">
                    <strong>Tip:</strong> {f.examTip}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
