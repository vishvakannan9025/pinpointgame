import 'package:flutter/material.dart';
import '../models/buzzer_result_model.dart';
import '../utils/constants.dart';

class BuzzOrderCard extends StatelessWidget {
  final List<BuzzEntryModel> buzzQueue;
  final int round;
  final String? currentParticipantId;
  final int? totalParticipants;
  final bool isRoundLocked;

  const BuzzOrderCard({
    super.key,
    required this.buzzQueue,
    required this.round,
    this.currentParticipantId,
    this.totalParticipants,
    this.isRoundLocked = false,
  });

  @override
  Widget build(BuildContext context) {
    final hasBuzzes = buzzQueue.isNotEmpty;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasBuzzes
              ? AppConstants.winnerGold.withValues(alpha: 0.3)
              : Colors.white.withValues(alpha: 0.08),
          width: hasBuzzes ? 1.5 : 1.0,
        ),
        boxShadow: hasBuzzes
            ? [
                BoxShadow(
                  color: AppConstants.winnerGold.withValues(alpha: 0.08),
                  blurRadius: 16,
                  spreadRadius: 1,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: hasBuzzes
                        ? AppConstants.winnerGold.withValues(alpha: 0.15)
                        : Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.format_list_numbered_rounded,
                    size: 18,
                    color: hasBuzzes ? AppConstants.winnerGold : Colors.white70,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'BUZZER SEQUENCE • ROUND $round',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                          color: hasBuzzes
                              ? AppConstants.winnerGold
                              : Colors.white.withValues(alpha: 0.7),
                        ),
                      ),
                      Text(
                        isRoundLocked
                            ? 'Round completed • Final arrival order'
                            : hasBuzzes
                                ? 'Live arrival order by millisecond timestamp'
                                : 'Awaiting buzzes in real-time',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppConstants.cardDark,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: hasBuzzes
                          ? AppConstants.winnerGold.withValues(alpha: 0.25)
                          : Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                  child: Text(
                    totalParticipants != null
                        ? '${buzzQueue.length} / $totalParticipants'
                        : '${buzzQueue.length} buzzed',
                    style: TextStyle(
                      color: hasBuzzes
                          ? AppConstants.winnerGold
                          : Colors.white70,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Colors.white12),

          // Content
          if (!hasBuzzes)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 26),
              child: Column(
                children: [
                  Icon(
                    Icons.touch_app_outlined,
                    size: 36,
                    color: Colors.white.withValues(alpha: 0.25),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'No buzzes recorded yet for this round',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Teams will appear here in exact sequential order (1st, 2nd, 3rd...)',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              itemCount: buzzQueue.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final entry = buzzQueue[index];
                final isCurrent = entry.participantId == currentParticipantId;
                return _buildBuzzTile(entry, isCurrent);
              },
            ),
        ],
      ),
    );
  }

  String _getRankOrdinal(int rank) {
    if (rank % 100 >= 11 && rank % 100 <= 13) {
      return '${rank}th';
    }
    switch (rank % 10) {
      case 1:
        return '${rank}st';
      case 2:
        return '${rank}nd';
      case 3:
        return '${rank}rd';
      default:
        return '${rank}th';
    }
  }

  Widget _buildBuzzTile(BuzzEntryModel entry, bool isCurrent) {
    Color rankBg;
    Color rankFg;
    Color borderCol;
    final rankOrdinal = _getRankOrdinal(entry.rank);

    switch (entry.rank) {
      case 1:
        rankBg = AppConstants.winnerGold;
        rankFg = Colors.black;
        borderCol = AppConstants.winnerGold.withValues(alpha: 0.5);
        break;
      case 2:
        rankBg = const Color(0xFF94A3B8); // Silver/slate
        rankFg = Colors.black;
        borderCol = const Color(0xFF94A3B8).withValues(alpha: 0.4);
        break;
      case 3:
        rankBg = const Color(0xFFD97706); // Bronze/Amber
        rankFg = Colors.white;
        borderCol = const Color(0xFFD97706).withValues(alpha: 0.4);
        break;
      default:
        rankBg = Colors.white.withValues(alpha: 0.12);
        rankFg = Colors.white;
        borderCol = Colors.white.withValues(alpha: 0.06);
        break;
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: isCurrent
            ? AppConstants.accentBlue.withValues(alpha: 0.12)
            : entry.rank == 1
                ? AppConstants.winnerGold.withValues(alpha: 0.08)
                : AppConstants.cardDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrent
              ? AppConstants.accentBlue
              : borderCol,
          width: isCurrent || entry.rank == 1 ? 1.5 : 1.0,
        ),
      ),
      child: Row(
        children: [
          // Rank Badge
          Container(
            width: 42,
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: rankBg,
              borderRadius: BorderRadius.circular(10),
              boxShadow: entry.rank == 1
                  ? [
                      BoxShadow(
                        color: AppConstants.winnerGold.withValues(alpha: 0.4),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: Text(
              rankOrdinal,
              style: TextStyle(
                color: rankFg,
                fontWeight: FontWeight.w900,
                fontSize: 13,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Team Name with exact "1st: Team Name" format & Server Timestamp
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        '$rankOrdinal: ${entry.name}',
                        style: TextStyle(
                          color: entry.rank == 1
                              ? AppConstants.winnerGold
                              : Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isCurrent) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppConstants.accentBlue,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: const Text(
                          'YOU',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                if (entry.formattedTimestamp.isNotEmpty)
                  Text(
                    'Time: ${entry.formattedTimestamp}',
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 10.5,
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // Delta / Offset Badge (Fraction of a second)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: entry.rank == 1
                  ? AppConstants.winnerGold.withValues(alpha: 0.15)
                  : Colors.black.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: entry.rank == 1
                    ? AppConstants.winnerGold.withValues(alpha: 0.4)
                    : Colors.white.withValues(alpha: 0.1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  entry.formattedOffset,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12.5,
                    fontWeight: FontWeight.w900,
                    color: entry.rank == 1
                        ? AppConstants.winnerGold
                        : AppConstants.accentBlue,
                  ),
                ),
                Text(
                  entry.rank == 1 ? '1st Press' : 'Offset',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.5),
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
