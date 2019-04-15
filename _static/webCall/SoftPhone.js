(function () {
    window.CC_SoftPhone = window.CC_SoftPhone || {
            _websocket: null,
            _callid: null,
            _media_ip: null,
            _media_port: null,
            _sip_id: null,
            _sip_pwd: null,
            _wsurl: "",
            _uninit: false,
            _websocket_ocx: null,
            check: function () {
                return true;
            },
            /**
             * 初始化控件
             * @param media_ip
             * @param media_port
             * @param sip_id
             * @param sip_pwd
             * @returns {CC_SoftPhone}
             */
            init: function (media_ip, media_port, sip_id, sip_pwd) {
                CC_SoftPhone.log("CC_SoftPhone:初始化连接");
                if ("https:" == document.location.protocol) {
                    CC_SoftPhone._wsurl = "wss://localhost.acloudcc.com:19996";
                } else {
                    CC_SoftPhone._wsurl = "ws://127.0.0.1:19996"
                }
                CC_SoftPhone.log("CC_SoftPhone:连接地址:" + CC_SoftPhone._wsurl);
                CallCenter.eventAlert("初始化SIPPHONE");
                if (media_ip) {
                    CC_SoftPhone._media_ip = media_ip;
                }
                if (media_port) {
                    CC_SoftPhone._media_port = media_port;
                }
                if (sip_id) {
                    CC_SoftPhone._sip_id = sip_id;
                }
                if (sip_pwd) {
                    CC_SoftPhone._sip_pwd = sip_pwd;
                }
                if ('WebSocket' in window) {
                    CC_SoftPhone._websocket = new WebSocket(CC_SoftPhone._wsurl);
                    CC_SoftPhone._websocket.onopen = CC_SoftPhone.onopen;
                    CC_SoftPhone._websocket.onmessage = CC_SoftPhone.onmessage;
                    CC_SoftPhone._websocket.onclose = CC_SoftPhone.onclose;
                    CC_SoftPhone._websocket.onerror = CC_SoftPhone.onerror;
                } else {
                    if (window.ActiveXObject || "ActiveXObject" in window) {
                        CC_SoftPhone._websocket = CC_SoftPhone.newWebSocket(CC_SoftPhone._wsurl);
                        CC_SoftPhone._websocket.onopen = CC_SoftPhone.onopen;
                        CC_SoftPhone._websocket.onmessage = CC_SoftPhone.onmessage;
                        CC_SoftPhone._websocket.onclose = CC_SoftPhone.onclose;
                        CC_SoftPhone._websocket.onexception = CC_SoftPhone.onerror;
                    } else {
                        alert('您的浏览器不支持websocket!');
                    }
                }
                CC_SoftPhone._uninit = false;
                return this;
            },
            /**
             * 卸载控件
             * @constructor
             */
            UnInitialize: function (callback) {
                CC_SoftPhone.log("CC_SoftPhone:卸载控件");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "unInit"
                    }
                );
                CC_SoftPhone._uninit = true;
                if (CC_SoftPhone._websocket_ocx) {//如果调用了控件的WS对象，移除
                    try {
                        CC_SoftPhone._websocket_ocx.UnInitialize();
                    } catch (e) {
                    }
                }
            },
            /**
             * 获取版本号
             */
            version: function () {
                CC_SoftPhone.send({
                    "type": "cmd",
                    "cmd": "version",
                });
            },
            /**
             * 登录话机功能
             * @constructor
             */
            Login: function (media_ip, media_port, sip_id, sip_pwd) {
                if (media_ip) {
                    CC_SoftPhone._media_ip = media_ip;
                }
                if (media_port) {
                    CC_SoftPhone._media_port = media_port;
                }
                if (sip_id) {
                    CC_SoftPhone._sip_id = sip_id;
                }
                if (sip_pwd) {
                    CC_SoftPhone._sip_pwd = sip_pwd;
                }
                if (!CC_SoftPhone._media_ip) {
                    CallCenter.setStatusAndPhoneText("媒体地址不能为空");
                    return false;
                }
                if (!CC_SoftPhone._media_ip) {
                    CallCenter.setStatusAndPhoneText("媒体端口不能为空");
                    return false;
                }
                if (!CC_SoftPhone._sip_id) {
                    CallCenter.setStatusAndPhoneText("SIP账号不能为空");
                    return false;
                }
                if (!CC_SoftPhone._media_ip) {
                    CallCenter.setStatusAndPhoneText("SIP密码不能为空");
                    return false;
                }
                CC_SoftPhone.log("CC_SoftPhone:登录话机");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "login",
                        "param": {
                            "serverAddr": CC_SoftPhone._media_ip,
                            "serverPort": CC_SoftPhone._media_port,
                            "voipId": CC_SoftPhone._sip_id,
                            "voipPwd": CC_SoftPhone._sip_pwd
                        }
                    }
                );
                if (CC_SoftPhone._websocket != null && CC_SoftPhone.readyState == 1) {
                    return true;
                } else {
                    return false;
                }
            },
            /**
             * 登出话机
             * @constructor
             */
            Logout: function () {
                CC_SoftPhone.log("CC_SoftPhone:登出话机");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "logout"
                    }
                );
                if (CC_SoftPhone._websocket_ocx) {
                    try {
                        CC_SoftPhone._websocket_ocx.UnInitialize();
                    } catch (e) {
                    }
                }
            },
            /**
             * 外呼
             * @param callType
             * @param called
             * @constructor
             */
            MakeCall: function (called) {
                CC_SoftPhone.log("CC_SoftPhone:外呼");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "makeCall",
                        "param": {
                            "caller": "",
                            "called": called
                        }
                    }
                );
            },
            /**
             * 接听
             * @constructor
             */
            AcceptCall: function () {
                CC_SoftPhone.log("CC_SoftPhone:接听");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "answerCall",
                        "param": {
                            "callid": CC_SoftPhone._callid
                        }
                    }
                );
            },
            /**
             * 挂机
             * @constructor
             */
            ReleaseCall: function () {
                CC_SoftPhone.log("CC_SoftPhone:挂机");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "rejectCall",
                        "param": {
                            "callid": CC_SoftPhone._callid,
                            "reason": 1
                        }
                    }
                );
            },
            /**
             * 静音
             * @constructor
             */
            Mute: function () {
                CC_SoftPhone.log("CC_SoftPhone:静音");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "mute",
                        "param": {
                            "callid": CC_SoftPhone._callid,
                            "reason": 1
                        }
                    }
                );
            },
            /**
             * 取消静音
             * @constructor
             */
            UnMute: function () {
                CC_SoftPhone.log("CC_SoftPhone:取消静音");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "unmute",
                        "param": {
                            "callid": CC_SoftPhone._callid,
                            "reason": 1
                        }
                    }
                );
            },
            /**
             * 按键
             * @constructor
             */
            SendDTMF: function (key) {
                CC_SoftPhone.log("CC_SoftPhone:按键");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "sendDTMF",
                        "param": {
                            "callid": CC_SoftPhone._callid,
                            "dtmf": key
                        }
                    }
                );
            },
            /**
             * 设置编码
             * @param type
             * @param enable
             */
            setCodecEnabled: function (type, enable) {
                CC_SoftPhone.log("CC_SoftPhone:设置编码");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "setCodecEnabled",
                        "param": {
                            "type": type,
                            "enable": enable
                        }
                    }
                );
            },
            /**
             * 重连
             */
            reconnection: function () {
                CC_SoftPhone.log("CC_SoftPhone消息：准备重连");
                setTimeout(function () {
                    CC_SoftPhone.init();
                }, 1000);//断线重连
            },
            /**
             * 连接建立
             */
            onopen: function () {
                CC_SoftPhone.log("CC_SoftPhone消息：建立连接");
                CC_SoftPhone.send({
                        "type": "cmd",
                        "cmd": "init"
                    }
                );
                return this;
            },
            /**
             * 连接错误
             */
            onerror: function () {
                CC_SoftPhone.log("CC_SoftPhone消息：连接错误");
                CC_SoftPhone.UnInitialize();
                return this;
            },
            /**
             * 连接关闭
             */
            onclose: function () {
                CC_SoftPhone.log("CC_SoftPhone消息：连接关闭");
                var msg = "SipPhone初始化失败!";
                CallCenter.setStatusAndPhoneText(msg).eventAlert(msg).log(msg);
                if (typeof(CC_SoftPhone.onclose_event) == "function") {
                    CC_SoftPhone.onclose_event();
                }
                if (!CC_SoftPhone._uninit) {
                    CC_SoftPhone.reconnection();//尝试重连
                }
                return this;
            },
            /**
             * 连接消息
             */
            onmessage: function (data) {
                CC_SoftPhone.log("CC_SoftPhone消息接收：");
                CC_SoftPhone.log(data.data);
                var json = JSON.parse(data.data);
                switch (json.type) {
                    case "cmdresult":
                        switch (json.cmdresult) {
                            case "init":
                                CallCenter.eventAlert("SIPPHONE初始化成功");
                                CC_SoftPhone.Login();
                                break;
                            case "unInit":
                                break;
                            case "login":
                                if (typeof(SoftPhone['login_event']) == 'function') {
                                    SoftPhone['login_event'](json.param['return']);
                                }
                                break;
                            case "logout":
                                break;
                            case "makeCall":
                                break;
                            case "answerCall":
                                break;
                            case "rejectCall":
                                break;
                            case "pauseCall":
                                break;
                            case "resumeCall":
                                break;
                            case "releaseCall":
                                break;
                            case "sendDTMF":
                                break;
                            case "setCodecEnabled":
                                break;
                            case "getCodecEnabled":
                                break;
                            case "version":
                                CC_SoftPhone.log(json.param.version);
                                break;
                            case "mute":
                                if (CallCenter._isCallout) {
                                    if (CallCenter._auto == 1) {
                                        CallCenterStatus.out_auto_mute();
                                    } else {
                                        CallCenterStatus.out_mute();
                                    }
                                } else {
                                    CallCenterStatus.in_mute();
                                }
                                break;
                            case "unmute":
                                if (CallCenter._isCallout) {
                                    if (CallCenter._auto == 1) {
                                        CallCenterStatus.out_auto_unmute();
                                    } else {
                                        CallCenterStatus.out_unmute();
                                    }
                                } else {
                                    CallCenterStatus.in_unmute();
                                }
                                break;
                            default :
                                CC_SoftPhone.log("cmdresult未知命令:" + JSON.stringify(json));
                        }
                        break;
                    case "event":
                        switch (json.event) {
                            case "OnConnected":
                                var msg = "SIPPHONE连接成功";
                                CallCenter.eventAlert(msg).init();
                                break;
                            case "OnConnectError":
                                var msg = "SIPPHONE连接失败";
                                CallCenter.setStatusAndPhoneText(msg).eventAlert(json.param.desc + "[" + json.param.reason + "]");
                                break;
                            case "OnLogOut":
                                break;
                            case "OnIncomingCallReceived"://接到呼叫
                                if (json.param != null && json.param.callid != null) {
                                    CC_SoftPhone._callid = json.param.callid;
                                } else {
                                    CC_SoftPhone.log("CC_SoftPhone:没有找到callid");
                                }
                                //如果是自动外呼或主动外呼，话机直接接听
                                if (CallCenter._logintype == 2) {
                                    if (CallCenter.isAuto() || CallCenter.isOutbound()) {
                                        CC_SoftPhone.AcceptCall();
                                    } else {
                                        CallCenter.showControl("#SoftPhone_answer");
                                    }
                                }
                                if (typeof(SoftPhone['OnIncomingCallReceived_event']) == 'function') {
                                    SoftPhone['OnIncomingCallReceived_event'](json);
                                }
                                break;
                            case "OnCallAlerting":
                                if (typeof(SoftPhone['OnIncomingCallReceived_event']) == 'function') {
                                    SoftPhone['OnCallAnswered_event'](json);
                                }
                                break;
                            case "OnCallAnswered":
                                CallCenter.eventAlert("CC_SoftPhone:软电话已经接通");
                                if (typeof(SoftPhone['OnCallAnswered_event']) == 'function') {
                                    SoftPhone['OnCallAnswered_event'](json);
                                }
                                break;
                            case "OnMakeCallFailed":
                                break;
                            case "OnCallReleased":
                                break;
                            case "OnCallPaused":
                                break;
                            case "OnCallPausedByRemote":
                                break;
                            case "OnResumed":
                                break;
                            case "OnDtmfReceived":
                                break;
                            case "OnWTSSessionChange":
                                if (json.param.sessionState == 'SESSION_LOCK') {
                                    CallCenter.busy();
                                }
                                if (typeof(SoftPhone['OnWTSSessionChange_event']) == 'function') {
                                    SoftPhone['OnWTSSessionChange_event'](json);
                                }
                                break;
                            default :
                                CC_SoftPhone.log("CC_SoftPhone:cmdresult未知命令:" + JSON.stringify(json));
                        }
                        break;
                    default :
                        CC_SoftPhone.log("CC_SoftPhone:type未知命令:" + JSON.stringify(json));

                }
            },
            /**
             * 发送消息到ws服务器
             */
            send: function (sendObj) {
                try {
                    if (CC_SoftPhone._websocket != null) {
                        if (("m_readyState" in CC_SoftPhone._websocket ? CC_SoftPhone._websocket.m_readyState : CC_SoftPhone._websocket.readyState) == 1) {
                            CC_SoftPhone.log("CC_SoftPhone:发送消息:" + JSON.stringify(sendObj));
                            CC_SoftPhone._websocket.send(JSON.stringify(sendObj));
                        } else {
                            switch (("m_readyState" in CC_SoftPhone._websocket ? CC_SoftPhone._websocket.m_readyState : CC_SoftPhone._websocket.readyState)) {
                                case 0:
                                    CC_SoftPhone.log("CC_SoftPhone:连接状态[连接尚未建立]");
                                    break;
                                case 1:
                                    CC_SoftPhone.log("CC_SoftPhone:连接状态[WebSocket的链接已经建立]");
                                    break;
                                case 2:
                                    CC_SoftPhone.log("CC_SoftPhone:连接状态[连接正在关闭]");
                                    break;
                                case 3:
                                    CC_SoftPhone.log("CC_SoftPhone:连接状态[连接已经关闭或不可用]");
                                    break;
                                default:
                                    CC_SoftPhone.log("CC_SoftPhone:连接状态[" + "m_readyState" in CC_SoftPhone._websocket ? CC_SoftPhone._websocket.m_readyState : CC_SoftPhone._websocket.readyState + "]");
                            }
                        }
                    } else {
                        CC_SoftPhone.log("CC_SoftPhone:连接为null");
                    }
                } catch (ex) {
                    CC_SoftPhone.log("CC_SoftPhone:发送消息异常");
                    for (x in ex) {
                        CC_SoftPhone.log(x + ":" + ex[x]);
                    }
                    CC_SoftPhone.log(ex);
                }
            },
            newWebSocket: function (url) {
                CC_SoftPhone._websocket_ocx = document.createElement("object");
                if (window.ActiveXObject || "ActiveXObject" in window) {
                    CC_SoftPhone._websocket_ocx.classid = "CLSID:4B99B6A3-777E-4DB9-87A9-A0AE3E13F6BC";
                    CC_SoftPhone._websocket_ocx.width = 1;
                    CC_SoftPhone._websocket_ocx.height = 1;
                    document.body.appendChild(CC_SoftPhone._websocket_ocx);
                    CC_SoftPhone._websocket_ocx.setwsurl(url);
                }
                return CC_SoftPhone._websocket_ocx;
            },
            /**
             * 设置连接关闭的消息监听
             * @param event
             */
            setOncloseEvent: function (event_fun) {
                CC_SoftPhone.onclose_event = event_fun;
            },
            log: function (c) {
                CallCenter.log(c);
                return this;
            }
        }
})();