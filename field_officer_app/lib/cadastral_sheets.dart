import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter/services.dart';

// ─── EXECUTIVE WHITE DESIGN CONSTANTS ────────────────────────────────────────
const Color _kBg = Color(0xFFF8FAFC);
const Color _kCard = Color(0xFFFFFFFF);
const Color _kBorder = Color(0xFFE2E8F0);
const Color _kPrimary = Color(0xFF1E40AF);
const Color _kTeal = Color(0xFF0F766E);
const Color _kDanger = Color(0xFFDC2626);
const Color _kWarning = Color(0xFFD97706);
const Color _kSuccess = Color(0xFF059669);
const Color _kText = Color(0xFF0F172A);
const Color _kTextSec = Color(0xFF475569);
const Color _kTextMuted = Color(0xFF94A3B8);

// ─── SALEM CADASTRAL PRESETS (4 ROADSIDE TYPES & WATERBODIES) ────────────────
const List<Map<String, dynamic>> kSalemPresets = [
  {
    'id': 'road_nh44',
    'category': 'roadside',
    'typeLabel': 'Type 1: Commercial Shed',
    'title': 'Omalur NH-44 Commercial Shed',
    'title_ta': 'ஓமலூர் NH-44 வணிகக் கொட்டகை',
    'desc': 'Commercial Shed Encroaching Highways RoW',
    'survey': '119',
    'subdivision': '4',
    'lat': 11.7420,
    'lng': 78.0410,
    'zoom': 17.5,
    'classification': 'Roadside',
    'ulpin': '608W11904A7712',
    'area_extent': '0.75 Acre RoW',
    'occupied_extent': '850 sq.ft (RoW Encroachment)',
    'owner_name': 'நெடுஞ்சாலைத்துறை (TN Highways Dept)',
    'g_value': '₹3,400 / sq.ft',
    'village_name': 'Omalur',
    'village_ta': 'ஓமலூர்',
    'taluk': 'Salem',
    'taluk_ta': 'சேலம்',
    'district': 'Salem',
    'district_ta': 'சேலம்',
    'village_lgd_code': '608119',
    'is_occupied': true,
    'adjacent_neighbors': [
      {
        'survey_number': '119/3',
        'patta_number': '488',
        'owner_name': 'திரு. ஆர். சின்னசாமி (R. Chinnasamy)',
        'direction': 'East / RoW Frontage',
        'encroachment_status': 'Encroacher (Shed Overlap)',
        'extent': '1.10 Acres',
        'land_type': 'நஞ்சை'
      }
    ]
  },
  {
    'id': 'road_bypass',
    'category': 'roadside',
    'typeLabel': 'Type 2: Scrap & Mechanic',
    'title': 'Kondalampatti Truck Scrap Yard',
    'title_ta': 'கொண்டலாம்பட்டி பழைய இரும்புக்கடை',
    'desc': 'Commercial Truck Scrap Yard on NH RoW',
    'survey': '76',
    'subdivision': '2B',
    'lat': 11.6215,
    'lng': 78.1340,
    'zoom': 17.5,
    'classification': 'Roadside',
    'ulpin': '608W07602B3319',
    'area_extent': '1.20 Acre RoW',
    'occupied_extent': '1,450 sq.ft (Scrap Yard)',
    'owner_name': 'நெடுஞ்சாலைத்துறை (TN Highways Dept)',
    'g_value': '₹2,800 / sq.ft',
    'village_name': 'Kondalampatti',
    'village_ta': 'கொண்டலாம்பட்டி',
    'taluk': 'Salem South',
    'taluk_ta': 'சேலம் தெற்கு',
    'district': 'Salem',
    'district_ta': 'சேலம்',
    'village_lgd_code': '608076',
    'is_occupied': true,
    'adjacent_neighbors': [
      {
        'survey_number': '76/1',
        'patta_number': '319',
        'owner_name': 'திரு. கே. முனுசாமி (K. Munusamy)',
        'direction': 'North / Highway Margin',
        'encroachment_status': 'Encroacher (Scrap Stored on RoW)',
        'extent': '0.85 Acre',
        'land_type': 'புஞ்சை'
      }
    ]
  },
  {
    'id': 'road_sh79',
    'category': 'roadside',
    'typeLabel': 'Type 3: Compound Wall',
    'title': 'Attur SH-79 Compound Wall',
    'title_ta': 'ஆத்தூர் SH-79 மதில்சுவர் அத்துமீறல்',
    'desc': 'Permanent Compound Wall 12ft inside State Highway',
    'survey': '204',
    'subdivision': '1C',
    'lat': 11.5970,
    'lng': 78.5990,
    'zoom': 17.5,
    'classification': 'Roadside',
    'ulpin': '608W20401C9582',
    'area_extent': '0.90 Acre RoW',
    'occupied_extent': '620 sq.ft (Concrete Wall)',
    'owner_name': 'நெடுஞ்சாலைத்துறை (State Highways)',
    'g_value': '₹1,950 / sq.ft',
    'village_name': 'Attur',
    'village_ta': 'ஆத்தூர்',
    'taluk': 'Attur',
    'taluk_ta': 'ஆத்தூர்',
    'district': 'Salem',
    'district_ta': 'சேலம்',
    'village_lgd_code': '608204',
    'is_occupied': true,
    'adjacent_neighbors': [
      {
        'survey_number': '204/2',
        'patta_number': '582',
        'owner_name': 'திருமதி. எம். கவிதா (M. Kavitha)',
        'direction': 'West / Highway Boundary',
        'encroachment_status': 'Encroacher (Wall 12ft on Highway)',
        'extent': '1.40 Acres',
        'land_type': 'நஞ்சை'
      }
    ]
  },
  {
    'id': 'road_hasthampatti',
    'category': 'roadside',
    'typeLabel': 'Type 4: Footpath Stalls',
    'title': 'Hasthampatti Footpath Stalls',
    'title_ta': 'அஸ்தம்பட்டி நடைபாதை ஆக்கிரமிப்பு',
    'desc': 'Commercial Awning & Stalls on Public Footpath',
    'survey': '45',
    'subdivision': '3',
    'lat': 11.6780,
    'lng': 78.1620,
    'zoom': 18.0,
    'classification': 'Roadside',
    'ulpin': '608W04503A1167',
    'area_extent': '0.40 Acre RoW',
    'occupied_extent': '380 sq.ft (Iron Stalls)',
    'owner_name': 'நெடுஞ்சாலை நபார்டு & மாநகராட்சி',
    'g_value': '₹4,200 / sq.ft',
    'village_name': 'Hasthampatti',
    'village_ta': 'அஸ்தம்பட்டி',
    'taluk': 'Salem West',
    'taluk_ta': 'சேலம் மேற்கு',
    'district': 'Salem',
    'district_ta': 'சேலம்',
    'village_lgd_code': '608045',
    'is_occupied': true,
    'adjacent_neighbors': [
      {
        'survey_number': '45/1',
        'patta_number': '167',
        'owner_name': 'திரு. பி. தர்மலிங்கம் (P. Dharmalingam)',
        'direction': 'South / Footpath Frontage',
        'encroachment_status': 'Encroacher (Stall / Canopy Overlap)',
        'extent': '0.30 Acre',
        'land_type': 'நத்தம்'
      }
    ]
  },
  {
    'id': 'mookaneri',
    'category': 'waterbody',
    'typeLabel': 'Waterbody Basin',
    'title': 'Mookaneri Lake Poramboke',
    'title_ta': 'மூக்கனேரி ஏரி புறம்போக்கு',
    'desc': 'Lake Basin Wall Encroachment by Neighbor Patta 340',
    'survey': '142',
    'subdivision': '1A',
    'lat': 11.6982,
    'lng': 78.1724,
    'zoom': 17.0,
    'classification': 'Waterbody',
    'ulpin': '608W14201A9876',
    'area_extent': '12.40 Acres',
    'occupied_extent': '2,400 sq.ft (Wall Overlap)',
    'owner_name': 'நீர்வளத்துறை (TN Water Resources Dept - PWD)',
    'g_value': '₹2,100 / sq.ft',
    'village_name': 'Kannankurichi',
    'village_ta': 'கன்னங்குறிச்சி',
    'taluk': 'Salem West',
    'taluk_ta': 'சேலம் மேற்கு',
    'district': 'Salem',
    'district_ta': 'சேலம்',
    'village_lgd_code': '608142',
    'is_occupied': true,
    'adjacent_neighbors': [
      {
        'survey_number': '141/2',
        'patta_number': '340',
        'owner_name': 'திரு. ஏ. செல்வம் (A. Selvam)',
        'direction': 'East / Lake Margin',
        'encroachment_status': 'Encroacher (Wall 18m Overlap)',
        'extent': '1.20 Acres',
        'land_type': 'நஞ்சை'
      },
      {
        'survey_number': '143/1',
        'patta_number': '412',
        'owner_name': 'திரு. எஸ். குமார் (S. Kumar)',
        'direction': 'North',
        'encroachment_status': 'Safe (No Overlap)',
        'extent': '0.90 Acre',
        'land_type': 'நஞ்சை'
      }
    ]
  },
  {
    'id': 'suramangalam',
    'category': 'waterbody',
    'typeLabel': 'Govt Commercial',
    'title': 'Suramangalam Govt Land',
    'title_ta': 'சூரமங்கலம் அரசு புறம்போக்கு',
    'desc': 'Commercial Shed Encroachment (Patta 215)',
    'survey': '88',
    'subdivision': '2A',
    'lat': 11.6742,
    'lng': 78.1215,
    'zoom': 17.0,
    'classification': 'Government',
    'ulpin': '608W08802A5541',
    'area_extent': '3.80 Acres',
    'occupied_extent': '1,200 sq.ft',
    'owner_name': 'வருவாய்த்துறை (Revenue Dept)',
    'g_value': '₹2,400 / sq.ft',
    'village_name': 'Suramangalam',
    'village_ta': 'சூரமங்கலம்',
    'taluk': 'Salem West',
    'taluk_ta': 'சேலம் மேற்கு',
    'district': 'Salem',
    'district_ta': 'சேலம்',
    'village_lgd_code': '608088',
    'is_occupied': true,
    'adjacent_neighbors': [
      {
        'survey_number': '88/1',
        'patta_number': '215',
        'owner_name': 'திரு. வி. மணி (V. Mani)',
        'direction': 'South',
        'encroachment_status': 'Encroacher (Shed Overlap)',
        'extent': '0.60 Acre',
        'land_type': 'புஞ்சை'
      }
    ]
  },
  {
    'id': 'mettur',
    'category': 'waterbody',
    'typeLabel': 'Protected Forest',
    'title': 'Mettur Dam Riverbank',
    'title_ta': 'மேட்டூர் காவேரி படுகை',
    'desc': 'Protected State Reserve - 45 Acres Safe',
    'survey': '63',
    'subdivision': '1',
    'lat': 11.7960,
    'lng': 77.7980,
    'zoom': 16.0,
    'classification': 'Protected Forest',
    'ulpin': '608W06301A1100',
    'area_extent': '45.00 Acres',
    'occupied_extent': '0 sq.ft (Safe)',
    'owner_name': 'வனத்துறை (Forest Dept)',
    'g_value': '₹900 / sq.ft',
    'village_name': 'Mettur',
    'village_ta': 'மேட்டூர்',
    'taluk': 'Mettur',
    'taluk_ta': 'மேட்டூர்',
    'district': 'Salem',
    'district_ta': 'சேலம்',
    'village_lgd_code': '608063',
    'is_occupied': false,
    'adjacent_neighbors': []
  }
];

