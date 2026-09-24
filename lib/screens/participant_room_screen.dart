import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/room_service.dart';
import '../models/buzzer_result_model.dart';
import '../models/room_model.dart';
import '../utils/constants.dart';
import '../widgets/room_header.dart';
import '../widgets/buzzer_button.dart';
import '../widgets/buzz_order_card.dart';
import '../widgets/participant_card.dart';

class ParticipantRoomScreen extends StatefulWidget {
  const ParticipantRoomScreen({super.key});

  @override
  State<ParticipantRoomScreen> createState() => _ParticipantRoomScreenState();
}

class _ParticipantRoomScreenState extends State<ParticipantRoomScreen> {
  void _handleLeaveRoom() {
    context.read<RoomService>().leaveRoom();
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final roomService = context.watch<RoomService>();
    final room = roomService.room;

    // Handle room closed by host
    if (roomService.isRoomEnded) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppConstants.surfaceDark,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Room Ended',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
            content: const Text(
              'The Admin has closed this room session.',
              style: TextStyle(color: Colors.white70),
            ),
            actions: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.accentPurple,
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  _handleLeaveRoom();
                },
                child: const Text('Back to Home',
                    style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
      });
    }

    if (room == null) {
      return Scaffold(
        backgroundColor: AppConstants.primaryDark,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Disconnected from room.',
                  style: TextStyle(color: Colors.white)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _handleLeaveRoom,
                child: const Text('Back to Home'),
              ),
            ],
          ),
        ),
      );
    }

    final isRoundLocked = room.isLocked;
    final isActive = room.isActive;
    final hasBuzzed = roomService.hasBuzzedThisRound;
    final buzzerEnabled = isActive && !hasBuzzed && !isRoundLocked;
    final myBuzz = roomService.myBuzzEntry;

    return Scaffold(
      backgroundColor: AppConstants.primaryDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          roomService.currentParticipantName ?? 'TEAM',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.exit_to_app_rounded, color: Colors.white70),
            tooltip: 'Leave Room',
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  backgroundColor: AppConstants.surfaceDark,
                  title: const Text('Leave Room?',
                      style: TextStyle(color: Colors.white)),
                  content: const Text('Are you sure you want to leave?',
                      style: TextStyle(color: Colors.white70)),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel',
                          style: TextStyle(color: Colors.white60)),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.statusRed),
                      onPressed: () {
                        Navigator.pop(ctx);
                        _handleLeaveRoom();
                      },
                      child: const Text('Leave',
                          style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Room Header (Room ID, round, connectivity)
                  RoomHeader(
                    roomId: room.roomId,
                    round: room.currentRound,
                    hostStatusMessage: roomService.hostStatusMessage,
                  ),
                  const SizedBox(height: 16),

                  // Status Notification Banner
                  _buildStatusBanner(
                    room: room,
                    myBuzz: myBuzz,
                    isRoundLocked: isRoundLocked,
                    hasBuzzed: hasBuzzed,
                  ),
                  const SizedBox(height: 20),

                  // Central Buzzer Section
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 26),
                    decoration: BoxDecoration(
                      color: AppConstants.surfaceDark,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: buzzerEnabled
                            ? AppConstants.buzzerRed.withValues(alpha: 0.3)
                            : Colors.white.withValues(alpha: 0.06),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          buzzerEnabled
                              ? 'BUZZER READY'
                              : hasBuzzed
                                  ? 'BUZZED (#${myBuzz?.rank ?? ''})'
                                  : isRoundLocked
                                      ? 'BUZZER LOCKED'
                                      : 'WAITING FOR COORDINATOR',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.5,
                            color: buzzerEnabled
                                ? AppConstants.statusGreen
                                : hasBuzzed
                                    ? AppConstants.accentBlue
                                    : Colors.white.withValues(alpha: 0.4),
                          ),
                        ),
                        const SizedBox(height: 20),
                        BuzzerButton(
                          isEnabled: buzzerEnabled,
                          onBuzz: () => roomService.buzz(),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppConstants.cardDark,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: AppConstants.accentBlue
                                  .withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            'Team: ${roomService.currentParticipantName ?? 'Your Team'}',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppConstants.accentBlue,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          buzzerEnabled
                              ? 'Waiting for buzzer... Tap instantly!'
                              : hasBuzzed
                                  ? (myBuzz != null
                                      ? 'You placed #${myBuzz.rank} (${myBuzz.formattedOffset}) • Position recorded!'
                                      : 'Buzzer pressed! Waiting for position...')
                                  : isRoundLocked
                                      ? 'Buzzer locked by coordinator'
                                      : 'Waiting for coordinator to start the game...',
                          style: TextStyle(
                            fontSize: 13,
                            color: hasBuzzed
                                ? AppConstants.accentBlue
                                : Colors.white.withValues(alpha: 0.6),
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Live Buzzer Sequence Order (1st, 2nd, 3rd with exact fraction of second)
                  BuzzOrderCard(
                    buzzQueue: room.buzzQueue,
                    round: room.currentRound,
                    currentParticipantId: roomService.currentParticipantId,
                    totalParticipants: room.participants.length,
                    isRoundLocked: isRoundLocked,
                  ),
                  const SizedBox(height: 20),

                  // Connected Teams list summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppConstants.surfaceDark,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.06),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.groups_rounded,
                                size: 16, color: AppConstants.accentBlue),
                            const SizedBox(width: 8),
                            Text(
                              'TEAMS (${room.participants.length})',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ...room.participants.map((p) {
                          final buzzIndex = room.buzzQueue.indexWhere(
                              (b) => b.participantId == p.participantId);
                          final buzzEntry = buzzIndex >= 0
                              ? room.buzzQueue[buzzIndex]
                              : null;
                          return ParticipantCard(
                            participant: p,
                            isCurrentPlayer: p.participantId ==
                                roomService.currentParticipantId,
                            isWinner: buzzEntry?.rank == 1,
                            rank: buzzEntry?.rank,
                            timeOffset: buzzEntry?.formattedOffset,
                          );
                        }),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBanner({
    required RoomModel room,
    required BuzzEntryModel? myBuzz,
    required bool isRoundLocked,
    required bool hasBuzzed,
  }) {
    Color bg;
    Color border;
    IconData icon;
    String title;
    String subtitle;

    if (myBuzz != null) {
      bg = AppConstants.accentBlue.withValues(alpha: 0.15);
      border = AppConstants.accentBlue;
      icon = Icons.check_circle_rounded;
      title = '#${myBuzz.rank} IN SEQUENCE (${myBuzz.formattedOffset})';
      subtitle = 'Server recorded at ${myBuzz.formattedTimestamp}';
    } else if (isRoundLocked) {
      bg = AppConstants.cardDark;
      border = Colors.white.withValues(alpha: 0.2);
      icon = Icons.lock_outline_rounded;
      title = 'ROUND ${room.currentRound} LOCKED';
      subtitle = room.buzzQueue.isNotEmpty
          ? 'Fastest: ${room.buzzQueue.first.name} (${room.buzzQueue.first.formattedOffset})'
          : 'Buzzer locked by coordinator.';
    } else if (room.isActive) {
      bg = AppConstants.statusGreen.withValues(alpha: 0.15);
      border = AppConstants.statusGreen;
      icon = Icons.play_circle_fill_rounded;
      title = 'ROUND ${room.currentRound} IS ACTIVE!';
      subtitle = hasBuzzed
          ? 'Buzzer pressed! Recording arrival order...'
          : 'Waiting for buzzer... Tap instantly!';
    } else {
      bg = AppConstants.surfaceDark;
      border = Colors.white.withValues(alpha: 0.1);
      icon = Icons.hourglass_top_rounded;
      title = 'WAITING FOR COORDINATOR...';
      subtitle = 'Waiting for the coordinator to start the game...';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Icon(icon, color: border, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: border,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    letterSpacing: 0.8,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
