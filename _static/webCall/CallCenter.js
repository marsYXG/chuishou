(function () {
    var a = {
        VERSION: "2.3.5",
        Result: {SUCCEEDED: 1, NOTRANSITION: 2, CANCELLED: 3, PENDING: 4},
        Error: {INVALID_TRANSITION: 100, PENDING_TRANSITION: 200, INVALID_CALLBACK: 300},
        WILDCARD: "*",
        ASYNC: "async",
        create: function (g, h) {
            var j = (typeof g.initial == "string") ? {state: g.initial} : g.initial;
            var f = g.terminal || g["final"];
            var e = h || g.target || {};
            var m = g.events || [];
            var i = g.callbacks || {};
            var c = {};
            var k = {};
            var l = function (o) {
                var q = (o.from instanceof Array) ? o.from : (o.from ? [o.from] : [a.WILDCARD]);
                c[o.name] = c[o.name] || {};
                for (var p = 0; p < q.length; p++) {
                    k[q[p]] = k[q[p]] || [];
                    k[q[p]].push(o.name);
                    c[o.name][q[p]] = o.to || q[p]
                }
            };
            if (j) {
                j.event = j.event || "startup";
                l({name: j.event, from: "none", to: j.state})
            }
            for (var d = 0; d < m.length; d++) {
                l(m[d])
            }
            for (var b in c) {
                if (c.hasOwnProperty(b)) {
                    e[b] = a.buildEvent(b, c[b])
                }
            }
            for (var b in i) {
                if (i.hasOwnProperty(b)) {
                    e[b] = i[b]
                }
            }
            e.current = "none";
            e.is = function (n) {
                return (n instanceof Array) ? (n.indexOf(this.current) >= 0) : (this.current === n)
            };
            e.can = function (n) {
                return !this.transition && (c[n].hasOwnProperty(this.current) || c[n].hasOwnProperty(a.WILDCARD))
            };
            e.cannot = function (n) {
                return !this.can(n)
            };
            e.transitions = function () {
                return k[this.current]
            };
            e.isFinished = function () {
                return this.is(f)
            };
            e.error = g.error || function (p, t, s, o, n, r, q) {
                    throw q || r
                };
            if (j && !j.defer) {
                e[j.event]()
            }
            return e
        },
        firstToUpper: function (b) {
            return b.charAt(0).toUpperCase() + b.substr(1)
        },
        doCallback: function (g, d, c, i, h, b) {
            if (d) {
                try {
                    return d.apply(g, [c, i, h].concat(b))
                } catch (f) {
                    return g.error(c, i, h, b, a.Error.INVALID_CALLBACK, "an exception occurred in a caller-provided callback function", f)
                }
            }
        },
        beforeAnyEvent: function (d, c, f, e, b) {
            return a.doCallback(d, d["onbeforeevent"], c, f, e, b)
        },
        afterAnyEvent: function (d, c, f, e, b) {
            return a.doCallback(d, d["onafterevent"] || d["onevent"], c, f, e, b)
        },
        leaveAnyState: function (d, c, f, e, b) {
            return a.doCallback(d, d["onleavestate"], c, f, e, b)
        },
        enterAnyState: function (d, c, f, e, b) {
            return a.doCallback(d, d["onenterstate"] || d["onstate"], c, f, e, b)
        },
        changeState: function (d, c, f, e, b) {
            return a.doCallback(d, d["onchangestate"], c, f, e, b)
        },
        beforeThisEvent: function (d, c, f, e, b) {
            return a.doCallback(d, d["onbefore" + this.firstToUpper(c)], c, f, e, b)
        },
        afterThisEvent: function (d, c, f, e, b) {
            return a.doCallback(d, d["onafter" + this.firstToUpper(c)] || d["on" + this.firstToUpper(c)], c, f, e, b)
        },
        leaveThisState: function (d, c, f, e, b) {
            return a.doCallback(d, d["onleave" + this.firstToUpper(f)], c, f, e, b)
        },
        enterThisState: function (d, c, f, e, b) {
            return a.doCallback(d, d["onenter" + this.firstToUpper(e)] || d["on" + this.firstToUpper(e)], c, f, e, b)
        },
        beforeEvent: function (d, c, f, e, b) {
            if ((false === a.beforeThisEvent(d, c, f, e, b)) || (false === a.beforeAnyEvent(d, c, f, e, b))) {
                return false
            }
        },
        afterEvent: function (d, c, f, e, b) {
            a.afterThisEvent(d, c, f, e, b);
            a.afterAnyEvent(d, c, f, e, b)
        },
        leaveState: function (f, e, h, g, d) {
            var c = a.leaveThisState(f, e, h, g, d), b = a.leaveAnyState(f, e, h, g, d);
            if ((false === c) || (false === b)) {
                return false
            } else {
                if ((a.ASYNC === c) || (a.ASYNC === b)) {
                    return a.ASYNC
                }
            }
        },
        enterState: function (d, c, f, e, b) {
            a.enterThisState(d, c, f, e, b);
            a.enterAnyState(d, c, f, e, b)
        },
        buildEvent: function (b, c) {
            return function () {
                var h = this.current;
                var g = c[h] || c[a.WILDCARD] || h;
                var e = Array.prototype.slice.call(arguments);
                if (this.transition) {
                    return this.error(b, h, g, e, a.Error.PENDING_TRANSITION, "event " + b + " inappropriate because previous transition did not complete")
                }
                if (this.cannot(b)) {
                    return this.error(b, h, g, e, a.Error.INVALID_TRANSITION, "event " + b + " inappropriate in current state " + this.current)
                }
                if (false === a.beforeEvent(this, b, h, g, e)) {
                    return {result: a.Result.CANCELLED, reason: "cancelled"}
                }
                if (h === g) {
                    a.afterEvent(this, b, h, g, e);
                    return {result: a.Result.NOTRANSITION, reason: "notransition"}
                }
                var f = this;
                this.transition = function () {
                    f.transition = null;
                    f.current = g;
                    a.enterState(f, b, h, g, e);
                    a.changeState(f, b, h, g, e);
                    a.afterEvent(f, b, h, g, e);
                    return {result: a.Result.SUCCEEDED, reason: "succeeded"}
                };
                this.transition.cancel = function () {
                    f.transition = null;
                    a.afterEvent(f, b, h, g, e)
                };
                var d = a.leaveState(this, b, h, g, e);
                if (false === d) {
                    this.transition = null;
                    return a.Result.CANCELLED
                } else {
                    if (a.ASYNC === d) {
                        return {result: a.Result.PENDING, reason: "pending"}
                    } else {
                        if (this.transition) {
                            return this.transition()
                        }
                    }
                }
            }
        }
    };
    if (typeof exports !== "undefined") {
        if (typeof module !== "undefined" && module.exports) {
            exports = module.exports = a
        }
        exports.CallCenterStateMachine = a
    } else {
        if (typeof define === "function" && define.amd) {
            define(function (b) {
                return a
            })
        } else {
            if (typeof window !== "undefined") {
                window.CallCenterStateMachine = a
            } else {
                if (typeof self !== "undefined") {
                    self.CallCenterStateMachine = a
                }
            }
        }
    }
}());

