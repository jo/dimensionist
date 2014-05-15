# dimensionist
CouchDB daemon to extract dimensions from image attachments.

# This is WIP!
and not ready.

## Usage
dimensionist can be used as `os_daemon` and from the command line.

## Installation
`npm install -g dimensionist`

### Client
`dimensionist --blacklist _users,_replicator`

### Daemon
Add couchmagick to `os_daemons` config section:

```ini
[os_daemons]
dimensionist = dimensionist
```

```ini
[dimensionist]
; Optional username and password, used by the workers to access the database
username = mein-user
password = secure
; Whitelist databases: only the databases above are used (seperate with comma)
; whitelist = mydb,otherdb
; Blacklist: ignore the following databases (again comma seperated list)
blacklist = _users,_replicator
```

## License
Copyright (c) 2014 Johannes J. Schmidt, null2 GmbH  
Licensed under the MIT license.
