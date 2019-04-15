(function () {
    window.EC_SoftPhone = window.EC_SoftPhone || {
            ecsdk: null,
            _media_ip: null,
            _media_port: null,
            _sip_id: null,
            _sip_pwd: null,

            /**
             * 检查是否安装控件
             * @returns {boolean}
             */
            check: function () {
                var mimetype = navigator.mimeTypes["application/yuntongxun-softphonesdk-plugin"];
                if (mimetype) {
                    var plugin = mimetype.enabledPlugin;
                    if (plugin) {
                        CallCenter.log("ECSDK:安装了插件");
                        return true;
                    } else {
                        CallCenter.log("ECSDK:没有安装插件");
                        return false;
                    }
                } else {
                    CallCenter.log("ECSDK:没有安装插件");
                    return false;
                }
            },
            /**
             * 初始化ECSDK
             * @param media_ip
             * @param media_port
             * @param sip_id
             * @param sip_pwd
             * @returns {*}
             */
            init: function (media_ip, media_port, sip_id, sip_pwd) {
                CallCenter.log("ECSDK:初始化软话机");
                CallCenter.eventAlert("初始化BrowswerSDK");
                if (media_ip) {
                    EC_SoftPhone._media_ip = media_ip;
                }
                if (media_port) {
                    EC_SoftPhone._media_port = media_port;
                }
                if (sip_id) {
                    EC_SoftPhone._sip_id = sip_id;
                }
                if (sip_pwd) {
                    EC_SoftPhone._sip_pwd = sip_pwd;
                }

                EC_SoftPhone.ecsdk = document.createElement("object");
                if (window.ActiveXObject || "ActiveXObject" in window) {
                    EC_SoftPhone.ecsdk.classid = "CLSID:45F8025B-1BFB-4D78-970A-EE1B49CE5667";
                } else {
                    EC_SoftPhone.ecsdk.type = "application/yuntongxun-softphonesdk-plugin";
                }
                EC_SoftPhone.ecsdk.id = "ECSDK";
                EC_SoftPhone.ecsdk.width = 1;
                EC_SoftPhone.ecsdk.height = 1;
                EC_SoftPhone.ecsdk.style.position = "fixed";
                EC_SoftPhone.ecsdk.style.bottom = "0px";
                EC_SoftPhone.ecsdk.style.left = "0px";
                $("body").append(EC_SoftPhone.ecsdk);

                EC_SoftPhone.RegisterCallBack(EC_SoftPhone.ecsdk, "OnConnected", EC_SoftPhone.OnConnected);
                EC_SoftPhone.RegisterCallBack(EC_SoftPhone.ecsdk, "OnConnectError", EC_SoftPhone.OnConnectError);
                EC_SoftPhone.RegisterCallBack(EC_SoftPhone.ecsdk, "OnLogInfo", EC_SoftPhone.onLogInfo);
                EC_SoftPhone.RegisterCallBack(EC_SoftPhone.ecsdk, "OnIncomingCallReceived", EC_SoftPhone.OnIncomingCallReceived);
                EC_SoftPhone.RegisterCallBack(EC_SoftPhone.ecsdk, "OnCallAnswered", EC_SoftPhone.OnCallAnswered);
                EC_SoftPhone.RegisterCallBack(EC_SoftPhone.ecsdk, "OnCallReleased", EC_SoftPhone.OnCallReleased);
                EC_SoftPhone.RegisterCallBack(EC_SoftPhone.ecsdk, "OnWTSSessionChange", EC_SoftPhone.OnWTSSessionChange);
                try {
                    var result = EC_SoftPhone.ecsdk.Initialize();
                    CallCenter.log("ECSDK:Initialize:" + result);
                    if (result == 0) {
                        try {
                            CallCenter.eventAlert("BrowswerSDK初始化成功");
                            EC_SoftPhone.ecsdk.SetCodecEnabled(4, 0);//禁用VP8编码
                            EC_SoftPhone.ecsdk.SetCodecEnabled(5, 0);//禁用H264编码
                            EC_SoftPhone.Login();
                        } catch (e) {
                            var msg = "BrowswerSDK登录异常!";
                            CallCenter.setStatusAndPhoneText(msg).eventAlert('尝试切换SipPhone方式登录').log(msg).log(e);
                            setTimeout(function () {
                                window.SoftPhone = window.CC_SoftPhone;
                                SoftPhone.init(media_ip, media_port, sip_id, sip_pwd);
                            }, 2000);
                        }
                    } else {//初始化多次会失败
                        var msg = "BrowswerSDK初始化失败!";
                        CallCenter.setStatusAndPhoneText(msg).eventAlert(msg).log(msg);
                    }
                } catch (e) {
                    var msg = "BrowswerSDK初始化异常!";
                    CallCenter.setStatusAndPhoneText(msg).eventAlert('尝试切换SipPhone方式登录').log(msg).log(e);
                    setTimeout(function () {
                        window.SoftPhone = window.CC_SoftPhone;
                        SoftPhone.init(media_ip, media_port, sip_id, sip_pwd);
                    }, 2000);
                }
                return result;
            },
            /**
             * 卸载控件
             * @constructor
             */
            UnInitialize: function (callback) {
                CallCenter.log("ECSDK:卸载控件");
                try {
                    if (EC_SoftPhone.ecsdk) {
                        var result = EC_SoftPhone.ecsdk.UnInitialize();
                        CallCenter.log("ECSDK:UnInitialize:" + result);
                        if ($("#ECSDK").length > 0) {
                            document.body.removeChild($("#ECSDK")[0]);
                        }
                    }
                } catch (ex) {
                    CallCenter.log(ex);
                }
                if (typeof(callback) == "function") {
                    callback();
                }

            },
            /**
             * 获取版本号
             * @returns {*}
             */
            version: function () {
                CallCenter.log(EC_SoftPhone.ecsdk.version());
            },
            /**
             * 登录话机功能
             * @constructor
             */
            Login: function (ss_ip, ss_port, sip_id, sip_pwd) {
                if (ss_ip) {
                    EC_SoftPhone._media_ip = ss_ip;
                }
                if (ss_port) {
                    EC_SoftPhone._media_port = ss_port;
                }
                if (sip_id) {
                    EC_SoftPhone._sip_id = sip_id;
                }
                if (sip_pwd) {
                    EC_SoftPhone._sip_pwd = sip_pwd;
                }

                var flag = false;
                CallCenter.log("ECSDK:使用参数 ss_ip:" + EC_SoftPhone._media_ip + " ss_port:" + EC_SoftPhone._media_port + " sip_id:" + EC_SoftPhone._sip_id + " sip_pwd:" + EC_SoftPhone._sip_pwd);
                if (!EC_SoftPhone._media_ip) {
                    CallCenter.setStatusAndPhoneText("媒体地址不能为空");
                    return flag;
                }
                if (!EC_SoftPhone._media_ip) {
                    CallCenter.setStatusAndPhoneText("媒体端口不能为空");
                    return flag;
                }
                if (!EC_SoftPhone._sip_id) {
                    CallCenter.setStatusAndPhoneText("SIP账号不能为空");
                    return flag;
                }
                if (!EC_SoftPhone._media_ip) {
                    CallCenter.setStatusAndPhoneText("SIP密码不能为空");
                    return flag;
                }
                try {
                    var result = EC_SoftPhone.ecsdk.Login(EC_SoftPhone._media_ip, EC_SoftPhone._media_port, EC_SoftPhone._sip_id, EC_SoftPhone._sip_pwd);
                    if (result == 0) {
                    } else {
                        CallCenter.setStatusAndPhoneText("BrowserSDK登录失败");
                    }
                    CallCenter.log("ECSDK:Login:" + result);
                    flag = true;
                } catch (e) {
                }
                return flag;
            },
            /**
             * 登出话机
             * @constructor
             */
            Logout: function (callback) {
                CallCenter.log("ECSDK:登出话机");
                try {
                    if (EC_SoftPhone.ecsdk) {
                        var result = EC_SoftPhone.ecsdk.Logout();
                        CallCenter.log("ECSDK:Logout:" + result);
                    }
                    if (typeof(callback) == "function") {
                        callback();
                    }
                } catch (ex) {
                    CallCenter.log(ex);
                }
            },
            /**
             * 外呼
             * @param callType
             * @param called
             * @constructor
             */
            MakeCall: function (called) {
                CallCenter.log("ECSDK:外呼");
                EC_SoftPhone.ecsdk.MakeCall(0, called);
                CallCenter.log("ECSDK:MakeCall,callid:" + String(EC_SoftPhone.ecsdk.callid));
            },
            /**
             * 接听
             * @constructor
             */
            AcceptCall: function () {
                CallCenter.log("ECSDK:接听");
                var result = EC_SoftPhone.ecsdk.AcceptCall(String(EC_SoftPhone.ecsdk.callid));
                CallCenter.log("ECSDK:CCPacceptCall:" + result);
            },
            /**
             * 挂机
             * @constructor
             */
            ReleaseCall: function () {
                CallCenter.log("ECSDK:挂机");
                var result = EC_SoftPhone.ecsdk.ReleaseCall(String(EC_SoftPhone.ecsdk.callid), 0);
                CallCenter.log("ECSDK:ReleaseCall:" + result);
            },
            /**
             * 静音
             * @constructor
             */
            Mute: function () {
                CallCenter.log("ECSDK:静音");
                var result = EC_SoftPhone.ecsdk.Mute();
                if (result == 0) {
                    if (CallCenter._isCallout) {
                        if (CallCenter._auto == 1) {
                            CallCenterStatus.out_auto_mute();
                        } else {
                            CallCenterStatus.out_mute();
                        }
                    } else {
                        CallCenterStatus.in_mute();
                    }
                }
                CallCenter.log("ECSDK:Mute:" + result);
            },
            /**
             * 取消静音
             * @constructor
             */
            UnMute: function () {
                CallCenter.log("ECSDK:取消静音");
                var result = EC_SoftPhone.ecsdk.UnMute();
                if (result == 0) {
                    if (CallCenter._isCallout) {
                        if (CallCenter._auto == 1) {
                            CallCenterStatus.out_auto_unmute();
                        } else {
                            CallCenterStatus.out_unmute();
                        }
                    } else {
                        CallCenterStatus.in_unmute();
                    }
                }
                CallCenter.log("ECSDK:UnMute:" + result);
            },
            /**
             * 按键
             * @constructor
             */
            SendDTMF: function (key) {
                CallCenter.log("ECSDK:按键:" + key);
                var result = EC_SoftPhone.ecsdk.SendDTMF(String(EC_SoftPhone.ecsdk.callid), key.charCodeAt(0));
                CallCenter.log("ECSDK:SendDTMF:" + result);
            },
            /**
             * 事件
             * @param msg
             */
            onLogInfo: function (msg) {
                CallCenter.log("ECSDK:onLogInfo:" + msg);
            },
            /**
             * 连接事件
             * @param msg
             */
            OnConnected: function () {//登录成功
                CallCenter.log("ECSDK:OnConnected");
                CallCenter.init().eventAlert("BrowswerSDK登录成功");
            },
            /**
             * 连接错误
             * @param msg
             * @constructor
             */
            OnConnectError: function (msg) {//登录失败
                CallCenter.log("ECSDK:OnConnectError:" + msg);
                setTimeout(EC_SoftPhone.Login, 5000);
            },
            /**
             * 振铃
             * @param coming
             */
            OnIncomingCallReceived: function (coming) {
                CallCenter.log("ECSDK:OnIncomingCallReceived");
                //如果是自动外呼或主动外呼，话机直接接听
                if (CallCenter._logintype == 2) {
                    if (CallCenter._auto == 1 || CallCenter._isCallout) {
                        EC_SoftPhone.AcceptCall();
                        CallCenter.eventAlert("软电话已经接通");
                    } else {
                        CallCenter.showControl("#CallCenter_answer");
                    }
                }
            },
            /**
             * 接听
             * @constructor
             */
            OnCallAnswered: function () {//自动接通
                CallCenter.log("ECSDK:OnCallAnswered");
            },
            /**
             * 释放
             * @constructor
             */
            OnCallReleased: function () {//释放呼叫
                CallCenter.log("ECSDK:OnCallReleased");
            },
            /**
             * 锁屏事件
             * @param sessionState
             * @constructor
             */
            OnWTSSessionChange: function (sessionState) {
                CallCenter.log("ECSDK:OnWSSessionChange result:" + sessionState);
                if (sessionState == 'SESSION_LOCK') {
                    CallCenter.busy();
                } else {

                }
            },
            /**
             * 注册事件
             * @param obj
             * @param name
             * @param proc
             * @constructor
             */
            RegisterCallBack: function (obj, name, proc) {
                if (typeof (proc) != "function")
                    return;
                if (window.ActiveXObject || "ActiveXObject" in window) {
                    if (window.ActiveXObject && obj.attachEvent) {
                        obj.attachEvent(name, proc);
                    } else {
                        EC_SoftPhone.AttachIE11Event(obj, name, proc);
                    }
                } else {
                    obj[name] = proc;
                }
            },
            /**
             * 添加事件到IE
             * @param obj
             * @param _strEventId
             * @param _functionCallback
             * @constructor
             */
            AttachIE11Event: function (obj, _strEventId, _functionCallback) {
                var nameFromToStringRegex = /^function\s?([^\s(]*)/;
                var paramsFromToStringRegex = /\(\)|\(.+\)/;
                var params = _functionCallback.toString().match(paramsFromToStringRegex)[0];
                var functionName = _functionCallback.name || _functionCallback.toString().match(nameFromToStringRegex)[1];
                var handler;
                try {
                    handler = document.createElement("script");
                    handler.setAttribute("for", obj.id);
                } catch (ex) {
                    handler = document.createElement('<script for="' + obj.id + '">');
                }
                handler.event = _strEventId + params;
                handler.appendChild(document.createTextNode("EC_SoftPhone." + _strEventId + params + ";"));
                document.body.appendChild(handler);
            }
        }
})();