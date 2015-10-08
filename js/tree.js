(function ($) {
    'use strict';
    var check = (function check() {
        return {
            isString: function isString(value) {
                return value !== null && value !== undefined && typeof value === 'string' && value.length > 0;
            }
        };
    })();

    var BaseUnit = function (events) {
        var builder = this;
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
                });
            },
            'title': function (options) {
                return $('<div/>', {
                    class: 'tree-object closed title',
                    'data-id': options.id,
                    'data-entity': options.entity,
                    'data-url': options.url,
                    text: options.title + (check.isString(options.functions) ? ' (' + options.functions + ')' : '')
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
                if (check.isString(options.email)) {
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

    var Functions = function (events) {
        var builder = this;

        builder.elements = {
            'title': function (options) {
                return $('<div/>', {
                    class: 'tree-object closed title loaded',
                    'data-id': options.FunctionSoortId,
                    text: options.FunctionSoortName
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
                if (check.isString(options.email)) {
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
                        'data-id': options.Id,
                        href: href
                    }).click(evt)
                });
            }
        };

        builder.build = function (functions) {
            var lis = [];
            $.each(functions, function (key, _fn) {
                var li = builder.elements.li(),
                    icon = builder.elements.icon(),
                    title = builder.elements.title(_fn),
                    buttons = builder.elements.buttons(_fn),
                    row = builder.elements.row(),
                    ul = builder.elements.ul();

                if (_fn.Members.length) {
                    icon.addClass('clickable');
                    icon.click(events.loadNextLevel);
                    row.append(icon);
                }
                $.each(new Builder(new Members(events), _fn.Members), function (key, _li) {
                    ul.append(_li);
                });
                ul.css('display', 'none');
                row.append(title).append(buttons);
                li.append(row).append(ul);
                lis.push(li);
            });
            return lis;
        };
        BaseUnit.apply(builder, arguments);
    };

    var Members = function () {
        var builder = this;

        builder.elements = {
            'title': function (options) {
                var date = new Date(parseInt(options.StartDate.substr(6)));
                return $('<div/>', {
                    class: 'tree-object closed title',
                    'data-id': options.Id,
                    text: ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear() + ' ' + options.FullName
                });

            }
        };

        builder.build = function build(members) {
            var lis = [];
            $.each(members, function (key, member) {
                var row = builder.elements.row(),
                    title = builder.elements.title(member),
                    li = builder.elements.li(),
                    buttons = builder.elements.buttons(member);

                row.append(title).append(buttons);
                li.append(row);
                lis.push(li);
            });
            return lis;
        };

        BaseUnit.call(builder, arguments);
    };

    var Objects = function (events) {
        var builder = this;
        builder.build = function (objects) {
            var lis = [];
            $.each(objects, function (key, value) {
                var li = builder.elements.li(value),
                    row = builder.elements.row(value),
                    icon = builder.elements.icon(value),
                    title = builder.elements.title(value),
                    buttons = builder.elements.buttons(value);

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
        BaseUnit.apply(this, arguments);
    };

    var Builder = function (Unit, objects) {
        if (!objects || objects.length === 0) {
            return [];
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
                        return params.url;
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
                    var _this = $(ev.currentTarget).next(),
                        parentLi = $(_this.parents('li')[0]),
                        ids = [],
                        elements = _this.parents('li').children('.row').children('.tree-object'),
                        parentRow = _this.parents('.row'),
                        iconPlus = 'icon-B_add',
                        iconMinus = 'icon-B_minus';

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
                var ul = objectBuilder.elements.ul(objs.sort);

                var lis = $.merge($.merge([], new Builder(objectBuilder, objs.objects || [])), new Builder(functionBuilder, objs.functions || []));

                $.each(lis, function (key, li) {
                    ul.append(li);
                });

                return ul;
            };

            $this.applySortable = function (ul) {
                ul.sortable({
                    update: function () {
                        var ids = [];
                        var list = $(this);
                        list.find('li').each(function (key, el) {
                            ids.push($(el).find('.row .tree-object').attr('data-id'));
                        });
                        $.ajax({
                            url: list.attr('sort'),
                            type: 'POST',
                            data: {
                                ids: ids
                            },
                            dataType: 'application/json',
                            success: function () {

                            }
                        });
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

                objectBuilder = new Objects($this.events);
                functionBuilder = new Functions($this.events);

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
    };
})(jQuery);
