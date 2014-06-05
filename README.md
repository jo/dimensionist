# Dimensionist
[CouchDB daemon](https://github.com/jo/couch-daemon) to extract dimensions from image attachments.

## Usage
Dimensionist can be used as `os_daemon` and from the command line.

When Dimensionist finds an image it will extract the dimensions
([http-image-size](https://github.com/jo/http-image-size)) and populate a
`dimensions` property:
```json
{
   "_id": "project/adlershof/project-image/medium/3",
   "_rev": "4-6090bde74e3c3c47de8c9a87c916ff77",
   "dimensions": {
       "wall.jpg": {
           "height": 960,
           "width": 1440,
           "revpos": 3
       }
   },
   "_attachments": {
       "wall.jpg": {
           "content_type": "image/jpeg",
           "revpos": 3,
           "digest": "md5-5TKLg1pF9+vV2eAL/7hmkw==",
           "length": 219420,
           "stub": true
       }
   }
}
```

Currently JPEG, PNG and GIF images are supported.

## Installation
`npm install -g dimensionist`

### Client
`dimensionist --blacklist _users,_replicator`

### Daemon
Add Dimensionist to `os_daemons` config section (eg. in local.ini):

```ini
[os_daemons]
dimensionist = dimensionist
```

```ini
[dimensionist]
; Optional username and password, used by the workers to access the database
username = mein-user
password = secure
; Only documents in the databases below are processed (separate with comma).
; Regular expressions are allowed:
;whitelist = mydb,otherdb,/^special-.*/
; Ignore the following databases (again comma separated list)
; Regular expressions are again allowed:
blacklist = /^_/
```

## License
Copyright (c) 2014 Johannes J. Schmidt, null2 GmbH  
Licensed under the MIT license.
