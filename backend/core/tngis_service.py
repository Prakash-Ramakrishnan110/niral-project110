import urllib.request
import urllib.parse
import json

class TNGISService:
    """
    Centralized service to interact with TNGIS Generic APIs using built-in urllib.
    No external dependencies required.
    """
    
    BASE_URL = "https://tngis.tnega.org/generic_api"
    ALT_URL = "https://tngis.tn.gov.in"
    APP_NAME = "GeoCommand-Salem"

    @classmethod
    def _make_request(cls, url, method="POST", data=None, params=None):
        """
        Helper to make HTTP requests using urllib.
        """
        full_url = url
        if params:
            query_string = urllib.parse.urlencode(params)
            full_url = f"{url}?{query_string}"
            
        headers = {
            "X-APP-NAME": cls.APP_NAME,
            "Content-Type": "application/json"
        }
        
        try:
            req_data = None
            if data:
                req_data = json.dumps(data).encode('utf-8')
            
            req = urllib.request.Request(full_url, data=req_data, headers=headers, method=method)
            
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"TNGIS API Error ({url}): {str(e)}")
            return {"status": 0, "message": f"Connection Error: {str(e)}"}

    @classmethod
    def get_attributes(cls, latitude, longitude, layer_id=29):
        url = f"{cls.BASE_URL}/v1/attributes"
        data = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "layer_id": str(layer_id)
        }
        return cls._make_request(url, data=data)

    @classmethod
    def get_extent(cls, init_level=3, filter_code="lgd_code", district="", taluk="", village=""):
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
        url = f"{cls.BASE_URL}/v1/nearest_feature"
        data = {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "layer_id": str(layer_id),
            "feature_count": str(feature_count)
        }
        return cls._make_request(url, data=data)
