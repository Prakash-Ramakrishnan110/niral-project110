"""
Django settings for GEOMMAND project.

All sensitive and environment-specific values are read from environment variables.
Copy backend/.env.example → backend/.env and populate before running.

Django 6.0.4 / DRF 3.16.1 / GeoDjango with PostGIS backend.
"""

from pathlib import Path
import os
import sys

BASE_DIR = Path(__file__).resolve().parent.parent

# Load local .env file only when running natively outside Docker
_in_docker = os.environ.get('RUNNING_IN_DOCKER') == '1' or os.path.exists('/.dockerenv')
if not _in_docker:
    _env_file = BASE_DIR / '.env'
    if _env_file.exists():
        with open(_env_file, 'r', encoding='utf-8') as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith('#') and '=' in _line:
                    _k, _v = _line.split('=', 1)
                    os.environ.setdefault(_k.strip(), _v.strip())

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-#l(d4tazr^)es&#+vl4w(t1mue11(jc-oha&^18tkqu(39f_bb'  # dev fallback only
)
# In production (when GEOMMAND_ENV != 'demo'), DEBUG must default to False
_default_debug = 'True' if os.environ.get('GEOMMAND_ENV') == 'demo' else 'False'
DEBUG = os.environ.get('DEBUG', _default_debug).lower() in ('1', 'true', 'yes')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# ── GeoDjango native library paths (env-driven; no Windows paths committed) ───
# In Docker/Linux these are auto-discovered; set only when running natively on Windows.
_gdal_env = os.environ.get('GDAL_LIBRARY_PATH', '').strip()
_geos_env = os.environ.get('GEOS_LIBRARY_PATH', '').strip()

if sys.platform == 'win32':
    if _gdal_env:
        GDAL_LIBRARY_PATH = _gdal_env
        _gdal_dir = str(Path(_gdal_env).parent)
        if os.path.exists(_gdal_dir):
            try:
                os.add_dll_directory(_gdal_dir)
            except Exception:
                pass
            os.environ['PATH'] = _gdal_dir + ';' + os.environ.get('PATH', '')
    if _geos_env:
        GEOS_LIBRARY_PATH = _geos_env
        _geos_dir = str(Path(_geos_env).parent)
        if os.path.exists(_geos_dir):
            try:
                os.add_dll_directory(_geos_dir)
            except Exception:
                pass
            os.environ['PATH'] = _geos_dir + ';' + os.environ.get('PATH', '')


from datetime import timedelta

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
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'axes',
    'core',
]

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
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
    'axes.middleware.AxesMiddleware',
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
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/minute',
        'login': '10/minute',
    },
}

# ── SimpleJWT Configuration ───────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── Django-Axes Configuration ─────────────────────────────────────────────────
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_HTTP_RESPONSE_CODE = 429
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_PARAMETERS = ['username', 'ip_address']


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
