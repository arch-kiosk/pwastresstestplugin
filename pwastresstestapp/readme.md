### Kiosk StressTest PWA
The project's goal is to establish proof of concept 
that a PWA can hold all the images and data an 
offline recording system needs to hold in the field, and that cross-platform:
iOS(Safari), Android (Chrome), Windows (Chrome) and Mac (Chrome).

This is a kiosk plugin, so the PWA code is in "./pwastresstestapp" 
while the rest is the kiosk code that serves the PWA as an api 
and embeds it in Kiosk.

All of this needs to be served via ssl and needs a kiosk serving via ssl.
Otherwise it can only be tested on localhost.  