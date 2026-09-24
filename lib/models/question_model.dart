class PinpointQuestion {
  final String id;
  final String question;
  final List<String> options;
  final int correctOptionIndex;
  final String? clue;
  final int order;
  final int timeLimitSeconds;

  const PinpointQuestion({
    required this.id,
    required this.question,
    required this.options,
    required this.correctOptionIndex,
    this.clue,
    this.order = 0,
    this.timeLimitSeconds = 30,
  });

  PinpointQuestion copyWith({
    String? id,
    String? question,
    List<String>? options,
    int? correctOptionIndex,
    String? clue,
    int? order,
    int? timeLimitSeconds,
  }) {
    return PinpointQuestion(
      id: id ?? this.id,
      question: question ?? this.question,
      options: options ?? this.options,
      correctOptionIndex: correctOptionIndex ?? this.correctOptionIndex,
      clue: clue ?? this.clue,
      order: order ?? this.order,
      timeLimitSeconds: timeLimitSeconds ?? this.timeLimitSeconds,
    );
  }

  factory PinpointQuestion.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'] as List<dynamic>? ?? [];
    final parsedOptions = rawOptions.map((e) => e.toString()).toList();

    // Ensure strictly 4 options exist
    while (parsedOptions.length < 4) {
      parsedOptions.add('Option ${parsedOptions.length + 1}');
    }
    if (parsedOptions.length > 4) {
      parsedOptions.length = 4;
    }

    final rawCorrectIndex = json['correctOptionIndex'] as int? ?? 0;
    final clampedIndex = rawCorrectIndex.clamp(0, 3);

    return PinpointQuestion(
      id: json['id'] as String? ?? DateTime.now().millisecondsSinceEpoch.toString(),
      question: json['question'] as String? ?? '',
      options: parsedOptions,
      correctOptionIndex: clampedIndex,
      clue: json['clue'] as String?,
      order: json['order'] as int? ?? 0,
      timeLimitSeconds: json['timeLimitSeconds'] as int? ?? 30,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'question': question,
    'options': options,
    'correctOptionIndex': correctOptionIndex,
    if (clue != null) 'clue': clue,
    'order': order,
    'timeLimitSeconds': timeLimitSeconds,
  };

  String get correctOptionText {
    if (correctOptionIndex >= 0 && correctOptionIndex < options.length) {
      return options[correctOptionIndex];
    }
    return '';
  }
}

class GameSettings {
  final String gameTitle;
  final int pointsPerCorrect;
  final int timePerQuestionSeconds;
  final bool revealOptionsGradually;
  final bool showAnswerAfterRound;

  const GameSettings({
    this.gameTitle = 'Pinpoint Challenge',
    this.pointsPerCorrect = 10,
    this.timePerQuestionSeconds = 30,
    this.revealOptionsGradually = false,
    this.showAnswerAfterRound = true,
  });

  GameSettings copyWith({
    String? gameTitle,
    int? pointsPerCorrect,
    int? timePerQuestionSeconds,
    bool? revealOptionsGradually,
    bool? showAnswerAfterRound,
  }) {
    return GameSettings(
      gameTitle: gameTitle ?? this.gameTitle,
      pointsPerCorrect: pointsPerCorrect ?? this.pointsPerCorrect,
      timePerQuestionSeconds:
          timePerQuestionSeconds ?? this.timePerQuestionSeconds,
      revealOptionsGradually:
          revealOptionsGradually ?? this.revealOptionsGradually,
      showAnswerAfterRound: showAnswerAfterRound ?? this.showAnswerAfterRound,
    );
  }

  factory GameSettings.fromJson(Map<String, dynamic> json) {
    return GameSettings(
      gameTitle: json['gameTitle'] as String? ?? 'Pinpoint Challenge',
      pointsPerCorrect: json['pointsPerCorrect'] as int? ?? 10,
      timePerQuestionSeconds: json['timePerQuestionSeconds'] as int? ?? 30,
      revealOptionsGradually:
          json['revealOptionsGradually'] as bool? ?? false,
      showAnswerAfterRound: json['showAnswerAfterRound'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'gameTitle': gameTitle,
    'pointsPerCorrect': pointsPerCorrect,
    'timePerQuestionSeconds': timePerQuestionSeconds,
    'revealOptionsGradually': revealOptionsGradually,
    'showAnswerAfterRound': showAnswerAfterRound,
  };
}
