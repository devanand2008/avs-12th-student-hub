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
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  ExternalLink,
} from "lucide-react";
import {
  MATH_FORMULAS,
  MATH_CHAPTERS,
  MathFormula,
} from "@/lib/math-formulas";
import {
  GameSubject,
  SUBJECT_THEMES,
  SCIENCE_QUESTIONS,
  ScienceQuestion,
} from "@/lib/science-games-data";
import { sound } from "@/lib/sound-effects";
import SectionBadge from "@/components/ui/SectionBadge";

type GameMode = "blitz" | "memory" | "fill" | "vault";

interface GenericQuestion {
  id: string;
  chapter: string;
  name: string;
  tamilName?: string;
  formula: string;
  description: string;
  options: string[];
  fillBlank: {
    template: string;
    correct: string;
    options: string[];
  };
  examTip: string;
}

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
  // Subject & Mode Configuration
  const [subject, setSubject] = useState<GameSubject>("maths");
  const [mode, setMode] = useState<GameMode>("blitz");
  const [selectedChapter, setSelectedChapter] = useState<string>("All Chapters");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player Stats (persisted in localStorage)
  const [xp, setXp] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Mode 1: Blitz States
  const [blitzQuestions, setBlitzQuestions] = useState<GenericQuestion[]>([]);
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
  const [fillQuestions, setFillQuestions] = useState<GenericQuestion[]>([]);
  const [fillIndex, setFillIndex] = useState(0);
  const [selectedFillBlank, setSelectedFillBlank] = useState<string | null>(null);
  const [isFillChecked, setIsFillChecked] = useState(false);
  const [fillScore, setFillScore] = useState(0);

  // Mode 4: Vault Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // Active Subject Theme Config
  const theme = SUBJECT_THEMES[subject];

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

  // Convert maths formulas to GenericQuestion
  const allSubjectQuestions: GenericQuestion[] = useMemo(() => {
    if (subject === "maths") {
      return MATH_FORMULAS.map((f) => ({
        id: f.id,
        chapter: f.chapter,
        name: f.name,
        tamilName: f.tamilName,
        formula: f.formula,
        description: f.description,
        options: f.options,
        fillBlank: f.fillBlank,
        examTip: f.examTip,
      }));
    }
    return SCIENCE_QUESTIONS.filter((q) => q.subject === subject);
  }, [subject]);

  // Available chapters for the selected subject
  const availableChapters = useMemo(() => {
    const set = new Set<string>();
    allSubjectQuestions.forEach((q) => set.add(q.chapter));
    return ["All Chapters", ...Array.from(set)];
  }, [allSubjectQuestions]);

  // When subject changes, reset chapter filter
  const handleSubjectChange = (newSubject: GameSubject) => {
    sound.playFlip();
    setSubject(newSubject);
    setSelectedChapter("All Chapters");
  };

  // Filter questions based on selected chapter
  const filteredQuestions = useMemo(() => {
    if (selectedChapter === "All Chapters") return allSubjectQuestions;
    return allSubjectQuestions.filter((f) => f.chapter === selectedChapter);
  }, [allSubjectQuestions, selectedChapter]);

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
    const pool = shuffleArray(filteredQuestions);
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
  }, [filteredQuestions]);

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
    const pool = shuffleArray(filteredQuestions).slice(0, 6);
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
  }, [filteredQuestions]);

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
    const pool = shuffleArray(filteredQuestions);
    const selected = pool.slice(0, Math.min(8, pool.length));
    setFillQuestions(selected);
    setFillIndex(0);
    setSelectedFillBlank(null);
    setIsFillChecked(false);
    setFillScore(0);
  }, [filteredQuestions]);

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

  // Handle switching modes, chapter or subject
  useEffect(() => {
    if (mode === "blitz") initBlitzGame();
    if (mode === "memory") initMemoryGame();
    if (mode === "fill") initFillGame();
  }, [mode, subject, selectedChapter, initBlitzGame, initMemoryGame, initFillGame]);

  // Copy formula text in Vault
  const handleCopyFormula = (f: GenericQuestion) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${f.name}: ${f.formula}`);
      setCopiedFormulaId(f.id);
      setTimeout(() => setCopiedFormulaId(null), 2000);
    }
  };

  // Calculate Level based on XP
  const level = useMemo(() => {
    if (xp < 50) return { title: "Novice", badge: "Level 1" };
    if (xp < 150) return { title: "Apprentice", badge: "Level 2" };
    if (xp < 350) return { title: "Scholar", badge: "Level 3" };
    if (xp < 700) return { title: "Formula Master", badge: "Level 4" };
    return { title: "Grand Centum Genius", badge: "Level 5" };
  }, [xp]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* 1. SUBJECT SWITCHER TABS WITH DISTINCT VISUAL IDENTITIES */}
      <div className="p-1.5 sm:p-2 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5">
        <button
          onClick={() => handleSubjectChange("maths")}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            subject === "maths"
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg scale-102 ring-2 ring-amber-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-300" />
          <span>Mathematics</span>
        </button>

        <button
          onClick={() => handleSubjectChange("physics")}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            subject === "physics"
              ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black shadow-lg scale-102 ring-2 ring-cyan-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Atom className="w-4 h-4 text-cyan-300" />
          <span>Physics</span>
        </button>

        <button
          onClick={() => handleSubjectChange("chemistry")}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            subject === "chemistry"
              ? "bg-gradient-to-r from-emerald-400 to-teal-600 text-slate-950 font-black shadow-lg scale-102 ring-2 ring-emerald-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <FlaskConical className="w-4 h-4 text-emerald-300" />
          <span>Chemistry</span>
        </button>

        <button
          onClick={() => handleSubjectChange("biology")}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            subject === "biology"
              ? "bg-gradient-to-r from-fuchsia-500 to-pink-600 text-slate-950 font-black shadow-lg scale-102 ring-2 ring-fuchsia-300"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Dna className="w-4 h-4 text-fuchsia-300" />
          <span>Biology</span>
        </button>
      </div>

      {/* 2. DYNAMIC SUBJECT HERO BANNER & STATUS */}
      <div
        className={`rounded-3xl bg-gradient-to-br ${theme.heroGradient} p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-white/10 transition-all duration-500`}
      >
        <div className={`absolute top-0 right-0 w-80 h-80 ${theme.bgGlow} rounded-full blur-3xl pointer-events-none`} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Title */}
          <div className="flex items-start sm:items-center gap-3.5">
            <SectionBadge type={subject === "maths" ? "math" : subject} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`${theme.primaryButton} text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  {theme.badge}
                </span>
                <span className="text-white/80 text-xs font-semibold">
                  Tamil Nadu Class 12 · {theme.tamilName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-heading text-white tracking-tight mt-1">
                {theme.name} Formula & Law Quest
              </h1>
              <p className="text-xs sm:text-sm text-slate-200/90 font-medium">
                {theme.tagline}
              </p>
            </div>
          </div>

          {/* Right Stats & Audio */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-white/15">
            <div className="px-3 py-1.5 bg-black/40 rounded-xl text-center border border-white/10">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                {level.title}
              </div>
              <div className={`text-sm font-extrabold ${theme.accentText}`}>
                {xp} <span className="text-[10px] text-white/80 font-semibold">XP</span>
              </div>
            </div>

            <div className="px-3 py-1.5 bg-black/40 rounded-xl text-center border border-white/10">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                Streak
              </div>
              <div className="text-sm font-extrabold text-orange-300">
                {currentStreak}x
              </div>
            </div>

            <div className="px-3 py-1.5 bg-black/40 rounded-xl text-center border border-white/10">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                Best
              </div>
              <div className="text-sm font-extrabold text-white">
                {highScore}
              </div>
            </div>

            <button
              onClick={toggleSound}
              className={`touch-target p-2.5 rounded-xl border transition-all ${
                soundEnabled
                  ? "bg-white/20 text-white border-white/30 hover:bg-white/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }`}
              title={soundEnabled ? "Mute audio effects" : "Turn audio on"}
              aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Golden Material Quick Access Callout for Maths */}
        {subject === "maths" && (
          <div className="mt-4 p-3 bg-amber-400/20 backdrop-blur-md rounded-2xl border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-xs text-amber-100 font-semibold">
                <strong>Official Golden Material:</strong> Class 12 Full Maths Golden Formula Sheet (12 Pages, Vol 1 & 2) is now available!
              </span>
            </div>
            <a
              href="/pdf/maths-golden-formula-sheet.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Golden Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Game Mode Navigation Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => setMode("blitz")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              mode === "blitz"
                ? `${theme.primaryButton} shadow-md scale-102`
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
                ? `${theme.primaryButton} shadow-md scale-102`
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
                ? `${theme.primaryButton} shadow-md scale-102`
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
                ? `${theme.primaryButton} shadow-md scale-102`
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
          {theme.name} Topic:
        </span>
        {availableChapters.map((chap) => (
          <button
            key={chap}
            onClick={() => setSelectedChapter(chap)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 ${
              selectedChapter === chap
                ? "bg-slate-900 text-white shadow-xs font-bold ring-2 ring-slate-800"
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
                <span className={`px-2.5 py-1 ${theme.pillBg} rounded-lg`}>
                  {blitzQuestions[currentBlitzIndex].chapter}
                </span>
                <span className="font-mono text-slate-700">
                  Question {currentBlitzIndex + 1} of {blitzQuestions.length}
                </span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  Score: {blitzScore}
                </span>
              </div>

              {/* Concept Prompt */}
              <div className="text-center py-4 px-2 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Identify the Correct Law / Formula for {theme.name}
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

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {shuffledOptions.map((opt, i) => {
                  const isCorrectAnswer =
                    opt === blitzQuestions[currentBlitzIndex].options[0];
                  const isChosen = selectedOption === opt;

                  let cardStyle =
                    "border-slate-200 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/50 text-slate-800";
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
                <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200 animate-in fade-in duration-300 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-slate-800">
                      <strong className="text-slate-900 block font-bold">
                        Exam Tip & Concept:
                      </strong>
                      {blitzQuestions[currentBlitzIndex].examTip}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleNextBlitz}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
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
                {theme.name} Round Complete!
              </h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                You scored <strong className="text-slate-900">{blitzScore} points</strong> with a max streak of{" "}
                <strong className="text-orange-600">{maxStreak}x</strong>!
              </p>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={initBlitzGame}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => setMode("vault")}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Review {theme.name} Vault</span>
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
              <span className="text-slate-900 font-extrabold">
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
                        ? "border-slate-800 bg-white text-slate-900 shadow-md scale-102 ring-2 ring-slate-800/20"
                        : "border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/40 hover:border-slate-400 hover:shadow-sm"
                    }`}
                  >
                    {isOpen ? (
                      <div className="animate-in zoom-in-95 duration-200 flex flex-col items-center justify-center h-full w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          {card.type === "concept" ? "Concept" : "Formula / Law"}
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
                <span className={`px-2.5 py-1 ${theme.pillBg} rounded-lg`}>
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Fill in the Missing Term or Coefficient
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  {fillQuestions[fillIndex].name}
                </h2>
                <div className="my-5 p-5 bg-slate-900 text-white rounded-2xl font-mono text-base sm:text-xl font-bold tracking-wide inline-block shadow-inner max-w-full overflow-x-auto">
                  {fillQuestions[fillIndex].fillBlank.template.split("[?]")[0]}
                  <span
                    className={`inline-block mx-1.5 px-3 py-1 ${theme.blankPill} rounded-lg font-extrabold animate-pulse`}
                  >
                    {selectedFillBlank || "?"}
                  </span>
                  {fillQuestions[fillIndex].fillBlank.template.split("[?]")[1]}
                </div>
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fillQuestions[fillIndex].fillBlank.options.map((choice) => {
                  const isCorrect =
                    choice === fillQuestions[fillIndex].fillBlank.correct;
                  const isSelected = selectedFillBlank === choice;

                  let style =
                    "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-400 hover:bg-slate-100";
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
                <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200 animate-in fade-in space-y-3">
                  <div className="text-xs sm:text-sm text-slate-800">
                    <strong className="text-slate-900 font-bold block">
                      Full Formula:
                    </strong>
                    <code className="text-sm font-mono text-blue-900 font-bold">
                      {fillQuestions[fillIndex].formula}
                    </code>
                    <p className="text-slate-600 mt-1">
                      {fillQuestions[fillIndex].examTip}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNextFill}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs"
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
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
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
              placeholder={`Search ${theme.name} formulas, laws or chapters...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-500 transition-all shadow-2xs"
            />
          </div>

          {/* Formulas List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredQuestions
              .filter(
                (f) =>
                  f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.chapter.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-slate-400 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${theme.pillBg}`}>
                      {f.chapter}
                    </span>
                    <button
                      onClick={() => handleCopyFormula(f)}
                      className="text-slate-400 hover:text-slate-800 text-xs flex items-center gap-1 transition-colors"
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

                  <div className="p-2.5 bg-slate-900 text-white rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wide select-all overflow-x-auto">
                    {f.formula}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {f.description}
                  </p>

                  <div className="text-[11px] text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200">
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
