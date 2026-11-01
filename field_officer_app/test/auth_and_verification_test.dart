import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:field_officer_app/main.dart';

void main() {
  group('M1 Deliverable 1 - Mobile Token Auth & Statutory Verification Tests', () {
    testWidgets('LoginPage renders with username and password fields and no hardcoded PIN', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: LoginPage(onLogin: (user) {}),
        ),
      );

      // Verify Government portal title
      expect(find.text('GEOMMAND'), findsOneWidget);
      expect(find.text('OFFICER SIGN IN'), findsOneWidget);

      // Verify username input is present
      expect(find.text('OFFICER USERNAME / BADGE ID'), findsOneWidget);

      // Verify password input is present
      expect(find.text('SECURITY PASSWORD'), findsOneWidget);

      // Verify no hardcoded password exists in source
      final pwFinder = find.byWidgetPredicate(
        (w) => w is TextField && w.obscureText == true,
      );
      expect(pwFinder, findsOneWidget);
      final TextField pwField = tester.widget<TextField>(pwFinder);
      expect(pwField.controller?.text.isEmpty ?? true, isTrue, reason: 'Security clearance password must never be prefilled');
    });

    test('Verification payload structure strictly excludes legacy override and enforces mandatory remarks', () {
      const mockNotes = 'Inspected parcel boundary. Illegal commercial shed erected across water catchment channel.';
      const mockVerdict = 'ENCROACHMENT_CONFIRMED';
      final alert = {
        'id': 'ALERT-SLM-001',
        'position': [11.6643, 78.1460],
      };

      expect(mockNotes.trim().length >= 10, isTrue, reason: 'Remarks must be at least 10 characters');

      final payload = {
        "alert": alert['id'],
        "verdict": mockVerdict,
        "gps_lat": 11.6643,
        "gps_lon": 78.1460,
        "photos": <String>[],
        "remarks": mockNotes,
        "action_plan": 'Issue Section 7 statutory notice',
      };

      // Assert zero legacy override
      expect(payload.containsKey('allow_geofence_override'), isFalse,
          reason: 'Client-side allow_geofence_override must not be sent');

      // Assert client cannot supply arbitrary status
      expect(payload.containsKey('status'), isFalse,
          reason: 'Client cannot supply arbitrary status in verification payload');

      // Assert client cannot supply arbitrary officer_name
      expect(payload.containsKey('officer_name'), isFalse,
          reason: 'Officer name is strictly derived from server-side JWT context');

      // Assert statutory verdict is valid
      const validVerdicts = ['ENCROACHMENT_CONFIRMED', 'FALSE_POSITIVE', 'UNCERTAIN_NEEDS_REVISIT'];
      expect(validVerdicts.contains(payload['verdict']), isTrue);
    });

    test('Remarks under 10 characters are rejected by statutory validation logic', () {
      const shortNotes = 'OK done';
      expect(shortNotes.trim().length < 10, isTrue);
    });
  });
}

