import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/question_model.dart';
import '../services/question_service.dart';
import '../utils/constants.dart';
import 'view_portal_screen.dart';

class AdminManagementScreen extends StatefulWidget {
  const AdminManagementScreen({super.key});

  @override
  State<AdminManagementScreen> createState() => _AdminManagementScreenState();
}

class _AdminManagementScreenState extends State<AdminManagementScreen> {
  void _openQuestionEditor([PinpointQuestion? questionToEdit]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _QuestionEditorModal(
        question: questionToEdit,
        onSave: (savedQuestion) {
          final service = context.read<QuestionService>();
          if (questionToEdit == null) {
            service.addQuestion(savedQuestion);
          } else {
            service.updateQuestion(savedQuestion);
          }
          Navigator.pop(ctx);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                questionToEdit == null
                    ? 'New question created successfully!'
                    : 'Question updated!',
              ),
              backgroundColor: AppConstants.statusGreen,
              duration: const Duration(seconds: 2),
            ),
          );
        },
      ),
    );
  }

  void _openGameSettings() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _GameSettingsModal(),
    );
  }

  void _confirmDelete(PinpointQuestion question) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppConstants.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Question?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to delete question: "${question.question}"?',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.statusRed,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<QuestionService>().deleteQuestion(question.id);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _confirmResetSamples() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppConstants.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Reset to Sample Questions?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'This will reset your questions to the default 5 Pinpoint questions. Any custom questions will be overwritten.',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.accentPurple,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<QuestionService>().resetToDefaultSamples();
            },
            child: const Text('Reset', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final questionService = context.watch<QuestionService>();
    final questions = questionService.questions;

    return Scaffold(
      backgroundColor: AppConstants.primaryDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'ADMIN MANAGEMENT',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_suggest_rounded,
                color: AppConstants.accentBlue),
            tooltip: 'Game Settings',
            onPressed: _openGameSettings,
          ),
          IconButton(
            icon: const Icon(Icons.tv_rounded, color: AppConstants.winnerGold),
            tooltip: 'Launch View Portal',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ViewPortalScreen()),
              );
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, color: Colors.white70),
            color: AppConstants.surfaceDark,
            onSelected: (val) {
              if (val == 'reset') _confirmResetSamples();
              if (val == 'settings') _openGameSettings();
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.tune_rounded, size: 18, color: Colors.white70),
                    SizedBox(width: 10),
                    Text('Game Rules & Settings',
                        style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'reset',
                child: Row(
                  children: [
                    Icon(Icons.restore_rounded,
                        size: 18, color: AppConstants.statusAmber),
                    SizedBox(width: 10),
                    Text('Reset to Samples',
                        style: TextStyle(color: AppConstants.statusAmber)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 800),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Control Header Strip
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppConstants.accentPurple.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color:
                                AppConstants.accentPurple.withValues(alpha: 0.4),
                          ),
                        ),
                        child: Text(
                          '${questions.length} QUESTIONS',
                          style: const TextStyle(
                            color: AppConstants.accentPurple,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Drag to reorder • 4 options each',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                        ),
                      ),
                      const Spacer(),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.statusGreen,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: () => _openQuestionEditor(),
                        icon: const Icon(Icons.add_rounded,
                            size: 18, color: Colors.white),
                        label: const Text(
                          'ADD QUESTION',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Question List
                Expanded(
                  child: questions.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.quiz_outlined,
                                  size: 48,
                                  color: Colors.white.withValues(alpha: 0.3)),
                              const SizedBox(height: 12),
                              const Text(
                                'No questions in the question bank',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Tap "Add Question" or reset to sample questions',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.5),
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 18),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppConstants.accentPurple,
                                ),
                                onPressed: _confirmResetSamples,
                                child: const Text('Load Sample Questions'),
                              ),
                            ],
                          ),
                        )
                      : Theme(
                          data: Theme.of(context).copyWith(
                            canvasColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                          ),
                          child: ReorderableListView.builder(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            itemCount: questions.length,
                            // ignore: deprecated_member_use
                            onReorder: (oldIdx, newIdx) {
                              questionService.reorderQuestions(oldIdx, newIdx);
                            },
                            itemBuilder: (context, index) {
                              final q = questions[index];
                              final isActive =
                                  index == questionService.activeQuestionIndex;
                              return _buildQuestionCard(
                                key: ValueKey(q.id),
                                question: q,
                                index: index,
                                isActive: isActive,
                                onSetActive: () =>
                                    questionService.setActiveQuestion(index),
                                onEdit: () => _openQuestionEditor(q),
                                onDuplicate: () {
                                  final duplicate = q.copyWith(
                                    id: DateTime.now()
                                        .millisecondsSinceEpoch
                                        .toString(),
                                    question: '${q.question} (Copy)',
                                  );
                                  questionService.addQuestion(duplicate);
                                },
                                onDelete: () => _confirmDelete(q),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuestionCard({
    required Key key,
    required PinpointQuestion question,
    required int index,
    required bool isActive,
    required VoidCallback onSetActive,
    required VoidCallback onEdit,
    required VoidCallback onDuplicate,
    required VoidCallback onDelete,
  }) {
    const optionLabels = ['A', 'B', 'C', 'D'];

    return Container(
      key: key,
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive
              ? AppConstants.accentBlue
              : Colors.white.withValues(alpha: 0.08),
          width: isActive ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Order badge, Active Chip, Question prompt, Drag Handle
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Rank/Order Badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isActive
                        ? AppConstants.accentBlue
                        : AppConstants.cardDark,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '#${index + 1}',
                    style: TextStyle(
                      color: isActive ? Colors.black : Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                if (isActive) ...[
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppConstants.accentBlue.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppConstants.accentBlue),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.tv_rounded,
                            size: 12, color: AppConstants.accentBlue),
                        SizedBox(width: 4),
                        Text(
                          'ON VIEW PORTAL',
                          style: TextStyle(
                            color: AppConstants.accentBlue,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                ],

                const Spacer(),

                // Drag indicator icon
                ReorderableDragStartListener(
                  index: index,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.drag_indicator_rounded,
                        size: 20, color: Colors.white60),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Question Prompt Text
            Text(
              question.question,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                height: 1.3,
              ),
            ),

            // Clue badge if provided
            if (question.clue != null && question.clue!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppConstants.winnerGold.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: AppConstants.winnerGold.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  '💡 Clues: ${question.clue}',
                  style: const TextStyle(
                    color: AppConstants.winnerGold,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],

            const SizedBox(height: 14),

            // 4 Options Grid (2x2 or row wrapped)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(4, (optIdx) {
                final isCorrect = optIdx == question.correctOptionIndex;
                final optText = optIdx < question.options.length
                    ? question.options[optIdx]
                    : 'Option ${optIdx + 1}';

                return Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isCorrect
                        ? AppConstants.statusGreen.withValues(alpha: 0.2)
                        : AppConstants.cardDark,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isCorrect
                          ? AppConstants.statusGreen
                          : Colors.white.withValues(alpha: 0.1),
                      width: isCorrect ? 1.5 : 1.0,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: isCorrect
                              ? AppConstants.statusGreen
                              : Colors.white.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          optionLabels[optIdx],
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: isCorrect ? Colors.black : Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        optText,
                        style: TextStyle(
                          color: isCorrect
                              ? AppConstants.statusGreen
                              : Colors.white.withValues(alpha: 0.8),
                          fontWeight:
                              isCorrect ? FontWeight.bold : FontWeight.normal,
                          fontSize: 13,
                        ),
                      ),
                      if (isCorrect) ...[
                        const SizedBox(width: 4),
                        const Icon(Icons.check_circle_rounded,
                            size: 14, color: AppConstants.statusGreen),
                      ],
                    ],
                  ),
                );
              }),
            ),

            const SizedBox(height: 14),
            const Divider(height: 1, color: Colors.white10),
            const SizedBox(height: 8),

            // Action toolbar
            Row(
              children: [
                if (!isActive)
                  TextButton.icon(
                    onPressed: onSetActive,
                    icon: const Icon(Icons.play_arrow_rounded,
                        size: 18, color: AppConstants.accentBlue),
                    label: const Text(
                      'Show on View Portal',
                      style: TextStyle(
                        color: AppConstants.accentBlue,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                else
                  const Row(
                    children: [
                      Icon(Icons.radio_button_checked_rounded,
                          size: 16, color: AppConstants.statusGreen),
                      SizedBox(width: 6),
                      Text(
                        'Currently Active',
                        style: TextStyle(
                          color: AppConstants.statusGreen,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.edit_rounded,
                      size: 18, color: Colors.white70),
                  tooltip: 'Edit Question',
                  onPressed: onEdit,
                ),
                IconButton(
                  icon: const Icon(Icons.copy_rounded,
                      size: 18, color: Colors.white70),
                  tooltip: 'Duplicate',
                  onPressed: onDuplicate,
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded,
                      size: 18, color: AppConstants.statusRed),
                  tooltip: 'Delete',
                  onPressed: onDelete,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------
// Question Editor Modal (Create or Edit Question with 4 Options)
// ----------------------------------------------------------------------
class _QuestionEditorModal extends StatefulWidget {
  final PinpointQuestion? question;
  final ValueChanged<PinpointQuestion> onSave;

  const _QuestionEditorModal({this.question, required this.onSave});

  @override
  State<_QuestionEditorModal> createState() => _QuestionEditorModalState();
}

class _QuestionEditorModalState extends State<_QuestionEditorModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _questionController;
  late TextEditingController _clueController;
  late List<TextEditingController> _optionControllers;
  int _correctIndex = 0;
  int _timeLimitSeconds = 30;

  @override
  void initState() {
    super.initState();
    final q = widget.question;
    _questionController = TextEditingController(text: q?.question ?? '');
    _clueController = TextEditingController(text: q?.clue ?? '');
    _correctIndex = q?.correctOptionIndex ?? 0;
    _timeLimitSeconds = q?.timeLimitSeconds ?? 30;

    _optionControllers = List.generate(4, (i) {
      final initial = (q != null && i < q.options.length)
          ? q.options[i]
          : (i == 0
              ? 'Option A'
              : i == 1
                  ? 'Option B'
                  : i == 2
                      ? 'Option C'
                      : 'Option D');
      return TextEditingController(text: initial);
    });
  }

  @override
  void dispose() {
    _questionController.dispose();
    _clueController.dispose();
    for (final c in _optionControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _handleSave() {
    if (!_formKey.currentState!.validate()) return;

    final question = PinpointQuestion(
      id: widget.question?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      question: _questionController.text.trim(),
      clue: _clueController.text.trim().isNotEmpty
          ? _clueController.text.trim()
          : null,
      options: _optionControllers.map((c) => c.text.trim()).toList(),
      correctOptionIndex: _correctIndex,
      timeLimitSeconds: _timeLimitSeconds,
      order: widget.question?.order ?? 0,
    );

    widget.onSave(question);
  }

  @override
  Widget build(BuildContext context) {
    const optionLetters = ['A', 'B', 'C', 'D'];

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppConstants.accentPurple.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      widget.question == null
                          ? Icons.add_circle_outline_rounded
                          : Icons.edit_note_rounded,
                      color: AppConstants.accentPurple,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.question == null
                              ? 'CREATE NEW QUESTION'
                              : 'EDIT QUESTION',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.2,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Provide the word to identify & 4 distinct choices',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white70),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Question / Prompt Field
              const Text(
                'QUESTION / WORD TO IDENTIFY *',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _questionController,
                maxLines: 2,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'e.g. Pinpoint the Google UI toolkit used to build this app:',
                  hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3), fontSize: 13),
                  filled: true,
                  fillColor: AppConstants.cardDark,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                        color: Colors.white.withValues(alpha: 0.1)),
                  ),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Question text is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Clues / Hints (optional)
              const Text(
                'CLUES / CATEGORY HINT (OPTIONAL)',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _clueController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'e.g. Dart • Cross-platform • Hot Reload',
                  hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3), fontSize: 13),
                  filled: true,
                  fillColor: AppConstants.cardDark,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                        color: Colors.white.withValues(alpha: 0.1)),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // 4 Options Configuration
              Row(
                children: [
                  const Text(
                    '4 OPTIONS & CORRECT ANSWER *',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                      color: Colors.white70,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Select radio for correct answer',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppConstants.statusGreen.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              ...List.generate(4, (i) {
                final isSelected = _correctIndex == i;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      // Radio button / Correct answer selector
                      InkWell(
                        onTap: () => setState(() => _correctIndex = i),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppConstants.statusGreen
                                : AppConstants.cardDark,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected
                                  ? AppConstants.statusGreen
                                  : Colors.white24,
                              width: 2,
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            optionLetters[i],
                            style: TextStyle(
                              color: isSelected ? Colors.black : Colors.white70,
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // Text Field
                      Expanded(
                        child: TextFormField(
                          controller: _optionControllers[i],
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                          decoration: InputDecoration(
                            labelText: 'Option ${optionLetters[i]}${isSelected ? " (Correct Answer)" : ""}',
                            labelStyle: TextStyle(
                              color: isSelected
                                  ? AppConstants.statusGreen
                                  : Colors.white54,
                              fontSize: 12,
                            ),
                            filled: true,
                            fillColor: isSelected
                                ? AppConstants.statusGreen.withValues(alpha: 0.08)
                                : AppConstants.cardDark,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: isSelected
                                    ? AppConstants.statusGreen
                                    : Colors.white.withValues(alpha: 0.1),
                              ),
                            ),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return 'Option ${optionLetters[i]} cannot be empty';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                );
              }),

              const SizedBox(height: 18),

              // Save Button
              SizedBox(
                height: 50,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.accentPurple,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: _handleSave,
                  icon: const Icon(Icons.check_rounded, color: Colors.white),
                  label: Text(
                    widget.question == null
                        ? 'ADD TO QUESTION BANK'
                        : 'SAVE CHANGES',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------
// Game Settings Modal
// ----------------------------------------------------------------------
class _GameSettingsModal extends StatefulWidget {
  const _GameSettingsModal();

  @override
  State<_GameSettingsModal> createState() => _GameSettingsModalState();
}

class _GameSettingsModalState extends State<_GameSettingsModal> {
  late TextEditingController _titleController;
  late int _points;
  late int _seconds;
  late bool _showAnswerAfterRound;

  @override
  void initState() {
    super.initState();
    final s = context.read<QuestionService>().settings;
    _titleController = TextEditingController(text: s.gameTitle);
    _points = s.pointsPerCorrect;
    _seconds = s.timePerQuestionSeconds;
    _showAnswerAfterRound = s.showAnswerAfterRound;
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  void _save() {
    final service = context.read<QuestionService>();
    final newSettings = service.settings.copyWith(
      gameTitle: _titleController.text.trim().isNotEmpty
          ? _titleController.text.trim()
          : 'Pinpoint Challenge',
      pointsPerCorrect: _points,
      timePerQuestionSeconds: _seconds,
      showAnswerAfterRound: _showAnswerAfterRound,
    );
    service.updateSettings(newSettings);
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Game settings updated!'),
        backgroundColor: AppConstants.statusGreen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.tune_rounded, color: AppConstants.accentBlue),
              const SizedBox(width: 10),
              const Text(
                'GAME CONFIGURATION',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.white70),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Title
          TextFormField(
            controller: _titleController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Game Title',
              filled: true,
              fillColor: AppConstants.cardDark,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Points per correct answer
          Row(
            children: [
              const Text('Points Per Correct Answer:',
                  style: TextStyle(color: Colors.white70)),
              const Spacer(),
              DropdownButton<int>(
                value: _points,
                dropdownColor: AppConstants.cardDark,
                items: [5, 10, 20, 50].map((v) {
                  return DropdownMenuItem(
                      value: v,
                      child: Text('$v pts',
                          style: const TextStyle(color: Colors.white)));
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _points = v);
                },
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Time limit per question
          Row(
            children: [
              const Text('Time Limit Per Question:',
                  style: TextStyle(color: Colors.white70)),
              const Spacer(),
              DropdownButton<int>(
                value: _seconds,
                dropdownColor: AppConstants.cardDark,
                items: [15, 20, 30, 45, 60].map((v) {
                  return DropdownMenuItem(
                      value: v,
                      child: Text('$v sec',
                          style: const TextStyle(color: Colors.white)));
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _seconds = v);
                },
              ),
            ],
          ),
          const SizedBox(height: 10),

          Material(
            color: Colors.transparent,
            child: SwitchListTile(
              title: const Text('Show correct answer after round completes',
                  style: TextStyle(color: Colors.white, fontSize: 13)),
              value: _showAnswerAfterRound,
              activeTrackColor: AppConstants.statusGreen,
              contentPadding: EdgeInsets.zero,
              onChanged: (val) => setState(() => _showAnswerAfterRound = val),
            ),
          ),

          const SizedBox(height: 20),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.accentPurple,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: _save,
            child: const Text('SAVE SETTINGS',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
