import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';

// ─── COLORS ──────────────────────────────────────────────────────────────────
const kBg       = Color(0xFFEEF2F7);
const kCard     = Colors.white;
const kPrimary  = Color(0xFF1A56DB);
const kAccent   = Color(0xFF0E9F6E);
const kDanger   = Color(0xFFE02424);
const kText     = Color(0xFF111928);
const kMuted    = Color(0xFF6B7280);
const kBorder   = Color(0xFFE5E7EB);

void main() => runApp(const FieldApp());

class FieldApp extends StatelessWidget {
  const FieldApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'GeoCommand Officer',
      theme: ThemeData(
        scaffoldBackgroundColor: kBg,
        textTheme: GoogleFonts.interTextTheme(),
        colorScheme: const ColorScheme.light(primary: kPrimary),
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
      : ShellPage(user: _user!);
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
class LoginPage extends StatefulWidget {
  final ValueChanged<Map<String, dynamic>> onLogin;
  const LoginPage({super.key, required this.onLogin});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _idCtrl  = TextEditingController();
  final _pwCtrl  = TextEditingController();
  bool _loading  = false;

  void _submit() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(seconds: 1));
    widget.onLogin({'name': 'Prakash Raj', 'role': 'VAO'});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(children: [
        // Left decorative stripe
        Container(width: 6, color: kPrimary),
        Expanded(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: kPrimary, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(LucideIcons.globe, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('GeoCommand', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: kPrimary)),
                    Text('Field Officer Portal', style: GoogleFonts.inter(fontSize: 12, color: kMuted)),
                  ]),
                ]),
                const SizedBox(height: 48),
                Text('Sign in to your account', style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w700, color: kText)),
                const SizedBox(height: 8),
                Text('Enter your officer credentials to continue', style: GoogleFonts.inter(fontSize: 14, color: kMuted)),
                const SizedBox(height: 40),
                _label('Officer ID'),
                _input(_idCtrl, 'e.g. TN-9922', LucideIcons.userCheck),
                const SizedBox(height: 20),
                _label('Password'),
                _input(_pwCtrl, '••••••••', LucideIcons.lock, obscure: true),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kPrimary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text('Sign In', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 24),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: kAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(100), border: Border.all(color: kAccent.withOpacity(0.3))),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 6, height: 6, decoration: const BoxDecoration(color: kAccent, shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      Text('System Online', style: GoogleFonts.inter(color: kAccent, fontSize: 11, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ]),
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _label(String t) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(t, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: kText)));

  Widget _input(TextEditingController c, String hint, IconData icon, {bool obscure = false}) {
    return TextField(
      controller: c,
      obscureText: obscure,
      style: GoogleFonts.inter(fontSize: 15, color: kText),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.inter(color: kMuted),
        prefixIcon: Icon(icon, size: 18, color: kMuted),
        filled: true, fillColor: kCard,
        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kPrimary, width: 2)),
      ),
    );
  }
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
class ShellPage extends StatefulWidget {
  final Map<String, dynamic> user;
  const ShellPage({super.key, required this.user});
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
    _fetch(); // Auto-load on login
  }

  Future<void> _fetch() async {
    setState(() { _errorMsg = null; });
    try {
      http.Response res;
      final ts = DateTime.now().millisecondsSinceEpoch;
      try {
        res = await http.get(Uri.parse('http://10.116.75.33:8000/api/alerts/?_t=$ts'));
      } catch (e) {
        print("Primary host failed, trying fallback...");
        res = await http.get(Uri.parse('http://10.0.2.2:8000/api/alerts/?_t=$ts'));
      }
      
      if (res.statusCode == 200) {
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
          
          double lat = 0.0;
          double lng = 0.0;

          if (isFeature && geom != null && geom['coordinates'] != null) {
            final coords = geom['coordinates'];
            try {
              lat = (coords[1] as num).toDouble();
              lng = (coords[0] as num).toDouble();
            } catch (e) { print("Coord error: $e"); }
          } else if (isMap) {
            lat = (p['latitude'] ?? p['lat'] ?? 0.0).toDouble();
            lng = (p['longitude'] ?? p['lng'] ?? 0.0).toDouble();
          }
          
          return {
            'id': (isMap ? (f['id'] ?? p['id'] ?? '0') : '0').toString(),
            'alert_type': p['alert_type'] ?? 'Unknown',
            'status': (p['status'] ?? '').toString(),
            'confidence_score': (p['confidence_score'] ?? 0.0).toDouble(),
            'position': [lat, lng],
          };
        }).where((a) {
          final status = (a['status'] as String).toUpperCase().trim();
          final id = a['id'] as String;
          return seen.add(id) && (status == 'VAO_ASSIGNED' || status == 'IN-VERIFICATION' || status == 'PENDING' || status == 'NEW' || status == 'COLLECTOR_ACCEPTED' || status == 'TAHSILDAR_ACCEPTED' || status == '');
        }).toList();
        
        setState(() { _alerts = parsed; _loading = false; });
      } else {
        setState(() { 
          _loading = false; 
          _errorMsg = "HTTP Error ${res.statusCode}: ${res.body}";
        });
      }

    } catch (e) { 
      setState(() { 
        _loading = false; 
        _errorMsg = "Network/Parsing Error: ${e.toString()}";
      });
    }
  }

  final _labels = ['Home', 'Map', 'Tasks', 'Profile'];
  final _icons  = [LucideIcons.layoutDashboard, LucideIcons.mapPin, LucideIcons.clipboardList, LucideIcons.userCircle];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _idx != 1 ? AppBar(
        backgroundColor: kCard,
        elevation: 0,
        titleSpacing: 20,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_labels[_idx], style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: kText)),
          Text('Salem GeoCommand', style: GoogleFonts.inter(fontSize: 11, color: kMuted)),
        ]),
        actions: [
          IconButton(
            tooltip: 'Clear screen',
            onPressed: () {
              showDialog(
                context: context,
                builder: (_) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  title: Text('Clear Screen', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                  content: Text('This will clear all displayed missions. Your backend data is safe.', style: GoogleFonts.inter(color: kMuted)),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: GoogleFonts.inter(color: kMuted))),
                    ElevatedButton(
                      onPressed: () { setState(() => _alerts = []); Navigator.pop(context); },
                      style: ElevatedButton.styleFrom(backgroundColor: kDanger, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                      child: Text('Clear', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              );
            },
            icon: const Icon(LucideIcons.trash2, color: kDanger, size: 20),
          ),
          IconButton(
            tooltip: 'Refresh assignments',
            onPressed: () {
              setState(() => _loading = true);
              _fetch();
            },
            icon: const Icon(LucideIcons.refreshCw, color: kPrimary, size: 20),
          ),
          Padding(padding: const EdgeInsets.only(right: 16), child: CircleAvatar(backgroundColor: kPrimary, radius: 18,
            child: Text(widget.user['name'].toString()[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)))),
        ],
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(height: 1, color: kBorder)),
      ) : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : RefreshIndicator(
              color: kPrimary,
              onRefresh: () async {
                setState(() => _loading = true);
                await _fetch();
              },
              child: IndexedStack(index: _idx, children: [
                _HomeTab(alerts: _alerts, name: widget.user['name'], errorMsg: _errorMsg),
                _MapTab(alerts: _alerts),
                _TasksTab(alerts: _alerts, onRefresh: _fetch),

                _ProfileTab(user: widget.user),
              ]),
            ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(color: kCard, border: Border(top: BorderSide(color: kBorder))),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(children: List.generate(4, (i) => Expanded(
              child: InkWell(
                onTap: () => setState(() => _idx = i),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(_icons[i], size: 22, color: _idx == i ? kPrimary : kMuted),
                  const SizedBox(height: 4),
                  Text(_labels[i], style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _idx == i ? kPrimary : kMuted)),
                ]),
              ),
            ))),
          ),
        ),
      ),
    );
  }

}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
class _HomeTab extends StatelessWidget {
  final List<dynamic> alerts;
  final String name;
  final String? errorMsg;
  const _HomeTab({required this.alerts, required this.name, this.errorMsg});

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(20), children: [
      if (errorMsg != null)
        Container(
          margin: const EdgeInsets.only(bottom: 20),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: kDanger.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: kDanger.withOpacity(0.3))),
          child: Row(children: [
            const Icon(LucideIcons.alertOctagon, color: kDanger),
            const SizedBox(width: 12),
            Expanded(child: Text(errorMsg!, style: GoogleFonts.inter(color: kDanger, fontSize: 13, fontWeight: FontWeight.w600))),
          ]),
        ),
      // Greeting banner
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: kPrimary,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Good day, ${name.split(' ')[0]}', style: GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 4),
            Text('Field Officer', style: GoogleFonts.inter(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          ])),
          Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
            child: const Icon(LucideIcons.shieldCheck, color: Colors.white, size: 28)),
        ]),
      ),
      const SizedBox(height: 20),
      // KPI row
      Row(children: [
        _kpi('${alerts.length}', 'Assigned', LucideIcons.clipboardList, kPrimary),
        const SizedBox(width: 12),
        _kpi('0', 'Completed', LucideIcons.checkCircle, kAccent),
        const SizedBox(width: 12),
        _kpi('${alerts.length}', 'Pending', LucideIcons.clock, kDanger),
      ]),
      const SizedBox(height: 24),
      _sectionHeader('Recent Missions'),
      const SizedBox(height: 12),
      if (alerts.isEmpty)
        _emptyState('No missions assigned')
      else
        ...alerts.take(3).map((a) => _missionTile(a)),
    ]);
  }

  Widget _kpi(String val, String lbl, IconData ic, Color col) => Expanded(child: Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(ic, size: 18, color: col),
      const SizedBox(height: 10),
      Text(val, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: kText)),
      Text(lbl, style: GoogleFonts.inter(fontSize: 11, color: kMuted, fontWeight: FontWeight.w500)),
    ]),
  ));

  Widget _missionTile(dynamic a) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
    child: Row(children: [
      Container(width: 40, height: 40, decoration: BoxDecoration(color: kDanger.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: const Icon(LucideIcons.alertTriangle, color: kDanger, size: 20)),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(a['alert_type'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: kText)),
        Text('ID: ${a['id']}', style: GoogleFonts.inter(fontSize: 12, color: kMuted)),
      ])),
      Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(100)),
        child: Text('Pending', style: GoogleFonts.inter(color: Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w600))),
    ]),
  );
}

