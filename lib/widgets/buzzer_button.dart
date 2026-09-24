import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../utils/constants.dart';

class BuzzerButton extends StatefulWidget {
  final bool isEnabled;
  final VoidCallback onBuzz;

  const BuzzerButton({
    super.key,
    required this.isEnabled,
    required this.onBuzz,
  });

  @override
  State<BuzzerButton> createState() => _BuzzerButtonState();
}

class _BuzzerButtonState extends State<BuzzerButton>
    with SingleTickerProviderStateMixin {
  bool _isPressed = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (!widget.isEnabled) return;
    // CRITICAL LATENCY OPTIMIZATION: Trigger buzz immediately on initial touch-down
    widget.onBuzz();
    HapticFeedback.heavyImpact();
    setState(() => _isPressed = true);
  }

  void _handleTapUp(TapUpDetails _) {
    if (_isPressed) {
      setState(() => _isPressed = false);
    }
  }

  void _handleTapCancel() {
    if (_isPressed) {
      setState(() => _isPressed = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEnabled = widget.isEnabled;

    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth = constraints.maxWidth.isFinite && constraints.maxWidth > 0
            ? constraints.maxWidth
            : 280.0;
        // Adaptive sizing ensuring safe clearance for glow and scale effect
        final buttonSize = (availableWidth * 0.62).clamp(120.0, 200.0);
        final iconSize = (buttonSize * 0.22).clamp(28.0, 42.0);
        final fontSize = (buttonSize * 0.13).clamp(16.0, 26.0);

        return Center(
          child: AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              final scale =
                  isEnabled && !_isPressed ? _pulseAnimation.value : 1.0;
              return Transform.scale(
                scale: _isPressed ? 0.95 : scale,
                child: child,
              );
            },
            child: GestureDetector(
              onTapDown: _handleTapDown,
              onTapUp: _handleTapUp,
              onTapCancel: _handleTapCancel,
              child: Container(
                width: buttonSize,
                height: buttonSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: isEnabled
                        ? [
                            AppConstants.buzzerGlow,
                            AppConstants.buzzerRed,
                            AppConstants.buzzerRedPressed,
                          ]
                        : [
                            const Color(0xFF64748B),
                            const Color(0xFF475569),
                            const Color(0xFF334155),
                          ],
                    center: const Alignment(-0.2, -0.3),
                    radius: 0.9,
                  ),
                  border: Border.all(
                    color: isEnabled
                        ? Colors.white.withValues(alpha: 0.4)
                        : Colors.white.withValues(alpha: 0.1),
                    width: 4.5,
                  ),
                  boxShadow: isEnabled
                      ? [
                          // Active Glow (controlled blur and spread to prevent horizontal overflow)
                          BoxShadow(
                            color:
                                AppConstants.buzzerRed.withValues(alpha: 0.40),
                            blurRadius: _isPressed ? 8 : 16,
                            spreadRadius: _isPressed ? 0 : 1,
                            offset: const Offset(0, 3),
                          ),
                          // 3D bottom shadow
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.35),
                            blurRadius: 8,
                            offset: const Offset(0, 5),
                          ),
                        ]
                      : [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 6,
                            offset: const Offset(0, 4),
                          ),
                        ],
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isEnabled
                            ? Icons.touch_app_rounded
                            : Icons.lock_outline_rounded,
                        size: iconSize,
                        color: isEnabled ? Colors.white : Colors.white54,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isEnabled ? 'BUZZ' : 'LOCKED',
                        style: TextStyle(
                          color: isEnabled ? Colors.white : Colors.white60,
                          fontSize: fontSize,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2.5,
                          shadows: isEnabled
                              ? [
                                  Shadow(
                                    color: Colors.black.withValues(alpha: 0.4),
                                    offset: const Offset(0, 2),
                                    blurRadius: 4,
                                  ),
                                ]
                              : null,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        isEnabled ? 'TAP TO BUZZ' : 'WAIT FOR ROUND',
                        style: TextStyle(
                          color: isEnabled ? Colors.white70 : Colors.white38,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
