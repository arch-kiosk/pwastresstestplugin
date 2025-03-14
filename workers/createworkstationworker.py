import logging
from mcpinterface.mcpjob import MCPJobStatus
from synchronization import Synchronization
from plugins.syncmanagerplugin.workstationmanagerworker import WorkstationManagerWorker
from plugins.pwastresstestplugin.kioskpwastresstestdock import KioskPWAStressTestDock


class CreateWorkstationWorker(WorkstationManagerWorker):

    def worker(self):

        def create_workstation():

            self.init_dsd()

            sync = Synchronization()
            ws = KioskPWAStressTestDock(workstation_id=ws_id, sync=sync)
            try:
                ws.create_workstation(ws_name=ws_name,
                                      recording_group=recording_group)
                rc = "ok"
            except BaseException as e:
                logging.error(f"{self.__class__.__name__}.worker: {repr(e)}")
                rc = repr(e)
            return rc

        # #########
        # Code of worker function
        # #########
        logging.debug("create workstation - worker starts")

        try:
            if self.job.fetch_status() == MCPJobStatus.JOB_STATUS_RUNNING:
                self.job.publish_progress(0, "processing request...")
                ws_id = self.job.job_data["workstation_id"]
                ws_name = self.job.job_data["description"]
                recording_group = self.job.job_data["recording_group"]

                json_message = create_workstation()
                if json_message == "ok":
                    self.job.publish_result({"success": True})
                    logging.info(f"job {self.job.job_id}: successful")
                else:
                    self.job.publish_result({"success": False,
                                             "message": json_message
                                             })
                self.job.set_status_to(MCPJobStatus.JOB_STATUS_DONE)
            else:
                self.job.publish_result({"success": False,
                                         "message": "Create Workstation cancelled by user."})

        except InterruptedError:
            if self.job.progress.get_message():
                self.job.publish_result({"success": False,
                                         "message": self.job.progress.get_message()
                                         })
            else:
                self.job.publish_result({"success": False,
                                         "message": "An error occurred. Please refer to the log for details."
                                         })

        logging.debug("create workstation - worker ends")
