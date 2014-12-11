$(function(){
    var currentUser = AV.User.current();
    var currentSurvey = null;
    var surveyModal = $('#surveyModal');
    var validator;
    var surveyBackgroudColor = '#FFFFFF';
    var surveyTextColor = '#333333';

    //调查对象定义
    var Survey = AV.Object.extend('Survey', {

        defaults: {
            title: '来自Gomac的调查', //标题
            backgroud: {
                color: '#FFFFFF', //背景色
                url: '' //背景图片url
            },
            color: '#333333', //文字颜色
            intro: '', //简介
            closing: '', //结束语
            conf: [] //接收调查者信息
        },

        initialize: function() {

        }
    });

    //调查集合定义
    var SurveyCollection = AV.Collection.extend({

        model: Survey

    });

    //调查视图定义
    var SurveyView = AV.View.extend({
        tagName: 'tr',
        template: _.template( $('#survey-tpl').html() ),
        events: {

        },
        initialize: function() {
            _.bindAll(this, 'render', 'close', 'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);
        },
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        }
    });

    //调查集合视图定义
    var SurveyCollectionView = AV.View.extend({
        el: '#survey-collection-view',
        //template: _.template($('#survey-collection-tpl').html()),
        events: {
            'click #btn-add-survey': 'createSurvey',
            'click #btn-save-survey': 'saveSurvey'
        },
        initialize: function() {
            var self = this;
            //this.$el.html( this.template );

            /*
            this.surveyCollection = new SurveyCollection;
            this.surveyCollection.query = new AV.Query( Survey );
            this.surveyCollection.query.equalTo('user', currentUser);
            this.surveyCollection.bind('add', this.addOne);
            this.surveyCollection.bind('reset', this.addAll);
            this.surveyCollection.bind('all', this.render);
            this.surveyCollection.fetch();
            */
        },

        render: function() {

        },

        addOne: function(survey) {
            var view = new SurveyView( {model: survey} );
            this.$('#survey-list').append( view.render().el );
        },

        addAll: function(collection, filter) {
            this.$('#survey-list').html('');
            this.surveyCollection.each( this.addOne );
        },

        createSurvey: function (e) {
            currentSurvey = null;
        },

        saveSurvey: function(e) {
            //表单验证

            if( !validator.validate() ) {
                return false;
            }


            if( currentSurvey ) { //编辑

            }
            else { //新增

            }

        }

    });

    var AppView = AV.View.extend({
        el: $('#surveyapp'),
        initialize: function() {
            this.render();

            surveyModal.on('show.bs.modal', function(e) {
                if( currentSurvey ) {
                    $(this).find('.modal-title').text('编辑调查');
                }
                else {
                    $(this).find('.modal-title').text('新增调查');
                }
            });

            var backgroudColorPicker = $('#survey-backgroud-color-picker').kendoColorPicker({
                value: surveyBackgroudColor,
                buttons: false,
                change: function(e) {
                    surveyBackgroudColor = e.value;
                    $('#survey-closing').css("background-color", e.value);
                }
            }).data('kendoColorPicker');

            var textColorPicker = $('#survey-text-color-picker').kendoColorPicker({
                value: surveyTextColor,
                buttons: false,
                change: function(e) {
                    surveyTextColor = e.value;
                    $('#survey-closing').css("color", e.value);
                }
            }).data('kendoColorPicker');

            validator = surveyModal.find('form').kendoValidator().data("kendoValidator");

        },
        render: function() {
            new SurveyCollectionView();
        }
    });

    new AppView;

});
