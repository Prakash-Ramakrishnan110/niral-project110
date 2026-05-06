import urllib.request
import urllib.parse
import json
from django.conf import settings

class TNGISService:
    """
    Centralized service to interact with TNGIS Generic APIs using built-in urllib.
    No external dependencies required.
    Supports DEMO_MODE for prototype visualization.
    """
    
    BASE_URL = "https://tngis.tn.gov.in/apps/generic_api"
    ALT_URL = "https://tngis.tnega.org/generic_api"
    APP_NAME = "GeoCommand-Salem"

    @classmethod
    def _make_request(cls, url, method="POST", data=None, params=None):
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            return {"status": 0, "message": "Demo Mode Active - Request Skipped"}

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
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"TNGIS API Error ({url}): {str(e)}")
            return {"status": 0, "message": f"Connection Error: {str(e)}"}

    @classmethod
    def get_attributes(cls, latitude, longitude, layer_id=29, case="gis_attributes", buffer_distance=None):
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            # Mock Data for Districts/Attributes
            return {
                "success": 1,
                "Districts": {
                    "district_name": "Salem",
                    "district_lgd_code": "608",
                    "state_name": "Tamil Nadu"
                },
                "layer_id": layer_id,
                "latitude": latitude,
                "longitude": longitude
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
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            if case == "district":
                return [{"success": 1, "data": [{"district_name": "Salem", "lgd_code": "608"}, {"district_name": "Chennai", "lgd_code": "603"}]}]
            if case == "taluk":
                return [{"success": 1, "data": [{"taluk_name": "Salem West", "lgd_code": "5731"}, {"taluk_name": "Mettur", "lgd_code": "5735"}]}]
            return [{"success": 1, "data": []}]

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
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            return {"success": 1, "extent": [78.0, 11.5, 78.3, 11.8]} # Mock BBox for Salem

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
    def check_inside_boundary(cls, latitude, longitude, layer_id, attribute_column, attribute_value):
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            # Simulate a 50% chance of being "inside" for demo purposes
            import random
            is_inside = random.random() > 0.5
            return {"success": 1 if is_inside else 0, "status": 1 if is_inside else 0, "message": "Mock Boundary Check"}

        url = f"{cls.BASE_URL}/v1/inside_boundary"
        data = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "layer_id": str(layer_id),
            "attribute_column": attribute_column,
            "attribute_value": attribute_value
        }
        return cls._make_request(url, data=data)

    @classmethod
    def get_nearest_feature(cls, latitude, longitude, layer_id, feature_count=1):
        if getattr(settings, 'TNGIS_DEMO_MODE', False):
            return {"success": 1, "features": [{"name": "Mock Water Body", "distance": "150m"}]}

        url = f"{cls.BASE_URL}/v1/nearest_feature"
        data = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "layer_id": str(layer_id),
            "feature_count": str(feature_count)
        }
        return cls._make_request(url, data=data)
