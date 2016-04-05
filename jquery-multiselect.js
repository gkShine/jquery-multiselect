/*
 * Jquery Multiselect插件 中文叫列表多选插件
 * 使用例子:
 * $('table').multiSelect({
 *  actcls: 'active',
 *  selector: 'tbody tr',
 *  callback: false
 * });
 */
(function ($) {
    $.fn.multiSelect = function (options) {
        $.fn.multiSelect.init($(this), options);
    };

    $.extend($.fn.multiSelect, {
        defaults: {
            selection: 'body', //区域选择
            actcls: 'active', //选中样式
            selector: 'tbody tr', //选择的行元素
            except: ['tbody'], //选中后不去除多选效果的元素队列
            statics: ['.static'], //被排除行元素条件
            callback: false //选中回调
        },
        first: null, //按shift时，用于记住第一个点击的item
        last: null, //最后点击的item
        isSelection: false,
        init: function (scope, options) {
            this.scope = scope;
            this.options = $.extend({}, this.defaults, options);
            this.initEvent();
            this.initScopeEvent();
        },
        checkStatics: function (dom) {
            for (var i in this.options.statics) {
                if (dom.is(this.options.statics[i])) {
                    return true;
                }
            }
        },
        initEvent: function () {
            var self = this,
                scope = self.scope,
                options = self.options,
                callback = options.callback,
                actcls = options.actcls;

            scope.on('click.mSelect', options.selector, function (e) {
                if (!e.shiftKey && self.checkStatics($(this))) {
                    return;
                }

                if ($(this).hasClass(actcls)) {
                    $(this).removeClass(actcls);
                } else {
                    $(this).addClass(actcls);
                }

                if (e.shiftKey && self.last) {
                    if (!self.first) {
                        self.first = self.last;
                    }
                    var start = self.first.index();
                    var end = $(this).index();
                    if (start > end) {
                        var temp = start;
                        start = end;
                        end = temp;
                    }
                    $(options.selector, scope).removeClass(actcls).slice(start, end + 1).each(function () {
                        if (!self.checkStatics($(this))) {
                            $(this).addClass(actcls);
                        }
                    });
                    window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
                } else if (!e.ctrlKey && !e.metaKey) {
                    $(this).siblings().removeClass(actcls);
                }
                self.last = $(this);
                $.isFunction(callback) && callback($(options.selector + '.' + actcls, scope));
            });

            /**
             * 点击其他处去除选中状态
             */
            $(document).on('click.mSelect', function (e) {
                if (self.isSelection) {
                    self.isSelection = false;
                    return;
                }
                for (var i in options.except) {
                    var except = options.except[i];
                    if ($(e.target).is(except) || $(e.target).parents(except).size()) {
                        return;
                    }
                }
                scope.find(options.selector).each(function () {
                    if (!self.checkStatics($(this))) {
                        $(this).removeClass(actcls);
                    }
                });
                $.isFunction(callback) && callback($(options.selector + '.' + actcls, scope));
            });

            /**
             * Ctrl+A全选
             */
            $(document).on('keydown.mSelect', function (e) {
                if ((e.keyCode == 65) && (e.metaKey || e.ctrlKey)) {
                    $(options.selector, scope).each(function () {
                        if (!self.checkStatics($(this))) {
                            $(this).addClass(actcls);
                        }
                    });
                    $.isFunction(callback) && callback($(options.selector + '.' + actcls, scope));
                    e.preventDefault();
                    return false;
                }
            });

            /**
             * 清楚shift按住的状态
             */
            $(document).on('keyup.mSelect', function (e) {
                if (e.keyCode == 16) {
                    self.first = null;
                }
            });
        },
        initScopeEvent: function () {
            var self = this,
                scope = self.scope,
                options = self.options,
                callback = options.callback,
                actcls = options.actcls;
            if (!options.selection) {
                return;
            }
            var selection_scope = $(options.selection).css('user-select', 'none');
            var selection = $('<div/>').css({
                border: '1px dashed blue',
                position: 'absolute'
            }).appendTo('body');
            var startX = 0, startY = 0, flag = false;
            selection_scope.on('mousedown.mSelect', function (e) {
                var evt = window.event || e;
                startX = evt.clientX + $(document).scrollLeft();
                startY = evt.clientY + $(document).scrollTop();
                flag = true;
            }).on('mousemove.mSelect', function (e) {
                if (flag) {
                    var evt = window.event || e;
                    var scrollTop = $(document).scrollTop();
                    var scrollLeft = $(document).scrollLeft();
                    retcHeight = Math.abs(startY - evt.clientY - scrollTop);
                    retcWidth = Math.abs(startX - evt.clientX - scrollLeft);
                    if (retcHeight + retcWidth > 1) {
                        retcLeft = (startX - evt.clientX - scrollLeft > 0 ? evt.clientX + scrollLeft : startX);
                        retcTop = (startY - evt.clientY - scrollTop > 0 ? evt.clientY + scrollTop : startY);
                        selection.show().css({
                            left: retcLeft,
                            top: retcTop,
                            width: retcWidth,
                            height: retcHeight
                        });
                        clearTimeout(timerId);
                        self.isSelection = true;
                        var timerId = setTimeout(function(){
                            setectItem(retcLeft, retcTop, retcWidth, retcHeight);
                        }, 200);
                    }
                }
            });
            $(document).on('mouseup.mSelect', function (e) {
                selection.hide();
                flag = false;
                if(self.isSelection){
                    setTimeout(function(){
                        $.isFunction(callback) && callback($(options.selector + '.' + actcls, scope));
                    }, 200);
                }
            });

            var checkScope = function (retcWidth, retcHeight, retcLeft, retcTop, dom) {
                var offset = dom.offset();
                var maxLeft = offset.left + dom.outerWidth();
                var maxTop = offset.top + dom.outerHeight();
                for (var x = 0; x <= retcWidth; x++) {
                    for (var y = 0; y <= retcHeight; y++) {
                        var inX = (retcLeft + x) > offset.left && (retcLeft + x) < maxLeft;
                        var inY = (retcTop + y) > offset.top && (retcTop + y) < maxTop;
                        if (inX && inY) {
                            return true;
                        }
                    }
                }
                return false;
            };
            //计算选中范围
            var setectItem = function (retcLeft, retcTop, retcWidth, retcHeight) {
                $(options.selector, self.scopp).each(function () {
                    if (checkScope(retcWidth, retcHeight, retcLeft, retcTop, $(this))) {
                        if (!self.checkStatics($(this))) {
                            $(this).addClass(actcls);
                        }
                    } else {
                        $(this).removeClass(actcls);
                    }
                });
            };
        }
    });
})(jQuery);