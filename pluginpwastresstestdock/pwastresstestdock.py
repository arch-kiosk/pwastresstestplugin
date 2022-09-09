from werkzeug import datastructures

import kioskstdlib
import urapdatetimelib
from dsd.dsd3 import DataSetDefinition
from dsd.dsd3singleton import Dsd3Singleton
from dsd.dsdview import DSDView
from kiosksqldb import KioskSQLDb
from recordingworkstation import RecordingWorkstation


class PWAStressTestDock(RecordingWorkstation):
    def _get_workstation_dsd(self) -> DataSetDefinition:
        """
        returns a view on the master dsd for this workstation
        :return: a DataSetDefinition
        """
        dsd = Dsd3Singleton.get_dsd3()
        dsd_workstation_view = DSDView(dsd)
        dsd_workstation_view.apply_view_instructions({"config":
                                                          {"format_ver": 3},
                                                      "tables": ["include_tables_with_instruction('replfield_uuid')",
                                                                 "include_tables_with_flag('filemaker_recording')",
                                                                 "exclude_field('images', 'filename')",
                                                                 "exclude_field('images', 'md5_hash')",
                                                                 "exclude_field('images', 'image_attributes')"
                                                                 ]})
        return dsd_workstation_view.dsd

    def upload_file(self, file: datastructures.FileStorage) -> bool:
        pass

    @classmethod
    def get_workstation_type(cls) -> str:
        return "pwastresstestdock"

    def on_synchronized(self):
        pass

    def get_and_init_files_dir(self, direction="import", init=True):
        pass

    def get_images_records(self) -> list[dict[str, str]]:
        result = []
        records = KioskSQLDb.get_records(f"""
                {'select'} distinct image_transfer.uid_file, image_transfer.resolution, images.modified
                from {KioskSQLDb.sql_safe_namespaced_table(self._id, f'{self._id}_fm_image_transfer')} image_transfer
                inner join images on image_transfer.uid_file = images.uid
                where image_transfer.resolution <> 'dummy' and not image_transfer.disabled
                """)
        for r in records:
            result.append({"uid": r[0], "res": r[1], "modified": kioskstdlib.iso8601_to_str(r[2])})

        return result
