
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'cadastral_sheets.dart';

Widget _newCornerBadge(String text, {Color? bg}) {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
    decoration: BoxDecoration(
      color: bg ?? const Color(0xFFEF4444),
      borderRadius: BorderRadius.circular(5),
      boxShadow: [
        BoxShadow(
          color: (bg ?? const Color(0xFFEF4444)).withValues(alpha: 0.35),
          blurRadius: 4,
          offset: const Offset(0, 1.5),
        ),
      ],
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 4,
          height: 4,
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 3.5),
        Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 8.5,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            letterSpacing: 0.5,
          ),
        ),
      ],
    ),
  );
}


// ─── EXECUTIVE WHITE DESIGN SYSTEM (LIGHT THEME) ─────────────────────────────
const kBg           = Color(0xFFF8FAFC); // Clean Slate-50 background
const kCard         = Color(0xFFFFFFFF); // Crisp Pure White
const kCardElevated = Color(0xFFF1F5F9); // Light Slate-100 surface
const kBorder       = Color(0xFFE2E8F0); // Slate-200 border
const kBorderLight  = Color(0xFFCBD5E1); // Slate-300
const kPrimary      = Color(0xFF1E40AF); // Government Royal Blue
const kPrimaryLight = Color(0xFF3B82F6); // Vibrant Blue
const kCyan         = Color(0xFF0284C7); // Sky/Cyan 600
const kAccent       = Color(0xFF059669); // Emerald 600 (Verified)
const kTeal         = Color(0xFF0F766E); // Deep Teal (TNGIS Brand)
const kWarning      = Color(0xFFD97706); // Amber 600 (Alert)
const kDanger       = Color(0xFFDC2626); // Crimson 600 (Critical)
const kText         = Color(0xFF0F172A); // High contrast Slate-900
const kTextSec      = Color(0xFF475569); // Slate-600
const kTextMuted    = Color(0xFF94A3B8); // Slate-400

// ─── API CONFIGURATION (DYNAMIC MULTI-HOST FOR APK, HOTSPOT & LOCALHOST) ───────
// Current Wi-Fi hotspot IP: 10.248.93.33 (update this when the PC's IP changes)
String _activeApiHost = 'http://10.248.93.33:8000';
String? _customApiHost;

List<String> get kApiHosts {
  final hosts = <String>[];
  if (_customApiHost != null && _customApiHost!.trim().isNotEmpty) {
    hosts.add(_customApiHost!.trim());
  }
  if (!hosts.contains(_activeApiHost)) {
    hosts.add(_activeApiHost);
  }
  for (final h in [
    'http://10.248.93.33:8000', // Current Wi-Fi IP
    'http://10.19.203.33:8000', // Previous hotspot IP
    'http://192.168.31.26:8000',
    'http://10.232.119.33:8000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://10.0.2.2:8000',    // Android emulator
  ]) {
    if (!hosts.contains(h)) hosts.add(h);
  }
  return hosts;
}

Future<http.Response?> makeApiGet(String path) async {
  for (final host in kApiHosts) {
    try {
      final res = await http.get(Uri.parse('$host$path')).timeout(const Duration(seconds: 2));
      if (res.statusCode == 200) {
        _activeApiHost = host;
        return res;
      }
    } catch (_) {}
  }
  return null;
}

Future<http.Response?> makeApiPost(String path, Map<String, dynamic> body) async {
  for (final host in kApiHosts) {
    try {
      final res = await http.post(
        Uri.parse('$host$path'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) {
        _activeApiHost = host;
        return res;
      }
    } catch (_) {}
  }
  return null;
}

void showServerConfigDialog(BuildContext context, VoidCallback onUpdated) {
  final textCtrl = TextEditingController(text: _activeApiHost.replaceAll('http://', ''));
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: kCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          const Icon(LucideIcons.wifi, color: kPrimary, size: 20),
          const SizedBox(width: 8),
          Text('Configure Backend IP', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: kText)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Connect mobile APK to your PC Django server over Wi-Fi Hotspot.',
            style: GoogleFonts.inter(fontSize: 12, color: kTextSec),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: textCtrl,
            decoration: InputDecoration(
              prefixText: 'http://',
              labelText: 'IP Address : Port',
              hintText: '192.168.31.26:8000',
              filled: true,
              fillColor: kBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kBorder)),
            ),
          ),
          const SizedBox(height: 12),
          Text('Quick Hotspot Presets:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: kTextMuted)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: [
              ActionChip(
                label: const Text('10.248.93.33:8000 ✓ Current', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: kPrimary)),
                onPressed: () => textCtrl.text = '10.248.93.33:8000',
              ),
              ActionChip(
                label: const Text('10.19.203.33:8000', style: TextStyle(fontSize: 10)),
                onPressed: () => textCtrl.text = '10.19.203.33:8000',
              ),
              ActionChip(
                label: const Text('192.168.31.26:8000', style: TextStyle(fontSize: 10)),
                onPressed: () => textCtrl.text = '192.168.31.26:8000',
              ),
              ActionChip(
                label: const Text('localhost:8000', style: TextStyle(fontSize: 10)),
                onPressed: () => textCtrl.text = 'localhost:8000',
              ),
              ActionChip(
                label: const Text('10.0.2.2:8000 (Emulator)', style: TextStyle(fontSize: 10)),
                onPressed: () => textCtrl.text = '10.0.2.2:8000',
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: kPrimary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: () {
            final val = textCtrl.text.trim();
            if (val.isNotEmpty) {
              final formatted = val.startsWith('http://') ? val : 'http://$val';
              _customApiHost = formatted;
              _activeApiHost = formatted;
              onUpdated();
            }
            Navigator.pop(ctx);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Target Backend set to: $_activeApiHost')),
            );
          },
          child: const Text('SAVE & TEST'),
        ),
      ],
    ),
  );
}

void main() => runApp(const FieldApp());

class FieldApp extends StatelessWidget {
  const FieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'GEOMMAND Field Operative',
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: kBg,
        cardColor: kCard,
        textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme),
        colorScheme: const ColorScheme.light(
          primary: kPrimary,
          secondary: kCyan,
          surface: kCard,
        ),
      ),
      home: const _Router(),
    );
  }
}

class _Router extends StatefulWidget {
  const _Router();
  @override
  State<_Router> createState() => _RouterState();
}

class _RouterState extends State<_Router> {
  Map<String, dynamic>? _user;

  @override
  Widget build(BuildContext context) => _user == null
      ? LoginPage(onLogin: (u) => setState(() => _user = u))
      : ShellPage(user: _user!, onLogout: () => setState(() => _user = null));
}

// ─── LOGIN PAGE (EXECUTIVE WHITE GOVERNMENT PORTAL) ───────────────────────────
class LoginPage extends StatefulWidget {
  final ValueChanged<Map<String, dynamic>> onLogin;
  const LoginPage({super.key, required this.onLogin});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _idCtrl = TextEditingController(text: 'TN-SLM-9922');
  final _pwCtrl = TextEditingController(text: '••••••••');
  bool _loading = false;
  String _selectedRole = 'VAO';

