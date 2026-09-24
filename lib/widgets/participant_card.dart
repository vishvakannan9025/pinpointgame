import 'package:flutter/material.dart';
import '../models/participant_model.dart';
import '../utils/constants.dart';

class ParticipantCard extends StatelessWidget {
  final ParticipantModel participant;
  final bool isWinner;
  final bool isCurrentPlayer;
  final int? rank;
  final String? timeOffset;

  const ParticipantCard({
    super.key,
    required this.participant,
    this.isWinner = false,
    this.isCurrentPlayer = false,
    this.rank,
    this.timeOffset,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = participant.isConnected
        ? AppConstants.statusGreen
        : Colors.white.withValues(alpha: 0.3);

    final isFirst = rank == 1 || isWinner;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isFirst
            ? AppConstants.winnerGold.withValues(alpha: 0.12)
            : AppConstants.surfaceDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isFirst
              ? AppConstants.winnerGold.withValues(alpha: 0.5)
              : isCurrentPlayer
                  ? AppConstants.accentBlue.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.06),
          width: isFirst || isCurrentPlayer ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          // Avatar circle or rank circle
          if (rank != null)
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              margin: const EdgeInsets.only(right: 10),
              decoration: BoxDecoration(
                color: rank == 1
                    ? AppConstants.winnerGold
                    : rank == 2
                        ? const Color(0xFF94A3B8)
                        : rank == 3
                            ? const Color(0xFFD97706)
                            : Colors.white.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Text(
                '#$rank',
                style: TextStyle(
                  color: (rank == 1 || rank == 2) ? Colors.black : Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
            )
          else
            CircleAvatar(
              radius: 16,
              backgroundColor: isFirst
                  ? AppConstants.winnerGold
                  : AppConstants.accentPurple.withValues(alpha: 0.4),
              child: Text(
                participant.name.isNotEmpty
                    ? participant.name.substring(0, 1).toUpperCase()
                    : '?',
                style: TextStyle(
                  color: isFirst ? Colors.black : Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          if (rank == null) const SizedBox(width: 10),

          // Participant Name
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    participant.name,
                    style: TextStyle(
                      color: isFirst
                          ? AppConstants.winnerGold
                          : Colors.white,
                      fontWeight:
                          isCurrentPlayer ? FontWeight.bold : FontWeight.w600,
                      fontSize: 14,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (isCurrentPlayer) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppConstants.accentBlue.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'YOU',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppConstants.accentBlue,
                      ),
                    ),
                  ),
                ],
                if (isFirst) ...[
                  const SizedBox(width: 6),
                  const Text('🥇', style: TextStyle(fontSize: 13)),
                ],
              ],
            ),
          ),

          // Buzz status with rank/offset
          if (rank != null)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: rank == 1
                      ? AppConstants.winnerGold.withValues(alpha: 0.2)
                      : Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: rank == 1
                        ? AppConstants.winnerGold.withValues(alpha: 0.4)
                        : Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                child: Text(
                  timeOffset ?? '#$rank',
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    color: rank == 1
                        ? AppConstants.winnerGold
                        : AppConstants.accentBlue,
                  ),
                ),
              ),
            )
          else if (participant.hasBuzzed)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Buzzed',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white70,
                  ),
                ),
              ),
            ),

          // Connectivity dot
          Tooltip(
            message: participant.isConnected ? 'Connected' : 'Disconnected',
            child: Container(
              width: 9,
              height: 9,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: statusColor,
                boxShadow: participant.isConnected
                    ? [
                        BoxShadow(
                          color: AppConstants.statusGreen.withValues(alpha: 0.6),
                          blurRadius: 6,
                          spreadRadius: 1,
                        ),
                      ]
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
