import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/socket_service.dart';
import '../utils/constants.dart';
import 'connection_status.dart';
import 'qr_connection_dialog.dart';

class RoomHeader extends StatelessWidget {
  final String roomId;
  final int round;
  final String? hostStatusMessage;

  const RoomHeader({
    super.key,
    required this.roomId,
    required this.round,
    this.hostStatusMessage,
  });

  void _copyRoomId(BuildContext context) {
    Clipboard.setData(ClipboardData(text: roomId));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Room ID "$roomId" copied to clipboard!'),
        duration: const Duration(seconds: 2),
        backgroundColor: AppConstants.accentPurple,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _openQrCode(BuildContext context) {
    final serverUrl = context.read<SocketService>().serverUrl;
    QrConnectionDialog.show(context, initialUrl: serverUrl, roomId: roomId);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (hostStatusMessage != null)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: AppConstants.statusAmber.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppConstants.statusAmber),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded,
                    color: AppConstants.statusAmber, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hostStatusMessage!,
                    style: const TextStyle(
                      color: AppConstants.statusAmber,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppConstants.surfaceDark,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            runSpacing: 10,
            spacing: 10,
            children: [
              // Room ID with copy and QR button
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'ROOM ID',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
                      const SizedBox(height: 2),
                      InkWell(
                        onTap: () => _copyRoomId(context),
                        borderRadius: BorderRadius.circular(6),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 1),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                roomId,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2,
                                  color: AppConstants.accentBlue,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.copy_rounded,
                                size: 14,
                                color: Colors.white.withValues(alpha: 0.5),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                  // QR Code Button
                  InkWell(
                    onTap: () => _openQrCode(context),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppConstants.cardDark,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppConstants.accentBlue.withValues(alpha: 0.3),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.qr_code_2_rounded,
                            size: 16,
                            color: AppConstants.accentBlue,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'QR',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: AppConstants.accentBlue,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              // Round badge & Connection status
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppConstants.accentPurple.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppConstants.accentPurple.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Text(
                      'ROUND $round',
                      style: const TextStyle(
                        color: AppConstants.accentPurple,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const ConnectionStatusWidget(),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
