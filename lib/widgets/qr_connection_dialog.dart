import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../utils/constants.dart';

class QrConnectionDialog extends StatefulWidget {
  final String initialUrl;
  final String? roomId;

  const QrConnectionDialog({
    super.key,
    required this.initialUrl,
    this.roomId,
  });

  static void show(BuildContext context, {required String initialUrl, String? roomId}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => QrConnectionDialog(
        initialUrl: initialUrl,
        roomId: roomId,
      ),
    );
  }

  @override
  State<QrConnectionDialog> createState() => _QrConnectionDialogState();
}

class _QrConnectionDialogState extends State<QrConnectionDialog> {
  late String _selectedUrl;

  @override
  void initState() {
    super.initState();
    _selectedUrl = widget.initialUrl;
  }

  String _getShareUrl() {
    final base = _selectedUrl.trim().replaceAll(RegExp(r'/+$'), '');
    if (widget.roomId != null && widget.roomId!.isNotEmpty) {
      return '$base/#/?room=${widget.roomId}';
    }
    return base;
  }

  void _copyToClipboard(String text, String message) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
        backgroundColor: AppConstants.accentPurple,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final shareUrl = _getShareUrl();
    final isTunnel = _selectedUrl.contains('trycloudflare.com') ||
        _selectedUrl.contains('loca.lt') ||
        _selectedUrl.contains('lhr.life');
    final isWifi = _selectedUrl.contains('10.') ||
        _selectedUrl.contains('192.168.') ||
        _selectedUrl.contains('172.');
    final isLocalhost = _selectedUrl.contains('localhost') ||
        _selectedUrl.contains('127.0.0.1');

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppConstants.accentBlue.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner_rounded,
                    color: AppConstants.accentBlue,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'SCAN QR TO CONNECT',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        widget.roomId != null
                            ? 'Students can scan to join Room "${widget.roomId}"'
                            : 'Scan with mobile camera to open buzzer server',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.white70),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Network Selector Tabs
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppConstants.cardDark,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildNetworkTab(
                      label: 'Internet Tunnel',
                      icon: Icons.cloud_outlined,
                      isSelected: isTunnel,
                      onTap: () => setState(() {
                        _selectedUrl = AppConstants.defaultPublicTunnelUrl;
                      }),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: _buildNetworkTab(
                      label: 'Same Wi-Fi',
                      icon: Icons.wifi_rounded,
                      isSelected: isWifi,
                      onTap: () => setState(() {
                        _selectedUrl = AppConstants.defaultLocalWifiUrl;
                      }),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: _buildNetworkTab(
                      label: 'Localhost',
                      icon: Icons.laptop_rounded,
                      isSelected: isLocalhost,
                      onTap: () => setState(() {
                        _selectedUrl = AppConstants.defaultLocalhostUrl;
                      }),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // QR Code Box
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.3),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: shareUrl,
                  version: QrVersions.auto,
                  size: 190.0,
                  backgroundColor: Colors.white,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: Color(0xFF0F172A),
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Room ID pill if available
            if (widget.roomId != null) ...[
              Center(
                child: InkWell(
                  onTap: () => _copyToClipboard(
                      widget.roomId!, 'Room ID "${widget.roomId}" copied!'),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppConstants.accentBlue.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppConstants.accentBlue.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'ROOM CODE: ',
                          style: TextStyle(
                            color: Colors.white70,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          widget.roomId!,
                          style: const TextStyle(
                            color: AppConstants.accentBlue,
                            fontWeight: FontWeight.w900,
                            fontSize: 15,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.copy_rounded,
                            size: 14, color: AppConstants.accentBlue),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // URL Display Box underneath QR
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppConstants.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.link_rounded,
                      size: 18, color: AppConstants.accentBlue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      shareUrl,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        color: Colors.white,
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: () =>
                        _copyToClipboard(shareUrl, 'Link copied to clipboard!'),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.copy_rounded,
                              size: 12, color: Colors.white70),
                          SizedBox(width: 4),
                          Text(
                            'COPY',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Tip note
            Text(
              isWifi
                  ? '⚠️ Make sure both host and student devices are connected to the SAME Wi-Fi network.'
                  : isTunnel
                      ? '✅ Works across mobile data (4G/5G) and any Wi-Fi network via Cloudflare.'
                      : 'ℹ️ Localhost works only for browser testing on this specific computer.',
              style: TextStyle(
                fontSize: 11,
                color: isWifi
                    ? AppConstants.statusAmber
                    : Colors.white.withValues(alpha: 0.6),
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNetworkTab({
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppConstants.accentPurple : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.white60,
            ),
            const SizedBox(height: 3),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Colors.white : Colors.white70,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
