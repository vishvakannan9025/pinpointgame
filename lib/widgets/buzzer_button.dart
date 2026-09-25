import 'dart:math';
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
    with TickerProviderStateMixin {
  bool _isPressed = false;

  // Primary breathing pulse
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // Outer ring rotation
  late AnimationController _ringController;

  // Glow halo expansion
  late AnimationController _glowController;
  late Animation<double> _glowAnimation;

  // Press impact bounce
  late AnimationController _pressController;
  late Animation<double> _pressAnimation;

  @override
  void initState() {
    super.initState();

    // Breathing pulse — gentle scale oscillation
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.97, end: 1.03).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Ring rotation — slow constant spin
    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();

    // Glow halo — expanding ring opacity
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
    _glowAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeOut),
    );

    // Press bounce-back
    _pressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _pressAnimation = Tween<double>(begin: 1.0, end: 0.88).animate(
      CurvedAnimation(parent: _pressController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _ringController.dispose();
    _glowController.dispose();
    _pressController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (!widget.isEnabled) return;
    widget.onBuzz();
    HapticFeedback.heavyImpact();
    _pressController.forward();
    setState(() => _isPressed = true);
  }

  void _handleTapUp(TapUpDetails _) {
    if (_isPressed) {
      _pressController.reverse();
      setState(() => _isPressed = false);
    }
  }

  void _handleTapCancel() {
    if (_isPressed) {
      _pressController.reverse();
      setState(() => _isPressed = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEnabled = widget.isEnabled;

    return LayoutBuilder(
      builder: (context, constraints) {
        final availableWidth =
            constraints.maxWidth.isFinite && constraints.maxWidth > 0
                ? constraints.maxWidth
                : 280.0;
        final buttonSize = (availableWidth * 0.55).clamp(130.0, 200.0);
        final iconSize = (buttonSize * 0.20).clamp(26.0, 40.0);
        final fontSize = (buttonSize * 0.12).clamp(14.0, 24.0);
        final outerRingSize = buttonSize + 40;

        return Center(
          child: SizedBox(
            width: outerRingSize + 20,
            height: outerRingSize + 20,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // ── Layer 1: Expanding glow halo (enabled only) ──
                if (isEnabled)
                  AnimatedBuilder(
                    animation: _glowAnimation,
                    builder: (context, _) {
                      final progress = _glowAnimation.value;
                      return Container(
                        width: buttonSize + 30 + (progress * 40),
                        height: buttonSize + 30 + (progress * 40),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppConstants.buzzerRed
                                .withValues(alpha: 0.3 * (1 - progress)),
                            width: 2,
                          ),
                        ),
                      );
                    },
                  ),

                // ── Layer 2: Rotating dashed ring ──
                if (isEnabled)
                  AnimatedBuilder(
                    animation: _ringController,
                    builder: (context, _) {
                      return Transform.rotate(
                        angle: _ringController.value * 2 * pi,
                        child: CustomPaint(
                          size: Size(outerRingSize, outerRingSize),
                          painter: _DashedRingPainter(
                            color: AppConstants.accentPurple
                                .withValues(alpha: 0.5),
                            strokeWidth: 2.5,
                            dashCount: 24,
                          ),
                        ),
                      );
                    },
                  ),

                // ── Layer 3: Soft glow underneath ──
                if (isEnabled)
                  AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, _) {
                      return Container(
                        width: buttonSize + 16,
                        height: buttonSize + 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppConstants.buzzerRed
                                  .withValues(alpha: 0.25 * _pulseAnimation.value),
                              blurRadius: 35,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                // ── Layer 4: Main buzzer button ──
                AnimatedBuilder(
                  animation: Listenable.merge([_pulseAnimation, _pressAnimation]),
                  builder: (context, child) {
                    double scale;
                    if (_isPressed) {
                      scale = _pressAnimation.value;
                    } else if (isEnabled) {
                      scale = _pulseAnimation.value;
                    } else {
                      scale = 1.0;
                    }
                    return Transform.scale(
                      scale: scale,
                      child: child,
                    );
                  },
                  child: GestureDetector(
                    onTapDown: _handleTapDown,
                    onTapUp: _handleTapUp,
                    onTapCancel: _handleTapCancel,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: buttonSize,
                      height: buttonSize,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: isEnabled
                              ? [
                                  const Color(0xFFFF6B6B),
                                  AppConstants.buzzerRed,
                                  const Color(0xFFB91C1C),
                                ]
                              : [
                                  const Color(0xFF64748B),
                                  const Color(0xFF475569),
                                  const Color(0xFF334155),
                                ],
                          center: const Alignment(-0.2, -0.35),
                          radius: 0.85,
                        ),
                        border: Border.all(
                          color: isEnabled
                              ? Colors.white.withValues(alpha: 0.5)
                              : Colors.white.withValues(alpha: 0.1),
                          width: 4,
                        ),
                        boxShadow: [
                          if (isEnabled) ...[
                            BoxShadow(
                              color: AppConstants.buzzerRed
                                  .withValues(alpha: _isPressed ? 0.6 : 0.35),
                              blurRadius: _isPressed ? 40 : 20,
                              spreadRadius: _isPressed ? 4 : 1,
                            ),
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 6),
                            ),
                          ] else
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                        ],
                      ),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Animated icon swap
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 300),
                              transitionBuilder: (child, animation) {
                                return ScaleTransition(
                                    scale: animation, child: child);
                              },
                              child: Icon(
                                isEnabled
                                    ? Icons.touch_app_rounded
                                    : Icons.lock_outline_rounded,
                                key: ValueKey(isEnabled),
                                size: iconSize,
                                color:
                                    isEnabled ? Colors.white : Colors.white54,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              isEnabled ? 'BUZZ' : 'LOCKED',
                              style: TextStyle(
                                color:
                                    isEnabled ? Colors.white : Colors.white60,
                                fontSize: fontSize,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 3,
                                shadows: isEnabled
                                    ? [
                                        Shadow(
                                          color: Colors.black
                                              .withValues(alpha: 0.5),
                                          offset: const Offset(0, 2),
                                          blurRadius: 6,
                                        ),
                                      ]
                                    : null,
                              ),
                            ),
                            const SizedBox(height: 2),
                            AnimatedOpacity(
                              opacity: isEnabled ? 1.0 : 0.5,
                              duration: const Duration(milliseconds: 300),
                              child: Text(
                                isEnabled ? 'TAP TO BUZZ' : 'WAIT FOR ROUND',
                                style: TextStyle(
                                  color: isEnabled
                                      ? Colors.white70
                                      : Colors.white38,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Custom painter for the rotating dashed ring around the buzzer
class _DashedRingPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final int dashCount;

  _DashedRingPainter({
    required this.color,
    required this.strokeWidth,
    required this.dashCount,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - strokeWidth;
    final dashAngle = (2 * pi) / dashCount;
    final gapRatio = 0.4;

    for (int i = 0; i < dashCount; i++) {
      final startAngle = i * dashAngle;
      final sweepAngle = dashAngle * (1 - gapRatio);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRingPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.dashCount != dashCount;
  }
}
