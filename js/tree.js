(function ($) {

    $.fn.jsTree = function (options) {

        return this.each(function () {

            var $this = $(this);
            var settings = $.extend({
                url: 'data.json'
            }, options);

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
                        //return params.entity + '/' + params.ids.join('/')
                    }
                }
            };

            $this.builder = {
                'ul': function (options) {
                    return $('<ul/>', $.extend({}, options));
                },
                'li': function (options) {
                    return $('<li/>');
                },
                'row': function (options) {
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
                        edit = $this.builder.button('edit-button', 'control table-edit', options, $this.events.onEdit, options.editUrl),
                        remove = $this.builder.button('remove-button', 'control table-delete', options, $this.events.onDelete, options.deleteUrl),
                        email = $this.builder.emailButton('email-button', 'control table-email', options.email);
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
                emailButton: function (_calss, ico, email) {
                    return $('<div/>', {
                        class: _calss,
                        html: $('<a/>', {
                            class: ico,
                            href: 'mailto:' + email
                        })
                    });
                }
            };

            $this.events = {
                loadNextLevel: function (ev) {
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

                    $this.getRows(url, function (err, body) {
                        var block = $this.buildBlock(body.objects);
                        parentLi.append(block);
                        parentRow.find('span.icon').removeClass(iconPlus).addClass(iconMinus);
                        $this.applySortable(parentLi.find('ul'));
                    });
                }
            };

            $this.buildBlock = function (objs) {
                var ul = $this.builder.ul();
                $.each(objs, function (key, value) {
                    var li = $this.builder['li'](value),
                        row = $this.builder['row'](value),
                        icon = $this.builder['icon'](value),
                        title = $this.builder['title'](value),
                        buttons = $this.builder['buttons'](value);
                    if (value.hasChildren) {
                        icon.addClass('clickable');
                        icon.click($this.events.loadNextLevel);
                        row.append(icon);
                    }

                    row.append(title).append(buttons);
                    li.append(row);
                    if(value.objects && value.objects.length) {
                        li.append($this.buildBlock(value.objects));
                    }
                    ul.append(li);
                });
                return ul;
            };

            $this.applySortable = function (ul) {
                ul.sortable();
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
                }).always(function () {
                });
            };

            $this.init = function () {
                $this.addClass('js-tree');
                $this.events = $.extend($this.events, settings.events);
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
                    var block = $this.buildBlock(body.objects);
                    $this.append(block);
                    $this.applySortable($this.find('ul'));
                });
            };
            $this.init();
        });
    }
})(jQuery);