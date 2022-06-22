from flask_wtf import FlaskForm

from wtforms.fields import HiddenField
from wtforms.validators import DataRequired, Length, ValidationError
from core.kioskwtforms import KioskLabeledBooleanField, KioskStringField, \
    KioskLabeledStringField, KioskGeneralFormErrors, KioskLabeledSelectField
from urapdatetimelib import local_time_offset_str


class KioskPWAStressTestForm(FlaskForm, KioskGeneralFormErrors):
    page_initialized = HiddenField()
    workstation_id = KioskLabeledStringField(label="unique workstation id",
                                             validators=[Length(3, 20, "Please enter a workstation id"
                                                                       "with at least 3 and not more than 20 characters"),
                                                         DataRequired(
                                                             "A workstation id is really required")],

                                             )
    description = KioskLabeledStringField(label="descriptive name",
                                          validators=[Length(3, 20, "Please enter a descriptive name"
                                                                    "with at least 3 and not more than 20 characters"),
                                                      DataRequired(
                                                          "You really want a descriptive name")], )
    recording_group = KioskLabeledStringField(label="recording group",
                                              validators=[
                                                  Length(3, 20, "Please select a recording group or enter a new one "
                                                                "by giving it a name with at least 3 and "
                                                                "not more than 20 characters"),
                                                  DataRequired(
                                                      "A recording group is mandatory")]
                                              )
    grant_access_to = KioskLabeledStringField(label="grant access to")
    gmt_time_zone = KioskLabeledStringField(label="time zone")

    options = KioskLabeledStringField(label="workstation options")

    def __init__(self, mode, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if mode == "edit":
            self.workstation_id.render_kw = {'disabled': ''}

    def validate_gmt_time_zone(self, field):
        if field.data:
            try:
                offset = local_time_offset_str(field.data)
            except:
                raise ValidationError(f"That is not a valid time zone. "
                                      f"You want something like GMT+1 or UTC-2 if at all. ")