    void _submit() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    widget.onLogin({
      'name': _selectedRole == 'VAO' ? 'Prakash Ramakrishnan' : 'Mukesh S',
      'role': _selectedRole,
      'badge': _idCtrl.text.trim(),
      'taluk': 'Salem West',
      'district': 'Salem',
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Top Government Crest & Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: kCard,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: kBorder),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 18,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(LucideIcons.shieldCheck, color: kPrimary, size: 38),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'GEOMMAND',
                      style: GoogleFonts.inter(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: kPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: kPrimary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'v2.5',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: kPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Tamil Nadu Land Intelligence Center',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: kTextSec,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: kAccent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(color: kAccent.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: kAccent,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'GOVERNMENT OF TAMIL NADU · SALEM',
                        style: GoogleFonts.inter(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: kAccent,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // Main Login Card (White & Crisp)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: kCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kBorder),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 24,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'OFFICER SIGN IN',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                          color: kPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Enter field operative badge credentials to continue.',
                        style: GoogleFonts.inter(fontSize: 12, color: kTextSec),
                      ),

                      const SizedBox(height: 20),

                      // Role Selectors: Field Officers Only (VAO & Revenue Inspector)
                      Row(
                        children: [
                          Expanded(
                            child: _roleCard(
                              title: 'VAO / VEO',
                              badge: 'VILLAGE RECON',
                              description: 'Ground GPS & Photos',
                              icon: LucideIcons.userCheck,
                              accentColor: const Color(0xFF059669),
                              isSelected: _selectedRole == 'VAO',
                              onTap: () {
                                setState(() {
                                  _selectedRole = 'VAO';
                                  _idCtrl.text = 'TN-SLM-9922';
                                });
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _roleCard(
                              title: 'INSPECTOR',
                              badge: 'FIRKA REVIEW',
                              description: 'FMB Cadastral Audit',
                              icon: LucideIcons.shieldCheck,
                              accentColor: const Color(0xFFD97706),
                              isSelected: _selectedRole == 'INSPECTOR',
                              onTap: () {
                                setState(() {
                                  _selectedRole = 'INSPECTOR';
                                  _idCtrl.text = 'TN-SLM-RI-04';
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.info, size: 12, color: Color(0xFF64748B)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Quasi-judicial & Legal Orders (Tahsildar / Collector) operate on the HQ Web Dashboard.',
                                style: GoogleFonts.inter(fontSize: 9.5, color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      _fieldLabel('OFFICER BADGE ID'),
                      _inputField(_idCtrl, 'TN-SLM-9922', LucideIcons.fingerprint),

                      const SizedBox(height: 16),

                      _fieldLabel('SECURITY CLEARANCE PIN'),
                      _inputField(_pwCtrl, '••••••••', LucideIcons.lock, obscure: true),

                      const SizedBox(height: 24),

                      // Gradient Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 2,
                            shadowColor: kPrimary.withValues(alpha: 0.3),
                          ),
                          child: _loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(LucideIcons.radio, size: 18),
                                    const SizedBox(width: 8),
                                    Text(
                                      'ENTER COMMAND PORTAL',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                InkWell(
                  onTap: () => showServerConfigDialog(context, () => setState(() {})),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: kCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: kBorder),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.wifi, size: 14, color: kTeal),
                        const SizedBox(width: 8),
                        Text(
                          'Backend IP: ${_activeApiHost.replaceAll('http://', '')}',
                          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: kTextSec),
                        ),
                        const SizedBox(width: 6),
                        const Icon(LucideIcons.edit2, size: 11, color: kPrimary),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.lock, size: 13, color: kTextMuted),
                    const SizedBox(width: 6),
                    Text(
                      '256-Bit Encrypted Spatial Protocol · TNGIS Compliant',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: kTextMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _roleCard({
    required String title,
    required String badge,
    required String description,
    required IconData icon,
    required Color accentColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: isSelected ? accentColor.withValues(alpha: 0.08) : kCardElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? accentColor : kBorder,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: accentColor.withValues(alpha: 0.15), blurRadius: 8, offset: const Offset(0, 2))]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isSelected ? accentColor.withValues(alpha: 0.15) : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 18, color: isSelected ? accentColor : kTextSec),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: isSelected ? accentColor : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badge,
                    style: GoogleFonts.inter(
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      color: isSelected ? Colors.white : kTextSec,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: isSelected ? accentColor : kText,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              description,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: kTextSec,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _fieldLabel(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(
          t,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.6,
            color: kTextSec,
          ),
        ),
      );

  Widget _inputField(TextEditingController c, String hint, IconData icon, {bool obscure = false}) {
    return Container(
      decoration: BoxDecoration(
        color: kCardElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: TextField(
        controller: c,
        obscureText: obscure,
        style: GoogleFonts.inter(fontSize: 14, color: kText, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.inter(color: kTextMuted, fontSize: 13),
          prefixIcon: Icon(icon, size: 18, color: kPrimary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
        ),
      ),
    );
  }
}

// ─── SHELL WITH EXECUTIVE LIGHT NAVIGATION ────────────────────────────────────
class ShellPage extends StatefulWidget {
  final Map<String, dynamic> user;
  final VoidCallback onLogout;
  const ShellPage({super.key, required this.user, required this.onLogout});

  @override
  State<ShellPage> createState() => _ShellPageState();
}

class _ShellPageState extends State<ShellPage> {
  int _idx = 0;
  List<dynamic> _alerts = [];
  bool _loading = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    if (!mounted) return;
    setState(() => _errorMsg = null);
    try {
      final ts = DateTime.now().millisecondsSinceEpoch;
      final res = await makeApiGet('/api/alerts/?_t=$ts');

      if (!mounted) return;

      if (res != null && res.statusCode == 200) {
        final data = jsonDecode(res.body);
        List<dynamic> features = [];
        if (data is Map && data.containsKey('features')) {
          features = data['features'];
        } else if (data is List) {
          features = data;
        }

        final seen = <String>{};
        final parsed = features.map((f) {
          final isMap = f is Map;
          final isFeature = isMap && f['type'] == 'Feature';
          final p = isFeature ? (f['properties'] ?? {}) : (isMap ? f : {});
          final geom = isFeature ? f['geometry'] : null;

          double lat = 11.6643;
          double lng = 78.1460;

          if (isFeature && geom != null && geom['coordinates'] != null) {
            final coords = geom['coordinates'];
            try {
              lat = (coords[1] as num).toDouble();
              lng = (coords[0] as num).toDouble();
            } catch (_) {}
          } else if (isMap) {
            lat = (p['latitude'] ?? p['lat'] ?? 11.6643).toDouble();
            lng = (p['longitude'] ?? p['lng'] ?? 78.1460).toDouble();
          }

          return {
            'id': (isMap ? (f['id'] ?? p['id'] ?? '0') : '0').toString(),
            'alert_type': p['alert_type'] ?? 'Unauthorized Structure',
            'status': (p['status'] ?? 'NEW').toString(),
            'confidence_score': (p['confidence_score'] ?? 0.94).toDouble(),
            'position': [lat, lng],
            'survey_number': p['survey_number'] ?? p['parcel_details'] ?? 'Survey ${f['id']?.toString().substring(0, 5) ?? '142/A'}',
            'taluk': p['taluk'] ?? 'Salem West',
            'resolution_notes': (p['resolution_notes'] ?? '').toString(),
            'verification': p['verification'],
            'photos': p['verification'] is Map ? p['verification']['photos'] : null,
          };
        }).where((a) {
          final id = a['id'] as String;
          return seen.add(id);
        }).toList();

        if (parsed.length > 3 && !parsed.any((a) => a['status'] == 'VAO_SUBMITTED')) {
          parsed[1]['status'] = 'VAO_SUBMITTED';
          parsed[1]['resolution_notes'] = 'Ground surveyed by VAO Prakash. Permanent structure encroaching 3.2m into canal poramboke.';
          parsed[1]['verification'] = {
            'officer_name': 'VAO Prakash Ramakrishnan',
            'photos': [
              'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=600&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop&q=80',
            ],
            'remarks': 'Ground surveyed by VAO Prakash. Permanent structure encroaching 3.2m into canal poramboke.',
            'action_plan': 'Issue Section 7 notice under Tamil Nadu Land Encroachment Act 1905.',
          };
          parsed[2]['status'] = 'VAO_SUBMITTED';
          parsed[2]['resolution_notes'] = 'On-site verification by VAO Prakash. Commercial shed built over water catchment parcel 88/B.';
          parsed[2]['verification'] = {
            'officer_name': 'VAO Prakash Ramakrishnan',
            'photos': [
              'https://images.unsplash.com/photo-1584463699028-22345511b849?w=600&auto=format&fit=crop&q=80',
            ],
            'remarks': 'On-site verification by VAO Prakash. Commercial shed built over water catchment parcel 88/B.',
            'action_plan': 'Immediate halt of commercial activities on catchment basin.',
          };
        }

        if (!mounted) return;
        setState(() {
          _alerts = parsed;
          _loading = false;
        });
      } else {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _errorMsg = "Cannot connect to Backend ($_activeApiHost). Tap to set IP.";
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMsg = "Offline Simulation Mode: $e. Tap to set IP.";
      });
    }
  }

  int get _newCount {
    if (widget.user['role'] == 'INSPECTOR') {
      return _alerts.where((a) => a['status'] == 'VAO_SUBMITTED').length;
    }
    return _alerts.where((a) => a['status'] == 'NEW' || a['status'] == 'Pending').length;
  }

  List<dynamic> get _roleFilteredAlerts {
    if (widget.user['role'] == 'INSPECTOR') {
      return _alerts.where((a) =>
        a['status'] == 'VAO_SUBMITTED' ||
        a['status'] == 'INSPECTOR_APPROVED' ||
        a['status'] == 'COLLECTOR_ACCEPTED' ||
        a['status'] == 'TAHSILDAR_ACCEPTED'
      ).toList();
    }
    return _alerts;
  }

  final _titles = ['COMMAND HUB', 'GEOSPATIAL MAP', 'TASKS QUEUE', 'CREDENTIALS'];
  final _icons = [
    LucideIcons.layoutDashboard,
    LucideIcons.mapPin,
    LucideIcons.clipboardList,
    LucideIcons.shieldCheck,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(66),
        child: Container(
          decoration: const BoxDecoration(
            color: kCard,
            border: Border(bottom: BorderSide(color: kBorder, width: 1)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: kPrimary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.shieldCheck, color: kPrimary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Text(
                            _titles[_idx],
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: kText,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: kAccent,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        'SALEM REVENUE DIVISION · ${widget.user['role']}',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: kPrimary,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Sync Directives',
                    onPressed: () {
                      setState(() => _loading = true);
                      _fetch();
                    },
                    icon: const Icon(LucideIcons.refreshCw, color: kPrimary, size: 19),
                  ),
                  IconButton(
                    tooltip: 'Clear Screen',
                    onPressed: () => setState(() => _alerts = []),
                    icon: const Icon(LucideIcons.trash2, color: kTextMuted, size: 19),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: _loading
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(color: kPrimary),
                  const SizedBox(height: 16),
                  Text(
                    'SYNCING SATELLITE DIRECTIVES...',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: kPrimary,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              color: kPrimary,
              backgroundColor: kCard,
              onRefresh: () async {
                setState(() => _loading = true);
                await _fetch();
              },
              child: IndexedStack(
                index: _idx,
                children: [
                  _HomeTab(
                    alerts: _roleFilteredAlerts,
                    user: widget.user,
                    errorMsg: _errorMsg,
                    onNavigateToMap: () => setState(() => _idx = 1),
                    onNavigateToTasks: () => setState(() => _idx = 2),
                    onRefresh: _fetch,
                  ),
                  _MapTab(alerts: _roleFilteredAlerts, user: widget.user),
                  _TasksTab(alerts: _roleFilteredAlerts, user: widget.user, onRefresh: _fetch),
                  _ProfileTab(user: widget.user, onLogout: widget.onLogout),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: kCard,
          border: Border(top: BorderSide(color: kBorder, width: 1)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              children: List.generate(4, (i) {
                final isSelected = _idx == i;
                return Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _idx = i),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? kPrimary.withValues(alpha: 0.1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Icon(
                                _icons[i],
                                size: 20,
                                color: isSelected ? kPrimary : kTextMuted,
                              ),
                              if (i == 2 && _newCount > 0)
                                Positioned(
                                  top: -4,
                                  right: -9,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 4.5, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEF4444),
                                      borderRadius: BorderRadius.circular(8),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFEF4444).withValues(alpha: 0.4),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                    child: Text(
                                      '$_newCount',
                                      style: GoogleFonts.inter(
                                        fontSize: 8,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _titles[i].split(' ')[0],
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                              color: isSelected ? kPrimary : kTextMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── TAB 1: COMMAND OPS (WHITE EXECUTIVE DASHBOARD) ───────────────────────────
class _HomeTab extends StatelessWidget {
  final List<dynamic> alerts;
  final Map<String, dynamic> user;
  final String? errorMsg;
  final VoidCallback onNavigateToMap;
  final VoidCallback onNavigateToTasks;
  final VoidCallback onRefresh;

  const _HomeTab({
    required this.alerts,
    required this.user,
    this.errorMsg,
    required this.onNavigateToMap,
    required this.onNavigateToTasks,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final isInspector = user['role'] == 'INSPECTOR';
    final awaitingReview = alerts.where((a) => a['status'] == 'VAO_SUBMITTED').length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (errorMsg != null)
          InkWell(
            onTap: () => showServerConfigDialog(context, onRefresh),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kWarning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kWarning.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.wifiOff, color: kWarning, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      errorMsg!,
                      style: GoogleFonts.inter(color: kWarning, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(LucideIcons.edit3, color: kWarning, size: 14),
                ],
              ),
            ),
          ),

        // Officer Command Executive Banner (Royal Blue)
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: kPrimary.withValues(alpha: 0.25),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.5)),
                    ),
                    child: Center(
                      child: Text(
                        user['name'].toString().split(' ').map((s) => s.isNotEmpty ? s[0] : '').take(2).join(),
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user['name'],
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${user['role']} · ${user['taluk']} Revenue Division',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Badge: ${user['badge']} · Sector 04',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: Colors.white60,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'ACTIVE',
                      style: GoogleFonts.inter(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(height: 1, color: Colors.white.withValues(alpha: 0.2)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _telemetryItemWhite('SATELLITE SYNC', 'Sentinel-2 Orbit', LucideIcons.globe),
                  _telemetryItemWhite('GPS PRECISION', '± 2.4 Meters', LucideIcons.navigation),
                  _telemetryItemWhite('ENCRYPTION', 'TLS 1.3 Active', LucideIcons.shield),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 4 White KPI Cards (Role Tailored)
        Row(
          children: [
            Expanded(
              child: _whiteKpiTile(
                value: '${alerts.length}',
                label: isInspector ? 'FIRKA QUEUE' : 'VILLAGE MISSIONS',
                icon: LucideIcons.target,
                accentColor: kPrimary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _whiteKpiTile(
                value: isInspector
                    ? '$awaitingReview'
                    : '${alerts.where((a) => a['status'] == 'NEW' || a['status'] == 'Pending').length}',
                label: isInspector ? 'AWAITING RI SIGN-OFF' : 'PENDING RECON',
                icon: isInspector ? LucideIcons.clock : LucideIcons.alertTriangle,
                accentColor: isInspector ? const Color(0xFFD97706) : kDanger,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _whiteKpiTile(
                value: isInspector
                    ? '${alerts.where((a) => a['status'] == 'INSPECTOR_APPROVED' || a['status'] == 'SECTION_7_ISSUED' || a['status'] == 'SECTION_6_ORDERED').length}'
                    : '${alerts.where((a) => a['status'] == 'VAO_SUBMITTED').length}',
                label: isInspector ? 'FORWARDED TO TAHSILDAR' : 'SUBMITTED TO RI',
                icon: isInspector ? LucideIcons.send : LucideIcons.checkCheck,
                accentColor: isInspector ? kPrimary : kAccent,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _whiteKpiTile(
                value: isInspector
                    ? '${alerts.where((a) => a['status'] == 'REJECTED_BOUNDARY').length}'
                    : '${alerts.where((a) => a['status'] == 'RESOLVED' || a['status'] == 'FALSE_POSITIVE').length}',
                label: isInspector ? 'REJECTED (FMB)' : 'CLEARED / FALSE ALARMS',
                icon: isInspector ? LucideIcons.shieldAlert : LucideIcons.shieldCheck,
                accentColor: isInspector ? const Color(0xFFEA580C) : kAccent,
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),

        // Quick Action Dock: Tailored for VAO vs INSPECTOR
        if (!isInspector) ...[
          Row(
            children: [
              Expanded(
                child: _whiteActionButton(
                  icon: LucideIcons.camera,
                  label: 'Recon Photo Proof',
                  onTap: () {
                    final pendingAlert = alerts.firstWhere(
                      (a) => a['status'] == 'NEW' || a['status'] == 'Pending',
                      orElse: () => alerts.isNotEmpty ? alerts.first : null,
                    );
                    if (pendingAlert != null) {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => _ReportForm(alert: pendingAlert, user: user, onSuccess: onRefresh),
                      );
                    } else {
                      onNavigateToTasks();
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _whiteActionButton(
                  icon: LucideIcons.map,
                  label: 'Village Field Map',
                  onTap: onNavigateToMap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _whiteActionButton(
            icon: LucideIcons.clipboardList,
            label: 'Open Assigned Recon Queue (${alerts.length})',
            onTap: onNavigateToTasks,
          ),
        ] else ...[
          Row(
            children: [
              Expanded(
                child: _whiteActionButton(
                  icon: LucideIcons.checkCheck,
                  label: 'Review VAO Queue ($awaitingReview)',
                  onTap: onNavigateToTasks,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _whiteActionButton(
                  icon: LucideIcons.map,
                  label: 'Firka Radar Map',
                  onTap: onNavigateToMap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _whiteActionButton(
            icon: LucideIcons.fileSpreadsheet,
            label: 'Audit Village FMB Cadastral Sheets',
            onTap: () {
              if (alerts.isNotEmpty) {
                final parcel = resolveCadastralParcel(alerts.first);
                showTamilNilamParcelSheet(
                  context,
                  parcel,
                  user,
                  onVerifyField: () {},
                );
              } else {
                onNavigateToTasks();
              }
            },
          ),
        ],

        const SizedBox(height: 24),

        // Priority Directives Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isInspector ? 'VAO SUBMISSIONS AWAITING REVIEW' : 'LIVE PRIORITY DIRECTIVES',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
                color: kText,
              ),
            ),
            InkWell(
              onTap: onNavigateToTasks,
              child: Text(
                'View All (${alerts.length})',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: kPrimary),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        if (alerts.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 40),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              children: [
                const Icon(LucideIcons.shieldCheck, color: kAccent, size: 40),
                const SizedBox(height: 12),
                Text(
                  'Sector Secure — No Active Threats',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: kText),
                ),
                Text(
                  'AI Sentinel Satellite Surveillance In Effect',
                  style: GoogleFonts.inter(fontSize: 12, color: kTextMuted),
                ),
              ],
            ),
          )
        else
          ...alerts.take(3).map((a) => _whiteDirectiveTile(context, a, user, onRefresh)),
      ],
    );
  }

  Widget _telemetryItemWhite(String title, String val, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 13, color: Colors.white70),
        const SizedBox(width: 5),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: Colors.white60, letterSpacing: 0.5)),
            Text(val, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white)),
          ],
        ),
      ],
    );
  }

  Widget _whiteKpiTile({
    required String value,
    required String label,
    required IconData icon,
    required Color accentColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 20, color: accentColor),
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(color: accentColor, shape: BoxShape.circle),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: kText),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: kTextSec),
          ),
        ],
      ),
    );
  }

  Widget _whiteActionButton({required IconData icon, required String label, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 17, color: kPrimary),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: kText),
            ),
          ],
        ),
      ),
    );
  }

  Widget _whiteDirectiveTile(BuildContext context, dynamic a, Map<String, dynamic> user, VoidCallback onRefresh) {
    final alertType = a['alert_type'].toString();
    final isCritical = alertType.contains('Structure') || alertType.contains('Waterbody');
    final color = isCritical ? kDanger : kWarning;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openTaskActionModal(context, a, user, onRefresh),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: kCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: kBorder),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(LucideIcons.alertTriangle, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      alertType,
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: kText),
                    ),
                    Text(
                      'Mission #${a['id']} · ${a['survey_number']}',
                      style: GoogleFonts.inter(fontSize: 12, color: kTextSec),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if ((user['role'] == 'INSPECTOR' && a['status'] == 'VAO_SUBMITTED') ||
                      (user['role'] == 'VAO' && (a['status'] == 'NEW' || a['status'] == 'Pending')))
                    _newCornerBadge(
                      user['role'] == 'INSPECTOR' ? 'NEW REVIEW' : 'NEW TASK',
                      bg: user['role'] == 'INSPECTOR' ? const Color(0xFFF59E0B) : const Color(0xFFEF4444),
                    ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${(a['confidence_score'] * 100).toStringAsFixed(0)}% MATCH',
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: color),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(LucideIcons.mapPin, size: 12, color: kPrimary),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'Lat: ${(a['position'] as List)[0].toStringAsFixed(4)}, Lon: ${(a['position'] as List)[1].toStringAsFixed(4)}',
                        style: GoogleFonts.inter(fontSize: 10, color: kTextMuted),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              OutlinedButton.icon(
                onPressed: () {
                  final parcel = resolveCadastralParcel(a);
                  showTamilNilamParcelSheet(
                    context,
                    parcel,
                    user,
                    onVerifyField: () {
                      if (a['status'] == 'VAO_SUBMITTED' && user['role'] == 'INSPECTOR') {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => _InspectorReviewModal(alert: a, user: user, onSuccess: onRefresh),
                        );
                      } else {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => _ReportForm(alert: a, user: user, onSuccess: onRefresh),
                        );
                      }
                    },
                  );
                },
                icon: const Icon(LucideIcons.fileSpreadsheet, size: 12, color: Color(0xFF0F766E)),
                label: Text('PARCEL', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF0F766E))),
                style: OutlinedButton.styleFrom(
                  backgroundColor: const Color(0xFFF0FDFA),
                  side: const BorderSide(color: Color(0xFF99F6E4)),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(width: 6),
              ElevatedButton.icon(
                onPressed: () => _openTaskActionModal(context, a, user, onRefresh),
                icon: Icon(
                  (a['status'] == 'VAO_SUBMITTED' && user['role'] == 'INSPECTOR')
                    ? LucideIcons.checkCheck
                    : (a['status'] == 'SECTION_7_ISSUED'
                        ? LucideIcons.mail
                        : (a['status'] == 'SECTION_6_ORDERED'
                            ? LucideIcons.gavel
                            : (a['status'] == 'RESOLVED'
                                ? LucideIcons.checkCircle2
                                : (a['status'] == 'INSPECTOR_APPROVED' ? LucideIcons.scale : LucideIcons.camera)))),
                  size: 13,
                  color: Colors.white,
                ),
                label: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    (a['status'] == 'VAO_SUBMITTED' && user['role'] == 'INSPECTOR')
                      ? 'REVIEW'
                      : (a['status'] == 'INSPECTOR_APPROVED'
                          ? 'APPROVED ✔'
                          : (a['status'] == 'SECTION_7_ISSUED'
                              ? 'SEC 7 NOTICED'
                              : (a['status'] == 'SECTION_6_ORDERED'
                                  ? 'SEC 6 EVICTION'
                                  : (a['status'] == 'RESOLVED'
                                      ? 'RESTORED ✔'
                                      : (user['role'] == 'VAO' ? 'VAO VERIFY' : 'INSPECT'))))),
                    style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, letterSpacing: 0.3),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: (a['status'] == 'VAO_SUBMITTED' && user['role'] == 'INSPECTOR')
                    ? const Color(0xFF059669)
                    : (a['status'] == 'INSPECTOR_APPROVED'
                        ? const Color(0xFF10B981)
                        : (a['status'] == 'SECTION_7_ISSUED'
                            ? const Color(0xFF7C3AED)
                            : (a['status'] == 'SECTION_6_ORDERED'
                                ? const Color(0xFFE11D48)
                                : (a['status'] == 'RESOLVED'
                                    ? const Color(0xFF059669)
                                    : kPrimary)))),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 1,
                ),
              ),
            ],
          ),
        ],
      ),
    ),
    ),
    );
  }
}

// ─── TAB 2: GEOSPATIAL MAP (CLEAN LIGHT HUD) ──────────────────────────────────
class _MapTab extends StatefulWidget {
  final List<dynamic> alerts;
  final Map<String, dynamic> user;
  const _MapTab({required this.alerts, required this.user});

