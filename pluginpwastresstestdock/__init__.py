import logging

from .pwastresstestdock import PWAStressTestDock
from synchronization import Synchronization
from synchronizationplugin import SynchronizationPlugin


class PluginPWAStressTestDock(SynchronizationPlugin):
    _plugin_version = 0.1

    def all_plugins_ready(self):
        app: Synchronization = self.app
        if app:
            app.type_repository.register_type("Workstation", "PWAStressTestDock", PWAStressTestDock)
        else:
            logging.error("Plugin {} can't connect to app.")
            return False

        logging.debug("plugin for FileMaker Recording ready")
        return True


def instantiate_plugin_object(plugin_candidate, package, init_plugin_configuration={}):
    """ just returns an object of the PluginFileMakerRecording class """
    from .pwastresstestdock import PWAStressTestDock
    return PluginPWAStressTestDock(plugin_candidate, package)

