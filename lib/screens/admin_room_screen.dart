import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/room_service.dart';
import '../services/socket_service.dart';
import '../models/room_model.dart';
import '../utils/constants.dart';
import '../widgets/room_header.dart';
import '../widgets/participant_card.dart';
import '../widgets/buzz_order_card.dart';
import '../widgets/server_config_dialog.dart';
import '../widgets/qr_connection_dialog.dart';

class AdminRoomScreen extends StatelessWidget {
  const AdminRoomScreen({super.key});

  void _confirmEndRoom(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppConstants.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'End Game Room?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'This will disconnect all participants and terminate the session.',
          style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7), fontSize: 14),
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
              context.read<RoomService>().endRoom();
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            child: const Text('End Room', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final roomService = context.watch<RoomService>();
    final room = roomService.room;

    if (room == null) {
      return Scaffold(
        backgroundColor: AppConstants.primaryDark,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('No active room session.',
                  style: TextStyle(color: Colors.white)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () =>
                    Navigator.of(context).popUntil((route) => route.isFirst),
                child: const Text('Back to Home'),
              ),
            ],
          ),
        ),
      );
    }

    final connectedCount =
        room.participants.where((p) => p.isConnected).length;

    return Scaffold(
      backgroundColor: AppConstants.primaryDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'COORDINATOR PORTAL',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_2_rounded, color: AppConstants.accentBlue),
            tooltip: 'Share Room QR Code',
            onPressed: () {
              final serverUrl = context.read<SocketService>().serverUrl;
              QrConnectionDialog.show(context, initialUrl: serverUrl, roomId: room.roomId);
            },
          ),
          const Center(child: ServerStatusBadge()),
          const SizedBox(width: 4),
          TextButton.icon(
            style: TextButton.styleFrom(
              foregroundColor: AppConstants.statusRed,
            ),
            onPressed: () => _confirmEndRoom(context),
            icon: const Icon(Icons.close_rounded, size: 18),
            label: const Text(
              'END ROOM',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Room Header (Room ID, round, connectivity)
                  RoomHeader(
                    roomId: room.roomId,
                    round: room.currentRound,
                    hostStatusMessage: roomService.hostStatusMessage,
                  ),
                  const SizedBox(height: 20),

                  // 2. Sequential Buzz Order Card (No single winner popup)
                  BuzzOrderCard(
                    buzzQueue: room.buzzQueue,
                    round: room.currentRound,
                    totalParticipants: connectedCount,
                    isRoundLocked: room.isLocked,
                  ),
                  const SizedBox(height: 20),

                  // 3. Round Control Panel
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppConstants.surfaceDark,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'CURRENT ROUND',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1,
                                color: Colors.white.withValues(alpha: 0.5),
                              ),
                            ),
                            const Spacer(),
                            // Status Pill
                            _buildStatusPill(room.roundStatus),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Round ${room.currentRound}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Action Buttons based on Round Status
                        if (room.isWaiting)
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppConstants.statusGreen,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: () => roomService.startRound(),
                              icon: const Icon(Icons.notifications_active_rounded,
                                  color: Colors.white, size: 26),
                              label: const Text(
                                'ENABLE BUZZER',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                          )
                        else if (room.isActive)
                          Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: SizedBox(
                                      height: 48,
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppConstants.statusAmber,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                        ),
                                        onPressed: () => roomService.lockRound(),
                                        icon: const Icon(Icons.lock_rounded,
                                            color: Colors.black87),
                                        label: const Text(
                                          'LOCK BUZZER',
                                          style: TextStyle(
                                            color: Colors.black87,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.8,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: SizedBox(
                                      height: 48,
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppConstants.accentPurple,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                        ),
                                        onPressed: () => roomService.resetRound(),
                                        icon: const Icon(Icons.arrow_forward_rounded,
                                            color: Colors.white),
                                        label: const Text(
                                          'NEXT ROUND',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.8,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              SizedBox(
                                width: double.infinity,
                                height: 44,
                                child: OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white70,
                                    side: BorderSide(
                                      color: Colors.white.withValues(alpha: 0.2),
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  onPressed: () => roomService.resetBuzzer(),
                                  icon: const Icon(Icons.replay_rounded, size: 18),
                                  label: const Text(
                                    'CLEAR & RE-ENABLE BUZZER',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.6,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          )
                        else
                          // Locked state
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: 50,
                                  child: OutlinedButton.icon(
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.white,
                                      side: BorderSide(
                                        color: Colors.white.withValues(alpha: 0.3),
                                        width: 1.5,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    onPressed: () => roomService.resetBuzzer(),
                                    icon: const Icon(Icons.replay_rounded,
                                        color: AppConstants.accentBlue),
                                    label: const Text(
                                      'RE-ENABLE BUZZER',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: SizedBox(
                                  height: 50,
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppConstants.accentPurple,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    onPressed: () => roomService.resetRound(),
                                    icon: const Icon(Icons.arrow_forward_rounded,
                                        color: Colors.white),
                                    label: const Text(
                                      'NEXT ROUND',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 4. Connected Teams Section
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppConstants.surfaceDark,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.groups_rounded,
                                size: 18, color: AppConstants.accentBlue),
                            const SizedBox(width: 8),
                            const Text(
                              'CONNECTED TEAMS',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                                color: Colors.white,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppConstants.cardDark,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '$connectedCount teams',
                                style: const TextStyle(
                                  color: AppConstants.statusGreen,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        if (room.participants.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            child: Center(
                              child: Column(
                                children: [
                                  Icon(Icons.hourglass_empty_rounded,
                                      size: 32,
                                      color:
                                          Colors.white.withValues(alpha: 0.3)),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Waiting for college teams to join...',
                                    style: TextStyle(
                                      color:
                                          Colors.white.withValues(alpha: 0.5),
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Share Room ID "${room.roomId}" with participants',
                                    style: const TextStyle(
                                      color: AppConstants.accentBlue,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: room.participants.length,
                            itemBuilder: (context, index) {
                              final p = room.participants[index];
                              final isWinner =
                                  room.currentWinner == p.participantId;
                              return ParticipantCard(
                                participant: p,
                                isWinner: isWinner,
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 5. Round History Section
                  if (room.roundHistory.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppConstants.surfaceDark,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.08),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.history_rounded,
                                  size: 18, color: AppConstants.winnerGold),
                              SizedBox(width: 8),
                              Text(
                                'ROUND HISTORY',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.2,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...room.roundHistory.reversed.map((record) {
                            final buzzCount = record.buzzes.isNotEmpty
                                ? record.buzzes.length
                                : 1;
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppConstants.cardDark,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'Round ${record.round}',
                                          style: TextStyle(
                                            color: Colors.white
                                                .withValues(alpha: 0.7),
                                            fontWeight: FontWeight.w600,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Text(
                                        '#1 ${record.winner}',
                                        style: const TextStyle(
                                          color: AppConstants.winnerGold,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const Spacer(),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.white
                                              .withValues(alpha: 0.08),
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          '$buzzCount buzzed',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: Colors.white70,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (record.buzzes.length > 1) ...[
                                    const SizedBox(height: 4),
                                    Padding(
                                      padding: const EdgeInsets.only(left: 4),
                                      child: Text(
                                        'Arrivals: ${record.buzzes.map((b) => '#${b.rank} ${b.name} (${b.formattedOffset})').join('  ➔  ')}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.white
                                              .withValues(alpha: 0.5),
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
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

  Widget _buildStatusPill(RoundStatus status) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case RoundStatus.active:
        bg = AppConstants.statusGreen.withValues(alpha: 0.2);
        fg = AppConstants.statusGreen;
        label = 'BUZZER READY';
        break;
      case RoundStatus.locked:
        bg = AppConstants.statusAmber.withValues(alpha: 0.2);
        fg = AppConstants.statusAmber;
        label = 'BUZZER LOCKED';
        break;
      case RoundStatus.waiting:
        bg = Colors.white.withValues(alpha: 0.1);
        fg = Colors.white70;
        label = 'WAITING';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontWeight: FontWeight.w800,
          fontSize: 11,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
