"""
Base test case with database isolation guard.
Guarantees that test fixtures and executions refuse to run against any non-test database.
"""
from django.test import TestCase
from django.db import connection
from rest_framework.test import APITestCase


class DatabaseGuardMixin:
    """
    Guard that verifies tests are running exclusively against an isolated test database.
    Refuses to execute if connected to a production or development database (e.g. 'govland', 'land_records').
    """
    @classmethod
    def setUpClass(cls):
        db_name = connection.settings_dict.get('NAME', '')
        if not db_name.startswith('test_'):
            raise RuntimeError(
                f"[DATABASE GUARD BLOCKED] Refusing to run tests against non-test database '{db_name}'! "
                "Tests must run against an isolated database prefixed with 'test_' to protect production/development data."
            )
        super().setUpClass()


class SafeTestCase(DatabaseGuardMixin, TestCase):
    """Django TestCase with strict test-database verification guard."""
    pass


class SafeAPITestCase(DatabaseGuardMixin, APITestCase):
    """DRF APITestCase with strict test-database verification guard."""
    pass
