collections_schema = {"type": "array", "items": {"type": "integer"}}

collection_schema = {
    "type": "object",
    "properties": {
        "creator": {
            "type": "string",
        },
        "date": {"type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},
        "edited": {"type": "boolean"},
        "finished": {"type": "boolean"},
        "garden": {"type": "integer"},
        "garden-name": {"type": "string"},
        "id": {"type": "integer"},
        "last-collection-id": {"type": ["integer", "null"]},
        "records": {
            "type": "object",
            "patternProperties": {
                "^[0-9]*$": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "name": {"type": "string"},
                        "order": {"type": "integer"},
                        "done": {"type": "boolean"},
                        "plant": {"type": "string"},
                        "initial-vegetative-growth": {
                            "type": "string",
                            "enum": ["y", "m", "u", "no"],
                        },
                        "young-leaves-unfolding": {
                            "type": "string",
                            "enum": ["y", "m", "u", "no"],
                        },
                        "flowers-opening": {
                            "type": "string",
                            "enum": ["y", "m", "u", "no"],
                        },
                        "peak-flowering": {
                            "type": "string",
                            "enum": ["y", "m", "u", "no"],
                        },
                        "peak-flowering-estimation": {
                            "type": "string",
                            "enum": ["y", "m", "u", "no"],
                        },
                        "flowering-intensity": {"type": ["integer", "string", "null"]},
                        "ripe-fruits": {
                            "type": "string",
                            "enum": ["y", "m", "u", "no"],
                        },
                        "senescence": {"type": "string", "enum": ["y", "m", "u", "no"]},
                        "senescence-intensity": {"type": ["integer", "string", "null"]},
                        "cut-partly": {"type": "boolean"},
                        "cut-total": {"type": "boolean"},
                        "covered-natural": {"type": "boolean"},
                        "covered-artificial": {"type": "boolean"},
                        "transplanted": {"type": "boolean"},
                        "removed": {"type": "boolean"},
                        "remarks": {"type": "string"},
                        "no-observation": {"type": "boolean"},
                    },
                }
            },
        },
        "remaining": {"type": "array", "items": {"type": "integer"}},
        "uploaded": {"type": "boolean"},
    },
    "required": [
        "id",
        "creator",
        "garden",
        "date",
        "records",
        "finished",
    ],
}

date_range_schema = {
    "type": "object",
    "properties": {
        "start_date": {
            "type": ["object", "null"],
            "properties": {
                "year": {"type": "integer"},
                "month": {"type": "integer"},
                "day": {"type": "integer"},
                "string": {
                    "type": "string",
                    "pattern": (
                        "(((19|20)([2468][048]|[13579][26]|0[48])|2000)[/-]02[/-]29|((19|20)[0-9]{2}[/-](0[469]|11)"
                        "[/-](0[1-9]|[12][0-9]|30)|(19|20)[0-9]{2}[/-](0[13578]|1[02])[/-](0[1-9]|[12][0-9]|3[01])"
                        "|(19|20)[0-9]{2}[/-]02[/-](0[1-9]|1[0-9]|2[0-8])))"
                    ),
                },
            },
        },
        "end_date": {
            "type": ["object", "null"],
            "properties": {
                "year": {"type": "integer"},
                "month": {"type": "integer"},
                "day": {"type": "integer"},
                "string": {
                    "type": "string",
                    "pattern": (
                        "(((19|20)([2468][048]|[13579][26]|0[48])|2000)[/-]02[/-]29|((19|20)[0-9]{2}[/-](0[469]|11)"
                        "[/-](0[1-9]|[12][0-9]|30)|(19|20)[0-9]{2}[/-](0[13578]|1[02])[/-](0[1-9]|[12][0-9]|3[01])"
                        "|(19|20)[0-9]{2}[/-]02[/-](0[1-9]|1[0-9]|2[0-8])))"
                    ),
                },
            },
        },
    },
    "required": ["start_date", "end_date"],
}