/// Maps any alert or survey number to a full cadastral parcel dataset with neighbors & revenue values.
Map<String, dynamic> resolveCadastralParcel(Map<String, dynamic> alert) {
  final sNum = alert['survey_number']?.toString().split('/')[0] ?? '';
  return kSalemPresets.firstWhere(
    (p) => p['survey'] == sNum,
    orElse: () => {
      'id': 'cadastral_${alert['id'] ?? alert['survey_number'] ?? 'unknown'}',
      'category': 'waterbody',
      'typeLabel': alert['alert_type'] ?? 'Survey Land',
      'title': '${alert['taluk'] ?? 'Salem'} Survey ${alert['survey_number'] ?? '142'}',
      'title_ta': '${alert['taluk'] ?? 'Salem'} சர்வே ${alert['survey_number'] ?? '142'}',
      'desc': 'Survey Boundary ${alert['survey_number'] ?? '142'}',
      'survey': alert['survey_number']?.toString() ?? '142',
      'subdivision': '1B',
      'classification': 'Government Land',
      'ulpin': '608W${alert['survey_number'] ?? '142'}0001',
      'area_extent': '2.10 Acres',
      'occupied_extent': '450 sq.ft',
      'owner_name': 'வருவாய்த்துறை (Government Revenue Dept)',
      'g_value': '₹2,100 / sq.ft',
      'village_name': alert['taluk'] ?? 'Salem',
      'village_ta': 'சேலம்',
      'taluk': alert['taluk'] ?? 'Salem',
      'taluk_ta': 'சேலம்',
      'district': 'Salem',
      'district_ta': 'சேலம்',
      'village_lgd_code': '608101',
      'is_occupied': true,
      'adjacent_neighbors': [
        {
          'survey_number': '${alert['survey_number'] ?? '142'}/2',
          'patta_number': '340',
          'owner_name': 'திரு. ஏ. செல்வம் (A. Selvam)',
          'direction': 'East',
          'encroachment_status': 'Encroacher (Shed Overlap)',
          'extent': '1.20 Acres',
          'land_type': 'நஞ்சை'
        }
      ]
    },
  );
}


