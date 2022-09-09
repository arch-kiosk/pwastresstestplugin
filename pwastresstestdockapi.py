# from flask_restplus import Namespace, Resource
import logging
from pprint import pprint

from flask import url_for, request
from flask_allows import requires
from authorization import get_local_authorization_strings, EDIT_WORKSTATION_PRIVILEGE, \
    SYNCHRONIZE, PREPARE_WORKSTATIONS, DOWNLOAD_WORKSTATION, UPLOAD_WORKSTATION, CREATE_WORKSTATION, \
    IsAuthorized, get_local_authorization_strings, is_explicitly_authorized

import kioskglobals
import kioskstdlib
from kioskconfig import KioskConfig
from kioskglobals import kiosk_version, kiosk_version_name, get_global_constants, get_config, httpauth
from flask_restful import Resource, abort
from core.kioskapi import KioskApi
from marshmallow import Schema
from api.kioskapi import PublicApiInfo
from marshmallow import Schema, fields, ValidationError

from kioskworkstation import KioskWorkstation
from mcpinterface.mcpconstants import MCPJobStatus
from . import KioskPWAStressTestDock
from plugins.syncmanagerplugin.kiosksyncmanager import KioskSyncManager
# from .kioskworkstationjobs import KioskWorkstationJob, JOB_META_TAG_DELETED, JOB_META_TAG_CREATED
from mcpinterface.mcpconstants import *

API_VERSION = "0.1.0"


def register_resources(api: KioskApi):
    # api.add_resource(V1SyncManagerWorkstations, '/syncmanager/v1/workstations', endpoint='syncmanager-v1-workstations')
    # api.spec.components.schema("SyncManagerWorkstationV1", schema=SyncManagerWorkstationV1)
    # api.spec.components.schema("SyncManagerWorkstationsV1", schema=SyncManagerWorkstationsV1)
    # api.spec.path(resource=V1SyncManagerWorkstations, api=api, app=api.flask_app)
    # 
    # api.add_resource(V1SyncManagerWorkstationJob, '/syncmanager/v1/workstation/<string:ws_id>/job',
    #                  endpoint='syncmanager-v1-workstation-job')
    # api.spec.components.schema("SyncManagerWorkstationActionResultV1", schema=SyncManagerWorkstationActionResultV1)
    # api.spec.path(resource=V1SyncManagerWorkstationJob, api=api, app=api.flask_app)

    V1PWAStressTestDockApiInfo.register(api)
    V1PWAStressTestDock.register(api)


# ************************************************************************************
# /api-info
# ************************************************************************************

class PWAStressTestDockApiInfoV1(PublicApiInfo):
    class Meta:
        fields = (*PublicApiInfo.Meta.fields, "api")
        ordered = True


class V1PWAStressTestDockApiInfo(Resource):
    @classmethod
    def register(cls, api):
        api.add_resource(V1PWAStressTestDockApiInfo, '/pwastresstestdock/v1/api-info',
                         endpoint='pwastresstestdock-v1-api-info')
        api.spec.components.schema("PWAStressTestDockApiInfoV1", schema=PWAStressTestDockApiInfoV1)
        api.spec.path(resource=V1PWAStressTestDockApiInfo, api=api, app=api.flask_app)

    @httpauth.login_required
    def get(self):
        ''' retrieve information about the PWAStressTest api.
            ---
            summary: retrieve information about the synchronization manager api.
            security:
                - jwt: []
            responses:
                '200':
                    description: returns basic information about the api in the body
                    content:
                        application/json:
                            schema: SyncManagerApiInfoV1
                '401':
                    description: authorization failed / unauthorized access
                    content:
                        application/json:
                            schema: LoginError
        '''
        cfg = get_config()
        return PWAStressTestDockApiInfoV1().dump({
            'api': 'pwastresstestdockapi',
            'project': cfg.config["project_id"],
            'project_name': get_global_constants()["project_name"],
            'kiosk_version_name': kiosk_version_name,
            'kiosk_version': kiosk_version,
            'api_version': API_VERSION})


