import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/question_model.dart';
import '../services/question_service.dart';
import '../services/room_service.dart';
import '../utils/constants.dart';
import '../widgets/buzz_order_card.dart';
import 'admin_management_screen.dart';

class ViewPortalScreen extends StatelessWidget {
  const ViewPortalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final questionService = context.watch<QuestionService>();
    final roomService = context.watch<RoomService>();

    final questions = questionService.questions;
    final currentQuestion = questionService.currentQuestion;
    final activeIndex = questionService.activeQuestionIndex;
    final isRevealed = questionService.isAnswerRevealed;
    final totalQuestions = questions.length;

    final room = roomService.room;

    return Scaffold(
      backgroundColor: AppConstants.primaryDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppConstants.accentBlue.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppConstants.accentBlue.withValues(alpha: 0.4),
                ),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.tv_rounded,
                      size: 14, color: AppConstants.accentBlue),
                  SizedBox(width: 4),
                  Text(
                    'VIEW PORTAL',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                      color: AppConstants.accentBlue,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                questionService.settings.gameTitle,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            style: TextButton.styleFrom(
              foregroundColor: Colors.white70,
            ),
            icon: const Icon(Icons.edit_note_rounded, size: 18),
            label: const Text(
              'Manage Questions',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const AdminManagementScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: questions.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.tv_off_rounded,
                        size: 54, color: Colors.white.withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    const Text(
                      'No Questions Configured',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Open Admin Management to add or configure questions.',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.accentPurple,
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const AdminManagementScreen()),
                        );
                      },
                      icon: const Icon(Icons.add_rounded, color: Colors.white),
                      label: const Text('Configure Questions Now'),
                    ),
                  ],
                ),
              )
            : SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 900),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // 1. Progress & Navigation Header
                        _buildProgressHeader(
                          currentIndex: activeIndex,
                          total: totalQuestions,
                          onPrev: activeIndex > 0
                              ? () => questionService.previousQuestion()
                              : null,
                          onNext: activeIndex < totalQuestions - 1
                              ? () => questionService.nextQuestion()
                              : null,
                        ),
                        const SizedBox(height: 16),

                        // 2. Active Question Prompt Card
                        if (currentQuestion != null)
                          _buildQuestionCard(
                            question: currentQuestion,
                            index: activeIndex,
                            total: totalQuestions,
                          ),
                        const SizedBox(height: 20),

                        // 3. Four Options Grid
                        if (currentQuestion != null)
                          _buildOptionsGrid(
                            context: context,
                            question: currentQuestion,
                            isRevealed: isRevealed,
                          ),
                        const SizedBox(height: 20),

                        // 4. Reveal & Progression Controls
                        _buildControlBar(
                          context: context,
                          isRevealed: isRevealed,
                          onToggleReveal: () =>
                              questionService.toggleAnswerReveal(),
                          hasNext: activeIndex < totalQuestions - 1,
                          hasPrev: activeIndex > 0,
                          onNext: () => questionService.nextQuestion(),
                          onPrev: () => questionService.previousQuestion(),
                        ),
                        const SizedBox(height: 24),

                        // 5. Live Buzzer Arrival Leaderboard (if room is active)
                        if (room != null) ...[
                          BuzzOrderCard(
                            buzzQueue: room.buzzQueue,
                            round: room.currentRound,
                            totalParticipants: room.participants.length,
                            isRoundLocked: room.isLocked,
                          ),
                          const SizedBox(height: 20),
                        ] else ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppConstants.surfaceDark,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.08),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.sensors_rounded,
                                    size: 18, color: AppConstants.accentBlue),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'Buzzer Synchronization: Standalone View Portal mode (or connect to a room code to see live team buzzer presses)',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.6),
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildProgressHeader({
    required int currentIndex,
    required int total,
    required VoidCallback? onPrev,
    required VoidCallback? onNext,
  }) {
    final progress = total > 0 ? (currentIndex + 1) / total : 0.0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_rounded, size: 16),
                color: onPrev != null ? Colors.white : Colors.white24,
                onPressed: onPrev,
                tooltip: 'Previous Question',
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppConstants.cardDark,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppConstants.accentBlue.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  'QUESTION ${currentIndex + 1} OF $total',
                  style: const TextStyle(
                    color: AppConstants.accentBlue,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                color: onNext != null ? Colors.white : Colors.white24,
                onPressed: onNext,
                tooltip: 'Next Question',
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              valueColor: const AlwaysStoppedAnimation(AppConstants.accentBlue),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard({
    required PinpointQuestion question,
    required int index,
    required int total,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppConstants.surfaceDark,
            const Color(0xFF1E293B),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.12),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppConstants.accentPurple.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'PINPOINT TARGET',
                  style: TextStyle(
                    color: AppConstants.accentPurple,
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                    letterSpacing: 1,
                  ),
                ),
              ),
              const Spacer(),
              if (question.clue != null && question.clue!.isNotEmpty) ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppConstants.winnerGold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppConstants.winnerGold.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.lightbulb_outline_rounded,
                          size: 14, color: AppConstants.winnerGold),
                      const SizedBox(width: 4),
                      Text(
                        question.clue!,
                        style: const TextStyle(
                          color: AppConstants.winnerGold,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          Text(
            question.question,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionsGrid({
    required BuildContext context,
    required PinpointQuestion question,
    required bool isRevealed,
  }) {
    const labels = ['A', 'B', 'C', 'D'];
    final screenWidth = MediaQuery.of(context).size.width;
    final isWide = screenWidth >= 640;

    if (isWide) {
      // 2x2 Grid for Tablet, Desktop and Projector screens
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildOptionTile(
                  label: labels[0],
                  text: question.options[0],
                  isCorrect: question.correctOptionIndex == 0,
                  isRevealed: isRevealed,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _buildOptionTile(
                  label: labels[1],
                  text: question.options[1],
                  isCorrect: question.correctOptionIndex == 1,
                  isRevealed: isRevealed,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _buildOptionTile(
                  label: labels[2],
                  text: question.options[2],
                  isCorrect: question.correctOptionIndex == 2,
                  isRevealed: isRevealed,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _buildOptionTile(
                  label: labels[3],
                  text: question.options[3],
                  isCorrect: question.correctOptionIndex == 3,
                  isRevealed: isRevealed,
                ),
              ),
            ],
          ),
        ],
      );
    } else {
      // Stacked column for mobile screens
      return Column(
        children: List.generate(4, (i) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _buildOptionTile(
              label: labels[i],
              text: question.options[i],
              isCorrect: question.correctOptionIndex == i,
              isRevealed: isRevealed,
            ),
          );
        }),
      );
    }
  }

  Widget _buildOptionTile({
    required String label,
    required String text,
    required bool isCorrect,
    required bool isRevealed,
  }) {
    Color bg;
    Color borderCol;
    Color badgeBg;
    Color badgeFg;

    if (isRevealed && isCorrect) {
      bg = AppConstants.statusGreen.withValues(alpha: 0.22);
      borderCol = AppConstants.statusGreen;
      badgeBg = AppConstants.statusGreen;
      badgeFg = Colors.black;
    } else if (isRevealed && !isCorrect) {
      bg = AppConstants.cardDark.withValues(alpha: 0.4);
      borderCol = Colors.white.withValues(alpha: 0.05);
      badgeBg = Colors.white.withValues(alpha: 0.1);
      badgeFg = Colors.white38;
    } else {
      bg = AppConstants.surfaceDark;
      borderCol = Colors.white.withValues(alpha: 0.1);
      badgeBg = AppConstants.cardDark;
      badgeFg = Colors.white;
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: borderCol,
          width: (isRevealed && isCorrect) ? 2.5 : 1.2,
        ),
        boxShadow: (isRevealed && isCorrect)
            ? [
                BoxShadow(
                  color: AppConstants.statusGreen.withValues(alpha: 0.3),
                  blurRadius: 16,
                  spreadRadius: 2,
                ),
              ]
            : null,
      ),
      child: Row(
        children: [
          // Option Badge (A, B, C, D)
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: badgeBg,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              style: TextStyle(
                color: badgeFg,
                fontWeight: FontWeight.w900,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Option Word / Text
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: isRevealed && !isCorrect
                    ? Colors.white38
                    : isRevealed && isCorrect
                        ? AppConstants.statusGreen
                        : Colors.white,
                fontSize: 16,
                fontWeight: (isRevealed && isCorrect)
                    ? FontWeight.w900
                    : FontWeight.w700,
                letterSpacing: 0.3,
              ),
            ),
          ),

          if (isRevealed && isCorrect) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppConstants.statusGreen,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_rounded, size: 14, color: Colors.black),
                  SizedBox(width: 3),
                  Text(
                    'CORRECT',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildControlBar({
    required BuildContext context,
    required bool isRevealed,
    required VoidCallback onToggleReveal,
    required bool hasNext,
    required bool hasPrev,
    required VoidCallback onNext,
    required VoidCallback onPrev,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          // Previous
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white70,
              side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: hasPrev ? onPrev : null,
            icon: const Icon(Icons.chevron_left_rounded, size: 18),
            label: const Text('Previous'),
          ),

          const Spacer(),

          // Reveal / Hide Answer
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: isRevealed
                  ? AppConstants.cardDark
                  : AppConstants.winnerGold,
              foregroundColor: isRevealed ? Colors.white : Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: onToggleReveal,
            icon: Icon(
              isRevealed
                  ? Icons.visibility_off_rounded
                  : Icons.visibility_rounded,
              size: 18,
            ),
            label: Text(
              isRevealed ? 'HIDE ANSWER' : 'REVEAL ANSWER',
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 13,
                letterSpacing: 0.8,
              ),
            ),
          ),

          const Spacer(),

          // Next Question
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.accentPurple,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: hasNext ? onNext : null,
            icon: const Icon(Icons.chevron_right_rounded,
                size: 18, color: Colors.white),
            label: const Text(
              'Next',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