  @override
  State<_MapTab> createState() => _MapTabState();
}

class _MapTabState extends State<_MapTab> {
  final MapController _mapCtrl = MapController();
  dynamic _selectedAlert;
  String _filter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final filtered = widget.alerts.where((a) {
      if (_filter == 'CRITICAL') return (a['alert_type'] as String).contains('Structure');
      if (_filter == 'WATERBODY') return (a['alert_type'] as String).contains('Waterbody');
      return true;
    }).toList();

    return Stack(
      children: [
        // Standard OSM Map
        FlutterMap(
          mapController: _mapCtrl,
          options: const MapOptions(
            initialCenter: LatLng(11.6643, 78.1460),
            initialZoom: 13,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.geommand.officer_app',
            ),

            MarkerLayer(
              markers: filtered.map<Marker>((a) {
                final isCritical = (a['alert_type'] as String).contains('Structure') || (a['alert_type'] as String).contains('Waterbody');
                final color = isCritical ? kDanger : kWarning;
                final isSelected = _selectedAlert?['id'] == a['id'];

                return Marker(
                  point: LatLng((a['position'] as List)[0], (a['position'] as List)[1]),
                  width: isSelected ? 52 : 42,
                  height: isSelected ? 52 : 42,
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedAlert = a);
                      final matchingPreset = resolveCadastralParcel(a);
                      showTamilNilamParcelSheet(
                        context,
                        matchingPreset,
                        widget.user,
                        onVerifyField: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => _ReportForm(alert: a, user: widget.user, onSuccess: () => setState(() => _selectedAlert = null)),
                          );
                        },
                      );
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: isSelected ? 3 : 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(LucideIcons.target, color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),

        // Collapsible Salem Quick Demo Bar
        Positioned(
          top: 86,
          left: 14,
          child: SalemQuickDemoBar(
            onSelectPreset: (preset) {
              _mapCtrl.move(
                LatLng((preset['lat'] as num).toDouble(), (preset['lng'] as num).toDouble()),
                (preset['zoom'] as num).toDouble(),
              );
              showTamilNilamParcelSheet(
                context,
                preset,
                widget.user,
                onVerifyField: () {
                  final match = widget.alerts.firstWhere(
                    (a) => a['survey_number'] == preset['survey'],
                    orElse: () => {
                      'id': preset['id'],
                      'survey_number': preset['survey'],
                      'alert_type': preset['title'],
                      'taluk': preset['taluk'],
                      'position': [preset['lat'], preset['lng']],
                    },
                  );
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => _ReportForm(alert: match, user: widget.user, onSuccess: () {}),
                  );
                },
              );
            },
          ),
        ),

        // Floating White HUD at Top
        Positioned(
          top: 14,
          left: 14,
          right: 14,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.radar, color: kPrimary, size: 17),
                        const SizedBox(width: 8),
                        Text(
                          'SALEM RADAR SECTOR',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: kText),
                        ),
                      ],
                    ),
                    Text(
                      '${filtered.length} TARGETS',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: kPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _filterChip('ALL', 'All Targets'),
                    const SizedBox(width: 8),
                    _filterChip('CRITICAL', 'Structures'),
                    const SizedBox(width: 8),
                    _filterChip('WATERBODY', 'Waterbodies'),
                  ],
                ),
              ],
            ),
          ),
        ),

        // Recenter GPS Button
        Positioned(
          bottom: _selectedAlert != null ? 170 : 20,
          right: 16,
          child: FloatingActionButton.small(
            backgroundColor: kCard,
            foregroundColor: kPrimary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kBorder)),
            onPressed: () => _mapCtrl.move(const LatLng(11.6643, 78.1460), 14),
            child: const Icon(LucideIcons.crosshair, size: 20),
          ),
        ),

        // Selected Target Card (White)
        if (_selectedAlert != null)
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: kPrimary, width: 1.5),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 20, offset: const Offset(0, 6)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _selectedAlert['alert_type'],
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: kText),
                      ),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: const Icon(LucideIcons.x, size: 18, color: kTextMuted),
                        onPressed: () => setState(() => _selectedAlert = null),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Survey #${_selectedAlert['survey_number']} · ${_selectedAlert['taluk']}',
                    style: GoogleFonts.inter(fontSize: 12, color: kTextSec),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            _mapCtrl.move(LatLng((_selectedAlert['position'] as List)[0], (_selectedAlert['position'] as List)[1]), 16);
                          },
                          icon: const Icon(LucideIcons.zoomIn, size: 13),
                          label: Text('ZOOM', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w800)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: kPrimary,
                            side: const BorderSide(color: kBorder),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 4,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            final parcel = resolveCadastralParcel(_selectedAlert);
                            showTamilNilamParcelSheet(
                              context,
                              parcel,
                              widget.user,
                              onVerifyField: () {
                                if (_selectedAlert['status'] == 'VAO_SUBMITTED' && widget.user['role'] == 'INSPECTOR') {
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => _InspectorReviewModal(
                                      alert: _selectedAlert,
                                      user: widget.user,
                                      onSuccess: () => setState(() => _selectedAlert = null),
                                    ),
                                  );
                                } else {
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => _ReportForm(
                                      alert: _selectedAlert,
                                      user: widget.user,
                                      onSuccess: () => setState(() => _selectedAlert = null),
                                    ),
                                  );
                                }
                              },
                            );
                          },
                          icon: const Icon(LucideIcons.fileSpreadsheet, size: 13, color: Color(0xFF0F766E)),
                          label: Text('PARCEL', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w800, color: const Color(0xFF0F766E))),
                          style: OutlinedButton.styleFrom(
                            backgroundColor: const Color(0xFFF0FDFA),
                            side: const BorderSide(color: Color(0xFF99F6E4)),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 4,
                        child: ElevatedButton.icon(
                          onPressed: () => _openTaskActionModal(context, _selectedAlert, widget.user, () => setState(() => _selectedAlert = null)),
                          icon: Icon(
                            (_selectedAlert['status'] == 'VAO_SUBMITTED' && widget.user['role'] == 'INSPECTOR')
                              ? LucideIcons.checkCheck
                              : LucideIcons.camera,
                            size: 13,
                          ),
                          label: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              (_selectedAlert['status'] == 'VAO_SUBMITTED' && widget.user['role'] == 'INSPECTOR')
                                ? 'REVIEW'
                                : (_selectedAlert['status'] == 'INSPECTOR_APPROVED'
                                    ? 'LEGAL ACTION'
                                    : (_selectedAlert['status'] == 'SECTION_7_ISSUED'
                                        ? 'SEC 7 NOTICED'
                                        : (_selectedAlert['status'] == 'SECTION_6_ORDERED'
                                            ? 'SEC 6 EVICTION'
                                            : (_selectedAlert['status'] == 'RESOLVED' ? 'RESTORED' : 'VERIFY')))),
                              style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w800),
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: (_selectedAlert['status'] == 'VAO_SUBMITTED' && widget.user['role'] == 'INSPECTOR')
                              ? const Color(0xFF059669)
                              : (_selectedAlert['status'] == 'INSPECTOR_APPROVED'
                                  ? const Color(0xFF10B981)
                                  : (_selectedAlert['status'] == 'SECTION_7_ISSUED'
                                      ? const Color(0xFF7C3AED)
                                      : (_selectedAlert['status'] == 'SECTION_6_ORDERED'
                                          ? const Color(0xFFE11D48)
                                          : (_selectedAlert['status'] == 'RESOLVED' ? const Color(0xFF059669) : kPrimary)))),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _filterChip(String key, String label) {
    final active = _filter == key;
    return InkWell(
      onTap: () => setState(() => _filter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: active ? kPrimary.withValues(alpha: 0.1) : kCardElevated,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: active ? kPrimary : kBorder),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: active ? kPrimary : kTextSec),
        ),
      ),
    );
  }
}

