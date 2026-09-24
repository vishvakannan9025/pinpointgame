import 'package:flutter/material.dart';
import '../utils/constants.dart';

class WinnerCard extends StatelessWidget {
  final String winnerName;
  final int round;
  final String? serverTimestamp;
  final bool isCurrentUser;

  const WinnerCard({
    super.key,
    required this.winnerName,
    required this.round,
    this.serverTimestamp,
    this.isCurrentUser = false,
  });

  String _formatTimestamp(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}:${dt.second.toString().padLeft(2, '0')}.${dt.millisecond.toString().padLeft(3, '0')}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    final formattedTime = _formatTimestamp(serverTimestamp);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppConstants.winnerGold.withValues(alpha: 0.2),
            AppConstants.cardDark,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppConstants.winnerGold,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: AppConstants.winnerGold.withValues(alpha: 0.25),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppConstants.winnerGold.withValues(alpha: 0.2),
            ),
            child: const Icon(
              Icons.emoji_events_rounded,
              size: 48,
              color: AppConstants.winnerGold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            isCurrentUser ? '🏆 YOU WON!' : '🏆 FIRST BUZZER',
            style: const TextStyle(
              color: AppConstants.winnerGold,
              fontSize: 16,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            winnerName.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Pressed First • Round $round',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (formattedTime.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Server Commit: $formattedTime',
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
