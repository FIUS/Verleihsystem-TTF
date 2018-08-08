"""
This module contains all API endpoints for the namespace 'attribute_definition'
"""

from flask import request
from flask_restplus import Resource, abort, marshal
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError

from .. import API, satisfies_role
from ..models import ATTRIBUTE_DEFINITION_GET, ATTRIBUTE_DEFINITION_POST, ATTRIBUTE_DEFINITION_PUT, ATTRIBUTE_DEFINITION_VALUES
from ... import DB
from ...login import UserRole
from ...db_models.item import ItemToAttributeDefinition
from ...db_models.attributeDefinition import AttributeDefinition

from ...db_models.tag import TagToAttributeDefinition
from ...db_models.itemType import ItemTypeToAttributeDefinition

PATH: str = '/catalog/attribute_definitions'
ANS = API.namespace('attribute_definition', description='The attribute definitions', path=PATH)


@ANS.route('/')
class AttributeDefinitionList(Resource):
    """
    Attribute definitions root attribute
    """

    @jwt_required
    @API.param('deleted', 'get all deleted attributes (and only these)', type=bool, required=False, default=False)
    @API.marshal_list_with(ATTRIBUTE_DEFINITION_GET)
    # pylint: disable=R0201
    def get(self):
        """
        Get a list of all attribute definitions currently in the system
        """
        test_for = request.args.get('deleted', 'false') == 'true'
        return AttributeDefinition.query.filter(AttributeDefinition.deleted == test_for).order_by(AttributeDefinition.name).all()

    @jwt_required
    @satisfies_role(UserRole.ADMIN)
    @ANS.doc(model=ATTRIBUTE_DEFINITION_GET, body=ATTRIBUTE_DEFINITION_POST)
    @ANS.response(409, 'Name is not Unique.')
    @ANS.response(201, 'Created.')
    # pylint: disable=R0201
    def post(self):
        """
        Add a new attribute definition to the system
        """
        new = AttributeDefinition(**request.get_json())
        try:
            DB.session.add(new)
            DB.session.commit()
            return marshal(new, ATTRIBUTE_DEFINITION_GET), 201
        except IntegrityError as err:
            message = str(err)
            if 'UNIQUE constraint failed' in message:
                abort(409, 'Name is not unique!')
            abort(500)

@ANS.route('/<int:definition_id>/')
class AttributeDefinitionDetail(Resource):
    """
    Single attribute definition attribute
    """

    @jwt_required
    @API.marshal_with(ATTRIBUTE_DEFINITION_GET)
    @ANS.response(404, 'Requested attribute not found!')
    # pylint: disable=R0201
    def get(self, definition_id):
        """
        Get a single attribute definition
        """
        attribute = AttributeDefinition.query.filter(AttributeDefinition.id == definition_id).first()
        if attribute is None:
            abort(404, 'Requested attribute not found!')
        return attribute

    @jwt_required
    @satisfies_role(UserRole.ADMIN)
    @ANS.response(404, 'Requested attribute not found!')
    @ANS.response(204, 'Success.')
    # pylint: disable=R0201
    def delete(self, definition_id):
        """
        Delete a attribute definition
        """
        attribute = AttributeDefinition.query.filter(AttributeDefinition.id == definition_id).first()
        if attribute is None:
            abort(404, 'Requested attribute not found!')

        ttads = TagToAttributeDefinition.query.filter(TagToAttributeDefinition.attribute_definition_id == definition_id).all()
        ittads = ItemTypeToAttributeDefinition.query.filter(ItemTypeToAttributeDefinition.attribute_definition_id == definition_id).all()

        tags = [ ttad.tag for ttad in ttads ]
        types = [ ittad.item_type for ittad in ittads ]

        for tag in tags:
            tag.unassociate_attr_def(definition_id)

        for t in types:
            t.unassociate_attr_def(definition_id)

        #Maybe it's better to not delete the associations like with all other objects. But here this would mean a
        # lot of work on undelte. So for now, all associations of this attribute definition are deleted. -neumantm
        for ttad in ttads:
            DB.session.delete(ttad)

        for ittad in ittads:
            DB.session.delete(ittad)

        attribute.deleted = True
        DB.session.commit()
        return "", 204

    @jwt_required
    @satisfies_role(UserRole.ADMIN)
    @ANS.response(404, 'Requested attribute not found!')
    @ANS.response(204, 'Success.')
    # pylint: disable=R0201
    def post(self, definition_id):
        """
        Undelete a attribute definition
        """
        attribute = AttributeDefinition.query.filter(AttributeDefinition.id == definition_id).first()
        if attribute is None:
            abort(404, 'Requested attribute not found!')
        attribute.deleted = False
        DB.session.commit()
        return "", 204

    @jwt_required
    @satisfies_role(UserRole.ADMIN)
    @ANS.doc(model=ATTRIBUTE_DEFINITION_GET, body=ATTRIBUTE_DEFINITION_PUT)
    @ANS.response(409, 'Name is not Unique.')
    @ANS.response(404, 'Requested attribute not found!')
    # pylint: disable=R0201
    def put(self, definition_id):
        """
        Replace a attribute definition
        """
        attribute = AttributeDefinition.query.filter(AttributeDefinition.id == definition_id).first()
        if attribute is None:
            abort(404, 'Requested attribute not found!')
        attribute.update(**request.get_json())
        try:
            DB.session.commit()
            return marshal(attribute, ATTRIBUTE_DEFINITION_GET), 200
        except IntegrityError as err:
            message = str(err)
            if 'UNIQUE constraint failed' in message:
                abort(409, 'Name is not unique!')
            abort(500)


@ANS.route('/<int:definition_id>/values/')
class AttributeDefinitionValues(Resource):
    """
    The current values of a attribute
    """
    @jwt_required
    @ANS.doc(model=ATTRIBUTE_DEFINITION_VALUES)
    @ANS.response(404, 'Requested attribute not found!')
    # pylint: disable=R0201
    def get(self, definition_id):
        """
        Get all values of this attribute definition
        """
        if AttributeDefinition.query.filter(AttributeDefinition.id == definition_id).first() is None:
            abort(404, 'Requested attribute not found!')

        return [item.value for item in DB.session.query(ItemToAttributeDefinition.value).filter(ItemToAttributeDefinition.attribute_definition_id == definition_id).distinct()]
