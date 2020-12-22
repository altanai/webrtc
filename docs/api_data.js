define({ "api": [
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./test/prod/api/client/build/api/doc/main.js",
    "group": "/home/altanai/Documents/webrtcdev/webrtc/test/prod/api/client/build/api/doc/main.js",
    "groupTitle": "/home/altanai/Documents/webrtcdev/webrtc/test/prod/api/client/build/api/doc/main.js",
    "name": ""
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./test/prod/api/client/build/api/main.js",
    "group": "/home/altanai/Documents/webrtcdev/webrtc/test/prod/api/client/build/api/main.js",
    "groupTitle": "/home/altanai/Documents/webrtcdev/webrtc/test/prod/api/client/build/api/main.js",
    "name": ""
  },
  {
    "type": "get",
    "url": "/session/getsession",
    "title": "Get the session details",
    "name": "GetSession",
    "group": "Session",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "channelid",
            "description": "<p>This is for getting the unique channel</p>"
          }
        ]
      }
    },
    "sampleRequest": [
      {
        "url": "https://localhost:8087/session/getsession\nexample : https://localhost:8087/session/getsession"
      }
    ],
    "version": "0.0.0",
    "filename": "./build/webrtcdevelopmentServer.js",
    "groupTitle": "Session"
  },
  {
    "type": "get",
    "url": "/session/getsession",
    "title": "Get the session details",
    "name": "GetSession",
    "group": "Session",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "channelid",
            "description": "<p>This is for getting the unique channel</p>"
          }
        ]
      }
    },
    "sampleRequest": [
      {
        "url": "https://localhost:8087/session/getsession\nexample : https://localhost:8087/session/getsession"
      }
    ],
    "version": "0.0.0",
    "filename": "./server/restapi.js",
    "groupTitle": "Session"
  },
  {
    "type": "get",
    "url": "/session/all-sessions",
    "title": "All Sessions",
    "name": "Get_All_sessions",
    "group": "Session",
    "description": "<p>get all session details</p>",
    "sampleRequest": [
      {
        "url": "https://localhost:8087/session/all-sessions"
      }
    ],
    "version": "0.0.0",
    "filename": "./build/webrtcdevelopmentServer.js",
    "groupTitle": "Session"
  },
  {
    "type": "get",
    "url": "/session/all-sessions",
    "title": "All Sessions",
    "name": "Get_All_sessions",
    "group": "Session",
    "description": "<p>get all session details</p>",
    "sampleRequest": [
      {
        "url": "https://localhost:8087/session/all-sessions"
      }
    ],
    "version": "0.0.0",
    "filename": "./server/restapi.js",
    "groupTitle": "Session"
  },
  {
    "type": "get",
    "url": "/user/getuser",
    "title": "Get user details",
    "name": "Get_User",
    "group": "User",
    "description": "<p>get user details based on userid</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userid",
            "description": "<p>The id of user</p>"
          }
        ]
      }
    },
    "sampleRequest": [
      {
        "url": "https://localhost:8087/user/getuser"
      }
    ],
    "version": "0.0.0",
    "filename": "./build/webrtcdevelopmentServer.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/getuser",
    "title": "Get user details",
    "name": "Get_User",
    "group": "User",
    "description": "<p>get user details based on userid</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userid",
            "description": "<p>The id of user</p>"
          }
        ]
      }
    },
    "sampleRequest": [
      {
        "url": "https://localhost:8087/user/getuser"
      }
    ],
    "version": "0.0.0",
    "filename": "./server/restapi.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/all-users",
    "title": "All users details",
    "name": "Get_user",
    "group": "User",
    "description": "<p>get all users details</p>",
    "sampleRequest": [
      {
        "url": "https://localhost:8087/user/all-users"
      }
    ],
    "version": "0.0.0",
    "filename": "./build/webrtcdevelopmentServer.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/all-users",
    "title": "All users details",
    "name": "Get_user",
    "group": "User",
    "description": "<p>get all users details</p>",
    "sampleRequest": [
      {
        "url": "https://localhost:8087/user/all-users"
      }
    ],
    "version": "0.0.0",
    "filename": "./server/restapi.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/webrtc/details",
    "title": "Get the session details",
    "name": "webrtc_details",
    "group": "WebRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "version",
            "description": "<p>This is for getting the version of project</p>"
          }
        ]
      }
    },
    "sampleRequest": [
      {
        "url": "https://localhost:8087/webrtc/details"
      }
    ],
    "version": "0.0.0",
    "filename": "./build/webrtcdevelopmentServer.js",
    "groupTitle": "WebRTC"
  },
  {
    "type": "get",
    "url": "/webrtc/details",
    "title": "Get the session details",
    "name": "webrtc_details",
    "group": "WebRTC",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "version",
            "description": "<p>This is for getting the version of project</p>"
          }
        ]
      }
    },
    "sampleRequest": [
      {
        "url": "https://localhost:8087/webrtc/details"
      }
    ],
    "version": "0.0.0",
    "filename": "./server/restapi.js",
    "groupTitle": "WebRTC"
  }
] });