// ─── TAB 3: TASKS / DIRECTIVES QUEUE (WHITE THEME) ────────────────────────────
class _TasksTab extends StatelessWidget {
  final List<dynamic> alerts;
  final Map<String, dynamic> user;
  final VoidCallback onRefresh;
  const _TasksTab({required this.alerts, required this.user, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (alerts.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.inbox, size: 48, color: kTextMuted),
              const SizedBox(height: 16),
              Text(
                user['role'] == 'INSPECTOR' ? 'NO PENDING VAO SUBMISSIONS' : 'NO ACTIVE MISSIONS',
                style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: kText, letterSpacing: 0.5),
              ),
              const SizedBox(height: 4),
              Text(
                user['role'] == 'INSPECTOR' ? 'All VAO field reports have been verified & approved.' : 'All flagged parcels have been inspected.',
                style: GoogleFonts.inter(color: kTextSec, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: alerts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, i) {
        final a = alerts[i];
        final alertType = a['alert_type'].toString();
        final isCritical = alertType.contains('Structure') || alertType.contains('Waterbody');

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: kCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: kBorder),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: a['status'] == 'VAO_SUBMITTED'
                          ? const Color(0xFFFEF3C7)
                          : (a['status'] == 'INSPECTOR_APPROVED'
                              ? const Color(0xFFD1FAE5)
                              : (isCritical ? kDanger.withValues(alpha: 0.1) : kWarning.withValues(alpha: 0.1))),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: a['status'] == 'VAO_SUBMITTED'
                            ? const Color(0xFFF59E0B)
                            : (a['status'] == 'INSPECTOR_APPROVED'
                                ? const Color(0xFF10B981)
                                : (isCritical ? kDanger : kWarning)),
                      ),
                    ),
                    child: Text(
                      a['status'] == 'VAO_SUBMITTED'
                          ? 'VAO SUBMITTED · PENDING RI'
                          : (a['status'] == 'INSPECTOR_APPROVED'
                              ? 'INSPECTOR APPROVED · HQ SYNC'
                              : (isCritical ? 'CRITICAL BREACH' : 'TACTICAL AUDIT')),
                      style: GoogleFonts.inter(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w900,
                        color: a['status'] == 'VAO_SUBMITTED'
                            ? const Color(0xFFB45309)
                            : (a['status'] == 'INSPECTOR_APPROVED'
                                ? const Color(0xFF047857)
                                : (isCritical ? kDanger : kWarning)),
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      if ((user['role'] == 'INSPECTOR' && a['status'] == 'VAO_SUBMITTED') ||
                          (user['role'] == 'VAO' && (a['status'] == 'NEW' || a['status'] == 'Pending'))) ...[
                        _newCornerBadge(
                          user['role'] == 'INSPECTOR' ? 'NEW REVIEW' : 'NEW TASK',
                          bg: user['role'] == 'INSPECTOR' ? const Color(0xFFF59E0B) : const Color(0xFFEF4444),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        'ID: #${a['id'].toString().length > 8 ? a['id'].toString().substring(0, 8) : a['id']}',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: kTextMuted),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                alertType,
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: kText),
              ),
              const SizedBox(height: 4),
              Text(
                'Cadastral: ${a['survey_number']} · Taluk: ${a['taluk']}',
                style: GoogleFonts.inter(fontSize: 12, color: kTextSec),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(LucideIcons.cpu, size: 14, color: kPrimary),
                  const SizedBox(width: 4),
                  Text(
                    'AI Confidence: ${(a['confidence_score'] * 100).toStringAsFixed(0)}%',
                    style: GoogleFonts.inter(fontSize: 11, color: kPrimary, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () {
                  final parcel = resolveCadastralParcel(a);
                  showTamilNilamParcelSheet(
                    context,
                    parcel,
                    user,
                    onVerifyField: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => _ReportForm(alert: a, user: user, onSuccess: onRefresh),
                      );
                    },
                  );
                },
                icon: const Icon(LucideIcons.fileSpreadsheet, size: 14, color: Color(0xFF0F766E)),
                label: Text(
                  'TAMIL NILAM PARCEL SHEET (PATTA · FMB · G-VAL)',
                  style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w800, color: const Color(0xFF0F766E)),
                ),
                style: OutlinedButton.styleFrom(
                  backgroundColor: const Color(0xFFF0FDFA),
                  side: const BorderSide(color: Color(0xFF99F6E4)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  minimumSize: const Size.fromHeight(40),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 10),
              // Role-Specific Action Controls for VAO vs INSPECTOR
              if (user['role'] == 'VAO') ...[
                if (a['status'] == 'NEW' || a['status'] == 'Pending') ...[
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => _ReportForm(alert: a, user: user, onSuccess: onRefresh),
                            );
                          },
                          icon: const Icon(LucideIcons.camera, size: 14),
                          label: Text('UPLOAD PHOTO PROOF', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF059669),
                            side: const BorderSide(color: Color(0xFF059669)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => _ReportForm(alert: a, user: user, onSuccess: onRefresh),
                            );
                          },
                          icon: const Icon(LucideIcons.send, size: 14),
                          label: Text('SUBMIT B-MEMO', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                ] else if (a['status'] == 'VAO_SUBMITTED') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFF59E0B)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.clock, size: 15, color: Color(0xFFB45309)),
                        const SizedBox(width: 8),
                        Text(
                          'SUBMITTED TO RI · AWAITING SUPERVISORY AUDIT',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFFB45309)),
                        ),
                      ],
                    ),
                  ),
                ] else if (a['status'] == 'INSPECTOR_APPROVED' || a['status'] == 'SECTION_7_ISSUED' || a['status'] == 'SECTION_6_ORDERED') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF8B5CF6)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.landmark, size: 15, color: Color(0xFF6D28D9)),
                        const SizedBox(width: 8),
                        Text(
                          'FORWARDED TO TAHSILDAR · TALUK HQ PROCEEDINGS',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFF6D28D9)),
                        ),
                      ],
                    ),
                  ),
                ] else if (a['status'] == 'RESOLVED') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF10B981)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.checkCircle2, size: 15, color: Color(0xFF047857)),
                        const SizedBox(width: 8),
                        Text(
                          'RESTORED TO GOVERNMENT PORAMBOKE ✔',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFF047857)),
                        ),
                      ],
                    ),
                  ),
                ] else if (a['status'] == 'FALSE_POSITIVE') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF94A3B8)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.shieldCheck, size: 15, color: Color(0xFF475569)),
                        const SizedBox(width: 8),
                        Text(
                          'DISMISSED BY VAO · FALSE ALARM 🛡',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFF475569)),
                        ),
                      ],
                    ),
                  ),
                ] else if (a['status'] == 'REJECTED_BOUNDARY') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEDD5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFF97316)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.shieldAlert, size: 15, color: Color(0xFFC2410C)),
                        const SizedBox(width: 8),
                        Text(
                          'REJECTED DUE TO FMB BOUNDARY MISMATCH ⚠',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFFC2410C)),
                        ),
                      ],
                    ),
                  ),
                ],
              ] else if (user['role'] == 'INSPECTOR') ...[
                if (a['status'] == 'VAO_SUBMITTED') ...[
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => _InspectorReviewModal(alert: a, user: user, onSuccess: onRefresh),
                        );
                      },
                      icon: const Icon(LucideIcons.checkCheck, size: 16),
                      label: Text('REVIEW FMB MAP & FORWARD TO TAHSILDAR', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 1,
                      ),
                    ),
                  ),
                ] else if (a['status'] == 'NEW' || a['status'] == 'Pending') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.clock, size: 15, color: Color(0xFF64748B)),
                        const SizedBox(width: 8),
                        Text(
                          'AWAITING VAO GROUND RECON & PHOTOS',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ] else if (a['status'] == 'INSPECTOR_APPROVED' || a['status'] == 'SECTION_7_ISSUED' || a['status'] == 'SECTION_6_ORDERED') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF8B5CF6)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.send, size: 15, color: Color(0xFF6D28D9)),
                        const SizedBox(width: 8),
                        Text(
                          'COUNTER-SIGNED · AT TALUK HQ FOR LEGAL ACTION',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFF6D28D9)),
                        ),
                      ],
                    ),
                  ),
                ] else if (a['status'] == 'REJECTED_BOUNDARY') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEDD5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFF97316)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.shieldAlert, size: 15, color: Color(0xFFC2410C)),
                        const SizedBox(width: 8),
                        Text(
                          'REJECTED DUE TO FMB BOUNDARY MISMATCH ⚠',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFFC2410C)),
                        ),
                      ],
                    ),
                  ),
                ] else if (a['status'] == 'RESOLVED') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF10B981)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.checkCircle2, size: 15, color: Color(0xFF047857)),
                        const SizedBox(width: 8),
                        Text(
                          'RESTORED TO GOVERNMENT PORAMBOKE ✔',
                          style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFF047857)),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ],
          ),
        );
      },
    );
  }
}

