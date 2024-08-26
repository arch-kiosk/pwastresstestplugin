import logging
import os
from http import HTTPStatus

from flask import Blueprint, request, render_template, redirect, url_for, abort
from flask_allows import requires
from flask_cors import CORS
from flask_login import current_user
from werkzeug.exceptions import HTTPException

import kioskglobals
import kioskstdlib
from authorization import full_login_required, IsAuthorized, DOWNLOAD_WORKSTATION, UPLOAD_WORKSTATION, \
    CREATE_WORKSTATION, PREPARE_WORKSTATIONS, EDIT_WORKSTATION_PRIVILEGE
from authorization import get_local_authorization_strings
from core.kioskcontrollerplugin import get_plugin_for_controller
from kioskfilemanagerbridge import KioskFileManagerBridge
from kiosklib import is_ajax_request, UserError
from kioskresult import KioskResult
from kioskwtforms import kiosk_validate
from mcpinterface.mcpjob import MCPJob
# from plugins.kioskpwastresstestdockplugin import kioskpwastresstestdock, kioskpwastresstestdock
# from plugins.kioskpwastresstestdockplugin.forms.kioskreportingvariablesform import KioskReportingVariablesForm
# from plugins.kioskpwastresstestdockplugin.forms.kioskpwastresstestdockform import kioskpwastresstestdockForm
from plugins.pwastresstestplugin import KioskPWAStressTestDock
from plugins.pwastresstestplugin.forms.kioskpwastresstestform import KioskPWAStressTestForm
from plugins.syncmanagerplugin.kioskworkstationjobs import MCP_SUFFIX_WORKSTATION, JOB_META_TAG_WORKSTATION, \
    JOB_META_TAG_DELETED
from reportingdock import ReportingDock
from reportingdock.reportingengine import ReportingEngine
from synchronization import Synchronization

_plugin_name_ = "kioskpwastresstestdockplugin"
_controller_name_ = "kioskpwastresstestdock"
_url_prefix_ = '/' + _controller_name_
plugin_version = 0.1

kioskpwastresstestdock = Blueprint(_controller_name_, __name__,
                                   template_folder='templates',
                                   static_folder="static",
                                   url_prefix=_url_prefix_)

if kioskglobals.get_development_option("webapp_development"):
    CORS(kioskpwastresstestdock)

LOCAL_PRIVILEGES = {
    CREATE_WORKSTATION: CREATE_WORKSTATION,
    PREPARE_WORKSTATIONS: PREPARE_WORKSTATIONS,
    EDIT_WORKSTATION_PRIVILEGE: EDIT_WORKSTATION_PRIVILEGE
}


# noinspection DuplicatedCode
def init_controller():
    if kioskglobals.get_development_option("webapp_development"):
        kioskglobals.csrf.exempt(kioskpwastresstestdock)


@kioskpwastresstestdock.context_processor
def inject_current_plugin_controller():
    return dict(current_plugin_controller=get_plugin_for_controller(_plugin_name_))


def check_ajax():
    if not (kioskglobals.get_development_option("webapp_development") or is_ajax_request()):
        logging.error(f"kioskpwastresstestdockcontroller: "
                      f"attempt to access endpoint other than by ajax")


@kioskpwastresstestdock.route('create_kiosk_workstation', methods=['GET', 'POST'])
@full_login_required
@requires(IsAuthorized(CREATE_WORKSTATION))
def create_kiosk_workstation():
    recording_groups = KioskPWAStressTestDock.get_recording_groups()
    new_dock_form = KioskPWAStressTestForm("new")
    general_errors = []

    if request.method == "POST":
        general_errors += kiosk_validate(new_dock_form)
        if not general_errors:
            # give some positive feedback!
            if create_pwa_stress_test_dock(new_dock_form, general_errors):
                return redirect(url_for("syncmanager.sync_manager_show"))
    else:
        try:
            if kioskglobals.get_config().default_recording_group:
                new_dock_form.recording_group.data = kioskglobals.get_config().default_recording_group
        except:
            pass

    return render_template('kioskpwastresstestdock.html',
                           new_fm_ws_form=new_dock_form,
                           mode="new",
                           general_errors=general_errors,
                           recording_groups=recording_groups)


def create_pwa_stress_test_dock(form, general_errors: [str]) -> str:
    """
    starts the job to create the dock and returns the job-id in case the start succeeded.
    :param form:
    :param general_errors:
    :return: the job-id or "" in case of error.
    """
    result = ""
    workstation_id = "?"
    try:

        workstation_id = form.workstation_id.data
        if KioskPWAStressTestDock.workstation_id_exists(workstation_id):
            general_errors.append(f"a dock with the id '{workstation_id}' already exists. "
                                  f"Please chose a different id.")
            return result

        try:
            job = MCPJob(kioskglobals.general_store, job_type_suffix=MCP_SUFFIX_WORKSTATION)
            job.set_worker("plugins.pwastresstestplugin.workers.createworkstationworker",
                           "CreateWorkstationWorker")
            job.job_data = {"workstation_id": kioskstdlib.delete_any_of(workstation_id, " *%\"'"),
                            "description": form.description.data,
                            "recording_group": form.recording_group.data
                            }
            job.meta_data = [JOB_META_TAG_WORKSTATION]
            job.queue()
            result = job.job_id
        except BaseException as e:
            logging.error(f"kioskpwastresstestdockcontroller.ws_create: inner exception {repr(e)}")
            general_errors.append(f"Unexpected error when creating dock '{workstation_id}': {repr(e)}."
                                  f"Please try at least once again.")
    except Exception as e:
        logging.error(f"kioskpwastresstestdockcontroller.ws_create: outer exception {repr(e)}")
        general_errors.append(f"Unexpected error when creating dock '{workstation_id}': {repr(e)}."
                              f"Please try at least once again.")

    return result


