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

class _ParticipantRoomScreenState extends State<ParticipantRoomScreen>
    with TickerProviderStateMixin {
  // Entrance animation
  late AnimationController _entranceController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Buzzer section breathing glow
  late AnimationController _buzzerGlowController;
  late Animation<double> _buzzerGlowAnimation;

  @override
  void initState() {
    super.initState();

    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _entranceController,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: Curves.easeOutCubic,
    ));

    _buzzerGlowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _buzzerGlowAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _buzzerGlowController, curve: Curves.easeInOut),
    );

    _entranceController.forward();
  }

  @override
  void dispose() {
    _entranceController.dispose();
    _buzzerGlowController.dispose();
    super.dispose();
  }

  void _handleLeaveRoom() {
    context.read<RoomService>().leaveRoom();
    Navigator.of(context).pushReplacementNamed('/');
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
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.flag_rounded, color: AppConstants.winnerGold),
                SizedBox(width: 10),
                Text('Room Ended',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
            content: const Text(
              'The Admin has closed this room session.',
              style: TextStyle(color: Colors.white70),
            ),
            actions: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.accentPurple,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
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
              Icon(Icons.cloud_off_rounded,
                  size: 48, color: Colors.white.withValues(alpha: 0.3)),
              const SizedBox(height: 16),
              const Text('Disconnected from room.',
                  style: TextStyle(color: Colors.white70, fontSize: 16)),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('Back to Home'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.accentPurple,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _handleLeaveRoom,
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
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppConstants.accentPurple.withValues(alpha: 0.3),
                    AppConstants.accentBlue.withValues(alpha: 0.15),
                  ],
                ),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: AppConstants.accentPurple.withValues(alpha: 0.4)),
              ),
              child: Text(
                roomService.currentParticipantName ?? 'TEAM',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  color: Colors.white,
                ),
              ),
            ),
          ],
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
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20)),
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
                        backgroundColor: AppConstants.statusRed,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
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
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: SlideTransition(
          position: _slideAnimation,
          child: SafeArea(
            child: SingleChildScrollView(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 500),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Room Header
                      RoomHeader(
                        roomId: room.roomId,
                        round: room.currentRound,
                        hostStatusMessage: roomService.hostStatusMessage,
                      ),
                      const SizedBox(height: 16),

                      // Animated Status Banner
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 400),
                        transitionBuilder: (child, animation) {
                          return FadeTransition(
                            opacity: animation,
                            child: SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0, -0.1),
                                end: Offset.zero,
                              ).animate(animation),
                              child: child,
                            ),
                          );
                        },
                        child: _buildStatusBanner(
                          key: ValueKey(
                              '${room.isActive}_${isRoundLocked}_${hasBuzzed}_${myBuzz?.rank}'),
                          room: room,
                          myBuzz: myBuzz,
                          isRoundLocked: isRoundLocked,
                          hasBuzzed: hasBuzzed,
                        ),
                      ),
                      const SizedBox(height: 22),

                      // Central Buzzer Section with animated border
                      AnimatedBuilder(
                        animation: _buzzerGlowAnimation,
                        builder: (context, child) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 28),
                            decoration: BoxDecoration(
                              color: AppConstants.surfaceDark,
                              borderRadius: BorderRadius.circular(28),
                              border: Border.all(
                                color: buzzerEnabled
                                    ? AppConstants.buzzerRed.withValues(
                                        alpha: 0.2 +
                                            _buzzerGlowAnimation.value * 0.25)
                                    : Colors.white.withValues(alpha: 0.06),
                                width: buzzerEnabled ? 2 : 1,
                              ),
                              boxShadow: buzzerEnabled
                                  ? [
                                      BoxShadow(
                                        color: AppConstants.buzzerRed
                                            .withValues(
                                                alpha:
                                                    _buzzerGlowAnimation
                                                            .value *
                                                        0.12),
                                        blurRadius: 25,
                                        spreadRadius: 2,
                                      ),
                                    ]
                                  : null,
                            ),
                            child: child,
                          );
                        },
                        child: Column(
                          children: [
                            // Animated status label
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 300),
                              child: Text(
                                buzzerEnabled
                                    ? 'BUZZER READY'
                                    : hasBuzzed
                                        ? 'BUZZED (#${myBuzz?.rank ?? ''})'
                                        : isRoundLocked
                                            ? 'BUZZER LOCKED'
                                            : 'WAITING FOR COORDINATOR',
                                key: ValueKey(
                                    '${buzzerEnabled}_${hasBuzzed}_${isRoundLocked}'),
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.8,
                                  color: buzzerEnabled
                                      ? AppConstants.statusGreen
                                      : hasBuzzed
                                          ? AppConstants.accentBlue
                                          : Colors.white
                                              .withValues(alpha: 0.35),
                                ),
                              ),
                            ),
                            const SizedBox(height: 22),

                            // Buzzer button
                            BuzzerButton(
                              isEnabled: buzzerEnabled,
                              onBuzz: () => roomService.buzz(),
                            ),
                            const SizedBox(height: 18),

                            // Team label chip
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppConstants.cardDark,
                                    AppConstants.surfaceDark,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: AppConstants.accentBlue
                                      .withValues(alpha: 0.25),
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

                            // Status hint text
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 300),
                              child: Text(
                                buzzerEnabled
                                    ? 'Waiting for buzzer... Tap instantly!'
                                    : hasBuzzed
                                        ? (myBuzz != null
                                            ? 'You placed #${myBuzz.rank} (${myBuzz.formattedOffset}) • Position recorded!'
                                            : 'Buzzer pressed! Waiting for position...')
                                        : isRoundLocked
                                            ? 'Buzzer locked by coordinator'
                                            : 'Waiting for coordinator to start...',
                                key: ValueKey(
                                    'hint_${buzzerEnabled}_${hasBuzzed}_${isRoundLocked}'),
                                style: TextStyle(
                                  fontSize: 13,
                                  color: hasBuzzed
                                      ? AppConstants.accentBlue
                                      : Colors.white
                                          .withValues(alpha: 0.55),
                                  fontWeight: FontWeight.w500,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),

                      // Buzz Order Card
                      BuzzOrderCard(
                        buzzQueue: room.buzzQueue,
                        round: room.currentRound,
                        currentParticipantId:
                            roomService.currentParticipantId,
                        totalParticipants: room.participants.length,
                        isRoundLocked: isRoundLocked,
                      ),
                      const SizedBox(height: 22),

                      // Teams list
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppConstants.surfaceDark,
                          borderRadius: BorderRadius.circular(20),
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
                                    size: 18,
                                    color: AppConstants.accentBlue),
                                const SizedBox(width: 8),
                                Text(
                                  'TEAMS (${room.participants.length})',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.2,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            ...room.participants.map((p) {
                              final buzzIndex = room.buzzQueue.indexWhere(
                                  (b) =>
                                      b.participantId == p.participantId);
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
        ),
      ),
    );
  }

  Widget _buildStatusBanner({
    Key? key,
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
      bg = AppConstants.accentBlue.withValues(alpha: 0.12);
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
      bg = AppConstants.statusGreen.withValues(alpha: 0.12);
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
      key: key,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: border, width: 1.5),
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
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.65),
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
