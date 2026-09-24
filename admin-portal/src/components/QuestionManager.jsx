import React, { useState } from 'react';
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
  } = useAdmin();

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingQuestion({
      id: Date.now().toString(),
      question: 'Mystery Challenge',
      clues: ['', '', '', ''],
      answer: '',
      points: 10,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion({
      ...q,
      clues: q.clues && q.clues.length >= 4
        ? [...q.clues]
        : [...(q.clues || []), '', '', '', ''].slice(0, 4),
      answer: q.answer || (q.options ? q.options[q.correctOptionIndex || 0] : ''),
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (savedQ) => {
    const isExisting = questions.some((q) => q.id === savedQ.id);
    if (isExisting) {
      updateQuestion(savedQ);
    } else {
      addQuestion(savedQ);
    }
    setIsModalOpen(false);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const reordered = [...questions];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    reorderQuestions(reordered);
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    const reordered = [...questions];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    reorderQuestions(reordered);
  };

  const currentLive = questions[activeQuestionIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span> PINPOINT 4-CLUE CHALLENGE BANK
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
            Manage mystery challenges with 4 progressive clues (Clue 1 → Clue 2 → Clue 3 → Clue 4 → Final Answer).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={resetToSampleQuestions} className="btn btn-secondary btn-sm">
            🔄 Reset 5 Samples
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            ➕ Add Challenge
          </button>
        </div>
      </div>

      {/* Live Stage Broadcaster Bar */}
      {questions.length > 0 && currentLive && (
        <div className="glass-card" style={{
          padding: '18px 24px',
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
              ACTIVE LIVE CHALLENGE: #{activeQuestionIndex + 1} OF {questions.length} • {revealedClueCount} OF 4 CLUES REVEALED
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              CLUE {revealedClueCount}: {currentLive.clues && currentLive.clues[revealedClueCount - 1] ? currentLive.clues[revealedClueCount - 1] : '(No clue)'}
            </div>
            {isAnswerRevealed && (
              <div style={{ fontSize: '13px', color: 'var(--winner-gold)', fontWeight: 800, marginTop: '4px' }}>
                🏆 Answer Revealed: {currentLive.answer || (currentLive.options && currentLive.options[currentLive.correctOptionIndex])}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Clue Advance Flow Button */}
            {revealedClueCount < 4 ? (
              <button
                onClick={revealNextClue}
                className="btn btn-primary btn-md pulsing-glow"
                style={{ padding: '8px 20px', fontWeight: 800 }}
              >
                🔍 Reveal Clue {revealedClueCount + 1}
              </button>
            ) : !isAnswerRevealed ? (
              <button
                onClick={() => revealAnswer(true)}
                className="btn btn-warning btn-md pulsing-glow"
                style={{ padding: '8px 22px', fontWeight: 900, color: '#000' }}
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
              title="Previous challenge"
            >
              ◀ Prev
            </button>

            <button
              onClick={() => setActiveQuestion(Math.min(questions.length - 1, activeQuestionIndex + 1))}
              disabled={activeQuestionIndex >= questions.length - 1}
              className="btn btn-secondary btn-sm"
              title="Next challenge"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* Challenges List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {questions.map((q, idx) => {
          const isLive = idx === activeQuestionIndex;
          const answerText = q.answer || (q.options ? q.options[q.correctOptionIndex || 0] : 'N/A');

          return (
            <ChallengeCard
              key={q.id || idx}
              q={q}
              idx={idx}
              isLive={isLive}
              answerText={answerText}
              onSetActive={() => setActiveQuestion(idx)}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
              onEdit={() => handleOpenEdit(q)}
              onDelete={() => deleteQuestion(q.id)}
            />
          );
        })}
      </div>

      {/* Edit/Add Question Modal */}
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

// ─── Individual Challenge Card with progressive clue preview ───
const ChallengeCard = ({ q, idx, isLive, answerText, onSetActive, onMoveUp, onMoveDown, onEdit, onDelete }) => {
  const [previewClue, setPreviewClue] = useState(1);

  const clues = q.clues && q.clues.length >= 4
    ? q.clues.slice(0, 4)
    : [...(q.clues || []), '', '', '', ''].slice(0, 4);

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px 24px',
        border: isLive ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
        background: isLive ? 'rgba(26, 39, 66, 0.75)' : 'var(--bg-card)',
      }}
    >
      {/* Challenge Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`pill ${isLive ? 'pill-purple' : 'pill-blue'}`} style={{ fontSize: '11px' }}>
            #{idx + 1}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            4-Clue Challenge
          </span>
          {isLive && (
            <span className="pill pill-green" style={{ fontSize: '10px' }}>
              ● LIVE STAGE
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!isLive && (
            <button
              onClick={onSetActive}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(56, 189, 248, 0.4)' }}
            >
              Broadcast Live
            </button>
          )}
          <button onClick={onMoveUp} className="btn btn-secondary btn-sm" title="Move up">
            ▲
          </button>
          <button onClick={onMoveDown} className="btn btn-secondary btn-sm" title="Move down">
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

      {/* Progressive Clue Preview — shows one clue at a time with Next/Prev */}
      <div style={{
        marginBottom: '14px',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
      }}>
        {/* Clue Step Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => setPreviewClue(num)}
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                border: previewClue === num
                  ? '1.5px solid var(--accent-cyan)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                background: previewClue === num
                  ? 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: previewClue === num ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              CLUE {num}
            </button>
          ))}
        </div>

        {/* Active Clue Content */}
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          minHeight: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            minWidth: '70px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.1em' }}>
              CLUE #{previewClue}
            </span>
          </div>
          <span style={{
            fontSize: '14px',
            color: '#FFFFFF',
            fontWeight: 600,
            lineHeight: 1.5,
          }}>
            {clues[previewClue - 1] || '(No clue entered)'}
          </span>
        </div>

        {/* Next/Prev clue buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <button
            onClick={() => setPreviewClue(Math.max(1, previewClue - 1))}
            disabled={previewClue === 1}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '4px 14px' }}
          >
            ◀ Prev Clue
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {previewClue} / 4
          </span>
          <button
            onClick={() => setPreviewClue(Math.min(4, previewClue + 1))}
            disabled={previewClue === 4}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '4px 14px' }}
          >
            Next Clue ▶
          </button>
        </div>
      </div>

      {/* Final Answer Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '8px',
        background: 'rgba(251, 191, 36, 0.12)',
        border: '1px solid rgba(251, 191, 36, 0.4)',
        fontSize: '13px',
        fontWeight: 800,
        color: 'var(--winner-gold)',
      }}>
        <span>🏆 FINAL ANSWER:</span>
        <span style={{ color: '#FFFFFF' }}>{answerText}</span>
      </div>
    </div>
  );
};

// ─── Editor Modal (No question prompt — only 4 clues + answer) ───
const QuestionEditorModal = ({ question, onSave, onClose }) => {
  const [clues, setClues] = useState(
    question.clues && question.clues.length >= 4
      ? [...question.clues]
      : [...(question.clues || []), '', '', '', ''].slice(0, 4)
  );
  const [answer, setAnswer] = useState(
    question.answer || (question.options ? question.options[question.correctOptionIndex || 0] : '')
  );

  const handleClueChange = (index, value) => {
    const updated = [...clues];
    updated[index] = value;
    setClues(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim()) return alert('Final answer is required');
    if (clues.every((c) => !c.trim())) return alert('At least one clue is required');

    onSave({
      ...question,
      question: '4-Clue Challenge',
      clues: clues.map((c) => c.trim()),
      answer: answer.trim(),
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        border: '1.5px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900 }}>
            {question.id ? '✏️ Edit 4-Clue Challenge' : '➕ Create 4-Clue Challenge'}
          </h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              4 PROGRESSIVE CLUES (Clue 1 → Clue 4)
            </label>
            {clues.map((c, idx) => (
              <div key={idx}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CLUE #{idx + 1} {idx === 0 ? '(Hardest / 1st Reveal)' : idx === 3 ? '(Giveaway Clue)' : ''}
                </div>
                <input
                  type="text"
                  value={c}
                  onChange={(e) => handleClueChange(idx, e.target.value)}
                  placeholder={`Enter Clue #${idx + 1}...`}
                  className="input-field"
                  required
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--winner-gold)', marginBottom: '6px' }}>
              🏆 FINAL MYSTERY ANSWER (Revealed on Final Step)
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. GOOGLE"
              className="input-field"
              required
              style={{ width: '100%', borderColor: 'rgba(251, 191, 36, 0.5)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