// ─── MAP TAB ──────────────────────────────────────────────────────────────────
class _MapTab extends StatelessWidget {
  final List<dynamic> alerts;
  const _MapTab({required this.alerts});

  @override
  Widget build(BuildContext context) => Stack(children: [
    FlutterMap(
      options: const MapOptions(initialCenter: LatLng(11.6643, 78.1460), initialZoom: 13),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.geocommand.officer_app',
        ),

        MarkerLayer(markers: alerts.map<Marker>((a) => Marker(
          point: LatLng((a['position'] as List)[0], (a['position'] as List)[1]),
          width: 44, height: 44,
          child: Container(
            decoration: BoxDecoration(color: kDanger, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2),
              boxShadow: [BoxShadow(color: kDanger.withOpacity(0.4), blurRadius: 8)]),
            child: const Icon(LucideIcons.mapPin, color: Colors.white, size: 20),
          ),
        )).toList()),
      ],
    ),
    Positioned(top: 16, left: 16, right: 16, child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10)]),
      child: Row(children: [
        const Icon(LucideIcons.mapPin, color: kPrimary, size: 16),
        const SizedBox(width: 10),
        Text('Salem District — ${alerts.length} active targets', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: kText, fontSize: 13)),
      ]),
    )),
  ]);
}

// ─── TASKS TAB ────────────────────────────────────────────────────────────────
class _TasksTab extends StatelessWidget {
  final List<dynamic> alerts;
  final VoidCallback onRefresh;
  const _TasksTab({required this.alerts, required this.onRefresh});

