import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';

export const ProjectorStageView = () => {
  const {
    room,
    questions,
    activeQuestionIndex,
    isAnswerRevealed,
    revealedClueCount,
    revealNextClue,
    resetClues,
    revealAnswer,
    setActiveQuestion,
    activeRound,
    switchRound,
    startRound,
    lockRound,
    resetBuzzer,
    categoryTitleActive,
    setCategoryTitleActive,
    timerRemaining,
    timerDuration,
    isTimerPaused,
    isTimerRunning,
    isAutoTimerEnabled,
    setIsAutoTimerEnabled,
    toggleTimerPause,
    teamScores,
    awardPoints,
    adjustPoints,
  } = useAdmin();

  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Buzzer list is visible by default alongside stage questions, toggleable with Key B
  const [showBuzzerList, setShowBuzzerList] = useState(true);

  // Selected Team in Buzzer List to award Clue 1/2/3/4 points
  const [selectedTeamIdForPoints, setSelectedTeamIdForPoints] = useState(null);

  // Fullscreen Clue Image Lightbox State
  const [fullscreenImage, setFullscreenImage] = useState(null); // { url, clueNumber, clueText }

  // Sync fullscreen state with browser events (e.g. user presses ESC to exit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const target = containerRef.current || document.documentElement;
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  const currentQ = questions[activeQuestionIndex] || {
    question: 'Mystery Subject',
    category: 'Guess the Movie',
    clues: [
      'Clue 1 is available. Listen carefully!',
      'Clue 2 reveals more details about the mystery.',
      'Clue 3 narrows down the possible answers.',
      'Clue 4 provides the final giveaway clue!',
    ],
    answer: 'ANSWER',
  };

  const currentCategory = currentQ.category || 'Guess the Movie';

  // Helper to get Category Metadata (Category number, Icon, Title, Subtitle, Description)
  const getCategoryMeta = (catName) => {
    switch (catName) {
      case 'Guess the Movie':
        return {
          num: 1,
          icon: '🎬',
          title: 'Guess the Movie',
          subtitle: 'Category 1 of 4',
          description: 'Identify the mystery film from 4 progressive visual clue images! Clue 1: 30s • Clues 2-4: 15s each.',
        };
      case 'Guess the Hidden Category':
        return {
          num: 2,
          icon: '🔍',
          title: 'Guess the Hidden Category',
          subtitle: 'Category 2 of 4',
          description: 'Uncover the hidden common connection connecting all 4 clue words! Clue 1: 30s • Clues 2-4: 15s each.',
        };
      case 'Guess the Cartoon':
        return {
          num: 3,
          icon: '🎨',
          title: 'Guess the Cartoon',
          subtitle: 'Category 3 of 4',
          description: 'Name the iconic animated character or show from 4 clue descriptions! Clue 1: 30s • Clues 2-4: 15s each.',
        };
      case 'Guess The Game':
      case 'Guess the Game':
        return {
          num: 4,
          icon: '🎮',
          title: 'Guess The Game',
          subtitle: 'Category 4 of 4',
          description: 'Spot the famous mobile, console or board game from 4 clue keywords! Clue 1: 30s • Clues 2-4: 15s each.',
        };
      case 'Guess the Lyrics':
      case 'Guess The Lyrics':
        return {
          num: 1,
          icon: '🎵',
          title: 'Guess the Lyrics',
          subtitle: 'Round 2 - Challenge Set 1',
          description: 'Identify the iconic Tamil song lyrics from translated English lines, genre, music director, and cast! Clue 1: 30s • Clues 2-4: 15s each.',
        };
      case 'Movie Frames Identification':
      case 'Identify the Tamil Movie':
      case 'Demo 1 - Identify the Tamil Movie':
        return {
          num: 2,
          icon: '🎬',
          title: 'Movie Frames Identification',
          subtitle: 'Round 2 - Challenge Set 2',
          description: 'Identify the Tamil movie from 2 visual frame scene clues! Clue 1: 30s • Clue 2: 15s.',
        };
      default:
        return {
          num: 1,
          icon: '⭐',
          title: catName || 'Pinpoint Challenge',
          subtitle: 'Round 1 Challenge',
          description: 'Clues will be revealed progressively.',
        };
    }
  };

  const categoryMeta = getCategoryMeta(currentCategory);

  const clues = currentQ.clues && currentQ.clues.length > 0
    ? currentQ.clues
    : ['No clue provided.'];

  const clueImages = currentQ.clueImages && currentQ.clueImages.length > 0
    ? currentQ.clueImages
    : [];

  const totalClues = clues.length;

  const answer = currentQ.answer || (currentQ.options && currentQ.options[currentQ.correctOptionIndex]) || 'REVEALED';

  const queue = room ? room.buzzQueue || [] : [];
  const winner = queue.length > 0 ? queue[0] : null;
  const isActive = room ? room.roundStatus === 'ACTIVE' : false;

  // Keep fullscreen lightbox in sync with live stage clues and answer while open!
  useEffect(() => {
    setFullscreenImage((prev) => {
      if (!prev) return null; // If lightbox is not open, keep it closed!
      if (categoryTitleActive) return null; // Close if entering category title slide

      if (isAnswerRevealed) {
        return {
          url: currentQ.answerImage || '',
          clueNumber: 'Answer',
          clueText: answer,
        };
      }

      if (revealedClueCount > 0) {
        const idx = Math.min(revealedClueCount - 1, totalClues - 1);
        return {
          url: clueImages[idx] || '',
          clueNumber: idx + 1,
          clueText: clues[idx] || '',
        };
      }

      return prev;
    });
  }, [revealedClueCount, isAnswerRevealed, activeQuestionIndex, categoryTitleActive, currentQ, answer, clueImages, clues, totalClues]);

  // Toggle expand image manually with Key 'X' or button click
  const toggleExpandImage = useCallback(() => {
    setFullscreenImage((prev) => {
      if (prev) return null;
      if (isAnswerRevealed) {
        return {
          url: currentQ.answerImage || '',
          clueNumber: 'Answer',
          clueText: answer,
        };
      }
      if (revealedClueCount > 0 && revealedClueCount <= totalClues) {
        const latestClueIndex = revealedClueCount - 1;
        return {
          url: clueImages[latestClueIndex] || '',
          clueNumber: revealedClueCount,
          clueText: clues[latestClueIndex] || '',
        };
      }
      return null;
    });
  }, [isAnswerRevealed, currentQ.answerImage, answer, revealedClueCount, clueImages, clues, totalClues]);

  // Progressive button action handler (Spacebar / Click)
  const handleProgressiveAction = useCallback(() => {
    // If category title slide is currently showing, start Category Questions!
    if (categoryTitleActive) {
      setCategoryTitleActive(false);
      return;
    }

    if (revealedClueCount < totalClues) {
      revealNextClue();
    } else if (!isAnswerRevealed) {
      revealAnswer(true);
      // Keeps lightbox open if already open!
    } else {
      if (activeQuestionIndex < questions.length - 1) {
        const nextIndex = activeQuestionIndex + 1;
        const currentCat = questions[activeQuestionIndex]?.category;
        const nextCat = questions[nextIndex]?.category;
        setActiveQuestion(nextIndex);
        if (currentCat !== nextCat) {
          // Entering a new category! Automatically show the Category Title Cover Slide
          setCategoryTitleActive(true);
          setFullscreenImage(null);
        }
      }
    }
  }, [categoryTitleActive, setCategoryTitleActive, revealedClueCount, totalClues, isAnswerRevealed, revealNextClue, revealAnswer, activeQuestionIndex, questions, setActiveQuestion]);

  const handleResetToFirstQuestion = useCallback(() => {
    setActiveQuestion(0);
    resetClues();
    setCategoryTitleActive(false);
    setFullscreenImage(null);
  }, [setActiveQuestion, resetClues]);

  const handlePrevQuestion = useCallback(() => {
    if (activeQuestionIndex > 0) {
      const prevIndex = activeQuestionIndex - 1;
      const currentCat = questions[activeQuestionIndex]?.category;
      const prevCat = questions[prevIndex]?.category;
      setActiveQuestion(prevIndex);
      resetClues();
      if (currentCat !== prevCat) {
        setCategoryTitleActive(true);
        setFullscreenImage(null);
      } else {
        setCategoryTitleActive(false);
      }
    }
  }, [activeQuestionIndex, questions, setActiveQuestion, resetClues]);

  const handleNextQuestion = useCallback(() => {
    if (activeQuestionIndex < questions.length - 1) {
      const nextIndex = activeQuestionIndex + 1;
      const currentCat = questions[activeQuestionIndex]?.category;
      const nextCat = questions[nextIndex]?.category;
      setActiveQuestion(nextIndex);
      resetClues();
      if (currentCat !== nextCat) {
        setCategoryTitleActive(true);
        setFullscreenImage(null);
      } else {
        setCategoryTitleActive(false);
      }
    }
  }, [activeQuestionIndex, questions, setActiveQuestion, resetClues]);

  // Keyboard shortcuts:
  // Space / ArrowRight: Next clue / reveal answer / dismiss title slide
  // ArrowLeft: Prev challenge / Category Title Slide
  // Key P: Toggle pause / resume clue timer
  // Key T: Toggle Category Title Slide
  // Key A: Instantly reveal final answer
  // Key B: Toggle Buzzer List
  // Key F: Toggle Fullscreen
  // Key R: Reset clues to Clue 1 (restarts 30s timer)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleProgressiveAction();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevQuestion();
      } else if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        toggleTimerPause();
      } else if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setCategoryTitleActive((prev) => !prev);
      } else if (e.code === 'KeyA' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        revealAnswer(true);
      } else if (e.code === 'KeyB' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowBuzzerList((prev) => !prev);
      } else if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetToFirstQuestion();
      } else if (e.code === 'KeyX' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        toggleExpandImage();
      } else if (e.key === 'Escape') {
        if (fullscreenImage) {
          e.preventDefault();
          setFullscreenImage(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleProgressiveAction, activeQuestionIndex, setActiveQuestion, resetClues, revealAnswer, fullscreenImage, toggleTimerPause, setCategoryTitleActive, toggleExpandImage]);

  return (
    <div
      ref={containerRef}
      className={`projector-fullscreen-container ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={{
        height: isFullscreen ? '100vh' : 'auto',
        minHeight: isFullscreen ? '100vh' : '78vh',
        maxHeight: isFullscreen ? '100vh' : 'none',
        overflow: isFullscreen ? 'hidden' : 'visible',
        gap: isFullscreen ? '8px' : '16px',
      }}
    >
      {/* Top Header & Stage Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: isFullscreen ? '8px 20px' : '4px 0',
        flexShrink: 0,
        borderRadius: isFullscreen ? '16px' : '0',
        background: isFullscreen ? 'rgba(15, 23, 42, 0.75)' : 'transparent',
        backdropFilter: isFullscreen ? 'blur(10px)' : 'none',
        border: isFullscreen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
      }}>
        {/* Left: Branding & Round Selector (R1 & R2 prominent in BOTH Fullscreen & Normal mode) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!isFullscreen && (
            <h2 style={{
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
              letterSpacing: '0.04em',
            }}>
              <span>📽️</span> STAGE PROJECTOR
            </h2>
          )}

          {/* R1 & R2 Round Switcher Buttons (Always visible in Fullscreen and Normal mode) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(0, 0, 0, 0.65)',
            padding: '3px 6px',
            borderRadius: '12px',
            border: '1.5px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
          }}>
            <button
              onClick={() => switchRound(1)}
              style={{
                padding: isFullscreen ? '6px 16px' : '4px 12px',
                borderRadius: '8px',
                border: activeRound === 1 ? '1px solid #38BDF8' : 'none',
                background: activeRound === 1 ? 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)' : 'transparent',
                color: activeRound === 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                fontSize: isFullscreen ? '13px' : '11.5px',
                fontWeight: 900,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: activeRound === 1 ? '0 0 14px rgba(56, 189, 248, 0.6)' : 'none',
                transition: 'all 0.2s ease',
              }}
              title="Switch to Round 1 (R1: Movies, Hidden Category, Cartoon, Games)"
            >
              📁 R1
            </button>
            <button
              onClick={() => switchRound(2)}
              style={{
                padding: isFullscreen ? '6px 16px' : '4px 12px',
                borderRadius: '8px',
                border: activeRound === 2 ? '1px solid #F59E0B' : 'none',
                background: activeRound === 2 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'transparent',
                color: activeRound === 2 ? '#000000' : 'rgba(255, 255, 255, 0.6)',
                fontSize: isFullscreen ? '13px' : '11.5px',
                fontWeight: 900,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: activeRound === 2 ? '0 0 14px rgba(245, 158, 11, 0.6)' : 'none',
                transition: 'all 0.2s ease',
              }}
              title="Switch to Round 2 (R2: Lyrics & Tamil Movies)"
            >
              🎬 R2
            </button>
          </div>

          {/* Category Tag */}
          <span style={{
            background: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--accent-cyan)',
            border: '1.2px solid rgba(56, 189, 248, 0.35)',
            padding: isFullscreen ? '6px 16px' : '4px 12px',
            borderRadius: '24px',
            fontSize: isFullscreen ? '13px' : '11.5px',
            fontWeight: 900,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
          }}>
            <span>{categoryMeta.icon}</span>
            <span>{categoryMeta.title.toUpperCase()}</span>
          </span>

          {!isFullscreen && room && (
            <span className="pill pill-blue" style={{ fontSize: '11px', padding: '3px 10px' }}>
              ARENA: <strong style={{ color: 'var(--winner-gold)' }}>{room.roomId}</strong>
            </span>
          )}
        </div>

        {/* Right: Category Tabs, Timer Badge, Controls & Side Buzzer List Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isFullscreen ? '12px' : '8px', flexWrap: 'wrap' }}>
          {/* Round 1 Category Quick-Jump Tabs (Movie, Hidden, Cartoon, Game) */}
          {activeRound === 1 && !isFullscreen && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 4px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              {[
                { cat: 'Guess the Movie', icon: '🎬', label: 'Movie' },
                { cat: 'Guess the Hidden Category', icon: '🔍', label: 'Hidden' },
                { cat: 'Guess the Cartoon', icon: '🎨', label: 'Cartoon' },
                { cat: 'Guess The Game', icon: '🎮', label: 'Game' },
              ].map((item) => {
                const isCurrent = currentCategory.toLowerCase().includes(item.label.toLowerCase());
                return (
                  <button
                    key={item.cat}
                    onClick={() => {
                      const idx = questions.findIndex(q =>
                        q.category === item.cat ||
                        q.category.toLowerCase().includes(item.label.toLowerCase())
                      );
                      if (idx !== -1) {
                        setActiveQuestion(idx);
                        setCategoryTitleActive(false);
                      }
                    }}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      border: isCurrent ? '1px solid var(--accent-cyan)' : 'none',
                      background: isCurrent ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                      color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: isCurrent ? 900 : 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Select and navigate to ${item.cat}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Round 2 Category Quick-Jump Tabs (Lyrics, Movie Frames) */}
          {activeRound === 2 && !isFullscreen && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 4px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              {[
                { cat: 'Guess the Lyrics', icon: '🎵', label: 'Lyrics' },
                { cat: 'Movie Frames Identification', icon: '🎬', label: 'Movie Frames' },
              ].map((item) => {
                const isCurrent = currentCategory.toLowerCase().includes(item.label.toLowerCase()) ||
                  (item.label === 'Movie Frames' && (currentCategory.includes('Movie') || currentCategory.includes('Frames')));
                return (
                  <button
                    key={item.cat}
                    onClick={() => {
                      const idx = questions.findIndex(q =>
                        q.category === item.cat ||
                        q.category.toLowerCase().includes(item.label.toLowerCase()) ||
                        (item.label === 'Movie Frames' && (q.category.includes('Movie') || q.category.includes('Frames')))
                      );
                      if (idx !== -1) {
                        setActiveQuestion(idx);
                        setCategoryTitleActive(false);
                      }
                    }}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      border: isCurrent ? '1px solid #F59E0B' : 'none',
                      background: isCurrent ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                      color: isCurrent ? '#F59E0B' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: isCurrent ? 900 : 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Select and navigate to ${item.cat}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Category Title Slide Button */}
          <button
            onClick={() => setCategoryTitleActive((prev) => !prev)}
            className={`btn btn-sm ${categoryTitleActive ? 'btn-primary pulsing-glow' : 'btn-outline'}`}
            style={{
              padding: isFullscreen ? '6px 12px' : '4px 10px',
              fontSize: isFullscreen ? '12px' : '11.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Toggle Category Title Slide (Key T)"
          >
            <span>🎬</span>
            <span>{categoryTitleActive ? 'Exit Title' : 'Title Slide'}</span>
            <span style={{ fontSize: '10px', opacity: 0.8, background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '4px' }}>T</span>
          </button>

          {/* Live Clue Countdown Timer Pill (Prominent Seconds in Fullscreen) */}
          {!categoryTitleActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isFullscreen ? '10px' : '6px',
              background: isFullscreen ? 'rgba(15, 23, 42, 0.85)' : 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: isFullscreen ? '6px 18px' : '3px 10px',
              borderRadius: isFullscreen ? '28px' : '20px',
              border: `2px solid ${isTimerPaused ? 'var(--winner-gold)' : (timerRemaining <= 5 ? '#EF4444' : (timerRemaining <= 10 ? '#F59E0B' : 'var(--accent-cyan)'))}`,
              boxShadow: isTimerPaused
                ? '0 0 20px rgba(251, 191, 36, 0.45)'
                : (timerRemaining <= 5 ? '0 0 22px rgba(239, 68, 68, 0.6)' : (isFullscreen ? '0 0 18px rgba(56, 189, 248, 0.3)' : 'none')),
              transition: 'all 0.3s ease',
            }}>
              {isAnswerRevealed ? (
                <span style={{ fontSize: isFullscreen ? '14px' : '11px', fontWeight: 900, color: 'var(--winner-gold)' }}>
                  🏆 ANSWER
                </span>
              ) : isTimerPaused ? (
                <span
                  onClick={toggleTimerPause}
                  style={{ fontSize: isFullscreen ? '14px' : '11px', fontWeight: 900, color: 'var(--winner-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Timer paused! Press P or click to resume"
                >
                  <span style={{ fontSize: isFullscreen ? '16px' : '12px' }}>⏸️</span>
                  <span>PAUSED</span>
                  <span style={{ fontSize: isFullscreen ? '10.5px' : '9.5px', opacity: 0.85 }}>(Key P)</span>
                </span>
              ) : (revealedClueCount === totalClues && timerRemaining === 0) ? (
                <span style={{ fontSize: isFullscreen ? '14px' : '11px', fontWeight: 900, color: 'var(--winner-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏰ TIME'S UP</span>
                  <span style={{ fontSize: isFullscreen ? '11px' : '9.5px', color: 'rgba(255,255,255,0.7)' }}>• Await Host</span>
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: isFullscreen ? '8px' : '5px' }}>
                  <span style={{
                    fontSize: isFullscreen ? '22px' : '13px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color: timerRemaining <= 5 ? '#EF4444' : (timerRemaining <= 10 ? '#F59E0B' : 'var(--accent-cyan)'),
                    letterSpacing: '0.04em',
                    textShadow: timerRemaining <= 5 ? '0 0 14px rgba(239, 68, 68, 0.8)' : (isFullscreen ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'),
                  }}>
                    ⏱️ {timerRemaining}s
                  </span>
                  <span style={{
                    fontSize: isFullscreen ? '12px' : '9.5px',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                  }}>
                    ({revealedClueCount === 1 ? '30s' : '15s'})
                  </span>
                </div>
              )}

              {/* Pause / Resume Button */}
              {!isAnswerRevealed && !(revealedClueCount === totalClues && timerRemaining === 0) && (
                <button
                  onClick={toggleTimerPause}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isTimerPaused ? 'var(--winner-gold)' : 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    fontSize: isFullscreen ? '14px' : '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isTimerPaused ? 'Resume Timer (Key P)' : 'Pause Timer (Key P)'}
                >
                  {isTimerPaused ? '▶️' : '⏸️'}
                </button>
              )}
            </div>
          )}

          {/* Challenge Navigation */}
          <button
            onClick={handlePrevQuestion}
            disabled={activeQuestionIndex === 0}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 800 }}
            title="Previous Question (←)"
          >
            ◀ Prev
          </button>
          <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--accent-cyan)', minWidth: '40px', textAlign: 'center' }}>
            Q{activeQuestionIndex + 1}/{questions.length}
          </span>
          <button
            onClick={handleNextQuestion}
            disabled={activeQuestionIndex >= questions.length - 1}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 800 }}
            title="Next Question (→)"
          >
            Next ▶
          </button>

          {/* Reset to First Question Button */}
          <button
            onClick={handleResetToFirstQuestion}
            className="btn btn-outline btn-sm"
            style={{ fontWeight: 800, borderColor: 'rgba(255, 255, 255, 0.25)' }}
            title="Reset to First Question (Q1) from beginning (Key R)"
          >
            🔄 Reset (Q1)
          </button>

          {/* THE BUZZER LIST TOGGLE BUTTON:
              Question occupies entire screen by default.
              Pressing this button slides the buzzer press list in on the side. */}
          <button
            onClick={() => setShowBuzzerList((prev) => !prev)}
            className={`btn btn-sm ${showBuzzerList ? 'btn-secondary' : (queue.length > 0 ? 'btn-warning pulsing-gold-badge' : 'btn-primary')}`}
            style={{
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11.5px',
            }}
            title="Toggle Buzzer Press List on the side (Key B)"
          >
            <span>{showBuzzerList ? '✕' : '⚡'}</span>
            <span>{showBuzzerList ? 'Hide Buzzer' : 'Buzzer'}</span>
            {queue.length > 0 && (
              <span style={{
                background: showBuzzerList ? 'rgba(255,255,255,0.2)' : '#000000',
                color: showBuzzerList ? '#FFFFFF' : 'var(--winner-gold)',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10.5px',
                fontWeight: 900,
              }}>
                {queue.length}
              </span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="btn btn-outline btn-sm"
            style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', fontSize: '11.5px' }}
            title="Toggle Fullscreen (Key F)"
          >
            {isFullscreen ? '🗗 Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Main Split Layout:
          - Left: Full Screen Question (occupies 100% by default, or calc(100% - 380px) when buzzer list is open)
          - Right: Buzzer Press User List (hidden until button is pressed) */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '20px',
        width: '100%',
        position: 'relative',
        alignItems: 'stretch',
        minHeight: isFullscreen ? '0' : '620px',
        overflow: 'hidden',
      }}>
        {/* ============================================================ */}
        {/* 1. MAIN SCREEN: FOCUS ONLY ON QUESTION / CLUES              */}
        {/*    Occupies entire screen by default                         */}
        {/* ============================================================ */}
        <div
          className="glass-card liquid-glass-stage"
          style={{
            flex: 1,
            width: showBuzzerList ? 'calc(100% - 390px)' : '100%',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: isFullscreen ? '16px 28px' : '28px 36px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {categoryTitleActive ? (
            /* ============================================================ */
            /* CATEGORY TITLE COVER SLIDE (Round 1)                         */
            /* Pure title slide: Not a question, not a clue!               */
            /* ============================================================ */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: isFullscreen ? '40px 60px' : '24px 30px',
              animation: 'fadeIn 0.4s ease',
              width: '100%',
              margin: 'auto 0',
            }}>
              {/* Category Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '30px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                color: 'var(--accent-cyan)',
                fontSize: isFullscreen ? '15px' : '13px',
                fontWeight: 900,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: isFullscreen ? '28px' : '20px',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
              }}>
                <span>⭐</span> ROUND 1 • {categoryMeta.subtitle}
              </div>

              {/* Large Animated Icon */}
              <div style={{
                fontSize: isFullscreen ? '96px' : '72px',
                marginBottom: isFullscreen ? '20px' : '16px',
                filter: 'drop-shadow(0 0 35px rgba(99, 102, 241, 0.7))',
                lineHeight: 1,
              }}>
                {categoryMeta.icon}
              </div>

              {/* Main Category Title */}
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: isFullscreen ? '58px' : '44px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: '0 0 16px 0',
                background: 'linear-gradient(135deg, #FFFFFF 20%, #38BDF8 60%, #818CF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 10px 40px rgba(56, 189, 248, 0.3)',
                lineHeight: 1.2,
              }}>
                {categoryMeta.title}
              </h1>

              {/* Category Description */}
              <p style={{
                fontSize: isFullscreen ? '21px' : '17px',
                color: 'rgba(255, 255, 255, 0.78)',
                maxWidth: '720px',
                lineHeight: 1.6,
                margin: '0 0 36px 0',
                fontWeight: 500,
              }}>
                {categoryMeta.description}
              </p>

              {/* Start Category Button */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => setCategoryTitleActive(false)}
                  className="btn btn-primary pulsing-glow"
                  style={{
                    padding: isFullscreen ? '16px 44px' : '14px 34px',
                    fontSize: isFullscreen ? '18px' : '15px',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 12px 35px rgba(99, 102, 241, 0.55)',
                    cursor: 'pointer',
                  }}
                >
                  <span>▶</span> START {categoryMeta.title.toUpperCase()}
                  <span style={{
                    fontSize: '11px',
                    opacity: 0.85,
                    padding: '2px 8px',
                    background: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '6px',
                  }}>
                    SPACE
                  </span>
                </button>
              </div>

              <div style={{
                marginTop: '26px',
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                <span>⏱️ Clue 1: 30s</span>
                <span>•</span>
                <span>⏱️ Clues 2-4: 15s</span>
                <span>•</span>
                <span>⏸️ Press 'P' to Pause Timer</span>
                <span>•</span>
                <span>🏆 Answer: Host Reveal</span>
              </div>
            </div>
          ) : (
            <>
              {/* Header Info Inside Stage */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '14px',
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>{categoryMeta.icon}</span>
                  <span>{currentCategory.toUpperCase()} • CHALLENGE #{activeQuestionIndex + 1} OF {questions.length}</span>
                </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              {/* If participants have buzzed, show a quick notification badge */}
              {winner && !showBuzzerList && (
                <button
                  onClick={() => setShowBuzzerList(true)}
                  style={{
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid var(--winner-gold)',
                    color: 'var(--winner-gold)',
                    borderRadius: '20px',
                    padding: '4px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Click to view all buzzer standings"
                >
                  <span>👑 First Buzz: {winner.name}</span>
                  <span style={{ fontSize: '10.5px', opacity: 0.8 }}>• Open List ▶</span>
                </button>
              )}

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
              }}>
                ⚡ PINPOINT CLUE SYSTEM
              </span>
            </div>
          </div>

          {/* ── SINGLE ACTIVE CLUE / REVEALED ANSWER — FULLSCREEN DISPLAY ── */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            minHeight: 0,
            overflowY: 'auto',
            position: 'relative',
            perspective: '1200px',
            transformStyle: 'preserve-3d',
            margin: isFullscreen ? '6px 0' : '14px 0',
          }}>
            {isAnswerRevealed ? (
              /* ── HEROIC LIQUID FINAL ANSWER DISPLAY ── */
              <div 
                className="stage-card-flip liquid-answer-stage"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  maxHeight: '100%',
                  padding: isFullscreen ? '16px 24px' : '16px 20px',
                  borderRadius: '20px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  overflowY: 'auto',
                }}>
                <div style={{
                  fontSize: isFullscreen ? '13px' : '11px',
                  fontWeight: 900,
                  letterSpacing: '0.22em',
                  color: 'var(--winner-gold)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span>🏆</span> FINAL ANSWER REVEALED
                </div>
                
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: isFullscreen ? '38px' : '28px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                  textShadow: '0 0 25px rgba(251, 191, 36, 0.8)',
                  lineHeight: 1.2,
                  marginBottom: currentQ.answerImage ? '12px' : '0',
                }}>
                  {answer}
                </div>

                {currentQ.answerImage && (
                  <div style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={currentQ.answerImage}
                      alt="Revealed Answer"
                      onClick={() => setFullscreenImage({
                        url: currentQ.answerImage,
                        clueNumber: 0,
                        clueText: `Final Answer: ${answer}`,
                      })}
                      style={{
                        maxWidth: '100%',
                        maxHeight: isFullscreen ? '35vh' : '220px',
                        objectFit: 'contain',
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                        border: '2px solid rgba(251, 191, 36, 0.4)',
                        cursor: 'zoom-in',
                      }}
                    />
                  </div>
                )}
              </div>
            ) : revealedClueCount === 0 ? (
              /* ── No clues revealed yet — "Ready" state ── */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <div style={{
                  fontSize: isFullscreen ? '64px' : '48px',
                  opacity: 0.3,
                }}>
                  🔍
                </div>
                <div style={{
                  fontSize: isFullscreen ? '28px' : '22px',
                  fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.35)',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                }}>
                  CHALLENGE #{activeQuestionIndex + 1} READY
                </div>
                <div style={{
                  fontSize: isFullscreen ? '16px' : '14px',
                  color: 'rgba(255, 255, 255, 0.2)',
                  textAlign: 'center',
                }}>
                  Press the button below or hit [Space] to reveal Clue 1
                </div>
              </div>
            ) : (() => {
              /* ── Show the CURRENT ACTIVE clue fullscreen ── */
              const activeIdx = revealedClueCount - 1;
              const activeClueText = clues[activeIdx];
              const activeClueImage = clueImages[activeIdx];
              const activeClueNumber = revealedClueCount;

              if (activeClueImage) {
                /* ── Clue WITH image: image fills entire area, text at bottom ── */
                return (
                  <div
                    key={`clue-card-${activeClueNumber}-${activeIdx}`}
                    className="stage-card-flip liquid-image-reveal"
                    onClick={() => setFullscreenImage({
                      url: activeClueImage,
                      clueNumber: activeClueNumber,
                      clueText: activeClueText,
                    })}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'zoom-in',
                    }}
                  >
                    {/* Background image fills the entire area */}
                    <img
                      src={activeClueImage}
                      alt={`Clue #${activeClueNumber} Visual`}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    {/* Gradient overlay at bottom for text readability */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%)',
                      padding: isFullscreen ? '60px 32px 24px 32px' : '50px 24px 20px 24px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '16px',
                    }}>
                      {/* Clue badge */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: isFullscreen ? '10px 18px' : '8px 14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                      }}>
                        <span style={{
                          fontSize: isFullscreen ? '13px' : '11px',
                          fontWeight: 900,
                          letterSpacing: '0.14em',
                          color: '#FFFFFF',
                        }}>
                          CLUE {activeClueNumber} OF {totalClues}
                        </span>
                      </div>

                      {/* Clue text */}
                      <div style={{
                        flex: 1,
                        fontSize: isFullscreen ? '22px' : '17px',
                        color: '#FFFFFF',
                        lineHeight: 1.45,
                        fontWeight: 600,
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)',
                      }}>
                        {activeClueText}
                      </div>

                      {/* Fullscreen hint */}
                      <div style={{
                        flexShrink: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(56, 189, 248, 0.5)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: 'var(--accent-cyan)',
                        fontSize: '11px',
                        fontWeight: 900,
                      }}>
                        <span>⛶</span> EXPAND (X)
                      </div>
                    </div>
                  </div>
                );
              }

              /* ── Clue WITHOUT image: centered text fullscreen ── */
              return (
                <div
                  key={`clue-card-txt-${activeClueNumber}-${activeIdx}`}
                  className="stage-card-flip liquid-cinematic-in liquid-glass-stage"
                  onClick={() => setFullscreenImage({
                    url: '',
                    clueNumber: activeClueNumber,
                    clueText: activeClueText,
                  })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isFullscreen ? '24px' : '18px',
                    width: '100%',
                    maxWidth: '900px',
                    padding: '24px 30px',
                    borderRadius: '20px',
                    cursor: 'zoom-in',
                    transition: 'all 0.25s ease',
                  }}
                  title="Click to view full screen (⛶ Expand)"
                >
                  {/* Clue number badge & Expand hint */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <div style={{
                      padding: isFullscreen ? '10px 22px' : '8px 18px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 20px rgba(3, 105, 161, 0.5)',
                    }}>
                      <span style={{
                        fontSize: isFullscreen ? '16px' : '13px',
                        fontWeight: 900,
                        letterSpacing: '0.14em',
                        color: '#FFFFFF',
                      }}>
                        CLUE {activeClueNumber} OF {totalClues}
                      </span>
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: 'var(--accent-cyan)',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span>⛶</span> EXPAND (X)
                    </div>
                  </div>

                  {/* Clue text — large and centered */}
                  <div style={{
                    fontSize: isFullscreen ? '32px' : '24px',
                    color: '#FFFFFF',
                    lineHeight: 1.5,
                    fontWeight: 700,
                    textAlign: 'center',
                    letterSpacing: '0.01em',
                  }}>
                    {activeClueText}
                  </div>

                  {/* Progress dots */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '8px',
                  }}>
                    {Array.from({ length: totalClues }, (_, i) => i + 1).map(n => (
                      <div key={n} style={{
                        width: isFullscreen ? '12px' : '10px',
                        height: isFullscreen ? '12px' : '10px',
                        borderRadius: '50%',
                        background: n <= revealedClueCount
                          ? 'var(--accent-cyan)'
                          : 'rgba(255, 255, 255, 0.15)',
                        border: n === activeClueNumber
                          ? '2px solid #FFFFFF'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: n <= revealedClueCount
                          ? '0 0 10px rgba(56, 189, 248, 0.5)'
                          : 'none',
                        transition: 'all 0.3s ease',
                      }} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action Buttons: Compact & Sleek with Keyboard Shortcut Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: isFullscreen ? '8px' : '14px',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}>
            {revealedClueCount < totalClues ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={revealNextClue}
                  className="btn btn-primary pulsing-glow"
                  style={{
                    padding: isFullscreen ? '10px 24px' : '9px 20px',
                    fontSize: isFullscreen ? '14px' : '13.5px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)',
                    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  title="Reveal next visual clue (Shortcut: Space or →)"
                >
                  <span>🔍 Reveal Clue {revealedClueCount + 1}</span>
                  <span style={{ fontSize: '10px', opacity: 0.85, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>Space</span>
                </button>

                <button
                  onClick={() => revealAnswer(true)}
                  className="btn btn-warning"
                  style={{
                    padding: isFullscreen ? '10px 22px' : '9px 18px',
                    fontSize: isFullscreen ? '14px' : '13.5px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  title="Instantly reveal the final answer (Shortcut: Key A)"
                >
                  <span>🎉 Reveal Answer</span>
                  <span style={{ fontSize: '10px', opacity: 0.9, background: 'rgba(0,0,0,0.35)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' }}>Key A</span>
                </button>
              </div>
            ) : !isAnswerRevealed ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => revealAnswer(true)}
                  className="btn btn-warning pulsing-glow"
                  style={{
                    padding: isFullscreen ? '12px 30px' : '10px 24px',
                    fontSize: isFullscreen ? '15px' : '14px',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#000000',
                    boxShadow: '0 4px 25px rgba(245, 158, 11, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  title="Reveal Final Answer (Shortcut: Key A or Space)"
                >
                  <span>🎉 REVEAL FINAL ANSWER</span>
                  <span style={{ fontSize: '10.5px', opacity: 0.9, background: 'rgba(0,0,0,0.35)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' }}>Key A / Space</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={resetClues}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '8px 18px', fontSize: '12.5px', borderRadius: '8px' }}
                  title="Reset to Clue 1 (Shortcut: Key R)"
                >
                  🔄 Replay (Key R)
                </button>
                {activeQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="btn btn-primary btn-sm pulsing-glow"
                    style={{
                      padding: '9px 24px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                    }}
                    title="Next Challenge (Shortcut: Space or →)"
                  >
                    <span>
                      {questions[activeQuestionIndex + 1]?.category !== questions[activeQuestionIndex]?.category
                        ? `⏭️ Next Set: ${questions[activeQuestionIndex + 1]?.category} (${activeQuestionIndex + 2}/${questions.length})`
                        : `⏭️ Next Challenge (${activeQuestionIndex + 2}/${questions.length})`}
                    </span>
                    <span style={{ fontSize: '10.5px', opacity: 0.85, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>→</span>
                  </button>
                ) : activeRound === 1 ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => switchRound(2)}
                      className="btn btn-warning pulsing-gold-badge"
                      style={{
                        padding: '11px 28px',
                        fontSize: '14px',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#000000',
                        boxShadow: '0 6px 28px rgba(245, 158, 11, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      title="Completed Round 1! Proceed to Round 2 (Relics & Demo)"
                    >
                      <span>🚀 PROCEED TO ROUND 2 (Relics & Demo) ▶</span>
                    </button>
                    <button
                      onClick={() => setActiveQuestion(0)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '9px 18px', fontSize: '12px', borderRadius: '8px' }}
                    >
                      🔄 Replay Round 1
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => setActiveQuestion(0)}
                      className="btn btn-success pulsing-glow"
                      style={{
                        padding: '11px 28px',
                        fontSize: '14px',
                        fontWeight: 900,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                      }}
                    >
                      🏆 ALL ROUNDS COMPLETED!
                    </button>
                    <button
                      onClick={() => setActiveQuestion(0)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '9px 18px', fontSize: '12px', borderRadius: '8px' }}
                    >
                      🔄 Replay Round 2
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Keyboard shortcuts helper legend */}
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%',
              marginTop: '4px',
            }}>
              <span>⌨️ Shortcuts: <strong style={{ color: 'var(--accent-cyan)' }}>Space / →</strong> Next Clue</span>
              <span>• <strong style={{ color: 'var(--winner-gold)' }}>[A]</strong> Reveal Answer</span>
              <span>• <strong style={{ color: 'var(--accent-primary)' }}>←</strong> Prev</span>
              <span>• <strong style={{ color: 'var(--accent-cyan)' }}>[B]</strong> Buzzer List</span>
              <span>• <strong style={{ color: 'var(--accent-cyan)' }}>[F]</strong> Fullscreen</span>
            </div>
          </div>
        </>
      )}
    </div>

        {/* ============================================================ */}
        {/* 2. SIDEBAR: BUZZER-PRESSED USER LIST                          */}
        {/*    Remains HIDDEN until the button is pressed               */}
        {/* ============================================================ */}
        {showBuzzerList && (
          <aside
            className="glass-card buzzer-side-drawer"
            style={{
              width: '380px',
              minWidth: '340px',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              background: 'linear-gradient(180deg, #111827 0%, #0B101C 100%)',
              border: '2px solid rgba(251, 191, 36, 0.45)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.65)',
              borderRadius: '20px',
            }}
          >
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '14px',
              marginBottom: '16px',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 900,
                  color: 'var(--winner-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>🏆</span> BUZZER STANDINGS
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {queue.length} {queue.length === 1 ? 'Team Buzzed' : 'Teams Buzzed'}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowBuzzerList(false)}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  borderRadius: '10px',
                }}
                title="Hide Buzzer List"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Buzzer Actions Inside Drawer */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
            }}>
              {isActive ? (
                <button
                  onClick={lockRound}
                  className="btn btn-warning btn-sm"
                  style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
                >
                  🔒 Lock Buzzer
                </button>
              ) : (
                <button
                  onClick={startRound}
                  className="btn btn-success btn-sm pulsing-green"
                  style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
                >
                  ⚡ Unlock Buzzer
                </button>
              )}

              {queue.length > 0 && (
                <button
                  onClick={resetBuzzer}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                  title="Clear buzzer pressed queue"
                >
                  🔄 Clear
                </button>
              )}
            </div>

            {/* The Live Buzzed List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingRight: '4px',
            }}>
              {queue.length === 0 ? (
                <div style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚡</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF', marginBottom: '6px' }}>
                    Waiting for Buzzers
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                    Teams can hit their buzzer button now. The first press will appear here instantly at 0ms.
                  </div>
                </div>
              ) : (
                queue.map((entry, idx) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;
                  const teamId = entry.participantId || entry.name;
                  const isSelected = selectedTeamIdForPoints === teamId;
                  const currentScore = teamScores && teamScores[teamId] ? teamScores[teamId].score : 0;

                  // Styling for Top 3 vs standard ranks
                  const itemBg = isFirst
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.24) 0%, rgba(217, 119, 6, 0.16) 100%)'
                    : isSecond
                    ? 'linear-gradient(135deg, rgba(226, 232, 240, 0.2) 0%, rgba(148, 163, 184, 0.12) 100%)'
                    : isThird
                    ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(180, 83, 9, 0.14) 100%)'
                    : 'rgba(255, 255, 255, 0.04)';

                  const itemBorder = isFirst
                    ? '2px solid var(--winner-gold)'
                    : isSecond
                    ? '2px solid #CBD5E1'
                    : isThird
                    ? '2px solid #CD7F32'
                    : '1px solid rgba(255, 255, 255, 0.08)';

                  const itemGlow = isFirst
                    ? '0 0 22px rgba(251, 191, 36, 0.35)'
                    : isSecond
                    ? '0 0 16px rgba(203, 213, 225, 0.25)'
                    : isThird
                    ? '0 0 16px rgba(205, 127, 50, 0.25)'
                    : 'none';

                  const rankBg = isFirst
                    ? 'var(--winner-gold)'
                    : isSecond
                    ? '#E2E8F0'
                    : isThird
                    ? '#CD7F32'
                    : 'rgba(255, 255, 255, 0.1)';

                  const rankColor = isFirst || isSecond ? '#000000' : '#FFFFFF';

                  return (
                    <div
                      key={teamId || idx}
                      onClick={() => setSelectedTeamIdForPoints(isSelected ? null : teamId)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: itemBg,
                        border: itemBorder,
                        boxShadow: itemGlow,
                        animation: 'fadeIn 0.25s ease',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      title="Click team to view/award marks (Clue 1: 4pts, Clue 2: 3pts, Clue 3: 2pts, Clue 4: 1pt)"
                    >
                      {/* Top Row: Rank, Name, Timing, Score */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Rank Position */}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 900,
                          fontSize: '13px',
                          color: rankColor,
                          background: rankBg,
                          marginRight: '12px',
                          flexShrink: 0,
                          boxShadow: isFirst || isSecond || isThird ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                        }}>
                          #{entry.rank}
                        </div>

                        {/* Team Name & Offset */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 800,
                            fontSize: '14px',
                            color: isFirst ? '#FFFFFF' : isSecond ? '#F8FAFC' : isThird ? '#FEF3C7' : 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {entry.name}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: isFirst
                              ? 'var(--winner-gold)'
                              : isSecond
                              ? '#E2E8F0'
                              : isThird
                              ? '#F59E0B'
                              : 'var(--text-muted)',
                            marginTop: '2px',
                          }}>
                            {isFirst
                              ? '🥇 1st Place (0.00s)'
                              : isSecond
                              ? `🥈 2nd Place (+${(entry.timeOffsetMs / 1000).toFixed(2)}s)`
                              : isThird
                              ? `🥉 3rd Place (+${(entry.timeOffsetMs / 1000).toFixed(2)}s)`
                              : `+${(entry.timeOffsetMs / 1000).toFixed(2)}s behind #1`}
                          </div>
                        </div>

                        {/* Current Score Badge */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginLeft: '8px',
                          flexShrink: 0,
                        }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 900,
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: currentScore > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: currentScore > 0 ? 'var(--winner-gold)' : 'var(--text-muted)',
                            border: currentScore > 0 ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                          }}>
                            ⭐ {currentScore} pts
                          </span>
                          {isFirst && <span style={{ fontSize: '16px' }}>👑</span>}
                        </div>
                      </div>

                      {/* Expandable Clue Point Award Buttons (Clue 1: 4pts, Clue 2: 3pts, Clue 3: 2pts, Clue 4: 1pt) */}
                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'space-between', letterSpacing: '0.04em' }}>
                            <span>AWARD MARKS (SELECT CLUE):</span>
                            <span style={{ color: 'var(--winner-gold)' }}>Total: {currentScore} pts</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, totalClues)}, 1fr)`, gap: '6px' }}>
                            <button
                              onClick={() => awardPoints(teamId, entry.name, 1)}
                              className="btn btn-sm"
                              style={{
                                padding: '6px 2px',
                                fontSize: '10.5px',
                                fontWeight: 900,
                                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1px',
                              }}
                              title="Award 4 points for solving on Clue 1"
                            >
                              <span>Clue 1</span>
                              <span style={{ fontSize: '11px', color: '#BAE6FD' }}>+4 pts</span>
                            </button>
                            <button
                              onClick={() => awardPoints(teamId, entry.name, 2)}
                              className="btn btn-sm"
                              style={{
                                padding: '6px 2px',
                                fontSize: '10.5px',
                                fontWeight: 900,
                                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1px',
                              }}
                              title="Award 3 points for solving on Clue 2"
                            >
                              <span>Clue 2</span>
                              <span style={{ fontSize: '11px', color: '#A7F3D0' }}>+3 pts</span>
                            </button>
                            {totalClues >= 3 && (
                              <button
                                onClick={() => awardPoints(teamId, entry.name, 3)}
                                className="btn btn-sm"
                                style={{
                                  padding: '6px 2px',
                                  fontSize: '10.5px',
                                  fontWeight: 900,
                                  background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                                  color: '#000000',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.25)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '1px',
                                }}
                                title="Award 2 points for solving on Clue 3"
                              >
                                <span>Clue 3</span>
                                <span style={{ fontSize: '11px', fontWeight: 900 }}>+2 pts</span>
                              </button>
                            )}
                            {totalClues >= 4 && (
                              <button
                                onClick={() => awardPoints(teamId, entry.name, 4)}
                                className="btn btn-sm"
                                style={{
                                  padding: '6px 2px',
                                  fontSize: '10.5px',
                                  fontWeight: 900,
                                  background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                                  color: '#FFFFFF',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.25)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '1px',
                                }}
                                title="Award 1 point for solving on Clue 4"
                              >
                                <span>Clue 4</span>
                                <span style={{ fontSize: '11px', color: '#DDD6FE' }}>+1 pt</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ─── FULLSCREEN CLUE IMAGE LIGHTBOX OVERLAY ─── */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000000',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.25s ease',
            cursor: 'zoom-out',
            overflow: 'hidden',
          }}
        >
          {/* Top Floating Control & Live Countdown Timer Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 65%, transparent 100%)',
              padding: '20px 32px 36px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 20,
              cursor: 'default',
            }}
          >
            {/* Left: Challenge & Clue Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                ROUND {activeRound} • CHALLENGE #{activeQuestionIndex + 1}
              </span>
              <span style={{
                background: fullscreenImage.clueNumber === 'Answer'
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: fullscreenImage.clueNumber === 'Answer' ? '#000000' : '#FFFFFF',
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 900,
                letterSpacing: '0.1em',
                boxShadow: fullscreenImage.clueNumber === 'Answer'
                  ? '0 2px 10px rgba(245, 158, 11, 0.4)'
                  : '0 2px 10px rgba(2, 132, 199, 0.4)',
              }}>
                {fullscreenImage.clueNumber === 'Answer' ? '🏆 FINAL ANSWER' : `CLUE #${fullscreenImage.clueNumber}`}
              </span>
            </div>

            {/* Center: Live Running Countdown Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '8px 22px',
              borderRadius: '30px',
              border: `2px solid ${isTimerPaused ? 'var(--winner-gold)' : (timerRemaining <= 5 ? '#EF4444' : (timerRemaining <= 10 ? '#F59E0B' : 'var(--accent-cyan)'))}`,
              boxShadow: isTimerPaused
                ? '0 0 25px rgba(251, 191, 36, 0.5)'
                : (timerRemaining <= 5 ? '0 0 25px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(56, 189, 248, 0.3)'),
              animation: (timerRemaining <= 5 && !isTimerPaused && timerRemaining > 0) ? 'pulse 1s infinite' : 'none',
            }}>
              {isAnswerRevealed ? (
                <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--winner-gold)' }}>
                  🏆 ANSWER REVEALED
                </span>
              ) : isTimerPaused ? (
                <div
                  onClick={toggleTimerPause}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  title="Timer Paused — Click or press Key P to resume"
                >
                  <span style={{ fontSize: '18px' }}>⏸️</span>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--winner-gold)', letterSpacing: '0.05em' }}>
                    TIMER PAUSED
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                    Press P to Resume
                  </span>
                </div>
              ) : (revealedClueCount === totalClues && timerRemaining === 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⏰</span>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--winner-gold)' }}>TIME'S UP</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>• Awaiting Host</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⏱️</span>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color: timerRemaining <= 5 ? '#EF4444' : (timerRemaining <= 10 ? '#F59E0B' : 'var(--accent-cyan)'),
                    letterSpacing: '0.05em',
                    textShadow: timerRemaining <= 5 ? '0 0 14px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(56, 189, 248, 0.5)',
                  }}>
                    {timerRemaining}s
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                    / {revealedClueCount === 1 ? '30s' : '15s'}
                  </span>
                </div>
              )}

              {/* Timer Pause/Play toggle button */}
              {!isAnswerRevealed && !(revealedClueCount === totalClues && timerRemaining === 0) && (
                <button
                  onClick={toggleTimerPause}
                  style={{
                    background: isTimerPaused ? 'var(--winner-gold)' : 'rgba(255, 255, 255, 0.15)',
                    color: isTimerPaused ? '#000000' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                  }}
                  title={isTimerPaused ? 'Resume Timer (Key P)' : 'Pause Timer (Key P)'}
                >
                  <span>{isTimerPaused ? '▶️ Resume' : '⏸️ Pause'}</span>
                  <span style={{ opacity: 0.75, fontSize: '9.5px' }}>(P)</span>
                </button>
              )}
            </div>

            {/* Right: Close button */}
            <button
              onClick={() => setFullscreenImage(null)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Main Content: Full-screen Image or Grand Typography View */}
          {fullscreenImage.url ? (
            <img
              src={fullscreenImage.url}
              alt={`Clue #${fullscreenImage.clueNumber} Fullscreen`}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100vw',
                height: '100vh',
                objectFit: 'contain',
                display: 'block',
                cursor: 'default',
              }}
            />
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '120px 80px',
                background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.75) 0%, rgba(5, 8, 17, 0.98) 100%)',
                cursor: 'default',
              }}
            >
              <div style={{
                maxWidth: '1000px',
                width: '100%',
                textAlign: 'center',
                padding: '50px 40px',
                borderRadius: '24px',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.25)',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  letterSpacing: '0.18em',
                  color: fullscreenImage.clueNumber === 'Answer' ? 'var(--winner-gold)' : 'var(--accent-cyan)',
                  marginBottom: '18px',
                }}>
                  {fullscreenImage.clueNumber === 'Answer' ? '🏆 FINAL ANSWER' : `✨ CLUE #${fullscreenImage.clueNumber} OF ${totalClues}`}
                </div>
                <div style={{
                  fontSize: isFullscreen ? (fullscreenImage.clueNumber === 'Answer' ? '46px' : '34px') : '28px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.55,
                  textShadow: fullscreenImage.clueNumber === 'Answer' ? '0 0 30px rgba(251, 191, 36, 0.8)' : '0 4px 20px rgba(0, 0, 0, 0.9)',
                  whiteSpace: 'pre-line',
                }}>
                  {fullscreenImage.clueText}
                </div>
              </div>
            </div>
          )}

          {/* ─── ANIMATED FLOATING CLOUD BUZZER STREAM IN FULLSCREEN AIR ─── */}
          {queue.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                right: '32px',
                top: '95px',
                zIndex: 35,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '340px',
                pointerEvents: 'auto',
                cursor: 'default',
              }}
            >
              {/* Floating Cloud Pill Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: '24px',
                background: 'rgba(15, 23, 42, 0.68)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1.2px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
                width: 'fit-content',
                alignSelf: 'flex-end',
                animation: 'floatCloud 3s ease-in-out infinite alternate',
              }}>
                <span style={{ fontSize: '15px' }}>☁️⚡</span>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  color: 'var(--winner-gold)',
                  textShadow: '0 0 10px rgba(251, 191, 36, 0.4)',
                }}>
                  LIVE BUZZ CLOUD ({queue.length})
                </span>
              </div>

              {/* Buzzed Teams Floating Cloud Cards */}
              {queue.slice(0, 5).map((entry, idx) => {
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;
                const timeFormatted = isFirst ? '0.00s' : `+${(entry.timeOffsetMs / 1000).toFixed(2)}s`;

                const cloudBg = isFirst
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.32) 0%, rgba(217, 119, 6, 0.22) 100%)'
                  : isSecond
                  ? 'linear-gradient(135deg, rgba(226, 232, 240, 0.25) 0%, rgba(148, 163, 184, 0.16) 100%)'
                  : isThird
                  ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.26) 0%, rgba(180, 83, 9, 0.16) 100%)'
                  : 'rgba(15, 23, 42, 0.55)';

                const cloudBorder = isFirst
                  ? '1.8px solid rgba(251, 191, 36, 0.85)'
                  : isSecond
                  ? '1.8px solid rgba(226, 232, 240, 0.8)'
                  : isThird
                  ? '1.8px solid rgba(205, 127, 50, 0.8)'
                  : '1px solid rgba(255, 255, 255, 0.14)';

                const cloudShadow = isFirst
                  ? '0 8px 25px rgba(251, 191, 36, 0.35)'
                  : isSecond
                  ? '0 6px 20px rgba(203, 213, 225, 0.25)'
                  : isThird
                  ? '0 6px 20px rgba(205, 127, 50, 0.25)'
                  : '0 4px 15px rgba(0, 0, 0, 0.3)';

                return (
                  <div
                    key={entry.participantId || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '24px',
                      background: cloudBg,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: cloudBorder,
                      boxShadow: cloudShadow,
                      animation: `slideInCloud 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.06}s backwards, floatGentle ${3.5 + idx * 0.4}s ease-in-out infinite alternate`,
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '12px',
                      color: isFirst || isSecond ? '#000000' : '#FFFFFF',
                      background: isFirst ? 'var(--winner-gold)' : isSecond ? '#E2E8F0' : isThird ? '#CD7F32' : 'rgba(255, 255, 255, 0.15)',
                      flexShrink: 0,
                      boxShadow: isFirst || isSecond || isThird ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    }}>
                      #{entry.rank}
                    </div>

                    {/* Team Name */}
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      color: '#FFFFFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                    }}>
                      {entry.name}
                    </div>

                    {/* Timing Seconds Badge */}
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      fontWeight: 900,
                      color: isFirst ? 'var(--winner-gold)' : isSecond ? '#E2E8F0' : isThird ? '#F59E0B' : 'rgba(255,255,255,0.8)',
                      background: 'rgba(0, 0, 0, 0.45)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      flexShrink: 0,
                    }}>
                      {timeFormatted}
                    </div>

                    {isFirst && <span style={{ fontSize: '14px' }}>👑</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Left Arrow: Previous Challenge */}
          {activeQuestionIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevQuestion();
              }}
              style={{
                position: 'absolute',
                left: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 35,
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.78)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                fontSize: '22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                transition: 'all 0.2s ease',
              }}
              title="Previous Challenge (←)"
            >
              ◀
            </button>
          )}

          {/* Floating Right Arrow: Progressive Navigation (Next Clue -> Answer -> Next Challenge) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleProgressiveAction();
            }}
            className="pulsing-glow"
            style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 35,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.88) 0%, rgba(79, 70, 229, 0.88) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '2px solid rgba(56, 189, 248, 0.75)',
              color: '#FFFFFF',
              fontSize: '26px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(2, 132, 199, 0.6)',
              transition: 'all 0.2s ease',
            }}
            title={
              revealedClueCount < totalClues && !isAnswerRevealed
                ? `Next Clue (${revealedClueCount + 1}/${totalClues}) (→ / Space)`
                : !isAnswerRevealed
                ? 'Reveal Final Answer (→ / Space)'
                : 'Next Challenge (→ / Space)'
            }
          >
            ▶
          </button>

          {/* Bottom Clue Text & Action Buttons Overlay — gradient fades up from the bottom */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.75) 60%, transparent 100%)',
              padding: '70px 40px 30px 40px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap',
              cursor: 'default',
            }}
          >
            {/* Clue Number Badge & Clue Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '320px' }}>
              <span style={{
                background: fullscreenImage.clueNumber === 'Answer'
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: fullscreenImage.clueNumber === 'Answer' ? '#000000' : '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '0.12em',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: fullscreenImage.clueNumber === 'Answer'
                  ? '0 4px 15px rgba(245, 158, 11, 0.5)'
                  : '0 4px 15px rgba(3, 105, 161, 0.5)',
              }}>
                {fullscreenImage.clueNumber === 'Answer' ? '🏆 FINAL ANSWER' : `CLUE #${fullscreenImage.clueNumber}`}
              </span>
              <span style={{
                color: '#FFFFFF',
                fontSize: '21px',
                fontWeight: 700,
                lineHeight: 1.4,
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.8)',
              }}>
                {fullscreenImage.clueText}
              </span>
            </div>

            {/* Direct Stage Control Buttons Inside Lightbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {revealedClueCount < totalClues && !isAnswerRevealed ? (
                <button
                  onClick={() => {
                    revealNextClue();
                  }}
                  className="btn btn-primary pulsing-glow"
                  style={{
                    padding: '10px 22px',
                    fontSize: '14px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  title="Reveal next clue (Space or →)"
                >
                  <span>🔍 Next Clue ({revealedClueCount + 1}/{totalClues})</span>
                  <span style={{ fontSize: '10px', opacity: 0.85, background: 'rgba(0,0,0,0.35)', padding: '2px 6px', borderRadius: '4px' }}>Space / →</span>
                </button>
              ) : null}

              {!isAnswerRevealed ? (
                <button
                  onClick={() => {
                    revealAnswer(true);
                  }}
                  className="btn btn-warning pulsing-glow"
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 900,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#000000',
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  title="Reveal Final Answer (Key A or →)"
                >
                  <span>🎉 Reveal Final Answer</span>
                  <span style={{ fontSize: '10px', opacity: 0.9, background: 'rgba(0,0,0,0.35)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' }}>Key A / →</span>
                </button>
              ) : (
                activeQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => {
                      handleProgressiveAction();
                    }}
                    className="btn btn-primary pulsing-glow"
                    style={{
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: 900,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    title="Next Challenge (Space or →)"
                  >
                    <span>➡️ Next Challenge (#{activeQuestionIndex + 2})</span>
                    <span style={{ fontSize: '10px', opacity: 0.9, background: 'rgba(0,0,0,0.35)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' }}>Space / →</span>
                  </button>
                ) : null
              )}

              <button
                onClick={() => setFullscreenImage(null)}
                className="btn btn-secondary"
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  borderRadius: '10px',
                }}
                title="Close lightbox and return to stage grid (Key X or Esc)"
              >
                ✕ Close (X / Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
