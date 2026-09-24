class ParticipantModel {
  final String participantId;
  final String name;
  final bool isConnected;
  final bool hasBuzzed;
  final String joinedAt;

  const ParticipantModel({
    required this.participantId,
    required this.name,
    required this.isConnected,
    required this.hasBuzzed,
    required this.joinedAt,
  });

  factory ParticipantModel.fromJson(Map<String, dynamic> json) {
    return ParticipantModel(
      participantId: json['participantId'] as String? ?? '',
      name: json['name'] as String? ?? 'Player',
      isConnected: json['isConnected'] as bool? ?? true,
      hasBuzzed: json['hasBuzzed'] as bool? ?? false,
      joinedAt: json['joinedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'participantId': participantId,
      'name': name,
      'isConnected': isConnected,
      'hasBuzzed': hasBuzzed,
      'joinedAt': joinedAt,
    };
  }
}
