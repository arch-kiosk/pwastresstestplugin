import logging

from kioskresult import KioskResult
from mcpinterface.mcpjob import MCPJobStatus
from plugins.pwastresstestplugin import KioskPWAStressTestDock
from plugins.syncmanagerplugin.workstationmanagerworker import WorkstationManagerWorker
from synchronization import Synchronization


class ForkWorkstationWorker(WorkstationManagerWorker):

    def report_progress(self, prg):
        """ ***** sub report_progress ****** """
        status = self.job.fetch_status()
        if status == MCPJobStatus.JOB_STATUS_CANCELLING:
            return False

        if not self.job.check_pulse():
            logging.error("PWAStressTestPlugin / Fork Workstation job timed out.")
            return False

        if "progress" in prg:
            new_progress = 0
            if "topic" in prg:
                if prg["topic"].find("images"):
                    new_progress = 10 + int(prg["progress"] * 80 / 100)
            else:
                new_progress = int(prg["progress"])

            self.job.publish_progress(new_progress, "forking...")

        return True

    def worker(self):
        def fork():
            try:
                logging.debug("PWAStressTestPlugin /Fork Worker starts")
                self.init_dsd()
                sync = Synchronization()
                ws = KioskPWAStressTestDock(ws_id, sync=sync)
                ws.load_workstation()
                name = ws.description
                self.report_progress({"progress": 0, "message": "forking..."})
                if ws:
                    try:
                        user = self.get_kiosk_user()
                    except BaseException as e:
                        raise Exception(f" When initializing user {repr(e)}")
                    rc = ws._sync_ws.transition("FORK", param_callback_progress=self.report_progress)
                    status = self.job.fetch_status()
                    if status == MCPJobStatus.JOB_STATUS_CANCELLING:
                        result = KioskResult(False, "Forking has been cancelled by a user.")
                    else:
                        self.job.publish_progress(100, "Finished.")
                        if rc:
                            result = KioskResult(True)
                        else:
                            result = KioskResult(False, "An error occurred during fork.")
                else:
                    result = KioskResult(message=f"error forking workstation  {name}")
            except Exception as e:
                logging.error("Exception in fork-worker: " + repr(e))
                result = KioskResult(message=f"Exception in fork-worker: {repr(e)}")
                self.job.publish_progress(100)

            logging.debug("fork workstation - worker ends")
            return result

        try:
            if self.job.fetch_status() == MCPJobStatus.JOB_STATUS_RUNNING:
                self.job.publish_progress(0, "processing request...")
                ws_id = self.job.job_data["workstation_id"]
                logging.debug(f"forking pwastresstestdock {ws_id}")
                result = fork()
                self.job.publish_result(result.get_dict())
                if result.success:
                    logging.info(f"job {self.job.job_id}: successful")
                else:
                    logging.info(f"job {self.job.job_id}: failed: {result.message}")
            else:
                self.job.publish_result(KioskResult(message="Fork the stress test dock cancelled by user.").get_dict())

        except InterruptedError:
            if self.job.progress.get_message():
                self.job.publish_result(KioskResult(self.job.progress.get_message()).get_dict())
            else:
                self.job.publish_result(
                    KioskResult(message="An error occurred. Please refer to the log for details.").get_dict())

        logging.debug("PWAStressTestPlugin / fork workstation - worker ends")