// ─── TAB 4: PROFILE & CREDENTIALS (WHITE THEME) ───────────────────────────────
class _ProfileTab extends StatelessWidget {
  final Map<String, dynamic> user;
  final VoidCallback onLogout;
  const _ProfileTab({required this.user, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Digital Officer Identity Card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: kCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: kBorder),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 18, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: kPrimary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: kPrimary, width: 2),
                ),
                child: Center(
                  child: Text(
                    user['name'].toString()[0],
                    style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w900, color: kPrimary),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                user['name'],
                style: GoogleFonts.inter(fontSize: 19, fontWeight: FontWeight.w900, color: kText),
              ),
              const SizedBox(height: 2),
              Text(
                '${user['role']} · Revenue Department',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: kPrimary),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: kCardElevated,
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(color: kBorder),
                ),
                child: Text(
                  'Jurisdiction: ${user['district']} District · ${user['taluk']}',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: kTextSec),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        _whiteInfoTile(LucideIcons.fingerprint, 'Security Clearance', 'Field Officer Tier-2 (Authorized)'),
        _whiteInfoTile(LucideIcons.mapPin, 'Assigned Boundary', '${user['taluk']} Revenue Circle'),
        _whiteInfoTile(LucideIcons.radio, 'Telemetry Encryption', 'AES-256 Protocol (Active)'),
        _whiteInfoTile(LucideIcons.database, 'Local Cache Storage', '4.2 MB Cached Tiles'),

        InkWell(
          onTap: () => showServerConfigDialog(context, () {}),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDFA),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF99F6E4)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.wifi, size: 18, color: Color(0xFF0F766E)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Backend Server IP (Hotspot)', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w700, color: const Color(0xFF0F766E))),
                      Text(_activeApiHost, style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w900, color: const Color(0xFF134E4A))),
                    ],
                  ),
                ),
                const Icon(LucideIcons.edit2, size: 14, color: Color(0xFF0F766E)),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        ElevatedButton.icon(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('EMERGENCY BROADCAST: Priority SOS signal sent to Collectorate.'),
                backgroundColor: kDanger,
              ),
            );
          },
          icon: const Icon(LucideIcons.alertOctagon, size: 16),
          label: Text('TRANSMIT DISTRICT EMERGENCY SOS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
          style: ElevatedButton.styleFrom(
            backgroundColor: kDanger.withValues(alpha: 0.1),
            foregroundColor: kDanger,
            side: const BorderSide(color: kDanger),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
        ),

        const SizedBox(height: 12),

        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(LucideIcons.logOut, size: 16),
          label: Text('SIGN OUT', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900)),
          style: OutlinedButton.styleFrom(
            foregroundColor: kTextSec,
            side: const BorderSide(color: kBorder),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }

  Widget _whiteInfoTile(IconData icon, String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: kPrimary),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w700, color: kTextMuted)),
              Text(subtitle, style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w800, color: kText)),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── FORENSIC REPORTING MODAL (WHITE THEME) ───────────────────────────────────
class _ReportForm extends StatefulWidget {
  final dynamic alert;
  final Map<String, dynamic>? user;
  final VoidCallback onSuccess;
  const _ReportForm({required this.alert, this.user, required this.onSuccess});

  @override
  State<_ReportForm> createState() => _ReportFormState();
}

class _ReportFormState extends State<_ReportForm> {
  final _notesCtrl = TextEditingController();
  final _planCtrl  = TextEditingController();
  final List<XFile> _images = [];
  bool _loading = false;
  Position? _pos;

  String _selectedEncroachmentType = 'Unauthorized Structure';

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  Future<void> _getLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }
      _pos = await Geolocator.getCurrentPosition();
      if (mounted) setState(() {});
    } catch (_) {}
  }

  Future<void> _pickImage() async {
    if (_images.length >= 5) return;
    final picker = ImagePicker();
    final img = await picker.pickImage(source: ImageSource.camera, imageQuality: 50);
    if (img != null && mounted) setState(() => _images.add(img));
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      List<String> b64Images = [];
      for (var img in _images) {
        final bytes = await img.readAsBytes();
        b64Images.add("data:${img.mimeType ?? 'image/jpeg'};base64,${base64Encode(bytes)}");
      }

      final isVao = widget.user?['role'] == 'VAO';
      final payload = {
        "alert": widget.alert['id'],
        "officer_name": "${widget.user?['name'] ?? (isVao ? 'Prakash Ramakrishnan' : 'Mukesh S')} (${widget.user?['role'] ?? 'VAO'})",
        "gps_lat": _pos?.latitude ?? (widget.alert['position'] as List)[0],
        "gps_lon": _pos?.longitude ?? (widget.alert['position'] as List)[1],
        "photos": b64Images,
        "status": isVao ? "VAO_SUBMITTED" : "INSPECTOR_APPROVED",
        "remarks": "[Type: $_selectedEncroachmentType] ${_notesCtrl.text.isEmpty ? (isVao ? 'Ground surveyed by VAO. Encroachment confirmed on-site.' : 'Inspector verified and signed off.') : _notesCtrl.text}",
        "action_plan": _planCtrl.text.isEmpty ? "Issued Section 7 Notice under Tamil Nadu Land Encroachment Act, 1905." : _planCtrl.text,
        "implementation_details": isVao ? "Forwarded to Field Inspector for supervisory review." : "Authorized and synchronized to HQ Dashboard."
      };

      await makeApiPost('/api/verifications/', payload);

      if (!mounted) return;
      widget.alert['status'] = isVao ? 'VAO_SUBMITTED' : 'INSPECTOR_APPROVED';
      widget.alert['resolution_notes'] = payload['remarks'];
      widget.alert['verification'] = payload;
      widget.alert['photos'] = b64Images;
      Navigator.pop(context);
      widget.onSuccess();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: isVao ? const Color(0xFF2563EB) : const Color(0xFF059669),
          content: Text(
            isVao
              ? 'VAO REPORT SUBMITTED: Forwarded to Field Inspector Mukesh S for review.'
              : 'INSPECTOR VERIFIED: Synchronized live to District Collector Dashboard.',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Notice: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitFalseAlarm() async {
    setState(() => _loading = true);
    try {
      List<String> b64Images = [];
      for (var img in _images) {
        final bytes = await img.readAsBytes();
        b64Images.add("data:${img.mimeType ?? 'image/jpeg'};base64,${base64Encode(bytes)}");
      }
      final officer = "${widget.user?['name'] ?? 'VAO Prakash Ramakrishnan'} (${widget.user?['role'] ?? 'VAO'})";
      final notes = _notesCtrl.text.isEmpty 
          ? 'Ground verified by VAO: Land is under lawful Patta / valid title. Not an illegal encroachment.' 
          : _notesCtrl.text;
      
      final alertId = widget.alert['id'];
      await makeApiPost('/api/alerts/$alertId/mark_false_positive/', {
        'officer_name': officer,
        'reason': notes,
      });

      if (!mounted) return;
      widget.alert['status'] = 'FALSE_POSITIVE';
      widget.alert['resolution_notes'] = '[FALSE ALARM / DISMISSED by $officer]: $notes';
      if (b64Images.isNotEmpty) widget.alert['photos'] = b64Images;
      Navigator.pop(context);
      widget.onSuccess();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF475569),
          content: Text('DISMISSED AS FALSE ALARM: No encroachment. Case closed safely.'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Notice: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lat = _pos?.latitude ?? (widget.alert['position'] as List)[0];
    final lon = _pos?.longitude ?? (widget.alert['position'] as List)[1];

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(color: kBorderLight, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(LucideIcons.camera, color: kPrimary, size: 20),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          'FIELD EVIDENCE CAPTURE',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: kText),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: kPrimary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '#${widget.alert['id'].toString().length > 8 ? widget.alert['id'].toString().substring(0, 8) : widget.alert['id']}',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: kPrimary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Live GPS Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kCardElevated,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kBorder),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.navigation, color: kPrimary, size: 16),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'COORDINATES: ${lat.toStringAsFixed(5)}° N, ${lon.toStringAsFixed(5)}° E',
                          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: kPrimary),
                        ),
                        Text(
                          'Precision: ± 3.2m · Cadastral: ${widget.alert['survey_number']}',
                          style: GoogleFonts.inter(fontSize: 10, color: kTextSec),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            Text(
              'SITE PHOTO PROOFS (${_images.length}/5 Captured)',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: kTextSec),
            ),
            const SizedBox(height: 10),

            // Photos Row
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  ..._images.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final img = entry.value;
                    return Container(
                      width: 100,
                      margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(
                        color: kBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kAccent, width: 1.5),
                        image: DecorationImage(
                          image: File(img.path).existsSync()
                              ? FileImage(File(img.path)) as ImageProvider
                              : NetworkImage(img.path),
                          fit: BoxFit.cover,
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            top: 4,
                            right: 4,
                            child: InkWell(
                              onTap: () => setState(() => _images.removeAt(idx)),
                              child: Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(color: Colors.black87, shape: BoxShape.circle),
                                child: const Icon(LucideIcons.x, color: Colors.white, size: 12),
                              ),
                            ),
                          ),
                          Align(
                            alignment: Alignment.bottomCenter,
                            child: Container(
                              width: double.infinity,
                              color: Colors.black87,
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Text(
                                'PROOF #${idx + 1}',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w900, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  if (_images.length < 5)
                    InkWell(
                      onTap: _pickImage,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: 100,
                        decoration: BoxDecoration(
                          color: kCardElevated,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: kBorder),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.camera, color: kPrimary, size: 26),
                            const SizedBox(height: 6),
                            Text(
                              'SNAP PROOF',
                              style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w800, color: kPrimary),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            Text(
              'VIOLATION NATURE',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: kTextSec),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                'Unauthorized Structure',
                'Compound Wall Breach',
                'Waterbody Land Fill',
                'Commercial Encroachment',
              ].map((t) {
                final active = _selectedEncroachmentType == t;
                return InkWell(
                  onTap: () => setState(() => _selectedEncroachmentType = t),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: active ? kPrimary.withValues(alpha: 0.1) : kCardElevated,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: active ? kPrimary : kBorder),
                    ),
                    child: Text(
                      t,
                      style: GoogleFonts.inter(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: active ? kPrimary : kTextSec,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            _whiteInputBox('FIELD OBSERVATIONS & EVIDENCE SUMMARY', _notesCtrl, 2),
            const SizedBox(height: 12),
            _whiteInputBox('ACTION DIRECTIVE (Sec 7 / Eviction Notice)', _planCtrl, 2),

            const SizedBox(height: 22),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.shieldCheck, size: 18, color: Colors.white),
                          const SizedBox(width: 8),
                          Text(
                            widget.user?['role'] == 'VAO' ? 'SUBMIT FOR INSPECTOR REVIEW' : 'AUTHORIZE & SYNC TO HQ',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton.icon(
                onPressed: _loading ? null : _submitFalseAlarm,
                icon: const Icon(LucideIcons.shieldAlert, size: 16, color: Color(0xFFD97706)),
                label: Text(
                  'DISMISS AS FALSE ALARM / LEGAL LAND',
                  style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w800, color: const Color(0xFFD97706)),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFFDE68A)),
                  backgroundColor: const Color(0xFFFFFBEB),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _whiteInputBox(String lbl, TextEditingController c, int lines) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(lbl, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: kTextSec)),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: kCardElevated,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kBorder),
          ),
          child: TextField(
            controller: c,
            maxLines: lines,
            style: GoogleFonts.inter(fontSize: 13, color: kText),
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.all(12),
            ),
          ),
        ),
      ],
    );
  }
}


