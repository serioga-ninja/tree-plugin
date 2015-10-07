(function ($) {

    var Builder = function (events) {
        var builder = this;
        console.log(builder.elements);
        builder.elements = $.extend({
            'ul': function (sortUrl) {
                return $('<ul/>').attr('sort', sortUrl);
            },
            'li': function () {
                return $('<li/>');
            },
            'row': function () {
                return $('<div/>', {
                    class: 'row'
                })
            },
            'title': function (options) {
                return $('<div/>', {
                    class: 'tree-object closed title',
                    'data-id': options.id,
                    'data-entity': options.entity,
                    'data-url': options.url,
                    text: options.title + (options.functions != undefined ? ' (' + options.functions + ')' : '')
                });
            },
            'icon': function () {
                return $('<span/>', {
                    class: 'icon icon-B_add'
                });
            },
            'buttons': function (options) {
                var block = $('<div/>', {
                        class: 'operations'
                    }),
                    edit = builder.elements.button('edit-button', 'control table-edit', options, events.onEdit, options.editUrl),
                    remove = builder.elements.button('remove-button', 'control table-delete', options, events.onDelete, options.deleteUrl),
                    email = builder.elements.emailButton('email-button', 'control table-email', options.email);

                block.append(edit);
                if (options.canDelete) {
                    block.append(remove);
                }
                if (options.email != undefined && options.email.length > 0) {
                    block.append(email);
                }
                return block;
            },
            button: function (_calss, ico, options, evt, href) {
                return $('<div/>', {
                    class: _calss,
                    html: $('<a/>', {
                        class: ico,
                        text: '',
                        'data-id': options.id,
                        'data-entity': options.entity,
                        href: href
                    }).click(evt)
                });
            },
            emailButton: function (_class, ico, email) {
                return $('<div/>', {
                    class: _class,
                    html: $('<a/>', {
                        class: ico,
                        href: 'mailto:' + email
                    })
                });
            },
            span: function () {
                return $('<span/>');
            }
        }, builder.elements || {});
    };

    var BuilderFunctions = function (events) {
        var builder = this;

        builder.elements = {
            'title': function (title) {
                return $('<span/>', {
                    class: 'tree-object closed title',
                    text: title
                });
            },
            'fn-title': function (options) {
                var date = new Date(parseInt(options.StartDate.substr(6)));
                return $('<div/>', {
                    class: 'tree-object closed title',
                    'data-id': options.Id,
                    text: ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear() + ' ' + options.FullName
                });

            },
            'buttons': function (options) {
                var block = $('<div/>', {
                        class: 'operations'
                    }),
                    edit = builder.elements.button('edit-button', 'control table-edit', options, events.onEdit, options.EditUrl),
                    remove = builder.elements.button('remove-button', 'control table-delete', options, events.onDelete, options.DeleteUrl),
                    email = builder.elements.emailButton('email-button', 'control table-email', options.email);

                
                block.append(edit);
                block.append(remove);
                if (options.MemberEmail != undefined && options.MemberEmail.length > 0) {
                    block.append(email);
                }
                return block;
            },
            button: function (_calss, ico, options, evt, href) {
                console.log('evt', evt);
                return $('<div/>', {
                    class: _calss,
                    html: $('<a/>', {
                        class: ico,
                        text: '',
                        'data-id': options.Id,
                        href: href
                    }).click(evt)
                });
            }
        };

        builder.build = function (functions) {
            var lis = [];
            $.each(functions, function (key, objects) {
                var li = builder.elements['li'](),
                    title = builder.elements['title'](key),
                    row = builder.elements['row'](),
                    ul = builder.elements['ul']();

                $.each(objects, function (key, _func) {
                    var _li = builder.elements['li'](),
                        _title = builder.elements['fn-title'](_func),
                        _buttons = builder.elements['buttons'](_func);
                    
                   _li.append(_title).append(_buttons);
                    ul.append(_li);
                });

                title.append(ul);
                row.append(title);
                li.append(row);
                lis.push(li);
            });
            return lis;
        };
        Builder.apply(builder, arguments);
    };

    var BuilderObjects = function (events) {
        var builder = this;
        builder.build = function (objects) {
            var lis = [];
            $.each(objects, function (key, value) {
                var li = builder.elements['li'](value),
                    row = builder.elements['row'](value),
                    icon = builder.elements['icon'](value),
                    title = builder.elements['title'](value),
                    buttons = builder.elements['buttons'](value);

                if (value.hasChildren) {
                    icon.addClass('clickable');
                    icon.click(events.loadNextLevel);
                    row.append(icon);
                }

                row.append(title).append(buttons);
                li.append(row);
                lis.push(li);
            });
            return lis;
        };
        Builder.apply(this, arguments);
    };

    var Adapter = function (Unit, objects) {
        if (!objects || objects.length === 0) {
            return []
        } else {
            return Unit.build(objects);
        }
    };

    $.fn.jsTree = function (options) {

        return this.each(function () {

            var $this = $(this);
            var settings = $.extend({
                url: 'data.json'
            }, options);
            var objectBuilder, functionBuilder;

            $this.core = {
                buildUrl: function (params) {
                    if (settings.debug) {
                        return 'data.json';
                    } else if (params.url) {
                        return params.url
                    } else {
                        var id = params.ids.join('/');
                        var buildNewUrl = params.entity.split('?');
                        return buildNewUrl[0] + '/' + id + '?' + buildNewUrl[1];
                    }
                }
            };

            $this.events = {
                loadNextLevel: function (ev) {
                    //debugger;
                    ev.preventDefault();
                    var _this = $(ev.currentTarget).next()
                        , parentLi = $(_this.parents('li')[0])
                        , ids = []
                        , elements = _this.parents('li').children('.row').children('.tree-object')
                        , parentRow = _this.parents('.row')
                        , iconPlus = 'icon-B_add'
                        , iconMinus = 'icon-B_minus'
                        ;

                    if (_this.hasClass('loaded')) {
                        parentLi.find('ul').fadeToggle(200, 'linear', function () {
                            if ($(this).is(':visible')) {
                                parentRow.find('span.icon').removeClass(iconPlus).addClass(iconMinus);
                            } else {
                                parentRow.find('span.icon').removeClass(iconMinus).addClass(iconPlus);
                            }
                        });
                        return;
                    } else {
                        _this.addClass('loaded');
                    }

                    elements.each(function (key, value) {
                        ids.push($(value).data().id);
                    });
                    var url = !!_this.data().url ? _this.data().url : $this.core.buildUrl({
                        ids: ids.reverse(),
                        entity: _this.data().entity
                    });

                    $this.events.onBeforeDataLoad();
                    $this.getRows(url, function (err, body) {
                        var block = $this.buildBlock(body);
                        parentLi.append(block);
                        parentRow.find('span.icon').removeClass(iconPlus).addClass(iconMinus);
                        $this.applySortable(parentLi.find('ul'));
                        $this.events.onDataLoaded();
                    });
                }
            };

            $this.buildBlock = function (objs) {
                var ul = objectBuilder.elements['ul'](objs.sort);

                var lis = $.merge($.merge([], Adapter(objectBuilder, objs.objects || [])), Adapter(functionBuilder, objs.functions || []));

                $.each(lis, function (key, li) {
                    ul.append(li);
                });

                return ul;
            };

            $this.applySortable = function (ul) {
                ul.sortable({
                    update: function (event, ui) {
                        var ids = [];
                        var list = $(this);
                        list.find('li').each(function (key, el) {
                            ids.push($(el).find('.row .tree-object').attr('data-id'));
                        });
                        console.log(ids);
                        $.ajax({
                            url: list.attr('sort'),
                            type: 'POST',
                            data: {ids: ids},
                            dataType: 'application/json',
                            success: function () {

                            }
                        })
                    }
                });
            };

            $this.getRows = function (url, callback) {
                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'json'
                }).done(function (body) {
                    callback(null, body);
                }).fail(function (err) {
                    console.error(err);
                });
            };

            $this.init = function () {
                $this.addClass('js-tree');

                $this.events = $.extend($this.events, settings.events);

                objectBuilder = new BuilderObjects($this.events);
                functionBuilder = new BuilderFunctions($this.events);

                $('li').disableSelection();
                $.ajaxSetup({
                    beforeSend: function (xhr) {
                        xhr.withCredentials = true;
                        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                    },
                    crossDomain: true
                });


                $this.getRows($this.core.buildUrl({
                    url: settings.url
                }), function (err, body) {
                    var block = $this.buildBlock(body);
                    $this.append(block);
                    $this.applySortable($this.find('ul'));
                });
            };
            $this.init();
        });
    }
})(jQuery);

var collapseOrExpand = false;
var collapsedStatus = true;

function Expand() {
    var items = $('.clickable.icon-B_add');

    if (items.length > 0)
        items.each(function (index, value) {
            $(value).click();
        });
    else {
        collapsedStatus = false;
        collapseOrExpand = false;
        console.log("all items expanded");
    }
}

function Collapse() {
    var items = $('.clickable.icon-B_minus');

    items.each(function (index, value) {
        $(value).click();
    });
    collapsedStatus = true;
    collapseOrExpand = false;
    console.log("all items collapsed");
}

function CollapseExpand() {
    if (collapsedStatus == true)
        Expand();
    else
        Collapse();
}

$(document).ready(function () {
    $('#collapse_expand_btn').click(function () {
        collapseOrExpand = true;
        CollapseExpand();
    });
});

