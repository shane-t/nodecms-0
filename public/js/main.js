var converter = new Showdown.converter();
(function ($, md) {
'use strict';

    var ExpandingNavView = Backbone.View.extend({
        el : '.menu-control',

        events : {'click' : 'toggle'},

        toggle : function () {
            $('.hideyokids').children().toggle();
        }
    }), Post = Backbone.Model.extend({
        url: function () { 
            return this.id ? '/api/post/' + this.id : '/api/post';
        },
        idAttribute: '_id'
    }), Page = Backbone.Model.extend({
        url: function () { 
            return this.id ? '/api/page/' + this.id : '/api/page';
        },
        idAttribute: '_id'
    }), User = Backbone.Model.extend({
        url: function () { 
            return this.id ? '/api/user/' + this.id : '/api/user';
        },
        idAttribute: '_id'
    }), Posts = Backbone.Collection.extend({
        url: '/api/post',
        model : Post
    }), Pages = Backbone.Collection.extend({
        url: '/api/page',
        model : Page
    }), MarkDownTextArea = Backbone.View.extend({
        template_raw  : '' +
                        '<ul class="editor-controls">' +
                            '<li class="editor-bold" title="Bold"><strong>B</strong></li>' + //.ir TODO
                            '<li class="editor-italic" title="Italic"><em>I</em></li>' + //.ir TODO
                            '<li class="editor-h2" title="heading"><strong>h2</strong></li>' + //.ir TODO
                            '<li class="editor-bq" title="Block Quote">&laquo;</li>' + //.ir TODO
                            '<li class="editor-li" title="List">&middot;___</li>' + //.ir TODO
                            '<li class="editor-code" title="Code"><small>[code]</small></li>' + //.ir TODO
                            '<li class="editor-a" title="Link"><u>∞</u></li>' + //.ir TODO
                            '<li class="editor-image" title="Image">☺</li>' + //.ir TODO
                        '</ul>' +
                        '<textarea name="content" class="editor-content editor">' +
                            '<%= content %>' +
                        '</textarea>' +
                        '<div class="editor-preview md">' +
                            '<%=content %>' +
                        '</div>',
        events      : {
            'input .editor-content'   : 'contentChanged',
            'click .editor-italic'    : 'italic',
            'click .editor-bold'      : 'bold',
            'click .editor-h2'        : 'h2',
            'click .editor-bq'        : 'bq',
            'click .editor-code'      : 'code',
            'click .editor-a'         : 'link',
            'click .editor-image'     : 'image',
            'keyup .editor-content'   : 'keyuphandler',
            'keydown .editor-content' : 'keydownhandler'
        },

        //state
        history : [],
        ctrlpressed : false,

        keydownhandler : function (e) {
            if (e.which == 17) {
                this.ctrlpressed = true;
            } else if (e.which == 90 && this.ctrlpressed === true) {
                //ctrl-z == undo
                e.preventDefault();
                this.undo();
            }
        },
        keyuphandler : function (e) {
            if (e.which == 17) {
                this.ctrlpressed = false;
            }
        },

        bold        : function () {
            this.wrap('**', '**');
        },
        italic      : function () {
            this.wrap('*', '*');
        },
        h2          : function () {
            this.prefixLine('## ');
        },
        bq          : function () {
            this.prefixLine('> ');
        },
        code        : function () {
            if (this.textarea.selectionStart == this.textarea.selectionEnd) {
                this.prefixLine('    ');
            } else {
                this.wrap('`', '`');
            }
        },
        link        : function () {

            new URLSelectorView({ 
                    callback: (function (that) {
                    return function (href) { //close over this
                        that.wrap('[',  '](' + href + ')');
                    };
                })(this)
            });
        },
        image       : function (ev) {
            var selection = this.getSelection();

            new ImageSelectorView({
                    selection: selection,
                    callback: (function (that) {
                    return function (src) { //close over this
                        that.wrap('![' , '](' + src + ')');
                    };
                })(this)
            });
        },
        prefixLine  : function (character) {
            var caretpos = this.textarea.selectionStart, // === this.textarea.selectionEnd
                i,
                newval;

            for (i = caretpos-1; i >= 0; i--) {
                if (this.textarea.value.charAt(i) === '\n') {
                    newval = this.textarea.value.substring(0, i+1) + character + this.textarea.value.substring(i+1, this.textarea.value.length);
                    break;
                } else if (i === 0) {
                    newval = character + this.textarea.value;
                }
            }

            this.textarea.value = newval;
            this.contentChanged({target : this.textarea});

        },
        getSelection: function () {
            return this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd) || "";
        },
        wrap        : function (open, close) {
            var start = this.textarea.selectionStart,
                end = this.textarea.selectionEnd,
                original_val = this.textarea.value,
                text = original_val.substring( start, end ),
                pre = original_val.substring ( 0, start ),
                post = original_val.substring (end );

            text = $.trim(text);

            this.textarea.value =
                pre +
                open +
                text +
                close +
                post;

            this.contentChanged({target : this.textarea});
        },
        undo           : function () {
            if (this.history.length) {
                this.textarea.value = this.history.pop();
            }
        },
        initialize     : function () {
            this.template = _.template(this.template_raw);
            this.history.push('');      //to start with, as there is no model
            this.render();
            return this;
        },
        setTextArea    : function () {
                this.$textarea = this.$el.find('textarea');
                this.textarea = this.$textarea[0];
        },
        render         : function () {
            if (!this.$textarea) {
                this.$el.html(this.template({content:""}));
                this.setTextArea();
            }
            
            // render markdown into preview
            this.$el.find('.editor-preview').html(md(this.$textarea.val()));

            return this;
        },
        contentChanged : function () {
            this.history.push(this.$textarea.val());

            if (this.history.length > 1000) {
                this.history.splice(0,1);
            }
        }
    }),   EditContentView = MarkDownTextArea.extend({
        template_raw   : '<button class="editor-close">X</button>' +
                          MarkDownTextArea.prototype.template_raw  +
                        '<button class="editor-save">Save</button>' +
                        '<p class="editor-message"></p>',
        unsaved        : false,
        close          : function () {
            var sure = true;

            if (this.unsaved) {
                sure = confirm("You have unsaved changes, are you sure you want to close?");
            }

            if (sure) {
                this.destroy();
            }
        },
        setMessage     : function (msg, newClass) {
            this.$el.find('.editor-message').html(msg);
            if (newClass.length) {
                this.$el.find('.editor-message').attr('class', 'editor-message ' + newClass);
            }
        },
        events: function(){
            return _.extend({},MarkDownTextArea.prototype.events,{
                'click .editor-save'    : 'save',
                'click .editor-close'  : 'close'
            });
        },
        contentChanged : function (ev) {
            var content = $(ev.target).val();

            this.history.push(this.model.get('content'));

            if (this.history.length > 1000) {
                this.history.splice(0,1);
            }

            this.model.set('content', content);
            this.unsaved = true;
            this.setMessage('unsaved', 'info');
        },
        save           : function () {
            var that = this;
            this.setMessage('saving', 'info');
            this.model.save({}, {
                success: function () {
                    that.unsaved = false;
                    that.setMessage('saved', 'good');
                },
                error  : function () {
                    that.setMessage('error saving', 'error');
                }
            });
        },
        render         : function () {

            //if preview pane exists then update it, otherwise create the whole thing

            if (!this.$textarea) {
                this.$el.html(this.template(this.model.toJSON()));
                this.setTextArea();
            } else {
                // sub view?
                // render markdown of model into preview
            }
            this.$el.find('.editor-preview').html(md(this.model.get('content')));
            return this;
        },
        initialize     : function (ev) {
            if (this.$textarea) return this;
            this.template = _.template(this.template_raw);
            this.model.bind('change', this.render, this);
            this.render();
            return this;
        },
        destroy        : function () {
            this.undelegateEvents();
            this.$el.unbind();
            this.$el.html(md(this.model.get('content')))
                    .addClass('canedit')
                    .addClass('content-edit')
                    .addClass('md');

        }
    }),   AppView = Backbone.View.extend({
        el     : '#content',
        events : { 
            'click .content-edit' : 'edit',
            'click .user-edit' : 'user_edit'
        },
        edit   : function (e) {

            var $el    = $(e.currentTarget),
                model = $el.data('model'),
                id    = $el.data('id'),
                item  = null;

            if ((model === "post" || model === 'page') && id.length) {

                $el.removeClass('content-edit')
                   .removeClass('md');

                if (model === 'post') {
                    item = new Post( { _id : id } );
                } else if (model === 'page') {
                    item = new Page( { _id : id } );
                }

                item.fetch({
                    success: function (result) {
                        new EditContentView( { el : e.currentTarget, model: result } );
                    }, error: function () {
                        console.error("No such Record");
                    }
                });
            }
        },
        user_edit  : function (e) {
            var $el    = $(e.currentTarget),
                model = $el.data('model'),
                id    = $el.data('id'),
                item  = null;

            item = new User( { _id : id } );

            item.fetch({
                success: function (result) {
                    new UserView( { el : e.currentTarget, model: result } );
                }, error: function () {
                    console.error("No such Record");
                }
            });
        },
        initialize : function () {
            this.$el.find('.richedit').each(function () {
                new MarkDownTextArea({ el : this });
            });
        }
    }),   URLSelectorView = Backbone.View.extend({
        initialize : function () {
            var url = prompt( 'Enter a URL', 'http://' );
            this.setURL(url);
        },

        setURL     : function (url) {
            this.options.callback(url);
        }

    }),   ImageSelectorView = Backbone.View.extend({
        initialize : function () {
            var url = prompt('Enter a URL', 'http://');
            this.setURL(url);
        },
        setURL     : function (url) {
            this.options.callback(url);
        }
    }),   UserView = Backbone.View.extend({
        template   : _.template(''+
            '<section class="user grid-block grid-small">' +
                '<h3><a href="/user/<%=username%>"><%=username%></a></h3>' +
              '<button class="editor-save">Save</button>' +
              '<button class="editor-delete" value="Delete">Delete</button>' +
            '</section>'
        ),
        initialize : function () {
            this.render();
        },
        render     : function () {
            this.$el.replaceWith(this.template(this.model.toJSON()));
        },
        events     : {
            'click .editor-save'      : 'save',
            'click .editor-delete'    : 'delete'
        },
        save       : function (e) {
            var that = this;
            this.model.save({}, {                                                  
                success: function () {
                    that.unsaved = false;
                    that.setMessage('saved', 'good');
                },
                error  : function () {
                    that.setMessage('error saving', 'error');
                }
            });
        },
        setMessage     : function (msg, newClass) {
            this.$el.find('.editor-message').html(msg);
            if (newClass.length) {
                this.$el.find('.editor-message').attr('class', 'editor-message ' + newClass);
            }
        }

    }), OverlayView = Backbone.View.extend({
        tagName    : "div",
        events     : {
            'click' : 'clickhandler',
            'keypress' : 'keypresshandler'
        },
        clickhandler : function () {
        },
        keypresshandler : function () {

        },
        initialize : function () {
            this.render();
        },
        render     : function () {
            this.$el.addClass('overlay').appendTo(document.body);
        },
        close      : function () {
            this.$el.remove();
        }
    }), DialogView = OverlayView.extend({
        dialogtemplate : _.template(''+
                             '<div class="dialog">' +
                             '</div>'
        ),
        initialize : function () {
            this.constructor.__super__.initialize.apply(this, [options]);
        },
        render     : function () {
            var overlay = $(this.template());
            $overlay.append(this.dialogtemplate());
            $('body').append($overlay);
        }
    }), ModalView  = Backbone.View.extend({
        initialize : function () {
            this.render();
        },
        render     : function () {
            this.$el = $(this.dialogtemplate()).appendTo(document.body);
            
        },
        dialogtemplate : _.template('' +
                            '<div class="overlay"></div>')
    }), LoginSignupView = ModalView.extend({
        initialize : function (options) {
            this.constructor.__super__.initialize.apply(this, [options]);
        },
        events : {
            'click .overlay'  : 'destroy'
        },
        render : function (options) {
            var that = this;
            this.constructor.__super__.render.apply(this, [options]);
            $.get('/login', function (html) {
                that.$el.append(html);
                $.get('/signup', function (html) {
                    that.$el.append(html);
                });
            });
            
        }, destroy : function (e) {
            e.preventDefault();
            console.log(1230);
            this.remove();
        }
    }), LoginButtonView = Backbone.View.extend({
        el : '.login-button',
        events : {
            'click' : 'openloginview',
        },
        openloginview : function () {
            new LoginSignupView();
        }
    }),
    App = {
            appView : new AppView(),
            navView : new ExpandingNavView(),
            loginButton : new LoginButtonView()
    };
    // quick and dirty
    window.App = App;

})(window.jQuery, converter.makeHtml);
