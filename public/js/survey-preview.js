$(function(){

    var SurveyItem = AV.Object.extend('SurveyItem');

    var SurveiItemCollection = AV.Collection.extend({model: SurveyItem});

    var SurveyItemView = AV.View.extend({
        tagName: 'li',
        className: 'list-group-item',
        events: {
            'focus .txt-survey-other': 'focusOther',
            'change .txt-survey-other': 'changeOther'
        },
        initialize: function() {
            switch( this.model.get('type') ) {
                case 'sc':
                    this.model.set('items', this.parseOptions(this.model.get('items')));
                    this.template = _.template( $('#survey-item-sc-tpl').html() );
                    break;
                case 'mc':
                    this.model.set('items', this.parseOptions(this.model.get('items')));
                    this.template = _.template( $('#survey-item-mc-tpl').html() );
                    break;
                default:
                    this.template = _.template( $('#survey-item-qa-tpl').html() );
                    break;
            }
            this.model.set('required', this.model.get('required') ? 'required' : '');
        },
        render: function() {
            $(this.el).html( this.template({
                model: this.model.toJSON()
            }) );
            return this;
        },
        parseOptions: function( obj ) {
            if( _.isArray(obj) || _.isObject(obj) ) return obj;
            var arr = obj.split('\n');
            var optionKey = [];
            var optionVal = [];
            for( var i=0; i<arr.length; i++ ) {
                var item = arr[i].split(':');
                if( item.length > 1 ) {
                    optionKey.push( item[0] );
                    optionVal.push( item[1] );
                }
                else {
                    optionKey.push( i );
                    optionVal.push( item[0] );
                }
            }
            var options = _.object(optionKey, optionVal);
            return options;
        },
        focusOther: function(e) {
            var self = this;
            $(e.target).closest('label').children().first().prop('checked', true);
        },
        changeOther: function(e) {
            var self =this;
            $(e.target).closest('label').children().first().val( $(e.target).val() );
        }
    });

    var SurveyItemCollectionView = AV.View.extend({
        el: '#survey-item-list',
        template: _.template( $('#survey-item-collection-tpl').html() ),
        events: {},
        initialize: function() {
            this.$el.html( this.template );

            _.bindAll(this, 'addOne', 'addAll');

            this.surveyItemCollection = new SurveiItemCollection;
            this.surveyItemCollection.query = new AV.Query( SurveyItem );
            this.surveyItemCollection.query.equalTo('survey', this.model);
            this.surveyItemCollection.query.ascending('createdAt');
            this.surveyItemCollection.bind('add', this.addOne);
            this.surveyItemCollection.bind('reset', this.addAll);
            this.surveyItemCollection.bind('all', this.render);
            this.surveyItemCollection.fetch();
        },
        addOne: function(surveyItem) {
            var view = new SurveyItemView( {model: surveyItem} );
            this.$('#survey-item-list').append( view.render().el );
        },

        addAll: function(collection, filter) {
            this.$('#survey-item-list').html('');
            collection.each( this.addOne );
        }
    });

    //var Survey = AV.Object.extend('Survey');

    var SurveyView = AV.View.extend({
        el: '#survey-profile',
        template: _.template( $('#survey-welcome-tpl').html() ),
        events: {},
        initialize: function() {
            var self = this;

            this.model.set('conf', this.parseConf(this.model.get('conf')));

            this.$el.html( this.template({
                survey: this.model.toJSON()
            }) );

            $('body').css('background-color', this.model.get('background').color);
            $('form').css('color', this.model.get('color'));

            BootstrapDialog.show({
                title: '欢迎参与调研',
                message: this.model.get('intro'),
                type: BootstrapDialog.TYPE_DEFAULT,
                buttons: [{
                    label: '马上开始',
                    cssClass: 'btn-success',
                    action: function(dialog) { dialog.close(); }
                }],
                onshow: function(dialog) {
                    new SurveyItemCollectionView({model: self.model});
                }
            });
        },
        parseConf: function( obj ) {
            if( _.isArray(obj) || _.isObject(obj) ) return obj;
            var arr = obj.split('\n');
            var itemKey = [];
            var itemVal = [];
            for( var i=0; i<arr.length; i++ ) {
                var item = arr[i].split(':');
                if( item[0] && item[0].length > 0 ) {
                    if( item.length > 2 ) { //name:type:label
                        itemKey.push(item[0]);
                        itemVal.push({
                            type: item[1],
                            label: item[2]
                        });
                    }
                    else if( item.length > 1 ) { //name:label
                        itemKey.push(item[0]);
                        itemVal.push({
                            type: 'text',
                            label: item[1]
                        });
                    }
                    else { //name
                        itemKey.push(item[0]);
                        itemVal.push({
                            type: 'text',
                            label: item[0]
                        });
                    }
                }
            }
            var items = itemKey.length > 0 ? _.object(itemKey, itemVal) : undefined;
            return items;
        }
    });

    var AppView = AV.View.extend({
        el: $('body'),
        events: {
            'click .btn-submit-survey': 'submitSurvey'
        },
        initialize: function() {
            var self = this;
            var surveyID = $('#surveyID').val();
            if( !surveyID ) {
                this.error( '非法访问！' );
            }
            else {
                $('#instanceID').val( AV._getInstallationId() );
                var Survey = AV.Object.extend('Survey');
                var query = new AV.Query(Survey);
                query.get(surveyID, {
                    success: function(svy) {
                        self.survey = svy;
                        new SurveyView({model: self.survey});
                    },
                    error: function(object, error) {
                        //TODO:
                        console.log(object);
                        self.error( error );
                    }
                });
            }
        },
        error: function(msg) {
            var self = this;
            BootstrapDialog.alert({
                title: '警告',
                message: msg,
                type: BootstrapDialog.TYPE_DANGER
            });
        },
        submitSurvey: function(e) {
            var self = this;
            $(e.target).addClass('disabled');
            //TODO: 表单前端验证
            BootstrapDialog.show({
                title: '谢谢您的参与',
                message: this.survey.get('closing'),
                type: BootstrapDialog.TYPE_SUCCESS,
                buttons: [{
                    label: '完成',
                    cssClass: 'btn-success',
                    action: function(dialog) { dialog.close(); }
                }],
                onhidden: function(dialog) {
                    $('form').submit();
                }
            });

        }
    });
    new AppView;

/*
    var AppRouter = AV.Router.extend({
        routes: {
            '': 'welcome',
            "welcome": "welcome",
            "next": "next",
            "closing": "closing"
        },

        survey: null,

        initialize: function(options) {},

        error: function(message) {
            var self = this;
            BootstrapDialog.alert({
                title: '警告',
                message: message,
                type: BootstrapDialog.TYPE_DANGER
            });
        },

        welcome: function() {
            if( !surveyID ) {
                this.error('非法访问');
                return false;
            }

            if( !this.survey ) {
                var Survey = AV.Object.extend('Survey');
                var query = new AV.Query(Survey);
                query.get(surveyID, {
                    success: function(svy) {
                        self.survey = svy;
                        new SurveyView({model: self.survey});
                    },
                    error: function(object, error) {
                        //TODO:
                        console.log(object);
                    }
                });
            }
            else {
                new SurveyView({model: this.survey});
            }
        },

        next: function() {
            if( !surveyID ) {
                this.navigate('welcome', {trigger:true, replace:true});
                return false;
            }
            new SurveyItemCollectionView;

        },

        closing: function() {
            if( !this.survey ) {
                this.navigate('welcome', {trigger:true, replace:true});
            }
        }
    });

    new AppRouter;
    AV.history.start();
*/
});
