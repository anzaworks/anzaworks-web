# Offline behavior

On localhost or HTTPS, the service worker caches the admin shell after the first successful visit. IndexedDB records remain available offline. The connectivity label reports network status. A new service worker installs and takes over on a normal lifecycle; existing tabs should be reloaded after an update. Backups remain essential because browser storage can be cleared.

Reminder calculations run at launch and hourly while the app is open. Browser notifications require permission and platform support. The dashboard shows overdue and approaching renewals whenever the app opens. Browser notifications fire on exact milestone days only while the app is active. Session storage avoids repeats within a session; notifications may repeat after a restart on the same day. The app cannot notify while the browser and device are closed and cannot email offline.