#
#
# #  **************************************************************
# #  ****    UPLOAD NEW FILEMAKER TEMPLATE
# #  *****************************************************************/
# @kioskpwastresstestdock.route('/trigger_upload', methods=['POST'])
# @full_login_required
# def trigger_upload():
#     """
#         files uploaded to a reporting dock are always stored together in the reporting folder.
#     """
#
#     reporting_path = ReportingEngine.get_reporting_path()
#
#     try:
#         authorized_to = get_local_authorization_strings(LOCAL_PRIVILEGES)
#         if MANAGE_REPORTING not in authorized_to:
#             logging.warning(f"Unauthorized access to kioskpwastresstestdock/trigger_upload "
#                             f"by user {current_user.user_id}")
#             abort(HTTPStatus.UNAUTHORIZED)
#
#         result = KioskResult(message="Unknown error after upload")
#         logging.info(f"kioskpwastresstestdockcontroller: Received new file for reporting from user {current_user.user_id}")
#
#         try:
#             if 'file' in request.files:
#                 file = request.files['file']
#                 cfg = kioskglobals.get_config()
#                 if file and file.filename:
#                     logging.info("kioskpwastresstestdockcontroller: Received file " + file.filename)
#                     filename = kioskstdlib.urap_secure_filename(kioskstdlib.get_filename(file.filename))
#                     file.save(os.path.join(reporting_path, filename))
#                     result.success = True
#                     result.message = f"The file {filename} was successfully uploadeded to reporting."
#                 else:
#                     result.success = False
#                     result.message = "Either file or filename is empty."
#             else:
#                 result.success = False
#                 result.message = "No uploaded file detected."
#         except UserError as e:
#             raise e
#         except BaseException as e:
#             raise UserError(repr(e))
#
#         return result.jsonify()
#     except UserError as e:
#         logging.error(f"kioskpwastresstestdockcontroller.trigger_upload: {repr(e)}")
#         result = KioskResult(message=repr(e))
#         result.message = f"{repr(e)}"
#         result.success = False
#         return result.jsonify()
#     except HTTPException as e:
#         logging.error(f"kioskpwastresstestdockcontroller.trigger_upload: {repr(e)}")
#         raise e
#     except Exception as e:
#         logging.error(f"kioskpwastresstestdockcontroller.trigger_upload: {repr(e)}")
#         abort(HTTPStatus.INTERNAL_SERVER_ERROR)
#

