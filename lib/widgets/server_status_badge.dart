import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/socket_service.dart';
import '../utils/constants.dart';

class ServerStatusBadge extends StatelessWidget {
  const ServerStatusBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<SocketService>();
    final isConnected = socketService.isConnected;
    final isConnecting =
        socketService.status == ConnectionStateStatus.connecting;

    final Color bg;
    final Color border;
    final Color dotColor;
    final String label;

    if (isConnected) {
      final latency = socketService.latencyMs;
      final latencyStr = latency != null ? ' ($latency ms)' : '';
      bg = AppConstants.statusGreen.withValues(alpha: 0.12);
      border = AppConstants.statusGreen.withValues(alpha: 0.35);
      dotColor = AppConstants.statusGreen;
      label = 'Online$latencyStr';
    } else if (isConnecting) {
      bg = AppConstants.statusAmber.withValues(alpha: 0.12);
      border = AppConstants.statusAmber.withValues(alpha: 0.35);
      dotColor = AppConstants.statusAmber;
      label = 'Connecting...';
    } else {
      bg = AppConstants.statusRed.withValues(alpha: 0.12);
      border = AppConstants.statusRed.withValues(alpha: 0.35);
      dotColor = AppConstants.statusRed;
      label = 'Offline';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: dotColor,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: dotColor,
            ),
          ),
        ],
      ),
    );
  }
}