// ─── 1. COLLAPSIBLE QUICK DEMO BAR WIDGET ────────────────────────────────────
class SalemQuickDemoBar extends StatefulWidget {
  final Function(Map<String, dynamic>) onSelectPreset;
  const SalemQuickDemoBar({super.key, required this.onSelectPreset});

  @override
  State<SalemQuickDemoBar> createState() => _SalemQuickDemoBarState();
}

class _SalemQuickDemoBarState extends State<SalemQuickDemoBar> {
  bool _isOpen = false;
  String _filter = 'all'; // 'all' | 'roadside' | 'waterbody'
  String? _activeId;

  @override
  Widget build(BuildContext context) {
    if (!_isOpen) {
      return GestureDetector(
        onTap: () => setState(() => _isOpen = true),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: _kCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _kBorder),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.compass, size: 14, color: _kPrimary),
              const SizedBox(width: 6),
              Text(
                'SALEM DEMO BAR',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: _kText),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                decoration: BoxDecoration(
                  color: _kPrimary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${kSalemPresets.length}',
                  style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w900, color: _kPrimary),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(LucideIcons.chevronDown, size: 14, color: _kTextMuted),
            ],
          ),
        ),
      );
    }

    final filtered = kSalemPresets.where((p) {
      if (_filter == 'roadside') return p['category'] == 'roadside';
      if (_filter == 'waterbody') return p['category'] == 'waterbody';
      return true;
    }).toList();

    return Container(
      constraints: const BoxConstraints(maxWidth: 420),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.compass, size: 14, color: _kPrimary),
                  const SizedBox(width: 6),
                  Text(
                    'SALEM QUICK DEMO BAR',
                    style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: _kPrimary),
                  ),
                ],
              ),
              Row(
                children: [
                  _categoryChip('roadside', 'Roadside (4)', _kWarning),
                  const SizedBox(width: 4),
                  _categoryChip('waterbody', 'Waterbody', _kPrimary),
                  const SizedBox(width: 4),
                  _categoryChip('all', 'All', _kText),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () => setState(() => _isOpen = false),
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: _kBg,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: _kBorder),
                      ),
                      child: const Icon(LucideIcons.chevronUp, size: 14, color: _kTextSec),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: filtered.map((p) {
                final isSelected = _activeId == p['id'];
                final isRoad = p['category'] == 'roadside';
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    onTap: () {
                      setState(() => _activeId = p['id']);
                      widget.onSelectPreset(p);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? _kPrimary
                            : (isRoad ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected
                              ? _kPrimary
                              : (isRoad ? const Color(0xFFFCD34D) : _kBorder),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(isRoad ? '🛣️' : '📍', style: const TextStyle(fontSize: 11)),
                          const SizedBox(width: 4),
                          Text(
                            p['title'],
                            style: GoogleFonts.inter(
                              fontSize: 9.5,
                              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                              color: isSelected
                                  ? Colors.white
                                  : (isRoad ? const Color(0xFF78350F) : _kText),
                            ),
                          ),
                          const SizedBox(width: 3),
                          Text(
                            '(${p['survey']})',
                            style: GoogleFonts.inter(
                              fontSize: 8.5,
                              color: isSelected ? Colors.white70 : _kTextMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _categoryChip(String cat, String label, Color accent) {
    final active = _filter == cat;
    return GestureDetector(
      onTap: () => setState(() => _filter = cat),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: active ? accent : _kBg,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: active ? accent : _kBorder),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 8.5,
            fontWeight: FontWeight.w800,
            color: active ? Colors.white : _kTextSec,
          ),
        ),
      ),
    );
  }
}

// ─── 2. TAMIL NILAM PARCEL BOTTOM SHEET ──────────────────────────────────────
void showTamilNilamParcelSheet(
  BuildContext context,
  Map<String, dynamic> parcel,
  Map<String, dynamic> user, {
  VoidCallback? onVerifyField,
}) {
  final role = user['role'] ?? 'VAO';
  final isOccupied = parcel['is_occupied'] == true;
  final neighbors = (parcel['adjacent_neighbors'] as List?) ?? [];

  // Role tailored notice configuration
  final noticeLabel = role == 'VAO'
      ? 'Form 7 Report'
      : (role == 'INSPECTOR' ? 'Notice Endorse' : 'Eviction Notice');

  bool showNeighbors = true;

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setModalState) {
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.88),
          decoration: const BoxDecoration(
            color: _kCard,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, -4)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Deep Teal Official Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF115E59), Color(0xFF0F766E), Color(0xFF0E7490)],
                  ),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(color: Color(0xFF22D3EE), shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'LAND PARCEL INFORMATION',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Text(
                          '(${parcel['lat'] ?? 11.6982}, ${parcel['lng'] ?? 78.1724})',
                          style: GoogleFonts.robotoMono(fontSize: 10, color: Colors.white70),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: const Icon(LucideIcons.x, size: 18, color: Colors.white),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Scrollable Body
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Revenue Grid Box
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _kBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: _kBorder),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Expanded(child: _field('DISTRICT:', '${parcel['district'] ?? 'Salem'} / ${parcel['district_ta'] ?? 'சேலம்'}')),
                                Expanded(child: _field('TALUK:', '${parcel['taluk'] ?? 'Salem West'} / ${parcel['taluk_ta'] ?? 'சேலம் மேற்கு'}')),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(child: _field('VILLAGE:', '${parcel['village_name'] ?? 'Kannankurichi'} / ${parcel['village_ta'] ?? 'கன்னங்குறிச்சி'}')),
                                Expanded(child: _field('VILLAGE LGD:', '${parcel['village_lgd_code'] ?? '608142'} (Rural)')),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // ULPIN Bar
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('ULPIN (BHU-AADHAAR):', style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w900, color: const Color(0xFF166534))),
                                Text(
                                  '${parcel['ulpin'] ?? '608W14201A9876'}',
                                  style: GoogleFonts.robotoMono(fontSize: 11, fontWeight: FontWeight.w800, color: _kText),
                                ),
                              ],
                            ),
                            InkWell(
                              onTap: () {
                                Clipboard.setData(ClipboardData(text: parcel['ulpin'] ?? ''));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('ULPIN copied to clipboard!'), duration: Duration(seconds: 1)),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFF86EFAC)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(LucideIcons.copy, size: 11, color: Color(0xFF166534)),
                                    const SizedBox(width: 4),
                                    Text('Copy', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF166534))),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Survey / SubDiv / Classification
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: _kCard,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _kBorder),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _statBox('SURVEY NO', '${parcel['survey'] ?? parcel['survey_number'] ?? '142'}'),
                            _statBox('SUB DIVISION', '${parcel['subdivision'] ?? '1A'}', color: _kTeal),
                            _statBox('CLASSIFICATION', '${parcel['classification'] ?? 'Government'}', color: _kWarning),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Status Banner
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isOccupied ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isOccupied ? const Color(0xFFFCA5A5) : const Color(0xFF86EFAC)),
                        ),
                        child: Row(
                          children: [
                            Icon(isOccupied ? LucideIcons.alertTriangle : LucideIcons.shieldCheck, color: isOccupied ? _kDanger : _kSuccess, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isOccupied ? '🔴 OCCUPIED / அரசு நில ஆக்கிரமிப்பு' : '🟢 VACANT / ஆக்கிரமிப்பு இல்லை',
                                    style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: isOccupied ? _kDanger : _kSuccess),
                                  ),
                                  Text(
                                    isOccupied
                                        ? '${parcel['occupied_extent'] ?? 'Encroached Area'} boundary breach flagged.'
                                        : 'Total Extent: ${parcel['area_extent'] ?? '12.40 Acres'} · Safe Public Asset.',
                                    style: GoogleFonts.inter(fontSize: 9.5, color: _kTextSec),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Adjacent Neighbors Section
                      if (neighbors.isNotEmpty) ...[
                        GestureDetector(
                          onTap: () => setModalState(() => showNeighbors = !showNeighbors),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFFDE68A)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    const Icon(LucideIcons.users, size: 14, color: Color(0xFF92400E)),
                                    const SizedBox(width: 6),
                                    Text(
                                      'ADJACENT PRIVATE PATTA (${neighbors.length})',
                                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF92400E)),
                                    ),
                                  ],
                                ),
                                Icon(showNeighbors ? LucideIcons.chevronUp : LucideIcons.chevronDown, size: 14, color: const Color(0xFF92400E)),
                              ],
                            ),
                          ),
                        ),
                        if (showNeighbors) ...[
                          const SizedBox(height: 6),
                          ...neighbors.map((n) {
                            final isEncroacher = (n['encroachment_status'] as String? ?? '').contains('Encroacher');
                            return Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isEncroacher ? const Color(0xFFFEF2F2) : _kCard,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: isEncroacher ? const Color(0xFFFECACA) : _kBorder),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Survey ${n['survey_number']} · Patta #${n['patta_number']}',
                                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: _kText),
                                      ),
                                      Text('${n['owner_name']} (${n['direction']})', style: GoogleFonts.inter(fontSize: 9, color: _kTextSec)),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isEncroacher ? const Color(0xFFDC2626) : const Color(0xFF059669),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      isEncroacher ? 'ENCROACHER' : 'SAFE',
                                      style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ],
                    ],
                  ),
                ),
              ),

              // Pinned 5-Button Dock (Pure White)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: const BoxDecoration(
                  color: _kCard,
                  border: Border(top: BorderSide(color: _kBorder)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDFA),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFCCFBF1)),
                      ),
                      child: Center(
                        child: Text(
                          'CLICK ON BELOW ICONS TO VIEW MORE DETAILS',
                          style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w900, color: _kTeal, letterSpacing: 0.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _iconButton(LucideIcons.fileText, 'Patta', const Color(0xFF0F766E), () => showPattaModal(context, parcel)),
                        _iconButton(LucideIcons.compass, 'FMB', const Color(0xFFD97706), () => showFmbModal(context, parcel)),
                        _iconButton(LucideIcons.users, 'Neighbors', const Color(0xFF7C3AED), () => showNeighborsModal(context, parcel)),
                        _iconButton(LucideIcons.indianRupee, 'G-Value', const Color(0xFF059669), () => showGValueModal(context, parcel)),
                        _iconButton(LucideIcons.scale, noticeLabel, const Color(0xFFDC2626), () {
                          showNoticeModal(context, parcel, user, onVerifyField: onVerifyField);
                        }),
                      ],
                    ),
                    if (onVerifyField != null) ...[
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        height: 38,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pop(ctx);
                            onVerifyField();
                          },
                          icon: const Icon(LucideIcons.camera, size: 14, color: Colors.white),
                          label: Text(
                            role == 'VAO' ? 'CAPTURE FIELD GPS PHOTO & SUBMIT' : 'INSPECT & APPROVE TASK',
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _kPrimary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    ),
  );
}

