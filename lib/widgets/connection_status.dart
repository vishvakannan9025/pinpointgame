import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/socket_service.dart';
import '../utils/constants.dart';

class ConnectionStatusWidget extends StatelessWidget {
  const ConnectionStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<SocketService>();
    final status = socketService.status;

    Color color;
    String text;
    IconData icon;

    switch (status) {
      case ConnectionStateStatus.connected:
        color = AppConstants.statusGreen;
        text = 'Connected';
        icon = Icons.check_circle_rounded;
        break;
      case ConnectionStateStatus.connecting:
        color = AppConstants.statusAmber;
        text = 'Reconnecting...';
        icon = Icons.sync_rounded;
        break;
      case ConnectionStateStatus.disconnected:
        color = AppConstants.statusRed;
        text = 'Disconnected';
        icon = Icons.cancel_rounded;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