(function () {
    if ($ && jQuery && $ !== jQuery) {
        jQuery.noConflict();
    }
    window.CallCenter = window.CallCenter || {
            version: "2.1.1.22",

            _debug: false,                  //是否调试
            _nolog: false,                  //关闭日志
            _thisPath: null,                //当前文件路径

            _wsurl: null,                   //WebSocket地址
            _companyid: null,               //企业编号
            _abbreviate: null,              //企业简写
            _operatorid: null,              //工号
            _password: null,                //密码
            _media_ip: null,                //媒体服务器IP
            _media_port: null,              //媒体服务器port
            _sip_id: null,                  //SIP账号
            _sip_pwd: null,                 //SIP密码
            _logintype: null,               //登录方式,0手机,1SIP话机,2软话机
            _auto: 0,                       //是否预测外呼，0否1是
            _logingroups: "",               //登录到的技能组

            _url_3cs: null,                 //3cs的地址
            _url_3cs_ssl: false,            //3cs前缀，是否为ssl
            _sendlog: false,                //是否启用远端写日志
            _pingInterval: 2000,            //ping的间隔时长

            _defaultBusyText: "忙碌",       //默认忙碌显示文字
            _defaultIdleText: "空闲",       //默认空闲显示文字
            _islogin: false,                //是否已经登录
            _calling: false,                //是否在通话中
            _isCallout: false,              //通话中是否为外呼触发
            _preview: null,                 //预测外呼用
            _nowStatus: null,               //当前座席状态
            _busyType: 0,                   //当前坐席忙碌类型
            _hidePhone: false,              //是否隐藏号码不显示到界面
            _transmission_number: "",       //透传的号码(外呼时的主叫)
            _isMeeting: false,              //是否会议模式，会议模式没有咨询转接转IVR
            _isInnercall: false,            //是否内呼

            _callId: "",                    //callid
            _timestamp: "",                 //callid匹配的timestamp
            _caller: "",                    //主叫号码
            _called: "",                    //被叫号码
            _calling_from: "",              //通话中的状态来源
            _be_operator: "",               //被操作人

            _status: "",                     //当前CCS返回状态
            _statusText: "等待连接",        //当前状态文字
            _callingtimer: 0,               //通话时长
            _timerspan: 0,                  //状态栏计时秒数
            _timerId: 0,                    //状态栏时间控件编号
            _eventAlertTimeoutId: 0,        //事件提醒计时器编号

            _websocket: null,               //ws对象
            _websocket_ocx: null,           //ocx的ws对象
            _lastmsg: null,                 //最后一次发送的消息
            _useOcx: false,                 //是否使用了OCX
            _drawType: 0,                   //使用的全图标布局还是简版，1简版2全图标
            _calloutHideTCButton: false,    //外呼是否隐藏转接咨询按钮
            _openOnlyMuteCustomer: false, //保持时是否静音两端
            _getIdleAgentFromTC: 0,         //获取空闲来源，0无，1转接，2咨询
            _events: [],                    //事件列表
            _availablegroup: false,         //是否登录时先获取可用任务
            _selectionGroup: false,         //手动选择技能组登录
            _refreshReconnection: false,    //刷新后重新连接

            _busyTypeMap: null,             //忙碌类型map
            _serverType: 1,                 //服务类型
            _serverType_ccs: 1,             //服务类型,CCS
            _serverType_cti: 2,             //服务类型,CTI
            _clientType: 1,                 //客户端类型
            _clientType_sipphone: 1,        //客户端类型SIPPHONE
            _clientType_ocx: 2,             //客户端类型OCX
            _loginType_mobile: 0,           //手机方式登录
            _loginType_sip: 1,              //sip话机
            _loginType_web: 2,              //软话机

            _sendcmd: function (cmd) {
                this.cmd = cmd || 'ping';
            },

            //下面为功能性函数----------------------------------------------------------------------------------------------
            /**
             * 更改忙碌显示文字
             * @param showText
             */
            setBusyText: function (showText) {
                CallCenter._defaultBusyText = showText;
                jQuery(".CallCenter_defaultBusyText").html(showText);
                CallCenter._busyTypeMap.put(0, showText);
                return "success";
            },
            /**
             * 更改空闲显示文字
             * @param showText
             */
            setIdleText: function (showText) {
                CallCenter._defaultIdleText = showText;
                jQuery(".CallCenter_defaultIdleText").html(showText);
                return "success";
            },
            /**
             * 启用日志发送到服务器
             */
            openClientLog: function () {
                CallCenter._sendlog = true;
                CallCenter.log("开启发送日志到服务端", true);
                return "success";
            },
            /**
             * 关闭日志发送到服务器
             */
            closeClientLog: function () {
                CallCenter._sendlog = false;
                CallCenter.log("关闭发送日志到服务端", false);
                return "success";
            },
            /**
             * 开启外呼后显示咨询转接
             */
            openCalloutTC: function () {
                CallCenter._calloutHideTCButton = false;
                return "success";
            },
            /**
             * 关闭外呼后显示咨询转接
             */
            closeCalloutTC: function () {
                CallCenter._calloutHideTCButton = true;
                return "success";
            },
            /**
             * 隐藏号码段
             */
            hidePhone: function () {
                CallCenter._hidePhone = true;
                return "success";
            },
            /**
             * 显示完整号码
             */
            showPhone: function () {
                CallCenter._hidePhone = false;
                return "success";
            },
            /**
             * 设置透传号码
             * @param number
             */
            setTransmissionNumber: function (number) {
                CallCenter._transmission_number = number;
                return "success";
            },
            /**
             * 添加事件到监听
             * @param event
             * @param fun
             * @returns {*}
             */
            addEventListener: function (event, fun) {
                if (typeof(fun) != "function") {
                    return '';
                }
                if (typeof(CallCenter._events[event]) == 'undefined') {
                    CallCenter._events[event] = [];
                }
                var uuid = CallCenter.getUUID();
                CallCenter._events[event][uuid] = fun;
                return uuid;
            },
            /**
             * 根据事件id移除事件
             * @param event
             * @param uuid
             * @returns {number}
             */
            removeEventListener: function (event, uuid) {
                if (typeof(CallCenter._events[event]) == 'undefined') {
                    return 0;
                } else {
                    delete CallCenter._events[event][uuid];
                    return {result: 1, reason: 'succeeded'};
                }
            },
            /**
             * 获取事件函数当前个数
             * @param event
             * @returns {number}
             */
            getEventListenerCount: function (event) {
                if (typeof(CallCenter._events[event]) == 'undefined') {
                    return 0;
                } else {
                    return CallCenter._events[event].length;
                }
            },
            /**
             * 开启连接后获取技能组
             */
            openAvailablegroup: function () {
                CallCenter._availablegroup = true;
                return "success";
            },
            /**
             * 关闭连接后获取技能组
             */
            closeAvailablegroup: function () {
                CallCenter._availablegroup = false;
                return "success";
            },
            /**
             * 启用登录后选择技能组
             */
            openSelectionGroup: function () {
                CallCenter._selectionGroup = true;
                return "success";
            },
            /**
             * 关闭登录后选择技能组
             */
            closeSelectionGroup: function () {
                CallCenter._selectionGroup = false;
                return "success";
            },
            /**
             * 开启只静音客户
             */
            openOnlyMuteCustomer: function () {
                CallCenter._openOnlyMuteCustomer = true;
                return "success";
            },
            /**
             * 关闭只静音客户
             */
            closeOnlyMuteCustomer: function () {
                CallCenter._openOnlyMuteCustomer = false;
                return "success";
            },
            /**
             * 开启刷新后重新连接
             */
            openRefreshReconnection: function () {
                CallCenter._refreshReconnection = true;
                CallCenter.setlocalstorage("refreshReconnection", 1);
                return "success";
            },
            /**
             * 关闭刷新后重新连接
             */
            closeRefreshReconnection: function () {
                CallCenter._refreshReconnection = false;
                return "success";
            },
            /**
             * 设置登录的技能组
             * @param ids
             */
            setLoginGroups: function (ids) {
                CallCenter._logingroups = ids;
                CallCenter._sendcmd.prototype.logingroups = ids;
            },
            /**
             * 销毁布局
             */
            destory: function () {
                jQuery("#CallCenter_main").remove();
            },
            /**
             * 设置状态变化回调
             * @param fun
             */
            setStatusAndPhoneTextEvent: function (fun) {
                CallCenter.setStatusAndPhoneText_event = fun;
            },
            /**
             * 设置事件提醒回调
             * @param fun
             */
            setEventAlertEvent: function (fun) {
                CallCenter.eventAlert_event = fun;
            },
            /**
             * 开启日志输出
             * @returns {string}
             */
            openLog: function () {
                CallCenter._nolog = false;
                return "success";
            },
            /**
             * 关闭日志输出
             * @returns {string}
             */
            closeLog: function () {
                CallCenter._nolog = true;
                return "success";
            },
            //上面为功能性函数----------------------------------------------------------------------------------------------

            //下面为获取部分参数------------------------------------------------------------------------------------------
            /**
             * 获取版本信息
             * @returns {string}
             */
            getVersion: function () {
                return this.version;
            },
            /**
             * 获取Callid
             * @returns {string}
             */
            getCallid: function () {
                return CallCenter._callId;
            },
            /**
             * 获取Callid匹配的timestamp
             * @returns {string}
             */
            getTimestamp: function () {
                return CallCenter._timestamp;
            },
            /**
             * 获取主叫号码
             * @returns {string}
             */
            getCaller: function () {
                return CallCenter._caller;
            },
            /**
             * 获取被叫号码
             * @returns {string}
             */
            getCalled: function () {
                return CallCenter._called;
            },
            /**
             * 是否智能外呼
             * @returns {boolean}
             */
            isAuto: function () {
                if (CallCenter._auto == 0) {
                    return false;
                } else {
                    return true;
                }
            },
            /**
             * 获取WebSocket的连接地址
             * @returns {null}
             */
            getWsurl: function () {
                return CallCenter._wsurl;
            },
            /**
             * 获取企业ID
             * @returns {null}
             */
            getCompanyid: function () {
                return CallCenter._companyid;
            },
            /**
             * 获取企业简拼
             * @returns {null}
             */
            getAbbreviate: function () {
                return CallCenter._abbreviate;
            },
            /**
             * 获取工号
             * @returns {null}
             */
            getOperatorid: function () {
                return CallCenter._operatorid;
            },
            /**
             * 获取密码
             * @returns {null}
             */
            getPassword: function () {
                return CallCenter._password;
            },
            /**
             * 获取媒体IP
             * @returns {null}
             */
            getMediaip: function () {
                return CallCenter._media_ip;
            },
            /**
             * 获取媒体端口
             * @returns {null}
             */
            getMediaport: function () {
                return CallCenter._media_port;
            },
            /**
             * 获取SIP编号
             * @returns {null}
             */
            getSipid: function () {
                return CallCenter._sip_id;
            },
            /**
             * 获取SIP密码
             * @returns {null}
             */
            getSippwd: function () {
                return CallCenter._sip_pwd;
            },
            /**
             * 获取登录方式0手机,1SIP话机,2软话机
             * @returns {null}
             */
            getLoginType: function () {
                return CallCenter._logintype;
            },
            /**
             * 是否已经登录
             * @returns {boolean}
             */
            isLogin: function () {
                return CallCenter._islogin;
            },
            /**
             * 是否通话中
             * @returns {boolean}
             */
            isCalling: function () {
                return CallCenter._calling;
            },
            /**
             * 是否外呼
             * @returns {boolean}
             */
            isOutbound: function () {
                return CallCenter._isCallout;
            },
            /**
             * 获取当前状态,判断是否通话中使用，仅返回 logon/offwork/agentidle/agentbusy/after 其中一种
             * @returns {null}
             */
            getNowStatus: function () {
                return CallCenter._nowStatus;
            },
            /**
             * 获取当前状态
             * @returns {string}
             */
            getStatus: function () {
                return CallCenter._status;
            },
            /**
             * 获取当前状态文本
             * @returns {null}
             */
            getNowStatusText: function () {
                return CallCenter._statusText;
            },
            /**
             * 获取忙碌类型
             * @returns {number}
             */
            getBusyType: function () {
                return CallCenter._busyType;
            },
            /**
             * 获取忙碌类型Map
             * @returns {null}
             */
            getBusyTypeMap: function () {
                return CallCenter._busyTypeMap;
            },
            /**
             * 获取当前呼叫时长
             * @returns {number}
             */
            getCallDuration: function () {
                return CallCenter._callingtimer;
            },
            /**
             * 获取当前状态持续时长
             * @returns {number}
             */
            getStatusDuration: function () {
                if (CallCenter._calling) {
                    return CallCenter._callingtimer;
                } else {
                    return CallCenter._timerspan;
                }
            },
            /**
             * 获取使用的软话机类型
             * @returns {number}
             */
            getClientType: function () {
                return CallCenter._clientType;
            },
            /**
             * 获取透传号码
             * @returns {string}
             */
            getTransmissionNumber: function () {
                return CallCenter._transmission_number;
            },
            /**
             * 获取是否会议模式
             * @returns {boolean}
             */
            isMeeting: function () {
                return CallCenter._isMeeting;
            },
            /**
             * 获取通话来源,inringing/makecall/monitor/interceptcall/agentinsert
             */
            getCallFrom: function () {
                return CallCenter._calling_from;
            },
            /**
             * 获取是否登录前获取技能组
             * @returns {boolean}
             */
            getavailablegroup: function () {
                return CallCenter._availablegroup;
            },
            /**
             * 是否登录前选择技能组
             * @returns {boolean}
             */
            getSelectionGroup: function () {
                return CallCenter._selectionGroup;
            },
            /**
             * 获取被操作的座席
             * @returns {string}
             */
            getBeOperator: function () {
                return CallCenter._be_operator;
            },
            //上面为获取部分参数------------------------------------------------------------------------------------------

            //下面为对外公布的功能性函数-----------------------------------------------------------------------------------
            /**
             * 生成布局
             * @returns {*|jQuery|HTMLElement}
             */
            draw: function () {
                CallCenter._drawType = 1;
                jQuery("#CallCenter_css_drawAllIcon").remove();
                CallCenter.createCss(CallCenter._thisPath + "CallCenter.css", "CallCenter_css_draw");
                jQuery('#CallCenter_main').remove();
                var e1 = jQuery('<div id="CallCenter_main" class="navleft"></div>');
                var e1_1 = jQuery('<div id="CallCenter_status_bar" class="agent"></div>');
                e1_1.bind("click", function (e) {
                    jQuery('#CallCenter_status_buts').children().each(function () {
                        if (jQuery(this).css("display") != "none") {
                            CallCenter.showControl('#CallCenter_status_buts');
                            return false;
                        }
                    })
                })
                var e1_1_1 = jQuery('<span id="CallCenter_status_tiao" class="telbtn green"></span>');
                var e1_1_1_1 = jQuery('<div class="con"></div>');
                var e1_1_1_1_1 = jQuery('<div class="time" id="CallCenter_status_time">00:00:00</div>');
                var e1_1_1_1_2 = jQuery('<img src="' + CallCenter._thisPath + 'images/line.png" class="line"/>');
                var e1_1_1_1_3 = jQuery('<div id="CallCenter_status" class="status">等待连接</div>');
                var e1_1_1_1_4 = jQuery('<div id="CallCenter_phonenum" class="num"></div>');
                e1_1_1_1.append(e1_1_1_1_1);
                e1_1_1_1.append(e1_1_1_1_2);
                e1_1_1_1.append(e1_1_1_1_3);
                e1_1_1_1.append(e1_1_1_1_4);
                e1_1_1.append(e1_1_1_1);
                var e1_1_1_2 = jQuery('<span id="CallCenter_trig" class="trig"></span>');
                e1_1_1.append(e1_1_1_2);
                var e1_1_1_3 = jQuery('<div class="dialog">提醒</div>');
                e1_1_1.append(e1_1_1_3);
                e1_1.append(e1_1_1);

                var e1_1_2 = jQuery('<ul id="CallCenter_status_buts" class="softphone" style="display:none;"></ul>');
                var e1_1_2_1 = jQuery('<li id="CallCenter_free" style="display:none;"></li>');
                var e1_1_2_1_1 = jQuery('<span class="CallCenter_defaultIdleText" style="color:#468847;">' + CallCenter._defaultIdleText + '</span>');
                e1_1_2_1_1.bind("click", function (e) {
                    CallCenter.free();
                    jQuery("#CallCenter_status_buts").hide();
                    e.stopPropagation();
                    return false;
                })
                e1_1_2_1.append(e1_1_2_1_1);
                e1_1_2.append(e1_1_2_1);

                var e1_1_2_2 = jQuery('<li class="CallCenter_busy" id="CallCenter_busy" style="display:none;"></li>');
                var e1_1_2_2_1 = jQuery('<span class="CallCenter_defaultBusyText">' + CallCenter._defaultBusyText + '</span>');
                e1_1_2_2_1.bind("click", function (e) {
                    CallCenter.busy();
                    jQuery("#CallCenter_status_buts").hide();
                    e.stopPropagation();
                    return false;
                })
                e1_1_2_2.append(e1_1_2_2_1);
                e1_1_2.append(e1_1_2_2);
                e1_1.append(e1_1_2);
                e1.append(e1_1);
                jQuery(document).bind("click", function (e) {
                    if (jQuery(e.target).closest("#CallCenter_main").length == 0) {
                        jQuery("#CallCenter_status_buts").hide();
                        jQuery("#CallCenter_main .enternum").hide();
                    }
                });

                var e1_2 = jQuery('<div class="telbtns"></div>');
                var e1_2_1 = jQuery('<span id="CallCenter_calloutbut" class="outphone" style="display:none;"></span>');
                e1_2_1.bind("click", function () {
                    jQuery('#CallCenter_main .enternum').fadeIn();
                    jQuery('#CallCenter_main .enternum .numtxt').focus();
                })
                var e1_2_1_1 = jQuery('<img src="' + CallCenter._thisPath + 'images/phone.png"/>');
                var e1_2_1_2 = jQuery('<div class="dialog">外呼<i class="pointer"></i></div>');
                var e1_2_1_3 = jQuery('<div id="CallCenter_call_div" class="enternum"></div>');
                var e1_2_1_3_1 = jQuery('<div class="arrow"></div>');
                var e1_2_1_3_2 = jQuery('<div class="popover_content"></div>');
                var e1_2_1_3_2_1 = jQuery('<input type="text" placeholder="输入号码点击回车键发起呼叫" class="numtxt"/>');
                e1_2_1_3_2_1.bind(CallCenter.callOutKeypress);
                e1_2_1_3_2.append(e1_2_1_3_2_1);
                e1_2_1_3.append(e1_2_1_3_1);
                e1_2_1_3.append(e1_2_1_3_2);
                e1_2_1.append(e1_2_1_1);
                e1_2_1.append(e1_2_1_2);
                e1_2_1.append(e1_2_1_3);
                e1_2.append(e1_2_1);

                //挂机
                var e1_2_2 = jQuery('<span id="CallCenter_hangupbut" class="hang_up" style="display:none;"><img src="' + CallCenter._thisPath + 'images/hangup.png"/><div class="dialog">挂机<i class="pointer"></i></div></span>');
                e1_2_2.bind("click", function () {
                    CallCenter.cancelmakecall();
                });
                //保持
                var e1_2_3 = jQuery('<span id="CallCenter_mutebut" class="holding" style="display:none;"><img src="' + CallCenter._thisPath + 'images/bc.png"/><div class="dialog">保持<i class="pointer"></i></div></span>');
                e1_2_3.bind("click", function () {
                    CallCenter.mute();
                });
                //恢复
                var e1_2_4 = jQuery('<span id="CallCenter_unmutebut" class="recovery" style="display:none;"><img src="' + CallCenter._thisPath + 'images/hf.png"/><div class="dialog">恢复<i class="pointer"></i></div></span>');
                e1_2_4.bind("click", function () {
                    CallCenter.unmute();
                });
                //下班
                var e1_2_5 = jQuery('<span id="CallCenter_logoutbut" class="recovery" style="display:none;"><img src="' + CallCenter._thisPath + 'images/hf.png"/><div class="dialog">下班<i class="pointer"></i></div></span>');
                e1_2_5.bind("click", function () {
                    CallCenter.logout();
                });
                //转接
                var e1_2_6 = jQuery('<span id="CallCenter_transfercallbut" class="switch" style="display:none;"><img src="' + CallCenter._thisPath + 'images/zj.png"/><div class="dialog">转接<i class="pointer"></i></div></span>');
                e1_2_6.bind("click", function () {
                    CallCenter._getIdleAgentFromTC = 1;
                    CallCenter.idleagents();
                });
                //结束转接
                var e1_2_61 = jQuery('<span id="CallCenter_canceltransfercallbut" class="canceltransfercall" style="display:none;"><img src="' + CallCenter._thisPath + 'images/jszx.png"/><div class="dialog">结束转接<i class="pointer"></i></div></span>');
                e1_2_61.bind("click", function () {
                    CallCenter.canceltransfercall();
                });
                //咨询
                var e1_2_7 = jQuery('<span id="CallCenter_consultbut" class="consult" style="display:none;"><img src="' + CallCenter._thisPath + 'images/zx.png"/><div class="dialog">咨询<i class="pointer"></i></div></span>');
                e1_2_7.bind("click", function () {
                    CallCenter._getIdleAgentFromTC = 2;
                    CallCenter.idleagents();
                });
                //结束咨询
                var e1_2_8 = jQuery('<span id="CallCenter_consultbackbut" class="over_consult" style="display:none;"><img src="' + CallCenter._thisPath + 'images/jszx.png"/><div class="dialog">结束咨询<i class="pointer"></i></div></span>');
                e1_2_8.bind("click", function () {
                    CallCenter.agentconsultback();
                });
                //转IVR菜单
                var e1_2_9 = jQuery('<span id="CallCenter_ivrbut" class="ivr" style="display:none"><img src="' + CallCenter._thisPath + 'images/zcd.png"/><div class="dialog">IVR菜单<i class="pointer"></i></div></span>');
                e1_2_9.bind("click", function () {

                });
                //满意度
                var e1_2_10 = jQuery('<span id="CallCenter_serviceevaluatebut" class="degree" style="display:none"><img src="' + CallCenter._thisPath + 'images/zmyd.png"/><div class="dialog">转满意度调查<i class="pointer"></i></div></span>');
                e1_2_10.bind("click", function () {
                    CallCenter.serviceevaluate();
                });
                //三方通话
                var e1_2_11 = jQuery('<span id="CallCenter_tripartitetalkbut" class="sf" style="display:none;"><img src="' + CallCenter._thisPath + 'images/threeCall.png"/><div class="dialog">转三方通话<i class="pointer"></i></div></span>');
                e1_2_11.bind("click", function () {
                    CallCenter.tripartitetalk();
                });
                //咨询转接
                var e1_2_12 = jQuery('<span id="CallCenter_shiftbut" class="zxzj" style="display:none;"><img src="' + CallCenter._thisPath + 'images/zj.png"/><div class="dialog">咨询转接<i class="pointer"></i></div></span>');
                e1_2_12.bind("click", function () {
                    CallCenter.agentshift();
                });
                //摘机
                var e1_2_19 = jQuery('<span id="CallCenter_answer" class="zxzj" style="display:none;"><img src="' + CallCenter._thisPath + 'images/phone.png"/><div class="dialog">摘机<i class="pointer"></i></div></span>');
                e1_2_19.bind("click", function () {
                    CallCenter.acceptcall();
                });
                //拨号
                var e1_2_20 = jQuery('<span id="CallCenter_bohao" class="hang_up" style="display:none;"><img src="' + CallCenter._thisPath + 'images/bohao.png"/><div class="dialog">拨号<i class="pointer"></i></div></span>');
                e1_2_20.find("img").bind("click", function () {
                    if (jQuery('#CallCenter_jianpan').is(':hidden')) {
                        jQuery('#CallCenter_jianpan').show();
                    } else {
                        jQuery('#CallCenter_jianpan').hide();
                    }
                });
                e1_2_20.append(CallCenter.dialPlate());
                //刷新
                var e1_2_21 = jQuery('<span id="CallCenter_refresh" style="display:none;"><img src="' + CallCenter._thisPath + 'images/threeCall.png"/><div class="dialog">刷新<i class="pointer"></i></div></span>');
                e1_2_21.bind("click", function () {
                    CallCenter.availablegroup();
                });

                e1_2.append(e1_2_2);
                e1_2.append(e1_2_3);
                e1_2.append(e1_2_4);
                //e1_2.append(e1_2_5);
                e1_2.append(e1_2_6);
                e1_2.append(e1_2_61);
                e1_2.append(e1_2_7);
                e1_2.append(e1_2_8);
                e1_2.append(e1_2_9);
                e1_2.append(e1_2_10);
                e1_2.append(e1_2_11);
                e1_2.append(e1_2_12);
                e1_2.append(e1_2_19);
                e1_2.append(e1_2_20);
                e1_2.append(e1_2_21);

                e1_2.find('span').hover(function () {
                    var obj = jQuery(this);
                    obj.find('.dialog').filter(':not(:animated)').fadeIn('fast');
                    CallCenter._eventAlertTimeoutId = setTimeout(function () {
                        obj.find('.dialog').fadeOut('fast');
                    }, 1000);
                }, function () {
                    jQuery(this).find('.dialog').fadeOut('fast');
                });
                e1.append(e1_2);
                CallCenter.addBusyButton(e1);
                return e1;
            },
            /**
             * 生成全按钮的布局
             */
            drawAllIcon: function () {
                jQuery("#CallCenter_css_draw").remove();
                CallCenter._drawType = 2;
                CallCenter.createCss(CallCenter._thisPath + "CallCenterAllIcon.css", "CallCenter_css_drawAllIcon");
                var e_1 = jQuery('<div id="CallCenter_main"></div>');
                var e_a = jQuery('<span class="CallCenter_button"></span>');
                var e_icon = jQuery('<div class="CallCenter_icon"></div>');
                var e_text = jQuery('<div class="CallCenter_text"></div>');

                var e_1_1_a = e_a.clone();
                var e_1_1_icon = e_icon.clone();
                var e_1_1_text = e_text.clone();
                e_1_1_icon.attr("id", "CallCenter_login_icon").append('<img src="images/all/active/changtai-1.png"/>');
                e_1_1_text.attr("id", "CallCenter_login_text").html("登录");
                e_1_1_a.attr("id", "CallCenter_login").append(e_1_1_icon).append(e_1_1_text);
                e_1_1_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.init();
                })
                e_1.append(e_1_1_a);

                var e_1_2_a = e_a.clone();
                var e_1_2_icon = e_icon.clone();
                var e_1_2_text = e_text.clone();
                e_1_2_icon.attr("id", "CallCenter_free_icon").append('<img src="images/all/static/changtai-2.png"/>');
                e_1_2_text.attr("id", "CallCenter_free_text").addClass("CallCenter_defaultIdleText").html(CallCenter._defaultIdleText);
                e_1_2_a.attr("id", "CallCenter_free").append(e_1_2_icon).append(e_1_2_text);
                e_1_2_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.free();
                })
                e_1.append(e_1_2_a);

                var e_1_3_a = e_a.clone();
                var e_1_3_icon = e_icon.clone();
                var e_1_3_text = e_text.clone();
                var e_1_3_ul = jQuery('<ul id="CallCenter_busyList"></ul>');
                e_1_3_icon.attr("id", "CallCenter_busy_icon").append('<img src="images/all/static/changtai-3.png"/>');
                e_1_3_text.attr("id", "CallCenter_busy_text").addClass("CallCenter_defaultBusyText").html("忙碌类型");
                e_1_3_a.attr("id", "CallCenter_busy").addClass("CallCenter_busy").append(e_1_3_icon).append(e_1_3_text).append(e_1_3_ul);
                e_1_3_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        jQuery("#CallCenter_busyList").show();
                    }
                })
                e_1.append(e_1_3_a);
                jQuery(document).bind("click", function (e) {
                    if (jQuery(e.target).closest("#CallCenter_busy").length == 0) {
                        jQuery("#CallCenter_busyList").hide();
                    }
                });

                var e_1_4_a = e_a.clone();
                var e_1_4_icon = e_icon.clone();
                var e_1_4_text = e_text.clone();
                e_1_4_icon.attr("id", "CallCenter_mutebut_icon").append('<img src="images/all/static/changtai-20.png"/>');
                e_1_4_text.attr("id", "CallCenter_mutebut_text").html("保持");
                e_1_4_a.attr("id", "CallCenter_mutebut").append(e_1_4_icon).append(e_1_4_text);
                e_1_4_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.mute();
                })
                e_1.append(e_1_4_a);

                var e_1_4i_a = e_a.clone();
                var e_1_4i_icon = e_icon.clone();
                var e_1_4i_text = e_text.clone();
                e_1_4i_icon.attr("id", "CallCenter_unmutebut_icon").append('<img src="images/all/static/changtai-4.png"/>');
                e_1_4i_text.attr("id", "CallCenter_unmutebut_text").html("取消保持");
                e_1_4i_a.attr("id", "CallCenter_unmutebut").append(e_1_4i_icon).append(e_1_4i_text);
                e_1_4i_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.unmute();
                })
                e_1.append(e_1_4i_a);

                var e_1_5_a = e_a.clone();
                var e_1_5_icon = e_icon.clone();
                var e_1_5_text = e_text.clone();
                e_1_5_icon.attr("id", "CallCenter_consultbut_icon").append('<img src="images/all/static/changtai-5.png"/>');
                e_1_5_text.attr("id", "CallCenter_consultbut_text").html("咨询");
                e_1_5_a.attr("id", "CallCenter_consultbut").append(e_1_5_icon).append(e_1_5_text);
                e_1_5_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        CallCenter._getIdleAgentFromTC = 2;
                        CallCenter.idleagents();
                    }
                })
                e_1.append(e_1_5_a);

                var e_1_6_a = e_a.clone();
                var e_1_6_icon = e_icon.clone();
                var e_1_6_text = e_text.clone();
                e_1_6_icon.attr("id", "CallCenter_consultbackbut_icon").append('<img src="images/all/static/changtai-6.png"/>');
                e_1_6_text.attr("id", "CallCenter_consultbackbut_text").html("咨询接回");
                e_1_6_a.attr("id", "CallCenter_consultbackbut").append(e_1_6_icon).append(e_1_6_text);
                e_1.append(e_1_6_a);

                var e_1_7_a = e_a.clone();
                var e_1_7_icon = e_icon.clone();
                var e_1_7_text = e_text.clone();
                e_1_7_icon.attr("id", "CallCenter_transfercallbut_icon").append('<img src="images/all/static/changtai-7.png"/>');
                e_1_7_text.attr("id", "CallCenter_transfercallbut_text").html("转移");
                e_1_7_a.attr("id", "CallCenter_transfercallbut").append(e_1_7_icon).append(e_1_7_text);
                e_1_7_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        CallCenter._getIdleAgentFromTC = 1;
                        CallCenter.idleagents();
                    }
                })
                e_1.append(e_1_7_a);

                var e_1_8_a = e_a.clone();
                var e_1_8_icon = e_icon.clone();
                var e_1_8_text = e_text.clone();
                e_1_8_icon.attr("id", "CallCenter_tripartitetalkbut_icon").append('<img src="images/all/static/changtai-8.png"/>');
                e_1_8_text.attr("id", "CallCenter_tripartitetalkbut_text").html("会议");
                e_1_8_a.attr("id", "CallCenter_tripartitetalkbut").append(e_1_8_icon).append(e_1_8_text);
                e_1_8_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.tripartitetalk();
                })
                e_1.append(e_1_8_a);

                //var e_1_9_a = e_a.clone();
                //var e_1_9_icon = e_icon.clone();
                //var e_1_9_text = e_text.clone();
                //e_1_9_icon.attr("id", "CallCenter_monitor_icon").append('<img src="images/all/static/changtai-9.png"/>');
                //e_1_9_text.attr("id", "CallCenter_monitor_text").html("监听");
                //e_1_9_a.attr("id", "CallCenter_monitor").append(e_1_9_icon).append(e_1_9_text);
                //e_1.append(e_1_9_a);
                //
                //var e_1_10_a = e_a.clone();
                //var e_1_10_icon = e_icon.clone();
                //var e_1_10_text = e_text.clone();
                //e_1_10_icon.attr("id", "CallCenter_agentinsert_icon").append('<img src="images/all/static/changtai-10.png"/>');
                //e_1_10_text.attr("id", "CallCenter_agentinsert_text").html("强插");
                //e_1_10_a.attr("id", "CallCenter_agentinsert").append(e_1_10_icon).append(e_1_10_text);
                //e_1.append(e_1_10_a);
                //
                //var e_1_11_a = e_a.clone();
                //var e_1_11_icon = e_icon.clone();
                //var e_1_11_text = e_text.clone();
                //e_1_11_icon.attr("id", "CallCenter_agentbreak_icon").append('<img src="images/all/static/changtai-11.png"/>');
                //e_1_11_text.attr("id", "CallCenter_agentbreak_text").html("强拆");
                //e_1_11_a.attr("id", "CallCenter_agentbreak").append(e_1_11_icon).append(e_1_11_text);
                //e_1.append(e_1_11_a);

                var e_1_12_a = e_a.clone();
                var e_1_12_icon = e_icon.clone();
                var e_1_12_text = e_text.clone();
                e_1_12_icon.attr("id", "CallCenter_calloutbut_icon").append('<img src="images/all/static/changtai-12.png"/>');
                e_1_12_text.attr("id", "CallCenter_calloutbut_text").html("外呼");
                e_1_12_a.attr("id", "CallCenter_calloutbut").append(e_1_12_icon).append(e_1_12_text);
                e_1_12_a.bind("click", function (e) {
                    if (jQuery(this).find("img").data("status") == "active") {
                        if (jQuery(this).find("#CallCenter_call_div").length == 0 || jQuery("#CallCenter_call_div").is(":hidden")) {
                            jQuery(this).append(jQuery("#CallCenter_call_div"));
                            jQuery("#CallCenter_call_div").show().find("input").focus();
                        }
                    }
                })
                e_1.append(e_1_12_a);

                var call_div = jQuery('<div id="CallCenter_call_div" class="enternum"></div>');
                var call_div_1 = jQuery('<div class="arrow"></div>');
                var call_div_2 = jQuery('<div class="popover_content"></div>');
                var call_div_2_1 = jQuery('<input type="text" placeholder="输入号码点击回车键发起呼叫" class="numtxt"/>');
                call_div_2_1.bind(CallCenter.callOutKeypress);
                call_div_2.append(call_div_2_1);
                call_div.append(call_div_1);
                call_div.append(call_div_2);

                jQuery(document).bind("click", function (e) {
                    if (jQuery(e.target).closest("#CallCenter_calloutbut").length == 0 && jQuery(e.target).closest("#CallCenter_innercall").length == 0) {
                        jQuery("#CallCenter_call_div").hide();
                    }
                });
                e_1_12_a.append(call_div);

                var e_1_13_a = e_a.clone();
                var e_1_13_icon = e_icon.clone();
                var e_1_13_text = e_text.clone();
                e_1_13_icon.attr("id", "CallCenter_innercall_icon").append('<img src="images/all/static/changtai-13.png"/>');
                e_1_13_text.attr("id", "CallCenter_innercall_text").html("内呼");
                e_1_13_a.attr("id", "CallCenter_innercall").append(e_1_13_icon).append(e_1_13_text);
                e_1_13_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        if (jQuery(this).find("#CallCenter_call_div").length == 0 || jQuery("#CallCenter_call_div").is(":hidden")) {
                            jQuery(this).append(jQuery("#CallCenter_call_div"));
                            jQuery("#CallCenter_call_div").show().find("input").focus();
                        }
                    }
                })
                e_1.append(e_1_13_a);

                var e_1_14_a = e_a.clone();
                var e_1_14_icon = e_icon.clone();
                var e_1_14_text = e_text.clone();
                e_1_14_icon.attr("id", "CallCenter_ivrbut_icon").append('<img src="images/all/static/changtai-14.png"/>');
                e_1_14_text.attr("id", "CallCenter_ivrbut_text").html("IVR菜单");
                e_1_14_a.attr("id", "CallCenter_ivrbut").append(e_1_14_icon).append(e_1_14_text);
                e_1.append(e_1_14_a);

                var e_1_15_a = e_a.clone();
                var e_1_15_icon = e_icon.clone();
                var e_1_15_text = e_text.clone();
                e_1_15_icon.attr("id", "CallCenter_hangupbut_icon").append('<img src="images/all/static/changtai-15.png"/>');
                e_1_15_text.attr("id", "CallCenter_hangupbut_text").html("挂断");
                e_1_15_a.attr("id", "CallCenter_hangupbut").append(e_1_15_icon).append(e_1_15_text);
                e_1_15_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.cancelmakecall();
                })
                e_1.append(e_1_15_a);

                var e_1_15i_a = e_a.clone();
                var e_1_15i_icon = e_icon.clone();
                var e_1_15i_text = e_text.clone();
                e_1_15i_icon.attr("id", "CallCenter_answer_icon").append('<img src="images/all/static/changtai-19.png"/>');
                e_1_15i_text.attr("id", "CallCenter_answer_text").html("接听");
                e_1_15i_a.attr("id", "CallCenter_answer").append(e_1_15i_icon).append(e_1_15i_text);
                e_1_15i_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.acceptcall();
                })
                e_1.append(e_1_15i_a);

                var e_1_16_a = e_a.clone();
                var e_1_16_icon = e_icon.clone();
                var e_1_16_text = e_text.clone();
                e_1_16_icon.attr("id", "CallCenter_bohao_icon").append('<img src="images/all/static/changtai-16.png"/>');
                e_1_16_text.attr("id", "CallCenter_bohao_text").html("按键");
                e_1_16_a.attr("id", "CallCenter_bohao").append(e_1_16_icon).append(e_1_16_text);
                e_1_16_icon.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        if (jQuery('#CallCenter_jianpan').is(':hidden')) {
                            jQuery('#CallCenter_jianpan').show();
                        } else {
                            jQuery('#CallCenter_jianpan').hide();
                        }
                    }
                })
                e_1_16_a.append(CallCenter.dialPlate());
                e_1.append(e_1_16_a);

                var e_1_17_a = e_a.clone();
                var e_1_17_icon = e_icon.clone();
                var e_1_17_text = e_text.clone();
                e_1_17_icon.attr("id", "CallCenter_reset_icon").append('<img src="images/all/static/changtai-17.png"/>');
                e_1_17_text.attr("id", "CallCenter_reset_text").html("重置");
                e_1_17_a.attr("id", "CallCenter_reset").append(e_1_17_icon).append(e_1_17_text);
                e_1_17_a.bind("click", function () {
                    CallCenter.initControl();
                })
                e_1.append(e_1_17_a);

                var e_1_18_a = e_a.clone();
                var e_1_18_icon = e_icon.clone();
                var e_1_18_text = e_text.clone();
                e_1_18_icon.attr("id", "CallCenter_logoutbut_icon").append('<img src="images/all/static/changtai-18.png"/>');
                e_1_18_text.attr("id", "CallCenter_logoutbut_text").html("退出");
                e_1_18_a.attr("id", "CallCenter_logoutbut").append(e_1_18_icon).append(e_1_18_text);
                e_1_18_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.logout();
                })
                e_1.append(e_1_18_a);
                e_1.append('<div style="clear:both;"></div>');

                CallCenter.bindHover(e_1_1_a);
                CallCenter.bindHover(e_1_2_a);
                CallCenter.bindHover(e_1_3_a);
                CallCenter.bindHover(e_1_4_a);
                CallCenter.bindHover(e_1_4i_a);
                CallCenter.bindHover(e_1_5_a);
                CallCenter.bindHover(e_1_6_a);
                CallCenter.bindHover(e_1_7_a);
                CallCenter.bindHover(e_1_8_a);
                //CallCenter.bindHover(e_1_9_a);
                //CallCenter.bindHover(e_1_10_a);
                //CallCenter.bindHover(e_1_11_a);
                CallCenter.bindHover(e_1_12_a);
                CallCenter.bindHover(e_1_13_a);
                CallCenter.bindHover(e_1_14_a);
                CallCenter.bindHover(e_1_15_a);
                CallCenter.bindHover(e_1_15i_a);
                CallCenter.bindHover(e_1_16_a);
                CallCenter.bindHover(e_1_17_a);
                CallCenter.bindHover(e_1_18_a);
                CallCenter.addBusyButton(e_1);
                return e_1;
            },
            callOutKeypress: {
                keypress: function (e) {
                    e = (e) ? e : ((window.event) ? window.event : "");
                    var key = e.keyCode ? e.keyCode : e.which;//兼容IE和Firefox获得keyBoardEvent对象的键值
                    if (key < 48 && key != 8 && key != 13 && key != 46) {
                        if (e && e.stopPropagation) {
                            e.stopPropagation();
                        } else {
                            window.event.cancelBubble = true;
                        }
                        return false;
                    }
                    if ((key > 57 && key < 64) || (key > 90 && key < 97) || (key > 122)) {
                        if (e && e.stopPropagation) {
                            e.stopPropagation();
                        } else {
                            window.event.cancelBubble = true;
                        }
                        return false;
                    }
                    if (key == 13) {
                        CallCenter.callout(this, e);
                        jQuery("#CallCenter_call_div").hide();
                    }
                }, click: function (e) {
                    e.preventDefault();
                    return false;
                }
            },
            /**
             * 使控件恢复最后一次样式
             */
            applyLastStyle: function () {
                var nowStatus = CallCenterStatus.current;
                var statusName = nowStatus.charAt(0).toUpperCase() + nowStatus.substr(1);
                var fun = CallCenterStatus['onenter' + statusName];
                if (typeof(fun) == "function") {
                    CallCenter.log("应用样式[" + 'onenter' + statusName + "]");
                    fun();
                } else {
                    CallCenter.log("当前状态无法应用样式[" + statusName + "]");
                }
            },
            /**
             * 工号密码方式登录
             * @param operator 工号
             * @param pwd 密码
             * @param companyid 企业id
             * @param logintype 登录方式，0手机，1硬话机，2软话机
             * @param auto 是否智能外呼,0否1是
             * @param logingroups 智能外呼时，登录到的技能组id
             * @param url_3cs 3CS连接地址
             * @param server_type CCS类型
             */
            opLogin: function (operator, pwd, companyid, logintype, auto, logingroups, url_3cs, client_type, server_type, sip_id) {
                if (url_3cs) {
                    CallCenter.set3CS_url(url_3cs);
                }
                CallCenter.log("operator:" + operator + ", pwd:" + pwd + ", companyid:" + companyid + ", logintype:" + logintype + ", auto:" + auto + ", logingroups:" + logingroups + ", url_3cs:" + url_3cs + ", client_type:" + client_type + ", server_type:" + server_type + ", sip_id:" + sip_id);
                if (CallCenter._url_3cs == null || CallCenter._url_3cs == "") {
                    CallCenter.log("没有设置服务器连接地址");
                    alert("请先设置服务器连接地址");
                } else {
                    if (server_type == CallCenter._serverType_ccs || server_type == CallCenter._serverType_cti) {
                        CallCenter._serverType = server_type;
                    } else {
                        CallCenter._serverType = CallCenter._serverType_ccs;
                    }
                    if (!sip_id) {
                        sip_id = '';
                    }
                    var url = CallCenter._url_3cs + "/Api/get_login_info4operator";
                    if (CallCenter._url_3cs_ssl) {
                        url = "https://" + url;
                    } else {
                        url = "http://" + url;
                    }
                    url = url + "?operator=" + operator + "&pwd=" + pwd + "&companyid=" + companyid + "&server_type=" + CallCenter._serverType + "&sip_id=" + sip_id + "&callback=?"
                    CallCenter._getLoginInfo(url, logintype, auto, logingroups, client_type, server_type);
                }
            },
            /**
             * sip和密码方式登录
             * @param sip_id SIP 账号
             * @param sip_pwd SIP 密码
             * @param companyid 企业id
             * @param logintype 登录方式，0手机，1硬话机，2软话机
             * @param auto 是否智能外呼,0否1是
             * @param logingroups 智能外呼时，登录到的技能组id
             * @param url_3cs 3CS连接地址
             */
            sipLogin: function (sip_id, sip_pwd, companyid, logintype, auto, logingroups, url_3cs, client_type, server_type) {
                if (url_3cs) {
                    CallCenter.set3CS_url(url_3cs);
                }
                CallCenter.log("sip_id:" + sip_id + ", sip_pwd:" + sip_pwd + ", companyid:" + companyid + ", logintype:" + logintype + ", auto:" + auto + ", logingroups:" + logingroups + ", url_3cs:" + url_3cs + ", client_type:" + client_type + ", server_type:" + server_type);
                if (CallCenter._url_3cs == null || CallCenter._url_3cs == "") {
                    CallCenter.log("没有设置服务器连接地址");
                    alert("请先设置服务器连接地址");
                } else {
                    if (server_type == CallCenter._serverType_ccs || server_type == CallCenter._serverType_cti) {
                        CallCenter._serverType = server_type;
                    } else {
                        CallCenter._serverType = CallCenter._serverType_ccs;
                    }
                    var url = CallCenter._url_3cs + "/Api/get_login_info4sip";
                    if (CallCenter._url_3cs_ssl) {
                        url = "https://" + url;
                    } else {
                        url = "http://" + url;
                    }
                    url = url + "?sip_id=" + sip_id + "&sip_pwd=" + sip_pwd + "&companyid=" + companyid + "&server_type=" + CallCenter._serverType + "&callback=?";
                    CallCenter._getLoginInfo(url, logintype, auto, logingroups, client_type, server_type);
                }
            },
            /**
             * 登录
             */
            login: function () {
                return CallCenterStatus.login_handle();
            },
            /**
             * 登出
             */
            logout: function () {
                CallCenter.setlocalstorage("last_msg", "logout");
                return CallCenterStatus.logout_handle();
            },
            /**
             * 示闲
             */
            free: function () {
                return CallCenterStatus.agentidle_handle();
            },
            /**
             * 示忙
             */
            busy: function (busydescr) {
                return CallCenterStatus.agentbusy_handle(busydescr);
            },
            /**
             * 接听
             * @constructor
             */
            acceptcall: function () {
                return CallCenterStatus.acceptcall_handle();
            },
            /**
             * 外呼
             */
            callout: function (obj, e, preview, transmission_number) {
                var called = "";
                var caller = CallCenter._transmission_number;
                if ("string" == typeof(obj)) {
                    called = obj;
                } else if (e.keyCode == 13) {
                    called = obj.value;
                }
                called = called.replace(/[^0-9a-zA-Z@]/ig, "");
                if (called == "") {
                    return {result: 0, reason: '外呼的号码不能为空'};
                } else {
                    if (called.length > 32) {
                        called = called.substr(0, 32);
                    }
                    if (typeof(transmission_number) != "undefined") {
                        caller = transmission_number;
                    }
                    return CallCenterStatus.makecall_handle(called, caller, preview);
                }
            },
            /**
             * 挂断呼叫
             */
            cancelmakecall: function () {
                return CallCenterStatus.cancelmakecall_handle();
            },
            /**
             * 按键
             * @constructor
             */
            sendDTMF: function (key) {
                if (CallCenter._serverType == CallCenter._serverType_cti) {
                    var sendobj = new CallCenter._sendcmd("senddtmf");
                    sendobj.num = key;
                    CallCenter.send(sendobj);
                } else {
                    SoftPhone.SendDTMF(key);
                }
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 静音
             */
            mute: function () {
                return CallCenterStatus.mute_handle();
            },
            /**
             * 取消静音
             */
            unmute: function () {
                return CallCenterStatus.unmute_handle();
            },
            /**
             * 咨询
             */
            agentconsult: function (number, userdata) {
                return CallCenterStatus.agentconsult_handle(number, userdata);
            },
            /**
             * 取消咨询
             */
            agentconsultback: function () {
                return CallCenterStatus.agentconsultback_handle();
            },
            /**
             * 咨询转接
             */
            agentshift: function () {
                return CallCenterStatus.agentshift_handle();
            },
            /**
             * 咨询服务
             */
            consulationservice: function (filename, groupid, userdata, num) {
                return CallCenterStatus.consulationservice_handle(filename, groupid, userdata, num);
            },
            /**
             * 三方
             */
            tripartitetalk: function () {
                return CallCenterStatus.tripartitetalk_handle();
            },
            /**
             * 转接
             */
            transfercall: function (number, groupid, userdata) {
                return CallCenterStatus.transfercall_handle(number, groupid, userdata);
            },
            /**
             * 转接到技能组
             */
            transfergroup: function (groupid, userdata) {
                return CallCenterStatus.transfergroup_handle(groupid, userdata);
            },
            /**
             * 取消转接
             * @returns {CallCenter}
             */
            canceltransfercall: function () {
                return CallCenterStatus.canceltransfercall_handle();
            },
            /**
             * 转接服务
             */
            transferservice: function (filename, num) {
                return CallCenterStatus.transferservice_handle(filename, num);
            },
            /**
             * 监控座席
             */
            monitoragent: function () {
                CallCenter.log("启动监控座席");
                var sendobj = new CallCenter._sendcmd("monitoragent");
                CallCenter.send(sendobj);
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 监听
             */
            monitor: function (agentid) {
                if (CallCenter._auto == 0) {
                    return CallCenterStatus.monitor_handle(agentid);
                } else {
                    var reason = '预测外呼下不允许进行监听';
                    CallCenter.eventAlert(reason);
                    return {result: 0, reason: reason};
                }
            },
            /**
             * 强插
             */
            agentinsert: function (agentid) {
                if (CallCenter._auto == 0) {
                    return CallCenterStatus.agentinsert_handle(agentid);
                } else {
                    var reason = '预测外呼下不允许进行强插';
                    CallCenter.eventAlert(reason);
                    return {result: 0, reason: reason};
                }
            },
            /**
             * 拦截
             */
            agentinterceptcall: function (agentid) {
                if (CallCenter._auto == 0) {
                    return CallCenterStatus.agentinterceptcall_handle(agentid);
                } else {
                    var reason = '预测外呼下不允许进行拦截';
                    CallCenter.eventAlert(reason);
                    return {result: 0, reason: reason};
                }
            },
            /**
             * 强拆
             */
            agentbreak: function (agentid) {
                var sendobj = new CallCenter._sendcmd("agentbreak");
                sendobj.agentoperatorid = agentid;
                CallCenter.send(sendobj);
                if (typeof(CallCenter.agentbreak_callback) == "function") {
                    CallCenter.agentbreak_callback();
                }
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 强制示忙
             */
            forcebusy: function (agentid) {
                var sendobj = new CallCenter._sendcmd("forcebusy");
                sendobj.agentoperatorid = agentid;
                CallCenter.send(sendobj);
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 强制示闲
             */
            forceidle: function (agentid) {
                var sendobj = new CallCenter._sendcmd("forceidle");
                sendobj.agentoperatorid = agentid;
                CallCenter.send(sendobj);
                if (typeof(CallCenter.forceidle_callback) == "function") {
                    CallCenter.forceidle_callback();
                }
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 强制签出
             */
            forcelogout: function (agentid) {
                var sendobj = new CallCenter._sendcmd("forcelogout");
                sendobj.agentoperatorid = agentid;
                CallCenter.send(sendobj);
                if (typeof(CallCenter.forcelogout_callback) == "function") {
                    CallCenter.forcelogout_callback();
                }
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 获取空闲座席
             */
            idleagents: function (type) {
                CallCenter.log("获取空闲座席");
                var sendobj = new CallCenter._sendcmd("idleagents");
                type = type || 0;
                sendobj.type = type;
                CallCenter.send(sendobj);

                if (typeof(CallCenter.idleagents_callback) == "function") {
                    CallCenter.idleagents_callback();
                }
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 获取座席所在技能组
             */
            agentgroups: function () {
                var sendobj = new CallCenter._sendcmd("agentgroups");
                CallCenter.send(sendobj);
                if (typeof(CallCenter.agentgroups_callback) == "function") {
                    CallCenter.agentgroups_callback();
                }
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 获取可用技能组
             */
            availablegroup: function () {
                var sendobj = new CallCenter._sendcmd("availablegroup");
                sendobj.companyid = CallCenter._companyid;
                sendobj.operatorid = CallCenter._operatorid;
                sendobj.abbreviate = CallCenter._abbreviate;
                CallCenter.send(sendobj);
                if (typeof(CallCenter.availablegroup_callback) == "function") {
                    CallCenter.availablegroup_callback();
                }
                return {result: 1, reason: 'succeeded'};
            },
            /**
             * 重新连接
             */
            reconnection: function () {
                return CallCenterStatus.reconnection();
            },
            //以上为对外公布的功能性函数--------------------------------------------------------------------------------------------

            //下面为初始化调用------------------------------------------------------------------------------------------
            /**
             * 拨号盘
             * @returns {*|jQuery|HTMLElement}
             */
            dialPlate: function () {
                var plate = jQuery('<div id="CallCenter_jianpan" class="jianpan" style="display:none;"></div>');
                if($("#CallCenter_jianpan")){
                    plate = $("#CallCenter_jianpan")
                }
                plate.append(
                    '<ul class="jianpan_ul">' +
                    '<li class="jianpan_icon jianpan_1"></li>' +
                    '<li class="jianpan_icon jianpan_2"></li>' +
                    '<li class="jianpan_icon jianpan_3"></li>' +
                    '<li class="jianpan_icon jianpan_4"></li>' +
                    '<li class="jianpan_icon jianpan_5"></li>' +
                    '<li class="jianpan_icon jianpan_6"></li>' +
                    '<li class="jianpan_icon jianpan_7"></li>' +
                    '<li class="jianpan_icon jianpan_8"></li>' +
                    '<li class="jianpan_icon jianpan_9"></li>' +
                    '<li class="jianpan_icon jianpan_x"></li>' +
                    '<li class="jianpan_icon jianpan_0"></li>' +
                    '<li class="jianpan_icon jianpan_h"></li>' +
                    '</ul>'
                );

                plate.find('.jianpan_1').bind("click", function () {
                    SoftPhone.SendDTMF('1');
                });
                plate.find('.jianpan_2').bind("click", function () {
                    SoftPhone.SendDTMF('2');
                });
                plate.find('.jianpan_3').bind("click", function () {
                    SoftPhone.SendDTMF('3');
                });
                plate.find('.jianpan_4').bind("click", function () {
                    SoftPhone.SendDTMF('4');
                });
                plate.find('.jianpan_5').bind("click", function () {
                    SoftPhone.SendDTMF('5');
                });
                plate.find('.jianpan_6').bind("click", function () {
                    SoftPhone.SendDTMF('6');
                });
                plate.find('.jianpan_7').bind("click", function () {
                    SoftPhone.SendDTMF('7');
                });
                plate.find('.jianpan_8').bind("click", function () {
                    SoftPhone.SendDTMF('8');
                });
                plate.find('.jianpan_9').bind("click", function () {
                    SoftPhone.SendDTMF('9');
                });
                plate.find('.jianpan_0').bind("click", function () {
                    SoftPhone.SendDTMF('0');
                });
                plate.find('.jianpan_x').bind("click", function () {
                    SoftPhone.SendDTMF('*');
                });
                plate.find('.jianpan_h').bind("click", function () {
                    SoftPhone.SendDTMF('#');
                });
                // jQuery(document).bind("click", function (e) {
                //     if (jQuery(e.target).closest("#CallCenter_main").length == 0) {
                //         jQuery("#CallCenter_jianpan").hide();
                //     }
                // });
                return plate;
            },
            /**
             * 获取空闲坐席后，返回咨询和转接座席列表
             * @param json
             * @returns {*|jQuery|HTMLElement}
             */
            drawTCBox: function (json) {
                var tcbox = jQuery('<div id="CallCenter_TCBox" class="CallCenter_TCBox"></div>');
                for (var i = 0; i < json.data.length; i++) {
                    var group = json.data[i];
                    var groupDiv = jQuery('<div class="CallCenter_group"></div>');
                    groupDiv.html("[" + group.groupname + "]");
                    var groupid = group.groupid;
                    var groupUL = jQuery('<ul class="CallCenter_ul"></ul>');
                    for (var k = 0; k < group.agents.length; k++) {
                        var agentid = group.agents[k];
                        if (agentid != CallCenter.getOperatorid() + "@" + CallCenter.getAbbreviate()) {
                            var li = jQuery('<li></li>');
                            li.html('<div class="CallCenter_agent">' + agentid + '</div>')
                            var qd = jQuery('<div class="CallCenter_agentSelected">确定</div>');
                            qd.click({agentid: agentid, groupid: groupid}, function (e) {
                                if (CallCenter._getIdleAgentFromTC == 1) {
                                    CallCenter.transfercall(e.data.agentid, groupid);
                                } else if (CallCenter._getIdleAgentFromTC == 2) {
                                    CallCenter.agentconsult(e.data.agentid, groupid);
                                }
                                jQuery("#CallCenter_TCBox").remove();
                                CallCenter._getIdleAgentFromTC = 0;
                            })
                            li.append(qd);
                            li.append('<div style="clear:both;"></div>')
                            groupUL.append(li);
                        }
                    }
                    tcbox.append(groupDiv).append(groupUL);
                }
                return tcbox;
            },
            /**
             * 初始化基本参数，创建连接
             * @param wsurl
             * @param logintype
             * @param operator_id
             * @param password
             * @param abbreviate
             * @param company_id
             * @param logingroups
             * @param auto
             */
            init: function (obj) {
                CallCenter.log("CallCenter消息：初始化");
                if (obj) {//初始化传参数了
                    CallCenter.log(obj);
                    CallCenter._wsurl = obj.wsurl || CallCenter._wsurl;   //CCS的WebSocket连接地址
                    CallCenter._logintype = obj.logintype || CallCenter._logintype;//登录类型,0手机,1sip话机,2软话机
                    CallCenter._operatorid = obj.operator_id || CallCenter._operatorid;
                    CallCenter._password = obj.password || CallCenter._password;
                    CallCenter._abbreviate = obj.abbreviate || CallCenter._abbreviate;
                    CallCenter._companyid = obj.company_id || CallCenter._companyid;
                    CallCenter._logingroups = obj.logingroups || CallCenter._logingroups;
                    CallCenter._auto = obj.auto || CallCenter._auto;
                    CallCenter._media_ip = obj.media_ip || CallCenter._media_ip;
                    CallCenter._media_port = obj.media_port || CallCenter._media_port;
                    CallCenter._sip_id = obj.sip_id || CallCenter._sip_id;
                    CallCenter._sip_pwd = obj.sip_pwd || CallCenter._sip_pwd;
                    if (obj.url_3cs) {
                        CallCenter.set3CS_url(obj.url_3cs);
                    }
                }

                if (CallCenter._islogin == false
                    && CallCenter._websocket == null
                    && CallCenter._wsurl != null
                    && CallCenter._wsurl != "") {
                    if ('WebSocket' in window) {//支持原生WebSocket
                        CallCenter._websocket = new WebSocket(CallCenter._wsurl);
                        CallCenter._websocket.onopen = CallCenter.onopen;
                        CallCenter._websocket.onmessage = CallCenter.onmessage;
                        CallCenter._websocket.onclose = CallCenter.onclose;
                        CallCenter._websocket.onerror = CallCenter.onerror;
                        CallCenter._useOcx = false;
                    } else {//不支持原生WebSocket，尝试使用OCX
                        if (window.ActiveXObject || "ActiveXObject" in window) {
                            CallCenter._websocket = CallCenter.newWebSocket(CallCenter._wsurl);
                            CallCenter._websocket.onopen = CallCenter.onopen;
                            CallCenter._websocket.onmessage = CallCenter.onmessage;
                            CallCenter._websocket.onclose = CallCenter.onclose;
                            CallCenter._websocket.onexception = CallCenter.onerror;
                            CallCenter._useOcx = true;
                        } else {
                            alert('您的浏览器不支持WebSocket！无法进行连接！');
                            CallCenter.eventAlert("浏览器不支持");
                        }
                    }
                }
                if (!CallCenter._wsurl) {
                    CallCenter.setStatusAndPhoneText('CCS连接地址为空');
                }

                if (CallCenter._timerId == 0) {//ping线程
                    CallCenter._timerId = window.setInterval(CallCenter.timer, 1000);
                    CallCenter.ping();
                }
                return this;
            },
            /**
             * 获取登录信息并且初始化
             * @param url
             * @param logintype
             * @param auto
             * @param logingroups
             * @private
             */
            _getLoginInfo: function (url, logintype, auto, logingroups, client_type) {
                CallCenter.log("url:" + url + ", logintype:" + logintype + ", auto:" + auto + ", logingroups:" + logingroups + ", client_type:" + client_type + ", logingroups:" + logingroups);
                //未登录、退出、验证失败、被踢出，可重复登录
                if (CallCenterStatus.is(SDK_state.s_nologin.name)
                    || CallCenterStatus.is(SDK_state.s_logout.name)
                    || CallCenterStatus.is(SDK_state.s_authfail.name)
                    || CallCenterStatus.is(SDK_state.s_kick.name)
                    || CallCenterStatus.is(SDK_state.s_reconnection_fail.name)) {
                    jQuery.getJSON(url, function (json) {
                        CallCenter.log(json)
                        if (json.code == "0000") {
                            if (json.info) {
                                var use_sipphone = json.info.use_sipphone;
                                var ws_url = json.info.ws_url;
                                var operatorid = json.info.operatorid;
                                var password = json.info.password;
                                var abbreviate = json.info.abbreviate;
                                var companyid = json.info.companyid;
                                var media_ip = json.info.media_ip;
                                var media_port = json.info.media_port;
                                var sip_id = json.info.sip_id;
                                var sip_pwd = json.info.sip_pwd;
                                if (logintype == CallCenter._loginType_web) {
                                    if (client_type == CallCenter._clientType_sipphone || client_type == CallCenter._clientType_ocx) {//正确设置了话机类型
                                        CallCenter.log("CallCenter消息：设置话机类型");
                                        CallCenter._clientType = client_type;
                                    } else {
                                        CallCenter.log("CallCenter消息：没有设置话机类型");
                                        if (typeof(use_sipphone) == "undefined") {//企业没有设置话机类型
                                            CallCenter.log("CallCenter消息：企业没有设置话机类型，默认使用WebCall");
                                            CallCenter._clientType = CallCenter._clientType_sipphone;
                                        } else {//企业设置使用类型
                                            if (use_sipphone == 1) {//使用sipphone
                                                CallCenter._clientType = CallCenter._clientType_sipphone;
                                                CallCenter.log("CallCenter消息：企业设置话机类型为使用WebCall");
                                            } else {//不使用sipphone
                                                CallCenter._clientType = CallCenter._clientType_ocx;
                                                CallCenter.log("CallCenter消息：企业设置话机类型为不使用WebCall");
                                            }
                                        }
                                    }

                                    if (CallCenter._clientType == CallCenter._clientType_sipphone) {
                                        CallCenter.log("CallCenter消息：使用WebCall");
                                        window.SoftPhone = window.CC_SoftPhone;
                                    } else {
                                        CallCenter.log("CallCenter消息：使用OCX");
                                        window.SoftPhone = window.EC_SoftPhone;
                                    }
                                }

                                CallCenter._wsurl = ws_url;             //ccs地址
                                CallCenter._media_ip = media_ip;      //媒体地址
                                CallCenter._media_port = media_port;  //媒体端口

                                CallCenter._logintype = logintype;      //登录类型,0 手机,1 sip话机,2 软话机
                                CallCenter._operatorid = operatorid;    //工号
                                CallCenter._password = password;        //密码
                                CallCenter._abbreviate = abbreviate;    //公司简称
                                CallCenter._companyid = companyid;      //公司编号
                                CallCenter._logingroups = logingroups;  //登录到的技能组
                                CallCenter._auto = auto;                //是否预测外呼
                                CallCenter._sip_id = sip_id;            //SIP账号
                                CallCenter._sip_pwd = sip_pwd;          //SIP密码

                                CallCenter._busyTypeMap.put(0, CallCenter._defaultBusyText);
                                if (json.info.sendlog == 1) {
                                    CallCenter.log("发送日志到服务端状态：启用");
                                    CallCenter._sendlog = true;
                                } else {
                                    CallCenter.log("发送日志到服务端状态：禁用");
                                }
                                //自定义忙碌类型
                                if (json.info.busyList) {
                                    jQuery(".CallCenter_busy").not("#CallCenter_busy").each(function (e) {
                                        jQuery(this).remove();
                                    });
                                    CallCenter._busyTypeMap.clear();
                                    CallCenter._busyTypeMap.put(0, CallCenter._defaultBusyText);
                                    for (var i = 0; i < json.info.busyList.length; i++) {
                                        CallCenter._busyTypeMap.put(json.info.busyList[i]['typeId'], json.info.busyList[i]['showText']);
                                    }
                                    CallCenter.addBusyButton(jQuery("#CallCenter_main"));
                                }
                                //登录时选择技能组
                                if (CallCenter._selectionGroup) {
                                    jQuery(".CallCenter_login_group,#CallCenter_login_group_pannel").remove();
                                    CallCenter.initControl().setStatusAndPhoneText('请选择技能组')
                                        .showControl('#CallCenter_status_buts,.CallCenter_login_group');
                                    if (json.info.groupList) {
                                        for (var i = 0; i < json.info.groupList.length; i++) {
                                            var ws_url = json.info.groupList[i].ws_url;
                                            var groupid = json.info.groupList[i].groupid;
                                            var groupname = json.info.groupList[i].groupname;
                                            var media_ip = json.info.groupList[i].media_ip;
                                            var media_port = json.info.groupList[i].media_port;
                                            CallCenter.addLoginGroup(ws_url, media_ip, media_port, groupname, groupid);
                                        }
                                    } else {
                                        CallCenter.setStatusAndPhoneText('无可用技能组').eventAlert('无可用技能组');
                                    }
                                } else {
                                    if (CallCenter.getLoginType() == 2) {//软话机方式登录
                                        SoftPhone.init(CallCenter._media_ip, CallCenter._media_port, CallCenter._sip_id, CallCenter._sip_pwd);
                                    } else {//手机或SIP话机方式登录
                                        CallCenter.init();
                                    }
                                }
                            } else {
                                if (typeof(CallCenter.opLogin_callback) == "function") {
                                    CallCenter.opLogin_callback(json);
                                }
                                if (typeof(CallCenter.sipLogin_callback) == "function") {
                                    CallCenter.sipLogin_callback(json);
                                }
                            }
                        } else {
                            if (typeof(CallCenter.opLogin_callback) == "function") {
                                CallCenter.opLogin_callback(json);
                            }
                            if (typeof(CallCenter.sipLogin_callback) == "function") {
                                CallCenter.sipLogin_callback(json);
                            }
                            CallCenter.setStatusAndPhoneText("登录失败，错误：" + json.code);
                        }
                    })
                } else {
                    CallCenter.eventAlert("不是未登录或退出状态，不允许调用登录");
                }
            },
            //上面为初始化调用------------------------------------------------------------------------------------------

            //以下为WebSocket功能----------------------------------------------------------------------------------------
            /**
             * 连接建立
             */
            onopen: function () {
                CallCenter.log("CallCenter消息：建立连接");
                if (CallCenter._refreshReconnection) {
                    CallCenter.log("开启了刷新后重连");
                    var last_msg_time = CallCenter.getlocalstorage("last_msg_time");
                    var nowtime = new Date().getTime();
                    if (last_msg_time) {
                        var last_msg_interval = nowtime - last_msg_time;
                        CallCenter.log("最后一次发消息距离当前时间:" + last_msg_interval + "毫秒");
                    } else {
                        CallCenter.log("没有最后一次发送消息记录");
                    }
                }
                var last_msg = CallCenter.getlocalstorage("last_msg");
                if (CallCenterStatus.is(SDK_state.s_disconnect.name) || //如果是掉线
                    (CallCenter._refreshReconnection &&
                    last_msg_time && //启用刷新后重连
                    (nowtime - last_msg_time) < (60 * 1000) && //并且没有超出1分钟
                    last_msg != 'logout' && //上次消息不是退出
                    !CallCenterStatus.is(SDK_state.s_reconnection_fail.name))) {//不是重连失败
                    CallCenterStatus.reconnection_handle();
                } else {
                    if (CallCenter.isAuto() && CallCenter.getavailablegroup()) {//是预测外呼并且启用了登录后获取技能组
                        CallCenter.setStatusAndPhoneText('正在获取可用技能组').availablegroup();
                    } else {
                        CallCenterStatus.login_handle();//发送登录
                    }
                }
                if (typeof(CallCenter.onopen_callback) == "function") {
                    CallCenter.onopen_callback();
                }
                return this;
            },
            /**
             * 连接关闭
             */
            onclose: function () {
                CallCenter.log("CallCenter消息：连接关闭");
                CallCenter._websocket = null;
                CallCenter._islogin = false;
                if (CallCenterStatus.is(SDK_state.s_logout_sending.name)) {//如果为登出操作
                    CallCenterStatus.logout();
                } else if (CallCenterStatus.is(SDK_state.s_kick.name)) {//被踢出

                } else if (CallCenterStatus.is(SDK_state.s_authfail.name)) {//验证失败

                } else if (CallCenterStatus.is(SDK_state.s_reconnection_fail.name)) {//重连失败

                } else if (CallCenterStatus.is(SDK_state.s_logout.name)) {//已退出

                } else {
                    CallCenterStatus.disconnect();
                }
                if (typeof(CallCenter.onclose_callback) == "function") {
                    CallCenter.onclose_callback();
                }
                return this;
            },
            /**
             * 连接错误
             */
            onerror: function () {
                CallCenter.log("CallCenter消息：连接错误");
                CallCenter._websocket = null;
                CallCenter._islogin = false;
                if (CallCenterStatus.is(SDK_state.s_logout_sending.name)) {//如果为登出操作
                    CallCenterStatus.logout();
                } else if (CallCenterStatus.is(SDK_state.s_kick.name)) {//被踢出

                } else if (CallCenterStatus.is(SDK_state.s_authfail.name)) {//验证失败

                } else if (CallCenterStatus.is(SDK_state.s_reconnection_fail.name)) {//重连失败

                } else if (CallCenterStatus.is(SDK_state.s_logout.name)) {//已退出

                } else {
                    CallCenterStatus.disconnect();
                }
                if (typeof(CallCenter.onerror_callback) == "function") {
                    CallCenter.onerror_callback();
                }
                return this;
            },
            /**
             * 发送消息到ws服务器
             */
            send: function (sendObj) {
                try {
                    if (CallCenter._websocket != null) {
                        var readyState = ("m_readyState" in CallCenter._websocket ? CallCenter._websocket.m_readyState : CallCenter._websocket.readyState);
                        if (readyState == 1) {
                            if (!sendObj) {
                                sendObj = new CallCenter._sendcmd();
                            }
                            if (!sendObj.sequence) {
                                sendObj.sequence = new Date().getTime();
                            }
                            if (sendObj.cmd != "ping" && sendObj.cmd != "pingack") {
                                CallCenter.log("CallCenter发送消息:" + JSON.stringify(sendObj));
                            }
                            if (typeof(onmessage_event) == "function") {
                                onmessage_event(sendObj, "send");
                            }
                            CallCenter._websocket.send(JSON.stringify(sendObj));
                        } else {
                            switch (readyState) {
                                case 0:
                                    CallCenter.log("CallCenter:连接状态[连接尚未建立]");
                                    break;
                                case 1:
                                    CallCenter.log("CallCenter:连接状态[WebSocket的链接已经建立]");
                                    break;
                                case 2:
                                    CallCenter.log("CallCenter:连接状态[连接正在关闭]");
                                    break;
                                case 3:
                                    CallCenter.log("CallCenter:连接状态[连接已经关闭或不可用]");
                                    break;
                                default:
                                    CallCenter.log("CallCenter:连接状态[" + readyState + "]");
                            }
                        }
                    } else {
                        CallCenter.log("CallCenter:连接为null");
                    }
                } catch (ex) {
                    CallCenter.log("CallCenter:发送消息异常");
                    for (x in ex) {
                        CallCenter.log(x + ":" + ex[x]);
                    }
                    CallCenter.log(ex);
                }
            },
            /**
             * 收到的消息
             */
            onmessage: function (data) {
                try {
                    var json = eval("(" + data.data + ")");
                    if (typeof(onmessage_event) == "function") {
                        try {
                            onmessage_event(json, "recive");
                        } catch (e) {
                            CallCenter.log('触发onmessage_event异常');
                        }
                    }
                    var type = json.type;// 命令
                    var status = parseInt(json.status);//状态 0成功 1失败
                    var reason = "";
                    if (typeof(json.reason) != "undefined" && json.reason != null && json.reason != "") {
                        reason = json.reason;//信息
                    }
                    if (type != "ping") {//不是ping消息打印消息内容
                        if (type != 'monitorqueue'
                            && type != 'monitoragent'
                            && type != 'queuenum'
                            && type != 'callinfo') {
                            CallCenter._status = type;
                            CallCenter._lastmsg = data;
                        }
                        CallCenter.log("CallCenter接收消息：" + type);
                        CallCenter.log(json);
                    } else {
                        CallCenter.setlocalstorage("last_msg", "");
                        CallCenter.setlocalstorage("last_msg_time", new Date().getTime());
                    }
                    switch (type) {
                        case "logon"://登录
                            switch (status) {
                                case 0://登录成功
                                    CallCenterStatus.login();
                                    break;
                                case 1://验证失败
                                    CallCenterStatus.authfail();
                                    break;
                                case 2://重复登录
                                    CallCenterStatus.kick();
                                    break;
                                case 3://强制签出
                                    CallCenterStatus.forcelogout();
                                    break;
                                default :
                                    CallCenter.setStatusAndPhoneText("登录代码:" + status);
                            }
                            break;
                        case "logout"://登出
                            break;
                        case "reconnection"://重连
                            switch (status) {
                                case 0:
                                    CallCenterStatus.reconnection();
                                    break;
                                default:
                                    CallCenterStatus.reconnection_fail();
                                    break;
                            }
                            break;
                        case "agentidle"://示闲
                            switch (status) {
                                case 0:
                                    CallCenterStatus.agentidle();
                                    break;
                                default:
                                    CallCenterStatus.agentidle_fail();
                                    CallCenter.eventAlert(reason);
                            }
                            break;
                        case "agentbusy"://示忙
                            switch (status) {
                                case 0:
                                    CallCenterStatus.agentbusy();
                                    break;
                                default:
                                    CallCenter.eventAlert(reason);
                            }
                            break;
                        case "playtts"://播放tts
                            CallCenterStatus.playtts();
                            break;
                        case "makecall"://外呼呼叫中
                            switch (status) {
                                case 0:
                                    CallCenterStatus.makecall(json.callid, json.timestamp);
                                    break;
                                default :
                                    CallCenterStatus.makecall_fail(json.reason);
                            }
                            break;
                        case "cancelmakecall"://挂断呼叫
                            switch (status) {
                                case 0:
                                    CallCenterStatus.cancelmakecall();
                                    break;
                                default :
                                    CallCenter.eventAlert(reason);
                            }
                            break;
                        case "inringing"://呼入振铃
                            CallCenterStatus.inringing(json.callid, json.timestamp, json.caller, json.called);
                            break;
                        case "innerringing"://内呼来电振铃
                            CallCenterStatus.innerringing(json.callid, json.timestamp, json.caller, json.called);
                            break;
                        case "incall"://呼入座席接听
                            CallCenterStatus.incall(json.callid, json.timestamp, json.caller, json.called);
                            break;
                        case "outringing"://外呼时座席端振铃
                            CallCenterStatus.outringing(json.callid, json.timestamp, json.caller, json.called);
                            break;
                        case "outcall"://外呼座席摘机
                            CallCenterStatus.outcall(json.number);
                            break;
                        case "calledringing"://被叫振铃
                            CallCenterStatus.calledringing(json.callid, json.timestamp, json.caller, json.called);
                            break;
                        case "outboundcall"://预测外呼接通被叫
                            CallCenterStatus.outboundcall();
                            break;
                        case "answer"://外呼接通被叫
                            CallCenterStatus.answer(json.callid, json.timestamp, json.caller, json.called);
                            break;
                        case "consultationcalls"://咨询通话中
                            if (CallCenter._calling_from == "transfer") {
                                CallCenterStatus.transferincall_consultationcalls();
                            } else {
                                if (CallCenter._isCallout || (json.dir && json.dir == 1)) {
                                    CallCenterStatus.out_consultationcalls();
                                } else {
                                    CallCenterStatus.in_consultationcalls();
                                }
                            }
                            break;
                        case "consultinringing"://咨询来电振铃
                            CallCenterStatus.consultinringing(json.callid, json.timestamp, json.caller, json.called);
                            break;
                        case "consultincall"://咨询来电通话中
                            CallCenterStatus.consultincall();
                            break;
                        case "transferinringing"://转接来电振铃
                            CallCenterStatus.transferinringing(json.callid, json.timestamp, json.caller, json.called, json.dir);
                            break;
                        case "transferincall"://转接来电通话中
                            CallCenterStatus.transferincall(json.callid, json.timestamp, json.caller, json.called, json.dir);
                            break;
                        case "innercall"://内呼来电通话中
                            CallCenterStatus.innercall();
                            break;
                        case "innercallout"://内呼失败
                            CallCenterStatus.innercall();
                            break;
                        case "sanfangcall"://三方通话中
                            CallCenterStatus.sanfangcall();
                            break;
                        case "mute"://保持
                            switch (status) {
                                case 0://成功
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
                                default ://失败
                                    CallCenterStatus.mute_fail();
                            }
                            break;
                        case "unmute"://取消保持
                            switch (status) {
                                case 0://成功
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
                                default ://失败
                                    CallCenter.eventAlert(reason);
                                    CallCenterStatus.unmute_fail();
                            }
                            break;
                        case "agentconsult"://咨询
                            switch (status) {
                                case 0:
                                    if (CallCenter._calling_from == "transfer") {
                                        CallCenterStatus.transferincall_agentconsult();
                                    } else {
                                        if (CallCenter._auto == 1) {
                                            CallCenterStatus.out_agentconsult();
                                        } else {
                                            if (CallCenter._isCallout || (json.dir && json.dir == 1)) {
                                                CallCenterStatus.out_agentconsult();
                                            } else {
                                                CallCenterStatus.in_agentconsult();
                                            }
                                        }
                                    }
                                    break;
                                default:
                                    CallCenter.eventAlert(reason);
                                    CallCenterStatus.agentconsult_fail();
                            }
                            break;
                        case "agentconsultback"://取消咨询
                            CallCenterStatus.agentconsultback();
                            break;
                        case "agentshift"://咨询转接
                            switch (status) {
                                case 0:
                                    CallCenterStatus.agentshift();
                                    break;
                                default :
                                    CallCenterStatus.agentshift_fail();
                            }
                            break;
                        case "transfering"://转接中
                            if (CallCenter._calling_from == "transfer") {
                                CallCenterStatus.transferincall_transfering(json.callid, json.timestamp, json.caller, json.called);
                            } else {
                                if (CallCenter._auto == 1) {
                                    CallCenterStatus.out_transfering();
                                } else {
                                    if (CallCenter._isCallout) {
                                        CallCenterStatus.out_transfering();
                                    } else {
                                        CallCenterStatus.in_transfering();
                                    }
                                }
                            }
                            break;
                        case "transfercall"://转接
                            switch (status) {
                                case 0:
                                    CallCenterStatus.transfercall();
                                    break;
                                default :
                                    CallCenterStatus.transfercall_fail();
                            }
                            break;
                        case "tripartitetalk"://三方
                            switch (status) {
                                case 0://成功
                                    CallCenterStatus.tripartitetalk();
                                    break;
                                default ://失败
                                    CallCenterStatus.tripartitetalk_fail();
                            }
                            break;
                        case "after"://话后
                            CallCenterStatus.after();
                            break;
                        case "monitor"://监听
                            switch (status) {
                                case 0:
                                    if (json.monitor == 1) {//操作人
                                        CallCenterStatus.monitor();
                                    } else {
                                    }
                                    break;
                                default:
                            }
                            break;
                        case "monitorringing"://监听来电振铃
                            CallCenterStatus.monitorringing();
                            break;
                        case "monitorincall"://监听通话中
                            CallCenterStatus.monitorincall();
                            break;
                        case "agentinterceptcall"://拦截操作
                            CallCenter.eventAlert(reason);
                            switch (status) {
                                case 0:
                                    if (json.monitor == 1) {//操作人
                                        CallCenterStatus.agentinterceptcall();
                                    } else {//被操作人
                                    }
                                    break;
                                default:
                                    CallCenterStatus.agentinterceptcall_fail();
                            }
                            break;
                        case "intercept"://拦截中
                            CallCenterStatus.intercept();
                            break;
                        case "interceptaltering"://拦截振铃
                            CallCenterStatus.interceptaltering();
                            break;
                        case "interceptcall"://拦截通话中
                            CallCenterStatus.interceptcall();
                            break;
                        case "agentinsert"://强插
                            switch (status) {
                                case 0:
                                    if (json.monitor == 1) {//操作人
                                        CallCenterStatus.agentinsert();
                                    } else {
                                    }
                                    break;
                                default:
                            }
                            break;
                        case "agentinsertringing"://强插振铃
                            CallCenterStatus.agentinsertringing();
                            break;
                        case "agentinsertincall"://强插通话中
                            CallCenterStatus.agentinsertincall();
                            break;
                        case "agentbreak"://强拆
                            CallCenter.eventAlert(reason);
                            switch (status) {
                                case 0:
                                    if (json.monitor == 1) {//操作人
                                    } else {//被操作人
                                    }
                                    break;
                                default :
                            }
                            break;
                        case "forceidle"://强制示闲
                            CallCenter.eventAlert(reason);
                            switch (status) {
                                case 0:
                                    if (json.monitor == 1) {//操作人
                                    } else {//被操作人
                                        CallCenterStatus.forceidle();
                                    }
                                    break;
                                default :
                            }
                            break;
                        case "forcebusy"://强制示忙
                            CallCenter.eventAlert(reason);
                            switch (status) {
                                case 0:
                                    if (json.monitor == 1) {//操作人
                                    } else {//被操作人
                                        CallCenterStatus.forcebusy();
                                    }
                                    break;
                                default :
                            }
                            break;
                        case "consulationservice"://咨询服务
                            switch (status) {
                                case 0:
                                    CallCenterStatus.consulationservice();
                                    break;
                                default :
                                    CallCenter.eventAlert(reason);
                            }
                            break;
                        case "queuenum"://当前座席所在技能组队列
                            CallCenter.log("CallCenter：队列等待数：" + json.num);
                            break;
                        case "siperror"://话机异常
                            CallCenterStatus.siperror();
                            break;
                        case "idleagents"://获取空闲座席
                            if (typeof(CallCenter.idleagents_event) != "function") {
                                jQuery("#CallCenter_TCBox").remove();
                                if (CallCenter._getIdleAgentFromTC == 1 || CallCenter._getIdleAgentFromTC == 2) {
                                    var tcbox = CallCenter.drawTCBox(json);
                                    jQuery("#CallCenter_main").append(tcbox);
                                    jQuery(document).bind("click", function (e) {
                                        if (jQuery(e.target).closest("#CallCenter_main").length == 0) {
                                            jQuery("#CallCenter_TCBox").remove();
                                            CallCenter._getIdleAgentFromTC = 0;
                                        }
                                    });
                                }
                            }
                            break;
                        case "ping":
                            json.delay = new Date().getTime() - json.sequence;
                            CallCenter.pingack(json.sequence);
                            break;
                        case "sendmsg"://收到的消息
                            break;
                        case "monitoragent"://监控座席
                            break;
                        case "monitorqueue"://所有技能组队列状态
                            break;
                        case "agentbegingroup"://进入预测外呼技能组
                            break;
                        case "agentstopgroup"://退出预测外呼技能组
                            break;
                        case "getagentstate"://获取指定坐席状态，字符串值，包含 logout:未登陆, idle：空闲,busy：忙碌, after:话后，四个状态
                            break;
                        case "callinfo"://推送座席呼叫信息
                            break;
                        case "availablegroup"://获取座席所在技能组
                            if (json.data && json.data.length > 0) {
                                jQuery(".CallCenter_login_group,#CallCenter_login_group_pannel").remove();
                                var gids = [];
                                for (var i = 0; i < json.data.length; i++) {
                                    var item = json.data[i];
                                    gids.push(item.id);
                                }
                                gids = gids.join(",");//技能组编号
                                CallCenter.getTaskName(gids, json.data);
                                CallCenter.initControl().setStatusAndPhoneText('请选择任务').showControl('#CallCenter_status_buts,.CallCenter_login_group');
                            } else {
                                CallCenter.setStatusAndPhoneText('无可用任务').eventAlert('无可用任务');
                            }
                            CallCenter.showControl('#CallCenter_refresh');
                            break;
                        case "agentgroups"://获取座席可用技能组
                            break;
                        case "agent2minutelogout"://座席由于任务完成的签出
                            break;
                        default :
                            CallCenter.log("CallCenter：未知的命令，" + type);
                    }
                    var eventFun = window.CallCenter[type + "_event"];
                    if (typeof(eventFun) == "function") {//是否有外部注册回调函数
                        try {
                            eventFun(json);
                        } catch (ex) {
                            CallCenter.log("调用外部注册事件异常，查看详情需要开启调试模式");
                            CallCenter.log(ex);
                        }
                    }
                    var events = CallCenter._events[type];//是否有注册事件
                    if (typeof(events != "undefined")) {
                        for (var key in events) {
                            var fun = events[key];
                            if (typeof(fun) == "function") {
                                try {
                                    fun(json);
                                } catch (ex) {
                                    CallCenter.log("调用外部注册事件异常，查看详情需要开启调试模式");
                                    CallCenter.log(ex);
                                }
                            }
                        }
                    }
                } catch (ex) {
                    alert(data.data);
                }
            },
            //以上为WebSocket功能----------------------------------------------------------------------------------------

            //以下为SDK内部调用功能----------------------------------------------------------------------------------------
            /**
             * 获取任务名称
             * @param groupids 技能组编号，逗号分隔
             * @param data 当前需要显示的技能组信息CCS给
             */
            getTaskName: function (groupids, data) {
                var url = CallCenter._url_3cs + "/Api/grouptasklist";
                if (CallCenter._url_3cs_ssl) {
                    url = "https://" + url;
                } else {
                    url = "http://" + url;
                }
                //根据技能组编号查询技能组信息
                url = url + "?companyid=" + CallCenter._companyid + "&groupids=" + groupids + "&callback=?";
                jQuery.getJSON(url, function (json) {
                    if (json.code == "0000") {
                        if (json.data) {
                            var taskData = json.data;
                            for (var i = 0; i < data.length; i++) {
                                var item = data[i];
                                var taskName = item.name + "(技能组)";//默认显示技能组名称
                                if (taskData) {
                                    for (var k = 0; k < taskData.length; k++) {
                                        if (item.id == taskData[k].groupid) {//找到技能组id与任务所属技能组id相同
                                            taskName = taskData[k].taskname;//显示任务名称
                                            break;
                                        }
                                    }
                                    CallCenter.addLoginTask(taskName, item.id, item.status);
                                }
                            }
                        } else {
                            alert("没有查到任何数据");
                        }
                    } else {
                        alert("获取任务名称失败，错误代码：" + json.code);
                    }
                });
            },
            /**
             * ping
             */
            ping: function () {
                if (CallCenter._islogin) {
                    var sendobj = new CallCenter._sendcmd();
                    CallCenter.send(sendobj);

                }
                window.setTimeout(CallCenter.ping, CallCenter._pingInterval);//循环发送ping包
            },
            /**
             * PING-ACK
             * @returns {CallCenter}
             */
            pingack: function (sequence) {
                var sendobj = new CallCenter._sendcmd("pingack");
                sendobj.sequence = sequence;
                CallCenter.send(sendobj);
                return this;
            },
            /**
             * 界面计时器
             */
            timer: function () {
                if (CallCenter._calling) {
                    jQuery("#CallCenter_status_time").html(CallCenter.secondsToHours(CallCenter._callingtimer++));
                } else {
                    jQuery("#CallCenter_status_time").html(CallCenter.secondsToHours(CallCenter._timerspan++));
                }
            },
            /**
             * 秒转时间(HH:mm:ss)
             * @param sec
             * @returns {string}
             */
            secondsToHours: function (sec) {
                var hrs = Math.floor(sec / 3600);
                var min = Math.floor((sec % 3600) / 60);
                sec = sec % 60;
                sec = sec < 10 ? "0" + sec : sec;
                min = min < 10 ? "0" + min : min;
                hrs = hrs < 10 ? "0" + hrs : hrs;
                return hrs + ":" + min + ":" + sec;
            },
            /**
             * 初始化控件(隐藏所有控件)
             * @returns {CallCenter}
             */
            initControl: function () {
                CallCenter.hideControl("#CallCenter_canceltransfercallbut,#CallCenter_refresh,#CallCenter_status_buts,#CallCenter_login,#CallCenter_jianpan,#CallCenter_bohao,#CallCenter_answer,#CallCenter_calloutbut,#CallCenter_hangupbut,#CallCenter_mutebut,#CallCenter_unmutebut,#CallCenter_logoutbut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_consultbackbut,#CallCenter_ivrbut,#CallCenter_tripartitetalkbut,#CallCenter_shiftbut,.CallCenter_login_group,.CallCenter_busy,#CallCenter_free,#CallCenter_phonenum,#CallCenter_monitor,#CallCenter_agentinsert,#CallCenter_agentbreak,#CallCenter_innercall,#CallCenter_reset,#CallCenter_trig");
                jQuery("#CallCenter_status").html(CallCenter._defaultBusyText);
                jQuery("#CallCenter_status_tiao").removeClass("green").addClass("org");
                jQuery("#CallCenter_phonenum").html("");
                CallCenter._timerspan = 0;
                jQuery("#CallCenter_status_time").html(CallCenter.secondsToHours(0));
                return this;
            },
            /**
             * 显示某些控件
             * @param ctrlId 控件id
             * @returns {CallCenter}
             */
            showControl: function (ctrlId) {
                if (CallCenter._drawType == 1) {//布局为简版布局
                    if (ctrlId.indexOf('CallCenter_busy') != -1 || ctrlId.indexOf('CallCenter_free') != -1) {
                        jQuery("#CallCenter_status_buts,#CallCenter_trig").show();
                    }
                    jQuery(ctrlId).show();
                } else {//全按钮布局
                    if (CallCenter._islogin) {
                        ctrlId += ",#CallCenter_logoutbut";
                    }
                    var src = jQuery(ctrlId).each(function (i, e) {
                        if (typeof(e) != "undefined") {
                            var src = jQuery(e).find(".CallCenter_icon img").attr("src");
                            if (src) {
                                src = src.replace("static", "active");
                                src = src.replace("hover", "active");
                                jQuery(e).find(".CallCenter_icon img").attr("src", src).data("status", "active");
                            }
                        }
                    });

                }
                return this;
            },
            /**
             * 隐藏某些控件
             * @param ctrlId 控件Id
             * @returns {CallCenter}
             */
            hideControl: function (ctrlId) {
                if (CallCenter._drawType == 1) {//布局为简版布局
                    jQuery(ctrlId).hide();
                } else {//全按钮布局
                    if (CallCenter._islogin) {
                        ctrlId += ",#CallCenter_login";
                    }
                    var src = jQuery(ctrlId).each(function (i, e) {
                        if (typeof(e) != "undefined") {
                            var src = jQuery(e).find(".CallCenter_icon img").attr("src");
                            if (src) {
                                src = src.replace("active", "static");
                                src = src.replace("hover", "static");
                                jQuery(e).find(".CallCenter_icon img").attr("src", src).data("status", "static");
                            }
                        }
                    });
                }
                if (CallCenter._islogin) {
                    CallCenter.showControl("#CallCenter_logoutbut");
                } else {
                    CallCenter.showControl("#CallCenter_login");
                }
                return this;
            },
            /**
             * 显示呼叫过程中的控件
             * @returns {CallCenter}
             */
            showCallingControl: function () {
                CallCenter.showControl("#CallCenter_hangupbut,#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut,#CallCenter_phonenum");
                if (CallCenter._isCallout && CallCenter._logintype == CallCenter._loginType_web) {//软话机方式登录
                    CallCenter.showControl("#CallCenter_bohao");
                }
                if (CallCenter._isCallout && CallCenter._calloutHideTCButton) {//外呼，并且要求隐藏咨询转接
                    CallCenter.hideControl("#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
                }
                if (CallCenter._isMeeting) {//已开启会议模式，隐藏
                    CallCenter.hideControl("#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
                }
                return this;
            },
            /**
             * 设置状态文字和号码
             * @param text
             * @param phonenum
             * @returns {CallCenter}
             */
            setStatusAndPhoneText: function (text) {
                CallCenter._statusText = text;
                jQuery("#CallCenter_status").html(text);
                var phonenum = "";
                if (CallCenter._isCallout) {
                    phonenum = CallCenter.getCalled();
                } else {
                    phonenum = CallCenter.getCaller();
                }
                jQuery("#CallCenter_phonenum").html(CallCenter.filterPhone(phonenum));
                if (typeof(CallCenter.setStatusAndPhoneText_event) == "function") {
                    CallCenter.setStatusAndPhoneText_event(text);
                }
                return this;
            },
            /**
             * 事件提醒内容
             * @param text
             */
            eventAlert: function (text) {
                if (CallCenter._eventAlertTimeoutId != 0) {
                    clearTimeout(CallCenter._eventAlertTimeoutId);
                }
                if (text) {
                    jQuery("#CallCenter_status_tiao .dialog").html(text + '<i class="pointer"></i>').filter(':not(:animated)').fadeIn('fast');
                    CallCenter._eventAlertTimeoutId = setTimeout(function () {
                        jQuery("#CallCenter_status_tiao .dialog").fadeOut('fast');
                    }, 2000);
                    if (typeof(CallCenter.eventAlert_event) == "function") {
                        CallCenter.eventAlert_event(text);
                    }
                }
                return this;
            },
            /**
             * 设置状态条为绿色
             * @returns {CallCenter}
             */
            setGreenClass: function () {
                jQuery("#CallCenter_status_tiao").removeClass("org").addClass("green");
                return this;
            },
            /**
             * 设置状态条为橙色
             * @returns {CallCenter}
             */
            setOrgClass: function () {
                jQuery("#CallCenter_status_tiao").removeClass("green").addClass("org");
                return this;
            },
            /**
             * 返回当前日期+时间
             * @returns {string}
             */
            dateNow: function () {
                var date = new Date();
                var y = date.getFullYear();
                var m = date.getMonth() + 1;
                var d = date.getDate();
                var h = date.getHours();
                var mm = date.getMinutes();
                var s = date.getSeconds();
                var sss = date.getMilliseconds();
                if (m < 10) {
                    m = "0" + m
                }
                if (d < 10) {
                    d = "0" + d
                }
                if (h < 10) {
                    h = "0" + h
                }
                if (mm < 10) {
                    mm = "0" + mm
                }
                if (s < 10) {
                    s = "0" + s
                }
                return y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s + "." + sss;
            },
            /**
             * 生成uuid
             * @returns {*}
             */
            getUUID: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            /**
             * 过滤号码
             * @param phone
             * @returns {*}
             */
            filterPhone: function (phone) {
                if (!CallCenter._hidePhone) {
                    return phone;
                }
                if (phone.length > 7) {
                    var s = (phone.indexOf("0") == 0) ? phone.substr(1) : phone;//如果首位为0，去掉0
                    var s2 = parseInt(s.substr(0, 2));//截取前两位
                    if (s2 > 10 && s2 < 20) {//如果在10和20区间，判断为手机号
                        return s.substr(0, 3) + "****" + s.substr(7)
                    } else {//判断为固话，如果号段在30以下，判断为3位号段，010-029，否则为4位号段
                        if (s2 < 30) {
                            if (phone.length > 8) {
                                return phone.substr(0, 3) + "****" + phone.substr(7);
                            } else {
                                return "****" + phone.substr(4);
                            }
                        } else {
                            if (phone.length > 10) {
                                return phone.substr(0, 4) + "****" + phone.substr(8);
                            } else {
                                return "****" + phone.substr(4);
                            }
                        }
                    }
                } else {
                    return phone;
                }
            },
            /**
             * 添加忙碌按钮
             * @param typeId
             * @param showText
             * @returns {CallCenter}
             */
            addBusyButton: function (CallCenter_main) {
                if (CallCenter._busyTypeMap.size() > 0) {
                    var keyList = CallCenter._busyTypeMap.keySet();
                    for (var i = 0; i < keyList.length; i++) {
                        var typeId = keyList[i];
                        var showText = CallCenter._busyTypeMap.get(typeId);
                        var exist = CallCenter_main.find("#CallCenter_busy" + typeId).length > 0;
                        if (CallCenter._drawType == 1) {
                            if (typeId == 0) {
                                continue;
                            }
                            var li = jQuery('<li class="CallCenter_busy" id="CallCenter_busy' + typeId + '"></li>');
                            var li_a = jQuery('<span>' + showText + '</span>');
                            li_a.bind("click", {type: typeId}, function (e) {
                                CallCenter.busy(e.data.type);
                                jQuery("#CallCenter_status_buts").hide();
                                e.stopPropagation();
                                return false;
                            });
                            li.append(li_a);
                            if (exist) {
                                CallCenter_main.find("#CallCenter_busy" + typeId).replaceWith(li);
                            } else {
                                CallCenter_main.find("#CallCenter_status_buts").append(li);
                            }
                        } else if (CallCenter._drawType == 2) {
                            var e_1_3_a = jQuery('<li class="CallCenter_busyList_li"></li>');
                            var e_1_3_icon = jQuery('<div class="CallCenter_icon"></div>');
                            var e_1_3_text = jQuery('<div class="CallCenter_text"></div>');
                            e_1_3_icon.attr("id", "CallCenter_busy_icon" + typeId).append('<img src="images/all/static/changtai-3.png"/>');
                            e_1_3_text.attr("id", "CallCenter_busy_text" + typeId).html(showText);
                            e_1_3_a.attr("id", "CallCenter_busy" + typeId).addClass("CallCenter_busy").append(e_1_3_icon).append(e_1_3_text);
                            e_1_3_a.bind("click", {type: typeId}, function (e) {
                                if (jQuery(this).find("img").data("status") == "active") {
                                    CallCenter.busy(e.data.type);
                                    jQuery("#CallCenter_busyList").hide();
                                    e.preventDefault();
                                    return false;
                                }
                            });
                            if (exist) {
                                CallCenter_main.find("#CallCenter_busy" + typeId).replaceWith(e_1_3_a);
                            } else {
                                CallCenter_main.find("#CallCenter_busyList").append(e_1_3_a);
                            }
                        }
                    }
                    if (CallCenter._drawType == 2) {
                        CallCenter_main.find("#CallCenter_busyList").width(CallCenter_main.find(".CallCenter_busyList_li").length * 60);
                    }
                }
                return this;
            },
            /**
             * 移除忙碌按钮
             * @param typeId
             * @returns {CallCenter}
             */
            removeBusyButton: function (typeId) {
                jQuery("#CallCenter_busy" + typeId).remove();
                CallCenter._busyTypeMap.remove(typeId);
                return this;
            },
            /**
             * 设置3CS地址
             * @param url
             */
            set3CS_url: function (url) {
                if (typeof(url) != "undefined"
                    && url != null
                    && url != ""
                    && url.length > 8
                    && CallCenter._url_3cs != url) {
                    CallCenter._url_3cs = url;
                    if (CallCenter._url_3cs.indexOf("http://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(7, CallCenter._url_3cs.length);
                    } else if (CallCenter._url_3cs.indexOf("https://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(8, CallCenter._url_3cs.length);
                        CallCenter._url_3cs_ssl = true;
                    }
                    if (CallCenter._url_3cs.indexOf("ws://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(5, CallCenter._url_3cs.length);
                    } else if (CallCenter._url_3cs.indexOf("wss://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(6, CallCenter._url_3cs.length);
                        CallCenter._url_3cs_ssl = true;
                    }
                    if (CallCenter._url_3cs != null && CallCenter._url_3cs != ""
                        && CallCenter._url_3cs.lastIndexOf("/") == (CallCenter._url_3cs.length - 1)) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(0, CallCenter._url_3cs.length - 1);
                    }
                    CallCenter.log("设置3CS_url为：" + CallCenter._url_3cs);
                }
            },
            /**
             * 添加登录的任务
             * @param showText
             * @param groupId
             */
            addLoginTask: function (showText, groupId, status) {
                if (CallCenter._drawType == 1) {
                    var li = jQuery('<li class="CallCenter_login_group" id="CallCenter_group_' + groupId + '"></li>');
                    var li_span = jQuery('<span></span>');
                    if (status == 2) {
                        li_span.html(showText + '(暂停中)');
                        li_span.css('color', '#ccc');
                    } else {
                        li_span.html(showText + '(运行中)');
                        li_span.bind("click", {groupId: groupId}, function (e) {
                            CallCenter.setLoginGroups(e.data.groupId);
                            CallCenter.login();
                            jQuery("#CallCenter_status_buts").hide();
                        });
                    }
                    li.append(li_span);
                    jQuery("#CallCenter_status_buts").append(li);
                } else {
                    var pannel;
                    if (jQuery('#CallCenter_login_group_pannel').length == 0) {
                        pannel = jQuery('<div id="CallCenter_login_group_pannel"></div>');
                        var offset = jQuery('#CallCenter_login').offset();
                        var left = offset.left || 0;
                        var top = offset.top || 0;
                        pannel.css({
                            'postion': 'absolute',
                            'left': left,
                            'top': top + jQuery('#CallCenter_login').height()
                        })
                        jQuery('#CallCenter_main').prepend(pannel);
                    }
                    pannel = jQuery('#CallCenter_login_group_pannel');
                    var div = jQuery('<div class="CallCenter_login_group" id="CallCenter_group_' + groupId + '"></div>');

                    if (status == 2) {
                        div.html(showText + '(暂停中)');
                        div.css('color', '#ccc');
                    } else {
                        div.html(showText + '(运行中)');
                        div.bind("click", {groupId: groupId}, function (e) {
                            CallCenter.setLoginGroups(e.data.groupId);
                            CallCenter.login();
                            pannel.hide();
                        });
                    }
                    pannel.append(div);
                }
            },
            /**
             * 添加可登录技能组
             * @param ws_url
             * @param media_ip
             * @param media_port
             * @param showText
             * @param groupId
             */
            addLoginGroup: function (ws_url, media_ip, media_port, showText, groupId) {
                if (CallCenter._drawType == 1) {
                    var li = jQuery('<li class="CallCenter_login_group" id="CallCenter_group_' + groupId + '"></li>');
                    var li_span = jQuery('<span></span>');
                    li_span.html(showText);
                    li_span.bind("click", {
                        ws_url: ws_url,
                        media_ip: media_ip,
                        media_port: media_port,
                        groupId: groupId
                    }, function (e) {
                        CallCenter._wsurl = e.data.ws_url;           //ccs地址
                        CallCenter._media_ip = e.data.media_ip;      //媒体地址
                        CallCenter._media_port = e.data.media_port;  //媒体端口
                        CallCenter._logingroups = e.data.groupId;    //登录到的技能组
                        if (CallCenter.getLoginType() == 2) {//软话机方式登录
                            SoftPhone.init(CallCenter._media_ip, CallCenter._media_port, CallCenter._sip_id, CallCenter._sip_pwd);
                        } else {//手机或SIP话机方式登录
                            CallCenter.init();
                        }
                        jQuery("#CallCenter_status_buts").hide();
                        e.stopPropagation();
                        return false;
                    });
                    li.append(li_span);
                    jQuery("#CallCenter_status_buts").append(li);
                } else {
                    var pannel;
                    if (jQuery('#CallCenter_login_group_pannel').length == 0) {
                        pannel = jQuery('<div id="CallCenter_login_group_pannel"></div>');
                        var offset = jQuery('#CallCenter_login').offset();
                        var left = offset.left || 0;
                        var top = offset.top || 0;
                        pannel.css({
                            'postion': 'absolute',
                            'left': left,
                            'top': top + jQuery('#CallCenter_login').height()
                        })
                        jQuery('#CallCenter_main').prepend(pannel);
                    }
                    pannel = jQuery('#CallCenter_login_group_pannel');
                    var div = jQuery('<div class="CallCenter_login_group" id="CallCenter_group_' + groupId + '"></div>');

                    div.html(showText);
                    div.bind("click", {
                        ws_url: ws_url,
                        media_ip: media_ip,
                        media_port: media_port,
                        groupId: groupId
                    }, function (e) {
                        CallCenter._wsurl = e.data.ws_url;           //ccs地址
                        CallCenter._media_ip = e.data.media_ip;      //媒体地址
                        CallCenter._media_port = e.data.media_port;  //媒体端口
                        CallCenter._logingroups = e.data.groupId;    //登录到的技能组
                        if (CallCenter.getLoginType() == 2) {//软话机方式登录
                            SoftPhone.init(CallCenter._media_ip, CallCenter._media_port, CallCenter._sip_id, CallCenter._sip_pwd);
                        } else {//手机或SIP话机方式登录
                            CallCenter.init();
                        }
                        pannel.hide();
                    });
                    pannel.append(div);
                }
            },
            /**
             * 打印日志
             * @param c 日志内容
             * @param send3cs 是否发送到服务器
             * @returns {CallCenter}
             */
            log: function (c, send3cs) {
                if (CallCenter._nolog) {
                    return this;
                }
                if (typeof(send3cs) == "undefined") {
                    send3cs = true;
                }
                if (window.console && window.console.log) {
                    if (typeof(c) == "string") {
                        c = "[" + CallCenter.dateNow() + "] " + c;
                        window.console.log(c);
                    } else {
                        if (CallCenter._useOcx) {
                            c = "[" + CallCenter.dateNow() + "] " + JSON.stringify(c);
                            window.console.log(c);
                        } else {
                            if (CallCenter._debug) {
                                window.console.log(c);
                            } else {
                                c = "[" + CallCenter.dateNow() + "] " + JSON.stringify(c);
                                window.console.log(c);
                            }
                        }
                    }
                }
                if (CallCenter._sendlog && send3cs) {
                    CallCenter.send_3cs(c);
                }
                return this;
            },
            /**
             * 发送消息到3CS
             */
            send_3cs: function (sendObj) {
                try {
                    if (CallCenter._url_3cs) {
                        if (typeof(sendObj) != "string") {
                            sendObj = JSON.stringify(sendObj);
                        }
                        var url = CallCenter._url_3cs + "/Api/savelog?log=" + sendObj + "&callback=?";
                        if (CallCenter._url_3cs_ssl) {
                            url = "https://" + url;
                        } else {
                            url = "http://" + url;
                        }
                        jQuery.getJSON(url, function (json) {
                        });
                    }
                } catch (ex) {
                    CallCenter.log("3CS:发送消息异常", false);
                    for (x in ex) {
                        CallCenter.log(x + ":" + ex[x]);
                    }
                    CallCenter.log(ex);
                }
            },
            /**
             * IE9以下创建WS连接
             * @param url
             * @returns {Element}
             */
            newWebSocket: function (url) {
                CallCenter._websocket_ocx = document.createElement("object");
                if (window.ActiveXObject || "ActiveXObject" in window) {
                    CallCenter._websocket_ocx.classid = "CLSID:4B99B6A3-777E-4DB9-87A9-A0AE3E13F6BC";
                    CallCenter._websocket_ocx.width = 1;
                    CallCenter._websocket_ocx.height = 1;
                    CallCenter._websocket_ocx.style.position = "fixed";
                    CallCenter._websocket_ocx.style.bottom = "0px";
                    CallCenter._websocket_ocx.style.left = "0px";
                    document.body.appendChild(CallCenter._websocket_ocx);
                    CallCenter._websocket_ocx.setwsurl(url);
                }
                return CallCenter._websocket_ocx;
            },
            /**
             * 全按钮布局绑定事件
             * @param el
             */
            bindHover: function (el) {
                el.bind("mouseover", function () {
                    var src = jQuery(this).find(".CallCenter_icon img").attr("src");
                    jQuery(this).find(".CallCenter_icon img").attr("src", src.replace("static", "hover"));
                });
                el.bind("mouseout", function () {
                    var src = jQuery(this).find(".CallCenter_icon img").attr("src");
                    jQuery(this).find(".CallCenter_icon img").attr("src", src.replace("hover", "static"));
                });
            },
            /**
             * 获取当前文件路径
             * @returns {null}
             */
            getPath: function () {
                if (!CallCenter._thisPath) {
                    var js = document.scripts;
                    for (var i = 0; i < js.length; i++) {
                        var script = js[i];
                        var jsPath = script.src;
                        if (jsPath.indexOf("CallCenter.js") != -1) {
                            CallCenter._thisPath = jsPath.substring(0, jsPath.lastIndexOf("/") + 1);
                        }
                    }
                }
                if (!CallCenter._thisPath) {
                    CallCenter._thisPath = "";
                }
                return CallCenter._thisPath;
            },
            /**
             * 创建CSS元素
             * @param filePath
             */
            createCss: function (filePath, id) {
                var styleTag = document.createElement("link");
                styleTag.setAttribute('type', 'text/css');
                styleTag.setAttribute('rel', 'stylesheet');
                styleTag.setAttribute('href', filePath);
                styleTag.setAttribute('id', id);
                jQuery("head")[0].appendChild(styleTag);
            },
            /**
             * 创建script元素
             * @param filePath
             * @returns {CallCenter}
             */
            createScript: function (filePath) {
                var tag = document.createElement("script");
                tag.setAttribute('type', 'text/javascript');
                tag.setAttribute('src', filePath);
                jQuery("head")[0].appendChild(tag);
                return this;
            },
            /**
             * 内部使用Map
             * @constructor
             */
            HashMap: function () {
                var length = 0;
                var obj = new Object();
                this.isEmpty = function () {
                    return length == 0;
                };
                this.containsKey = function (key) {
                    return (key in obj);
                };
                this.containsValue = function (value) {
                    for (var key in obj) {
                        if (obj[key] == value) {
                            return true;
                        }
                    }
                    return false;
                };
                this.put = function (key, value) {
                    if (!this.containsKey(key)) {
                        length++;
                    }
                    obj[key] = value;
                };
                this.get = function (key) {
                    return this.containsKey(key) ? obj[key] : null;
                };
                this.remove = function (key) {
                    if (this.containsKey(key) && (delete obj[key])) {
                        length--;
                    }
                };
                this.values = function () {
                    var _values = new Array();
                    for (var key in obj) {
                        _values.push(obj[key]);
                    }
                    return _values;
                };
                this.keySet = function () {
                    var _keys = new Array();
                    for (var key in obj) {
                        _keys.push(key);
                    }
                    return _keys;
                };
                this.size = function () {
                    return length;
                };
                this.clear = function () {
                    length = 0;
                    obj = new Object();
                };
            },
            /**
             * 绑定快捷键
             * @param evt
             */
            hotkey: function (evt) {
                //兼容IE和Firefox获得keyBoardEvent对象
                evt = (evt) ? evt : ((window.event) ? window.event : "");
                var key = evt.keyCode ? evt.keyCode : evt.which;//兼容IE和Firefox获得keyBoardEvent对象的键值
                if ((key == 79) && evt.ctrlKey && evt.altKey) {
                    if (CallCenter._sendlog) {
                        CallCenter.closeClientLog();
                        alert("发送日志到服务端状态：禁用");
                    } else {
                        CallCenter.openClientLog();
                        alert("发送日志到服务端状态：启用");
                    }
                }
            },
            /**
             * 初始化跨域消息
             */
            initMsg: function () {
                var messenger = new Messenger(null, 'CallCenterMsg', 'CallCenter');
                messenger.listen(function (msg) {
                    eval(msg);
                });
            },
            /**
             * 设置cookie
             * @param name
             * @returns {string}
             */
            getcookie: function (name) {
                var cookie_start = document.cookie.indexOf(name);
                var cookie_end = document.cookie.indexOf(";", cookie_start);
                return cookie_start == -1 ? '' : decodeURIComponent(document.cookie.substring(cookie_start + name.length + 1, (cookie_end > cookie_start ? cookie_end : document.cookie.length)));
            },
            /**
             * 获取cookie
             * @param name
             * @param val
             * @param seconds
             * @param path
             * @param domain
             * @param secure
             */
            setcookie: function (name, val, seconds, path, domain, secure) {
                var expires = new Date();
                expires.setTime(expires.getTime() + seconds * 1000);
                document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(val)
                    + (expires ? '; expires=' + expires.toGMTString() : '')
                    + (path ? '; path=' + path : '/')
                    + (domain ? '; domain=' + domain : '')
                    + (secure ? '; secure' : '');
            },
            /**
             * 获取本地存储
             * @param name
             */
            getlocalstorage: function (name) {
                if (window.localStorage) {
                    return window.localStorage.getItem('com.CallCenter.' + name);
                } else {
                    return CallCenter.getcookie(name);
                }
            },
            /**
             * 设置本地存储
             * @param name
             * @param val
             */
            setlocalstorage: function (name, val) {
                if (window.localStorage) {
                    window.localStorage.setItem('com.CallCenter.' + name, val);
                } else {
                    CallCenter.setcookie(name, val);
                }
            },

            //基础操作begin--------------------------------------------------------------------------------------------------------------
            /**
             * 请求接听
             */
            handle_acceptcall: function () {
                if (CallCenter._serverType == CallCenter._serverType_cti) {
                    var sendobj = new CallCenter._sendcmd("answercall");
                    CallCenter.send(sendobj);
                } else {
                    SoftPhone.AcceptCall();
                }
            },
            /**
             * 请求外呼
             * @param called
             * @param caller
             * @param preview
             */
            handle_makecall: function (called, caller, preview) {
                CallCenter._preview = preview;
                CallCenter.initControl().setStatusAndPhoneText("请求外呼").log("CallCenter消息：外呼原始号码[" + called + "]");
                CallCenter._calling = true;
                CallCenter._isCallout = true;
                CallCenter._callingtimer = 0;
                CallCenter._preview = preview;
                if (called && called.indexOf('@') != -1) {
                    CallCenter._isInnercall = true;
                }

                var sendobj = new CallCenter._sendcmd("makecall");
                sendobj.preview = preview;
                sendobj.caller = caller;
                sendobj.called = called;
                CallCenter.send(sendobj);
            },
            /**
             * 执行保持
             */
            handle_mute: function () {
                CallCenter.setStatusAndPhoneText("请求保持");
                if (CallCenter._openOnlyMuteCustomer && CallCenter._logintype == CallCenter._loginType_web) {//如果是软话机方式并且开启了只静音客户
                    SoftPhone.Mute();
                } else {
                    var sendobj = new CallCenter._sendcmd("mute");
                    CallCenter.send(sendobj);
                }
            },
            /**
             * 执行三方
             */
            handle_tripartitetalk: function () {
                CallCenter.setStatusAndPhoneText("请求三方通话");
                var sendobj = new CallCenter._sendcmd("tripartitetalk");
                CallCenter.send(sendobj);
            },
            /**
             * 保持成功
             */
            event_mute: function () {
                CallCenter.initControl().setGreenClass().setStatusAndPhoneText("保持").showControl("#CallCenter_unmutebut,#CallCenter_phonenum");
            },
            /**
             * 取消保持
             */
            handle_unmute: function () {
                CallCenter.setStatusAndPhoneText("请求取消保持");
                if (CallCenter._openOnlyMuteCustomer && CallCenter._logintype == CallCenter._loginType_web) {//如果是软话机方式并且开启了只静音客户
                    SoftPhone.UnMute();
                } else {
                    var sendobj = new CallCenter._sendcmd("unmute");
                    CallCenter.send(sendobj);
                }
            },
            /**
             * 请求咨询
             * @param number
             * @param userdata
             */
            handle_agentconsult: function (number, userdata) {
                CallCenter.setStatusAndPhoneText("请求咨询");
                var sendobj = new CallCenter._sendcmd("agentconsult");
                sendobj.num = number;
                sendobj.userdata = userdata;
                CallCenter.send(sendobj);
            },
            /**
             * 咨询中
             */
            event_agentconsult: function () {
                CallCenter.initControl().setGreenClass().setStatusAndPhoneText("咨询中").showControl("#CallCenter_consultbackbut,#CallCenter_phonenum");
            },
            /**
             * 咨询通话中
             */
            event_consultationcalls: function () {
                CallCenter.initControl().setGreenClass().setStatusAndPhoneText("咨询通话中").showControl("#CallCenter_consultbackbut,#CallCenter_tripartitetalkbut,#CallCenter_shiftbut");
            },
            /**
             * 请求取消咨询
             */
            handle_agentconsultabck: function () {
                CallCenter.setStatusAndPhoneText("请求取消咨询");
                var sendobj = new CallCenter._sendcmd("agentconsultback");
                CallCenter.send(sendobj);
            },
            /**
             * 请求咨询服务
             * @param filename
             * @param groupid
             * @param userdata
             */
            handle_consulationservice: function (filename, groupid, userdata, num) {
                CallCenter.setStatusAndPhoneText("请求咨询服务");
                var sendobj = new CallCenter._sendcmd("consulationservice");
                sendobj.num = num;
                sendobj.filename = filename;
                sendobj.groupid = groupid;
                sendobj.userdata = userdata;
                CallCenter.send(sendobj);
            },
            /**
             * 请求咨询转接
             */
            handle_agentshift: function () {
                CallCenter.setStatusAndPhoneText("请求咨询转接");
                var sendobj = new CallCenter._sendcmd("agentshift");
                CallCenter.send(sendobj);
            },
            /**
             * 执行转接
             * @param number
             * @param groupid
             * @param userdata
             */
            handle_transfercall: function (number, groupid, userdata) {
                CallCenter.setStatusAndPhoneText("请求转接");
                var sendobj = new CallCenter._sendcmd("transfercall");
                sendobj.num = number;
                sendobj.groupid = groupid;
                sendobj.userdata = userdata;
                CallCenter.send(sendobj);
            },
            /**
             * 执行转接技能组
             * @param number
             * @param groupid
             * @param userdata
             */
            handle_transfergroup: function (groupid, userdata) {
                CallCenter.setStatusAndPhoneText("请求转接技能组");
                var sendobj = new CallCenter._sendcmd("transfergroup");
                sendobj.agentkey = CallCenter._operatorid + "@" + CallCenter._abbreviate;
                sendobj.companyid = CallCenter._companyid;
                sendobj.groupid = groupid;
                sendobj.userdata = userdata;
                CallCenter.send(sendobj);
            },
            /**
             * 请求取消转接
             */
            handle_canceltransfercall: function () {
                CallCenter.setStatusAndPhoneText("请求取消转接");
                var sendobj = new CallCenter._sendcmd("canceltransfercall");
                CallCenter.send(sendobj);
            },
            /**
             * 请求转接服务
             * @param filename
             */
            handle_transferservice: function (filename, num) {
                CallCenter.setStatusAndPhoneText("请求转接服务");
                var sendobj = new CallCenter._sendcmd("transferservice");
                sendobj.num = num;
                sendobj.filename = filename;
                CallCenter.send(sendobj);
            },
            /**
             * 请求监听
             */
            handle_monitor: function (agentid) {
                CallCenter.initControl().setStatusAndPhoneText("请求监听");
                CallCenter._be_operator = agentid;
                var sendobj = new CallCenter._sendcmd("monitor");
                sendobj.agentoperatorid = agentid;
                CallCenter.send(sendobj);
            },
            /**
             * 请求拦截
             */
            handle_intercept: function (agentid) {
                CallCenter.initControl().setStatusAndPhoneText("请求拦截");
                CallCenter._be_operator = agentid;
                var sendobj = new CallCenter._sendcmd("agentinterceptcall");
                sendobj.agentoperatorid = agentid;
                CallCenter.send(sendobj);
            },
            /**
             * 请求强插
             */
            handle_agentinsert: function (agentid) {
                CallCenter.initControl().setStatusAndPhoneText("请求强插");
                CallCenter._be_operator = agentid;
                var sendobj = new CallCenter._sendcmd("agentinsert");
                sendobj.agentoperatorid = agentid;
                CallCenter.send(sendobj);
            },
            /**
             * 清除SDK登录信息
             */
            clearConnection: function () {
                if (CallCenter._logintype == CallCenter._loginType_web) {//软话机方式登录
                    try {
                        SoftPhone.Logout();
                        SoftPhone.UnInitialize();
                    } catch (e) {
                        CallCenter.log(e);
                    }
                }
                CallCenter._islogin = false;
                CallCenter._nowStatus = "offwork";
                CallCenter._wsurl = null;
                CallCenter._companyid = null;               //企业编号
                CallCenter._abbreviate = null;              //企业简写
                CallCenter._operatorid = null;              //工号
                CallCenter._password = null;                //密码
                CallCenter._media_ip = null;                //媒体服务器IP
                CallCenter._media_port = null;              //媒体服务器port
                CallCenter._sip_id = null;                  //SIP账号
                CallCenter._sip_pwd = null;                 //SIP密码
                CallCenter._logintype = null;               //登录方式,0手机,1SIP话机,2软话机
                CallCenter._auto = 0;                       //是否预测外呼，0否1是
                CallCenter._logingroups = "";               //登录到的技能组
                CallCenter._url_3cs = null;                 //3cs的地址
                CallCenter._url_3cs_ssl = false;            //3cs前缀，是否为ssl
                CallCenter._callId = "";                    //callid
                CallCenter._timestamp = "";                 //callid匹配的timestamp
                CallCenter._caller = "";                    //主叫号码
                CallCenter._called = "";                    //被叫号码
                CallCenter._calling_from = "";              //通话中的状态来源
                CallCenter._be_operator = "";               //被操作人
                CallCenter._status = "";                     //当前CCS返回状态
                CallCenter._statusText = "等待连接";        //当前状态文字

                CallCenter._callingtimer = 0;               //通话时长
                CallCenter._timerspan = 0;                  //状态栏计时秒数
                CallCenter.timer();
                clearInterval(CallCenter._timerId);         //清除计时器
                CallCenter._timerId = 0;                    //状态栏时间控件编号
                CallCenter._isMeeting = false;              //是否会议模式，会议模式没有咨询转接转IVR
                CallCenter._isInnercall = false;            //是否内呼
                if (CallCenter._websocket) {
                    try {
                        CallCenter._websocket.close();
                        CallCenter._websocket = null;
                    } catch (ex) {
                        CallCenter.log(ex);
                    }
                }
                if (CallCenter._websocket_ocx) {
                    try {
                        CallCenter._websocket_ocx.close();
                        CallCenter._websocket_ocx = null;
                    } catch (ex) {
                        CallCenter.log(ex);
                    }
                }
                return this;
            },
            //基础操作end--------------------------------------------------------------------------------------------------------------

            /**
             * 加载后自动调用
             */
            loading: function () {
                CallCenter.getPath();
                CallCenter.createCss(CallCenter._thisPath + "CallCenterCommon.css", "CallCenter_css_common");
                CallCenter.createScript(CallCenter._thisPath + "json2.js");
                CallCenter.createScript(CallCenter._thisPath + "SoftPhone.js");
                CallCenter.createScript(CallCenter._thisPath + "SoftPhone_ocx.js");
                CallCenter.createScript(CallCenter._thisPath + "messenger.js");
                CallCenter._busyTypeMap = new CallCenter.HashMap();
                document.onkeydown = CallCenter.hotkey; //当onkeydown 事件发生时调用hotkey函数
                window.SoftPhone = new Object();
            }
            //以上为SDK内部调用功能----------------------------------------------------------------------------------------
        }
    CallCenter.loading();
})();

var SDK_action = {
    login_handle: {type: "handle", name: "login_handle", text: "登录"},										//登录
    reconnection_handle: {type: "handle", name: "reconnection_handle", text: "重连"},						//重新连接
    logout_handle: {type: "handle", name: "logout_handle", text: "发送登出"},								//发送登出
    agentidle_handle: {type: "handle", name: "agentidle_handle", text: "空闲"},								//示闲
    agentbusy_handle: {type: "handle", name: "agentbusy_handle", text: "忙碌"},								//示忙
    acceptcall_handle: {type: "handle", name: "acceptcall_handle", text: "接听"},							//接听
    makecall_handle: {type: "handle", name: "makecall_handle", text: "外呼"},								//外呼
    cancelmakecall_handle: {type: "handle", name: "cancelmakecall_handle", text: "挂断呼叫"},				//挂断呼叫
    mute_handle: {type: "handle", name: "mute_handle", text: "保持"},										//保持
    unmute_handle: {type: "handle", name: "unmute_handle", text: "取消保持"},								//取消保持
    transfercall_handle: {type: "handle", name: "transfercall_handle", text: "转接"},						//转接
    transfergroup_handle: {type: "handle", name: "transfergroup_handle", text: "转接技能组"},				//转接
    canceltransfercall_handle: {type: "handle", name: "canceltransfercall_handle", text: "取消转接"},		//取消转接
    agentconsult_handle: {type: "handle", name: "agentconsult_handle", text: "咨询"},						//咨询
    agentconsultback_handle: {type: "handle", name: "agentconsultback_handle", text: "取消咨询"},			//取消咨询
    agentshift_handle: {type: "handle", name: "agentshift_handle", text: "咨询转接"},						//咨询转接
    consulationservice_handle: {type: "handle", name: "consulationservice_handle", text: "咨询服务"},		//咨询服务
    tripartitetalk_handle: {type: "handle", name: "tripartitetalk_handle", text: "三方通话"},				//三方
    transferservice_handle: {type: "handle", name: "transferservice_handle", text: "转接服务"},				//转接服务
    agentinsert_handle: {type: "handle", name: "agentinsert_handle", text: "强插"},							//强插
    monitor_handle: {type: "handle", name: "monitor_handle", text: "监听"},									//监听
    agentinterceptcall_handle: {type: "handle", name: "agentinterceptcall_handle", text: "拦截"},			//拦截

    login: {type: "event", name: "login", text: "登录"},													//登录
    authfail: {type: "event", name: "authfail", text: "登录失败"},											//登录失败
    kick: {type: "event", name: "kick", text: "另一设备登录"},												//另一设备登录
    logout: {type: "event", name: "logout", text: "登出"},													//登出
    disconnect: {type: "event", name: "disconnect", text: "断开连接"},										//断开连接
    reconnection: {type: "event", name: "reconnection", text: "重新连接"},									//重新连接
    reconnection_fail: {type: "event", name: "reconnection_fail", text: "重新连接失败"},                    //重新连接失败
    agentidle: {type: "event", name: "agentidle", text: "空闲"},											//示闲
    agentidle_fail: {type: "event", name: "agentidle_fail", text: "空闲"},								//示闲
    agentbusy: {type: "event", name: "agentbusy", text: "忙碌"},											//忙碌
    acceptcall_fail: {type: "event", name: "acceptcall_fail", text: "接听失败"},								//接听失败
    makecall: {type: "event", name: "makecall", text: "外呼"},												//外呼
    makecall_fail: {type: "event", name: "makecall_fail", text: "外呼失败"},								//外呼失败
    outringing: {type: "event", name: "outringing", text: "座席振铃"},										//外呼座席振铃
    outcall: {type: "event", name: "outcall", text: "座席摘机"},											//外呼座席摘机
    calledringing: {type: "event", name: "calledringing", text: "被叫振铃"},								//外呼被叫振铃
    outboundcall: {type: "event", name: "outboundcall", text: "被叫接通"},									//预测外呼被叫接通
    answer: {type: "event", name: "answer", text: "被叫接通"},												//外呼被叫接通
    cancelmakecall: {type: "event", name: "cancelmakecall", text: "挂断呼叫"},								//挂断呼叫
    inringing: {type: "event", name: "inringing", text: "来电振铃"},										//来电振铃
    playtts: {type: "event", name: "playtts", text: "播放TTS"},												//播放TTS
    incall: {type: "event", name: "incall", text: "座席接听"},												//来电座席接听
    consultinringing: {type: "event", name: "consultinringing", text: "咨询来电"},							//被咨询方来电振铃
    consultincall: {type: "event", name: "consultincall", text: "咨询来电接通"},							//被咨询方接通
    out_transfering: {type: "event", name: "out_transfering", text: "转接中"},								//转接中
    in_transfering: {type: "event", name: "in_transfering", text: "转接中"},								//转接中
    transferincall_transfering: {type: "event", name: "transferincall_transfering", text: "转接中"},		//转接中
    transfercall_fail: {type: "event", name: "transfercall_fail", text: "转接失败"},							//转接失败
    transferinringing: {type: "event", name: "transferinringing", text: "转接来电振铃"},					//被转接来电振铃
    transferincall: {type: "event", name: "transferincall", text: "转接来电通话"},							//被转接来电通话中
    innerringing: {type: "event", name: "innerringing", text: "内呼振铃"},									//内呼振铃
    innercall: {type: "event", name: "innercall", text: "内呼接通"},										   //内呼接通
    out_mute: {type: "event", name: "out_mute", text: "保持"},												//保持
    out_auto_mute: {type: "event", name: "out_auto_mute", text: "保持"},									//保持
    in_mute: {type: "event", name: "in_mute", text: "保持"},													//保持
    mute_fail: {type: "event", name: "mute_fail", text: "保持失败"},                                        //保持
    out_unmute: {type: "event", name: "out_unmute", text: "取消保持"},										//取消保持
    out_auto_unmute: {type: "event", name: "out_auto_unmute", text: "取消保持"},							//取消保持
    in_unmute: {type: "event", name: "in_unmute", text: "取消保持"},											//取消保持
    unmute_fail: {type: "event", name: "unmute_fail", text: "取消保持"},                                    //取消保持失败
    transfercall: {type: "event", name: "transfercall", text: "转接"},										//转接
    canceltransfercall: {type: "event", name: "canceltransfercall", text: "取消转接"},						//取消转接
    out_agentconsult: {type: "event", name: "out_agentconsult", text: "咨询"},								//咨询
    in_agentconsult: {type: "event", name: "in_agentconsult", text: "咨询"},								//咨询
    transferincall_agentconsult: {type: "event", name: "transferincall_agentconsult", text: "咨询"},		//咨询
    agentconsult_fail: {type: "event", name: "agentconsult_fail", text: "咨询失败"},                        //咨询失败
    out_consultationcalls: {type: "event", name: "out_consultationcalls", text: "咨询通话中"},				//咨询通话中
    in_consultationcalls: {type: "event", name: "in_consultationcalls", text: "咨询通话中"},				//咨询通话中
    transferincall_consultationcalls: {type: "event", name: "transferincall_consultationcalls", text: "咨询通话中"},//咨询通话中
    agentconsultback: {type: "event", name: "agentconsultback", text: "取消咨询"},							//取消咨询
    agentshift: {type: "event", name: "agentshift", text: "咨询转接"},										//咨询转接
    agentshift_fail: {type: "event", name: "agentshift_fail", text: "咨询转接失败"},                        //咨询转接
    consulationservice: {type: "event", name: "consulationservice", text: "咨询服务"},						//咨询服务
    consulationservice_fail: {type: "event", name: "consulationservice_fail", text: "咨询服务失败"},        //咨询服务失败
    tripartitetalk: {type: "event", name: "tripartitetalk", text: "三方通话"},								//三方
    tripartitetalk_fail: {type: "event", name: "tripartitetalk_fail", text: "三方通话失败"},                //三方通话失败
    sanfangcall: {type: "event", name: "sanfangcall", text: "三方通话接通咨询方"},							//三方通话接通咨询方
    transferservice: {type: "event", name: "transferservice", text: "转接服务"},							//转接服务
    transferservice_fail: {type: "event", name: "transferservice_fail", text: "转接服务失败"},				//转接服务失败
    forceidle: {type: "event", name: "forceidle", text: "强制示闲"},										//强制示闲
    forcebusy: {type: "event", name: "forcebusy", text: "强制示忙"},										//强制示忙
    agentbreak: {type: "event", name: "agentbreak", text: "强拆"},												//强拆
    forcelogout: {type: "event", name: "forcelogout", text: "强制签出"},										//强制签出
    monitor: {type: "event", name: "monitor", text: "监听"},												//监听
    monitor_fail: {type: "event", name: "monitor_fail", text: "监听失败"},                                  //监听
    monitorringing: {type: "event", name: "monitorringing", text: "监听来电振铃"},							//监听来电振铃
    monitorincall: {type: "event", name: "monitorincall", text: "监听接通"},								//监听接通
    agentinterceptcall: {type: "event", name: "agentinterceptcall", text: "拦截"},							//拦截
    agentinterceptcall_fail: {type: "event", name: "agentinterceptcall_fail", text: "拦截失败"},            //拦截
    interceptaltering: {type: "event", name: "interceptaltering", text: "拦截来电振铃"},					//拦截来电振铃
    intercept: {type: "event", name: "intercept", text: "拦截中"},											//拦截中
    interceptcall: {type: "event", name: "interceptcall", text: "拦截接通"},								//拦截接通
    agentinsert: {type: "event", name: "agentinsert", text: "强插"},										//强插
    agentinsert_fail: {type: "event", name: "agentinsert_fail", text: "强插失败"},                          //强插
    agentinsertringing: {type: "event", name: "agentinsertringing", text: "强插振铃"},						//强插振铃
    agentinsertincall: {type: "event", name: "agentinsertincall", text: "强插通话中"},						//强插通话中
    after: {type: "event", name: "after", text: "话后"},													//话后
    siperror: {type: "event", name: "siperror", text: "话机状态异常"}										//话机状态异常
};
var SDK_state = {
    s_nologin: {name: "nologin", text: "未登录"},															     //**未登录
    s_login_sending: {name: "login_sending", text: "请求登录"},												 //**登录发送
    s_login: {name: "login", text: "登录"},																	 //**登录
    s_kick: {name: "kick", text: "另一设备登录"},                                                              //**另一设备登录
    s_authfail: {name: "authfail", text: "验证失败"},                                                         //验证失败
    s_logout_sending: {name: "logout_sending", text: "请求登出"},                                            //**登出发送            #########
    s_logout: {name: "logout", text: "登出"},																    //**登出
    s_disconnect: {name: "disconnect", text: "断开连接"},													//**断开连接
    s_reconnection_sending: {name: "reconnection_sending", text: "请求重新连接"},							//**重连发送            #########
    s_reconnection: {name: "reconnection", text: "重新连接"},												//**重连
    s_reconnection_fail: {name: "reconnection_fail", text: "重新连接失败"},									//**重连失败

    s_idle_sending: {name: "idle_sending", text: "请求空闲"},												//**空闲发送            #########
    s_idle: {name: "idle", text: "空闲"},																	    //**空闲
    s_idle_fail: {name: "idle_fail", text: "空闲失败"},														//**空闲
    s_busy_sending: {name: "busy_sending", text: "请求忙碌"},												//**忙碌发送            #########
    s_busy: {name: "busy", text: "忙碌"},																	    //**忙碌

    s_out_acceptcall_sending: {name: "out_acceptcall_sending", text: "请求接听"},							        //**外呼请求接听            #########
    s_in_acceptcall_sending: {name: "in_acceptcall_sending", text: "请求接听"},							        //**呼入请求接听            #########
    s_consult_acceptcall_sending: {name: "consult_acceptcall_sending", text: "请求接听"},							//**咨询请求接听            #########
    s_transfer_acceptcall_sending: {name: "transfer_acceptcall_sending", text: "请求接听"},						//**转接请求接听            #########
    s_monitor_acceptcall_sending: {name: "monitor_acceptcall_sending", text: "请求接听"},							//**监听请求接听            #########
    s_intercept_acceptcall_sending: {name: "intercept_acceptcall_sending", text: "请求接听"},						//**拦截请求接听            #########
    s_insert_acceptcall_sending: {name: "insert_acceptcall_sending", text: "请求接听"},							//**强插请求接听            #########

    s_idle_makecall_sending: {name: "idle_makecall_sending", text: "请求外呼"},							//**外呼发送            #########
    s_busy_makecall_sending: {name: "busy_makecall_sending", text: "请求外呼"},							//**外呼发送            #########
    s_makecall: {name: "makecall", text: "外呼"},															    //**外呼中
    s_cancelmakecall_sending: {name: "cancelmakecall_sending", text: "请求挂断呼叫"},						//**请求挂断呼叫       #########
    s_cancelmakecall: {name: "cancelmakecall", text: "挂断呼叫"},											//**挂断呼叫
    s_outringing: {name: "outringing", text: "座席振铃"},													//**外呼座席振铃
    s_outcall: {name: "outcall", text: "座席摘机"},															//**外呼座席摘机
    s_calledringing: {name: "calledringing", text: "被叫振铃"},												//**外呼被叫振铃
    s_outboundcall: {name: "outboundcall", text: "被叫接通"},												//预测外呼被叫接通
    s_answer: {name: "answer", text: "被叫接通"},															    //**外呼被叫接通

    s_out_mute_sending: {name: "out_mute_sending", text: "请求保持"},										//**外呼保持发送         #########
    s_out_auto_mute_sending: {name: "out_auto_mute_sending", text: "请求保持"},							        //外呼保持发送         #########
    s_in_mute_sending: {name: "in_mute_sending", text: "请求保持"},											//**呼入保持发送        #########
    s_out_transfercall_mute_sending: {name: "out_transfercall_mute_sending", text: "请求保持"},				//呼入转接
    s_in_transfercall_mute_sending: {name: "in_transfercall_mute_sending", text: "请求保持"},				    //呼入转接
    s_transferincall_mute_sending: {name: "transferincall_mute_sending", text: "请求保持"},					//呼入转接
    s_out_mute: {name: "out_mute", text: "保持"},															    //**外呼保持
    s_out_auto_mute: {name: "out_auto_mute", text: "保持"},													//外呼保持
    s_in_mute: {name: "in_mute", text: "保持"},															    //**呼入保持
    s_out_transfercall_mute: {name: "out_transfercall_mute", text: "保持"},									//呼入保持
    s_in_transfercall_mute: {name: "in_transfercall_mute", text: "保持"},									//呼入保持
    s_transferincall_mute: {name: "transferincall_mute", text: "保持"},										//呼入保持
    s_out_unmute_sending: {name: "out_unmute_sending", text: "请求取消保持"},								//**外呼取消保持发送     #########
    s_out_auto_unmute_sending: {name: "out_auto_unmute_sending", text: "请求取消保持"},					//外呼取消保持发送     #########
    s_in_unmute_sending: {name: "in_unmute_sending", text: "请求取消保持"},									//**呼入取消保持发送    #########
    //s_out_transfercall_unmute_sending: {name: "out_transfercall_unmute_sending", text: "请求取消保持"},		//呼入取消保持发送    #########
    //s_transfercall_unmute_sending: {name: "transfercall_unmute_sending", text: "请求取消保持"},				//呼入取消保持发送    #########
    s_out_agentconsult_sending: {name: "out_agentconsult_sending", text: "请求咨询"},						//**外呼咨询发送         #########
    s_out_auto_agentconsult_sending: {name: "out_auto_agentconsult_sending", text: "请求咨询"},						//**外呼咨询发送         #########
    s_in_agentconsult_sending: {name: "in_agentconsult_sending", text: "请求咨询"},						//**呼入咨询发送        #########
    s_transferincall_agentconsult_sending: {name: "transferincall_agentconsult_sending", text: "请求咨询"},//**呼入咨询发送        #########
    s_out_agentconsult: {name: "out_agentconsult", text: "咨询"},											//**外呼咨询
    s_out_auto_agentconsult: {name: "out_auto_agentconsult", text: "咨询"},											//**外呼咨询
    s_in_agentconsult: {name: "in_agentconsult", text: "咨询"},												//**呼入咨询
    s_transferincall_agentconsult: {name: "transferincall_agentconsult", text: "咨询"},					//**转接通话中咨询
    s_out_agentconsultback_sending: {name: "out_agentconsultback_sending", text: "请求取消咨询"},			//**外呼取消咨询发送     #########
    s_out_auto_agentconsultback_sending: {name: "out_auto_agentconsultback_sending", text: "请求取消咨询"},			//**外呼取消咨询发送     #########
    s_in_agentconsultback_sending: {name: "in_agentconsultback_sending", text: "请求取消咨询"},			//**呼入取消咨询发送     #########
    s_transferincall_agentconsultback_sending: {name: "transferincall_agentconsultback_sending", text: "请求取消咨询"},//**呼入取消咨询发送     #########
    s_out_consultationcalls: {name: "out_consultationcalls", text: "咨询通话中"},							//**外呼咨询通话中
    s_out_auto_consultationcalls: {name: "out_auto_consultationcalls", text: "咨询通话中"},							//**外呼咨询通话中
    s_in_consultationcalls: {name: "in_consultationcalls", text: "咨询通话中"},								//**呼入咨询通话中
    //s_transferincall_consultationcalls: {name: "transferincall_consultationcalls", text: "咨询通话中"},		//转接咨询通话中，目前CCS缺少转接后咨询接通事件
    s_out_consulationservice_sending: {name: "out_consulationservice_sending", text: "请求咨询服务"},    //外呼咨询服务发送     #########
    s_out_auto_consulationservice_sending: {name: "out_auto_consulationservice_sending", text: "请求咨询服务"},    //外呼咨询服务发送     #########
    s_in_consulationservice_sending: {name: "in_consulationservice_sending", text: "请求咨询服务"},		//呼入咨询服务发送    #########
    s_out_consulationservice: {name: "out_consulationservice", text: "外呼咨询服务"},						//外呼咨询服务
    s_out_auto_consulationservice: {name: "out_auto_consulationservice", text: "外呼咨询服务"},						//外呼咨询服务
    s_in_consulationservice: {name: "in_consulationservice", text: "呼入咨询服务"},						//呼入咨询服务
    s_out_agentshift_sending: {name: "out_agentshift_sending", text: "请求发起咨询转接"},					//**外呼咨询转接发送      #########
    s_out_auto_agentshift_sending: {name: "out_auto_agentshift_sending", text: "请求发起咨询转接"},					//**外呼咨询转接发送      #########
    s_in_agentshift_sending: {name: "in_agentshift_sending", text: "请求发起咨询转接"},					//**呼入咨询转接发送      #########
    //s_transferincall_agentshift_sending: {name: "transferincall_agentshift_sending", text: "请求发起咨询转接"},//呼入咨询转接发送      #########，目前CCS缺少转接后咨询接通事件，以至于界面不显示咨询转接和三方按钮
    //s_transferincall_agentshift: {name: "transferincall_agentshift", text: "咨询转接"},						//转接咨询转接，目前CCS缺少转接后咨询接通事件，以至于界面不显示咨询转接和三方按钮
    s_out_tripartitetalk_sending: {name: "out_tripartitetalk_sending", text: "三方通话"},					//**外呼三方通话发送      #########
    s_out_auto_tripartitetalk_sending: {name: "out_auto_tripartitetalk_sending", text: "三方通话"},					//**外呼三方通话发送      #########
    s_in_tripartitetalk_sending: {name: "in_tripartitetalk_sending", text: "三方通话"},					//**呼入三方通话发送     #########
    s_transferincall_tripartitetalk_sending: {name: "transferincall_tripartitetalk_sending", text: "三方通话"},//呼入三方通话发送     #########
    s_out_tripartitetalk: {name: "out_tripartitetalk", text: "三方通话"},									//外呼三方通话
    s_out_auto_tripartitetalk: {name: "out_auto_tripartitetalk", text: "三方通话"},						//外呼三方通话
    s_in_tripartitetalk: {name: "in_tripartitetalk", text: "三方通话"},										//呼入三方通话
    //s_transferincall_tripartitetalk: {name: "transferincall_tripartitetalk", text: "三方通话"},				//转接后咨询三方通话，目前CCS缺少转接后咨询接通事件，以至于界面不显示咨询转接和三方按钮
    s_sanfangcall: {name: "sanfangcall", text: "三方通话中"},												//**呼入三方通话
    s_out_transfercall_sending: {name: "out_transfercall_sending", text: "请求转接"},						//**外呼转接 发送
    s_out_auto_transfercall_sending: {name: "out_auto_transfercall_sending", text: "请求转接"},			//**外呼转接 发送
    s_in_transfercall_sending: {name: "in_transfercall_sending", text: "请求转接"},						//**呼入转接 发送
    s_transferincall_transfercall_sending: {name: "transferincall_transfercall_sending", text: "请求转接"},//**转接到转接 发送
    s_out_transfercall: {name: "out_transfercall", text: "请求转接"},						//**外呼转接 发送
    s_out_auto_transfercall: {name: "out_auto_transfercall", text: "请求转接"},			//**外呼转接 发送
    s_in_transfercall: {name: "in_transfercall", text: "请求转接"},						//**呼入转接 发送
    s_transferincall_transfercall: {name: "transferincall_transfercall", text: "请求转接"},//**转接到转接 发送
    s_out_transfergroup_sending: {name: "out_transfergroup_sending", text: "请求转接技能组"},						//**外呼转接 发送
    s_out_auto_transfergroup_sending: {name: "out_auto_transfergroup_sending", text: "请求转接技能组"},			//**外呼转接 发送
    s_in_transfergroup_sending: {name: "in_transfergroup_sending", text: "请求转接技能组"},						//**呼入转接 发送
    s_transferincall_transfergroup_sending: {name: "transferincall_transfergroup_sending", text: "请求转接技能组"},//**转接到转接 发送
    s_out_transfering: {name: "out_transfering", text: "转接中"},											//**外呼转接
    s_out_auto_transfering: {name: "out_auto_transfering", text: "转接中"},											//**外呼转接
    s_in_transfering: {name: "in_transfering", text: "转接中"},												//**呼入转接中
    s_transferincall_transfering: {name: "transferincall_transfering", text: "转接中"},					//**呼入转接中
    s_out_canceltransfercall_sending: {name: "out_canceltransfercall_sending", text: "请求取消转接"},    //外呼取消转接 发送    #########
    s_out_auto_canceltransfercall_sending: {name: "out_auto_canceltransfercall_sending", text: "请求取消转接"},    //外呼取消转接 发送    #########
    s_in_canceltransfercall_sending: {name: "in_canceltransfercall_sending", text: "请求取消转接"},      //呼入取消转接 发送    #########
    s_transferincall_canceltransfercall_sending: {name: "transferincall_canceltransfercall_sending", text: "请求取消转接"},//呼入取消转接 发送    #########
    s_out_transferservice_sending: {name: "out_transferservice_sending", text: "请求转接服务"},             //外呼转接服务 发送     #########
    s_out_auto_transferservice_sending: {name: "out_auto_transferservice_sending", text: "请求转接服务"},       //外呼转接服务 发送     #########
    s_in_transferservice_sending: {name: "in_transferservice_sending", text: "请求转接服务"},               //呼入转接服务 发送    #########

    s_inringing: {name: "inringing", text: "呼入振铃"},                                                     //**呼入振铃
    s_playtts: {name: "playtts", text: "播放TTS"},                                                          //**播放TTS
    s_incall: {name: "incall", text: "座席接听"},                                                           //**呼入座席接听

    s_consultinringing: {name: "consultinringing", text: "咨询来电振铃"},                                   //**被咨询方来电振铃
    s_consultincall: {name: "consultincall", text: "咨询来电接通"},											//**被咨询方接通
    s_transferinringing: {name: "transferinringing", text: "转接来电振铃"},                                 //**被转接来电振铃
    s_transferincall: {name: "transferincall", text: "转接来电通话中"},                                     //**被转接来电通话中

    s_innerringing: {name: "innerringing", text: "内呼振铃"},												//**内呼振铃
    s_innercall: {name: "innercall", text: "内呼接通"},														//**内呼接通

    s_monitor_idle_sending: {name: "monitor_idle_sending", text: "请求监听"},                               //**监听发送              #########
    s_monitor_busy_sending: {name: "monitor_busy_sending", text: "请求监听"},                               //**监听发送              #########
    s_monitor: {name: "monitor", text: "监听"},																//**监听
    s_monitorringing: {name: "monitorringing", text: "监听来电振铃"},                                       //**监听来电振铃
    s_monitorincall: {name: "monitorincall", text: "监听中"},												//**监听接通
    s_agentinterceptcall_idle_sending: {name: "agentinterceptcall_idle_sending", text: "请求拦截"},      //**拦截发送               #########
    s_agentinterceptcall_busy_sending: {name: "agentinterceptcall_busy_sending", text: "请求拦截"},      //**拦截发送               #########
    s_agentinterceptcall_agentinsertincall_sending: {name: "agentinterceptcall_agentinsertincall_sending", text: "请求拦截"},      //**拦截发送               #########
    s_agentinterceptcall: {name: "agentinterceptcall", text: "拦截"},										//**拦截
    s_interceptaltering: {name: "interceptaltering", text: "拦截来电振铃"},                                //**拦截来电振铃
    s_intercept: {name: "intercept", text: "拦截中"},														   //**拦截中
    s_interceptcall: {name: "interceptcall", text: "拦截通话中"},											//**拦截接通
    s_agentinsert_idle_sending: {name: "agentinsert_idle_sending", text: "请求强插"},                     //**强插发送               #########
    s_agentinsert_busy_sending: {name: "agentinsert_busy_sending", text: "请求强插"},                     //**强插发送               #########
    s_agentinsert_monitorincall_sending: {name: "agentinsert_monitorincall_sending", text: "请求强插"}, //**强插发送               #########
    s_agentinsert: {name: "agentinsert", text: "强插"},														//**强插
    s_agentinsertringing: {name: "agentinsertringing", text: "强插来电振铃"},									//**强插振铃
    s_agentinsertincall: {name: "agentinsertincall", text: "强插通话中"},									//**强插通话中

    s_after: {name: "after", text: "话后"},																	//**话后
    s_siperror: {name: "siperror", text: "话机状态异常"}													//话机状态异常
};
var SDK_events = [
    //登录
    {name: SDK_action.login_handle.name, from: SDK_state.s_nologin.name, to: SDK_state.s_login_sending.name},
    {name: SDK_action.login_handle.name, from: SDK_state.s_logout.name, to: SDK_state.s_login_sending.name},
    {name: SDK_action.login_handle.name, from: SDK_state.s_reconnection_fail.name, to: SDK_state.s_login_sending.name},
    {name: SDK_action.login_handle.name, from: SDK_state.s_kick.name, to: SDK_state.s_login_sending.name},
    {name: SDK_action.login.name, from: SDK_state.s_login_sending.name, to: SDK_state.s_login.name},
    {name: SDK_action.authfail.name, from: SDK_state.s_login_sending.name, to: SDK_state.s_authfail.name},
    {name: SDK_action.kick.name, from: "*", to: SDK_state.s_kick.name},
    //登出
    {name: SDK_action.logout_handle.name, from: SDK_state.s_login.name, to: SDK_state.s_logout_sending.name},
    {name: SDK_action.logout_handle.name, from: SDK_state.s_idle.name, to: SDK_state.s_logout_sending.name},
    {name: SDK_action.logout_handle.name, from: SDK_state.s_busy.name, to: SDK_state.s_logout_sending.name},
    {name: SDK_action.logout_handle.name, from: SDK_state.s_siperror.name, to: SDK_state.s_logout_sending.name},
    {name: SDK_action.logout_handle.name, from: SDK_state.s_inringing.name, to: SDK_state.s_logout_sending.name},
    {name: SDK_action.logout_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_logout_sending.name},
    {name: SDK_action.logout_handle.name, from: SDK_state.s_after.name, to: SDK_state.s_logout_sending.name},
    {name: SDK_action.logout.name, from: SDK_state.s_logout_sending.name, to: SDK_state.s_logout.name},
    //空闲
    {name: SDK_action.agentidle_handle.name, from: SDK_state.s_login.name, to: SDK_state.s_idle_sending.name},
    {name: SDK_action.agentidle_handle.name, from: SDK_state.s_busy.name, to: SDK_state.s_idle_sending.name},
    {name: SDK_action.agentidle_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_idle_sending.name},
    {name: SDK_action.agentidle_handle.name, from: SDK_state.s_after.name, to: SDK_state.s_idle_sending.name},
    {name: SDK_action.agentidle.name, from: SDK_state.s_after.name, to: SDK_state.s_idle.name},
    {name: SDK_action.agentidle.name, from: SDK_state.s_idle_sending.name, to: SDK_state.s_idle.name},
    {name: SDK_action.agentidle_fail.name, from: SDK_state.s_idle_sending.name, to: SDK_state.s_idle_fail.name},
    //忙碌
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_login.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_idle.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_idle_fail.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_busy.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_siperror.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_after.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentbusy.name, from: SDK_state.s_busy_sending.name, to: SDK_state.s_busy.name},
    //接听
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_outringing.name, to: SDK_state.s_out_acceptcall_sending.name},
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_inringing.name, to: SDK_state.s_in_acceptcall_sending.name},
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_consultinringing.name, to: SDK_state.s_consult_acceptcall_sending.name},
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_transferinringing.name, to: SDK_state.s_transfer_acceptcall_sending.name},
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_monitorringing.name, to: SDK_state.s_monitor_acceptcall_sending.name},
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_interceptaltering.name, to: SDK_state.s_intercept_acceptcall_sending.name},
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_agentinsertringing.name, to: SDK_state.s_insert_acceptcall_sending.name},
    {name: SDK_action.acceptcall_handle.name, from: SDK_state.s_innerringing.name, to: SDK_state.s_in_acceptcall_sending.name},
    //接听失败
    {name: SDK_action.acceptcall_fail.name, from: SDK_state.s_out_acceptcall_sending.name, to: SDK_state.s_outringing.name},
    {name: SDK_action.acceptcall_fail.name, from: SDK_state.s_in_acceptcall_sending.name, to: SDK_state.s_inringing.name},
    {name: SDK_action.acceptcall_fail.name, from: SDK_state.s_consult_acceptcall_sending.name, to: SDK_state.s_consultinringing.name},
    {name: SDK_action.acceptcall_fail.name, from: SDK_state.s_transfer_acceptcall_sending.name, to: SDK_state.s_transferinringing.name},
    {name: SDK_action.acceptcall_fail.name, from: SDK_state.s_monitor_acceptcall_sending.name, to: SDK_state.s_monitorringing.name},
    {name: SDK_action.acceptcall_fail.name, from: SDK_state.s_intercept_acceptcall_sending.name, to: SDK_state.s_interceptaltering.name},
    {name: SDK_action.acceptcall_fail.name, from: SDK_state.s_insert_acceptcall_sending.name, to: SDK_state.s_agentinsertringing.name},
    //外呼
    {name: SDK_action.makecall_handle.name, from: SDK_state.s_idle.name, to: SDK_state.s_idle_makecall_sending.name},
    {name: SDK_action.makecall_handle.name, from: SDK_state.s_busy.name, to: SDK_state.s_busy_makecall_sending.name},
    {name: SDK_action.makecall.name, from: SDK_state.s_idle_makecall_sending.name, to: SDK_state.s_makecall.name},
    {name: SDK_action.makecall.name, from: SDK_state.s_busy_makecall_sending.name, to: SDK_state.s_makecall.name},
    {name: SDK_action.makecall_fail.name, from: SDK_state.s_idle_makecall_sending.name, to: SDK_state.s_idle.name},
    {name: SDK_action.makecall_fail.name, from: SDK_state.s_busy_makecall_sending.name, to: SDK_state.s_busy.name},
    //外呼时座席状态与被叫状态变更
    {name: SDK_action.outringing.name, from: SDK_state.s_makecall.name, to: SDK_state.s_outringing.name},
    {name: SDK_action.outringing.name, from: SDK_state.s_idle.name, to: SDK_state.s_outringing.name},
    {name: SDK_action.outcall.name, from: SDK_state.s_out_acceptcall_sending.name, to: SDK_state.s_outcall.name},
    {name: SDK_action.outcall.name, from: SDK_state.s_outringing.name, to: SDK_state.s_outcall.name},
    {name: SDK_action.calledringing.name, from: SDK_state.s_outcall.name, to: SDK_state.s_calledringing.name},
    {name: SDK_action.outboundcall.name, from: SDK_state.s_outringing.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.outboundcall.name, from: SDK_state.s_out_auto_consultationcalls.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.answer.name, from: SDK_state.s_calledringing.name, to: SDK_state.s_answer.name},
    {name: SDK_action.answer.name, from: SDK_state.s_out_consulationservice.name, to: SDK_state.s_answer.name},
    {name: SDK_action.answer.name, from: SDK_state.s_out_consultationcalls.name, to: SDK_state.s_answer.name},
    //呼入
    {name: SDK_action.inringing.name, from: SDK_state.s_idle.name, to: SDK_state.s_inringing.name},
    {name: SDK_action.inringing.name, from: SDK_state.s_login.name, to: SDK_state.s_inringing.name},//预测外呼登录时
    {name: SDK_action.playtts.name, from: SDK_state.s_in_acceptcall_sending.name, to: SDK_state.s_playtts.name},
    {name: SDK_action.playtts.name, from: SDK_state.s_inringing.name, to: SDK_state.s_playtts.name},
    {name: SDK_action.incall.name, from: SDK_state.s_in_acceptcall_sending.name, to: SDK_state.s_incall.name},
    {name: SDK_action.incall.name, from: SDK_state.s_playtts.name, to: SDK_state.s_incall.name},
    {name: SDK_action.incall.name, from: SDK_state.s_inringing.name, to: SDK_state.s_incall.name},
    {name: SDK_action.incall.name, from: SDK_state.s_in_consulationservice.name, to: SDK_state.s_incall.name},
    {name: SDK_action.incall.name, from: SDK_state.s_in_consultationcalls.name, to: SDK_state.s_incall.name},
    //内呼
    {name: SDK_action.innerringing.name, from: SDK_state.s_idle.name, to: SDK_state.s_innerringing.name},
    {name: SDK_action.innercall.name, from: SDK_state.s_in_acceptcall_sending.name, to: SDK_state.s_innercall.name},
    {name: SDK_action.innercall.name, from: SDK_state.s_innerringing.name, to: SDK_state.s_innercall.name},
    //被咨询来电
    {name: SDK_action.consultinringing.name, from: SDK_state.s_idle.name, to: SDK_state.s_consultinringing.name},
    {name: SDK_action.consultincall.name, from: SDK_state.s_consult_acceptcall_sending.name, to: SDK_state.s_consultincall.name},
    {name: SDK_action.consultincall.name, from: SDK_state.s_consultinringing.name, to: SDK_state.s_consultincall.name},
    //被转接来电
    {name: SDK_action.transferinringing.name, from: SDK_state.s_idle.name, to: SDK_state.s_transferinringing.name},
    {name: SDK_action.transferincall.name, from: SDK_state.s_transfer_acceptcall_sending.name, to: SDK_state.s_transferincall.name},
    {name: SDK_action.transferincall.name, from: SDK_state.s_transferinringing.name, to: SDK_state.s_transferincall.name},
    //请求挂断呼叫
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_makecall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_outringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_outcall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_calledringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_outboundcall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_inringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_playtts.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_transferinringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_consultinringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_consultincall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_sanfangcall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_transferincall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_monitorincall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_agentinsertincall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_interceptcall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_innerringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_innercall.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_monitorringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_interceptaltering.name, to: SDK_state.s_cancelmakecall_sending.name},
    {name: SDK_action.cancelmakecall_handle.name, from: SDK_state.s_agentinsertringing.name, to: SDK_state.s_cancelmakecall_sending.name},
    //挂断呼叫
    {name: SDK_action.cancelmakecall.name, from: SDK_state.s_cancelmakecall_sending.name, to: SDK_state.s_cancelmakecall.name},
    //保持
    {name: SDK_action.mute_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_out_mute_sending.name},
    {name: SDK_action.mute_handle.name, from: SDK_state.s_outboundcall.name, to: SDK_state.s_out_auto_mute_sending.name},
    {name: SDK_action.mute_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_in_mute_sending.name},
    //{name: SDK_action.mute_handle.name, from: SDK_state.s_transferincall.name, to: SDK_state.s_transferincall_mute_sending.name},
    {name: SDK_action.out_mute.name, from: SDK_state.s_out_mute_sending.name, to: SDK_state.s_out_mute.name},
    {name: SDK_action.out_auto_mute.name, from: SDK_state.s_out_auto_mute_sending.name, to: SDK_state.s_out_auto_mute.name},
    {name: SDK_action.in_mute.name, from: SDK_state.s_in_mute_sending.name, to: SDK_state.s_in_mute.name},

    //{name: SDK_action.out_mute.name, from: SDK_state.s_out_transfercall_mute_sending.name, to: SDK_state.s_out_transfercall_mute.name},
    //{name: SDK_action.in_mute.name, from: SDK_state.s_in_transfercall_mute_sending.name, to: SDK_state.s_in_transfercall_mute.name},
    //{name: SDK_action.in_mute.name, from: SDK_state.s_transferincall_mute_sending.name, to: SDK_state.s_transferincall_mute.name},
    {name: SDK_action.mute_fail.name, from: SDK_state.s_out_mute_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.mute_fail.name, from: SDK_state.s_out_auto_mute_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.mute_fail.name, from: SDK_state.s_in_mute_sending.name, to: SDK_state.s_incall.name},
    //{name: SDK_action.mute_fail.name, from: SDK_state.s_transferincall_mute_sending.name, to: SDK_state.s_transferincall.name},

    //取消保持
    {name: SDK_action.unmute_handle.name, from: SDK_state.s_out_mute.name, to: SDK_state.s_out_unmute_sending.name},
    {name: SDK_action.unmute_handle.name, from: SDK_state.s_out_auto_mute.name, to: SDK_state.s_out_auto_unmute_sending.name},
    {name: SDK_action.unmute_handle.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_in_unmute_sending.name},

    //{name: SDK_action.unmute_handle.name, from: SDK_state.s_out_transfercall_mute.name, to: SDK_state.s_out_transfercall_unmute_sending.name},
    //{name: SDK_action.unmute_handle.name, from: SDK_state.s_in_transfercall_mute.name, to: SDK_state.s_transfercall_unmute_sending.name},
    {name: SDK_action.out_unmute.name, from: SDK_state.s_out_unmute_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.out_auto_unmute.name, from: SDK_state.s_out_auto_unmute_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.in_unmute.name, from: SDK_state.s_in_unmute_sending.name, to: SDK_state.s_incall.name},
    //{name: SDK_action.in_unmute.name, from: SDK_state.s_transfercall_unmute_sending.name, to: SDK_state.s_in_transfercall.name},
    {name: SDK_action.unmute_fail.name, from: SDK_state.s_out_unmute_sending.name, to: SDK_state.s_out_mute.name},
    {name: SDK_action.unmute_fail.name, from: SDK_state.s_out_auto_unmute_sending.name, to: SDK_state.s_out_auto_mute.name},
    {name: SDK_action.unmute_fail.name, from: SDK_state.s_in_unmute_sending.name, to: SDK_state.s_in_mute.name},

    //{name: SDK_action.unmute_fail.name, from: SDK_state.s_out_transfercall_unmute_sending.name, to: SDK_state.s_out_transfercall_mute.name},
    //{name: SDK_action.unmute_fail.name, from: SDK_state.s_transfercall_unmute_sending.name, to: SDK_state.s_in_transfercall_mute.name},

    //咨询
    {name: SDK_action.agentconsult_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_out_agentconsult_sending.name},
    {name: SDK_action.agentconsult_handle.name, from: SDK_state.s_outboundcall.name, to: SDK_state.s_out_auto_agentconsult_sending.name},
    {name: SDK_action.agentconsult_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_in_agentconsult_sending.name},
    {name: SDK_action.agentconsult_handle.name, from: SDK_state.s_transferincall.name, to: SDK_state.s_transferincall_agentconsult_sending.name},
    {name: SDK_action.out_agentconsult.name, from: SDK_state.s_out_agentconsult_sending.name, to: SDK_state.s_out_agentconsult.name},
    {name: SDK_action.out_agentconsult.name, from: SDK_state.s_out_auto_agentconsult_sending.name, to: SDK_state.s_out_auto_agentconsult.name},
    {name: SDK_action.in_agentconsult.name, from: SDK_state.s_in_agentconsult_sending.name, to: SDK_state.s_in_agentconsult.name},
    {name: SDK_action.transferincall_agentconsult.name, from: SDK_state.s_transferincall_agentconsult_sending.name, to: SDK_state.s_transferincall_agentconsult.name},
    {name: SDK_action.out_consultationcalls.name, from: SDK_state.s_out_agentconsult.name, to: SDK_state.s_out_consultationcalls.name},
    {name: SDK_action.out_consultationcalls.name, from: SDK_state.s_out_auto_agentconsult.name, to: SDK_state.s_out_auto_consultationcalls.name},
    {name: SDK_action.in_consultationcalls.name, from: SDK_state.s_in_agentconsult.name, to: SDK_state.s_in_consultationcalls.name},
    //{name: SDK_action.transferincall_consultationcalls.name, from: SDK_state.s_transferincall_agentconsult.name, to: SDK_state.s_transferincall_consultationcalls.name},
    {name: SDK_action.agentconsult_fail.name, from: SDK_state.s_out_agentconsult_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.agentconsult_fail.name, from: SDK_state.s_in_agentconsult_sending.name, to: SDK_state.s_incall.name},
    {name: SDK_action.agentconsult_fail.name, from: SDK_state.s_transferincall_agentconsult_sending.name, to: SDK_state.s_transferincall.name},
    //取消咨询
    {name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_out_agentconsult.name, to: SDK_state.s_out_agentconsultback_sending.name},
    {name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_out_auto_agentconsult.name, to: SDK_state.s_out_auto_agentconsultback_sending.name},
    {name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_in_agentconsult.name, to: SDK_state.s_in_agentconsultback_sending.name},
    {name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_transferincall_agentconsult.name, to: SDK_state.s_transferincall_agentconsultback_sending.name},
    {name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_out_consultationcalls.name, to: SDK_state.s_out_agentconsultback_sending.name},
    {name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_out_auto_consultationcalls.name, to: SDK_state.s_out_auto_agentconsultback_sending.name},
    {name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_in_consultationcalls.name, to: SDK_state.s_in_agentconsultback_sending.name},
    //{name: SDK_action.agentconsultback_handle.name, from: SDK_state.s_transferincall_consultationcalls.name, to: SDK_state.s_transferincall_agentconsultback_sending.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_out_agentconsultback_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_out_auto_agentconsultback_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_in_agentconsultback_sending.name, to: SDK_state.s_incall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_transferincall_agentconsultback_sending.name, to: SDK_state.s_transferincall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_transferincall_agentconsult.name, to: SDK_state.s_transferincall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_out_agentconsult.name, to: SDK_state.s_answer.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_out_auto_agentconsult.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_in_agentconsult.name, to: SDK_state.s_incall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_out_consultationcalls.name, to: SDK_state.s_answer.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_out_auto_consultationcalls.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_in_consultationcalls.name, to: SDK_state.s_incall.name},
    {name: SDK_action.agentconsultback.name, from: SDK_state.s_transferincall_agentconsultback_sending.name, to: SDK_state.s_transferincall.name},
    //咨询转接
    {name: SDK_action.agentshift_handle.name, from: SDK_state.s_out_consultationcalls.name, to: SDK_state.s_out_agentshift_sending.name},
    {name: SDK_action.agentshift_handle.name, from: SDK_state.s_out_auto_consultationcalls.name, to: SDK_state.s_out_auto_agentshift_sending.name},
    {name: SDK_action.agentshift_handle.name, from: SDK_state.s_in_consultationcalls.name, to: SDK_state.s_in_agentshift_sending.name},

    //{name: SDK_action.agentshift_handle.name, from: SDK_state.s_transferincall_consultationcalls.name, to: SDK_state.s_transferincall_agentshift_sending.name},
    //{name: SDK_action.agentshift.name, from: SDK_state.s_transferincall_agentshift_sending.name, to: SDK_state.s_transferincall_agentshift.name},
    {name: SDK_action.agentshift_fail.name, from: SDK_state.s_out_agentshift_sending.name, to: SDK_state.s_out_consultationcalls.name},
    {name: SDK_action.agentshift_fail.name, from: SDK_state.s_out_auto_agentshift_sending.name, to: SDK_state.s_out_auto_consultationcalls.name},
    {name: SDK_action.agentshift_fail.name, from: SDK_state.s_in_agentshift_sending.name, to: SDK_state.s_in_consultationcalls.name},
    //{name: SDK_action.agentshift_fail.name, from: SDK_state.s_transferincall_agentshift_sending.name, to: SDK_state.s_transferincall_consultationcalls.name},

    //咨询服务
    {name: SDK_action.consulationservice_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_out_consulationservice_sending.name},
    {name: SDK_action.consulationservice_handle.name, from: SDK_state.s_outboundcall.name, to: SDK_state.s_out_auto_consulationservice_sending.name},
    {name: SDK_action.consulationservice_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_in_consulationservice_sending.name},
    {name: SDK_action.consulationservice.name, from: SDK_state.s_out_consulationservice_sending.name, to: SDK_state.s_out_consulationservice.name},
    {name: SDK_action.consulationservice.name, from: SDK_state.s_out_auto_consulationservice_sending.name, to: SDK_state.s_out_auto_consulationservice.name},
    {name: SDK_action.consulationservice.name, from: SDK_state.s_in_consulationservice_sending.name, to: SDK_state.s_in_consulationservice.name},
    {name: SDK_action.consulationservice_fail.name, from: SDK_state.s_out_consulationservice_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.consulationservice_fail.name, from: SDK_state.s_out_auto_consulationservice_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.consulationservice_fail.name, from: SDK_state.s_in_consulationservice_sending.name, to: SDK_state.s_incall.name},
    //三方
    {name: SDK_action.tripartitetalk_handle.name, from: SDK_state.s_out_consultationcalls.name, to: SDK_state.s_out_tripartitetalk_sending.name},
    {name: SDK_action.tripartitetalk_handle.name, from: SDK_state.s_out_auto_consultationcalls.name, to: SDK_state.s_out_auto_tripartitetalk_sending.name},
    {name: SDK_action.tripartitetalk_handle.name, from: SDK_state.s_in_consultationcalls.name, to: SDK_state.s_in_tripartitetalk_sending.name},
    //{name: SDK_action.tripartitetalk_handle.name, from: SDK_state.s_transferincall_consultationcalls.name, to: SDK_state.s_transferincall_tripartitetalk_sending.name},
    {name: SDK_action.tripartitetalk.name, from: SDK_state.s_out_tripartitetalk_sending.name, to: SDK_state.s_out_tripartitetalk.name},
    {name: SDK_action.tripartitetalk.name, from: SDK_state.s_out_auto_tripartitetalk_sending.name, to: SDK_state.s_out_auto_tripartitetalk.name},
    {name: SDK_action.tripartitetalk.name, from: SDK_state.s_in_tripartitetalk_sending.name, to: SDK_state.s_in_tripartitetalk.name},
    //{name: SDK_action.tripartitetalk.name, from: SDK_state.s_transferincall_tripartitetalk_sending.name, to: SDK_state.s_transferincall_tripartitetalk.name},
    {name: SDK_action.tripartitetalk.name, from: SDK_state.s_consultincall.name, to: SDK_state.s_in_tripartitetalk.name},
    {name: SDK_action.sanfangcall.name, from: SDK_state.s_consultincall.name, to: SDK_state.s_sanfangcall.name},
    {name: SDK_action.sanfangcall.name, from: SDK_state.s_out_tripartitetalk.name, to: SDK_state.s_sanfangcall.name},
    {name: SDK_action.sanfangcall.name, from: SDK_state.s_out_auto_tripartitetalk.name, to: SDK_state.s_sanfangcall.name},
    {name: SDK_action.sanfangcall.name, from: SDK_state.s_in_tripartitetalk.name, to: SDK_state.s_sanfangcall.name},
    //{name: SDK_action.sanfangcall.name, from: SDK_state.s_transferincall_tripartitetalk.name, to: SDK_state.s_sanfangcall.name},
    {name: SDK_action.tripartitetalk_fail.name, from: SDK_state.s_out_tripartitetalk_sending.name, to: SDK_state.s_out_consultationcalls.name},
    {name: SDK_action.tripartitetalk_fail.name, from: SDK_state.s_out_auto_tripartitetalk_sending.name, to: SDK_state.s_out_auto_consultationcalls.name},
    {name: SDK_action.tripartitetalk_fail.name, from: SDK_state.s_in_tripartitetalk_sending.name, to: SDK_state.s_in_consultationcalls.name},
    //{name: SDK_action.tripartitetalk_fail.name, from: SDK_state.s_transferincall_tripartitetalk.name, to: SDK_state.s_transferincall_consultationcalls.name},

    //转接
    {name: SDK_action.transfercall_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_out_transfercall_sending.name},
    {name: SDK_action.transfercall_handle.name, from: SDK_state.s_outboundcall.name, to: SDK_state.s_out_auto_transfercall_sending.name},
    {name: SDK_action.transfercall_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_in_transfercall_sending.name},
    {name: SDK_action.transfercall_handle.name, from: SDK_state.s_transferincall.name, to: SDK_state.s_transferincall_transfercall_sending.name},//转接通话到请求转接
    {name: SDK_action.transfergroup_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_out_transfergroup_sending.name},
    {name: SDK_action.transfergroup_handle.name, from: SDK_state.s_outboundcall.name, to: SDK_state.s_out_auto_transfergroup_sending.name},
    {name: SDK_action.transfergroup_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_in_transfergroup_sending.name},
    {name: SDK_action.transfergroup_handle.name, from: SDK_state.s_transferincall.name, to: SDK_state.s_transferincall_transfergroup_sending.name},//转接通话到请求转接
    {name: SDK_action.transfercall.name, from: SDK_state.s_out_transfercall_sending.name, to: SDK_state.s_out_transfercall.name},
    {name: SDK_action.transfercall.name, from: SDK_state.s_out_auto_transfercall_sending.name, to: SDK_state.s_out_auto_transfercall.name},
    {name: SDK_action.transfercall.name, from: SDK_state.s_in_transfercall_sending.name, to: SDK_state.s_in_transfercall.name},
    {name: SDK_action.transfercall.name, from: SDK_state.s_transferincall_transfercall_sending.name, to: SDK_state.s_transferincall_transfercall.name},
    {name: SDK_action.out_transfering.name, from: SDK_state.s_out_transfercall_sending.name, to: SDK_state.s_out_transfering.name},
    {name: SDK_action.out_transfering.name, from: SDK_state.s_out_transfercall.name, to: SDK_state.s_out_transfering.name},
    {name: SDK_action.out_transfering.name, from: SDK_state.s_out_auto_transfercall_sending.name, to: SDK_state.s_out_auto_transfering.name},
    {name: SDK_action.out_transfering.name, from: SDK_state.s_out_auto_transfercall.name, to: SDK_state.s_out_auto_transfering.name},
    {name: SDK_action.in_transfering.name, from: SDK_state.s_in_transfercall_sending.name, to: SDK_state.s_in_transfering.name},
    {name: SDK_action.in_transfering.name, from: SDK_state.s_in_transfercall.name, to: SDK_state.s_in_transfering.name},
    {name: SDK_action.transferincall_transfering.name, from: SDK_state.s_transferincall_transfercall.name, to: SDK_state.s_transferincall_transfering.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_out_transfercall_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_out_auto_transfercall_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_in_transfercall_sending.name, to: SDK_state.s_incall.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_transferincall_transfercall_sending.name, to: SDK_state.s_transferincall.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_out_transfering.name, to: SDK_state.s_answer.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_out_auto_transfering.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_in_transfering.name, to: SDK_state.s_incall.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_out_transfergroup_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_out_auto_transfergroup_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_in_transfergroup_sending.name, to: SDK_state.s_incall.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_transferincall_transfergroup_sending.name, to: SDK_state.s_transferincall.name},
    //转接服务
    {name: SDK_action.transferservice_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_out_transferservice_sending.name},
    {name: SDK_action.transferservice_handle.name, from: SDK_state.s_answer.name, to: SDK_state.s_out_auto_transferservice_sending.name},
    {name: SDK_action.transferservice_handle.name, from: SDK_state.s_incall.name, to: SDK_state.s_in_transferservice_sending.name},
    {name: SDK_action.transferservice_fail.name, from: SDK_state.s_out_transferservice_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.transferservice_fail.name, from: SDK_state.s_out_auto_transferservice_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.transferservice_fail.name, from: SDK_state.s_in_transferservice_sending.name, to: SDK_state.s_incall.name},
    //取消转接
    {name: SDK_action.canceltransfercall_handle.name, from: SDK_state.s_out_transfering.name, to: SDK_state.s_out_canceltransfercall_sending.name},
    {name: SDK_action.canceltransfercall_handle.name, from: SDK_state.s_out_auto_transfering.name, to: SDK_state.s_out_auto_canceltransfercall_sending.name},
    {name: SDK_action.canceltransfercall_handle.name, from: SDK_state.s_in_transfering.name, to: SDK_state.s_in_canceltransfercall_sending.name},
    {name: SDK_action.canceltransfercall_handle.name, from: SDK_state.s_transferincall_transfering.name, to: SDK_state.s_transferincall_canceltransfercall_sending.name},
    {name: SDK_action.canceltransfercall.name, from: SDK_state.s_out_canceltransfercall_sending.name, to: SDK_state.s_answer.name},
    {name: SDK_action.canceltransfercall.name, from: SDK_state.s_out_auto_canceltransfercall_sending.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.canceltransfercall.name, from: SDK_state.s_in_canceltransfercall_sending.name, to: SDK_state.s_incall.name},
    {name: SDK_action.canceltransfercall.name, from: SDK_state.s_transferincall_canceltransfercall_sending.name, to: SDK_state.s_transferincall.name},
    //强制示闲
    {name: SDK_action.forceidle.name, from: SDK_state.s_login.name, to: SDK_state.s_idle.name},
    {name: SDK_action.forceidle.name, from: SDK_state.s_busy.name, to: SDK_state.s_idle.name},
    {name: SDK_action.forceidle.name, from: SDK_state.s_after.name, to: SDK_state.s_idle.name},
    //强制示忙
    {name: SDK_action.forcebusy.name, from: SDK_state.s_login.name, to: SDK_state.s_busy.name},
    {name: SDK_action.forcebusy.name, from: SDK_state.s_idle.name, to: SDK_state.s_busy.name},
    {name: SDK_action.forcebusy.name, from: SDK_state.s_after.name, to: SDK_state.s_busy.name},
    //强拆
    {name: SDK_action.agentbreak.name, from: SDK_state.s_answer.name, to: SDK_state.s_after.name},
    {name: SDK_action.agentbreak.name, from: SDK_state.s_outboundcall.name, to: SDK_state.s_after.name},
    {name: SDK_action.agentbreak.name, from: SDK_state.s_incall.name, to: SDK_state.s_after.name},
    {name: SDK_action.agentbreak.name, from: SDK_state.s_out_agentconsult.name, to: SDK_state.s_after.name},
    {name: SDK_action.agentbreak.name, from: SDK_state.s_out_auto_agentconsult.name, to: SDK_state.s_after.name},
    {name: SDK_action.agentbreak.name, from: SDK_state.s_in_agentconsult.name, to: SDK_state.s_after.name},
    {name: SDK_action.agentbreak.name, from: SDK_state.s_sanfangcall.name, to: SDK_state.s_after.name},
    //强制签出
    {name: SDK_action.forcelogout.name, from: "*", to: SDK_state.s_logout.name},
    //监听
    {name: SDK_action.monitor_handle.name, from: SDK_state.s_idle.name, to: SDK_state.s_monitor_idle_sending.name},
    {name: SDK_action.monitor_handle.name, from: SDK_state.s_busy.name, to: SDK_state.s_monitor_busy_sending.name},
    {name: SDK_action.monitor_fail.name, from: SDK_state.s_monitor_idle_sending.name, to: SDK_state.s_idle.name},
    {name: SDK_action.monitor_fail.name, from: SDK_state.s_monitor_busy_sending.name, to: SDK_state.s_busy.name},
    {name: SDK_action.monitor.name, from: SDK_state.s_monitor_idle_sending.name, to: SDK_state.s_monitor.name},
    {name: SDK_action.monitor.name, from: SDK_state.s_monitor_busy_sending.name, to: SDK_state.s_monitor.name},
    {name: SDK_action.monitorringing.name, from: SDK_state.s_monitor.name, to: SDK_state.s_monitorringing.name},
    {name: SDK_action.monitorincall.name, from: SDK_state.s_monitor_acceptcall_sending.name, to: SDK_state.s_monitorincall.name},
    {name: SDK_action.monitorincall.name, from: SDK_state.s_monitorringing.name, to: SDK_state.s_monitorincall.name},
    //强插
    {name: SDK_action.agentinsert_handle.name, from: SDK_state.s_idle.name, to: SDK_state.s_agentinsert_idle_sending.name},
    {name: SDK_action.agentinsert_handle.name, from: SDK_state.s_busy.name, to: SDK_state.s_agentinsert_busy_sending.name},
    //{name: SDK_action.agentinsert_handle.name, from: SDK_state.s_monitorincall.name, to: SDK_state.s_agentinsert_monitorincall_sending.name},
    {name: SDK_action.agentinsert_fail.name, from: SDK_state.s_agentinsert_idle_sending.name, to: SDK_state.s_idle.name},
    {name: SDK_action.agentinsert_fail.name, from: SDK_state.s_agentinsert_busy_sending.name, to: SDK_state.s_busy.name},
    {name: SDK_action.agentinsert_fail.name, from: SDK_state.s_agentinsert_monitorincall_sending.name, to: SDK_state.s_monitorincall.name},
    {name: SDK_action.agentinsert.name, from: SDK_state.s_agentinsert_idle_sending.name, to: SDK_state.s_agentinsert.name},
    {name: SDK_action.agentinsert.name, from: SDK_state.s_agentinsert_busy_sending.name, to: SDK_state.s_agentinsert.name},
    {name: SDK_action.agentinsert.name, from: SDK_state.s_agentinsert_monitorincall_sending.name, to: SDK_state.s_agentinsert.name},
    {name: SDK_action.agentinsertringing.name, from: SDK_state.s_agentinsert.name, to: SDK_state.s_agentinsertringing.name},
    {name: SDK_action.agentinsertincall.name, from: SDK_state.s_insert_acceptcall_sending.name, to: SDK_state.s_agentinsertincall.name},
    {name: SDK_action.agentinsertincall.name, from: SDK_state.s_agentinsertringing.name, to: SDK_state.s_agentinsertincall.name},
    //拦截
    {name: SDK_action.agentinterceptcall_handle.name, from: SDK_state.s_idle.name, to: SDK_state.s_agentinterceptcall_idle_sending.name},
    {name: SDK_action.agentinterceptcall_handle.name, from: SDK_state.s_busy.name, to: SDK_state.s_agentinterceptcall_busy_sending.name},
    {name: SDK_action.agentinterceptcall_handle.name, from: SDK_state.s_agentinsertincall.name, to: SDK_state.s_agentinterceptcall_agentinsertincall_sending.name},
    {name: SDK_action.agentinterceptcall_fail.name, from: SDK_state.s_agentinterceptcall_idle_sending.name, to: SDK_state.s_idle.name},
    {name: SDK_action.agentinterceptcall_fail.name, from: SDK_state.s_agentinterceptcall_busy_sending.name, to: SDK_state.s_busy.name},
    {name: SDK_action.agentinterceptcall_fail.name, from: SDK_state.s_agentinterceptcall_agentinsertincall_sending.name, to: SDK_state.s_agentinsertincall.name},
    {name: SDK_action.agentinterceptcall.name, from: SDK_state.s_agentinterceptcall_idle_sending.name, to: SDK_state.s_agentinterceptcall.name},
    {name: SDK_action.agentinterceptcall.name, from: SDK_state.s_agentinterceptcall_busy_sending.name, to: SDK_state.s_agentinterceptcall.name},
    {name: SDK_action.agentinterceptcall.name, from: SDK_state.s_agentinterceptcall_agentinsertincall_sending.name, to: SDK_state.s_agentinterceptcall.name},
    {name: SDK_action.intercept.name, from: SDK_state.s_agentinterceptcall_idle_sending.name, to: SDK_state.s_intercept.name},
    {name: SDK_action.intercept.name, from: SDK_state.s_agentinterceptcall_busy_sending.name, to: SDK_state.s_intercept.name},
    {name: SDK_action.intercept.name, from: SDK_state.s_agentinterceptcall_agentinsertincall_sending.name, to: SDK_state.s_intercept.name},
    {name: SDK_action.interceptaltering.name, from: SDK_state.s_intercept.name, to: SDK_state.s_interceptaltering.name},
    {name: SDK_action.interceptcall.name, from: SDK_state.s_interceptaltering.name, to: SDK_state.s_intercept_acceptcall_sending.name},
    {name: SDK_action.interceptcall.name, from: SDK_state.s_intercept_acceptcall_sending.name, to: SDK_state.s_interceptcall.name},
    {name: SDK_action.interceptcall.name, from: SDK_state.s_interceptaltering.name, to: SDK_state.s_interceptcall.name},
    //siperror
    {name: SDK_action.siperror.name, from: SDK_state.s_login.name, to: SDK_state.s_siperror.name},
    {name: SDK_action.siperror.name, from: SDK_state.s_idle.name, to: SDK_state.s_siperror.name},
    {name: SDK_action.siperror.name, from: SDK_state.s_busy.name, to: SDK_state.s_siperror.name},
    //话后
    {name: SDK_action.after.name, from: "*", to: SDK_state.s_after.name},
    //断开连接
    {name: SDK_action.disconnect.name, from: "*", to: SDK_state.s_disconnect.name},
    //重新连接
    {name: SDK_action.reconnection_handle.name, from: SDK_state.s_nologin.name, to: SDK_state.s_reconnection_sending.name},
    {name: SDK_action.reconnection_handle.name, from: SDK_state.s_disconnect.name, to: SDK_state.s_reconnection_sending.name},
    {name: SDK_action.reconnection.name, from: SDK_state.s_reconnection_sending.name, to: SDK_state.s_reconnection.name},
    {name: SDK_action.reconnection_fail.name, from: SDK_state.s_reconnection_sending.name, to: SDK_state.s_reconnection_fail.name},

    //各种事件的重新连接
    {name: SDK_action.agentidle_handle.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_idle_sending.name},
    {name: SDK_action.agentbusy_handle.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_busy_sending.name},
    {name: SDK_action.agentidle.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_idle.name},
    {name: SDK_action.agentbusy.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_busy.name},
    {name: SDK_action.makecall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_makecall.name},
    {name: SDK_action.outringing.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_outringing.name},
    {name: SDK_action.outcall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_outcall.name},
    {name: SDK_action.calledringing.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_calledringing.name},
    {name: SDK_action.outboundcall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_outboundcall.name},
    {name: SDK_action.answer.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_answer.name},
    {name: SDK_action.inringing.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_inringing.name},
    {name: SDK_action.playtts.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_playtts.name},
    {name: SDK_action.incall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_incall.name},
    {name: SDK_action.innerringing.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_innerringing.name},
    {name: SDK_action.innercall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_innercall.name},
    {name: SDK_action.consultinringing.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_consultinringing.name},
    {name: SDK_action.consultincall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_consultincall.name},
    {name: SDK_action.transferinringing.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_transferinringing.name},
    {name: SDK_action.transferincall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_transferincall.name},
    {name: SDK_action.cancelmakecall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_cancelmakecall.name},
    {name: SDK_action.out_mute.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_out_mute.name},
    {name: SDK_action.out_auto_mute.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_out_auto_mute.name},
    {name: SDK_action.in_mute.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_in_mute.name},
    {name: SDK_action.out_agentconsult.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_out_agentconsult.name},
    {name: SDK_action.in_agentconsult.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_in_agentconsult.name},
    {name: SDK_action.out_consultationcalls.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_out_consultationcalls.name},
    {name: SDK_action.in_consultationcalls.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_in_consultationcalls.name},
    {name: SDK_action.transferincall_agentconsult.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_transferincall_agentconsult.name},
    {name: SDK_action.sanfangcall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_sanfangcall.name},
    {name: SDK_action.out_transfering.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_out_transfering.name},
    {name: SDK_action.in_transfering.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_in_transfering.name},
    {name: SDK_action.transferincall_transfering.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_transferincall_transfering.name},
    {name: SDK_action.monitor.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_monitor.name},
    {name: SDK_action.monitorincall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_monitorincall.name},
    {name: SDK_action.agentinsert.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_agentinsert.name},
    {name: SDK_action.agentinsertincall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_agentinsertincall.name},
    {name: SDK_action.agentinterceptcall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_intercept.name},
    {name: SDK_action.interceptcall.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_interceptcall.name},
    {name: SDK_action.interceptaltering.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_interceptaltering.name},
    {name: SDK_action.siperror.name, from: SDK_state.s_reconnection.name, to: SDK_state.s_siperror.name},

    //CTI版本独有的状态变化
    {name: SDK_action.in_mute.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_incall.name},
    {name: SDK_action.in_mute.name, from: SDK_state.s_in_agentconsult_sending.name, to: SDK_state.s_in_mute.name},
    {name: SDK_action.in_mute.name, from: SDK_state.s_in_consulationservice_sending.name, to: SDK_state.s_in_mute.name},
    {name: SDK_action.in_mute.name, from: SDK_state.s_in_transfercall_sending.name, to: SDK_state.s_in_mute.name},
    {name: SDK_action.in_mute.name, from: SDK_state.s_in_transferservice_sending.name, to: SDK_state.s_in_mute.name},
    {name: SDK_action.in_unmute.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_incall.name},
    {name: SDK_action.in_agentconsult.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_in_agentconsult.name},
    {name: SDK_action.agentconsult_fail.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_incall.name},
    {name: SDK_action.consulationservice.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_in_consulationservice.name},
    {name: SDK_action.consulationservice_fail.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_incall.name},
    {name: SDK_action.in_transfering.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_in_transfering.name},
    {name: SDK_action.transfercall_fail.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_incall.name},
    {name: SDK_action.transferservice_fail.name, from: SDK_state.s_in_mute.name, to: SDK_state.s_incall.name}
];

var CallCenterStatus = CallCenterStateMachine.create({
    initial: SDK_state.s_nologin.name,
    events: SDK_events,
    callbacks: {
        //onbeforeevent:function(){},//在任何行为发生之前触发
        onleavestate: function (name, from, to, args) {//在要改变对象状态时触发
            CallCenter.log('leave from:' + from + " to:" + to);
        },
        //onenterstate: function (name, from, to, args) {//在把当前状态设置为新状态时触发
        //    CallCenter.log('enter from:' + from + " to:" + to);
        //},
        //onafterevent: function (name, from, to, args) {//在任何行为发生之后触发
        //    CallCenter.log('after from:' + from + " to:" + to);
        //},
        //onbeforeXX 进入XX行为   允许return false取消
        //onleaveXX 离开XX状态   允许return false取消，允许回调中return StateMachine.ASYNC来执行异步的行为，通过CallCenterStatus.transition()通知成功  CallCenterStatus.cancel()通知取消
        //onenterXX 进入XX状态
        //onafterXX 离开XX行为
        /**
         * 验证失败
         * @param event
         * @param from
         * @param to
         */
        onbeforeAuthfail: function (event, from, to) {
            CallCenter.setOrgClass().setStatusAndPhoneText("登录失败").clearConnection();
        },
        /**
         * 掉线
         * @param event
         * @param from
         * @param to
         */
        onbeforeDisconnect: function (event, from, to) {
            CallCenter.initControl().setStatusAndPhoneText("连接断开，重连中").log("CallCenter消息：连接断开，准备重连");
            setTimeout(function () {
                CallCenter.init();
            }, 1000);//断线重连
        },
        /**
         * 退出登录
         * @param event
         * @param from
         * @param to
         */
        onbeforeForcelogout: function (event, from, to) {
            CallCenter._islogin = false;
            CallCenter.setOrgClass().setStatusAndPhoneText("被强制签出").clearConnection();
        },
        /**
         * 咨询失败
         * @param event
         * @param from
         * @param to
         */
        onbeforeAgentconsult_fail: function (event, from, to) {
            CallCenter.eventAlert("咨询失败");
        },
        /**
         * 转接失败
         * @param event
         * @param from
         * @param to
         */
        onbeforeTransfercall_fail: function (event, from, to) {
            CallCenter.eventAlert("转接失败");
        },
        /**
         * 进入未登录状态
         * @param event
         * @param from
         * @param to
         */
        onenterNologin: function (event, from, to) {
            CallCenter.clearConnection();
        },
        /**
         * 重复登录
         * @param event
         * @param from
         * @param to
         */
        onenterKick: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("另一设备登录").clearConnection();
        },
        /**
         * 发送登录
         * @param event
         * @param from
         * @param to
         */
        onenterLogin_sending: function (event, from, to) {
            var sendobj = new CallCenter._sendcmd("logon");
            sendobj.operatorid = CallCenter._operatorid;             //工号
            sendobj.password = CallCenter._password;                 //密码
            sendobj.abbreviate = CallCenter._abbreviate;             //公司简称
            sendobj.worktype = CallCenter._logintype;                //登录类型,0手机,1sip话机,2软话机
            sendobj.companyid = CallCenter._companyid;              //公司编号
            sendobj.auto = CallCenter._auto;                         //登录方式，0普通1预测
            sendobj.logingroups = CallCenter._logingroups;          //登录到的技能组。登录方式为预测式生效
            CallCenter.send(sendobj);
            CallCenter.setStatusAndPhoneText("请求登录");
        },
        /**
         * 登录成功
         * @param event
         * @param from
         * @param to
         */
        onenterLogin: function (event, from, to) {
            CallCenter._islogin = true;
            CallCenter._nowStatus = "logon";
            if (CallCenter._auto == 1) {
                CallCenter.setStatusAndPhoneText("等待话机接通");
            } else {
                CallCenter.initControl().setGreenClass().setStatusAndPhoneText("登录成功");
                jQuery("#CallCenter_status_tiao").unbind("click").bind("click", function () {
                    /*空闲，忙碌，切换*/
                    if (jQuery("#CallCenter_status_buts").css("display") == "none") {
                        if (jQuery("#CallCenter_free").css("display") == "list-item" || jQuery("#CallCenter_busy").css("display") == "list-item") {
                            CallCenter.showControl("#CallCenter_status_buts");
                        }
                    } else {
                        CallCenter.hideControl("#CallCenter_status_buts");
                    }
                })
                CallCenter.showControl("#CallCenter_status_buts,#CallCenter_free,.CallCenter_busy");
            }
        },
        /**
         * 发送退出
         * @param event
         * @param from
         * @param to
         */
        onenterLogout_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求登出");
            CallCenter.log("CallCenter消息：请求登出");
            var sendobj = new CallCenter._sendcmd("logout");
            CallCenter.send(sendobj);

        },
        /**
         * 退出成功
         * @param event
         * @param from
         * @param to
         */
        onenterLogout: function (event, from, to) {
            CallCenter.setlocalstorage("refreshReconnection", 0);
            CallCenter.initControl().setStatusAndPhoneText("已经登出").clearConnection();
        },
        /**
         * 发送重新连接
         * @param event
         * @param from
         * @param to
         */
        onenterReconnection_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求重新连接").log("CallCenter消息：请求重新连接");
            var sendobj = new CallCenter._sendcmd("reconnection");
            sendobj.companyid = CallCenter._companyid;              //公司编号
            sendobj.agentkey = CallCenter._operatorid + "@" + CallCenter._abbreviate;
            CallCenter.send(sendobj);
        },
        /**
         * 发送空闲
         * @param event
         * @param from
         * @param to
         */
        onenterIdle_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求空闲");
            var sendobj = new CallCenter._sendcmd("agentidle");
            CallCenter.send(sendobj);
        },
        /**
         * 空闲
         * @param event
         * @param from
         * @param to
         */
        onenterIdle: function (event, from, to) {
            CallCenter._nowStatus = "agentidle";
            CallCenter.initControl().setGreenClass().setStatusAndPhoneText(CallCenter._defaultIdleText);
            if (CallCenter._auto == 1) {//预测外呼
                CallCenter.showControl(".CallCenter_busy");
            } else {
                CallCenter.showControl(".CallCenter_busy,#CallCenter_calloutbut,#CallCenter_innercall");
            }
            CallCenter.hideControl('#CallCenter_status_buts');
        },
        /**
         * 空闲失败
         * @param event
         * @param from
         * @param to
         */
        onenterIdle_fail: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText(CallCenter._defaultIdleText + "失败");
            if (CallCenter._auto == 1) {//预测外呼
                CallCenter.showControl("#CallCenter_free");
            } else {
                CallCenter.showControl("#CallCenter_free,#CallCenter_calloutbut");
            }
            CallCenter.hideControl('#CallCenter_status_buts');
        },
        /**
         * 发送忙碌
         * @param event
         * @param from
         * @param to
         * @param busydescr
         */
        onenterBusy_sending: function (event, from, to, busydescr) {
            CallCenter.setStatusAndPhoneText("请求忙碌");
            if (!busydescr) {
                busydescr = 0;
            }
            CallCenter._busyType = busydescr;
            var sendobj = new CallCenter._sendcmd("agentbusy");
            sendobj.busydescr = busydescr;
            CallCenter.send(sendobj);
        },
        /**
         * 忙碌
         * @param event
         * @param from
         * @param to
         */
        onenterBusy: function (event, from, to) {
            CallCenter._nowStatus = "agentbusy";
            var showText = CallCenter._busyTypeMap.get(CallCenter._busyType);
            if (!showText) {
                showText = CallCenter._defaultBusyText;
            }
            CallCenter.initControl().setOrgClass().showControl("#CallCenter_free").setStatusAndPhoneText(showText).hideControl('#CallCenter_status_buts');
        },
        /**
         * 来电接听
         * @param event
         * @param from
         * @param to
         */
        onenterIn_acceptcall_sending: function (event, from, to) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求接听").handle_acceptcall();
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_in_acceptcall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("接听失败");
                    CallCenterStatus.acceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 外呼接听
         * @param event
         * @param from
         * @param to
         */
        onenterOut_acceptcall_sending: function (event, from, to) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求接听").handle_acceptcall();
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_out_acceptcall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("接听失败");
                    CallCenterStatus.acceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 咨询接听
         * @param event
         * @param from
         * @param to
         */
        onenterConsult_acceptcall_sending: function (event, from, to) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求接听").handle_acceptcall();
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_consult_acceptcall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("接听失败");
                    CallCenterStatus.acceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 转接接听
         * @param event
         * @param from
         * @param to
         */
        onenterTransfer_acceptcall_sending: function (event, from, to) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求接听").handle_acceptcall();
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_transfer_acceptcall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("接听失败");
                    CallCenterStatus.acceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 监听接听
         * @param event
         * @param from
         * @param to
         */
        onenterMonitor_acceptcall_sending: function (event, from, to) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求接听").handle_acceptcall();
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_monitor_acceptcall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("接听失败");
                    CallCenterStatus.acceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 拦截接听
         * @param event
         * @param from
         * @param to
         */
        onenterIntercept_acceptcall_sending: function (event, from, to) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求接听").handle_acceptcall();
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_intercept_acceptcall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("接听失败");
                    CallCenterStatus.acceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 强插接听
         * @param event
         * @param from
         * @param to
         */
        onenterInsert_acceptcall_sending: function (event, from, to) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求接听").handle_acceptcall();
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_insert_acceptcall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("接听失败");
                    CallCenterStatus.acceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 空闲时外呼
         * @param event
         * @param from
         * @param to
         * @param called
         * @param caller
         * @param preview
         */
        onenterIdle_makecall_sending: function (event, from, to, called, caller, preview) {
            CallCenter.handle_makecall(called, caller, preview);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_idle_makecall_sending.name)) {//5秒后状态没有变化，监听失败
                    CallCenter.eventAlert("请求外呼超时");
                    CallCenterStatus.makecall_fail();
                }
            }, 5000);
        },
        /**
         * 忙碌时外呼
         * @param event
         * @param from
         * @param to
         * @param called
         * @param caller
         * @param preview
         */
        onenterBusy_makecall_sending: function (event, from, to, called, caller, preview) {
            CallCenter.handle_makecall(called, caller, preview);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_busy_makecall_sending.name)) {//5秒后状态没有变化，监听失败
                    CallCenter.eventAlert("请求外呼超时");
                    CallCenterStatus.makecall_fail();
                }
            }, 5000);
        },
        /**
         * 外呼成功
         * @param event
         * @param from
         * @param to
         */
        onenterMakecall: function (event, from, to) {
            CallCenter.initControl().setStatusAndPhoneText("呼叫中").setOrgClass().showControl("#CallCenter_phonenum");
            CallCenter._isCallout = true;
            CallCenter._calling = true;
            CallCenter._calling_from = "makecall";
        },
        /**
         * 外呼失败
         * @param event
         * @param from
         * @param to
         * @param reason
         */
        onbeforeMakecall_fail: function (event, from, to, reason) {
            CallCenter.initControl().setStatusAndPhoneText("外呼失败").showControl(".CallCenter_busy").eventAlert(reason);
            if (!CallCenter.isAuto() && CallCenter.getNowStatus() == "agentidle") {
                CallCenter.showControl("#CallCenter_calloutbut");
            }
            CallCenter._isCallout = false;
            CallCenter._calling = false;
        },
        /**
         * 发送取消外呼
         * @param event
         * @param from
         * @param to
         */
        onenterCancelmakecall_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求取消呼叫");
            var sendobj = new CallCenter._sendcmd("cancelmakecall");
            sendobj.agentoperatorid = CallCenter._operatorid;
            CallCenter.send(sendobj);
        },
        /**
         * 外呼座席振铃
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         */
        onenterOutringing: function (event, from, to, callid, timestamp, caller, called) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            CallCenter._isCallout = true;
            CallCenter._callingtimer = 0;
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("座席振铃").showControl("#CallCenter_hangupbut");
            if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                CallCenter.showControl("#CallCenter_answer");
            }
        },
        /**
         * 外呼接通座席
         * @param event
         * @param from
         * @param to
         * @param number
         */
        onenterOutcall: function (event, from, to, number) {
            CallCenter._called = number || CallCenter._called;
            CallCenter._callingtimer = 0;
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("接通座席").showControl("#CallCenter_hangupbut");
        },
        /**
         * 外呼被叫振铃
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         */
        onenterCalledringing: function (event, from, to, callid, timestamp, caller, called) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            CallCenter._callingtimer = 0;
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("被叫振铃").showControl("#CallCenter_hangupbut,#CallCenter_phonenum");
        },
        /**
         * 预测外呼接通被叫
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         */
        onenterOutboundcall: function (event, from, to, callid, timestamp, caller, called) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            CallCenter._callingtimer = 0;
            CallCenter._isCallout = true;
            CallCenter._calling = true;
            CallCenter.initControl().setGreenClass().setStatusAndPhoneText("通话中").showCallingControl();
        },
        /**
         * 外呼接通被叫
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         */
        onenterAnswer: function (event, from, to, callid, timestamp, caller, called) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            CallCenter._callingtimer = 0;
            CallCenter._calling = true;
            CallCenter._isCallout = true;
            CallCenter.initControl().setGreenClass().setStatusAndPhoneText("通话中").showCallingControl();
            if (CallCenter._isInnercall) {
                CallCenter.hideControl("#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
            }
        },
        /**
         * 外呼接通时发送保持
         * @param event
         * @param from
         * @param to
         */
        onenterOut_mute_sending: function (event, from, to) {
            CallCenter.handle_mute();
        },
        /**
         * 预测外呼接通时发送保持
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_mute_sending: function (event, from, to) {
            CallCenter.handle_mute();
        },
        /**
         * 呼入接通时保持
         * @param event
         * @param from
         * @param to
         */
        onenterIn_mute_sending: function (event, from, to) {
            CallCenter.handle_mute();
        },
        /**
         * 转接来电保持
         * @param event
         * @param from
         * @param to
         */
        onenterIn_transfercall_mute_sending: function (event, from, to) {
            CallCenter.handle_mute();
        },
        /**
         * 转接接通保持
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_mute_sending: function (event, from, to) {
            CallCenter.handle_mute();
        },
        /**
         * 外呼接通保持
         * @param event
         * @param from
         * @param to
         */
        onenterOut_mute: function (event, from, to) {
            CallCenter.event_mute();
        },
        /**
         * 呼入接通保持
         * @param event
         * @param from
         * @param to
         */
        onenterIn_mute: function (event, from, to) {
            CallCenter.event_mute();
        },
        /**
         * 预测外呼接通保持
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_mute: function (event, from, to) {
            CallCenter.event_mute();
        },
        /**
         * 外呼接通发送取消保持
         * @param event
         * @param from
         * @param to
         */
        onenterOut_unmute_sending: function (event, from, to) {
            CallCenter.handle_unmute();
        },
        /**
         * 预测外呼接通发送取消保持
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_unmute_sending: function (event, from, to) {
            CallCenter.handle_unmute();
        },
        /**
         * 呼入接通发送取消保持
         * @param event
         * @param from
         * @param to
         */
        onenterIn_unmute_sending: function (event, from, to) {
            CallCenter.handle_unmute();
        },
        /**
         * 转接来电发送取消保持
         * @param event
         * @param from
         * @param to
         */
        onenterTtransfercall_unmute_sending: function (event, from, to) {
            CallCenter.handle_unmute();
        },
        /**
         * 转接接通发送取消保持
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_unmute_sending: function (event, from, to) {
            CallCenter.handle_unmute();
        },
        /**
         * 外呼接通发送咨询
         * @param event
         * @param from
         * @param to
         * @param number
         * @param userdata
         */
        onenterOut_agentconsult_sending: function (event, from, to, number, userdata) {
            CallCenter.handle_agentconsult(number, userdata);
        },
        /**
         * 外呼接通发送咨询
         * @param event
         * @param from
         * @param to
         * @param number
         * @param userdata
         */
        onenterOut_auto_agentconsult_sending: function (event, from, to, number, userdata) {
            CallCenter.handle_agentconsult(number, userdata);
        },
        /**
         * 呼入接通发送咨询
         * @param event
         * @param from
         * @param to
         * @param number
         * @param userdata
         */
        onenterIn_agentconsult_sending: function (event, from, to, number, userdata) {
            CallCenter.handle_agentconsult(number, userdata);
        },
        /**
         * 转接来电发送咨询
         * @param event
         * @param from
         * @param to
         * @param number
         * @param userdata
         */
        onenterTransferincall_agentconsult_sending: function (event, from, to, number, userdata) {
            CallCenter.handle_agentconsult(number, userdata);
        },
        /**
         * 外呼时咨询中
         * @param event
         * @param from
         * @param to
         */
        onenterOut_agentconsult: function (event, from, to) {
            CallCenter.event_agentconsult();
        },
        /**
         * 外呼时咨询中
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_agentconsult: function (event, from, to) {
            CallCenter.event_agentconsult();
        },
        /**
         * 呼入时咨询中
         * @param event
         * @param from
         * @param to
         */
        onenterIn_agentconsult: function (event, from, to) {
            CallCenter.event_agentconsult();
        },
        /**
         * 转接通话咨询中
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_agentconsult: function (event, from, to) {
            CallCenter.event_agentconsult();
        },
        /**
         * 外呼通话时咨询接通
         * @param event
         * @param from
         * @param to
         */
        onenterOut_consultationcalls: function (event, from, to) {
            CallCenter.event_consultationcalls();
        },
        /**
         * 外呼通话时咨询接通
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_consultationcalls: function (event, from, to) {
            CallCenter.event_consultationcalls();
        },
        /**
         * 来电通话时咨询接通
         * @param event
         * @param from
         * @param to
         */
        onenterIn_consultationcalls: function (event, from, to) {
            CallCenter.event_consultationcalls();
        },
        /**
         * 转接通话时咨询接通
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_consultationcalls: function (event, from, to) {
            CallCenter.event_consultationcalls();
        },
        /**
         * 外呼时发送取消咨询
         * @param event
         * @param from
         * @param to
         */
        onenterOut_agentconsultback_sending: function (event, from, to) {
            CallCenter.handle_agentconsultabck();
        },
        /**
         * 外呼时发送取消咨询
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_agentconsultback_sending: function (event, from, to) {
            CallCenter.handle_agentconsultabck();
        },
        /**
         * 呼入时发送取消咨询
         * @param event
         * @param from
         * @param to
         */
        onenterIn_agentconsultback_sending: function (event, from, to) {
            CallCenter.handle_agentconsultabck();
        },
        /**
         * 转接接通后发送取消咨询
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_agentconsultback_sending: function (event, from, to) {
            CallCenter.handle_agentconsultabck();
        },
        /**
         * 外呼时发送咨询服务
         * @param event
         * @param from
         * @param to
         * @param filename
         * @param groupid
         * @param userdata
         */
        onenterOut_consulationservice_sending: function (event, from, to, filename, groupid, userdata, num) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求咨询服务")
                .handle_consulationservice(filename, groupid, userdata, num);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_out_consulationservice_sending.name)) {
                    CallCenterStatus.consulationservice_fail();
                    CallCenter.eventAlert("咨询服务失败");
                }
            }, 5000);
        },
        /**
         * 外呼时发送咨询服务
         * @param event
         * @param from
         * @param to
         * @param filename
         * @param groupid
         * @param userdata
         */
        onenterOut_auto_consulationservice_sending: function (event, from, to, filename, groupid, userdata, num) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求咨询服务")
                .handle_consulationservice(filename, groupid, userdata, num);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_out_auto_consulationservice_sending.name)) {
                    CallCenterStatus.consulationservice_fail();
                    CallCenter.eventAlert("咨询服务失败");
                }
            }, 5000);
        },
        /**
         * 呼入时发送咨询服务
         * @param event
         * @param from
         * @param to
         * @param filename
         * @param groupid
         * @param userdata
         */
        onenterIn_consulationservice_sending: function (event, from, to, filename, groupid, userdata, num) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求咨询服务")
                .handle_consulationservice(filename, groupid, userdata, num);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_in_consulationservice_sending.name)) {
                    CallCenterStatus.consulationservice_fail();
                    CallCenter.eventAlert("咨询服务失败");
                }
            }, 5000);
        },
        /**
         * 外呼时咨询服务
         * @param event
         * @param from
         * @param to
         */
        onenterOut_consulationservice: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("咨询服务");
        },
        /**
         * 外呼时咨询服务
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_consulationservice: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("咨询服务");
        },
        /**
         * 呼入时咨询服务
         * @param event
         * @param from
         * @param to
         */
        onenterIn_consulationservice: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("咨询服务");
        },
        /**
         * 外呼时咨询转接
         * @param event
         * @param from
         * @param to
         */
        onenterOut_agentshift_sending: function (event, from, to) {
            CallCenter.handle_agentshift();
        },
        /**
         * 外呼时咨询转接
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_agentshift_sending: function (event, from, to) {
            CallCenter.handle_agentshift();
        },
        /**
         * 呼入时咨询转接
         * @param event
         * @param from
         * @param to
         */
        onenterIn_agentshift_sending: function (event, from, to) {
            CallCenter.handle_agentshift();
        },
        /**
         * 转接接通时咨询转接
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_agentshift_sending: function (event, from, to) {
            CallCenter.handle_agentshift();
        },
        /**
         * 外呼时发送三方
         * @param event
         * @param from
         * @param to
         */
        onenterOut_tripartitetalk_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求三方通话");
            var sendobj = new CallCenter._sendcmd("tripartitetalk");
            CallCenter.send(sendobj);
        },
        /**
         * 外呼时发送三方
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_tripartitetalk_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求三方通话");
            var sendobj = new CallCenter._sendcmd("tripartitetalk");
            CallCenter.send(sendobj);
        },
        /**
         * 呼入时发送三方
         * @param event
         * @param from
         * @param to
         */
        onenterIn_tripartitetalk_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求三方通话");
            var sendobj = new CallCenter._sendcmd("tripartitetalk");
            CallCenter.send(sendobj);
        },
        /**
         * 转接咨询成功发送三方
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_tripartitetalk_sending: function (event, from, to) {
            CallCenter.setStatusAndPhoneText("请求三方通话");
            var sendobj = new CallCenter._sendcmd("tripartitetalk");
            CallCenter.send(sendobj);
        },
        /**
         * 外呼三方建立中
         * @param event
         * @param from
         * @param to
         */
        onenterOut_tripartitetalk: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("三方连接中").showControl("#CallCenter_hangupbut");
        },
        /**
         * 外呼三方建立中
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_tripartitetalk: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("三方连接中").showControl("#CallCenter_hangupbut");
        },
        /**
         * 呼入三方建立中
         * @param event
         * @param from
         * @param to
         */
        onenterIn_tripartitetalk: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("三方连接中").showControl("#CallCenter_hangupbut");
        },
        /**
         * 转接通话中,咨询成功后三方建立中(暂时无效,因为转接后咨询没有正确返回事件)
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_tripartitetalk: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("三方连接中").showControl("#CallCenter_hangupbut");
        },
        /**
         * 三方建立成功
         * @param event
         * @param from
         * @param to
         */
        onenterSanfangcall: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("三方通话").showControl("#CallCenter_hangupbut");
        },
        /**
         * 外呼后发送转接
         * @param event
         * @param from
         * @param to
         * @param number
         * @param groupid
         * @param userdata
         */
        onenterOut_transfercall_sending: function (event, from, to, number, groupid, userdata) {
            CallCenter.handle_transfercall(number, groupid, userdata);
        },
        /**
         * 外呼后发送转接
         * @param event
         * @param from
         * @param to
         * @param number
         * @param groupid
         * @param userdata
         */
        onenterOut_auto_transfercall_sending: function (event, from, to, number, groupid, userdata) {
            CallCenter.handle_transfercall(number, groupid, userdata);
        },
        /**
         * 呼入后发送转接
         * @param event
         * @param from
         * @param to
         * @param number
         * @param groupid
         * @param userdata
         */
        onenterIn_transfercall_sending: function (event, from, to, number, groupid, userdata) {
            CallCenter.handle_transfercall(number, groupid, userdata);
        },
        /**
         * 转接通话中发送转接
         * @param event
         * @param from
         * @param to
         * @param number
         * @param groupid
         * @param userdata
         */
        onenterTransferincall_transfercall_sending: function (event, from, to, number, groupid, userdata) {
            CallCenter.handle_transfercall(number, groupid, userdata);
        },
        /**
         * 外呼后发送转接技能组
         * @param event
         * @param from
         * @param to
         * @param groupid
         * @param userdata
         */
        onenterOut_transfergroup_sending: function (event, from, to, groupid, userdata) {
            CallCenter.initControl().handle_transfergroup(groupid, userdata);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_out_transfergroup_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("转接技能组失败");
                    CallCenterStatus.transfercall_fail();
                }
            }, 5000);
        },
        /**
         * 外呼后发送转接技能组
         * @param event
         * @param from
         * @param to
         * @param groupid
         * @param userdata
         */
        onenterOut_auto_transfergroup_sending: function (event, from, to, groupid, userdata) {
            CallCenter.initControl().handle_transfergroup(groupid, userdata);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_out_auto_transfergroup_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("转接技能组失败");
                    CallCenterStatus.transfercall_fail();
                }
            }, 5000);
        },
        /**
         * 呼入后发送转接技能组
         * @param event
         * @param from
         * @param to
         * @param groupid
         * @param userdata
         */
        onenterIn_transfergroup_sending: function (event, from, to, groupid, userdata) {
            CallCenter.initControl().handle_transfergroup(groupid, userdata);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_in_transfergroup_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("转接技能组失败");
                    CallCenterStatus.transfercall_fail();
                }
            }, 5000);
        },
        /**
         * 转接通话中发送转接技能组
         * @param event
         * @param from
         * @param to
         * @param groupid
         * @param userdata
         */
        onenterTransferincall_transfergroup_sending: function (event, from, to, groupid, userdata) {
            CallCenter.initControl().handle_transfergroup(groupid, userdata);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_transferincall_transfergroup_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("转接技能组失败");
                    CallCenterStatus.transfercall_fail();
                }
            }, 5000);
        },
        /**
         * 外呼时被转接振铃
         * @param event
         * @param from
         * @param to
         */
        onenterOut_transfering: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("转接中");
            //CallCenter.showControl("#CallCenter_canceltransfercallbut");
        },
        /**
         * 外呼时被转接振铃
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_transfering: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("转接中");
            //CallCenter.showControl("#CallCenter_canceltransfercallbut");
        },
        /**
         * 呼入时被转接振铃
         * @param event
         * @param from
         * @param to
         */
        onenterIn_transfering: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("转接中");
            CallCenter.showControl("#CallCenter_canceltransfercallbut");
        },
        /**
         * 转接通话中被转接振铃
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_transfering: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("转接中");
            //CallCenter.showControl("#CallCenter_canceltransfercallbut");
        },
        /**
         * 外呼发送取消转接
         * @param event
         * @param from
         * @param to
         */
        onenterOut_canceltransfercall_sending: function (event, from, to) {
            CallCenter.handle_canceltransfercall();
        },
        /**
         * 外呼发送取消转接
         * @param event
         * @param from
         * @param to
         */
        onenterOut_auto_canceltransfercall_sending: function (event, from, to) {
            CallCenter.handle_canceltransfercall();
        },
        /**
         * 呼入发送取消转接
         * @param event
         * @param from
         * @param to
         */
        onenterIn_canceltransfercall_sending: function (event, from, to) {
            CallCenter.handle_canceltransfercall();
        },
        /**
         * 转接通话中发送取消转接
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall_canceltransfercall_sending: function (event, from, to) {
            CallCenter.handle_canceltransfercall();
        },
        /**
         * 外呼发送转接服务
         * @param event
         * @param from
         * @param to
         * @param filename
         */
        onenterOut_transferservice_sending: function (event, from, to, filename, num) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求转接服务").handle_transferservice(filename, num);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_out_transferservice_sending.name)) {
                    CallCenterStatus.transferservice_fail();
                    CallCenter.eventAlert("转接服务失败");
                }
            }, 5000);
        },
        /**
         * 外呼发送转接服务
         * @param event
         * @param from
         * @param to
         * @param filename
         */
        onenterOut_auto_transferservice_sending: function (event, from, to, filename, num) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求转接服务").handle_transferservice(filename, num);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_out_auto_transferservice_sending.name)) {
                    CallCenterStatus.transferservice_fail();
                    CallCenter.eventAlert("转接服务失败");
                }
            }, 5000);
        },
        /**
         * 呼入发送转接服务
         * @param event
         * @param from
         * @param to
         * @param filename
         */
        onenterIn_transferservice_sending: function (event, from, to, filename, num) {
            CallCenter.initControl().showControl("#CallCenter_phonenum").setStatusAndPhoneText("请求转接服务").handle_transferservice(filename, num);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_in_transferservice_sending.name)) {
                    CallCenterStatus.transferservice_fail();
                    CallCenter.eventAlert("转接服务失败");
                }
            }, 5000);
        },
        /**
         * 呼入振铃
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         */
        onenterInringing: function (event, from, to, callid, timestamp, caller, called) {
            if (CallCenter._auto == 1) {//预测外呼
                CallCenter.initControl().setOrgClass().setStatusAndPhoneText("话机振铃");
            } else {
                CallCenter._callId = callid || CallCenter._callId;
                CallCenter._timestamp = timestamp || CallCenter._callId;
                CallCenter._caller = caller || CallCenter._caller;
                CallCenter._called = called || CallCenter._called;
                CallCenter._calling = true;
                CallCenter._isCallout = false;
                CallCenter._calling_from = "inringing";
                CallCenter.initControl().setOrgClass().setStatusAndPhoneText("来电振铃").showControl("#CallCenter_hangupbut,#CallCenter_phonenum");
                if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                    CallCenter.showControl("#CallCenter_answer");
                }
            }
        },
        /**
         * 播放TTS文件
         * @param event
         * @param from
         * @param to
         */
        onenterPlaytts: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("正在播放工号");
        },
        /**
         * 呼入接通
         * @param event
         * @param from
         * @param to
         */
        onenterIncall: function (event, from, to, callid, timestamp, caller, called) {
            CallCenter._callingtimer = 0;
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            if (CallCenter._auto == 1) {//预测外呼
                CallCenter.initControl().setGreenClass().setStatusAndPhoneText("话机接通");
                jQuery("#CallCenter_status_tiao").unbind("click").bind("click", function () {
                    /*空闲，忙碌，切换*/
                    if (jQuery("#CallCenter_status_buts").css("display") == "none") {
                        if (jQuery("#CallCenter_free").css("display") == "list-item" || jQuery("#CallCenter_busy").css("display") == "list-item") {
                            CallCenter.showControl("#CallCenter_status_buts");
                        }
                    } else {
                        CallCenter.hideControl("#CallCenter_status_buts");
                    }
                })
                if (CallCenter._nowStatus == "agentbusy") {
                    CallCenter.initControl().setOrgClass().setStatusAndPhoneText(CallCenter._defaultBusyText).showControl("#CallCenter_free");
                } else {
                    CallCenter.showControl("#CallCenter_status_buts,#CallCenter_free,.CallCenter_busy");
                }
            } else {
                CallCenter.initControl().setGreenClass().showCallingControl().setStatusAndPhoneText("通话中");
            }
        },
        /**
         * 咨询来电振铃
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         */
        onenterConsultinringing: function (event, from, to, callid, timestamp, caller, called) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            CallCenter._callingtimer = 0;
            CallCenter._isCallout = false;
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("咨询来电振铃").showControl("#CallCenter_hangupbut");
            if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                CallCenter.showControl("#CallCenter_answer");
            }
        },
        /**
         * 被咨询方接通
         * @param event
         * @param from
         * @param to
         */
        onenterConsultincall: function (event, from, to) {
            CallCenter._callingtimer = 0;
            CallCenter._calling_from = "consult";
            CallCenter.initControl().setGreenClass().setStatusAndPhoneText("咨询来电通话中").showControl("#CallCenter_hangupbut");
        },
        /**
         * 转接来电振铃
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         * @param dir
         */
        onenterTransferinringing: function (event, from, to, callid, timestamp, caller, called, dir) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            if (dir == 1) {
                CallCenter._isCallout = true;
            } else {
                CallCenter._isCallout = false;
            }
            CallCenter._callingtimer = 0;
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("转接来电振铃").showControl("#CallCenter_hangupbut");
            if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                CallCenter.showControl("#CallCenter_answer");
            }
        },
        /**
         * 转接通话中
         * @param event
         * @param from
         * @param to
         */
        onenterTransferincall: function (event, from, to, callid, timestamp, caller, called, dir) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            CallCenter._callingtimer = 0;
            CallCenter._calling_from = "transfer";
            CallCenter._calling = true;
            if (dir == 1) {
                CallCenter._isCallout = true;
            } else {
                CallCenter._isCallout = false;
            }
            CallCenter.initControl().setGreenClass().showCallingControl().setStatusAndPhoneText("转接来电通话中").hideControl("#CallCenter_mutebut");
        },
        /**
         * 内呼来电振铃
         * @param event
         * @param from
         * @param to
         * @param callid
         * @param timestamp
         * @param caller
         * @param called
         */
        onenterInnerringing: function (event, from, to, callid, timestamp, caller, called) {
            CallCenter._callId = callid || CallCenter._callId;
            CallCenter._timestamp = timestamp || CallCenter._callId;
            CallCenter._caller = caller || CallCenter._caller;
            CallCenter._called = called || CallCenter._called;
            CallCenter._callingtimer = 0;
            CallCenter._isCallout = false;
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("内呼来电振铃").showControl("#CallCenter_hangupbut,#CallCenter_phonenum");
            if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                CallCenter.showControl("#CallCenter_answer");
            }
        },
        /**
         * 内呼接通
         * @param event
         * @param from
         * @param to
         */
        onenterInnercall: function (event, from, to) {
            CallCenter._callingtimer = 0;
            CallCenter.initControl().setStatusAndPhoneText("内呼来电通话中").setGreenClass().showCallingControl()
                .hideControl("#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
        },
        /**
         * 空闲时发送监听
         * @param event
         * @param from
         * @param to
         * @param agentid
         */
        onenterMonitor_idle_sending: function (event, from, to, agentid) {
            CallCenter.handle_monitor(agentid);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_monitor_idle_sending.name)) {//5秒后状态没有变化，监听失败
                    CallCenter.eventAlert("监听失败");
                    CallCenterStatus.monitor_fail();
                }
            }, 5000);
        },
        /**
         * 忙碌时发送监听
         * @param event
         * @param from
         * @param to
         * @param agentid
         */
        onenterMonitor_busy_sending: function (event, from, to, agentid) {
            CallCenter.handle_monitor(agentid);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_monitor_busy_sending.name)) {//5秒后状态没有变化，监听失败
                    CallCenter.eventAlert("监听失败");
                    CallCenterStatus.monitor_fail();
                }
            }, 5000);
        },
        /**
         * 监听回执
         * @param event
         * @param from
         * @param to
         */
        onenterMonitor: function (event, from, to) {
            CallCenter._calling_from = "monitor";
            CallCenter._calling = true;
        },
        /**
         * 监听振铃
         * @param event
         * @param from
         * @param to
         */
        onenterMonitorringing: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("监听来电振铃").showControl("#CallCenter_hangupbut");
            if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                CallCenter.showControl("#CallCenter_answer");
            }
        },
        /**
         * 监听接通
         * @param event
         * @param from
         * @param to
         */
        onenterMonitorincall: function (event, from, to) {
            CallCenter.initControl().setGreenClass().setStatusAndPhoneText("监听通话中").showControl("#CallCenter_hangupbut");
        },
        /**
         * 空闲时发送拦截
         * @param event
         * @param from
         * @param to
         * @param agentid
         */
        onenterAgentinterceptcall_idle_sending: function (event, from, to, agentid) {
            CallCenter.handle_intercept(agentid);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_agentinterceptcall_idle_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("拦截失败");
                    CallCenterStatus.agentinterceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 忙碌时发送拦截
         * @param event
         * @param from
         * @param to
         * @param agentid
         */
        onenterAgentinterceptcall_busy_sending: function (event, from, to, agentid) {
            CallCenter.handle_intercept(agentid);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_agentinterceptcall_busy_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("拦截失败");
                    CallCenterStatus.agentinterceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 强插通话中发送拦截
         * @param event
         * @param from
         * @param to
         * @param agentid
         */
        onenterAgentinterceptcall_agentinsertincall_sending: function (event, from, to, agentid) {
            CallCenter.handle_intercept(agentid);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_agentinterceptcall_agentinsertincall_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("拦截失败");
                    CallCenterStatus.agentinterceptcall_fail();
                }
            }, 5000);
        },
        /**
         * 拦截回执
         * @param event
         * @param from
         * @param to
         */
        onenterAgentinterceptcall: function (event, from, to) {
            CallCenter._calling_from = "interceptcall";
            CallCenter._calling = true;
        },
        /**
         * 拦截中
         * @param event
         * @param from
         * @param to
         */
        onenterIntercept: function (event, from, to) {
            CallCenter._calling = true;
        },
        /**
         * 拦截振铃
         * @param event
         * @param from
         * @param to
         */
        onenterInterceptaltering: function (event, from, to) {
            CallCenter._calling = true;
            CallCenter._callingtimer = 0;
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("拦截来电振铃").showControl("#CallCenter_hangupbut");
            if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                CallCenter.showControl("#CallCenter_answer");
            }
        },
        /**
         * 拦截通话中
         * @param event
         * @param from
         * @param to
         */
        onenterInterceptcall: function (event, from, to) {
            CallCenter._calling = true;
            CallCenter._callingtimer = 0;
            CallCenter._calling_from = "interceptcall";
            CallCenter.initControl().setGreenClass().setStatusAndPhoneText("拦截通话中").showControl("#CallCenter_hangupbut");
        },
        /**
         * 空闲时发送强插
         * @param event
         * @param from
         * @param to
         * @param agentid
         */
        onenterAgentinsert_idle_sending: function (event, from, to, agentid) {
            CallCenter.handle_agentinsert(agentid);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_agentinsert_idle_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("强插失败");
                    CallCenterStatus.agentinsert_fail();
                }
            }, 5000);
        },
        /**
         * 忙碌时发送强插
         * @param event
         * @param from
         * @param to
         * @param agentid
         */
        onenterAgentinsert_busy_sending: function (event, from, to, agentid) {
            CallCenter.handle_agentinsert(agentid);
            setTimeout(function () {
                if (CallCenterStatus.is(SDK_state.s_agentinsert_busy_sending.name)) {//5秒后状态没有变化，失败
                    CallCenter.eventAlert("强插失败");
                    CallCenterStatus.agentinsert_fail();
                }
            }, 5000);
        },
        /**
         * 强插操作成功
         * @param event
         * @param from
         * @param to
         */
        onenterAgentinsert: function (event, from, to) {
            CallCenter._isMeeting = true;
            CallCenter._calling_from = "agentinsert";
            CallCenter._calling = true;
        },
        /**
         * 强插振铃
         * @param event
         * @param from
         * @param to
         */
        onenterAgentinsertringing: function (event, from, to) {
            CallCenter.initControl().setStatusAndPhoneText("强插来电振铃");
            if (CallCenter._logintype == CallCenter._loginType_web || CallCenter._serverType == CallCenter._serverType_cti) {
                CallCenter.showControl("#CallCenter_answer,#CallCenter_hangupbut");
            }
        },
        /**
         * 强插通话中
         * @param event
         * @param from
         * @param to
         */
        onenterAgentinsertincall: function (event, from, to) {
            CallCenter.initControl().setStatusAndPhoneText("强插通话中").setGreenClass().showControl("#CallCenter_hangupbut");
        },
        /**
         * 话后
         * @param event
         * @param from
         * @param to
         */
        onenterAfter: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("话后").showControl("#CallCenter_free,.CallCenter_busy");
            CallCenter._calling = false;
            CallCenter._isCallout = false;
            CallCenter._nowStatus = "after";
            CallCenter._callId = "";
            CallCenter._timestamp = "";
            CallCenter._caller = "";
            CallCenter._called = "";
            CallCenter._calling_from = "";
            CallCenter._be_operator = "";
            CallCenter._isMeeting = false;
            CallCenter._isInnercall = false;
        },
        /**
         * 话机异常
         * @param event
         * @param from
         * @param to
         */
        onenterSiperror: function (event, from, to) {
            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("话机异常").showControl(".CallCenter_busy,#CallCenter_free");
            if (CallCenter._logintype == CallCenter._loginType_web) {
                SoftPhone.Login(CallCenter._media_ip, CallCenter._media_port, CallCenter._sip_id, CallCenter._sip_pwd);
            }
        },
        /**
         * 重连成功
         * @param event
         * @param from
         * @param to
         */
        onenterReconnection: function (event, from, to) {
            CallCenter.log('event:' + event + ' from:' + from + " to:" + to);
            CallCenter.setOrgClass().setStatusAndPhoneText("重连成功");
            CallCenter._islogin = true;
        },
        /**
         * 重连失败
         * @param event
         * @param from
         * @param to
         */
        onenterReconnection_fail: function (event, from, to) {
            CallCenter.log('event:' + event + ' from:' + from + " to:" + to);
            CallCenter.setOrgClass().setStatusAndPhoneText("重新连接失败");
            CallCenter.setlocalstorage("refreshReconnection", 0);
        }
    },
    error: function (eventName, from, to, args, errorCode, errorMessage, e) {
        CallCenter.log("ERROR: eventName:" + eventName + " from:" + from + " to:" + to + " args:" + args + " errorCode:" + errorCode + " errorMessage:" + errorMessage);
        if (errorCode == 300) {
            CallCenter.log(e);
        }
        var state_text = "未知";
        var from = SDK_state["s_" + from];
        if (from) {
            var state_text = from.text;
        }
        var action_text = "未知";
        var action = SDK_action[eventName];
        if (action) {
            var action_text = action.text;
            if (action.type == 'handle') {
                action_text += "操作";
            }
        }
        var msg = "当前状态" + state_text + "，不能执行" + action_text;
        CallCenter.eventAlert(msg).log(msg);
        return {result: 0, reason: msg};
    }
});