Widget _field(String label, String value) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: _kTextMuted)),
      Text(value, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: _kText), overflow: TextOverflow.ellipsis),
    ],
  );
}

Widget _statBox(String label, String value, {Color? color}) {
  return Column(
    children: [
      Text(label, style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: _kTextMuted)),
      const SizedBox(height: 2),
      Text(value, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: color ?? _kText)),
    ],
  );
}

Widget _iconButton(IconData icon, String label, Color color, VoidCallback onTap) {
  return Expanded(
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2.5),
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: _kCard,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: _kBorder),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(height: 3),
              Text(
                label,
                style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w800, color: _kText),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

// ─── 3. PATTA MODAL (OFFICIAL TAMIL NADU E-CHITTA) ───────────────────────────
void showPattaModal(BuildContext context, Map<String, dynamic> parcel) {
  _showBaseDetailModal(
    context,
    title: 'Tamil Nadu e-Chitta / இ-பட்டா நில உரிமைச் சான்று',
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'தமிழ்நாடு அரசு (GOVERNMENT OF TAMIL NADU)',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: _kText),
            textAlign: TextAlign.center,
          ),
          Text(
            'வருவாய்த்துறை — நில உரிமை பட்டா / சிட்டா நகல் (REVENUE DEPARTMENT)',
            style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w700, color: _kTextSec),
            textAlign: TextAlign.center,
          ),
          Text(
            'CollabLand TN Electronic Land Records | ULPIN: ${parcel['ulpin'] ?? '608W14201A9876'}',
            style: GoogleFonts.robotoMono(fontSize: 8.5, color: _kTextMuted),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: _kBorder),
          const SizedBox(height: 12),
          _tableRow('மாவட்டம் / District', '${parcel['district_ta'] ?? 'சேலம்'} (${parcel['district'] ?? 'Salem'})'),
          _tableRow('வட்டம் / Taluk', '${parcel['taluk_ta'] ?? 'சேலம் மேற்கு'} (${parcel['taluk'] ?? 'Salem West'})'),
          _tableRow('கிராமம் / Village', '${parcel['village_ta'] ?? 'கன்னங்குறிச்சி'} (${parcel['village_name'] ?? 'Kannankurichi'})'),
          _tableRow('புல எண் / Survey No', '${parcel['survey'] ?? parcel['survey_number'] ?? '142'} / ${parcel['subdivision'] ?? '1A'}'),
          _tableRow('நில வகைப்பாடு / Classification', '${parcel['classification'] ?? 'Government'}'),
          _tableRow('விஸ்தீரணம் / Extent', '${parcel['area_extent'] ?? '12.40 Acres'}'),
          _tableRow('உரிமையாளர் / Authority', '${parcel['owner_name'] ?? 'நீர்வளத்துறை (PWD)'}'),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.qrCode, size: 36, color: _kText),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Digitally Verified Document', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: _kText)),
                      Text('Hash: #TN608-FMB-${parcel['survey'] ?? '142'}', style: GoogleFonts.robotoMono(fontSize: 8, color: _kTextMuted)),
                    ],
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('வட்டாட்சியர் / Tahsildar', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: _kText)),
                  Text('சேலம் மாவட்டம்', style: GoogleFonts.inter(fontSize: 8, color: _kTextMuted)),
                ],
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

