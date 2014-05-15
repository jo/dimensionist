# dimensionist
CouchDB daemon to extract dimensions from image attachments.

## Usage
dimensionist can be used as `os_daemon` and from the command line.

When dimensionist finds an image it will extract the dimensions
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
Add dimensionist to `os_daemons` config section:

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
