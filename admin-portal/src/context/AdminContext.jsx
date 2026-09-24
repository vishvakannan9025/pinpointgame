import React, { createContext, useContext, useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import confetti from 'canvas-confetti';

const AdminContext = createContext();

const SAMPLE_QUESTIONS = [
  {
    id: 'sample-1',
    question: 'Identify the Planet',
    clues: [
      'It is the largest planet in our Solar System, with a mass more than twice that of all other planets combined.',
      'It rotates faster than any other planet, with a day lasting less than 10 hours.',
      'It features the iconic Great Red Spot, a colossal anticyclonic storm raging for centuries.',
      'It has 95 officially recognized moons, including Ganymede, the solar system’s largest moon.',
    ],
    clueImages: [
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&auto=format&fit=crop&q=80',
      '',
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600&auto=format&fit=crop&q=80',
    ],
    answer: 'JUPITER',
    options: ['Mars', 'Jupiter', 'Saturn', 'Neptune'],
    correctOptionIndex: 1,
    points: 10,
  },
  {
    id: 'sample-2',
    question: 'Identify the Programming Language',
    clues: [
      'It was famously created in May 1995 by Brendan Eich in just 10 days.',
      'Initially developed under the codename Mocha, it was later renamed LiveScript before taking its famous name.',
      'It powers dynamic client-side scripting across virtually 99% of all modern web browsers.',
      'It is standardized under the ECMAScript specification, known for prototype inheritance and event loops.',
    ],
    clueImages: [
      '',
      '',
      'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=80',
      '',
    ],
    answer: 'JAVASCRIPT',
    options: ['Python', 'Java', 'JavaScript', 'C++'],
    correctOptionIndex: 2,
    points: 10,
  },
  {
    id: 'sample-3',
    question: 'Identify the Monument',
    clues: [
      'It was commissioned in 1631 by Mughal Emperor Shah Jahan as a mausoleum for his beloved wife Mumtaz Mahal.',
      'It stands majestically on the right bank of the sacred Yamuna River in Agra, India.',
      'It is constructed entirely of pristine ivory-white Makrana marble that changes hue with the sunlight.',
      'A designated UNESCO World Heritage Site celebrated universally as one of the New 7 Wonders of the World.',
    ],
    clueImages: [
      '',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format&fit=crop&q=80',
      '',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop&q=80',
    ],
    answer: 'TAJ MAHAL',
    options: ['Red Fort', 'Qutub Minar', 'Taj Mahal', 'India Gate'],
    correctOptionIndex: 2,
    points: 10,
  },
  {
    id: 'sample-4',
    question: 'Identify the Tech Giant',
    clues: [
      'It was founded in September 1998 in a garage in Menlo Park, California by Ph.D. students Larry Page and Sergey Brin.',
      'Its revolutionary core technology began with the PageRank algorithm for ranking web page relevance.',
      'It develops the world’s most dominant smartphone operating system, Android, and the Chrome web browser.',
      'Its parent holding conglomerate is Alphabet Inc., and its name is derived from a mathematical term for 1 followed by 100 zeros.',
    ],
    clueImages: [
      '',
      '',
      'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=600&auto=format&fit=crop&q=80',
      '',
    ],
    answer: 'GOOGLE',
    options: ['Apple', 'Microsoft', 'Google', 'Amazon'],
    correctOptionIndex: 2,
    points: 10,
  },
  {
    id: 'sample-5',
    question: 'Identify the Legendary Scientist',
    clues: [
      'He was awarded the 1921 Nobel Prize in Physics for his discovery of the law of the photoelectric effect.',
      'In his miracle year (Annus Mirabilis) of 1905, he published four groundbreaking papers that changed modern physics.',
      'He developed the Special and General Theories of Relativity, reshaping our understanding of spacetime and gravity.',
      'He formulated the world’s most famous scientific equation: E = mc².',
    ],
    clueImages: [
      '',
      '',
      'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    ],
    answer: 'ALBERT EINSTEIN',
    options: ['Isaac Newton', 'Nikola Tesla', 'Albert Einstein', 'Niels Bohr'],
    correctOptionIndex: 2,
    points: 10,
  },
];

export const AdminProvider = ({ children }) => {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pinpoint_admin_auth') === 'true';
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

  // Questions State
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('pinpoint_questions');
    return saved ? JSON.parse(saved) : SAMPLE_QUESTIONS;
  });
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [revealedClueCount, setRevealedClueCount] = useState(1);

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
      localStorage.setItem('pinpoint_admin_auth', 'true');
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
    return { success: false, error: 'Incorrect passcode. Try "admin123".' };
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
    if (!room || !adminToken) return;
    return await socketService.emit('start_round', {
      roomId: room.roomId,
      adminToken,
    });
  };

  const lockRound = async () => {
    if (!room || !adminToken) return;
    return await socketService.emit('lock_round', {
      roomId: room.roomId,
      adminToken,
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

  const resetToSampleQuestions = () => {
    setQuestions(SAMPLE_QUESTIONS);
    localStorage.setItem('pinpoint_questions', JSON.stringify(SAMPLE_QUESTIONS));
    socketService.emit('update_questions', { questions: SAMPLE_QUESTIONS });
  };

  const setActiveQuestion = (index) => {
    setActiveQuestionIndex(index);
    setIsAnswerRevealed(false);
    setRevealedClueCount(1);
    socketService.emit('set_active_question', { index });
  };

  const revealNextClue = () => {
    if (revealedClueCount < 4) {
      const next = revealedClueCount + 1;
      setRevealedClueCount(next);
      socketService.emit('reveal_next_clue');
    }
  };

  const setClueCount = (count) => {
    const valid = Math.max(1, Math.min(4, count));
    setRevealedClueCount(valid);
    socketService.emit('set_clue_count', { count: valid });
  };

  const resetClues = () => {
    setRevealedClueCount(1);
    setIsAnswerRevealed(false);
    socketService.emit('reset_clues');
  };

  const revealAnswer = (isRevealed) => {
    setIsAnswerRevealed(isRevealed);
    socketService.emit('reveal_answer', { isRevealed });
    if (isRevealed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#FBBF24', '#6366F1', '#10B981', '#EC4899', '#38BDF8'],
        });
      } catch (_) {}
    }
  };

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
