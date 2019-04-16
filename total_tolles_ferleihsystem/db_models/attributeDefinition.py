from .. import DB
from . import STD_STRING_SIZE

__all__=['AttributeDefinition']

class AttributeDefinition (DB.Model):

    __tablename__ = 'AttributeDefinition'

    id = DB.Column(DB.Integer, primary_key=True)
    name = DB.Column(DB.String(STD_STRING_SIZE), unique=True)
    type = DB.Column(DB.String(STD_STRING_SIZE))
    jsonschema = DB.Column(DB.Text)
    visible_for = DB.Column(DB.String(STD_STRING_SIZE))
    deleted_time = DB.Column(DB.Integer, default=None)

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

    @property
    def deleted(self):
        return self.deleted_time is not None

    @deleted.setter
    def deleted(self, value: bool):
        if value:
            self.deleted_time = int(time.time())
        else:
            self.deleted_time = None