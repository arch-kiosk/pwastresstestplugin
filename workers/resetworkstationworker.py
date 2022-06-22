import logging

from kioskresult import KioskResult
from mcpinterface.mcpjob import MCPJobStatus
from plugins.pwastresstestplugin import KioskPWAStressTestDock
from plugins.syncmanagerplugin.workstationmanagerworker import WorkstationManagerWorker
from synchronization import Synchronization


class ResetWorkstationWorker(WorkstationManagerWorker):

    def worker(self):
        def reset_workstation():
            try:
                logging.debug("KioskPWAStressTestDock/Reset Worker starts")
                self.init_dsd()
                sync = Synchronization()
                ws = KioskPWAStressTestDock(ws_id, sync=sync)
                ws.load_workstation()
                name = ws.description
                self.job.publish_progress(10)
                if ws:
                    rc = ws._sync_ws._set_state(ws._sync_ws.IDLE, commit=True)
                    self.job.publish_progress(100)
                    if rc:
                        result = KioskResult(True)
                        user = None
                        try:
                            user = self.get_kiosk_user()
                        except BaseException as e:
                            logging.error(f"ResetWorkstationWorker.reset_workstation: "
                                          f"Exception when initializing user {repr(e)}")
                    else:
                        result = KioskResult(message=f"workstation.reset failed for dock {name}")
                else:
                    result = KioskResult(message=f"error resetting dock  {name}")
            except Exception as e:
                logging.error("Exception in reset-worker: " + repr(e))
                result = KioskResult(message=f"Exception in reset-worker: {repr(e)}")
                self.job.publish_progress(100)

            logging.debug("reset KioskPWAStressTestDock - worker ends")
            return result

        try:
            if self.job.fetch_status() == MCPJobStatus.JOB_STATUS_RUNNING:
                self.job.publish_progress(0, "processing request...")
                ws_id = self.job.job_data["workstation_id"]
                logging.debug(f"resetting KioskPWAStressTestDock {ws_id}")
                result = reset_workstation()
                self.job.publish_result(result.get_dict())
                if result.success:
                    logging.info(f"job {self.job.job_id}: successful")
                else:
                    logging.info(f"job {self.job.job_id}: failed: {result.message}")
                self.job.set_status_to(MCPJobStatus.JOB_STATUS_DONE)
            else:
                self.job.publish_result(KioskResult(message="Reset KioskPWAStressTestDock cancelled by user.").get_dict())

        except InterruptedError:
            if self.job.progress.get_message():
                self.job.publish_result(KioskResult(self.job.progress.get_message()).get_dict())
            else:
                self.job.publish_result(
                    KioskResult(message="An error occurred. Please refer to the log for details.").get_dict())

        logging.debug("reset KioskPWAStressTestDock - worker ends")



