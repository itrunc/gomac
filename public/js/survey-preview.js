$(function(){

    var Survey = AV.Object.extend('Survey');

    var SurveyView = AV.View.extend({
        el: '#survey',
        template: _.template( $('#survey-welcome-tpl').html() ),
        events: {},
        initialize: function() {
            this.$el.html( this.template({
                survey: this.model.toJSON()
            }) );

            $('body').css('background-color', this.model.get('background').color);
            this.$el.css('color', this.model.get('color'));
            this.$el.find('pre').css('color', this.model.get('color'));
        }
    });

    var SurveyItem = AV.Object.extend('SurveyItem');

    var SurveiItemCollection = AV.Collection.extend({model: SurveyItem});

    var SurveyItemView = AV.View.extend({
        tagName: 'li',
        className: 'list-group-item',
        events: {},
        initialize: function() {
            switch( this.model.get('type') ) {
                case 'sc':
                    this.template = _.template( $('#survey-item-sc-tpl').html() );
                    break;
                case 'mc':
                    this.template = _.template( $('#survey-item-mc-tpl').html() );
                    break;
                default:
                    this.template = _.template( $('#survey-item-qa-tpl').html() );
                    break;
            }
        },
        render: function() {
            $(this.el).html( this.template({
                model: this.model.toJSON()
            }) );
            return this;
        }
    });

    var SurveyItemCollectionView = AV.View.extend({
        el: '#survey',
        template: _.template( $('#survey-item-collection-tpl').html() ),
        events: {},
        initialize: function() {
            this.$el.html( this.template );

            _.bindAll(this, 'addOne', 'addAll');

            var survey = new Survey;
            survey.id = surveyID;
            this.surveyItemCollection = new SurveiItemCollection;
            this.surveyItemCollection.query = new AV.Query( SurveyItem );
            this.surveyItemCollection.query.equalTo('survey', survey);
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
});
