import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socket';
import confetti from 'canvas-confetti';
import { ROUND_1_QUESTIONS, ROUND_2_QUESTIONS } from '../data/questionRounds';

const AdminContext = createContext();

export { ROUND_1_QUESTIONS, ROUND_2_QUESTIONS };

export const AdminProvider = ({ children }) => {
  // Authentication - Always prompt for password on open / reload (both local & Cloudflare)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    localStorage.removeItem('pinpoint_admin_auth');
    return false;
  });

  // Socket & Connectivity
  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [serverUrl, setServerUrl] = useState(socketService.serverUrl);

  // Active Tab
  const [activeTab, setActiveTab] = useState('buzzer'); // 'buzzer' | 'questions' | 'projector' | 'network'

  // Room State
  const [room, setRoom] = useState(null);
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem('pinpoint_admin_token') || null;
  });

  // Active Round State (1 or 2)
  const [activeRound, setActiveRound] = useState(() => {
    const saved = localStorage.getItem('pinpoint_active_round');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Questions State
  const [questions, setQuestions] = useState(() => {
    const savedRound = localStorage.getItem('pinpoint_active_round');
    const currentRoundNum = savedRound ? parseInt(savedRound, 10) : 1;
    const defaultForRound = currentRoundNum === 2 ? ROUND_2_QUESTIONS : ROUND_1_QUESTIONS;
    const saved = localStorage.getItem('pinpoint_questions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed)) {
          // If Round 1 has fewer than 20 questions (e.g. was filtered to 5), auto-restore full 20 questions
          if (currentRoundNum === 1 && parsed.length < ROUND_1_QUESTIONS.length) {
            localStorage.setItem('pinpoint_questions', JSON.stringify(defaultForRound));
            return defaultForRound;
          }
          if (parsed[0]?.id?.startsWith('sample-')) {
            localStorage.setItem('pinpoint_questions', JSON.stringify(defaultForRound));
            return defaultForRound;
          }
          // If Round 2 has old demo questions or doesn't have updated lyrics roles, refresh!
          if (currentRoundNum === 2 && (parsed.some(q => q.id?.includes('demo') || q.category?.includes('Demo 1')) || parsed.length !== ROUND_2_QUESTIONS.length || !parsed.some(q => q.clues?.some(c => c.includes('Agan'))))) {
            localStorage.setItem('pinpoint_questions', JSON.stringify(defaultForRound));
            return defaultForRound;
          }
          return parsed;
        }
      } catch (_) {}
    }
    localStorage.setItem('pinpoint_questions', JSON.stringify(defaultForRound));
    return defaultForRound;
  });
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [revealedClueCount, setRevealedClueCount] = useState(1);

  // Category Title Slide State (Cover page shown before starting category questions)
  const [categoryTitleActive, setCategoryTitleActive] = useState(true);

  // Clue Timer State (Clue 1: 30s, Clue 2: 15s, Clue 3: 15s, Clue 4: 15s. Answer: No timer)
  const [timerRemaining, setTimerRemaining] = useState(30);
  const [timerDuration, setTimerDuration] = useState(30);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAutoTimerEnabled, setIsAutoTimerEnabled] = useState(true);

  // Team Scores / Marks System
  // Rules: Clue 1 = 4 points, Clue 2 = 3 points, Clue 3 = 2 points, Clue 4 = 1 point
  const [teamScores, setTeamScores] = useState(() => {
    try {
      const saved = localStorage.getItem('pinpoint_team_scores');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const awardPoints = useCallback((teamId, teamName, clueNum, customPts = null) => {
    const pts = customPts !== null
      ? customPts
      : (clueNum === 1 ? 4 : clueNum === 2 ? 3 : clueNum === 3 ? 2 : 1);

    const currentQ = questions && questions[activeQuestionIndex];
    const category = currentQ?.category || (activeRound === 1 ? 'Round 1 Challenge' : 'Round 2 Challenge');

    setTeamScores((prev) => {
      const current = prev[teamId] || {
        id: teamId,
        name: teamName,
        score: 0,
        round1Score: 0,
        round2Score: 0,
        categoryScores: {},
        history: [],
      };

      const prevR1 = current.round1Score !== undefined ? current.round1Score : (activeRound === 1 ? (current.score || 0) : 0);
      const prevR2 = current.round2Score !== undefined ? current.round2Score : (activeRound === 2 ? (current.score || 0) : 0);
      const newR1 = activeRound === 1 ? Math.max(0, prevR1 + pts) : prevR1;
      const newR2 = activeRound === 2 ? Math.max(0, prevR2 + pts) : prevR2;
      const prevCatScore = (current.categoryScores && current.categoryScores[category]) || 0;
      const newCatScores = {
        ...(current.categoryScores || {}),
        [category]: Math.max(0, prevCatScore + pts),
      };

      const updated = {
        ...prev,
        [teamId]: {
          ...current,
          name: teamName || current.name,
          score: newR1 + newR2,
          round1Score: newR1,
          round2Score: newR2,
          categoryScores: newCatScores,
          lastAwardedClue: clueNum,
          lastPointsAwarded: pts,
          lastCategory: category,
          lastRound: activeRound,
          history: [
            ...(current.history || []),
            {
              round: activeRound,
              category,
              challengeIndex: activeQuestionIndex,
              clueNum,
              points: pts,
              timestamp: Date.now(),
            },
          ],
        },
      };
      localStorage.setItem('pinpoint_team_scores', JSON.stringify(updated));
      socketService.emit('update_team_scores', { teamScores: updated });
      return updated;
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FBBF24', '#10B981', '#38BDF8'],
      });
    } catch (_) {}
  }, [activeRound, activeQuestionIndex, questions]);

  const adjustPoints = useCallback((teamId, teamName, delta) => {
    const currentQ = questions && questions[activeQuestionIndex];
    const category = currentQ?.category || (activeRound === 1 ? 'Round 1 Challenge' : 'Round 2 Challenge');

    setTeamScores((prev) => {
      const current = prev[teamId] || {
        id: teamId,
        name: teamName,
        score: 0,
        round1Score: 0,
        round2Score: 0,
        categoryScores: {},
        history: [],
      };

      const prevR1 = current.round1Score !== undefined ? current.round1Score : (activeRound === 1 ? (current.score || 0) : 0);
      const prevR2 = current.round2Score !== undefined ? current.round2Score : (activeRound === 2 ? (current.score || 0) : 0);
      const newR1 = activeRound === 1 ? Math.max(0, prevR1 + delta) : prevR1;
      const newR2 = activeRound === 2 ? Math.max(0, prevR2 + delta) : prevR2;

      const updated = {
        ...prev,
        [teamId]: {
          ...current,
          name: teamName || current.name,
          score: Math.max(0, (current.score || 0) + delta),
          round1Score: newR1,
          round2Score: newR2,
          history: [
            ...(current.history || []),
            {
              round: activeRound,
              category,
              challengeIndex: activeQuestionIndex,
              clueNum: null,
              points: delta,
              timestamp: Date.now(),
            },
          ],
        },
      };
      localStorage.setItem('pinpoint_team_scores', JSON.stringify(updated));
      socketService.emit('update_team_scores', { teamScores: updated });
      return updated;
    });
  }, [activeRound, activeQuestionIndex, questions]);

  const resetTeamScores = useCallback(() => {
    setTeamScores({});
    localStorage.removeItem('pinpoint_team_scores');
    socketService.emit('update_team_scores', { teamScores: {} });
  }, []);

  // Invisible Hotkey listener: Press 'P' to pause/resume countdown timer
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsTimerPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleTimerPause = useCallback(() => {
    setIsTimerPaused((prev) => !prev);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsTimerPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsTimerPaused(false);
  }, []);

  // Initialize socket on mount
  useEffect(() => {
    const socket = socketService.init();

    const handleStatus = ({ connected }) => {
      setIsConnected(connected);
    };

    const handleLatency = (latency) => {
      setLatencyMs(latency);
    };

    const handleRoomUpdated = (data) => {
      if (data && data.room) {
        setRoom(data.room);
      }
    };

    const handleRoundStarted = (data) => {
      if (data && data.room) {
        setRoom(data.room);
      }
    };

    const handleRoundReset = (data) => {
      if (data && data.room) {
        setRoom(data.room);
      }
    };

    const handleBuzzerReset = (data) => {
      if (data && data.room) {
        setRoom(data.room);
      }
    };

    const handleBuzzQueueUpdated = (data) => {
      if (data && data.room) {
        setRoom(data.room);
      }
    };

    const handleRoundLocked = (data) => {
      if (data && data.room) {
        setRoom(data.room);
      }
    };

    const handleWinnerDeclared = (data) => {
      if (data && data.room) {
        setRoom(data.room);
        // Trigger celebratory confetti on winning buzzer hit!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FBBF24', '#6366F1', '#38BDF8', '#10B981'],
          });
        } catch (_) {}
      }
    };

    const handleRoomEnded = () => {
      setRoom(null);
      setAdminToken(null);
      localStorage.removeItem('pinpoint_admin_token');
    };

    const handleQuestionsUpdated = (data) => {
      if (data && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        localStorage.setItem('pinpoint_questions', JSON.stringify(data.questions));
      }
      if (data && typeof data.revealedClueCount === 'number') {
        setRevealedClueCount(data.revealedClueCount);
      }
    };

    const handleActiveQuestionChanged = (data) => {
      if (data && typeof data.index === 'number') {
        setActiveQuestionIndex(data.index);
        setIsAnswerRevealed(false);
        setRevealedClueCount(typeof data.revealedClueCount === 'number' ? data.revealedClueCount : 1);
      }
    };

    const handleClueCountChanged = (data) => {
      if (data && typeof data.count === 'number') {
        setRevealedClueCount(data.count);
      }
    };

    const handleAnswerRevealed = (data) => {
      if (data && typeof data.isRevealed === 'boolean') {
        setIsAnswerRevealed(data.isRevealed);
      }
    };

    const handleTeamScoresUpdated = (data) => {
      if (data && data.teamScores) {
        setTeamScores(data.teamScores);
        localStorage.setItem('pinpoint_team_scores', JSON.stringify(data.teamScores));
      }
    };

    socketService.on('status_change', handleStatus);
    socketService.on('latency_update', handleLatency);
    socketService.on('room_updated', handleRoomUpdated);
    socketService.on('round_started', handleRoundStarted);
    socketService.on('round_reset', handleRoundReset);
    socketService.on('buzzer_reset', handleBuzzerReset);
    socketService.on('buzz_queue_updated', handleBuzzQueueUpdated);
    socketService.on('round_locked', handleRoundLocked);
    socketService.on('winner_declared', handleWinnerDeclared);
    socketService.on('room_ended', handleRoomEnded);
    socketService.on('questions_updated', handleQuestionsUpdated);
    socketService.on('active_question_changed', handleActiveQuestionChanged);
    socketService.on('clue_count_changed', handleClueCountChanged);
    socketService.on('answer_revealed', handleAnswerRevealed);
    socketService.on('team_scores_updated', handleTeamScoresUpdated);

    return () => {
      socketService.off('status_change', handleStatus);
      socketService.off('latency_update', handleLatency);
      socketService.off('room_updated', handleRoomUpdated);
      socketService.off('round_started', handleRoundStarted);
      socketService.off('round_reset', handleRoundReset);
      socketService.off('buzzer_reset', handleBuzzerReset);
      socketService.off('buzz_queue_updated', handleBuzzQueueUpdated);
      socketService.off('round_locked', handleRoundLocked);
      socketService.off('winner_declared', handleWinnerDeclared);
      socketService.off('room_ended', handleRoomEnded);
      socketService.off('questions_updated', handleQuestionsUpdated);
      socketService.off('active_question_changed', handleActiveQuestionChanged);
      socketService.off('clue_count_changed', handleClueCountChanged);
      socketService.off('answer_revealed', handleAnswerRevealed);
      socketService.off('team_scores_updated', handleTeamScoresUpdated);
    };
  }, []);

  // Sync questions with server when connected
  useEffect(() => {
    if (isConnected) {
      socketService.emit('update_questions', { questions });
    }
  }, [isConnected]);

  // Auto-bind admin to permanent PINPOINT default arena
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      socketService.emit('bind_admin', { passcode: 'admin123' }).then((res) => {
        if (res && res.success) {
          setRoom(res.room);
          setAdminToken(res.adminToken);
          localStorage.setItem('pinpoint_admin_token', res.adminToken);
        }
      });
    }
  }, [isConnected, isAuthenticated]);

  // Auth actions
  const login = async (passcode) => {
    if (passcode === 'admin123' || passcode === 'admin') {
      setIsAuthenticated(true);
      // Explicitly do not persist session in localStorage so that reopening tab/portal always requires password
      localStorage.removeItem('pinpoint_admin_auth');
      if (isConnected) {
        socketService.emit('bind_admin', { passcode }).then((res) => {
          if (res && res.success) {
            setRoom(res.room);
            setAdminToken(res.adminToken);
            localStorage.setItem('pinpoint_admin_token', res.adminToken);
          }
        });
      }
      return { success: true };
    }
    return { success: false, error: 'Incorrect passcode. Please try again.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pinpoint_admin_auth');
  };

  // Room Actions (Auto-binds or re-syncs default PINPOINT arena)
  const createRoom = async () => {
    const res = await socketService.emit('bind_admin', { passcode: 'admin123' });
    if (res && res.success) {
      setRoom(res.room);
      setAdminToken(res.adminToken);
      localStorage.setItem('pinpoint_admin_token', res.adminToken);
      return res;
    }
    return res;
  };

  const startRound = async () => {
    const roomId = room?.roomId || 'PINPOINT';
    const token = adminToken || localStorage.getItem('pinpoint_admin_token');
    if (!token) return;
    return await socketService.emit('start_round', {
      roomId,
      adminToken: token,
    });
  };

  const lockRound = async () => {
    const roomId = room?.roomId || 'PINPOINT';
    const token = adminToken || localStorage.getItem('pinpoint_admin_token');
    if (!token) return;
    return await socketService.emit('lock_round', {
      roomId,
      adminToken: token,
    });
  };

  const resetBuzzer = async () => {
    if (!room || !adminToken) return;
    return await socketService.emit('reset_buzzer', {
      roomId: room.roomId,
      adminToken,
    });
  };

  const resetRound = async () => {
    if (!room || !adminToken) return;
    return await socketService.emit('reset_round', {
      roomId: room.roomId,
      adminToken,
    });
  };

  const endRoom = async () => {
    if (!room || !adminToken) return;
    const res = await socketService.emit('end_room', {
      roomId: room.roomId,
      adminToken,
    });
    setRoom(null);
    setAdminToken(null);
    localStorage.removeItem('pinpoint_admin_token');
    return res;
  };

  const kickParticipant = async (participantId) => {
    if (!room || !adminToken) return;
    const res = await socketService.emit('kick_participant', {
      roomId: room.roomId,
      adminToken,
      participantId,
    });
    return res;
  };

  const clearAllParticipants = async () => {
    if (!room || !adminToken) return;
    const res = await socketService.emit('clear_all_participants', {
      roomId: room.roomId,
      adminToken,
    });
    return res;
  };

  // Questions Actions
  const addQuestion = (newQuestion) => {
    const updated = [...questions, newQuestion];
    setQuestions(updated);
    localStorage.setItem('pinpoint_questions', JSON.stringify(updated));
    socketService.emit('update_questions', { questions: updated });
  };

  const updateQuestion = (updatedQuestion) => {
    const updated = questions.map((q) =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setQuestions(updated);
    localStorage.setItem('pinpoint_questions', JSON.stringify(updated));
    socketService.emit('update_questions', { questions: updated });
  };

  const deleteQuestion = (id) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    localStorage.setItem('pinpoint_questions', JSON.stringify(updated));
    socketService.emit('update_questions', { questions: updated });
  };

  const reorderQuestions = (newOrder) => {
    setQuestions(newOrder);
    localStorage.setItem('pinpoint_questions', JSON.stringify(newOrder));
    socketService.emit('update_questions', { questions: newOrder });
  };

  const switchRound = (roundNum) => {
    const targetRound = parseInt(roundNum, 10) === 2 ? 2 : 1;
    setActiveRound(targetRound);
    localStorage.setItem('pinpoint_active_round', targetRound.toString());

    const targetQuestions = targetRound === 2 ? ROUND_2_QUESTIONS : ROUND_1_QUESTIONS;
    setQuestions(targetQuestions);
    setActiveQuestionIndex(0);
    setIsAnswerRevealed(false);
    setRevealedClueCount(1);
    setCategoryTitleActive(true); // Open with category title slide
    setIsTimerPaused(false);
    setIsTimerRunning(false);
    setTimerRemaining(30);
    setTimerDuration(30);
    localStorage.setItem('pinpoint_questions', JSON.stringify(targetQuestions));

    socketService.emit('update_questions', { questions: targetQuestions });
    socketService.emit('set_active_question', { index: 0 });
    socketService.emit('reset_clues');
  };

  const loadQuestionCategory = (categoryName) => {
    const allRoundQuestions = activeRound === 2 ? ROUND_2_QUESTIONS : ROUND_1_QUESTIONS;
    
    // Always preserve all questions for the active round
    if (questions.length < allRoundQuestions.length) {
      setQuestions(allRoundQuestions);
      localStorage.setItem('pinpoint_questions', JSON.stringify(allRoundQuestions));
      socketService.emit('update_questions', { questions: allRoundQuestions });
    }

    if (!categoryName || categoryName === 'ALL') {
      setActiveQuestionIndex(0);
      setIsAnswerRevealed(false);
      setRevealedClueCount(1);
      setCategoryTitleActive(false);
      socketService.emit('set_active_question', { index: 0 });
      return;
    }

    const targetIdx = allRoundQuestions.findIndex((q) =>
      q.category === categoryName ||
      q.category.toLowerCase().includes(categoryName.toLowerCase())
    );

    if (targetIdx !== -1) {
      setActiveQuestionIndex(targetIdx);
      setIsAnswerRevealed(false);
      setRevealedClueCount(1);
      setCategoryTitleActive(false);
      socketService.emit('set_active_question', { index: targetIdx });
    }
  };

  const resetToSampleQuestions = () => {
    switchRound(activeRound);
  };

  const setActiveQuestion = useCallback((index) => {
    setActiveQuestionIndex(index);
    setIsAnswerRevealed(false);
    setRevealedClueCount(1);
    setTimerDuration(30);
    setTimerRemaining(30);
    setIsTimerPaused(false);
    socketService.emit('set_active_question', { index });
  }, []);

  const revealNextClue = useCallback(() => {
    setRevealedClueCount((prev) => {
      const currentQ = questions[activeQuestionIndex];
      const maxClues = (currentQ?.clues && currentQ.clues.length > 0) ? currentQ.clues.length : 4;
      if (prev < maxClues) {
        const next = prev + 1;
        socketService.emit('reveal_next_clue');
        return next;
      }
      return prev;
    });
  }, [questions, activeQuestionIndex]);

  const setClueCount = useCallback((count) => {
    const valid = Math.max(1, Math.min(4, count));
    setRevealedClueCount(valid);
    socketService.emit('set_clue_count', { count: valid });
  }, []);

  const resetClues = useCallback(() => {
    setRevealedClueCount(1);
    setIsAnswerRevealed(false);
    setTimerDuration(30);
    setTimerRemaining(30);
    setIsTimerPaused(false);
    socketService.emit('reset_clues');
  }, []);

  const revealAnswer = useCallback((isRevealed) => {
    setIsAnswerRevealed(isRevealed);
    if (isRevealed) {
      setIsTimerRunning(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#FBBF24', '#6366F1', '#10B981', '#EC4899', '#38BDF8'],
        });
      } catch (_) {}
    }
    socketService.emit('reveal_answer', { isRevealed });
  }, []);

  // ----------------------------------------------------
  // CLUE TIMER ENGINE (Round 1 & Round 2)
  // Clue 1: 30s -> Auto advance to Clue 2
  // Clue 2: 15s -> Auto advance to Clue 3
  // Clue 3: 15s -> Auto advance to Clue 4
  // Clue 4: 15s -> STOP! Stays on Clue 4. Host reveals Answer manually.
  // ----------------------------------------------------
  useEffect(() => {
    if (!isAutoTimerEnabled) {
      setIsTimerRunning(false);
      return;
    }

    if (categoryTitleActive || isAnswerRevealed) {
      setIsTimerRunning(false);
      return;
    }

    // Clue 1 is 30s, remaining clues (2, 3, 4) are 15s each
    const duration = revealedClueCount === 1 ? 30 : 15;
    setTimerDuration(duration);
    setTimerRemaining(duration);
    setIsTimerPaused(false);
    setIsTimerRunning(true);
  }, [activeRound, activeQuestionIndex, revealedClueCount, isAnswerRevealed, categoryTitleActive, isAutoTimerEnabled]);

  useEffect(() => {
    if (!isTimerRunning || isTimerPaused || categoryTitleActive || isAnswerRevealed) {
      return;
    }

    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          const currentQ = questions[activeQuestionIndex];
          const maxClues = (currentQ?.clues && currentQ.clues.length > 0) ? currentQ.clues.length : 4;
          if (revealedClueCount < maxClues) {
            // Automatically advance to the next clue
            revealNextClue();
            const nextDur = 15;
            setTimerDuration(nextDur);
            return nextDur;
          } else {
            // Final clue finished: stop timer, stay on final clue. DO NOT reveal answer!
            setIsTimerRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isTimerPaused, categoryTitleActive, isAnswerRevealed, revealedClueCount, revealNextClue, questions, activeQuestionIndex]);

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        isConnected,
        latencyMs,
        serverUrl,
        setServerUrl,
        activeTab,
        setActiveTab,
        room,
        adminToken,
        createRoom,
        startRound,
        lockRound,
        resetBuzzer,
        resetRound,
        endRoom,
        kickParticipant,
        clearAllParticipants,
        activeRound,
        switchRound,
        loadQuestionCategory,
        ROUND_1_QUESTIONS,
        ROUND_2_QUESTIONS,
        questions,
        activeQuestionIndex,
        isAnswerRevealed,
        revealedClueCount,
        revealNextClue,
        setClueCount,
        resetClues,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        reorderQuestions,
        resetToSampleQuestions,
        setActiveQuestion,
        revealAnswer,
        categoryTitleActive,
        setCategoryTitleActive,
        timerRemaining,
        timerDuration,
        isTimerPaused,
        isTimerRunning,
        isAutoTimerEnabled,
        setIsAutoTimerEnabled,
        toggleTimerPause,
        pauseTimer,
        resumeTimer,
        teamScores,
        awardPoints,
        adjustPoints,
        resetTeamScores,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
