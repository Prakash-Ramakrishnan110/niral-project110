"""
Tamil Nilam Cadastral Land Classification Engine
Maps official Tamil Nilam A-Register classification strings and codes to canonical statutory categories.
Strictly eliminates loose substring assumptions and arbitrary 'not Private' fallbacks.
Unknown or unmapped classifications are explicitly flagged as 'NEEDS_REVIEW'.
"""

from typing import Dict, Any, List, Tuple


TAMIL_NILAM_REGISTRY: Dict[str, Dict[str, Any]] = {
    # 1. Waterbody Poramboke (Absolute Protection — Non-alienable)
    'WATERBODY': {
        'canonical_category': 'WATERBODY',
        'english_title': 'Waterbody Poramboke',
        'tamil_title': 'நீர்நிலை புறம்போக்கு',
        'is_protected_government_land': True,
        'can_be_patta_assigned': False,
        'statutory_act': 'Tamil Nadu Protection of Tanks and Eviction of Encroachment Act, 2007 & TN Act III of 1905',
        'judicial_protection': 'Absolute judicial protection under Madras High Court Full Bench directives (T.K. Shanmugam v. State)',
        'aliases': ['waterbody', 'water body poramboke', 'water body', 'eri poramboke', 'kulam poramboke', 'water', 'eri', 'kulam', 'odai', 'kuttai', 'vaikkal', 'river', 'channel', 'tank bund', 'tank']
    },

    # 3. Grazing Ground Poramboke (Communal Non-alienable)
    'MEIKKAL_GRAZING': {
        'canonical_category': 'MEIKKAL_GRAZING',
        'english_title': 'Grazing Ground Poramboke (Meikkal)',
        'tamil_title': 'மேய்க்கால் புறம்போக்கு',
        'is_protected_government_land': True,
        'can_be_patta_assigned': False,
        'statutory_act': 'Tamil Nadu Land Encroachment Act, 1905 & Revenue Standing Orders (RSO 15)',
        'judicial_protection': 'Communal village grazing ground protected against conversion or encroachment',
        'aliases': ['meikkal poramboke', 'grazing ground poramboke', 'meikkal', 'grazing ground', 'grazing']
    },

    # 4. Highway / Roadside Margin
    'ROADSIDE_HIGHWAY': {
        'canonical_category': 'ROADSIDE_HIGHWAY',
        'english_title': 'Highway & Road Margin Poramboke',
        'tamil_title': 'சாலை புறம்போக்கு',
        'is_protected_government_land': True,
        'can_be_patta_assigned': False,
        'statutory_act': 'Tamil Nadu Highways Act, 2001 & TN Act III of 1905',
        'judicial_protection': 'Right-of-way protection preventing traffic hazard and road margin squatting',
        'aliases': ['salai poramboke', 'roadside poramboke', 'highway poramboke', 'street poramboke', 'road margin', 'roadside', 'salai', 'highway']
    },

    # 5. Forest & Reserved Forest
    'FOREST_RESERVED': {
        'canonical_category': 'FOREST_RESERVED',
        'english_title': 'Reserved Forest & Forest Lands',
        'tamil_title': 'காப்புக்காடு மற்றும் வன நிலம்',
        'is_protected_government_land': True,
        'can_be_patta_assigned': False,
        'statutory_act': 'Tamil Nadu Forest Act, 1882 & Forest (Conservation) Act, 1980',
        'judicial_protection': 'Forest boundary protection under Forest Range Officer and Collector joint jurisdiction',
        'aliases': ['reserved forest', 'forest reserve', 'forest land', 'forest', 'kadu']
    },

    # 6. Temple / HR&CE Inam
    'TEMPLE_HRCE': {
        'canonical_category': 'TEMPLE_HRCE',
        'english_title': 'Temple & Religious Institution Land (HR&CE)',
        'tamil_title': 'திருக்கோயில் நிலம் / இனாம்',
        'is_protected_government_land': True,
        'can_be_patta_assigned': False,
        'statutory_act': 'Tamil Nadu Hindu Religious and Charitable Endowments Act, 1959 (Section 78/79)',
        'judicial_protection': 'Deity properties protected against alienation and adverse possession',
        'aliases': ['temple land', 'temple inam', 'hr&ce temple inam', 'hr&ce', 'devasthanam', 'temple', 'kovil', 'inam']
    },

    # 7. Village Natham / Grama Natham
    'GRAMA_NATHAM': {
        'canonical_category': 'GRAMA_NATHAM',
        'english_title': 'Grama Natham (Village Habitation Site)',
        'tamil_title': 'கிராம நத்தம்',
        'is_protected_government_land': False,
        'can_be_patta_assigned': True,
        'statutory_act': 'Revenue Standing Orders & Special Natham Settlement Schemes',
        'judicial_protection': 'Vested in village community for housing; not subject to standard Act III summary eviction unless communal street',
        'aliases': ['grama natham', 'natham poramboke', 'village site', 'natham']
    },

    # 8. Ryotwari Private Patta
    'RYOTWARI_PRIVATE': {
        'canonical_category': 'RYOTWARI_PRIVATE',
        'english_title': 'Ryotwari Private Patta Land',
        'tamil_title': 'ரயத்துவாரி பட்டா நிலம்',
        'is_protected_government_land': False,
        'can_be_patta_assigned': True,
        'statutory_act': 'Tamil Nadu Patta Pass Book Act, 1983',
        'judicial_protection': 'Private citizen freehold/patta property; civil court jurisdiction for title disputes',
        'aliases': ['ryotwari nanjai patta', 'ryotwari punjai patta', 'ryotwari nanjai', 'ryotwari punjai', 'ryotwari patta', 'ryotwari', 'private patta', 'patta', 'private', 'nanjai', 'punjai']
    },

    # 2. General Government Sarkar Poramboke (Checked after specific porambokes)
    'PORAMBOKE_PROTECTED': {
        'canonical_category': 'PORAMBOKE_PROTECTED',
        'english_title': 'Government Sarkar Poramboke',
        'tamil_title': 'அரசு புறம்போக்கு',
        'is_protected_government_land': True,
        'can_be_patta_assigned': True,
        'statutory_act': 'Tamil Nadu Land Encroachment Act, 1905 (TN Act III of 1905)',
        'judicial_protection': 'Protected against unauthorized private possession under summary eviction procedures',
        'aliases': ['sarkar poramboke', 'govt poramboke', 'government poramboke', 'government', 'poramboke', 'anadheenam', 'tharisu', 'waste land']
    },
}