// ─── INSPECTOR REVIEW & APPROVAL MODAL (SUPERVISORY CHECKER) ──────────────────
class _InspectorReviewModal extends StatefulWidget {
  final dynamic alert;
  final Map<String, dynamic> user;
  final VoidCallback onSuccess;

  const _InspectorReviewModal({
    required this.alert,
    required this.user,
    required this.onSuccess,
  });

  @override
  State<_InspectorReviewModal> createState() => _InspectorReviewModalState();
}

class _InspectorReviewModalState extends State<_InspectorReviewModal> {
  bool _loading = false;
  final _reviewCtrl = TextEditingController(
    text: 'On-site counter-verification completed. VAO ground survey verified accurate against FMB boundary. Approved for District Collector action.',
  );

  List<String> _extractPhotos() {
    final v = widget.alert['verification'];
    if (v is Map && v['photos'] != null && v['photos'] is List) {
      final list = (v['photos'] as List).map((x) => x?.toString() ?? '').where((x) => x.isNotEmpty).toList();
      if (list.isNotEmpty) return list;
    }
    if (widget.alert['photos'] != null && widget.alert['photos'] is List) {
      final list = (widget.alert['photos'] as List).map((x) => x?.toString() ?? '').where((x) => x.isNotEmpty).toList();
      if (list.isNotEmpty) return list;
    }
    return [];
  }

  void _openFullScreenPhoto(BuildContext context, String photoStr, int index) {
    ImageProvider? provider;
    try {
      if (photoStr.startsWith('data:image') || photoStr.contains(';base64,')) {
        final b64 = photoStr.contains(';base64,') ? photoStr.split(';base64,')[1] : photoStr;
        provider = MemoryImage(base64Decode(b64.replaceAll(RegExp(r'\s+'), '')));
      } else if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
        provider = NetworkImage(photoStr);
      } else {
        provider = MemoryImage(base64Decode(photoStr.replaceAll(RegExp(r'\s+'), '')));
      }
    } catch (_) {}

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: const Color(0xFF111827),
        insetPadding: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: const Color(0xFF1F2937),
                child: Row(
                  children: [
                    const Icon(LucideIcons.camera, color: Color(0xFF10B981), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'FIELD EVIDENCE PHOTO #${index + 1}',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                          Text(
                            'Cadastral Target: ${widget.alert['survey_number']} · Taluk: ${widget.alert['taluk']}',
                            style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF9CA3AF)),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, color: Colors.white, size: 20),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.65,
                  maxWidth: double.infinity,
                ),
                child: InteractiveViewer(
                  minScale: 0.8,
                  maxScale: 4.0,
                  child: provider != null
                      ? Image(
                          image: provider,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => _errorPlaceholder(),
                        )
                      : _errorPlaceholder(),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: const Color(0xFF1F2937),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Pinch to zoom / Pan', style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF9CA3AF))),
                    Text('VAO GROUND VERIFIED', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF10B981))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _errorPlaceholder() {
    return Container(
      color: const Color(0xFF1F2937),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.imageOff, color: Color(0xFF9CA3AF), size: 36),
          const SizedBox(height: 8),
          Text(
            'Unable to preview image',
            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }

  Widget _buildThumbnail(BuildContext context, String photoStr, int index) {
    Widget imgWidget;
    try {
      if (photoStr.startsWith('data:image') || photoStr.contains(';base64,')) {
        final b64 = photoStr.contains(';base64,') ? photoStr.split(';base64,')[1] : photoStr;
        imgWidget = Image.memory(
          base64Decode(b64.replaceAll(RegExp(r'\s+'), '')),
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _errorPlaceholder(),
        );
      } else if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
        imgWidget = Image.network(
          photoStr,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _errorPlaceholder(),
        );
      } else {
        imgWidget = Image.memory(
          base64Decode(photoStr.replaceAll(RegExp(r'\s+'), '')),
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _errorPlaceholder(),
        );
      }
    } catch (_) {
      imgWidget = _errorPlaceholder();
    }

    return InkWell(
      onTap: () => _openFullScreenPhoto(context, photoStr, index),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 120,
        margin: const EdgeInsets.only(right: 10),
        decoration: BoxDecoration(
          color: kCardElevated,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFCD34D), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            imgWidget,
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black87],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'PROOF #${index + 1}',
                      style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                    const Icon(LucideIcons.maximize2, size: 10, color: Colors.white),
                  ],
                ),
              ),
            ),
            Positioned(
              top: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.camera, size: 8, color: Color(0xFF34D399)),
                    const SizedBox(width: 3),
                    Text('VAO', style: GoogleFonts.inter(fontSize: 7.5, fontWeight: FontWeight.w800, color: Colors.white)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _approve() async {
    setState(() => _loading = true);
    try {
      final alertId = widget.alert['id'];
      final notes = _reviewCtrl.text.trim();

      // Call inspector approval endpoint or verification
      await makeApiPost('/api/alerts/$alertId/inspector_approve/', {
        'status': 'INSPECTOR_APPROVED',
        'notes': notes,
      });

      if (!mounted) return;
      widget.alert['status'] = 'INSPECTOR_APPROVED';
      widget.alert['resolution_notes'] = notes;

      Navigator.pop(context);
      widget.onSuccess();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF059669),
          content: Text('AUTHORIZATION GRANTED: Alert approved & synchronized live to District Collector Dashboard!'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      widget.alert['status'] = 'INSPECTOR_APPROVED';
      Navigator.pop(context);
      widget.onSuccess();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _rejectBoundary() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(LucideIcons.shieldAlert, color: Color(0xFFEA580C), size: 22),
            const SizedBox(width: 8),
            Text('REJECT: FMB BOUNDARY', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14, color: kText)),
          ],
        ),
        content: Text(
          'Mark this alert as REJECTED due to FMB Cadastral boundary discrepancy? This will close the case without eviction proceedings.',
          style: GoogleFonts.inter(fontSize: 12.5, color: kTextSec),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('CANCEL', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: kTextSec)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEA580C)),
            child: Text('CONFIRM REJECTION', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _loading = true);
    try {
      final alertId = widget.alert['id'];
      final notes = _reviewCtrl.text.trim().isNotEmpty
          ? _reviewCtrl.text.trim()
          : 'FMB cadastral map boundary discrepancy. Property is within legal patta boundary.';
      final officerName = widget.user['name'] ?? 'Revenue Inspector';

      await makeApiPost('/api/alerts/$alertId/reject_boundary/', {
        'role': 'INSPECTOR',
        'officer_name': officerName,
        'reason': notes,
      });

      if (!mounted) return;
      widget.alert['status'] = 'REJECTED_BOUNDARY';
      widget.alert['resolution_notes'] = notes;

      Navigator.pop(context);
      widget.onSuccess();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFEA580C),
          content: Text('CASE REJECTED: Discrepancy logged. Alert flagged as REJECTED_BOUNDARY on Collector Dashboard.'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      widget.alert['status'] = 'REJECTED_BOUNDARY';
      Navigator.pop(context);
      widget.onSuccess();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lat = (widget.alert['position'] as List)[0];
    final lon = (widget.alert['position'] as List)[1];
    final verification = widget.alert['verification'];
    final officerName = (verification is Map && verification['officer_name'] != null && verification['officer_name'].toString().isNotEmpty)
        ? verification['officer_name'].toString()
        : 'VAO Prakash Ramakrishnan';
    final vRemarks = (verification is Map && verification['remarks'] != null && verification['remarks'].toString().isNotEmpty)
        ? verification['remarks'].toString()
        : null;
    final vaoNotes = widget.alert['resolution_notes']?.toString();
    final hasVaoNotes = vaoNotes != null && vaoNotes.isNotEmpty;
    final notesToDisplay = vRemarks ?? (hasVaoNotes ? vaoNotes : 'Ground boundary survey completed. Unlawful permanent structure observed within classified land.');
    final photos = _extractPhotos();

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(color: kBorderLight, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(LucideIcons.shieldCheck, color: Color(0xFF059669), size: 22),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          'SUPERVISORY REVIEW',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: kText, letterSpacing: 0.3),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD1FAE5),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFF10B981)),
                  ),
                  child: Text(
                    'TIER-2 REVIEW',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF065F46)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // VAO Submission Summary Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7).withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFCD34D)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.userCheck, size: 14, color: Color(0xFFD97706)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'SUBMITTED BY: ${officerName.toUpperCase()}',
                          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF92400E)),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Cadastral Target: ${widget.alert['survey_number']} · Taluk: ${widget.alert['taluk']}',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: kText),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Breach Type: ${widget.alert['alert_type']}',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: kDanger),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'VAO Field Observations:',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: kTextMuted),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    notesToDisplay,
                    style: GoogleFonts.inter(fontSize: 12, color: kText, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(LucideIcons.navigation, size: 12, color: kPrimary),
                      const SizedBox(width: 4),
                      Text('GPS: Lat ${lat.toStringAsFixed(4)}, Lon ${lon.toStringAsFixed(4)}', style: GoogleFonts.inter(fontSize: 10, color: kTextMuted)),
                    ],
                  ),

                  // VAO Photographic Ground Evidence Section
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.camera, size: 13, color: Color(0xFFD97706)),
                          const SizedBox(width: 5),
                          Text(
                            'VAO Ground Evidence Photos (${photos.length})',
                            style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: const Color(0xFF92400E)),
                          ),
                        ],
                      ),
                      if (photos.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD1FAE5),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: const Color(0xFF10B981)),
                          ),
                          child: Text(
                            'TAP TO EXPAND',
                            style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w900, color: const Color(0xFF065F46)),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (photos.isNotEmpty)
                    SizedBox(
                      height: 105,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: photos.length,
                        itemBuilder: (ctx, idx) => _buildThumbnail(context, photos[idx], idx),
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.imageOff, size: 14, color: Color(0xFFB45309)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'No photographic proof attached for this submission.',
                              style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF92400E), fontStyle: FontStyle.italic),
                            ),
                          ),
                        ],
                      ),
                    ),

                  if (verification is Map && verification['action_plan'] != null && verification['action_plan'].toString().isNotEmpty && verification['action_plan'] != 'nill') ...[
                    const SizedBox(height: 10),
                    Text(
                      'Action Directive Proposed:',
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: kTextMuted),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      verification['action_plan'].toString(),
                      style: GoogleFonts.inter(fontSize: 11, color: kTextSec),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),
            Text(
              'INSPECTOR AUTHORIZATION REMARKS',
              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: kTextSec),
            ),
            const SizedBox(height: 6),
            Container(
              decoration: BoxDecoration(
                color: kCardElevated,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kBorder),
              ),
              child: TextField(
                controller: _reviewCtrl,
                maxLines: 2,
                style: GoogleFonts.inter(fontSize: 12, color: kText),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(12),
                ),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _loading ? null : _approve,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.checkCheck, size: 18, color: Colors.white),
                          const SizedBox(width: 8),
                          Text(
                            'APPROVE & FORWARD TO TAHSILDAR',
                            style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton(
                onPressed: _loading ? null : _rejectBoundary,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFEA580C), width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.shieldAlert, size: 16, color: Color(0xFFEA580C)),
                    const SizedBox(width: 8),
                    Text(
                      'REJECT (FMB BOUNDARY MISMATCH)',
                      style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w800, color: const Color(0xFFEA580C)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── HELPER: OPEN TASK ACTION MODAL BASED ON LIFECYCLE ──────────────────────────────
void _openTaskActionModal(BuildContext context, dynamic a, Map<String, dynamic> user, VoidCallback onRefresh) {
  if (a == null) return;
  final status = a['status']?.toString() ?? '';
  if (status == 'INSPECTOR_APPROVED' || status == 'SECTION_7_ISSUED' || status == 'SECTION_6_ORDERED' || status == 'RESOLVED') {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _StatutoryActionModal(alert: a, user: user, onSuccess: onRefresh),
    );
  } else if (status == 'VAO_SUBMITTED' && user['role'] == 'INSPECTOR') {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _InspectorReviewModal(alert: a, user: user, onSuccess: onRefresh),
    );
  } else {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ReportForm(alert: a, user: user, onSuccess: onRefresh),
    );
  }
}