// ─── 4. FMB MODAL (INTERACTIVE SURVEY CANVAS) ────────────────────────────────
void showFmbModal(BuildContext context, Map<String, dynamic> parcel) {
  _showBaseDetailModal(
    context,
    title: 'Field Measurement Book (FMB) / புல வரைபடம்',
    child: Column(
      children: [
        Container(
          height: 220,
          width: double.infinity,
          decoration: BoxDecoration(
            color: _kCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: _kBorder),
          ),
          child: CustomPaint(
            painter: _FmbSketchPainter(isOccupied: parcel['is_occupied'] == true),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'CollabLand Survey Standards · Scale 1:1000 · Survey #${parcel['survey'] ?? parcel['survey_number'] ?? '142'}/${parcel['subdivision'] ?? '1A'}',
          style: GoogleFonts.robotoMono(fontSize: 8.5, color: _kTextMuted),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF2F2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFFECACA)),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.alertTriangle, size: 16, color: _kDanger),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Encroachment Finding: 18.2m compound wall breach (${parcel['occupied_extent'] ?? '2,400 sq.ft'}) by adjacent Patta #340.',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: _kDanger),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

// ─── 5. NEIGHBORS MODAL (ADJACENT PRIVATE PATTA) ─────────────────────────────
void showNeighborsModal(BuildContext context, Map<String, dynamic> parcel) {
  final neighbors = (parcel['adjacent_neighbors'] as List?) ?? [];
  _showBaseDetailModal(
    context,
    title: 'Adjacent Private Neighbors / பக்கத்து பட்டா விபரங்கள்',
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFFDE68A)),
          ),
          child: Text(
            'Revenue officers cross-reference neighboring private survey numbers to identify which owner crossed the government boundary.',
            style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF92400E)),
          ),
        ),
        const SizedBox(height: 12),
        if (neighbors.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Text('No adjacent private encroachments recorded.', style: GoogleFonts.inter(fontSize: 11, color: _kTextMuted)),
            ),
          )
        else
          ...neighbors.map((n) {
            final isEncroacher = (n['encroachment_status'] as String? ?? '').contains('Encroacher');
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isEncroacher ? const Color(0xFFFEF2F2) : _kCard,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isEncroacher ? const Color(0xFFFCA5A5) : _kBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Survey ${n['survey_number']}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: _kText)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFFCD34D)),
                        ),
                        child: Text('Patta #${n['patta_number']}', style: GoogleFonts.robotoMono(fontSize: 9, fontWeight: FontWeight.w800, color: const Color(0xFF78350F))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text('Owner: ${n['owner_name']}', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w700, color: _kText)),
                  Text('Direction: ${n['direction']}', style: GoogleFonts.inter(fontSize: 9.5, color: _kTextSec)),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Extent: ${n['extent'] ?? '1.20 Acres'}', style: GoogleFonts.inter(fontSize: 9.5, color: _kTextMuted)),
                      Text(
                        n['encroachment_status'] ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: isEncroacher ? _kDanger : _kSuccess,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
      ],
    ),
  );
}