  void _openReportForm(BuildContext context, dynamic alert) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ReportForm(alert: alert, onSuccess: () {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Verification submitted successfully!'), backgroundColor: kAccent));
        onRefresh(); // Refresh list after submission
      }),
    );
  }

  Future<void> _quickComplete(BuildContext context, dynamic alert) async {
    final payload = {
      "alert": alert['id'],
      "officer_name": "Prakash Ramakrishnan",
      "gps_lat": (alert['position'] as List)[0],
      "gps_lon": (alert['position'] as List)[1],
      "photos": [],
      "remarks": "Quick completion from task list.",
      "action_plan": "None",
      "implementation_details": "Completed"
    };

    try {
      http.Response res;
      try {
        res = await http.post(
          Uri.parse('http://10.116.75.33:8000/api/verifications/'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(payload)
        );
      } catch (e) {
        res = await http.post(
          Uri.parse('http://10.0.2.2:8000/api/verifications/'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(payload)
        );
      }

      if (res.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Mission #${alert['id']} completed.'), backgroundColor: kAccent));
        onRefresh();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${res.body}')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (alerts.isEmpty) return _emptyState('No tasks assigned to you');
    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: alerts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final a = alerts[i];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(a['alert_type'], style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15, color: kText))),
              Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(100)),
                child: Text('In Progress', style: GoogleFonts.inter(color: const Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w600))),
            ]),
            const SizedBox(height: 8),
            Text('Mission ID: #${a['id']}', style: GoogleFonts.inter(fontSize: 12, color: kMuted)),
            const SizedBox(height: 4),
            Text('Confidence: ${(a['confidence_score'] * 100).toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 12, color: kMuted)),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: OutlinedButton.icon(
                onPressed: () => _openReportForm(context, a),
                icon: const Icon(LucideIcons.camera, size: 16),
                label: Text('Report', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(foregroundColor: kPrimary, side: const BorderSide(color: kPrimary), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              )),
              const SizedBox(width: 10),
              Expanded(child: ElevatedButton.icon(
                onPressed: () => _quickComplete(context, a),
                icon: const Icon(LucideIcons.checkCircle, size: 16),
                label: Text('Complete', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(backgroundColor: kAccent, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              )),
            ]),
          ]),
        );
      },
    );
  }
}


