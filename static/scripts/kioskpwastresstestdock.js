/***********************************************************
 *
 * function for the create workstation page
 *
 **********************************************************/
function confirmPage() {
  if (checkRecordingGroup()) {
    submitPage();
  } else {
    kioskYesNoToast("The recording group you entered for this stress test dock does not exist, yet. <br>" +
      "Do you really want to create a new recording group?", () => {
      submitPage();
    })
  }
}

function submitPage() {
  document.getElementById("new-workstation-form").submit();
}

function cancelPage(event) {
  event.preventDefault();
  kioskYesNoToast("Your changes will be lost, are you sure you want to cancel?", () => {
    window.location.replace(getRoutefor("syncmanager.sync_manager_show"));
  })
}

function checkRecordingGroup() {
  let recordingGroup = document.getElementById("recording-group").value.toLowerCase();
  let result = true
  if (recordingGroup) {
    result = false
    let recordingGroups = []
    let options = $("#recording-groups > option")
    options.each(function(index) {
      let v = String(this.value)
      if (v.toLowerCase() === recordingGroup) {
        result = true
      }
    })
  }
  return result
}

function psd_action(ws_id, title, action_url, ack = false, jsonData = {}) {
  console.log(ws_id, title, action_url)
  $("#workstation-options").replaceWith("<div></div>");
  $("#dialog-subtitle").text(title);
  let btClose = $("#bt-close")
  kioskDisableButton(btClose, true)

  let targetUrl = "/kioskpwastresstestdock/trigger/" + action_url + "/" + ws_id

  if (!ack && action_url === "reset") {
    kioskYesNoToast("Are you sure, you want to reset this dock? ",
      () => {
        psd_action(ws_id, title, action_url, true);
      },
      () => {
        $.magnificPopup.close()
      }, {})
    return
  }

  if (!ack && action_url === "delete") {
    kioskYesNoToast("Are you sure, you want to delete this dock? " +
      "<br><span style='font-weight: bold'>You cannot undo this step! </span><br>",
      () => {
        psd_action(ws_id, title, action_url, true);
      },
      () => {
        $.magnificPopup.close()
      }, {})
    return
  }

    kioskSendAjaxCommand("POST", btClose, targetUrl, jsonData,
    (json) => {
      $.magnificPopup.close()
      let message = ""
      if ("message" in json) {
        if (json.message.trim()) kioskSuccessToast(json.message);
      }
    },
    (err_code, json) => {
      $.magnificPopup.close()
      console.log(err_code, json)
      let message = ""
      if ("message" in json) message = ` (${json.message})`
      kioskErrorToast(`It was not possible to start this job${message}. Please try again.`);
      kioskDisableButton(btClose, false)
    })
}

function psd_edit(ws_id, endpoint) {
  const route = getRoutefor(endpoint)
  if ($("#edit-option")[0].hasAttribute("disabled")) {
    kioskErrorToast("This option is disabled in the current state of the dock. Probably it is only available if the " +
      "dock is in mode 'synchronized'.")
  } else {
    console.log(`edit workstation ${ws_id} at ${route}`)
    window.location.replace(`${route}/${ws_id}/edit`);
  }
}


// /***********************************************************
//  *
//  * menu functions
//  *
//  **********************************************************/
//
// function fmWorkstationsPrepare(ws_id) {
//
// }

//# sourceURL=kioskpwastresstestdock.js