// ─── 6. G-VALUE MODAL (TNREGINET VALUATION) ──────────────────────────────────
void showGValueModal(BuildContext context, Map<String, dynamic> parcel) {
  _showBaseDetailModal(
    context,
    title: 'TNREGINET Guideline Valuation / வழிகாட்டி மதிப்பு',
    child: Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _kCard,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _kBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('REGISTRATION DEPT (TNREGINET)', style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w800, color: _kTextSec)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(4)),
                    child: Text('2026-2027', style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w900, color: const Color(0xFF065F46))),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('Zone: ${parcel['village_name'] ?? 'Salem'} Waterfront / Main Sector', style: GoogleFonts.inter(fontSize: 10, color: _kText)),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Guideline Rate per Sq.Ft:', style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w700, color: _kTextSec)),
                  Text(parcel['g_value'] ?? '₹2,100 / sq.ft', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: _kSuccess)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF2F2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFFECACA)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('FINANCIAL ASSET AT RISK', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: _kDanger)),
              const SizedBox(height: 8),
              _riskRow('Encroached Extent:', parcel['occupied_extent'] ?? '2,400 sq.ft'),
              _riskRow('Guideline Valuation Rate:', parcel['g_value'] ?? '₹2,100 / sq.ft'),
              const Divider(height: 12, color: Color(0xFFFECACA)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Asset Value at Risk:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: _kDanger)),
                  Text('₹50.40 Lakhs', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: _kSuccess)),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

