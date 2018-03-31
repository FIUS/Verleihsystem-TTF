from .. import db
from . import STD_STRING_SIZE


class AttributeDefinition (db.Model):

    __tablename__ = 'AttributeDefinition'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(STD_STRING_SIZE), unique=True)
    type = db.Column(db.String)
    jsonschema = db.Column(db.Text)
    visible_for = db.Column(db.String)
    deleted = db.Column(db.Boolean, default=False)

    def __init__(self, name: str, type: str, jsonschema: str, visible_for: str):
        self.name = name
        self.type = type
        self.jsonschema = jsonschema
        self.visible_for = visible_for

    def update(self, name: str, type: str, jsonschema: str, visible_for: str):
        self.name = name
        self.type = type
        self.jsonschema = jsonschema
        self.visible_for = visible_for
        