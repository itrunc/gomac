$(function(){

    //调查对象定义
    var Survey = AV.Object.extend('Survey', {

        defaults: {
            title: '来自Gomac的调查', //标题
            background: {
                color: '#FFFFFF', //背景色
                url: '' //背景图片url
            },
            color: '#333333', //文字颜色
            intro: '', //简介
            closing: '', //结束语
            conf: '' //接收调查者信息
        },
        initialize: function() {}
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

    var SurveyItemFormView = AV.View.extend({
        el: '#survey-item-modal .modal-body',
        template: _.template( $('#survey-item-form-tpl').html() ),
        events: {
            'click #btn-save-survey-item': 'saveSurveyItem'
        },
        initialize: function() {
            var self = this;
            self.$el.html( this.template(this.model.toJSON()) );
        },
        render: function() {},
        saveSurveyItem: function(e) {
            var self = this;
            var currentUser = AV.User.current();

            self.model.set('title', this.$el.find('#survey-item-title').val());
            self.model.set('intro', this.$el.find('#survey-item-intro').val());
            self.model.set('items', this.$el.find('#survey-item-items').val());
            self.model.set('survey', this.options.survey);
            self.model.set('user', currentUser);
            self.model.set('ACL', new AV.ACL(currentUser));

            self.model.save(null, {
                success: function(model) {
                    alert('保存成功');
                },
                error: function(model, error) {
                    alert('保存失败');
                    console.log(error);
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
            //_.bindAll(this, 'render', 'close', 'remove');
            _.bindAll(this, 'render', 'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);
        },
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },
        editSurvey: function(e) {
            var self = this;
            self.options.collectionView.currentSurvey = self.model;
            self.options.collectionView.surveyModal.modal('show');
        },
        removeSurvey: function(e) {
            if( confirm('您将删除《'+this.model.get('title')+'》？') ) {
                this.model.destroy();
            }
        },
        addSurveyItem: function(e) {
            var self = this;
            var surveyItemFormView = new SurveyItemFormView({
                model: AV.Object.new('SurveyItem'),
                survey: self.model
            });
            $('#survey-item-modal').modal('show');
        }
    });

    //调查集合视图定义
    var SurveyCollectionView = AV.View.extend({
        el: '#surveyapp',
        template: _.template($('#survey-collection-tpl').html()),
        events: {
            'click #btn-add-survey': 'createSurvey',
            'click #btn-save-survey': 'saveSurvey'
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

            self.surveyModal = $('#survey-modal');

            self.surveyModal.on('show.bs.modal', function(e) {
                if( self.currentSurvey ) {
                    $(this).find('.modal-title').text('编辑调查');
                    $(this).find('#survey-title').val(self.currentSurvey.get('title'));
                    $(this).find('#survey-intro').val(self.currentSurvey.get('intro'));
                    $(this).find('#survey-closing').val(self.currentSurvey.get('closing'));
                    $(this).find('#survey-text-color').val(self.currentSurvey.get('color'));
                    $(this).find('#survey-background-color').val(self.currentSurvey.get('background').color);
                    $(this).find('#survey-background-url').val(self.currentSurvey.get('background').url);
                    $(this).find('#survey-conf').val(self.currentSurvey.get('conf'));
                    $(this).find('#survey-closing').css('color', self.currentSurvey.get('color'));
                    $(this).find('#survey-closing').css('background-color', self.currentSurvey.get('background').color);
                    self.surveyBackgroundColor.value(self.currentSurvey.get('background').color);
                    self.surveyTextColor.value(self.currentSurvey.get('color'));
                }
                else {
                    $(this).find('.modal-title').text('新增调查');
                    $(this).find('#survey-title').val('');
                    $(this).find('#survey-intro').val('');
                    $(this).find('#survey-closing').val('');
                    $(this).find('#survey-text-color').val('#333333');
                    $(this).find('#survey-background-color').val('#ffffff');
                    $(this).find('#survey-background-url').val('');
                    $(this).find('#survey-conf').val('');
                    $(this).find('#survey-closing').css('color', '#333333');
                    $(this).find('#survey-closing').css('background-color', '#ffffff');
                    self.surveyBackgroundColor.value('#ffffff');
                    self.surveyTextColor.value('#333333');
                }
            });

            self.surveyBackgroundColor = self.surveyModal.find('#survey-backgroud-color-picker').kendoColorPicker({
                value: self.surveyModal.find('#survey-background-color').val(),
                buttons: false,
                change: function(e) {
                    self.surveyModal.find('#survey-background-color').val(e.value);
                    self.surveyModal.find('#survey-closing').css("background-color", e.value);
                }
            }).data('kendoColorPicker');

            self.surveyTextColor = self.surveyModal.find('#survey-text-color-picker').kendoColorPicker({
                value: self.surveyModal.find('#survey-text-color').val(),
                buttons: false,
                change: function(e) {
                    self.surveyModal.find('#survey-text-color').val(e.value);
                    self.surveyModal.find('#survey-closing').css("color", e.value);
                }
            }).data('kendoColorPicker');

            self.validator = this.surveyModal.find('form').kendoValidator().data("kendoValidator");

            self.notification = self.surveyModal.find('#survey-modal-msg').kendoNotification({
                appendTo: 'form',
                hide: function(e) {
                    self.surveyModal.find('#btn-save-survey').removeClass('disabled');
                    if( self.saveSuccess ) {
                        self.surveyModal.modal('hide');
                        self.saveSuccess = false;
                    }
                }
            }).data("kendoNotification");
        },

        render: function() {

        },

        addOne: function(survey) {
            var view = new SurveyView( {model: survey, collectionView: this} );
            this.$('#survey-list').append( view.render().el );
        },

        addAll: function(collection, filter) {
            this.$('#survey-list').html('');
            this.surveyCollection.each( this.addOne );
        },

        createSurvey: function (e) {
            if( !AV.User.current() ) {
                redirect('/login');
            }
            this.currentSurvey = null;
        },

        saveSurvey: function(e) {
            var self = this;

            $(e.target).addClass('disabled');


            if( !this.validator.validate() ) {
                this.notification.error('您未完全按照要求填写表单，请根据提示填写');
                return false;
            }

            var survey = {
                title: this.surveyModal.find('#survey-title').val(),
                background: {
                    color: this.surveyModal.find('#survey-background-color').val(),
                    url: this.surveyModal.find('#survey-background-url').val()
                },
                color: this.surveyModal.find('#survey-text-color').val(),
                intro: this.surveyModal.find('#survey-intro').val(),
                closing: this.surveyModal.find('#survey-closing').val(),
                conf: this.surveyModal.find('#survey-conf').val()
            }

            if( this.currentSurvey ) { //编辑
                this.currentSurvey.save( survey );
                this.saveSuccess = true;
            }
            else { //新增
                var currentUser = AV.User.current();
                survey.user = currentUser;
                survey.ACL = new AV.ACL( currentUser );
                this.surveyCollection.create( survey );
                this.saveSuccess = true;
            }

            if( this.saveSuccess ) {
                this.notification.success('您已成功保存调查，该弹窗将会关闭');
            }

        }

    });

    var AppView = AV.View.extend({
        el: $('body'),
        initialize: function() {
            this.render();
        },
        render: function() {
            new SurveyCollectionView();
        }
    });

    new AppView;

});