// ─── 7. ROLE-TAILORED NOTICE MODAL ───────────────────────────────────────────
void showNoticeModal(
  BuildContext context,
  Map<String, dynamic> parcel,
  Map<String, dynamic> user, {
  VoidCallback? onVerifyField,
}) {
  final role = user['role'] ?? 'VAO';
  final isRoadside = parcel['classification'] == 'Roadside';
  final neighbor = (parcel['adjacent_neighbors'] as List?)?.isNotEmpty == true
      ? parcel['adjacent_neighbors'][0]
      : {'owner_name': 'திரு. ஆர். சின்னசாமி', 'survey_number': '119/3', 'patta_number': '488'};

  String actTitle;
  String sectionText;
  String authorityTitle;

  if (role == 'VAO') {
    actTitle = 'தமிழ்நாடு நில ஆக்கிரமிப்பு சட்டம், 1905 — படிவம் 7 கள ஆய்வு அறிக்கை';
    sectionText = 'VAO FORM 7 PRELIMINARY INSPECTION REPORT & NOTICE RECOMMENDATION';
    authorityTitle = 'கிராம நிர்வாக அலுவலர் (Village Administrative Officer)';
  } else if (role == 'INSPECTOR') {
    actTitle = isRoadside
        ? 'தமிழ்நாடு நெடுஞ்சாலைகள் சட்டம், 2001 — பிரிவு 28 சரிபார்ப்பு அறிக்கை'
        : 'தமிழ்நாடு நில ஆக்கிரமிப்பு சட்டம், 1905 — பிரிவு 6 ஆக்கிரமிப்பு அகற்றும் பரிந்துரை';
    sectionText = 'REVENUE INSPECTOR (RI) STATUTORY VERIFICATION & NOTICE ENDORSEMENT';
    authorityTitle = 'வருவாய் ஆய்வாளர் (Field Revenue Inspector)';
  } else {
    actTitle = isRoadside
        ? 'தமிழ்நாடு நெடுஞ்சாலைகள் சட்டம், 2001 — பிரிவு 28(2) ஆக்கிரமிப்பு அகற்றும் ஆணை'
        : 'தமிழ்நாடு நில ஆக்கிரமிப்பு சட்டம், 1905 — பிரிவு 6 ஆக்கிரமிப்பு அகற்றும் இறுதி உத்தரவு';
    sectionText = 'TAHSILDAR STATUTORY MAGISTERIAL EVICTION ORDER';
    authorityTitle = 'வட்டாட்சியர் (Tahsildar), சேலம் மாவட்டம்';
  }

  _showBaseDetailModal(
    context,
    title: actTitle,
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDC2626), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Column(
              children: [
                Text(
                  actTitle,
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: _kDanger),
                  textAlign: TextAlign.center,
                ),
                Text(
                  sectionText,
                  style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w800, color: _kTextSec),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: _kBorder),
          const SizedBox(height: 10),
          Text('பெறுநர் (To):', style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.w800, color: _kTextSec)),
          Text('${neighbor['owner_name']}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: _kText)),
          Text('புல எண்: ${neighbor['survey_number']} · பட்டா எண்: ${neighbor['patta_number']}', style: GoogleFonts.inter(fontSize: 9.5, color: _kTextSec)),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: Text(
              'தாங்கள் அரசுக்கு பாத்தியப்பட்ட புல எண் ${parcel['survey'] ?? parcel['survey_number'] ?? '142'}/${parcel['subdivision'] ?? '1A'} இல் சுமார் ${parcel['occupied_extent'] ?? '850 சதுர அடி'} நிலப்பரப்பில் அத்துமீறி ஆக்கிரமிப்பு செய்துள்ளதாக கள ஆய்வில் உறுதி செய்யப்பட்டுள்ளது. எனவே உடனடியாக ஆக்கிரமிப்பினை அகற்ற உத்தரவிடப்படுகிறது.',
              style: GoogleFonts.inter(fontSize: 9.5, color: _kText, height: 1.4),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('தேதி: 11-10-2026\nஇடம்: சேலம்', style: GoogleFonts.inter(fontSize: 8.5, color: _kTextMuted)),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    width: 70,
                    height: 25,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: _kBorder, style: BorderStyle.solid),
                    ),
                    child: Text('[ SEAL ]', style: GoogleFonts.robotoMono(fontSize: 8, color: _kTextMuted)),
                  ),
                  const SizedBox(height: 2),
                  Text(authorityTitle, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w900, color: _kText)),
                ],
              ),
            ],
          ),
          if (onVerifyField != null) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 36,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  onVerifyField();
                },
                icon: const Icon(LucideIcons.camera, size: 14, color: Colors.white),
                label: Text(
                  role == 'VAO' ? 'OPEN CAMERA & SUBMIT FORM 7' : 'ENDORSE & FORWARD TO HQ',
                  style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _kDanger,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ],
      ),
    ),
  );
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
void _showBaseDetailModal(BuildContext context, {required String title, required Widget child}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
      decoration: const BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, -4)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF115E59), Color(0xFF0F766E), Color(0xFF0E7490)],
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w900, color: Colors.white),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: const Icon(LucideIcons.x, size: 18, color: Colors.white),
                ),
              ],
            ),
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: child,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: _kCard,
              border: Border(top: BorderSide(color: _kBorder)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'GEOMMAND Cadastral Intelligence',
                  style: GoogleFonts.robotoMono(fontSize: 9, color: _kTextMuted),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _kText,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: Text('Close', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white)),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