// ─── PROFILE TAB ──────────────────────────────────────────────────────────────
class _ProfileTab extends StatelessWidget {
  final Map<String, dynamic> user;
  const _ProfileTab({required this.user});

  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
    Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: kBorder)),
      child: Column(children: [
        CircleAvatar(radius: 36, backgroundColor: kPrimary, child: Text(user['name'].toString()[0], style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold))),
        const SizedBox(height: 12),
        Text(user['name'], style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: kText)),
        const SizedBox(height: 4),
        Text('Village Administrative Officer', style: GoogleFonts.inter(fontSize: 13, color: kMuted)),
        const SizedBox(height: 16),
        Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), decoration: BoxDecoration(color: kPrimary.withOpacity(0.1), borderRadius: BorderRadius.circular(100)),
          child: Text('Salem District · Tamil Nadu', style: GoogleFonts.inter(color: kPrimary, fontSize: 12, fontWeight: FontWeight.w600))),
      ]),
    ),
    const SizedBox(height: 20),
    _tile(LucideIcons.shieldCheck, 'Clearance Level', 'Field Officer – L2'),
    _tile(LucideIcons.phone, 'Contact', '+91-98765-43210'),
    _tile(LucideIcons.mail, 'Email', 'officer@geocommand.tn.gov.in'),
    _tile(LucideIcons.calendar, 'Joined', 'April 2024'),
    const SizedBox(height: 12),
    OutlinedButton.icon(
      onPressed: () {},
      icon: const Icon(LucideIcons.logOut, size: 16),
      label: Text('Sign Out', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      style: OutlinedButton.styleFrom(foregroundColor: kDanger, side: const BorderSide(color: kDanger), minimumSize: const Size.fromHeight(48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
    ),
  ]);

  Widget _tile(IconData ic, String lbl, String val) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
    child: Row(children: [
      Icon(ic, size: 18, color: kPrimary),
      const SizedBox(width: 14),
      Text(lbl, style: GoogleFonts.inter(color: kMuted, fontSize: 13)),
      const Spacer(),
      Text(val, style: GoogleFonts.inter(color: kText, fontWeight: FontWeight.w600, fontSize: 13)),
    ]),
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
Widget _sectionHeader(String t) => Text(t, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: kText));

Widget _emptyState(String msg) => Center(child: Padding(
  padding: const EdgeInsets.symmetric(vertical: 60),
  child: Column(children: [
    const Icon(LucideIcons.inbox, size: 48, color: kMuted),
    const SizedBox(height: 12),
    Text(msg, style: GoogleFonts.inter(color: kMuted, fontWeight: FontWeight.w500)),
  ]),
));

// ─── REPORT FORM ──────────────────────────────────────────────────────────────
class _ReportForm extends StatefulWidget {
  final dynamic alert;
  final VoidCallback onSuccess;
  const _ReportForm({required this.alert, required this.onSuccess});

  @override
  State<_ReportForm> createState() => _ReportFormState();
}

class _ReportFormState extends State<_ReportForm> {
  final _notesCtrl = TextEditingController();
  final _planCtrl = TextEditingController();
  final _implCtrl = TextEditingController();
  
