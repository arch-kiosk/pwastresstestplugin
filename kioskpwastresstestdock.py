from kioskrepositorytypes import TYPE_KIOSK_WORKSTATION
from kioskworkstation import KioskDock


class KioskPWAStressTestDock(KioskDock):
    @property
    def description(self):
        pass

    @property
    def state_text(self):
        pass

    @property
    def state_description(self):
        pass

    @property
    def icon_url(self):
        pass

    @property
    def icon_code(self):
        pass

    def load_workstation(self) -> bool:
        pass

    def after_synchronization(self) -> bool:
        pass

    @classmethod
    def register_types(cls, type_repository):
        type_repository.register_type(TYPE_KIOSK_WORKSTATION, cls.__name__, cls)
        return True

    @classmethod
    def get_readable_name(cls):
        return "Reporting"

    @classmethod
    def get_supported_workstation_types(cls):
        return {cls.__name__: "ReportingDock"}
