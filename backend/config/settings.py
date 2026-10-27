"""
Django settings for GEOMMAND project.

All sensitive and environment-specific values are read from environment variables.
Copy backend/.env.example → backend/.env and populate before running.

Django 6.0.4 / DRF 3.16.1 / GeoDjango with PostGIS backend.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-#l(d4tazr^)es&#+vl4w(t1mue11(jc-oha&^18tkqu(39f_bb'  # dev fallback only
)
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('1', 'true', 'yes')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# ── GeoDjango native library paths (env-driven; no Windows paths committed) ───
# In Docker/Linux these are auto-discovered; set only when running natively on Windows.
_gdal_env = os.environ.get('GDAL_LIBRARY_PATH', '').strip()
_geos_env = os.environ.get('GEOS_LIBRARY_PATH', '').strip()
if _gdal_env:
    GDAL_LIBRARY_PATH = _gdal_env
if _geos_env:
    GEOS_LIBRARY_PATH = _geos_env

# Windows QGIS auto-discovery fallback (only activates when env vars are NOT set
# and we ARE on Windows — keeps Docker images clean).
import sys
if sys.platform == 'win32' and not _gdal_env:
    _qgis_candidates = [
        r'C:\Program Files\QGIS 4.0.1\bin',
        r'C:\Program Files\QGIS 3.34\bin',
        r'C:\OSGeo4W\bin',
    ]
    for _qgis_dir in _qgis_candidates:
        if os.path.exists(_qgis_dir):
            try:
                os.add_dll_directory(_qgis_dir)
            except Exception:
                pass
            os.environ['PATH'] = _qgis_dir + ';' + os.environ.get('PATH', '')
            for _dll in ['gdal312.dll', 'gdal311.dll', 'gdal310.dll', 'gdal308.dll', 'gdal.dll']:
                _gdal_path = os.path.join(_qgis_dir, _dll)
                if os.path.exists(_gdal_path):
                    GDAL_LIBRARY_PATH = _gdal_path
                    break
            _geos_path = os.path.join(_qgis_dir, 'geos_c.dll')
            if os.path.exists(_geos_path):
                GEOS_LIBRARY_PATH = _geos_path
            break

# ── Application definition ────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    'rest_framework',
    'rest_framework_gis',
    'corsheaders',
    'django_filters',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Database ─────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ.get('DB_NAME', 'land_records'),
        'USER': os.environ.get('DB_USER', 'landuser'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'landpassword'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'True').lower() in ('1', 'true', 'yes')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_HEADERS = True

# ── Upload limits: 50 MB for mobile field photo payloads ─────────────────────
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800

# ── Auth / DRF ────────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

REST_FRAMEWORK = {
    # Phase 0: unauthenticated — remove AllowAny in Phase 1 (JWT auth sprint)
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}

# ── Internationalisation ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ── Static files ──────────────────────────────────────────────────────────────
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── TNGIS Integration ─────────────────────────────────────────────────────────
# Set to False once official API credentials are obtained from CLA / TNeGA.
TNGIS_DEMO_MODE = os.environ.get('TNGIS_DEMO_MODE', 'True').lower() in ('1', 'true', 'yes')
