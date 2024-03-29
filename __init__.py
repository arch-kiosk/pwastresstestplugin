# *******************************************
# kioskreportingdockplugin.__init__.py
#
# ********************************************
import logging
import sys
from typing import List, Union, Tuple

import kioskglobals
from .kioskpwastresstestdock import KioskPWAStressTestDock

if "mcpcore.mcpworker" not in sys.modules:
    from flask_allows import guard_entire

    from core.authorization import IsAuthorized, ENTER_ADMINISTRATION_PRIVILEGE, DOWNLOAD_WORKSTATION, \
        PREPARE_WORKSTATIONS, EDIT_WORKSTATION_PRIVILEGE, INSTALL_PLUGIN
    from core.kioskcontrollerplugin import KioskControllerPlugin
    from kioskmenuitem import KioskMenuItem
    from .pwastresstestdockapi import register_resources
    from .kioskpwastresstestdockcontroller import kioskpwastresstestdock
    from .kioskpwastresstestdockcontroller import plugin_version, init_controller
    from flask_login import current_user

    plugin: KioskControllerPlugin = None


    def instantiate_plugin_object(name, package, init_plugin_configuration={}):
        return KioskControllerPlugin(name, package, plugin_version=plugin_version)


    def init_app(app, api=None):
        if not kioskglobals.get_development_option("webapp_development"):
            kioskpwastresstestdock.before_request(guard_entire([IsAuthorized(DOWNLOAD_WORKSTATION)]))
        app.register_blueprint(kioskpwastresstestdock)
        KioskPWAStressTestDock.register_types(app.type_repository)
        init_controller()

        if api:
            register_api(api)
            return True
        else:
            logging.error("syncmanager/package.init_app: api is None.")
            print("syncmanager/package.init_app - Error: api is None.")
            return False

        return True

    def register_api(api):
        register_resources(api)
        print(f"api /api/kioskpwastresstestdock initialized.")


    def register_plugin_instance(plugin_to_register):
        global plugin
        plugin = plugin_to_register


    def all_plugins_ready():
        global plugin
        if plugin.is_main_index:
            asterisk = "*"
        else:
            asterisk = ""


    def register_index(app):
        pass
        # app.add_url_rule('/', 'get_index', sync_manager_index)


    def register_menus():
        global plugin
        return [
            # KioskMenuItem(name="prepare filemaker workstations",
            #               onclick="kfwGroupAction('kioskfilemakerworkstation.prepare_all')",
            #               endpoint="kioskfilemakerworkstation.prepare_all",
            #               menu_cfg=plugin.get_menu_config(),
            #               is_active=lambda: current_user.fulfills_requirement(
            #                   PREPARE_WORKSTATIONS) if hasattr(current_user,
            #                                                    "fulfills_requirement") else True,
            #               parent_menu="Hub",
            #               order="2010"),
        ]


    def register_global_routes() -> List[Union[str, Tuple[str, str]]]:
        global plugin
        return ["kioskpwastresstestdock.create_kiosk_workstation",
                ("kioskpwastresstestdock.workstation_actions", "/kioskpwastresstestdock/actions"),
                ("kioskpwastresstestdock.edit", "/kioskpwastresstestdock/pwastresstestdock"),
                ]


    def register_global_scripts():
        return {}
        # return {"kioskreportingdock": ["kioskreportingdock.static",
        #                                       "scripts/kioskreportingdockglobal.js", "async"]}