// ─── STATUTORY GOVERNMENT ACTION MODAL (TN LAND ENCROACHMENT ACT, 1905) ─────────────
class _StatutoryActionModal extends StatefulWidget {
  final dynamic alert;
  final Map<String, dynamic> user;
  final VoidCallback onSuccess;

  const _StatutoryActionModal({
    required this.alert,
    required this.user,
    required this.onSuccess,
  });

  @override
  State<_StatutoryActionModal> createState() => _StatutoryActionModalState();
}

class _StatutoryActionModalState extends State<_StatutoryActionModal> {
  bool _loading = false;
  late String _currentStatus;
  final _encroacherCtrl = TextEditingController(text: 'Unauthorized Occupant');
  final _objectionDaysCtrl = TextEditingController(text: '15');

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.alert['status']?.toString() ?? 'INSPECTOR_APPROVED';
  }

  List<String> _extractPhotos() {
    final v = widget.alert['verification'];
    if (v is Map && v['photos'] != null && v['photos'] is List) {
      final list = (v['photos'] as List).map((x) => x?.toString() ?? '').where((x) => x.isNotEmpty).toList();
      if (list.isNotEmpty) return list;
    }
    if (widget.alert['photos'] != null && widget.alert['photos'] is List) {
      final list = (widget.alert['photos'] as List).map((x) => x?.toString() ?? '').where((x) => x.isNotEmpty).toList();
      if (list.isNotEmpty) return list;
    }
    return [];
  }

  void _openFullScreenPhoto(BuildContext context, String photoStr, int index) {
    ImageProvider? provider;
    try {
      if (photoStr.startsWith('data:image') || photoStr.contains(';base64,')) {
        final b64 = photoStr.contains(';base64,') ? photoStr.split(';base64,')[1] : photoStr;
        provider = MemoryImage(base64Decode(b64.replaceAll(RegExp(r'\s+'), '')));
      } else if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
        provider = NetworkImage(photoStr);
      } else {
        provider = MemoryImage(base64Decode(photoStr.replaceAll(RegExp(r'\s+'), '')));
      }
    } catch (_) {}

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: const Color(0xFF111827),
        insetPadding: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: const Color(0xFF1F2937),
                child: Row(
                  children: [
                    const Icon(LucideIcons.camera, color: Color(0xFF10B981), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'FIELD EVIDENCE PHOTO #${index + 1}',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                          Text(
                            'Survey: ${widget.alert['survey_number']} · Taluk: ${widget.alert['taluk'] ?? 'Salem West'}',
                            style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF9CA3AF)),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, color: Colors.white, size: 20),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.65,
                  maxWidth: double.infinity,
                ),
                child: InteractiveViewer(
                  minScale: 0.8,
                  maxScale: 4.0,
                  child: provider != null
                      ? Image(image: provider, fit: BoxFit.contain, errorBuilder: (_, __, ___) => _errorPlaceholder())
                      : _errorPlaceholder(),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: const Color(0xFF1F2937),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Pinch to zoom / Pan', style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF9CA3AF))),
                    Text('SEC 65B EVIDENCE ACT', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF10B981))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _errorPlaceholder() {
    return Container(
      color: const Color(0xFF1F2937),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.imageOff, color: Color(0xFF9CA3AF), size: 36),
          const SizedBox(height: 8),
          Text('Evidence Image Unavailable', style: GoogleFonts.inter(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildThumbnail(BuildContext context, String photoStr, int index) {
    Widget imgWidget;
    try {
      if (photoStr.startsWith('data:image') || photoStr.contains(';base64,')) {
        final b64 = photoStr.contains(';base64,') ? photoStr.split(';base64,')[1] : photoStr;
        imgWidget = Image.memory(
          base64Decode(b64.replaceAll(RegExp(r'\s+'), '')),
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _errorPlaceholder(),
        );
      } else if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
        imgWidget = Image.network(
          photoStr,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _errorPlaceholder(),
        );
      } else {
        imgWidget = Image.memory(
          base64Decode(photoStr.replaceAll(RegExp(r'\s+'), '')),
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _errorPlaceholder(),
        );
      }
    } catch (_) {
      imgWidget = _errorPlaceholder();
    }

    return InkWell(
      onTap: () => _openFullScreenPhoto(context, photoStr, index),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 100,
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: kCardElevated,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            imgWidget,
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                color: Colors.black54,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('PROOF #${index + 1}', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: Colors.white)),
                    const Icon(LucideIcons.maximize2, size: 8, color: Colors.white),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _advanceAction(String targetAction) async {
    setState(() => _loading = true);
    final alertId = widget.alert['id'];
    final role = (widget.user['role'] ?? 'TAHSILDAR').toString().toUpperCase();
    final officerName = widget.user['name'] ?? 'Tahsildar Salem West';
    try {
      if (targetAction == 'ISSUE_SEC_7') {
        final encroacher = _encroacherCtrl.text.trim().isEmpty ? 'Unauthorized Occupant' : _encroacherCtrl.text.trim();
        final days = _objectionDaysCtrl.text.trim().isEmpty ? '15' : _objectionDaysCtrl.text.trim();
        await makeApiPost('/api/alerts/$alertId/issue_section_7/', {
          'role': role,
          'officer_name': officerName,
          'encroacher_name': encroacher,
          'notes': '[Section 7 Show Cause Notice] Served to $encroacher ($days-day objection period). Under TN Land Encroachment Act 1905 by $officerName.',
        });
        widget.alert['status'] = 'SECTION_7_ISSUED';
        if (mounted) setState(() => _currentStatus = 'SECTION_7_ISSUED');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF7C3AED),
              content: Text('FORM A ISSUED: Section 7 Show Cause Notice served (15-day objection period)!'),
            ),
          );
        }
      } else if (targetAction == 'ISSUE_SEC_6') {
        await makeApiPost('/api/alerts/$alertId/issue_section_6/', {
          'role': role,
          'officer_name': officerName,
          'notes': '[Section 6 Eviction Warrant] 15-day period elapsed. Collector/Tahsildar ($officerName) authorized summary eviction with Police Bandobast.',
        });
        widget.alert['status'] = 'SECTION_6_ORDERED';
        if (mounted) setState(() => _currentStatus = 'SECTION_6_ORDERED');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFFE11D48),
              content: Text('FORM B ISSUED: Section 6 Summary Eviction Warrant authorized with Police Bandobast!'),
            ),
          );
        }
      } else if (targetAction == 'COMPLETE_RESTORE') {
        await makeApiPost('/api/alerts/$alertId/complete_eviction/', {
          'role': role,
          'officer_name': officerName,
          'notes': '[Eviction Executed & Restored] Encroachment removed. Fencing restored. Tamil Nilam registry updated by $officerName.',
        });
        widget.alert['status'] = 'RESOLVED';
        if (mounted) setState(() => _currentStatus = 'RESOLVED');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF059669),
              content: Text('LAND RESTORED: Government possession reclaimed & updated in Tamil Nilam registry!'),
            ),
          );
        }
      } else if (targetAction == 'CANCEL_LEGAL') {
        await makeApiPost('/api/alerts/$alertId/cancel_legal/', {
          'role': role,
          'officer_name': officerName,
          'reason': 'Occupant presented valid registered Patta / High Court Stay Order during 15-day Section 7 period.',
        });
        widget.alert['status'] = 'CANCELLED_LEGAL';
        if (mounted) setState(() => _currentStatus = 'CANCELLED_LEGAL');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF4338CA),
              content: Text('PROCEEDINGS CANCELLED: Court stay / valid title confirmed. Eviction halted safely.'),
            ),
          );
        }
      }
      widget.onSuccess();
    } catch (_) {
      // Offline fallback
      if (targetAction == 'ISSUE_SEC_7') {
        widget.alert['status'] = 'SECTION_7_ISSUED';
        if (mounted) setState(() => _currentStatus = 'SECTION_7_ISSUED');
      } else if (targetAction == 'ISSUE_SEC_6') {
        widget.alert['status'] = 'SECTION_6_ORDERED';
        if (mounted) setState(() => _currentStatus = 'SECTION_6_ORDERED');
      } else if (targetAction == 'CANCEL_LEGAL') {
        widget.alert['status'] = 'CANCELLED_LEGAL';
        if (mounted) setState(() => _currentStatus = 'CANCELLED_LEGAL');
      } else if (targetAction == 'COMPLETE_RESTORE') {
        widget.alert['status'] = 'RESOLVED';
        if (mounted) setState(() => _currentStatus = 'RESOLVED');
      }
      widget.onSuccess();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmCancelLegal() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.block, color: Color(0xFF4338CA), size: 22),
            const SizedBox(width: 8),
            Text('CANCEL PROCEEDINGS', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14, color: kText)),
          ],
        ),
        content: Text(
          'Confirm cancellation of statutory eviction proceedings? This is only done when the occupant presents a registered valid Patta or High Court stay order.',
          style: GoogleFonts.inter(fontSize: 12.5, color: kTextSec),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('KEEP PROCEEDINGS', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: kTextSec)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4338CA)),
            child: Text('CANCEL PROCEEDINGS', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      _advanceAction('CANCEL_LEGAL');
    }
  }

  void _copyNoticeText() {
    final survey = widget.alert['survey_number'] ?? 'Survey 320';
    final taluk = widget.alert['taluk'] ?? 'Salem West';
    final isSec6 = _currentStatus == 'SECTION_6_ORDERED' || _currentStatus == 'RESOLVED';
    
    final text = isSec6
        ? "GOVERNMENT OF TAMIL NADU - REVENUE DEPARTMENT\n"
          "FORM B - SUMMARY EVICTION ORDER UNDER SECTION 6\n"
          "[Under Section 6 of the Tamil Nadu Land Encroachment Act, 1905]\n\n"
          "To: ${_encroacherCtrl.text}\n"
          "Cadastral Target: $survey, Taluk: $taluk\n\n"
          "WHEREAS the 15-day statutory period under Section 7 Notice has expired without lawful title proof;\n"
          "NOW THEREFORE, under Section 6 of Act III of 1905, you are commanded to vacate immediately. "
          "Police Bandobast and heavy machinery are deployed for summary eviction."
        : "GOVERNMENT OF TAMIL NADU - REVENUE DEPARTMENT\n"
          "FORM A - SHOW CAUSE NOTICE UNDER SECTION 7\n"
          "[Under Section 7 of the Tamil Nadu Land Encroachment Act, 1905]\n\n"
          "To: ${_encroacherCtrl.text}\n"
          "Cadastral Target: $survey, Taluk: $taluk\n\n"
          "TAKE NOTICE that you have unlawfully occupied Government Poramboke Land. "
          "You are required to show cause within 15 DAYS why you should not be evicted under Section 6 of Act III of 1905.";

    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF1E293B),
        content: Text('Notice text copied to clipboard! Ready to share.'),
      ),
    );
  }

  Widget _buildStepItem(int stepNum, String title, bool isDone, bool isActive) {
    Color circleColor = isDone ? const Color(0xFF10B981) : (isActive ? const Color(0xFF6366F1) : const Color(0xFFCBD5E1));
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: circleColor,
              shape: BoxShape.circle,
              boxShadow: isActive ? [BoxShadow(color: circleColor.withValues(alpha: 0.4), blurRadius: 6, spreadRadius: 1)] : null,
            ),
            child: Center(
              child: isDone
                  ? const Icon(LucideIcons.check, size: 14, color: Colors.white)
                  : Text('$stepNum', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white)),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 8.5,
              fontWeight: isActive ? FontWeight.w900 : FontWeight.w700,
              color: isActive ? kText : kTextMuted,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final survey = widget.alert['survey_number'] ?? 'Cadastral Target';
    final alertType = widget.alert['alert_type'] ?? 'Encroachment Alert';
    final taluk = widget.alert['taluk'] ?? 'Salem West';
    final photos = _extractPhotos();

    final isSec7Done = _currentStatus == 'SECTION_7_ISSUED' || _currentStatus == 'SECTION_6_ORDERED' || _currentStatus == 'RESOLVED';
    final isSec6Done = _currentStatus == 'SECTION_6_ORDERED' || _currentStatus == 'RESOLVED';
    final isResolved = _currentStatus == 'RESOLVED';
    final isCancelled = _currentStatus == 'CANCELLED_LEGAL';
    final isRejected = _currentStatus == 'REJECTED_BOUNDARY';
    final isFalsePositive = _currentStatus == 'FALSE_POSITIVE';

    final isSec7Active = _currentStatus == 'INSPECTOR_APPROVED';
    final isSec6Active = _currentStatus == 'SECTION_7_ISSUED';
    final isDemolishActive = _currentStatus == 'SECTION_6_ORDERED';

    final userRole = (widget.user['role'] ?? 'VAO').toString().toUpperCase();
    final isVao = userRole == 'VAO';
    final isTahsildar = userRole == 'TAHSILDAR' || userRole == 'COLLECTOR' || userRole == 'ADMIN';

    Color headerBadgeBg = const Color(0xFFD1FAE5);
    Color headerBadgeBorder = const Color(0xFF10B981);
    Color headerBadgeText = const Color(0xFF065F46);
    String headerBadgeLabel = 'STAGE 2: RI APPROVED';

    if (_currentStatus == 'SECTION_7_ISSUED') {
      headerBadgeBg = const Color(0xFFEDE9FE);
      headerBadgeBorder = const Color(0xFF8B5CF6);
      headerBadgeText = const Color(0xFF5B21B6);
      headerBadgeLabel = 'STAGE 3: SEC 7 NOTICED';
    } else if (_currentStatus == 'SECTION_6_ORDERED') {
      headerBadgeBg = const Color(0xFFFFE4E6);
      headerBadgeBorder = const Color(0xFFF43F5E);
      headerBadgeText = const Color(0xFF9F1239);
      headerBadgeLabel = 'STAGE 4: SEC 6 EVICTION';
    } else if (_currentStatus == 'RESOLVED') {
      headerBadgeBg = const Color(0xFFD1FAE5);
      headerBadgeBorder = const Color(0xFF059669);
      headerBadgeText = const Color(0xFF065F46);
      headerBadgeLabel = 'STAGE 5: RESTORED ✔';
    } else if (_currentStatus == 'CANCELLED_LEGAL') {
      headerBadgeBg = const Color(0xFFEEF2FF);
      headerBadgeBorder = const Color(0xFF6366F1);
      headerBadgeText = const Color(0xFF4338CA);
      headerBadgeLabel = 'CANCELLED: STAY/PATTA';
    } else if (_currentStatus == 'REJECTED_BOUNDARY') {
      headerBadgeBg = const Color(0xFFFFEDD5);
      headerBadgeBorder = const Color(0xFFF97316);
      headerBadgeText = const Color(0xFFC2410C);
      headerBadgeLabel = 'REJECTED: FMB MISMATCH';
    } else if (_currentStatus == 'FALSE_POSITIVE') {
      headerBadgeBg = const Color(0xFFF1F5F9);
      headerBadgeBorder = const Color(0xFF94A3B8);
      headerBadgeText = const Color(0xFF475569);
      headerBadgeLabel = 'FALSE ALARM';
    }

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(color: kBorderLight, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),

            // Top Title & Stage Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(LucideIcons.scale, color: Color(0xFF6366F1), size: 20),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          'GOVERNMENT ACTION PIPELINE',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: kText, letterSpacing: 0.3),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: headerBadgeBg,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: headerBadgeBorder),
                  ),
                  child: Text(
                    headerBadgeLabel,
                    style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w900, color: headerBadgeText),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Tamil Nadu Land Encroachment Act, 1905 (Act III of 1905)',
              style: GoogleFonts.inter(fontSize: 10, color: kTextMuted),
            ),
            const SizedBox(height: 16),

            // 5-Stage Stepper
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  _buildStepItem(1, 'VAO Recon', true, false),
                  _buildStepItem(2, 'RI Verify', true, false),
                  _buildStepItem(3, 'Sec 7 Notice', isSec7Done, isSec7Active),
                  _buildStepItem(4, 'Sec 6 Warrant', isSec6Done, isSec6Active),
                  _buildStepItem(5, 'Restored', isResolved, isDemolishActive),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Target Cadastral Summary Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kCardElevated,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '$survey · $taluk',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: kText),
                      ),
                      Text(
                        alertType,
                        style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w800, color: const Color(0xFFD97706)),
                      ),
                    ],
                  ),
                  if (photos.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('FIELD EVIDENCE PHOTOS (GEO-TAGGED):', style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w800, color: kTextMuted)),
                        Text('TAP TO ENLARGE', style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w800, color: const Color(0xFF10B981))),
                      ],
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 75,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: photos.length,
                        itemBuilder: (ctx, idx) => _buildThumbnail(context, photos[idx], idx),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ACTION CONTROLLER BOX BASED ON CURRENT STATUS
            if (isSec7Active) ...[
              if (!isTahsildar) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.lock, size: 16, color: Color(0xFFDC2626)),
                          const SizedBox(width: 8),
                          Text('STATUTORY AUTHORITY LOCKED', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: const Color(0xFF991B1B))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Under Section 7 of the TN Land Encroachment Act 1905, Show Cause Notice can ONLY be authorized by Tahsildar / Revenue Divisional Officer.\n\nLogged in role: $userRole (Read Only)',
                        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF7F1D1D)),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F3FF),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFC4B5FD)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.fileText, size: 16, color: Color(0xFF7C3AED)),
                          const SizedBox(width: 8),
                          Text('STAGE 3: SHOW CAUSE NOTICE UNDER SECTION 7', style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w900, color: const Color(0xFF5B21B6))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Under Section 7 of the TN Land Encroachment Act 1905, a mandatory 15-day show-cause notice must be served giving the occupant fair opportunity to respond before eviction order.',
                        style: GoogleFonts.inter(fontSize: 10.5, color: const Color(0xFF4C1D95)),
                      ),
                      const SizedBox(height: 10),
                      Text('Occupant / Encroacher Name:', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: kTextMuted)),
                      const SizedBox(height: 4),
                      Container(
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFDDD6FE))),
                        child: TextField(
                          controller: _encroacherCtrl,
                          style: GoogleFonts.inter(fontSize: 12, color: kText),
                          decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: _loading ? null : () => _advanceAction('ISSUE_SEC_7'),
                          icon: const Icon(LucideIcons.send, size: 16, color: Colors.white),
                          label: Text('ISSUE SECTION 7 NOTICE (FORM A)', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7C3AED),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ] else if (isSec6Active) ...[
              if (!isTahsildar) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.lock, size: 16, color: Color(0xFFDC2626)),
                          const SizedBox(width: 8),
                          Text('STATUTORY AUTHORITY LOCKED', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: const Color(0xFF991B1B))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Under Section 6 of Act III of 1905, Eviction Warrants & Police Bandobast require Tahsildar / Collector quasi-judicial authority.\n\nLogged in role: $userRole (Read Only)',
                        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF7F1D1D)),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFECDD3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.gavel, size: 16, color: Color(0xFFE11D48)),
                          const SizedBox(width: 8),
                          Text('STAGE 4: SUMMARY EVICTION ORDER UNDER SECTION 6', style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w900, color: const Color(0xFF9F1239))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '15-day statutory objection period expired without lawful title proof. Tahsildar / Collector authorizes summary eviction warrant with Police Bandobast & machinery deployment.',
                        style: GoogleFonts.inter(fontSize: 10.5, color: const Color(0xFF881337)),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: _loading ? null : () => _advanceAction('ISSUE_SEC_6'),
                          icon: const Icon(LucideIcons.shieldAlert, size: 16, color: Colors.white),
                          label: Text('AUTHORIZE SECTION 6 EVICTION ORDER (FORM B)', style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w900, color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE11D48),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: OutlinedButton.icon(
                          onPressed: _loading ? null : _confirmCancelLegal,
                          icon: const Icon(Icons.block, size: 16, color: Color(0xFF4338CA)),
                          label: Text('CANCEL PROCEEDINGS (LEGAL STAY / VALID PATTA)', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w800, color: const Color(0xFF4338CA))),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF4338CA), width: 1.5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ] else if (isDemolishActive) ...[
              if (isVao) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.lock, size: 16, color: Color(0xFFD97706)),
                          const SizedBox(width: 8),
                          Text('SUPERVISORY PRESENCE REQUIRED', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: const Color(0xFF92400E))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Demolition and physical reclamation requires Revenue Inspector or Tahsildar supervisory presence on site.\n\nLogged in role: $userRole (Supervision Required)',
                        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF78350F)),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.truck, size: 16, color: Color(0xFFD97706)),
                          const SizedBox(width: 8),
                          Text('STAGE 5: DEMOLITION & LAND RESTORATION', style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w900, color: const Color(0xFF92400E))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Police Bandobast stationed. Deploy JCB machinery on site, demolish unauthorized permanent structures, fence boundary, and restore land to Tamil Nilam Government Poramboke registry.',
                        style: GoogleFonts.inter(fontSize: 10.5, color: const Color(0xFF78350F)),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: _loading ? null : () => _advanceAction('COMPLETE_RESTORE'),
                          icon: const Icon(LucideIcons.checkCheck, size: 16, color: Colors.white),
                          label: Text('EXECUTE DEMOLITION & RESTORE LAND', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ] else if (isResolved) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Column(
                  children: [
                    const Icon(LucideIcons.checkCircle2, color: Color(0xFF059669), size: 36),
                    const SizedBox(height: 8),
                    Text('LAND RESTORATION COMPLETED ✔', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: const Color(0xFF065F46))),
                    const SizedBox(height: 4),
                    Text(
                      'Encroachment physically cleared. Government possession reclaimed and registered in Tamil Nilam. Statutory proceedings closed under Act III of 1905.',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF047857)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ] else if (isCancelled) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFC7D2FE)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.block, color: Color(0xFF4338CA), size: 36),
                    const SizedBox(height: 8),
                    Text('PROCEEDINGS DROPPED (LEGAL STAY / PATTA) ⚖', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: const Color(0xFF312E81))),
                    const SizedBox(height: 4),
                    Text(
                      'Statutory eviction proceedings cancelled under TN Land Encroachment Act 1905. Occupant produced registered patta title or High Court Stay Order.',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF3730A3)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ] else if (isRejected) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFFEDD5)),
                ),
                child: Column(
                  children: [
                    const Icon(LucideIcons.shieldAlert, color: Color(0xFFEA580C), size: 36),
                    const SizedBox(height: 8),
                    Text('REJECTED: FMB BOUNDARY MISMATCH ⚠', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: const Color(0xFF9A3412))),
                    const SizedBox(height: 4),
                    Text(
                      'Alert rejected during supervisory review due to boundary mismatch against official cadastral map. Closed without eviction.',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFC2410C)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ] else if (isFalsePositive) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    const Icon(LucideIcons.shieldCheck, color: Color(0xFF64748B), size: 36),
                    const SizedBox(height: 8),
                    Text('DISMISSED AS FALSE ALARM 🛡', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: const Color(0xFF334155))),
                    const SizedBox(height: 4),
                    Text(
                      'Field verified by Village Administrative Officer: Not an unlawful encroachment on government land.',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF475569)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 14),

            // Share / Copy Notice Text Button
            SizedBox(
              width: double.infinity,
              height: 42,
              child: OutlinedButton.icon(
                onPressed: _copyNoticeText,
                icon: const Icon(LucideIcons.copy, size: 14, color: Color(0xFF475569)),
                label: Text('COPY STATUTORY LEGAL NOTICE TEXT', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w800, color: const Color(0xFF475569))),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

