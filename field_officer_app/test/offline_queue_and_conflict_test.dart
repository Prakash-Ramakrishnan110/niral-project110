import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:field_officer_app/main.dart';

void main() {
  group('M1 Deliverable 3 - Offline Queue & HTTP 409 Conflict Resolution Tests', () {
    test('QueuedInspection serializes to JSON with all statutory fields and version', () {
      final queued = QueuedInspection(
        alertId: 'ALERT-001',
        verdict: 'ENCROACHMENT_CONFIRMED',
        gpsLat: 11.6643,
        gpsLon: 78.1460,
        photos: ['evidence/2026/11/photo1.jpg'],
        remarks: 'Permanent concrete boundary wall built across irrigation canal poramboke.',
        actionPlan: 'Serve Form A Section 7 notice',
        expectedVersion: 2,
        queuedAt: DateTime(2026, 11, 1, 10, 30),
      );

      final json = queued.toJson();
      expect(json['alert'], 'ALERT-001');
      expect(json['verdict'], 'ENCROACHMENT_CONFIRMED');
      expect(json['gps_lat'], 11.6643);
      expect(json['gps_lon'], 78.1460);
      expect(json['photos'], ['evidence/2026/11/photo1.jpg']);
      expect(json['remarks'], 'Permanent concrete boundary wall built across irrigation canal poramboke.');
      expect(json['action_plan'], 'Serve Form A Section 7 notice');
      expect(json['expected_version'], 2);
      expect(json['queued_at'], '2026-11-01T10:30:00.000');
    });

    testWidgets('showConcurrencyConflictDialog displays server state and local inspection comparisons', (WidgetTester tester) async {
      bool resolved = false;
      final localPayload = {
        'alert': 'ALERT-001',
        'verdict': 'ENCROACHMENT_CONFIRMED',
        'remarks': 'My on-site finding: active construction continuing.',
      };
      final conflictData = {
        'current_version': 3,
        'current_status': 'SECTION_7_ISSUED',
        'current_resolution_notes': 'Notice issued by Tahsildar.',
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  showConcurrencyConflictDialog(
                    context: context,
                    localPayload: localPayload,
                    conflictData: conflictData,
                    onResolved: () => resolved = true,
                  );
                },
                child: const Text('Open Conflict Dialog'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Conflict Dialog'));
      await tester.pumpAndSettle();

      // Verify conflict dialog header
      expect(find.text('Concurrency Conflict (HTTP 409)'), findsOneWidget);

      // Verify server state section
      expect(find.text('SERVER STATE (Version 3)'), findsOneWidget);
      expect(find.text('Status: SECTION_7_ISSUED'), findsOneWidget);
      expect(find.text('Notes: Notice issued by Tahsildar.'), findsOneWidget);

      // Verify local inspection section
      expect(find.text('YOUR LOCAL INSPECTION'), findsOneWidget);
      expect(find.text('Verdict: ENCROACHMENT_CONFIRMED'), findsOneWidget);
      expect(find.text('Remarks: My on-site finding: active construction continuing.'), findsOneWidget);

      // Verify choice actions
      expect(find.text('Discard Local Draft'), findsOneWidget);
      expect(find.text('Overwrite Server State'), findsOneWidget);

      // Tap Discard Local Draft
      await tester.tap(find.text('Discard Local Draft'));
      await tester.pumpAndSettle();

      // Verify dialog dismissed
      expect(find.text('Concurrency Conflict (HTTP 409)'), findsNothing);
    });
  });
}
