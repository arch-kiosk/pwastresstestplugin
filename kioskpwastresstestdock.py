import logging
import os
from typing import Union

from flask_login import current_user

import kioskglobals
from authorization import get_local_authorization_strings, EDIT_WORKSTATION_PRIVILEGE, PREPARE_WORKSTATIONS, \
    DOWNLOAD_WORKSTATION, UPLOAD_WORKSTATION, SYNCHRONIZE, MANAGE_USERS, MANAGE_SERVER_PRIVILEGE

from kioskrepositorytypes import TYPE_KIOSK_WORKSTATION
from kioskworkstation import KioskDock
from plugins.pwastresstestplugin.pluginpwastresstestdock import PWAStressTestDock
from synchronization import Synchronization


class KioskPWAStressTestDock(KioskDock):
    PRIVILEGES = {
        EDIT_WORKSTATION_PRIVILEGE: "edit workstation",
        PREPARE_WORKSTATIONS: "prepare workstation",
        DOWNLOAD_WORKSTATION: "download workstation",
        UPLOAD_WORKSTATION: "upload workstation",
        SYNCHRONIZE: "synchronize",
        MANAGE_USERS: "manage file picking",
        MANAGE_SERVER_PRIVILEGE: "manage server",
    }

    # noinspection PyMissingConstructor
    def __init__(self, workstation_id: str, sync: Synchronization = None):
        super().__init__(workstation_id=workstation_id, sync=sync)
        self._sync_ws: Union[None, PWAStressTestDock] = None
        # self._download_upload_status_text: str = ""
        # self._allow_upload: bool = False
        # self._allow_download: bool = False
        # self._upload_has_priority: bool = False
        # self._download_has_priority: bool = False
        # self._authorized_to: List[str] = []
        # self._ws_options: dict = {}
        self._state_text: str = ""
        self._state_description: str = ""
        self._reset_attributes()

    def _reset_attributes(self):
        self._sync_ws = None
        self._download_upload_status_text = ""
        self._authorized_to = []
        self._ws_options = {}
        self._state_text = ""

    @property
    def description(self):
        return self._sync_ws.description

    @property
    def status(self):
        if self._sync_ws:
            return self._sync_ws.state_machine.get_state().upper()
        else:
            return ""

    @property
    def state_text(self):
        return self._state_text

    @property
    def state_description(self):
        return self._state_description

    @property
    def icon_url(self):
        return ""

    @property
    def icon_code(self):
        return "\uf0e7"

    @property
    def recording_group(self) -> str:
        return self._sync_ws.get_recording_group()

    @property
    def exists(self):
        if self._sync_ws:
            return self._sync_ws.exists()

        return False

    def load_workstation(self) -> bool:
        # self._reset_attributes()
        # noinspection PyTypeChecker
        self._sync_ws: PWAStressTestDock = self.sync.get_workstation("PWAStressTestDock", self._id)
        if self._sync_ws:
            self._calc_status_text(self.status)

            return self._sync_ws.exists()
        else:
            return False

    def _calc_status_text(self, status):

        if status == PWAStressTestDock.IDLE:
            self._state_text = "synchronized - needs preparation"
        if status == PWAStressTestDock.READY_FOR_EXPORT:
            self._state_text = "forked - ready for connection"

    def after_synchronization(self) -> bool:
        pass

    @classmethod
    def register_types(cls, type_repository):
        type_repository.register_type(TYPE_KIOSK_WORKSTATION, cls.__name__, cls)
        return True

    @classmethod
    def get_readable_name(cls):
        return "PWAStressTest"

    @classmethod
    def get_supported_workstation_types(cls):
        return {cls.__name__: ["PWAStressTestDock"]}

    def create_workstation(self, ws_name, recording_group) -> bool:
        """
        creates a FileMakerWorkstation by creating the corresponding FileMakerWorkstation class of the sync subsystem
        :param ws_name:  the workstation's description
        :param recording_group:  the workstation's recording group
        :return: True if the workstation was successfully created and loaded.
                 Raises Exceptions on failure
        """
        if not self.sync:
            self.sync = Synchronization()

        cfg = kioskglobals.get_config()
        plugin_path = os.path.join(cfg.resolve_symbols(cfg.kiosk["plugin_path"]), 'pwastresstestplugin')

        ws = self.sync.create_workstation("PWAStressTestDock", self._id, ws_name, recording_group=recording_group)
        if ws:
            if ws.save():
                return self.load_workstation()
            else:
                raise Exception("error saving workstation " + self._id)
        else:
            raise Exception("error creating workstation " + self._id)

    def register_option(self, option_id, option):
        if "warning" not in option:
            option["warning"] = False
        if "low" not in option:
            option["low"] = False
        if "css_id" not in option:
            option["css_id"] = option_id.replace("_", "-")
        self._ws_options[option_id] = option

    def access_granted(self, grant_by_wildcard: bool = True) -> bool:
        """
        returns whether or not the access to this dock is granted at all for the current user.
        :param grant_by_wildcard: FileMakerWorkstations are accessible by default if they have a wildcard
                                    set in grant_access_to. However, if grant_by_wildcard is set to fals they won't.
        :returns: bool
        """

        return (grant_by_wildcard and self._sync_ws.grant_access_to == "*") or \
               current_user.user_id == self._sync_ws.grant_access_to or \
               "prepare workstation" in get_local_authorization_strings(self.get_privileges(), param_user=current_user)

    def register_options(self):
        if not self._ws_options:
            self.register_option("fork_option", {"id": "workstation.fork",
                                                 "caption": "fork",
                                                 "description": "fork recording data",
                                                 "privilege": "prepare workstation",
                                                 "onclick": "psd_action('" + self.id + "', 'Fork', 'fork')"})

            self.register_option("reset_option", {"id": "workstation.reset",
                                                  "caption": "reset dock",
                                                  "description": "reset the dock. Only for admins!",
                                                  "privilege": "edit workstation",
                                                  "low": True,
                                                  "warning": True,
                                                  "onclick": f"psd_action('{self.id}',"
                                                             f"'Reset workstation',"
                                                             f"'reset')"
                                                  })

            self.register_option("delete_option", {"id": "workstation.delete",
                                                   "caption": "delete dock",
                                                   "description": "Admin only! Removes the dock for good.",
                                                   "privilege": "edit workstation",
                                                   "low": True,
                                                   "warning": True,
                                                   "onclick": f"psd_action('{self.id}',"
                                                              f"'Delete workstation',"
                                                              f"'delete')"
                                                   })

            self.register_option("edit_option", {"id": "workstation.edit",
                                                 "caption": "edit dock",
                                                 "description": "edit the dock's rules and properties",
                                                 "privilege": "edit workstation",
                                                 "onclick": "psd_edit('" + self.id +
                                                            "', 'kioskpwastresstestdock.edit')"
                                                 })

    def _get_option(self, option_id):
        if option_id in self._ws_options:
            privilege = self._ws_options[option_id]["privilege"]
            if privilege:
                if privilege not in self._authorized_to:
                    return {}

            return self._ws_options[option_id]
        else:
            logging.error(f"{self.__class__.__name__}._get_option: "
                          f"Attempt to get the unknown workstation option {option_id}.")
            return {}

    def _modify_option(self, option_id, key, value):
        if option_id in self._ws_options:
            self._ws_options[option_id][key] = value
        else:
            logging.error(f"{self.__class__.__name__}._modify_option: "
                          f"Attempt to modify the unknown workstation option {option_id}.")

    def get_options(self, current_plugin_controller=None):
        def add_to_option_list(option, low=False, disabled=False):
            if option:
                if current_plugin_controller:
                    if not current_plugin_controller.is_operation_allowed(option["id"]):
                        return

                option["low"] = low
                if disabled:
                    option["disabled"] = disabled
                option_list.append(option)

        self.register_options()
        option_list = []
        self._authorized_to = get_local_authorization_strings(self.PRIVILEGES, param_user=current_user)

        if self.status == "IDLE":
            add_to_option_list(self._get_option("fork_option"), low=False)

        add_to_option_list(self._get_option("reset_option"), low=True)
        if self.status == "IDLE":
            add_to_option_list(self._get_option("edit_option"), low=True)
        else:
            add_to_option_list(self._get_option("edit_option"), low=True, disabled=True)

        add_to_option_list(self._get_option("delete_option"), low=True)

        return option_list

    def get_priority_options(self, current_plugin_controller=None):
        return [x for x in self.get_options(current_plugin_controller=current_plugin_controller) if not x["low"]]

    def get_low_options(self, current_plugin_controller=None):
        return [x for x in self.get_options(current_plugin_controller=current_plugin_controller) if x["low"]]

    def has_no_next_option_msg(self, current_plugin_controller=None):
        if not self.get_priority_options(current_plugin_controller=current_plugin_controller):
            if self.status == "BACK_FROM_FIELD" and "synchronize" in self._authorized_to:
                return "This workstation is ready for synchronization. " \
                       "As soon as all partaking workstations are in this state, you can start " \
                       "Synchronization from the burger menu or the toolbar."
            else:
                return "This workstation is waiting for the admin. " \
                       "Right now, there is not really anything to do for you here."

    def get_image_records(self) -> list[dict[str, str]]:
        return self._sync_ws.get_images_records()