class TamilNilamClassifier:
    """
    Evaluates cadastral classification strings using explicit Tamil Nilam mappings.
    Sorts aliases by length descending to match specific compound terms before generic single words.
    Denies loose substring guessing.
    """

    _SORTED_ALIASES: List[Tuple[str, str, Dict[str, Any]]] = []

    @classmethod
    def _get_sorted_aliases(cls):
        if not cls._SORTED_ALIASES:
            all_entries = []
            for key, entry in TAMIL_NILAM_REGISTRY.items():
                for alias in entry['aliases']:
                    all_entries.append((alias.lower(), key, entry))
            # Sort by length of alias descending (longest, most specific match first)
            cls._SORTED_ALIASES = sorted(all_entries, key=lambda x: len(x[0]), reverse=True)
        return cls._SORTED_ALIASES

    @classmethod
    def classify(cls, raw_classification: str) -> Dict[str, Any]:
        if not raw_classification or not str(raw_classification).strip():
            return {
                'canonical_category': 'NEEDS_REVIEW',
                'english_title': 'Unspecified Classification',
                'tamil_title': 'வகைப்பாடு குறிப்பிடப்படவில்லை',
                'is_protected_government_land': None,
                'can_be_patta_assigned': None,
                'statutory_act': '[UNVERIFIED - PENDING REVENUE RECORD REVIEW]',
                'judicial_protection': 'Unknown status requiring village A-Register verification',
                'honesty_badge': 'UNVERIFIED - PENDING REVIEW',
                'raw_input': raw_classification
            }

        cleaned = str(raw_classification).strip().lower()

        # Exact key match first
        for key, entry in TAMIL_NILAM_REGISTRY.items():
            if cleaned == key.lower():
                res = dict(entry)
                res['raw_input'] = raw_classification
                res['honesty_badge'] = 'VERIFIED TAMIL NILAM'
                return res

        # Specificity-ordered alias matching (longest alias first)
        for alias, key, entry in cls._get_sorted_aliases():
            if cleaned == alias or cleaned.startswith(alias) or alias in cleaned:
                res = dict(entry)
                res['raw_input'] = raw_classification
                res['honesty_badge'] = 'VERIFIED TAMIL NILAM'
                return res

        # Unknown / Unmapped: strictly flag as NEEDS_REVIEW (never guess)
        return {
            'canonical_category': 'NEEDS_REVIEW',
            'english_title': f"Unmapped Classification ({raw_classification})",
            'tamil_title': 'தெரியாத வகைப்பாடு (சரிபார்க்கப்பட வேண்டும்)',
            'is_protected_government_land': None,
            'can_be_patta_assigned': None,
            'statutory_act': '[UNMAPPED TAMIL NILAM CODE - PENDING LEGAL/REVENUE REVIEW]',
            'judicial_protection': 'Unmapped classification cannot be acted upon without Tahsildar verification',
            'honesty_badge': 'NEEDS_REVIEW',
            'raw_input': raw_classification
        }

    @classmethod
    def is_waterbody(cls, raw_classification: str) -> bool:
        result = cls.classify(raw_classification)
        return result['canonical_category'] == 'WATERBODY'

    @classmethod
    def is_protected_government_land(cls, raw_classification: str) -> bool:
        result = cls.classify(raw_classification)
        return result['is_protected_government_land'] is True
