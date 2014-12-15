$(function(){

    //调查对象定义
    var Survey = AV.Object.extend('Survey', {
        defaults: {
            title: 'test', //标题
            background: {
                color: '#FFFFFF', //背景色
                url: '' //背景图片url
            },
            color: '#333333', //文字颜色
            intro: '', //简介
            closing: '', //结束语
            conf: '' //接收调查者信息
        },
        initialize: function() {
            _.bindAll(this, 'set', 'get');
        }
    });

    //调查问题对象定义
    var SurveyItem = AV.Object.extend('SurveyItem', {
        defaults: {
            title: 'test', //标题
            intro: '', //描述
            items: '1:选项一\n2:选项二' //选项
        },
        initialize: function() {
            _.bindAll(this, 'set', 'get');
        }
    });

    //调查集合定义
    var SurveyCollection = AV.Collection.extend({ model: Survey });

    //问题集合定义
    var SurveyItemCollection = AV.Collection.extend({ model: SurveyItem });

    //调查表单
    var SurveyFormView = AV.View.extend({
        el: '#survey-sub-modal',
        template: _.template( $('#survey-form-tpl').html() ),
        events: {
            'click #btn-save-survey': 'saveSurvey'
        },
        initialize: function() {
            var self = this;

            this.$el.find('.modal-body').html( this.template(this.model.toJSON()) );

            //初始化表单验证
            this.validator = this.$el.find('form').kendoValidator().data("kendoValidator");

            this.saveSuccess = false;

            this.$el.off('hidden.bs.modal');
            this.$el.on('hidden.bs.modal', function (e) {
                self.undelegateEvents();
            })

            //初始化提示信息
            this.notification = $('<span></span>').kendoNotification({
                appendTo: '.modal-msg',
                hide: function(e) {
                    self.$el.find('#btn-save-survey').removeClass('disabled');
                    if( self.saveSuccess ) {
                        self.$el.modal('hide');
                        self.saveSuccess = false;
                    }
                }
            }).data("kendoNotification");

            //背景拾色器
            this.$el.find('#survey-background-color').kendoColorPicker({
                value: this.model.get('background').color,
                buttons: false
            }).data('kendoColorPicker');

            //前景拾色器
            this.$el.find('#survey-text-color').kendoColorPicker({
                value: this.model.get('color'),
                buttons: false
            }).data('kendoColorPicker');

        },
        saveSurvey: function(e) {
            var self = this;
            var currentUser = AV.User.current();

            $(e.target).addClass('disabled');

            if( !self.validator.validate() ) {
                self.notification.error('您未完全按照要求填写表单，请根据提示填写');
                return false;
            }

            self.model.set('title', this.$el.find('#survey-title').val());
            self.model.set('intro', this.$el.find('#survey-intro').val());
            self.model.set('closing', this.$el.find('#survey-closing').val());
            self.model.set('conf', this.$el.find('#survey-conf').val());
            self.model.set('color', this.$el.find('#survey-text-color').val());
            self.model.set('background', {
                color: this.$el.find('#survey-background-color').val(),
                url: this.$el.find('#survey-background-url').val()
            });

            if( self.options.isCreate ) { //创建时
                self.model.set('user', currentUser);
                self.model.set('ACL', new AV.ACL(currentUser));
            }
            self.model.save(null, {
                success: function(model) {
                    if( self.options.isCreate ) { //创建时
                        self.options.surveyCollection.add(model);
                    }
                    else {//编辑时
                        self.options.surveyView.render();
                    }
                    self.notification.success('您已经成功地保存该调查，本弹窗即将关闭');
                    self.saveSuccess = true;

                },
                error: function(model, error) {
                    self.notification.error('保存失败：'+error.message);
                }
            });

        }
    });

    //问题表单
    var SurveyItemFormView = AV.View.extend({
        el: '#survey-sub-modal',
        template: _.template( $('#survey-item-form-tpl').html() ),
        events: {
            'click #btn-save-survey-item': 'saveSurveyItem'
        },
        initialize: function() {
            var self = this;
            self.$el.find('.modal-body').html( this.template(this.model.toJSON()) );

            //初始化表单验证
            this.validator = this.$el.find('form').kendoValidator().data("kendoValidator");

            this.saveSuccess = false;

            this.$el.off('hidden.bs.modal');
            this.$el.on('hidden.bs.modal', function (e) {
                self.undelegateEvents();
            })

            //初始化提示信息
            this.notification = $('<span></span>').kendoNotification({
                appendTo: '.modal-msg',
                hide: function(e) {
                    self.$el.find('#btn-save-survey-item').removeClass('disabled');
                    if( self.saveSuccess ) {
                        self.$el.modal('hide');
                        self.saveSuccess = false;
                    }
                }
            }).data("kendoNotification");
        },
        saveSurveyItem: function(e) {
            var self = this;
            var currentUser = AV.User.current();

            $(e.target).addClass('disabled');

            self.model.set('title', this.$el.find('#survey-item-title').val());
            self.model.set('intro', this.$el.find('#survey-item-intro').val());
            self.model.set('items', this.$el.find('#survey-item-items').val());

            if( self.options.isCreate ) {
                self.model.set('survey', self.options.surveyView.model);
                self.model.set('user', currentUser);
                self.model.set('ACL', new AV.ACL(currentUser));
            }

            self.model.save(null, {
                success: function(model) {
                    self.options.surveyView.itemCount++;
                    self.options.surveyView.render();
                    self.notification.success('您已经成功保存，本弹窗即将关闭');
                    self.saveSuccess = true;
                },
                error: function(model, error) {
                    self.notification.error('保存失败：'+error.message);
                }
            });
        }
    });


    //调查视图定义
    var SurveyView = AV.View.extend({
        tagName: 'div',
        className: 'col-sm-8',
        template: _.template( $('#survey-tpl').html() ),
        events: {
            'click .btn-edit-survey': 'editSurvey',
            'click .btn-remove-survey': 'removeSurvey',
            'click .btn-add-survey-item': 'addSurveyItem'
        },
        initialize: function() {
            var self = this;
            _.bindAll(this, 'render', 'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);

            var surveyItem = AV.Object.extend('SurveyItem');
            var query = new AV.Query( surveyItem );
            query.equalTo('survey', this.model);
            query.equalTo('user', AV.User.current());
            query.count({
                success: function(count) {
                    self.itemCount = count;
                    self.$el.find('.survey-item-count').text(count);
                },
                error: function(error) {
                    console.log(error);
                }
            });
        },
        render: function() {
            $(this.el).html( this.template({
                model: this.model.toJSON(),
                count: this.itemCount
            }) );
            return this;
        },
        editSurvey: function(e) { //编辑调查
            var self = this;
            if( AV.User.current() ) {
                var surveyFormView = new SurveyFormView({
                    model: this.model,
                    surveyView: self,
                    isCreate: false
                });
                $('#survey-sub-modal').modal('show');
            }
            else {
                redirect('/login');
            }
        },
        removeSurvey: function(e) { //删除调查
            if( confirm('您将删除《'+this.model.get('title')+'》？') ) {
                //TODO: 级联删除问题
                this.model.destroy();
            }
        },
        addSurveyItem: function(e) { //添加调查问题
            var self = this;
            var surveyItemFormView = new SurveyItemFormView({
                model: AV.Object.new('SurveyItem'),
                surveyView: self,
                isCreate: true
            });
            $('#survey-sub-modal').modal('show');
        }
    });

    //调查集合视图定义
    var SurveyCollectionView = AV.View.extend({
        el: '#surveyapp',
        template: _.template($('#survey-collection-tpl').html()),
        events: {
            'click #btn-add-survey': 'createSurvey'
        },
        initialize: function() {
            var self = this;
            if( !AV.User.current() ) redirect('/login');
            self.$el.html( this.template );

            _.bindAll(self, 'addOne', 'addAll');

            self.currentSurvey = null;
            self.saveSuccess = false;

            self.surveyCollection = new SurveyCollection;
            self.surveyCollection.query = new AV.Query( Survey );
            self.surveyCollection.query.equalTo('user', AV.User.current());
            self.surveyCollection.bind('add', this.addOne);
            self.surveyCollection.bind('reset', this.addAll);
            self.surveyCollection.bind('all', this.render);
            self.surveyCollection.fetch();

        },

        addOne: function(survey) {
            var view = new SurveyView( {model: survey, collectionView: this} );
            this.$('#survey-list').prepend( view.render().el );
        },

        addAll: function(collection, filter) {
            this.$('#survey-list').html('');
            this.surveyCollection.each( this.addOne );
        },

        createSurvey: function (e) {
            var self = this;
            if( AV.User.current() ) {
                var surveyFormView = new SurveyFormView({
                    model: AV.Object.new('Survey'),
                    surveyCollection: self.surveyCollection,
                    isCreate: true
                });
                $('#survey-sub-modal').modal('show');
            }
            else {
                redirect('/login');
            }
        }
    });

    var AppView = AV.View.extend({
        el: $('body'),
        initialize: function() {
            new SurveyCollectionView();
        }
    });

    new AppView;

});