import urllib.request
import urllib.parse
import json
from django.conf import settings


class TNGISService:
    """
    Centralized service to interact with official TNGIS Generic APIs using built-in urllib.
    Zero external dependencies required.
    TNGIS_DEMO_MODE is disabled by default in production.
    When enabled for offline simulation/prototyping, responses explicitly attach:
    - 'demo': True
    - 'honesty_badge': 'DEMO/SYNTHETIC'
    and boundary checks are evaluated deterministically against local PostGIS geometries (no random numbers).
    """

    BASE_URL = "https://tngis.tn.gov.in/apps/generic_api"
    ALT_URL = "https://tngis.tnega.org/generic_api"
    APP_NAME = "GEOMMAND-Statewide"

    @classmethod
    def _make_request(cls, url, method="POST", data=None, params=None):
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            return {
                "status": 0,
                "message": "Demo Mode Active - Live TNGIS Request Skipped",
                "demo": True,
                "honesty_badge": "DEMO/SYNTHETIC"
            }

        full_url = url
        if params:
            query_string = urllib.parse.urlencode(params)
            full_url = f"{url}?{query_string}"

        headers = {
            "X-APP-NAME": cls.APP_NAME,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        try:
            req_data = None
            if data:
                req_data = urllib.parse.urlencode(data).encode('utf-8')

            req = urllib.request.Request(full_url, data=req_data, headers=headers, method=method)

            with urllib.request.urlopen(req, timeout=10) as response:
                res_json = json.loads(response.read().decode('utf-8'))
                if isinstance(res_json, dict):
                    res_json["demo"] = False
                return res_json
        except Exception as e:
            return {
                "status": 0,
                "message": f"TNGIS Connection Error: {str(e)}",
                "demo": False
            }

    @classmethod
    def get_attributes(cls, latitude, longitude, layer_id=29, case="gis_attributes", buffer_distance=None):
        """
        Retrieves administrative attributes for given coordinates.
        In Demo Mode: returns structured synthetic attributes with demo: True.
        """
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            return {
                "success": 1,
                "Districts": {
                    "district_name": "Salem",
                    "district_lgd_code": "608",
                    "state_name": "Tamil Nadu"
                },
                "layer_id": layer_id,
                "latitude": latitude,
                "longitude": longitude,
                "demo": True,
                "honesty_badge": "DEMO/SYNTHETIC"
            }

        url = f"{cls.BASE_URL}/v1/attributes"
        data = {
            "case": case,
            "latitude": str(latitude),
            "longitude": str(longitude),
            "layer_id": str(layer_id)
        }
        if buffer_distance and case == "multi_feature_gis_attributes":
            data["buffer_distance"] = str(buffer_distance)

        return cls._make_request(url, data=data)

    @classmethod
    def get_admin_dropdown(cls, case, district=None, taluk=None, filter_code="lgd_code"):
        """
        Retrieves administrative hierarchy dropdowns.
        In Demo Mode: returns explicit mock data with demo: True.
        """
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            if case == "district":
                return [{
                    "success": 1,
                    "data": [
                        {"district_name": "Salem", "lgd_code": "608"},
                        {"district_name": "Coimbatore", "lgd_code": "605"},
                        {"district_name": "Chennai", "lgd_code": "603"}
                    ],
                    "demo": True,
                    "honesty_badge": "DEMO/SYNTHETIC"
                }]
            if case == "taluk":
                return [{
                    "success": 1,
                    "data": [
                        {"taluk_name": "Salem West", "lgd_code": "5731"},
                        {"taluk_name": "Coimbatore North", "lgd_code": "5722"}
                    ],
                    "demo": True,
                    "honesty_badge": "DEMO/SYNTHETIC"
                }]
            return [{"success": 1, "data": [], "demo": True, "honesty_badge": "DEMO/SYNTHETIC"}]

        url = f"{cls.BASE_URL}/v1/getAdminDropDown"
        data = {
            "case": case,
            "filter_code": filter_code
        }
        if district:
            data["district"] = str(district)
        if taluk:
            data["taluk"] = str(taluk)

        return cls._make_request(url, data=data)

    @classmethod
    def get_extent(cls, init_level=3, filter_code="lgd_code", district="", taluk="", village=""):
        """
        Retrieves geographic bounding extent for zoom positioning.
        """
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            return {
                "success": 1,
                "extent": [78.0, 11.5, 78.3, 11.8],
                "demo": True,
                "honesty_badge": "DEMO/SYNTHETIC"
            }

        url = f"{cls.BASE_URL}/v1/get_extent"
        params = {
            "initLevel": init_level,
            "filter_code": filter_code,
            "district": district,
            "taluk": taluk,
            "village": village
        }
        return cls._make_request(url, method="GET", params=params)

    @classmethod
    def check_inside_boundary(cls, latitude, longitude, layer_id, attribute_column=None, attribute_value=None):
        """
        Checks whether coordinates fall within a designated boundary.
        Zero coin flips or random numbers: in Demo Mode, evaluates deterministically
        against local PostGIS LandParcel geometries.
        """
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            try:
                from django.contrib.gis.geos import Point
                from .models import LandParcel

                pt = Point(float(longitude), float(latitude), srid=4326)
                qs = LandParcel.objects.filter(geom__contains=pt)
                if attribute_column and attribute_value:
                    if attribute_column == "classification":
                        qs = qs.filter(classification__icontains=attribute_value)
                    elif attribute_column == "district":
                        qs = qs.filter(district__iexact=attribute_value)

                matched = qs.first()
                is_inside = matched is not None
                return {
                    "success": 1 if is_inside else 0,
                    "status": 1 if is_inside else 0,
                    "is_inside": is_inside,
                    "matched_parcel_id": matched.id if matched else None,
                    "matched_survey": f"{matched.survey_number}/{matched.subdivision or '1'}" if matched else None,
                    "message": "Deterministic local boundary evaluation (TNGIS Demo Mode)",
                    "demo": True,
                    "honesty_badge": "DEMO/SYNTHETIC"
                }
            except Exception as e:
                return {
                    "success": 0,
                    "status": 0,
                    "is_inside": False,
                    "message": f"Deterministic local evaluation error: {str(e)}",
                    "demo": True,
                    "honesty_badge": "DEMO/SYNTHETIC"
                }

        url = f"{cls.BASE_URL}/v1/inside_boundary"
        data = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "layer_id": str(layer_id)
        }
        if attribute_column:
            data["attribute_column"] = str(attribute_column)
        if attribute_value:
            data["attribute_value"] = str(attribute_value)

        return cls._make_request(url, data=data)

    @classmethod
    def get_nearest_feature(cls, latitude, longitude, layer_id, feature_count=1):
        """
        Finds the nearest cadastral feature to the given coordinates.
        """
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            return {
                "success": 1,
                "features": [{"name": "Indicative Cadastral Baseline", "distance": "150m"}],
                "demo": True,
                "honesty_badge": "DEMO/SYNTHETIC"
            }

        url = f"{cls.BASE_URL}/v1/nearest_feature"
        data = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "layer_id": str(layer_id),
            "feature_count": str(feature_count)
        }
        return cls._make_request(url, data=data)
