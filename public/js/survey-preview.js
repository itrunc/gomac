$(function(){

    var survey = null;


    var AppRouter = AV.Router.extend({
        routes: {
            "welcome": "welcome",
            "step": "step",
            "closing": "closing"
        },

        initialize: function(options) {},

        welcome: function() {
            alert('welcome');
        },

        step: function() {
            if( !survey ) {
                this.navigate('welcome', {trigger:true, replace:true});
            }
        },

        closing: function() {
            if( !survey ) {
                this.navigate('welcome', {trigger:true, replace:true});
            }
        }
    });

    new AppRouter;
    AV.history.start();
});
