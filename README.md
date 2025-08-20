Purpose is to demo the integrating between following clients/services.

- An MQTT broker
- Device (CLI): A node js (TS) script that starts with a deviceId & password as input and periodically publishes some random string in to the broker at a given path /some/path/<deviceId> using password for rabbitmq_auth_backend_http
- Subscriber (CLI): Another script that connects to backend, lists out available devices & fetches updates for the selected device through websocket
- Backend: A nodejs (TS) app that let's subscribers to list available devices & expose device locations subscribers to via webscoket. (DeviceList is predefined "Bus-<BusNo>" where "BusNo" is numbers 1-50)
- DeviceAuthServer: Another nodejs/TS app that provides rabbitmq_auth_backend_http. At the start of the scripts, it'll print all bus numbers with password ( a deterministic password like base64 or something )

## WebSocket

- we can use socketio

## MQTT Broker

- provide a docker compose file that runs rabbitmq file with rabbitmq_auth_backend_http
- need to provide rabbitmq_auth_backend_http configs
