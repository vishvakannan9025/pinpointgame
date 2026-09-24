enum BuzzerStatus {
  success,
  winner,
  tooLate,
  error,
  idle,
}

class BuzzEntryModel {
  final int rank;
  final String participantId;
  final String name;
  final String serverTimestamp;
  final int timeOffsetMs;

  const BuzzEntryModel({
    required this.rank,
    required this.participantId,
    required this.name,
    required this.serverTimestamp,
    required this.timeOffsetMs,
  });

  factory BuzzEntryModel.fromJson(Map<String, dynamic> json) {
    return BuzzEntryModel(
      rank: json['rank'] as int? ?? 1,
      participantId: json['participantId'] as String? ?? '',
      name: json['name'] as String? ?? 'Player',
      serverTimestamp: json['serverTimestamp'] as String? ?? '',
      timeOffsetMs: json['timeOffsetMs'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'rank': rank,
    'participantId': participantId,
    'name': name,
    'serverTimestamp': serverTimestamp,
    'timeOffsetMs': timeOffsetMs,
  };

  String get formattedOffset {
    if (rank == 1) {
      return '0.000s';
    }
    final seconds = (timeOffsetMs / 1000.0).toStringAsFixed(3);
    return '+$seconds s';
  }

  String get formattedTimestamp {
    if (serverTimestamp.isEmpty) return '';
    try {
      final dt = DateTime.parse(serverTimestamp).toLocal();
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      final s = dt.second.toString().padLeft(2, '0');
      final ms = dt.millisecond.toString().padLeft(3, '0');
      return '$h:$m:$s.$ms';
    } catch (_) {
      return serverTimestamp;
    }
  }
}

class BuzzerResultModel {
  final BuzzerStatus status;
  final String? participantId;
  final String? name;
  final int? round;
  final int? rank;
  final int? timeOffsetMs;
  final String? serverTimestamp;
  final String? message;
  final BuzzEntryModel? entry;

  const BuzzerResultModel({
    required this.status,
    this.participantId,
    this.name,
    this.round,
    this.rank,
    this.timeOffsetMs,
    this.serverTimestamp,
    this.message,
    this.entry,
  });

  factory BuzzerResultModel.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status'] as String? ?? 'ERROR';
    BuzzerStatus status;
    switch (statusStr.toUpperCase()) {
      case 'SUCCESS':
        status = BuzzerStatus.success;
        break;
      case 'WINNER':
        status = BuzzerStatus.winner;
        break;
      case 'TOO_LATE':
        status = BuzzerStatus.tooLate;
        break;
      case 'ERROR':
      default:
        status = BuzzerStatus.error;
        break;
    }

    BuzzEntryModel? entry;
    if (json['entry'] is Map) {
      entry = BuzzEntryModel.fromJson(Map<String, dynamic>.from(json['entry'] as Map));
    }

    return BuzzerResultModel(
      status: status,
      participantId: json['participantId'] as String?,
      name: json['name'] as String?,
      round: json['round'] as int?,
      rank: json['rank'] as int? ?? entry?.rank,
      timeOffsetMs: json['timeOffsetMs'] as int? ?? entry?.timeOffsetMs,
      serverTimestamp: json['serverTimestamp'] as String?,
      message: json['message'] as String?,
      entry: entry,
    );
  }

  static const idle = BuzzerResultModel(status: BuzzerStatus.idle);
}