@kioskpwastresstestdock.route('actions/<string:ws_id>', methods=['GET', 'POST'])
@full_login_required
def dock_actions(ws_id: str):
    try:
        check_ajax()

        if not ws_id.strip():
            logging.error(f"kioskpwastresstestdockcontroller.dock_actions: "
                          f"attempt to access endpoint with empty dock")
            abort(HTTPStatus.BAD_REQUEST, f"There was an attempt to access an endpoint with empty dock")

        sync = Synchronization()
        workstation = KioskPWAStressTestDock(ws_id, sync)
        workstation.load_workstation()
        if not workstation.exists:
            abort(HTTPStatus.BAD_REQUEST, "Attempt to load a dock that does not exist")

        return render_template('kioskpwastresstestdockactions.html', ws=workstation)

    except HTTPException as e:
        logging.error(f"kioskpwastresstestdockcontroller.dock_actions: {repr(e)}")
        raise e
    except Exception as e:
        logging.error(f"kioskpwastresstestdockcontroller.dock_actions: {repr(e)}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)


def mcp_workstation_action(worker_module, worker_class, ws_id, privilege="",
                           system_lock=True, meta_data=None, additional_job_data=None) -> KioskResult:
    if meta_data is None:
        meta_data = []
    job_type_name = ".".join([worker_module, worker_class])
    if privilege:
        authorized_to = get_local_authorization_strings(LOCAL_PRIVILEGES)
        if privilege not in authorized_to:
            abort(HTTPStatus.UNAUTHORIZED)

    print(f" \n***** {job_type_name} workstation {ws_id} *****")
    try:
        job = MCPJob(kioskglobals.general_store, job_type_suffix=MCP_SUFFIX_WORKSTATION)
        job.set_worker(worker_module, worker_class)
        job.system_lock = system_lock
        job.job_data = {"workstation_id": ws_id}
        if additional_job_data:
            job.job_data = job.job_data | additional_job_data
        job.user_data = current_user.to_dict()
        job.meta_data = [*meta_data, JOB_META_TAG_WORKSTATION]
        job.queue()
        if job.job_id:
            return KioskResult(success=True)
        else:
            result = KioskResult(message=f"It was not possible to queue the job \"{job_type_name}\"")
            return result
    except BaseException as e:
        s = f"Exception in kioskpwastresstestdockcontroller.mcp_workstation_action for job type {job_type_name}: {repr(e)}"
        logging.error(s)
        result = KioskResult(message=s)
        return result


def get_worker_setting(action: str):
    """
    get the necessary parameters for the worker for a given action
    :param action: a valid action
    :returns a tuple with worker information:
            (module with worker, class name of the worker in that file, needed privilege, lock system?)

    """
    action = action.lower()
    workers = {"fork": ("plugins.pwastresstestplugin.workers.forkworkstationworker",
                        "ForkWorkstationWorker", PREPARE_WORKSTATIONS, False),
               "reset": ("plugins.pwastresstestplugin.workers.resetworkstationworker",
                         "ResetWorkstationWorker", EDIT_WORKSTATION_PRIVILEGE, False),
               "delete": ("plugins.pwastresstestplugin.workers.deleteworkstationworker",
                          "DeleteWorkstationWorker", EDIT_WORKSTATION_PRIVILEGE, False)
               }
    if action not in workers.keys():
        raise UserError("Attempt to trigger an unknown action.")
    return workers[action]


#  **************************************************************
#  ****    trigger action
#  *****************************************************************/
@kioskpwastresstestdock.route('trigger/<string:action>/<string:ws_id>', methods=['POST'])
@full_login_required
def trigger_action(action: str, ws_id: str):
    try:
        print(f"triggered action {action} for dock {ws_id}")
        check_ajax()

        worker_settings = get_worker_setting(action)
        meta_data = []
        if action == "delete":
            meta_data = [JOB_META_TAG_DELETED]
        return mcp_workstation_action(worker_settings[0],
                                      worker_settings[1], ws_id,
                                      privilege=worker_settings[2],
                                      system_lock=worker_settings[3],
                                      meta_data=meta_data).jsonify()
    except UserError as e:
        logging.error(f"kioskpwastresstestdockcontroller.workstation_actions: {repr(e)}")
        result = KioskResult(message=repr(e))
        return result.jsonify()
    except HTTPException as e:
        logging.error(f"kioskpwastresstestdockcontroller.workstation_actions: {repr(e)}")
        raise e
    except Exception as e:
        logging.error(f"kioskpwastresstestdockcontroller.workstation_actions: {repr(e)}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)


#  **************************************************************
#  ****    EDIT
#  *****************************************************************/
@kioskpwastresstestdock.route('/pwastresstestdock/<ws_id>/edit', methods=['GET', 'POST'])
@full_login_required
def psd_edit(ws_id):
    try:
        authorized_to = get_local_authorization_strings(LOCAL_PRIVILEGES)
        if "edit workstation" not in authorized_to:
            abort(HTTPStatus.UNAUTHORIZED)

        if not ws_id:
            abort(HTTPStatus.BAD_REQUEST)
        sync = Synchronization()
        ws = KioskPWAStressTestDock(ws_id, sync)
        if not ws.load_workstation():
            logging.error(f"kioskpwastresstestdock.kfw_edit: Attempt to edit a workstation {ws_id} "
                          f"that does not exist")
            abort(HTTPStatus.BAD_REQUEST, f"Attempt to edit a workstation {ws_id} "
                                          f"that does not exist")

        recording_groups = KioskPWAStressTestDock.get_recording_groups()
        psd_form = KioskPWAStressTestForm("edit")
        general_errors = []

        if request.method == "POST":
            sync_ws = ws._sync_ws
            psd_form.workstation_id.data = sync_ws.get_id()
            general_errors += kiosk_validate(psd_form)
            if not general_errors:
                sync_ws.description = psd_form.description.data
                sync_ws.recording_group = psd_form.recording_group.data
                if sync_ws.save():
                    return redirect(url_for("syncmanager.sync_manager_show"))
                else:
                    general_errors.append("It was not possible to save your changes. Please try again.")
        else:
            sync_ws = ws._sync_ws
            psd_form.recording_group.data = sync_ws.recording_group
            psd_form.workstation_id.data = sync_ws.get_id()
            psd_form.description.data = sync_ws.description

        return render_template('kioskpwastresstestdock.html',
                               new_fm_ws_form=psd_form,
                               mode="edit",
                               general_errors=general_errors,
                               recording_groups=recording_groups)

    except UserError as e:
        logging.error(f"kioskpwastresstestdock.kfw_edit: {repr(e)}")
        result = KioskResult(message=repr(e))
        return result.jsonify()
    except HTTPException as e:
        logging.error(f"kioskpwastresstestdock.kfw_edit: {repr(e)}")
        raise e
    except Exception as e:
        logging.error(f"kioskpwastresstestdock.kfw_edit: {repr(e)}")
        abort(HTTPStatus.INTERNAL_SERVER_ERROR)