  List<XFile> _images = [];
  bool _loading = false;
  Position? _pos;

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
      setState(() {});
    } catch (e) {
      print("Geolocation error: $e");
    }
  }

  Future<void> _pickImage() async {
    if (_images.length >= 5) return;
    final picker = ImagePicker();
    final img = await picker.pickImage(source: ImageSource.camera, imageQuality: 50);
    if (img != null) setState(() => _images.add(img));
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      // Read images as base64
      List<String> b64Images = [];
      for (var img in _images) {
        final bytes = await img.readAsBytes();
        b64Images.add("data:${img.mimeType ?? 'image/jpeg'};base64,${base64Encode(bytes)}");
      }

      final payload = {
        "alert": widget.alert['id'],
        "officer_name": "Prakash Ramakrishnan", // In a real app, from auth state
        "gps_lat": _pos?.latitude ?? (widget.alert['position'] as List)[0],
        "gps_lon": _pos?.longitude ?? (widget.alert['position'] as List)[1],
        "photos": b64Images,
        "remarks": _notesCtrl.text.isEmpty ? "No remarks provided" : _notesCtrl.text,
        "action_plan": _planCtrl.text,
        "implementation_details": _implCtrl.text
      };

      http.Response res;
      try {
        res = await http.post(Uri.parse('http://10.116.75.33:8000/api/verifications/'),
          headers: {'Content-Type': 'application/json'}, body: jsonEncode(payload));
      } catch (e) {
        res = await http.post(Uri.parse('http://10.0.2.2:8000/api/verifications/'),
          headers: {'Content-Type': 'application/json'}, body: jsonEncode(payload));
      }

      if (res.statusCode == 201) {
        Navigator.pop(context);
        widget.onSuccess();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${res.body}')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(top: 24, left: 24, right: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 24),
        Row(children: [
          const Icon(LucideIcons.shieldAlert, color: kPrimary),
          const SizedBox(width: 12),
          Text('Evidence Capture', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800)),
        ]),
        const SizedBox(height: 8),
        Text('Mission ID: #${widget.alert['id']}', style: GoogleFonts.inter(color: kMuted, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 24),
        
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Geo-Tagged Site Proofs', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13, color: kText)),
            Text('${_images.length} / 3 Captured', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 11, color: _images.length >= 3 ? kAccent : kPrimary)),
          ],
        ),
        const SizedBox(height: 12),
        
        // Tactical Photo Grid
        SizedBox(
          height: 100,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              ..._images.asMap().entries.map((entry) {
                int idx = entry.key;
                XFile img = entry.value;
                return Container(
                  width: 100,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: kBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: kAccent, width: 2),
                    image: DecorationImage(
                      image: File(img.path).existsSync() 
                        ? FileImage(File(img.path)) as ImageProvider
                        : NetworkImage(img.path), 
                      fit: BoxFit.cover
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: 4, right: 4,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(color: kAccent, shape: BoxShape.circle),
                          child: const Icon(LucideIcons.check, color: Colors.white, size: 10),
                        ),
                      ),
                      Align(
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          width: double.infinity,
                          color: Colors.black54,
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Text('PHOTO ${idx + 1}', textAlign: TextAlign.center, style: GoogleFonts.inter(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900)),
                        ),
                      ),
                    ],
                  ),
                );
              }),
              if (_images.length < 3)
                InkWell(
                  onTap: _pickImage,
                  child: Container(
                    width: 100,
                    decoration: BoxDecoration(
                      color: kPrimary.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: kPrimary.withOpacity(0.2), style: BorderStyle.solid),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.camera, color: kPrimary, size: 28),
                        const SizedBox(height: 4),
                        Text('CAPTURE', style: GoogleFonts.inter(color: kPrimary, fontSize: 9, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
        
        const SizedBox(height: 24),
        _input('Field Observation Notes', _notesCtrl, 3),
        const SizedBox(height: 16),
        _input('Required Action Plan', _planCtrl, 2),
        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: (_loading || _images.isEmpty) ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: kPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: _loading 
              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.shieldCheck, size: 18),
                    const SizedBox(width: 10),
                    Text('Finalize & Submit Report', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14, letterSpacing: 0.5)),
                  ],
                ),
          ),
        ),
      ])),
    );
  }

  Widget _input(String lbl, TextEditingController c, int lines) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(lbl, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
    const SizedBox(height: 8),
    TextField(
      controller: c, maxLines: lines,
      style: GoogleFonts.inter(fontSize: 14),
      decoration: InputDecoration(
        filled: true, fillColor: kBg,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.all(12),
      ),
    ),
  ]);
}
