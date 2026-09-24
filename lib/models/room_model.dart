import 'participant_model.dart';
import 'buzzer_result_model.dart';

enum RoundStatus {
  waiting,
  active,
  locked,
}

class RoundRecordModel {
  final int round;
  final String winner;
  final String participantId;
  final String serverTimestamp;
  final List<BuzzEntryModel> buzzes;

  const RoundRecordModel({
    required this.round,
    required this.winner,
    required this.participantId,
    required this.serverTimestamp,
    this.buzzes = const [],
  });

  factory RoundRecordModel.fromJson(Map<String, dynamic> json) {
    final rawBuzzes = json['buzzes'] as List<dynamic>? ?? [];
    final buzzes = rawBuzzes
        .map((b) => BuzzEntryModel.fromJson(Map<String, dynamic>.from(b)))
        .toList();

    return RoundRecordModel(
      round: json['round'] as int? ?? 1,
      winner: json['winner'] as String? ?? 'Unknown',
      participantId: json['participantId'] as String? ?? '',
      serverTimestamp: json['serverTimestamp'] as String? ?? '',
      buzzes: buzzes,
    );
  }
}

class RoomModel {
  final String roomId;
  final bool adminConnected;
  final List<ParticipantModel> participants;
  final int currentRound;
  final RoundStatus roundStatus;
  final String? currentWinner;
  final String? winnerName;
  final String? winnerServerTimestamp;
  final List<BuzzEntryModel> buzzQueue;
  final List<RoundRecordModel> roundHistory;
  final String createdAt;

  const RoomModel({
    required this.roomId,
    required this.adminConnected,
    required this.participants,
    required this.currentRound,
    required this.roundStatus,
    this.currentWinner,
    this.winnerName,
    this.winnerServerTimestamp,
    this.buzzQueue = const [],
    required this.roundHistory,
    required this.createdAt,
  });

  bool get isWaiting => roundStatus == RoundStatus.waiting;
  bool get isActive => roundStatus == RoundStatus.active;
  bool get isLocked => roundStatus == RoundStatus.locked;

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    final statusStr = json['roundStatus'] as String? ?? 'WAITING';
    RoundStatus roundStatus;
    switch (statusStr.toUpperCase()) {
      case 'ACTIVE':
        roundStatus = RoundStatus.active;
        break;
      case 'LOCKED':
        roundStatus = RoundStatus.locked;
        break;
      case 'WAITING':
      default:
        roundStatus = RoundStatus.waiting;
        break;
    }

    final rawParticipants = json['participants'] as List<dynamic>? ?? [];
    final participants = rawParticipants
        .map((p) => ParticipantModel.fromJson(Map<String, dynamic>.from(p)))
        .toList();

    final rawBuzzQueue = json['buzzQueue'] as List<dynamic>? ?? [];
    final buzzQueue = rawBuzzQueue
        .map((b) => BuzzEntryModel.fromJson(Map<String, dynamic>.from(b)))
        .toList();

    final rawHistory = json['roundHistory'] as List<dynamic>? ?? [];
    final roundHistory = rawHistory
        .map((h) => RoundRecordModel.fromJson(Map<String, dynamic>.from(h)))
        .toList();

    return RoomModel(
      roomId: json['roomId'] as String? ?? '',
      adminConnected: json['adminConnected'] as bool? ?? true,
      participants: participants,
      currentRound: json['currentRound'] as int? ?? 1,
      roundStatus: roundStatus,
      currentWinner: json['currentWinner'] as String?,
      winnerName: json['winnerName'] as String?,
      winnerServerTimestamp: json['winnerServerTimestamp'] as String?,
      buzzQueue: buzzQueue,
      roundHistory: roundHistory,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

