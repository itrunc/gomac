$(function(){

    //调查对象定义
    var Survey = AV.Object.extend('Survey', {
        defaults: {
            title: '', //标题
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
            title: '', //标题
            items: '', //选项
            other: false, //是否包含“其他”选项
            required: true, //是否必填
            type: 'sc' //sc-single choice, mc-multi choice, qa-question answer
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
        //el: '#survey-sub-modal',
        template: _.template( $('#survey-form-tpl').html() ),
        events: {
            //'click #btn-save-survey': 'saveSurvey'
        },
        initialize: function() {
            var self = this;

            BootstrapDialog.show({
                title: self.options.isCreate ? '添加调查' : '编辑调查',
                message: self.template( self.model.toJSON() ),
                type: BootstrapDialog.TYPE_DEFAULT,
                nl2br: false,
                buttons: [{
                    label: '取消',
                    cssClass: 'btn-default',
                    icon: 'glyphicon glyphicon-ban-circle',
                    action: function(dialog) {
                        dialog.close();
                    }
                }, {
                    label: '保存',
                    cssClass: 'btn-success',
                    icon: 'glyphicon glyphicon-saved',
                    action: function(dialog) {
                        self.saveSurvey(dialog);
                    }
                }],
                onshow: function(dialog) {
                    self.validator = dialog.getModalBody().find('form').kendoValidator().data("kendoValidator");

                    //背景拾色器
                    dialog.getModalBody().find('#survey-background-color').kendoColorPicker({
                        value: self.model.get('background').color,
                        buttons: false
                    }).data('kendoColorPicker');

                    //前景拾色器
                    dialog.getModalBody().find('#survey-text-color').kendoColorPicker({
                        value: self.model.get('color'),
                        buttons: false
                    }).data('kendoColorPicker');
                }
            });

        },
        saveSurvey: function(dialog) {
            var self = this;
            var thatDialog = dialog;
            var currentUser = AV.User.current();

            if( !self.validator.validate() ) {
                BootstrapDialog.alert({
                    title: '危险动作！',
                    message: '<div class="alert alert-danger">您未完全按照要求填写表单，请根据提示填写</div>',
                    type: BootstrapDialog.TYPE_DEFAULT
                });
                return false;
            }

            self.model.set('title', dialog.getModalBody().find('#survey-title').val());
            self.model.set('intro', dialog.getModalBody().find('#survey-intro').val());
            self.model.set('closing', dialog.getModalBody().find('#survey-closing').val());
            self.model.set('conf', dialog.getModalBody().find('#survey-conf').val());
            self.model.set('color', dialog.getModalBody().find('#survey-text-color').val());
            self.model.set('background', {
                color: dialog.getModalBody().find('#survey-background-color').val(),
                url: dialog.getModalBody().find('#survey-background-url').val()
            });

            if( self.options.isCreate ) { //创建时
                self.model.set('user', currentUser);
                var acl = new AV.ACL(currentUser);
                acl.setPublicReadAccess(true);
                self.model.set('ACL', acl);
            }

            self.model.save(null, {
                success: function(model) {
                    BootstrapDialog.show({
                        title: '保存成功',
                        message: '您已经成功地保存该调查',
                        type: BootstrapDialog.TYPE_SUCCESS,
                        closable: false,
                        buttons: [{
                            label: '关闭',
                            cssClass: 'btn-success',
                            action: function( dialog ) {
                                dialog.close();
                            }
                        }],
                        onhidden: function(e) {
                            thatDialog.close();
                            if( self.options.isCreate ) { //创建时
                                self.options.surveyCollection.add(model);
                            }
                            else {//编辑时
                                self.options.surveyView.render();
                            }
                        }
                    });

                },
                error: function(model, error) {
                    BootstrapDialog.danger( '保存失败：'+error.message );
                }
            });

        }
    });

    //题目定义表单
    var SurveyItemFormView = AV.View.extend({
        //template: _.template(),
        events: {},
        initialize: function() {
            var self = this;

            switch( this.options.itemType ) {
                case 'sc':
                    this.template = _.template( $('#survey-item-form-choice-tpl').html() );
                    this.type = '单选题';
                    break;
                case 'mc':
                    this.template = _.template( $('#survey-item-form-choice-tpl').html() );
                    this.type = '多选题';
                    break;
                default:
                    this.template = _.template( $('#survey-item-form-qa-tpl').html() );
                    this.type = '简答题';
                    break;
            }

            BootstrapDialog.show({
                title: (self.options.isCreate ? '添加' : '编辑') + self.type,
                message: self.template( self.model.toJSON() ),
                type: BootstrapDialog.TYPE_DEFAULT,
                nl2br: false,
                buttons: [{
                    label: '取消',
                    cssClass: 'btn-default',
                    icon: 'glyphicon glyphicon-ban-circle',
                    action: function(dialog) {
                        dialog.close();
                    }
                }, {
                    label: '保存',
                    cssClass: 'btn-success',
                    icon: 'glyphicon glyphicon-saved',
                    action: function(dialog) {
                        self.saveSurveyItem(dialog);
                    }
                }],
                onshown: function(dialog) {
                    self.validator = dialog.getModalBody().find('form').kendoValidator().data("kendoValidator");
                }
            });
        },
        saveSurveyItem: function(dialog) {
            var self = this;
            var thatDialog = dialog;
            var currentUser = AV.User.current();

            if( !this.validator.validate() ) {
                BootstrapDialog.alert({
                    title: '危险动作！',
                    message: '<div class="alert alert-danger">您未完全按照要求填写表单，请根据提示填写</div>',
                    type: BootstrapDialog.TYPE_DEFAULT
                });
                return false;
            }

            this.model.set('title', dialog.getModalBody().find('#survey-item-title').val());
            this.model.set('required', dialog.getModalBody().find('#survey-item-required').prop('checked'));

            if( this.options.itemType != 'qa' ) {
                var itemItems = dialog.getModalBody().find('#survey-item-items').val();
                if( itemItems.split('\n').length < 2 ) {
                    BootstrapDialog.danger( '保存失败：请至少包含两个选项' );
                    dialog.getModalBody().find('#survey-item-items').focus();
                    return false;
                }
                this.model.set('items', itemItems);
                this.model.set('other', dialog.getModalBody().find('#survey-item-other').prop('checked'));
            }

            if( this.options.isCreate ) {
                this.model.set('type', this.options.itemType);
                this.model.set('survey', this.options.surveyView.model);
                this.model.set('user', currentUser);
                var acl = new AV.ACL(currentUser);
                acl.setPublicReadAccess(true);
                this.model.set('ACL', acl);
            }

            this.model.save(null, {
                success: function(model) {
                    BootstrapDialog.show({
                        title: '保存成功',
                        message: '您已经成功地保存',
                        type: BootstrapDialog.TYPE_SUCCESS,
                        closable: false,
                        buttons: [{
                            label: '关闭',
                            cssClass: 'btn-success',
                            action: function( dialog ) {
                                dialog.close();
                            }
                        }],
                        onhidden: function(e) {
                            thatDialog.close();
                            if( self.options.isCreate ) {
                                self.options.surveyView.itemCount++;
                                self.options.surveyView.render();
                            }
                        }
                    });
                },
                error: function(model, error) {
                    BootstrapDialog.danger( '保存失败：'+error.message );
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
            'click .btn-add-survey-item': 'addSurveyItem',
            'click .btn-view-survey-item': 'viewSurveyItem'
        },
        initialize: function() {
            var self = this;
            _.bindAll(this, 'render', 'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);

            this.itemCount = 0;
            /*
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
            */
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
                    model: self.model,
                    surveyView: self,
                    isCreate: false
                });
                console.log( surveyFormView.model );
            }
            else {
                redirect('/login');
            }
        },
        removeSurvey: function(e) { //删除调查
            var self = this;

            BootstrapDialog.show({
                title: '删除确认',
                message: '<div class="alert alert-danger"><i class="glyphicon glyphicon-warning-sign"></i> 您确定要删除调查《'+this.model.get('title')+'》吗？</div>',
                type: BootstrapDialog.TYPE_DEFAULT,
                buttons: [{
                    label: '取消',
                    cssClass: 'btn-success',
                    icon: 'glyphicon glyphicon-ban-circle',
                    action: function(dialog) {
                        dialog.close();
                    }
                }, {
                    label: '删除',
                    cssClass: 'btn-danger',
                    icon: 'glyphicon glyphicon-saved',
                    action: function(dialog) {
                        self.model.destroy({
                            success: function(model, res) {
                                var query = new AV.Query( SurveyItem );
                                query.equalTo('survey', model);
                                query.destroyAll({
                                    success: function() {},
                                    error: function(err) {}
                                });
                            }
                        });
                        dialog.close();
                    }
                }]
            });
        },
        addSurveyItem: function(e) { //添加调查问题
            var self = this;
            var surveyItemFormView = new SurveyItemFormView({
                model: AV.Object.new('SurveyItem'),
                itemType: $(e.target).data('type'),
                surveyView: self,
                isCreate: true
            });
            return false;
        },
        viewSurveyItem: function(e) {
            var self = this;
            var surveyItemCollectionView = new SurveyItemCollectionView({
                surveyView: self
            });
        }
    });

    //题目视图
    var SurveyItemView = AV.View.extend({
        tagName: 'li',
        className: 'list-group-item',
        template: _.template( $('#survey-item-tpl').html() ),
        events: {
            'click .survey-item-remove': 'removeSurveyItem',
            'click .survey-item-edit': 'editSurveyItem'
        },
        initialize: function() {
            _.bindAll(this, 'render', 'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);
        },
        render: function() {
            $(this.el).html( this.template( this.model.toJSON() ) );
            return this;
        },
        removeSurveyItem: function(e) {
            var self = this;
            BootstrapDialog.show({
                title: '删除确认',
                message: '<div class="alert alert-danger"><i class="glyphicon glyphicon-warning-sign"></i> 您确定要删除题目《'+this.model.get('title')+'》吗？</div>',
                type: BootstrapDialog.TYPE_DEFAULT,
                buttons: [{
                    label: '取消',
                    cssClass: 'btn-success',
                    icon: 'glyphicon glyphicon-ban-circle',
                    action: function(dialog) {
                        dialog.close();
                    }
                }, {
                    label: '删除',
                    cssClass: 'btn-danger',
                    icon: 'glyphicon glyphicon-saved',
                    action: function(dialog) {
                        self.model.destroy();
                        dialog.close();
                    }
                }]
            });
        },
        editSurveyItem: function(e) {
            var self = this;
            var surveyItemFormView = new SurveyItemFormView({
                model: self.model,
                itemType: self.model.get('type'),
                surveyView: null,
                isCreate: false
            });
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
            }
            else {
                redirect('/login');
            }
        }
    });

    //题目集合视图
    var SurveyItemCollectionView = AV.View.extend({
        template: _.template( $('#survey-item-collection-tpl').html() ),
        events: {},
        initialize: function() {
            var self = this;

            _.bindAll(self, 'addOne', 'addAll');

            this.dialog = new BootstrapDialog({
                title: self.options.surveyView.model.get('title'),
                message: self.template(),
                type: BootstrapDialog.TYPE_DEFAULT,
                nl2br: false,
                //size: BootstrapDialog.SIZE_WIDE,
                buttons: [{
                    label: '关闭',
                    cssClass: 'btn-default',
                    icon: 'glyphicon glyphicon-ban-circle',
                    action: function(dialog) { dialog.close(); }
                }],
                onshown: function(dialog) {
                    var listGroup = dialog.getModalBody().find('.list-group');
                    listGroup.css('background-color',self.options.surveyView.model.get('background').color);
                    listGroup.css('color',self.options.surveyView.model.get('color'));
                    self.surveyItemCollection = new SurveyItemCollection;
                    self.surveyItemCollection.query = new AV.Query( SurveyItem );
                    self.surveyItemCollection.query.equalTo('user', AV.User.current());
                    self.surveyItemCollection.query.equalTo('survey', self.options.surveyView.model);
                    self.surveyItemCollection.bind('add', self.addOne);
                    self.surveyItemCollection.bind('reset', self.addAll);
                    self.surveyItemCollection.bind('all', self.render);
                    self.surveyItemCollection.fetch();
                }
            });

            this.dialog.open();
        },
        addOne: function(surveyItem) {
            var view = new SurveyItemView({
                model: surveyItem,
                collectionView: this
            });
            this.dialog.getModalBody().find('.list-group').append( view.render().el );
        },

        addAll: function(collection, filter) {
            if( collection.length > 0 ) {
                this.dialog.getModalBody().find('.list-group').html('');
                this.surveyItemCollection.each( this.addOne );
            }
            else {
                this.dialog.close();
                BootstrapDialog.alert({
                    title: '警告',
                    message: '<div class="alert alert-warning">您还没为该调查创建题目，请先创建再查看</div>',
                    type: BootstrapDialog.TYPE_DEFAULT
                });
            }
        }
    });

    var AppView = AV.View.extend({
        el: $('body'),
        initialize: function() { new SurveyCollectionView(); }
    });
    new AppView;

});