Widget _tableRow(String label, String value) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 9.5, color: _kTextSec)),
        Text(value, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: _kText)),
      ],
    ),
  );
}

Widget _riskRow(String label, String value) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 9.5, color: _kTextSec)),
        Text(value, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: _kText)),
      ],
    ),
  );
}

// ─── FMB SKETCH CUSTOM PAINTER ───────────────────────────────────────────────
class _FmbSketchPainter extends CustomPainter {
  final bool isOccupied;
  _FmbSketchPainter({required this.isOccupied});

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = const Color(0xFFF8FAFC);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // Light grid lines
    final gridPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 0.5;
    for (double x = 0; x < size.width; x += 20) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 20) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final scaleX = size.width / 500;
    final scaleY = size.height / 360;

    // Boundary polygon (A -> B -> C -> D)
    final pA = Offset(80 * scaleX, 70 * scaleY);
    final pB = Offset(420 * scaleX, 60 * scaleY);
    final pC = Offset(400 * scaleX, 280 * scaleY);
    final pD = Offset(110 * scaleX, 290 * scaleY);

    final polyPath = Path()
      ..moveTo(pA.dx, pA.dy)
      ..lineTo(pB.dx, pB.dy)
      ..lineTo(pC.dx, pC.dy)
      ..lineTo(pD.dx, pD.dy)
      ..close();

    final fillPaint = Paint()
      ..color = const Color(0xFF0F766E).withValues(alpha: 0.12)
      ..style = PaintingStyle.fill;
    canvas.drawPath(polyPath, fillPaint);

    final strokePaint = Paint()
      ..color = const Color(0xFF0F766E)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;
    canvas.drawPath(polyPath, strokePaint);

    // Diagonal G-Line (A -> C)
    final gLinePaint = Paint()
      ..color = const Color(0xFF0284C7)
      ..strokeWidth = 1.5;
    canvas.drawLine(pA, pC, gLinePaint);

    // Encroached Area Hatch (Red Overlap)
    if (isOccupied) {
      final eA = pA;
      final eB = Offset(190 * scaleX, 67 * scaleY);
      final eC = Offset(175 * scaleX, 150 * scaleY);
      final eD = Offset(95 * scaleX, 140 * scaleY);

      final encroachPath = Path()
        ..moveTo(eA.dx, eA.dy)
        ..lineTo(eB.dx, eB.dy)
        ..lineTo(eC.dx, eC.dy)
        ..lineTo(eD.dx, eD.dy)
        ..close();

      final eFill = Paint()
        ..color = const Color(0xFFEF4444).withValues(alpha: 0.3)
        ..style = PaintingStyle.fill;
      canvas.drawPath(encroachPath, eFill);

      final eStroke = Paint()
        ..color = const Color(0xFFDC2626)
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke;
      canvas.drawPath(encroachPath, eStroke);
    }

    // Corner Stone Markers
    final stonePaint = Paint()..color = const Color(0xFF0F766E);
    for (var p in [pA, pB, pC, pD]) {
      canvas.drawCircle(p, 4, stonePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