# ************************************************************************************
# /workstation/<ws_id>
# ************************************************************************************

class ApiPWAStressTestDockGetParameter(Schema):
    class Meta:
        fields = ("dock_id",)
        ordered = True

    dockid = fields.Str(required=True)


class ApiPWAStressTestDockGetError(Schema):
    class Meta:
        fields = ("result_msg",)

    result_msg: fields.Str()


class PWAStressTestDockImageRecordV1(Schema):
    class Meta:
        fields = (
            "uid", "res", "modified"
        )

    uid: fields.Str()
    resolution: fields.Str()
    modified: fields.Str()


class PWAStressTestDockV1(Schema):
    class Meta:
        fields = ("dock_status", "image_records")
        ordered = True

    dock_status: fields.Str()
    image_records: fields.List(fields.Nested(PWAStressTestDockImageRecordV1))


class V1PWAStressTestDock(Resource):
    @classmethod
    def register(cls, api):
        api.add_resource(cls, '/pwastresstestdock/v1/dock')
        api.spec.components.schema("ApiPWAStressTestDockGetError", schema=ApiPWAStressTestDockGetError)
        api.spec.components.schema("PWAStressTestDockImageRecordV1", schema=PWAStressTestDockImageRecordV1)
        api.spec.components.schema("PWAStressTestDockV1", schema=PWAStressTestDockV1)
        api.spec.path(resource=cls, api=api, app=api.flask_app)

    @httpauth.login_required
    # @requires(IsAuthorized(EDIT_WORKSTATION_PRIVILEGE))
    def get(self):
        ''' retrieves the information for a single PwaStressTest dock
            ---
            summary: retrieves the information for a single dock
            security:
                - jwt: []
            parameters:
                - in: query
                  name: dock_id
                  schema:
                    type: ApiDockGetParameter
            responses:
                '200':
                    description: returns the information for a single dock
                    content:
                        application/json:
                            schema: PWAStressTestDockV1
                '401':
                    description: authorization failed / unauthorized access
                    content:
                        application/json:
                            schema: LoginError
                '400':
                    description: Bad Request (Usually the dock is not in the required state)
                    content:
                        application/json:
                            schema: ApiPWAStressTestDockGetError
                '404':
                    description: the requested resource does not exist
                    content:
                        application/json:
                            schema: ApiPWAStressTestDockGetError
                '500':
                    description: Something went wrong
                    content:
                        application/json:
                            schema: ApiPWAStressTestDockGetError
        '''
        try:
            print("V1PWAStressTestDock.get")
            print(f"User is {httpauth.current_user().user_id}")
            params = ApiPWAStressTestDockGetParameter().load(request.args)
            cfg = get_config()

            sync_manager = KioskSyncManager(kioskglobals.type_repository)
            result = {}
            dock: KioskWorkstation = sync_manager.get_workstation(params["dock_id"])
            if not dock:
                return ApiPWAStressTestDockGetError().dump({"result_msg": f"dock {params['dock_id']} "
                                                                          f"does not exist."}), 404
            if not isinstance(dock, KioskPWAStressTestDock):
                return ApiPWAStressTestDockGetError().dump({"result_msg": f"dock {params['dock_id']} "
                                                                          f"is not a PWAStressTest dock"}), 400

            state_text: str = dock.state_text
            if "forked" not in state_text:
                return ApiPWAStressTestDockGetError().dump({"result_msg": f"dock {params['dock_id']} "
                                                                          f"is not ready for the connection"}), 400

            result["dock_status"] = dock.state_text
            result["image_records"] = dock.get_image_records()
            return PWAStressTestDockV1().dump(result)

        except BaseException as e:
            try:
                logging.error(f"{self.__class__.__name__}.get: Exception {repr(e)}")
                return ApiPWAStressTestDockGetError().dump({"result_msg": repr(e)}), 500
            except BaseException as e:
                logging.error(f"{self.__class__.__name__}.get: Another Exception {repr(e)}")
