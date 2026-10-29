"""
Base test case with database isolation guard.
Guarantees that test fixtures and executions refuse to run against any non-test database.
"""
from django.test import TestCase, TransactionTestCase
from django.db import connection
from rest_framework.test import APITestCase


class DatabaseGuardMixin:
    """
    Guard that verifies tests are running exclusively against an isolated test database.
    Refuses to execute if connected to a production or development database (e.g. 'govland', 'land_records').
    """
    _env_reported = False

    @classmethod
    def setUpClass(cls):
        db_name = connection.settings_dict.get('NAME', '')
        db_host = connection.settings_dict.get('HOST', 'localhost')
        db_port = connection.settings_dict.get('PORT', '5432')
        if not db_name.startswith('test_'):
            raise RuntimeError(
                f"[DATABASE GUARD BLOCKED] Refusing to run tests against non-test database '{db_name}'! "
                "Tests must run against an isolated database prefixed with 'test_' to protect production/development data."
            )
        super().setUpClass()
        if not DatabaseGuardMixin._env_reported:
            with connection.cursor() as cursor:
                cursor.execute("SELECT postgis_full_version();")
                postgis_ver = cursor.fetchone()[0]
            print(f"\n[TEST SUITE DB CONNECTION] Host: {db_host} | Port: {db_port} | Database: {db_name}")
            print(f"[TEST SUITE POSTGIS VERSION] {postgis_ver}\n")
            DatabaseGuardMixin._env_reported = True


class SafeTestCase(DatabaseGuardMixin, TestCase):
    """Django TestCase with strict test-database verification guard."""
    pass


class SafeTransactionTestCase(DatabaseGuardMixin, TransactionTestCase):
    """Django TransactionTestCase for tests involving multi-threading and real database commit boundaries."""
    pass


class SafeAPITestCase(DatabaseGuardMixin, APITestCase):
    """DRF APITestCase with strict test-database verification guard."""
    pass
