import React, { useState, useCallback, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';

export const QuestionManager = () => {
  const {
    questions,
    activeQuestionIndex,
    isAnswerRevealed,
    revealedClueCount,
    revealNextClue,
    resetClues,
    revealAnswer,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    resetToSampleQuestions,
    setActiveQuestion,
    activeRound,
    switchRound,
    ROUND_1_QUESTIONS,
    ROUND_2_QUESTIONS,
  } = useAdmin();

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState('ALL');

  const handleOpenAdd = useCallback(() => {
    setEditingQuestion({
      id: Date.now().toString(),
      question: '4-Clue Visual Challenge',
      clues: ['', '', '', ''],
      clueImages: ['', '', '', ''],
      answer: '',
      points: 10,
    });
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((q) => {
    const rawClues = q.clues && q.clues.length >= 4
      ? [...q.clues]
      : [...(q.clues || []), '', '', '', ''].slice(0, 4);

    const rawImages = q.clueImages && q.clueImages.length >= 4
      ? [...q.clueImages]
      : [...(q.clueImages || []), '', '', '', ''].slice(0, 4);

    setEditingQuestion({
      ...q,
      clues: rawClues,
      clueImages: rawImages,
      answer: q.answer || (q.options ? q.options[q.correctOptionIndex || 0] : ''),
    });
    setIsModalOpen(true);
  }, []);

  const handleSaveModal = useCallback((savedQ) => {
    const isExisting = questions.some((q) => q.id === savedQ.id);
    if (isExisting) {
      updateQuestion(savedQ);
    } else {
      addQuestion(savedQ);
    }
    setIsModalOpen(false);
  }, [questions, updateQuestion, addQuestion]);

  const handleMoveUp = useCallback((index) => {
    if (index === 0) return;
    const reordered = [...questions];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    reorderQuestions(reordered);
  }, [questions, reorderQuestions]);

  const handleMoveDown = useCallback((index) => {
    if (index === questions.length - 1) return;
    const reordered = [...questions];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    reorderQuestions(reordered);
  }, [questions, reorderQuestions]);

  const handleCategorySelect = useCallback((cat) => {
    setSelectedCat(cat);
  }, []);

  const displayedQuestions = useMemo(() => {
    return questions
      .map((q, originalIdx) => ({ q, originalIdx }))
      .filter(({ q }) => selectedCat === 'ALL' || q.category === selectedCat);
  }, [questions, selectedCat]);

  const currentLive = questions[activeQuestionIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Round Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '22px 28px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1.5px solid rgba(99, 102, 241, 0.4)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span>💡</span> 4-CLUE CHALLENGE & IMAGE BANK
            </h2>

            {/* Round Buttons */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '4px',
              borderRadius: '12px',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              gap: '4px',
            }}>
              <button
                onClick={() => {
                  setSelectedCat('ALL');
                  switchRound(1);
                }}
                style={{
                  padding: '6px 18px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeRound === 1
                    ? 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)'
                    : 'transparent',
                  color: activeRound === 1 ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📁</span> ROUND 1 ({ROUND_1_QUESTIONS.length} Qs)
              </button>

              <button
                onClick={() => {
                  setSelectedCat('ALL');
                  switchRound(2);
                }}
                style={{
                  padding: '6px 18px',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeRound === 2
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                    : 'transparent',
                  color: activeRound === 2 ? '#000000' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🎬</span> ROUND 2 ({ROUND_2_QUESTIONS.length} Tamil Movies)
              </button>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', margin: 0 }}>
            Active: <strong>Round {activeRound}</strong> — {questions.length} Challenges loaded. Each challenge has 4 clues + images + instant answer reveal.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => switchRound(activeRound)} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>
            🔄 Reload Defaults
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm pulsing-glow" style={{ padding: '8px 20px', fontWeight: 800 }}>
            ➕ Add Challenge
          </button>
        </div>
      </div>

      {/* Round 1 Category Filter Bar (Visible when Round 1 is active) */}
      {activeRound === 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '12px 18px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '14px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)', marginRight: '6px' }}>
            📁 ROUND 1 SETS:
          </span>

          {[
            { id: 'ALL', label: 'All 20 Challenges', icon: '🌟' },
            { id: 'Guess the Movie', label: '1. Guess the Movie (1-5)', icon: '🍿' },
            { id: 'Guess the Hidden Category', label: '2. Hidden Category (6-10)', icon: '🔍' },
            { id: 'Guess the Cartoon', label: '3. Guess the Cartoon (11-15)', icon: '🎨' },
            { id: 'Guess The Game', label: '4. Guess The Game (16-20)', icon: '🎮' },
          ].map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Round 2 Category Filter Bar (Visible when Round 2 is active) */}
      {activeRound === 2 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '12px 18px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '14px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--winner-gold)', marginRight: '6px' }}>
            🎬 ROUND 2 SETS:
          </span>

          {[
            { id: 'ALL', label: 'All 10 Challenges', icon: '🌟' },
            { id: 'Guess the Lyrics', label: '1. Guess the Lyrics (1-5)', icon: '🎵' },
            { id: 'Demo 1 - Identify the Tamil Movie', label: '2. Demo 1 - Tamil Movies (6-10)', icon: '🎬' },
          ].map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  border: isSelected ? '1.5px solid var(--winner-gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#000000' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 900 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Live Stage Broadcaster Bar */}
      {questions.length > 0 && currentLive && (
        <div className="glass-card" style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(20, 30, 50, 0.95) 0%, rgba(26, 39, 66, 0.95) 100%)',
          border: '1.5px solid rgba(99, 102, 241, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'var(--accent-cyan)',
              marginBottom: '4px',
            }}>
              BROADCASTING LIVE: #{activeQuestionIndex + 1} OF {questions.length} • {revealedClueCount} OF 4 CLUES REVEALED
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>CLUE {revealedClueCount}: {currentLive.clues && currentLive.clues[revealedClueCount - 1] ? currentLive.clues[revealedClueCount - 1] : '(No clue)'}</span>
              {currentLive.clueImages && currentLive.clueImages[revealedClueCount - 1] && (
                <span className="pill pill-blue" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  🖼️ Image Attached
                </span>
              )}
            </div>
            {isAnswerRevealed && (
              <div style={{ fontSize: '13px', color: 'var(--winner-gold)', fontWeight: 800, marginTop: '4px' }}>
                🏆 Answer Revealed: {currentLive.answer || (currentLive.options && currentLive.options[currentLive.correctOptionIndex])}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {revealedClueCount < 4 ? (
              <button
                onClick={revealNextClue}
                className="btn btn-primary btn-md pulsing-glow"
                style={{ padding: '10px 22px', fontWeight: 800 }}
              >
                🔍 Reveal Clue {revealedClueCount + 1}
              </button>
            ) : !isAnswerRevealed ? (
              <button
                onClick={() => revealAnswer(true)}
                className="btn btn-warning btn-md pulsing-glow"
                style={{ padding: '10px 24px', fontWeight: 900, color: '#000' }}
              >
                🎉 Reveal Answer
              </button>
            ) : (
              <button
                onClick={resetClues}
                className="btn btn-secondary btn-sm"
              >
                🔄 Reset Clues
              </button>
            )}

            <button
              onClick={() => setActiveQuestion(Math.max(0, activeQuestionIndex - 1))}
              disabled={activeQuestionIndex === 0}
              className="btn btn-secondary btn-sm"
              title="Previous Challenge"
            >
              ◀ Prev
            </button>
            <button
              onClick={() => setActiveQuestion(Math.min(questions.length - 1, activeQuestionIndex + 1))}
              disabled={activeQuestionIndex >= questions.length - 1}
              className="btn btn-secondary btn-sm"
              title="Next Challenge"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* Challenge List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {questions.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
              No Challenges In Bank
            </div>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>
              Add a new challenge with 4 progressive clues and images or reset to 5 default sample questions.
            </p>
            <button onClick={resetToSampleQuestions} className="btn btn-primary">
              Load 5 Sample Challenges
            </button>
          </div>
        ) : (
          displayedQuestions.map(({ q, originalIdx }) => {
            const isLive = originalIdx === activeQuestionIndex;
            const answerText = q.answer || (q.options && q.options[q.correctOptionIndex]) || 'NO ANSWER';

            return (
              <ChallengeCard
                key={q.id || originalIdx}
                q={q}
                idx={originalIdx}
                isLive={isLive}
                answerText={answerText}
                onSetActive={() => setActiveQuestion(originalIdx)}
                onMoveUp={() => handleMoveUp(originalIdx)}
                onMoveDown={() => handleMoveDown(originalIdx)}
                onEdit={() => handleOpenEdit(q)}
                onDelete={() => {
                  if (window.confirm(`Delete Challenge #${originalIdx + 1}?`)) {
                    deleteQuestion(q.id);
                  }
                }}
              />
            );
          })
        )}
      </div>

      {/* Edit/Add Question Modal with Clue Image Uploads */}
      {isModalOpen && editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion}
          onSave={handleSaveModal}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

// ─── Challenge Card with Progressive Clue Preview & Images (React.memo for 60fps performance) ───
const ChallengeCard = React.memo(({ q, idx, isLive, answerText, onSetActive, onMoveUp, onMoveDown, onEdit, onDelete }) => {
  const [previewClue, setPreviewClue] = useState(1);

  const clues = q.clues && q.clues.length >= 4
    ? q.clues.slice(0, 4)
    : [...(q.clues || []), '', '', '', ''].slice(0, 4);

  const clueImages = q.clueImages && q.clueImages.length >= 4
    ? q.clueImages.slice(0, 4)
    : [...(q.clueImages || []), '', '', '', ''].slice(0, 4);

  const activeImage = clueImages[previewClue - 1];
  const imagesCount = clueImages.filter((img) => Boolean(img && img.trim())).length;

  return (
    <div
      className="glass-card challenge-card-item"
      style={{
        padding: '24px 28px',
        border: isLive ? '1.8px solid var(--accent-primary)' : '1px solid var(--border-glass)',
        background: isLive ? 'rgba(26, 39, 66, 0.85)' : 'var(--bg-card)',
        boxShadow: isLive ? '0 0 25px rgba(99, 102, 241, 0.25)' : 'var(--shadow-card)',
      }}
    >
      {/* Challenge Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`pill ${isLive ? 'pill-purple' : 'pill-blue'}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
            CHALLENGE #{idx + 1}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
            {q.question || '4-Clue Challenge'}
          </span>
          {imagesCount > 0 && (
            <span className="pill pill-blue" style={{ fontSize: '11px', padding: '3px 10px' }}>
              🖼️ {imagesCount} {imagesCount === 1 ? 'Image' : 'Images'}
            </span>
          )}
          {isLive && (
            <span className="pill pill-green" style={{ fontSize: '10.5px' }}>
              ● CURRENTLY LIVE
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isLive && (
            <button
              onClick={onSetActive}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(56, 189, 248, 0.5)', fontWeight: 800 }}
            >
              Broadcast Live
            </button>
          )}
          <button onClick={onMoveUp} className="btn btn-secondary btn-sm" title="Move Up">
            ▲
          </button>
          <button onClick={onMoveDown} className="btn btn-secondary btn-sm" title="Move Down">
            ▼
          </button>
          <button onClick={onEdit} className="btn btn-secondary btn-sm" title="Edit challenge">
            ✏️ Edit
          </button>
          <button onClick={onDelete} className="btn btn-danger btn-sm" title="Delete challenge">
            🗑️
          </button>
        </div>
      </div>

      {/* Progressive Clue Preview Box */}
      <div style={{
        marginBottom: '16px',
        padding: '18px 22px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
      }}>
        {/* Step Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((num) => {
            const hasImg = Boolean(clueImages[num - 1] && clueImages[num - 1].trim());
            return (
              <button
                key={num}
                onClick={() => setPreviewClue(num)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: previewClue === num
                    ? '1.5px solid var(--accent-cyan)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  background: previewClue === num
                    ? 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: previewClue === num ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>CLUE {num}</span>
                {hasImg && <span style={{ fontSize: '11px' }}>🖼️</span>}
              </button>
            );
          })}
        </div>

        {/* Clue Text & Optional Image Container */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          gap: '18px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{
            minWidth: '80px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.1em' }}>
              CLUE #{previewClue}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{
              fontSize: '15px',
              color: '#FFFFFF',
              fontWeight: 600,
              lineHeight: 1.5,
            }}>
              {clues[previewClue - 1] || '(No clue text entered)'}
            </div>
          </div>

          {/* Clue Image Preview if present */}
          {activeImage && (
            <div style={{
              flexShrink: 0,
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}>
              <img
                src={activeImage}
                alt={`Clue #${previewClue}`}
                loading="lazy"
                decoding="async"
                style={{
                  width: '140px',
                  height: '95px',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                background: 'rgba(0, 0, 0, 0.75)',
                color: '#38BDF8',
                fontSize: '9.5px',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800,
              }}>
                CLUE #{previewClue} IMG
              </span>
            </div>
          )}
        </div>

        {/* Next / Prev Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <button
            onClick={() => setPreviewClue(Math.max(1, previewClue - 1))}
            disabled={previewClue === 1}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11.5px', padding: '4px 14px' }}
          >
            ◀ Prev Clue
          </button>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {previewClue} / 4
          </span>
          <button
            onClick={() => setPreviewClue(Math.min(4, previewClue + 1))}
            disabled={previewClue === 4}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11.5px', padding: '4px 14px' }}
          >
            Next Clue ▶
          </button>
        </div>
      </div>

      {/* Final Answer Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 18px',
        borderRadius: '10px',
        background: 'rgba(251, 191, 36, 0.12)',
        border: '1.5px solid rgba(251, 191, 36, 0.45)',
        fontSize: '13.5px',
        fontWeight: 800,
        color: 'var(--winner-gold)',
      }}>
        <span>🏆 FINAL ANSWER:</span>
        <span style={{ color: '#FFFFFF', letterSpacing: '0.04em' }}>{answerText}</span>
      </div>
    </div>
  );
});
ChallengeCard.displayName = 'ChallengeCard';

// ─── Modal Editor with 4 Clues + Image URL / File Upload for Each ───
const QuestionEditorModal = ({ question, onSave, onClose }) => {
  const [clues, setClues] = useState(
    question.clues && question.clues.length >= 4
      ? [...question.clues]
      : [...(question.clues || []), '', '', '', ''].slice(0, 4)
  );

  const [clueImages, setClueImages] = useState(
    question.clueImages && question.clueImages.length >= 4
      ? [...question.clueImages]
      : [...(question.clueImages || []), '', '', '', ''].slice(0, 4)
  );

  const [answer, setAnswer] = useState(
    question.answer || (question.options ? question.options[question.correctOptionIndex || 0] : '')
  );

  const handleClueChange = (index, value) => {
    const updated = [...clues];
    updated[index] = value;
    setClues(updated);
  };

  const handleImageChange = (index, value) => {
    const updated = [...clueImages];
    updated[index] = value;
    setClueImages(updated);
  };

  // Allow uploading an image directly from PC
  const handleFileUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      handleImageChange(index, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim()) return alert('Final answer is required');
    if (clues.every((c) => !c.trim())) return alert('At least one clue is required');

    onSave({
      ...question,
      question: '4-Clue Challenge',
      clues: clues.map((c) => c.trim()),
      clueImages: clueImages.map((img) => (img || '').trim()),
      answer: answer.trim(),
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '780px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '36px',
        border: '1.5px solid rgba(99, 102, 241, 0.45)',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>
              {question.id ? '✏️ Edit 4-Clue Challenge' : '➕ Create 4-Clue Challenge'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Add text and optional image for each progressive clue (Clue 1 → Clue 4).
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 4 Clues Inputs (Text + Image for each) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
              4 PROGRESSIVE CLUES WITH OPTIONAL IMAGES
            </label>

            {[0, 1, 2, 3].map((idx) => {
              const clueNum = idx + 1;
              const hasImage = Boolean(clueImages[idx] && clueImages[idx].trim());

              return (
                <div
                  key={idx}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pill pill-blue" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                        CLUE #{clueNum}
                      </span>
                      <span>{idx === 0 ? '(Hardest / 1st Reveal)' : idx === 3 ? '(Final Giveaway Clue)' : `(Step ${clueNum})`}</span>
                    </div>

                    {hasImage && (
                      <button
                        type="button"
                        onClick={() => handleImageChange(idx, '')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--status-red)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Remove Image
                      </button>
                    )}
                  </div>

                  {/* Clue Text Input */}
                  <textarea
                    rows={2}
                    value={clues[idx]}
                    onChange={(e) => handleClueChange(idx, e.target.value)}
                    placeholder={`Enter Clue #${clueNum} text description...`}
                    className="input-field"
                    style={{ width: '100%', resize: 'vertical', minHeight: '60px' }}
                    required={idx === 0}
                  />

                  {/* Clue Image Section: URL + File Upload */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}>
                    <span style={{ fontSize: '14px' }}>🖼️</span>

                    {/* Image URL input */}
                    <input
                      type="url"
                      value={clueImages[idx] || ''}
                      onChange={(e) => handleImageChange(idx, e.target.value)}
                      placeholder="Paste Image URL (https://...)..."
                      className="input-field"
                      style={{ flex: 1, minWidth: '220px', padding: '8px 12px', fontSize: '12.5px' }}
                    />

                    {/* Or File Upload */}
                    <label
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '8px 14px', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}
                    >
                      📁 Upload File
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(idx, e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {/* Live Image Thumbnail Preview */}
                    {hasImage && (
                      <div style={{
                        width: '54px',
                        height: '42px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1.5px solid var(--accent-cyan)',
                        flexShrink: 0,
                      }}>
                        <img
                          src={clueImages[idx]}
                          alt={`Preview #${clueNum}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Answer Input */}
          <div style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1.5px solid rgba(251, 191, 36, 0.4)',
          }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 900, color: 'var(--winner-gold)', marginBottom: '8px' }}>
              🏆 FINAL MYSTERY ANSWER (Revealed on Final Step)
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. JUPITER, GOOGLE, TAJ MAHAL"
              className="input-field"
              required
              style={{ width: '100%', borderColor: 'rgba(251, 191, 36, 0.6)', fontWeight: 800, fontSize: '16px' }}
            />
          </div>

          {/* Modal Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px', fontWeight: 800 }}>
              Save Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
